import { describe, it, expect, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { registerAdhesionWaveFallback } from "@/lib/adhesion-checkout"

const draft = {
  nom: "TESTWAVE",
  prenoms: "Awa",
  tel: "+221770000123",
  paysRegion: "Sénégal",
  montant: "1400",
}

describe("registerAdhesionWaveFallback", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany({ where: { customerName: { contains: "TESTWAVE" } } })
    await prisma.adherent.deleteMany({ where: { nom: "TESTWAVE" } })
  })

  it("crée un membre actif (canal Wave) avec un paiement en attente", async () => {
    const { adherent, amount } = await registerAdhesionWaveFallback(draft)
    expect(amount).toBe(1400)
    expect(adherent.status).toBe("actif")
    expect(adherent.canal).toBe("wave")
    const payments = await prisma.payment.findMany({ where: { adherentId: adherent.id } })
    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({ type: "adhesion", status: "pending", amount: 1400 })
  })

  it("réutilise la fiche si le même numéro renvoie le formulaire (double clic)", async () => {
    const first = await registerAdhesionWaveFallback(draft)
    const second = await registerAdhesionWaveFallback(draft)
    expect(second.adherent.id).toBe(first.adherent.id)
    expect(await prisma.adherent.count({ where: { nom: "TESTWAVE" } })).toBe(1)
    expect(await prisma.payment.count({ where: { adherentId: first.adherent.id } })).toBe(1)
  })

  it("refuse un numéro d'un membre inscrit autrement (pas via le secours Wave)", async () => {
    const { adherent } = await registerAdhesionWaveFallback(draft)
    await prisma.adherent.update({ where: { id: adherent.id }, data: { canal: "paydunya" } })
    await expect(registerAdhesionWaveFallback(draft)).rejects.toThrow("DUPLICATE_PHONE")
  })

  it("refuse le même numéro après 24 h", async () => {
    const { adherent } = await registerAdhesionWaveFallback(draft)
    await prisma.adherent.update({
      where: { id: adherent.id },
      data: { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    })
    await expect(registerAdhesionWaveFallback(draft)).rejects.toThrow("DUPLICATE_PHONE")
  })
})

describe("startAdhesionCheckoutFromDraft — numéro déjà inscrit", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany({ where: { customerName: { contains: "TESTWAVE" } } })
    await prisma.adherent.deleteMany({ where: { nom: "TESTWAVE" } })
  })

  it("refuse avant tout paiement, quel que soit le format du numéro", async () => {
    await registerAdhesionWaveFallback(draft)
    process.env.PAYDUNYA_MASTER_KEY ||= "test"
    process.env.PAYDUNYA_PRIVATE_KEY ||= "test"
    process.env.PAYDUNYA_TOKEN ||= "test"
    const { startAdhesionCheckoutFromDraft } = await import("@/lib/adhesion-checkout")
    for (const tel of ["+221770000123", "770000123", "77 000 01 23"]) {
      await expect(
        startAdhesionCheckoutFromDraft({ ...draft, tel, nom: "TESTWAVE", prenoms: "Autre" })
      ).rejects.toThrow("DUPLICATE_PHONE")
    }
    expect(await prisma.payment.count({ where: { customerName: "Autre TESTWAVE" } })).toBe(0)
  })
})
