import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { rid } from "../helpers"

// Aucun appel réseau réel : on simule uniquement la confirmation serveur à
// serveur de PayDunya et la vérification du hash de l'IPN.
let hashOk = true
vi.mock("@/lib/paydunya", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paydunya")>()
  return {
    ...actual,
    verifyPaydunyaHash: () => hashOk,
    confirmCheckoutInvoice: async () => ({
      status: "completed",
      receiptUrl: "https://example.test/receipt",
      raw: { status: "completed" },
    }),
  }
})

import { POST as ipn } from "@/app/api/payments/ipn/route"

async function makeAdherent() {
  return prisma.adherent.create({
    data: {
      id: rid("AK-IPN"),
      celluleLocale: "À préciser",
      zoneRegion: "Dakar",
      nom: "Test",
      prenoms: "Ipn",
      dateNaissance: "1990-01-01",
      cni: rid("CNI"),
      nationalite: "Sénégalaise",
      adresse: "Dakar",
      tel: "+221770009999",
      profession: "Test",
      montant: "1000",
      canal: "en_ligne",
      status: "actif",
    },
  })
}

function ipnRequest(paymentId: string, token: string) {
  const body = {
    data: {
      hash: "peu-importe-mocke",
      status: "completed",
      custom_data: { payment_id: paymentId },
      invoice: { token },
    },
  }
  return new Request("http://localhost/api/payments/ipn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("IPN PayDunya — paiement de cotisation (audit S5)", () => {
  beforeEach(async () => {
    hashOk = true
    await prisma.payment.deleteMany({ where: { token: { startsWith: "tok-ipn" } } })
    await prisma.adherent.deleteMany({ where: { id: { startsWith: "AK-IPN" } } })
  })

  it("une IPN « completed » enregistre bien la cotisation payée", async () => {
    const adherent = await makeAdherent()
    const token = rid("tok-ipn")
    const payment = await prisma.payment.create({
      data: {
        adherentId: adherent.id,
        type: "cotisation",
        periode: "2026-10",
        periodes: JSON.stringify(["2026-10"]),
        amount: 1000,
        status: "pending",
        token,
      },
    })

    const res = await ipn(ipnRequest(payment.id, token))
    expect(res.status).toBe(200)

    const cot = await prisma.cotisation.findUnique({
      where: { adherentId_periode: { adherentId: adherent.id, periode: "2026-10" } },
    })
    expect(cot?.statut).toBe("paye")
  })

  it("une IPN « completed » valide aussi un don (contribution passée à completed)", async () => {
    const token = rid("tok-ipn")
    const contribution = await prisma.contribution.create({
      data: { amount: 1000, campagne: "general", status: "pending" },
    })
    const payment = await prisma.payment.create({
      data: {
        type: "don",
        contributionId: contribution.id,
        amount: 1000,
        status: "pending",
        token,
      },
    })

    const res = await ipn(ipnRequest(payment.id, token))
    expect(res.status).toBe(200)

    const after = await prisma.contribution.findUnique({ where: { id: contribution.id } })
    expect(after?.status).toBe("completed")
    await prisma.payment.delete({ where: { id: payment.id } })
    await prisma.contribution.delete({ where: { id: contribution.id } })
  })

  it("hash invalide : la facture est confirmée auprès de PayDunya, sans croire le contenu reçu", async () => {
    hashOk = false
    const adherent = await makeAdherent()
    const token = rid("tok-ipn")
    const payment = await prisma.payment.create({
      data: { adherentId: adherent.id, type: "cotisation", periode: "2026-09", periodes: JSON.stringify(["2026-09"]), amount: 1000, status: "pending", token },
    })
    // Le payload prétend « failed » avec un faux hash : il ne doit rien écrire.
    const req = new Request("http://localhost/api/payments/ipn", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.7.7.7" },
      body: JSON.stringify({ data: { hash: "faux", status: "failed", custom_data: { payment_id: payment.id }, invoice: { token } } }),
    })
    const res = await ipn(req)
    expect(res.status).toBe(200) // confirmé serveur à serveur (mock : « completed »)
    const after = await prisma.payment.findUnique({ where: { id: payment.id } })
    expect(after?.status).toBe("completed")
    expect(after?.rawPayload).not.toContain("faux") // le contenu non fiable n'est pas conservé
  })

  it("hash invalide et jeton inconnu : refus 403, rien n'est créé", async () => {
    hashOk = false
    const req = new Request("http://localhost/api/payments/ipn", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.7.7.8" },
      body: JSON.stringify({ data: { hash: "faux", status: "completed", invoice: { token: "tok-ipn-inconnu" } } }),
    })
    expect((await ipn(req)).status).toBe(403)
    expect(await prisma.payment.count({ where: { token: "tok-ipn-inconnu" } })).toBe(0)
  })

  it("format réel PayDunya (clés data[...] en formulaire) : hash lu et paiement confirmé", async () => {
    hashOk = true
    const adherent = await makeAdherent()
    const token = rid("tok-ipn")
    const payment = await prisma.payment.create({
      data: { adherentId: adherent.id, type: "cotisation", periode: "2026-08", periodes: JSON.stringify(["2026-08"]), amount: 1000, status: "pending", token },
    })
    const body = new URLSearchParams({
      "data[response_code]": "00",
      "data[hash]": "le-hash-de-paydunya",
      "data[status]": "completed",
      "data[invoice][token]": token,
      "data[custom_data][payment_id]": payment.id,
    })
    const res = await ipn(
      new Request("http://localhost/api/payments/ipn", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": "10.7.7.9" },
        body,
      })
    )
    expect(res.status).toBe(200)
    expect((await prisma.payment.findUnique({ where: { id: payment.id } }))?.status).toBe("completed")
    const cot = await prisma.cotisation.findUnique({ where: { adherentId_periode: { adherentId: adherent.id, periode: "2026-08" } } })
    expect(cot?.statut).toBe("paye")
  })

  it("format réel PayDunya avec hash invalide : refusé, mais la facture est confirmée auprès de PayDunya", async () => {
    hashOk = false
    const adherent = await makeAdherent()
    const token = rid("tok-ipn")
    const payment = await prisma.payment.create({
      data: { adherentId: adherent.id, type: "cotisation", periode: "2026-07", periodes: JSON.stringify(["2026-07"]), amount: 1000, status: "pending", token },
    })
    const body = new URLSearchParams({
      "data[hash]": "faux",
      "data[status]": "failed",
      "data[invoice][token]": token,
      "data[custom_data][payment_id]": payment.id,
    })
    const res = await ipn(
      new Request("http://localhost/api/payments/ipn", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": "10.7.7.10" },
        body,
      })
    )
    expect(res.status).toBe(200) // confirmé serveur à serveur (mock : « completed »)
    expect((await prisma.payment.findUnique({ where: { id: payment.id } }))?.status).toBe("completed")
  })
})
