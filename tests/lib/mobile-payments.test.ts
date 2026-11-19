import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/db"
import { rid } from "../helpers"
import { createMobileSession } from "@/lib/mobile/session"

// ───────── PayDunya simulé : aucun appel réseau réel ─────────
const pd = {
  configured: true,
  confirmStatus: "pending" as string,
  softpayThrows: false,
  invoiceCount: 0,
}
vi.mock("@/lib/paydunya", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paydunya")>()
  return {
    ...actual,
    paydunyaConfigured: () => pd.configured,
    verifyPaydunyaHash: () => true,
    createCheckoutInvoice: async () => {
      pd.invoiceCount += 1
      return {
        token: `tok-mpay-${pd.invoiceCount}-${Math.random().toString(36).slice(2, 8)}`,
        url: "https://app.paydunya.com/checkout/invoice/simulee",
      }
    },
    confirmCheckoutInvoice: async () => ({
      status: pd.confirmStatus,
      receiptUrl: "https://app.paydunya.com/receipt/simule",
      raw: { status: pd.confirmStatus },
    }),
    softpayWaveSenegal: async () => {
      if (pd.softpayThrows) throw new Error("SoftPay Wave nécessite le mode live")
      return { success: true, message: "Validez dans Wave", url: "https://pay.wave.com/c/simule", fees: 0, currency: "XOF" }
    },
    softpayOrangeMoneySenegal: async () => ({
      success: true, message: "Validez dans Orange", omUrl: "https://orangemoneysn.page.link/simule", maxitUrl: "https://sugu.orange-sonatel.com/simule",
    }),
  }
})

import { GET as getDue } from "@/app/api/mobile/v1/payments/due/route"
import { POST as createPayment } from "@/app/api/mobile/v1/payments/cotisation/route"
import { GET as getStatus } from "@/app/api/mobile/v1/payments/[id]/route"
import { POST as startSoftpayRoute } from "@/app/api/mobile/v1/payments/[id]/softpay/route"
import { currentPeriode } from "@/lib/paydunya"

const BASE = "http://localhost/api/mobile/v1/payments"
const bearer = (t: string) => ({ authorization: `Bearer ${t}`, "content-type": "application/json" })
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

async function member(over: Record<string, unknown> = {}) {
  const a = await prisma.adherent.create({
    data: {
      id: rid("AK-MPAY").toUpperCase(),
      celluleLocale: "À préciser", zoneRegion: "Dakar", nom: "Pay", prenoms: "Test",
      dateNaissance: "1990-01-01", cni: rid("CNI"), nationalite: "Sénégalaise", adresse: "Dakar",
      tel: `+22177${Math.floor(1000000 + Math.random() * 8999999)}`,
      profession: "Testeur", montant: "1400", canal: "en_ligne", status: "actif",
      ...over,
    },
  })
  const tokens = await createMobileSession(a, { platform: "android" })
  return { adherent: a, token: tokens.accessToken }
}

