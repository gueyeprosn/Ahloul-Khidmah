import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/db"
import { rid } from "../helpers"

// Parité de la route web publique après factorisation dans lib/softpay-start.ts.
const pd = { configured: true, softpayThrows: false }
vi.mock("@/lib/paydunya", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paydunya")>()
  return {
    ...actual,
    paydunyaConfigured: () => pd.configured,
    softpayWaveSenegal: async () => {
      if (pd.softpayThrows) throw new Error("SoftPay Wave nécessite le mode live")
      return { success: true, message: "Validez dans Wave", url: "https://pay.wave.com/c/x", fees: 0, currency: "XOF" }
    },
  }
})
import { POST } from "@/app/api/payments/softpay/route"

const req = (body: unknown) =>
  new Request("http://localhost/api/payments/softpay", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": rid("ip") },
    body: JSON.stringify(body),
  })

async function payment() {
  const a = await prisma.adherent.create({
    data: {
      id: rid("AK-WSP").toUpperCase(), celluleLocale: "x", zoneRegion: "x", nom: "W", prenoms: "S",
      dateNaissance: "1990-01-01", cni: rid("C"), nationalite: "SN", adresse: "x", tel: "+221770011223",
      profession: "x", montant: "1400", canal: "en_ligne", status: "actif",
    },
  })
  return prisma.payment.create({
    data: { adherentId: a.id, type: "cotisation", periode: "2026-11", amount: 1400, status: "pending",
            token: rid("tok-wsp"), checkoutUrl: "https://app.paydunya.com/checkout/invoice/x" },
  })
}

beforeEach(() => { pd.configured = true; pd.softpayThrows = false })
afterAll(async () => {
  await prisma.payment.deleteMany({ where: { adherent: { id: { startsWith: "AK-WSP" } } } })
  await prisma.adherent.deleteMany({ where: { id: { startsWith: "AK-WSP" } } })
})

describe("POST /api/payments/softpay (route web, comportement d'origine)", () => {
  it("503 si PayDunya n'est pas configuré (message d'origine)", async () => {
    pd.configured = false
    const res = await POST(req({ paymentId: "x", method: "wave" }))
    expect(res.status).toBe(503)
    expect((await res.json()).error).toBe("PayDunya n'est pas configuré")
  })
  it("400 avec issues si le corps est invalide", async () => {
    const res = await POST(req({ paymentId: "", method: "carte" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Données invalides")
  })
  it("404 « Paiement introuvable »", async () => {
    const res = await POST(req({ paymentId: "inconnu", method: "wave" }))
    expect(res.status).toBe(404)
    expect((await res.json()).error).toBe("Paiement introuvable")
  })
  it("succès : mêmes champs qu'avant", async () => {
    const p = await payment()
    const json = await (await POST(req({ paymentId: p.id, method: "wave" }))).json()
    expect(json).toMatchObject({ ok: true, method: "wave", paymentId: p.id, url: "https://pay.wave.com/c/x" })
  })
  it("repli : ok + fallback + url de la facture", async () => {
    pd.softpayThrows = true
    const p = await payment()
    const json = await (await POST(req({ paymentId: p.id, method: "wave" }))).json()
    expect(json).toMatchObject({ ok: true, fallback: true, method: "wave", url: "https://app.paydunya.com/checkout/invoice/x" })
  })
  it("déjà payé : alreadyPaid", async () => {
    const p = await payment()
    await prisma.payment.update({ where: { id: p.id }, data: { status: "completed" } })
    expect(await (await POST(req({ paymentId: p.id, method: "wave" }))).json()).toMatchObject({ ok: true, alreadyPaid: true, status: "completed" })
  })
  it("reste public par conception : aucun jeton exigé (comportement historique du site)", async () => {
    const p = await payment()
    expect((await POST(req({ paymentId: p.id, method: "wave" }))).status).toBe(200)
  })
})
