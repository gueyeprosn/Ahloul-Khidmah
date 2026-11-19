import { describe, it, expect, beforeEach } from "vitest"
import { prisma } from "@/lib/db"
import { getMemberHistory, summarizeHistory } from "@/lib/member-history"
import { createAdherentFromForm } from "@/lib/adherents"

const base = {
  nom: "TESTHISTO",
  prenoms: "Awa",
  tel: "+221770000456",
  paysRegion: "Sénégal",
  montant: "1400",
}

async function clean() {
  await prisma.payment.deleteMany({ where: { customerName: { contains: "TESTHISTO" } } })
  await prisma.adherent.deleteMany({ where: { nom: "TESTHISTO" } })
}

describe("getMemberHistory", () => {
  beforeEach(clean)

  it("regroupe paiements, dons par téléphone et cotisations manuelles sans doublon", async () => {
    const a = await createAdherentFromForm(base, {
      mode: "light",
      status: "actif",
      allowCreateCellule: true,
    })
    // Adhésion payée en ligne + sa cotisation correspondante (même période)
    await prisma.payment.create({
      data: {
        type: "adhesion", periode: "2026-10", amount: 1400, status: "completed",
        adherentId: a.id, customerName: "Awa TESTHISTO",
      },
    })
    await prisma.cotisation.create({
      data: { adherentId: a.id, periode: "2026-10", montant: 1400, canal: "paydunya", statut: "paye", paidAt: new Date() },
    })
    // Cotisation saisie à la main (pas de paiement en ligne)
    await prisma.cotisation.create({
      data: { adherentId: a.id, periode: "2026-11", montant: 1400, canal: "wave", statut: "paye", paidAt: new Date() },
    })
    // Don fait avec le numéro, format différent, sans fiche rattachée
    await prisma.payment.create({
      data: { type: "don", amount: 5000, status: "completed", customerPhone: "77 000 04 56", customerName: "Awa TESTHISTO" },
    })
    // Don d'une autre personne : ne doit pas apparaître
    await prisma.payment.create({
      data: { type: "don", amount: 9999, status: "completed", customerPhone: "+221771111111", customerName: "Autre TESTHISTO" },
    })
    // Paiement en attente : listé mais non compté
    await prisma.payment.create({
      data: { type: "cotisation", periode: "2026-12", amount: 1400, status: "pending", adherentId: a.id, customerName: "Awa TESTHISTO" },
    })

    const h = await getMemberHistory(a.id)
    expect(h).not.toBeNull()
    const e = h!.entries
    expect(e).toHaveLength(4) // adhésion, cotisation wave, don, cotisation en attente
    expect(e.some((x) => x.amount === 9999)).toBe(false)
    expect(e.filter((x) => x.kind === "cotisation" && x.canal === "wave")).toHaveLength(1)
    const t = summarizeHistory(e)
    expect(t).toMatchObject({ adhesion: 1400, cotisation: 1400, don: 5000, all: 7800 })
  })

  it("renvoie null pour un membre inconnu", async () => {
    expect(await getMemberHistory("inconnu")).toBeNull()
  })
})
