import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { loadImage } from "@napi-rs/canvas"
import { prisma } from "@/lib/db"
import { rid } from "../helpers"
import { createMobileSession } from "@/lib/mobile/session"
import { renderMemberBadgePngBuffer } from "@/lib/member-badge-server"
import { loadCardSource } from "@/lib/mobile/card"
import { GET as getCard } from "@/app/api/mobile/v1/me/card/route"

const BASE = "http://localhost/api/mobile/v1/me/card"

async function member(over: Record<string, unknown> = {}) {
  const a = await prisma.adherent.create({
    data: {
      id: rid("AK-CARD").toUpperCase(),
      celluleLocale: "Touba", zoneRegion: "Diourbel", nom: "Diop", prenoms: "Awa",
      dateNaissance: "1990-01-01", cni: rid("CNI"), nationalite: "Sénégalaise", adresse: "Touba",
      tel: `+22177${Math.floor(1000000 + Math.random() * 8999999)}`,
      profession: "Testeur", montant: "1400", canal: "en_ligne", status: "actif", memberNumber: null,
      ...over,
    },
  })
  const t = await createMobileSession(a, { platform: "android" })
  return { adherent: a, token: t.accessToken }
}

const req = (qs = "", token?: string, headers: Record<string, string> = {}) =>
  new Request(`${BASE}${qs}`, { headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } })

beforeEach(async () => {
  await prisma.rateLimitBucket.deleteMany()
})
afterAll(async () => {
  await prisma.mobileSession.deleteMany({ where: { adherentId: { startsWith: "AK-CARD" } } })
  await prisma.adherent.deleteMany({ where: { id: { startsWith: "AK-CARD" } } })
})

describe("GET /me/card", () => {
  it("refuse sans session", async () => {
    expect((await getCard(req())).status).toBe(401)
  })

  it("affichage par défaut : WebP 680×1020, léger, jamais en cache partagé", async () => {
    const { token } = await member()
    const res = await getCard(req("", token))
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/webp")
    expect(res.headers.get("cache-control")).toBe("private, no-cache")
    expect(res.headers.get("etag")).toMatch(/^"card-[0-9a-f]{32}"$/)
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.subarray(0, 4).toString()).toBe("RIFF")
    expect(buf.subarray(8, 12).toString()).toBe("WEBP")
    const img = await loadImage(buf)
    expect([img.width, img.height]).toEqual([680, 1020])
    expect(buf.length).toBeLessThan(300 * 1024)
  })

  it("size=full : le PNG d'origine 1024×1536", async () => {
    const { token } = await member()
    const res = await getCard(req("?size=full", token))
    expect(res.headers.get("content-type")).toBe("image/png")
    const buf = Buffer.from(await res.arrayBuffer())
    expect([...buf.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const img = await loadImage(buf)
    expect([img.width, img.height]).toEqual([1024, 1536])
  })

  it("la carte servie est OCTET POUR OCTET celle de l'envoi WhatsApp : jamais recomposée", async () => {
    const { token, adherent } = await member()
    const res = await getCard(req("?size=full", token))
    const served = Buffer.from(await res.arrayBuffer())
    const source = await loadCardSource(adherent.id)
    const whatsapp = await renderMemberBadgePngBuffer(source!.data)
    expect(served.equals(whatsapp)).toBe(true)
  })

  it("taille inconnue : 400", async () => {
    const { token } = await member()
    expect((await getCard(req("?size=petit", token))).status).toBe(400)
    expect((await getCard(req("?size=", token))).status).toBe(400)
  })

  describe("validation par ETag", () => {
    it("même contenu = même ETag ; If-None-Match → 304 sans corps", async () => {
      const { token } = await member()
      const first = await getCard(req("", token))
      const etag = first.headers.get("etag")!
      const second = await getCard(req("", token))
      expect(second.headers.get("etag")).toBe(etag)

      const cached = await getCard(req("", token, { "if-none-match": etag }))
      expect(cached.status).toBe(304)
      expect((await cached.arrayBuffer()).byteLength).toBe(0)
      expect(cached.headers.get("etag")).toBe(etag)
    })

    it("un changement de nom, de cellule ou de numéro change l'ETag", async () => {
      const { token, adherent } = await member()
      const before = (await getCard(req("", token))).headers.get("etag")
      await prisma.adherent.update({ where: { id: adherent.id }, data: { prenoms: "Fatou" } })
      const afterName = (await getCard(req("", token))).headers.get("etag")
      expect(afterName).not.toBe(before)
      await prisma.adherent.update({ where: { id: adherent.id }, data: { memberNumber: 4242 } })
      const afterNumber = (await getCard(req("", token))).headers.get("etag")
      expect(afterNumber).not.toBe(afterName)
    })

    it("l'ETag de l'ancienne version ne donne plus de 304 après modification", async () => {
      const { token, adherent } = await member()
      const old = (await getCard(req("", token))).headers.get("etag")!
      await prisma.adherent.update({ where: { id: adherent.id }, data: { celluleLocale: "Dakar" } })
      const res = await getCard(req("", token, { "if-none-match": old }))
      expect(res.status).toBe(200)
    })

    it("les deux tailles ont des ETag différents", async () => {
      const { token } = await member()
      const a = (await getCard(req("", token))).headers.get("etag")
      const b = (await getCard(req("?size=full", token))).headers.get("etag")
      expect(a).not.toBe(b)
    })

    it("une photo de profil change l'ETag", async () => {
      const { token, adherent } = await member()
      const before = (await getCard(req("", token))).headers.get("etag")
      await prisma.adherent.update({ where: { id: adherent.id }, data: { photoUrl: "/brand/logo.png" } })
      expect((await getCard(req("", token))).headers.get("etag")).not.toBe(before)
    })
  })

  describe("confidentialité", () => {
    it("c'est toujours la carte du membre connecté : un paramètre ne permet pas d'en viser un autre", async () => {
      const a = await member()
      const b = await member({ prenoms: "Moussa", nom: "Fall" })
      const ownA = (await getCard(req("", a.token))).headers.get("etag")
      const ownB = (await getCard(req("", b.token))).headers.get("etag")
      expect(ownA).not.toBe(ownB)
      const sneaky = await getCard(req(`?id=${b.adherent.id}&adherentId=${b.adherent.id}`, a.token))
      expect(sneaky.headers.get("etag")).toBe(ownA)
    })

    it("une carte n'est servie qu'à un membre actif (409 sinon)", async () => {
      for (const status of ["archive", "en_attente"]) {
        const { token } = await member({ status })
        const res = await getCard(req("", token))
        expect(res.status).toBe(409)
        expect((await res.json()).error.code).toBe("card_unavailable")
      }
    })

    it("une session révoquée n'obtient plus la carte", async () => {
      const { token, adherent } = await member()
      await prisma.adherent.update({ where: { id: adherent.id }, data: { sessionVersion: { increment: 1 } } })
      expect((await getCard(req("", token))).status).toBe(401)
    })
  })

  describe("charge", () => {
    it("30 rendus par 15 min et par membre ; les 304 ne comptent pas", async () => {
      const { token } = await member()
      const etag = (await getCard(req("", token))).headers.get("etag")! // 1 rendu
      for (let i = 0; i < 40; i++) {
        expect((await getCard(req("", token, { "if-none-match": etag }))).status).toBe(304)
      }
      for (let i = 0; i < 29; i++) expect((await getCard(req("", token))).status).toBe(200)
      expect((await getCard(req("", token))).status).toBe(429)
    }, 120000)
  })
})
