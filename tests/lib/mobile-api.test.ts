import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/db"
import { hashMemberPin } from "@/lib/member-pin"
import { memberIdSuffix } from "@/lib/member-access"
import { createMemberSessionToken } from "@/lib/member-auth"
import { rid } from "../helpers"

import { GET as getConfig } from "@/app/api/mobile/v1/config/route"
import { POST as login } from "@/app/api/mobile/v1/auth/login/route"
import { POST as pinSetup } from "@/app/api/mobile/v1/auth/pin-setup/route"
import { POST as refresh } from "@/app/api/mobile/v1/auth/refresh/route"
import { POST as logout } from "@/app/api/mobile/v1/auth/logout/route"
import { GET as getMe, PATCH as patchMe } from "@/app/api/mobile/v1/me/route"
import { POST as registerDevice, DELETE as removeDevice } from "@/app/api/mobile/v1/devices/route"

const BASE = "http://localhost/api/mobile/v1"

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
}
const bearer = (t: string) => ({ authorization: `Bearer ${t}` })

function randomTel() {
  return `+22177${Math.floor(1000000 + Math.random() * 8999999)}`
}

async function makeMember(opts: { pin?: string; tel?: string } = {}) {
  const tel = opts.tel ?? randomTel()
  const adherent = await prisma.adherent.create({
    data: {
      id: rid("AK-MOB").toUpperCase(),
      celluleLocale: "À préciser",
      zoneRegion: "Dakar",
      nom: "Mobile",
      prenoms: "Test",
      dateNaissance: "1990-01-01",
      cni: rid("CNI"),
      nationalite: "Sénégalaise",
      adresse: "Dakar",
      tel,
      profession: "Testeur",
      montant: "1000",
      canal: "en_ligne",
      status: "actif",
      pinHash: opts.pin ? await hashMemberPin(opts.pin) : null,
    },
  })
  return { adherent, tel }
}

const device = { name: "Pixel test", platform: "android", appVersion: "1.0.0" }

beforeEach(async () => {
  await prisma.mobileConfig.deleteMany()
})
afterAll(async () => {
  await prisma.mobileSession.deleteMany({ where: { adherentId: { startsWith: "AK-MOB" } } })
  await prisma.deviceToken.deleteMany({ where: { token: { startsWith: "tok-test-" } } })
  await prisma.adherent.deleteMany({ where: { id: { startsWith: "AK-MOB" } } })
})

describe("config distante", () => {
  it("repli sûr (version 0) quand aucune config n'est active", async () => {
    const res = await getConfig(new Request(`${BASE}/config`))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.configVersion).toBe(0)
    expect(json.tabs.length).toBeGreaterThan(0)
    expect(json.maintenance.enabled).toBe(false)
  })

  it("sert la version active, ETag + 304", async () => {
    const payload = {
      minAppVersion: "1.1.0",
      recommendedVersion: "1.2.0",
      maintenance: { enabled: false, message: null },
      features: { barkelu: false },
      tabs: [{ id: "home", label: { fr: "Accueil" }, type: "native", screen: "home", requiresAuth: false }],
      webAllowlist: ["www.ahloulkhidmah.org"],
      messages: [],
    }
    await prisma.mobileConfig.create({ data: { version: 7, active: true, payload: JSON.stringify(payload) } })
    const res = await getConfig(new Request(`${BASE}/config`))
    const json = await res.json()
    expect(json.configVersion).toBe(7)
    expect(json.minAppVersion).toBe("1.1.0")
    expect(res.headers.get("etag")).toBe('"cfg-7"')

    const again = await getConfig(new Request(`${BASE}/config`, { headers: { "if-none-match": '"cfg-7"' } }))
    expect(again.status).toBe(304)
  })

  it("une config invalide (WebView hors liste blanche) est ignorée → repli", async () => {
    const bad = {
      minAppVersion: "1.0.0",
      recommendedVersion: "1.0.0",
      maintenance: { enabled: false, message: null },
      features: {},
      tabs: [{ id: "evil", label: { fr: "X" }, type: "webview", url: "https://evil.example/", requiresAuth: false }],
      webAllowlist: ["www.ahloulkhidmah.org"],
      messages: [],
    }
    await prisma.mobileConfig.create({ data: { version: 9, active: true, payload: JSON.stringify(bad) } })
    const json = await (await getConfig(new Request(`${BASE}/config`))).json()
    expect(json.configVersion).toBe(0)
  })
})

