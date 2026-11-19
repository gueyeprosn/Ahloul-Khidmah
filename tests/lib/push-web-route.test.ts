import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/db"

let session: { adherentId: string; name: string } | null = null
vi.mock("@/lib/member-auth", () => ({ getMemberSession: async () => session }))
const notifyDevice = vi.fn(async () => true)
vi.mock("@/lib/push", () => ({ notifyDevice: (...a: unknown[]) => (notifyDevice as unknown as (...x: unknown[]) => unknown)(...a) }))

import { DELETE, POST } from "@/app/api/mon-espace/push/route"

const TOKEN = "TESTPUSHWEB-abcdefghij1234567890"
const req = (method: string, body: unknown) =>
  new Request("http://localhost/api/mon-espace/push", {
    method,
    headers: { "content-type": "application/json", "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` },
    body: JSON.stringify(body),
  })

describe("/api/mon-espace/push", () => {
  beforeEach(async () => {
    session = null
    notifyDevice.mockClear()
    await prisma.deviceToken.deleteMany({ where: { token: { startsWith: "TESTPUSHWEB-" } } })
  })

  it("refuse sans session membre", async () => {
    expect((await POST(req("POST", { token: TOKEN }))).status).toBe(401)
    expect((await DELETE(req("DELETE", { token: TOKEN }))).status).toBe(401)
  })

  it("enregistre le jeton web du membre, puis le réattribue sans doublon", async () => {
    const [a, b] = await prisma.adherent.findMany({ select: { id: true }, take: 2 })
    if (!a || !b) return
    session = { adherentId: a.id, name: "A" }
    expect((await POST(req("POST", { token: TOKEN, locale: "fr" }))).status).toBe(200)
    let row = await prisma.deviceToken.findUnique({ where: { token: TOKEN } })
    expect(row).toMatchObject({ platform: "web", adherentId: a.id, locale: "fr" })

    session = { adherentId: b.id, name: "B" } // même navigateur, autre membre
    await POST(req("POST", { token: TOKEN }))
    row = await prisma.deviceToken.findUnique({ where: { token: TOKEN } })
    expect(row?.adherentId).toBe(b.id)
    expect(await prisma.deviceToken.count({ where: { token: TOKEN } })).toBe(1)
  })

  it("un membre ne supprime pas le jeton d'un autre", async () => {
    const [a, b] = await prisma.adherent.findMany({ select: { id: true }, take: 2 })
    if (!a || !b) return
    await prisma.deviceToken.create({ data: { token: TOKEN, platform: "web", adherentId: a.id } })
    session = { adherentId: b.id, name: "B" }
    await DELETE(req("DELETE", { token: TOKEN }))
    expect(await prisma.deviceToken.count({ where: { token: TOKEN } })).toBe(1)
    session = { adherentId: a.id, name: "A" }
    await DELETE(req("DELETE", { token: TOKEN }))
    expect(await prisma.deviceToken.count({ where: { token: TOKEN } })).toBe(0)
  })

  it("confirme l'activation une seule fois (pas à chaque rafraîchissement)", async () => {
    const [a, b] = await prisma.adherent.findMany({ select: { id: true }, take: 2 })
    if (!a || !b) return
    session = { adherentId: a.id, name: "A" }
    await POST(req("POST", { token: TOKEN, locale: "ar" }))
    await POST(req("POST", { token: TOKEN, locale: "ar" })) // rafraîchissement : rien de plus
    expect(notifyDevice).toHaveBeenCalledTimes(1)
    expect((notifyDevice.mock.calls[0] as unknown[]).slice(0, 2)).toEqual([TOKEN, "ar"])
    session = { adherentId: b.id, name: "B" } // même navigateur, autre membre
    await POST(req("POST", { token: TOKEN, locale: "fr" }))
    expect(notifyDevice).toHaveBeenCalledTimes(2)
  })

  it("rejette un jeton invalide", async () => {
    session = { adherentId: "x", name: "X" }
    expect((await POST(req("POST", { token: "court" }))).status).toBe(400)
  })
})
