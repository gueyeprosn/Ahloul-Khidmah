import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/db"

const sendEachForMulticast = vi.fn()
vi.mock("firebase-admin/app", () => ({
  getApps: () => [{ name: "ak-push" }],
  initializeApp: vi.fn(),
  cert: vi.fn(),
}))
vi.mock("firebase-admin/messaging", () => ({
  getMessaging: () => ({ sendEachForMulticast }),
}))

import { notifyMember, safeMobileRoute, safeWebPath, sendPush } from "@/lib/push"

const PREFIX = "TESTPUSH-"

async function clean() {
  await prisma.deviceToken.deleteMany({ where: { token: { startsWith: PREFIX } } })
}

describe("routes autorisées", () => {
  it("mobile : liste fermée", () => {
    expect(safeMobileRoute("/card")).toBe("/card")
    expect(safeMobileRoute("/pay")).toBe("/pay")
    expect(safeMobileRoute("/t/home")).toBe("/t/home")
    for (const bad of ["https://evil.example", "//evil", "/admin", "/t/", "/t/../pay", "/T/home", "", null, 3]) {
      expect(safeMobileRoute(bad)).toBeNull()
    }
  })
  it("web : chemins internes uniquement, repli sur /mon-espace", () => {
    expect(safeWebPath("/mon-espace/historique")).toBe("/mon-espace/historique")
    expect(safeWebPath("/mon-espace?tab=versements")).toBe("/mon-espace?tab=versements")
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil", "javascript:alert(1)", "/a b", "", undefined, 5]) {
      expect(safeWebPath(bad)).toBe("/mon-espace")
    }
  })
})

describe("sendPush", () => {
  beforeEach(async () => {
    await clean()
    sendEachForMulticast.mockReset()
  })

  it("n'appelle pas FCM sans appareil", async () => {
    const r = await sendPush({ title: "t", body: "b", audience: { kind: "member", adherentId: "inconnu" } })
    expect(r).toEqual({ targeted: 0, sent: 0, failed: 0, removed: 0 })
    expect(sendEachForMulticast).not.toHaveBeenCalled()
  })

  it("envoie, compte et retire les jetons périmés ; route et chemin sont filtrés", async () => {
    await prisma.deviceToken.createMany({
      data: [
        { token: `${PREFIX}ok-1234567890`, platform: "android" },
        { token: `${PREFIX}mort-1234567890`, platform: "ios" },
        { token: `${PREFIX}web-1234567890`, platform: "web" },
      ],
    })
    sendEachForMulticast.mockImplementation(async (m: { tokens: string[] }) => ({
      successCount: m.tokens.length - m.tokens.filter((t) => t.includes("mort")).length,
      failureCount: m.tokens.filter((t) => t.includes("mort")).length,
      responses: m.tokens.map((t) =>
        t.includes("mort")
          ? { success: false, error: { code: "messaging/registration-token-not-registered" } }
          : { success: true }
      ),
    }))

    const r = await sendPush({
      title: "Rappel",
      body: "Cotisation du mois",
      route: "https://evil.example", // refusé
      webPath: "//evil.example", // refusé
      audience: { kind: "all" },
    })
    const ours = r // les autres lignes éventuelles de la base de test comptent aussi
    expect(ours.removed).toBe(1)
    expect(ours.failed).toBeGreaterThanOrEqual(1)

    const msg = sendEachForMulticast.mock.calls[0][0]
    expect(msg.notification).toEqual({ title: "Rappel", body: "Cotisation du mois" })
    expect(msg.data.route).toBeUndefined()
    expect(msg.data.url).toBe("/mon-espace")
    expect(msg.webpush.fcmOptions.link).toMatch(/\/mon-espace$/)
    expect(await prisma.deviceToken.count({ where: { token: `${PREFIX}mort-1234567890` } })).toBe(0)
    expect(await prisma.deviceToken.count({ where: { token: `${PREFIX}ok-1234567890` } })).toBe(1)
  })

  it("une route valide est transmise, et un membre ne cible que ses appareils", async () => {
    const a = await prisma.adherent.findFirst({ select: { id: true } })
    if (!a) return // base de test vide : rien à vérifier
    await prisma.deviceToken.create({ data: { token: `${PREFIX}m-1234567890`, platform: "android", adherentId: a.id } })
    sendEachForMulticast.mockResolvedValue({ successCount: 1, failureCount: 0, responses: [{ success: true }] })
    const r = await sendPush({
      title: "Salam",
      body: "Message",
      route: "/pay",
      webPath: "/mon-espace/historique",
      audience: { kind: "member", adherentId: a.id },
    })
    expect(r.targeted).toBeGreaterThanOrEqual(1)
    const msg = sendEachForMulticast.mock.calls[0][0]
    expect(msg.data.route).toBe("/pay")
    expect(msg.data.url).toBe("/mon-espace/historique")
    expect(msg.tokens).toContain(`${PREFIX}m-1234567890`)
  })
})

describe("notifyMember", () => {
  beforeEach(async () => {
    await clean()
    sendEachForMulticast.mockReset()
  })

  it("envoie chaque appareil dans sa langue, et jamais à un autre membre", async () => {
    const [a, b] = await prisma.adherent.findMany({ select: { id: true }, take: 2 })
    if (!a || !b) return
    const prev = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH = "package.json" // existe : simule « configuré »
    try {
      await prisma.deviceToken.createMany({
        data: [
          { token: `${PREFIX}fr-1234567890`, platform: "android", adherentId: a.id, locale: "fr" },
          { token: `${PREFIX}ar-1234567890`, platform: "ios", adherentId: a.id, locale: "ar" },
          { token: `${PREFIX}autre-1234567890`, platform: "android", adherentId: b.id, locale: "fr" },
        ],
      })
      sendEachForMulticast.mockImplementation(async (m: { tokens: string[] }) => ({
        successCount: m.tokens.length,
        failureCount: 0,
        responses: m.tokens.map(() => ({ success: true })),
      }))
      const r = await notifyMember(
        a.id,
        { fr: { title: "Titre FR", body: "Corps FR" }, ar: { title: "عنوان", body: "نص" } },
        { route: "/card", webPath: "/mon-espace" }
      )
      expect(r?.sent).toBeGreaterThanOrEqual(2)
      const calls = sendEachForMulticast.mock.calls.map((c) => c[0])
      const ar = calls.find((m) => m.notification.title === "عنوان")
      const fr = calls.find((m) => m.notification.title === "Titre FR")
      expect(ar.tokens).toContain(`${PREFIX}ar-1234567890`)
      expect(fr.tokens).toContain(`${PREFIX}fr-1234567890`)
      const all = calls.flatMap((m) => m.tokens)
      expect(all).not.toContain(`${PREFIX}autre-1234567890`)
      expect(fr.data.route).toBe("/card")
    } finally {
      if (prev === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      else process.env.FIREBASE_SERVICE_ACCOUNT_PATH = prev
    }
  })

  it("renvoie null sans lever si le service n'est pas configuré", async () => {
    const prev = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    try {
      expect(await notifyMember("x", { fr: { title: "a", body: "b" }, ar: { title: "a", body: "b" } })).toBeNull()
      expect(sendEachForMulticast).not.toHaveBeenCalled()
    } finally {
      if (prev !== undefined) process.env.FIREBASE_SERVICE_ACCOUNT_PATH = prev
    }
  })
})