function post(path: string, body: unknown, token?: string) {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: token ? bearer(token) : { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}
function get(path: string, token?: string) {
  return new Request(`${BASE}${path}`, { headers: token ? bearer(token) : {} })
}

beforeEach(async () => {
  pd.configured = true
  pd.confirmStatus = "pending"
  pd.softpayThrows = false
  await prisma.rateLimitBucket.deleteMany()
})
afterAll(async () => {
  await prisma.payment.deleteMany({ where: { adherent: { id: { startsWith: "AK-MPAY" } } } })
  await prisma.cotisation.deleteMany({ where: { adherentId: { startsWith: "AK-MPAY" } } })
  await prisma.mobileSession.deleteMany({ where: { adherentId: { startsWith: "AK-MPAY" } } })
  await prisma.adherent.deleteMany({ where: { id: { startsWith: "AK-MPAY" } } })
})

describe("GET /payments/due", () => {
  it("refuse sans session", async () => {
    expect((await getDue(get("/due"))).status).toBe(401)
  })

  it("renvoie les mois impayés les plus récents (jamais à l'avance) et le montant", async () => {
    const { token, adherent } = await member()
    const json = await (await getDue(get("/due", token))).json()
    expect(json.unitAmount).toBe(1400)
    expect(json.paymentsEnabled).toBe(true)
    expect(json.maxMonths).toBe(6)
    expect(json.periods).toHaveLength(6)
    expect(json.periods.at(-1).periode).toBe(currentPeriode())
    expect(json.periods.every((p: { periode: string }) => p.periode <= currentPeriode())).toBe(true)

    // Le mois courant, déjà payé, disparaît de la liste.
    await prisma.cotisation.create({
      data: { adherentId: adherent.id, periode: currentPeriode(), montant: 1400, canal: "paydunya", statut: "paye" },
    })
    const after = await (await getDue(get("/due", token))).json()
    expect(after.periods.map((p: { periode: string }) => p.periode)).not.toContain(currentPeriode())
  })

  it("paiements désactivés quand PayDunya n'est pas configuré", async () => {
    pd.configured = false
    const { token } = await member()
    expect((await (await getDue(get("/due", token))).json()).paymentsEnabled).toBe(false)
  })

  it("paiements désactivés pour un compte archivé", async () => {
    const { token } = await member({ status: "archive" })
    expect((await (await getDue(get("/due", token))).json()).paymentsEnabled).toBe(false)
  })
})

describe("POST /payments/cotisation", () => {
  it("crée un paiement « pending » : le serveur ne marque RIEN comme payé", async () => {
    const { token, adherent } = await member()
    const res = await createPayment(post("/cotisation", { monthsCount: 2 }, token))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.amount).toBe(2800)
    expect(json.periodes).toHaveLength(2)
    expect(json.checkoutUrl).toContain("paydunya.com")

    const payment = await prisma.payment.findUnique({ where: { id: json.paymentId } })
    expect(payment?.status).toBe("pending")
    expect(payment?.type).toBe("cotisation")
    expect(payment?.adherentId).toBe(adherent.id)
    expect(await prisma.cotisation.count({ where: { adherentId: adherent.id } })).toBe(0)
  })

  it("le montant vient du serveur, jamais du client", async () => {
    const { token } = await member({ montant: "14000" })
    const json = await (await createPayment(post("/cotisation", { monthsCount: 1, amount: 1 }, token))).json()
    expect(json.amount).toBe(14000)
  })

  it("refuse 0 mois, 7 mois, un texte, un corps vide", async () => {
    const { token } = await member()
    for (const body of [{ monthsCount: 0 }, { monthsCount: 7 }, { monthsCount: "2" }, {}]) {
      expect((await createPayment(post("/cotisation", body, token))).status).toBe(400)
    }
  })

  it("503 stable quand PayDunya n'est pas configuré", async () => {
    pd.configured = false
    const { token } = await member()
    const res = await createPayment(post("/cotisation", { monthsCount: 1 }, token))
    expect(res.status).toBe(503)
    expect((await res.json()).error.code).toBe("payments_unavailable")
  })

  it("refuse sans session et pour un compte archivé", async () => {
    expect((await createPayment(post("/cotisation", { monthsCount: 1 }))).status).toBe(401)
    const { token } = await member({ status: "archive" })
    const res = await createPayment(post("/cotisation", { monthsCount: 1 }, token))
    expect(res.status).toBe(403)
    expect((await res.json()).error.code).toBe("account_archived")
  })

  it("montant de cotisation invalide : 422 (pas de facture à 0 FCFA)", async () => {
    const { token } = await member({ montant: "autre", montantAutre: "0" })
    expect((await createPayment(post("/cotisation", { monthsCount: 1 }, token))).status).toBe(422)
  })

  it("limite : 10 créations par 15 minutes et par membre", async () => {
    const { token } = await member()
    for (let i = 0; i < 10; i++) expect((await createPayment(post("/cotisation", { monthsCount: 1 }, token))).status).toBe(200)
    expect((await createPayment(post("/cotisation", { monthsCount: 1 }, token))).status).toBe(429)
  })
})