describe("authentification mobile", () => {
  it("PIN correct → session, /me renvoie le profil du membre connecté uniquement", async () => {
    const { adherent, tel } = await makeMember({ pin: "4321" })
    const other = await makeMember({ pin: "1111" })

    const res = await login(post("/auth/login", { tel, suffix: "4321", device }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.status).toBe("ok")
    expect(json.accessToken).toBeTruthy()
    expect(json.refreshToken).toBeTruthy()

    const me = await (await getMe(new Request(`${BASE}/me`, { headers: bearer(json.accessToken) }))).json()
    expect(me.member.id).toBe(adherent.id)
    expect(me.member.id).not.toBe(other.adherent.id)
    expect(JSON.stringify(me)).not.toContain("pinHash")
  })

  it("mauvais PIN → 403 générique ; 6ᵉ tentative → 429 (limite persistante par numéro)", async () => {
    const { tel } = await makeMember({ pin: "4321" })
    for (let i = 0; i < 5; i++) {
      const r = await login(post("/auth/login", { tel, suffix: "0000" }))
      expect(r.status).toBe(403)
    }
    const blocked = await login(post("/auth/login", { tel, suffix: "4321" }))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get("retry-after")).toBeTruthy()
  })

  it("sans PIN : le suffixe d'ID ne donne PAS de session, seulement un jeton de création de PIN", async () => {
    const { adherent, tel } = await makeMember()
    const suffix = memberIdSuffix(adherent.id)

    const res = await login(post("/auth/login", { tel, suffix }))
    const json = await res.json()
    expect(json.status).toBe("pin_setup_required")
    expect(json.accessToken).toBeUndefined()
    expect(json.refreshToken).toBeUndefined()

    // Le jeton de création de PIN n'ouvre aucune donnée.
    const me = await getMe(new Request(`${BASE}/me`, { headers: bearer(json.setupToken) }))
    expect(me.status).toBe(401)

    // Création du PIN → session ; le suffixe ne fonctionne plus ensuite.
    const setup = await pinSetup(
      post("/auth/pin-setup", { pin: "2468", pinConfirm: "2468", device }, bearer(json.setupToken))
    )
    const sj = await setup.json()
    expect(setup.status).toBe(200)
    expect(sj.accessToken).toBeTruthy()

    const again = await login(post("/auth/login", { tel, suffix }))
    expect(again.status).toBe(403)

    // Le jeton ne peut pas servir à écraser un PIN existant.
    const replay = await pinSetup(
      post("/auth/pin-setup", { pin: "1357", pinConfirm: "1357" }, bearer(json.setupToken))
    )
    expect(replay.status).toBe(401) // sessionVersion déjà incrémenté
  })

  it("numéro écrit autrement (espaces, indicatif) → même membre", async () => {
    // Numéro SN stocké sans indicatif ; saisi avec indicatif et espaces.
    const national = `77${Math.floor(1000000 + Math.random() * 8999999)}`
    const { adherent } = await makeMember({ pin: "4321", tel: national })
    const spaced = `+221 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5, 7)} ${national.slice(7)}`
    const res = await login(post("/auth/login", { tel: spaced, suffix: "4321" }))
    expect(res.status).toBe(200)
    expect((await res.json()).member.id).toBe(adherent.id)

    // Numéro tronqué à l'enregistrement (8 chiffres) : toujours retrouvé.
    const truncated = `77${Math.floor(100000 + Math.random() * 899999)}`
    const t = await makeMember({ pin: "4321", tel: truncated })
    const res2 = await login(post("/auth/login", { tel: `${truncated}0`, suffix: "4321" }))
    expect(res2.status).toBe(200)
    expect((await res2.json()).member.id).toBe(t.adherent.id)
  })

  it("un numéro inconnu ne révèle rien (même réponse qu'un mauvais code)", async () => {
    const res = await login(post("/auth/login", { tel: randomTel(), suffix: "4321" }))
    expect(res.status).toBe(403)
    expect((await res.json()).error.code).toBe("invalid_credentials")
  })

  it("refresh : rotation, et la réutilisation d'un ancien jeton révoque la session", async () => {
    const { tel } = await makeMember({ pin: "4321" })
    const first = await (await login(post("/auth/login", { tel, suffix: "4321", device }))).json()

    const r1 = await refresh(post("/auth/refresh", { refreshToken: first.refreshToken }))
    const j1 = await r1.json()
    expect(r1.status).toBe(200)
    expect(j1.refreshToken).not.toBe(first.refreshToken)

    // Ancien jeton rejoué (vol probable) → refusé ET session révoquée.
    const replay = await refresh(post("/auth/refresh", { refreshToken: first.refreshToken }))
    expect(replay.status).toBe(401)
    const afterReplay = await refresh(post("/auth/refresh", { refreshToken: j1.refreshToken }))
    expect(afterReplay.status).toBe(401)
    const me = await getMe(new Request(`${BASE}/me`, { headers: bearer(j1.accessToken) }))
    expect(me.status).toBe(401)
  })

  it("logout révoque la session et détache le jeton push", async () => {
    const { tel } = await makeMember({ pin: "4321" })
    const s = await (await login(post("/auth/login", { tel, suffix: "4321" }))).json()
    const pushToken = rid("tok-test-push-xxxxxxxxxx")
    const reg = await registerDevice(post("/devices", { token: pushToken, platform: "android", locale: "fr" }, bearer(s.accessToken)))
    expect(reg.status).toBe(200)
    expect((await prisma.deviceToken.findUnique({ where: { token: pushToken } }))?.adherentId).toBeTruthy()

    await logout(post("/auth/logout", { refreshToken: s.refreshToken, pushToken }))
    expect((await getMe(new Request(`${BASE}/me`, { headers: bearer(s.accessToken) }))).status).toBe(401)
    expect((await refresh(post("/auth/refresh", { refreshToken: s.refreshToken }))).status).toBe(401)
    expect((await prisma.deviceToken.findUnique({ where: { token: pushToken } }))?.adherentId).toBeNull()
  })

  it("un changement de PIN (sessionVersion) révoque les sessions mobiles", async () => {
    const { adherent, tel } = await makeMember({ pin: "4321" })
    const s = await (await login(post("/auth/login", { tel, suffix: "4321" }))).json()
    await prisma.adherent.update({ where: { id: adherent.id }, data: { sessionVersion: { increment: 1 } } })
    expect((await getMe(new Request(`${BASE}/me`, { headers: bearer(s.accessToken) }))).status).toBe(401)
  })

  it("un cookie/JWT de session web n'est jamais accepté comme jeton mobile", async () => {
    const { adherent } = await makeMember({ pin: "4321" })
    const webToken = await createMemberSessionToken({ adherentId: adherent.id, name: "X" }, 0)
    const res = await getMe(new Request(`${BASE}/me`, { headers: bearer(webToken) }))
    expect(res.status).toBe(401)
  })

  it("PATCH /me met à jour le profil via la logique partagée", async () => {
    const { tel } = await makeMember({ pin: "4321" })
    const s = await (await login(post("/auth/login", { tel, suffix: "4321" }))).json()
    const res = await patchMe(
      new Request(`${BASE}/me`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...bearer(s.accessToken) },
        body: JSON.stringify({ nom: "Ndiaye", prenoms: "Fatou", profession: "Enseignante" }),
      })
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.member.nom).toBe("Ndiaye")
  })
})

describe("appareils / push", () => {
  it("enregistrement sans session (annonces générales) puis suppression", async () => {
    const token = rid("tok-test-anon-xxxxxxxxxx")
    const reg = await registerDevice(post("/devices", { token, platform: "ios" }))
    expect(reg.status).toBe(200)
    expect((await prisma.deviceToken.findUnique({ where: { token } }))?.adherentId).toBeNull()

    const del = await removeDevice(
      new Request(`${BASE}/devices`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      })
    )
    expect(del.status).toBe(200)
    expect(await prisma.deviceToken.findUnique({ where: { token } })).toBeNull()
  })
})
