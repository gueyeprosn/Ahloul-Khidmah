import { describe, it, expect, vi, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { rid } from "../helpers"

// Aucun appel réseau réel : on simule uniquement la confirmation serveur à
// serveur de PayDunya et la vérification du hash de l'IPN.
vi.mock("@/lib/paydunya", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paydunya")>()
  return {
    ...actual,
    verifyPaydunyaHash: () => true,
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
})