describe("GET /payments/{id}", () => {
  async function pending() {
    const m = await member()
    const created = await (await createPayment(post("/cotisation", { monthsCount: 1 }, m.token))).json()
    return { ...m, paymentId: created.paymentId as string }
  }

  it("reste « pending » tant que PayDunya ne confirme pas", async () => {
    const { token, paymentId } = await pending()
    const json = await (await getStatus(get(`/${paymentId}`, token), ctx(paymentId))).json()
    expect(json.status).toBe("pending")
    expect(json.receiptUrl).toBeNull()
  })

  it("passe à « completed » seulement après confirmation serveur, et enregistre la cotisation", async () => {
    const { token, paymentId, adherent } = await pending()
    pd.confirmStatus = "completed"
    const json = await (await getStatus(get(`/${paymentId}`, token), ctx(paymentId))).json()
    expect(json.status).toBe("completed")
    expect(json.receiptUrl).toContain("receipt")
    const cot = await prisma.cotisation.findFirst({ where: { adherentId: adherent.id, statut: "paye" } })
    expect(cot?.periode).toBe(currentPeriode())
  })

  it("le paiement d'un AUTRE membre est « introuvable » (pas « interdit »)", async () => {
    const owner = await pending()
    const other = await member()
    const res = await getStatus(get(`/${owner.paymentId}`, other.token), ctx(owner.paymentId))
    expect(res.status).toBe(404)
  })

  it("refuse sans session ; identifiant inconnu : 404", async () => {
    const { paymentId, token } = await pending()
    expect((await getStatus(get(`/${paymentId}`), ctx(paymentId))).status).toBe(401)
    expect((await getStatus(get("/inconnu", token), ctx("inconnu"))).status).toBe(404)
  })
})

describe("POST /payments/{id}/softpay", () => {
  async function pending(over: Record<string, unknown> = {}) {
    const m = await member(over)
    const created = await (await createPayment(post("/cotisation", { monthsCount: 1 }, m.token))).json()
    return { ...m, paymentId: created.paymentId as string }
  }

  it("Wave : renvoie le lien du prestataire", async () => {
    const { token, paymentId } = await pending()
    const json = await (await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "wave" }, token), ctx(paymentId))).json()
    expect(json.mode).toBe("softpay")
    expect(json.url).toContain("pay.wave.com")
  })

  it("Orange Money : renvoie les liens Orange", async () => {
    const { token, paymentId } = await pending()
    const json = await (await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "orange" }, token), ctx(paymentId))).json()
    expect(json.mode).toBe("softpay")
    expect(json.omUrl).toContain("orangemoneysn")
  })

  it("SoftPay indisponible (mode test) : repli sur la page de paiement classique", async () => {
    pd.softpayThrows = true
    const { token, paymentId } = await pending()
    const json = await (await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "wave" }, token), ctx(paymentId))).json()
    expect(json.mode).toBe("hosted")
    expect(json.url).toContain("paydunya.com")
  })

  it("le paiement d'un AUTRE membre est « introuvable »", async () => {
    const owner = await pending()
    const other = await member()
    const res = await startSoftpayRoute(post(`/${owner.paymentId}/softpay`, { method: "wave" }, other.token), ctx(owner.paymentId))
    expect(res.status).toBe(404)
  })

  it("moyen invalide : 400 ; sans session : 401 ; non configuré : 503", async () => {
    const { token, paymentId } = await pending()
    expect((await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "carte" }, token), ctx(paymentId))).status).toBe(400)
    expect((await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "wave" }), ctx(paymentId))).status).toBe(401)
    pd.configured = false
    expect((await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "wave" }, token), ctx(paymentId))).status).toBe(503)
  })

  it("déjà payé : le serveur le dit, sans relancer de paiement", async () => {
    const { token, paymentId } = await pending()
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "completed" } })
    const json = await (await startSoftpayRoute(post(`/${paymentId}/softpay`, { method: "wave" }, token), ctx(paymentId))).json()
    expect(json.alreadyPaid).toBe(true)
  })
})
