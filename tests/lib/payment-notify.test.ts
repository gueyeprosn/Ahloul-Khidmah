import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/db"

const notifyMember = vi.fn()
vi.mock("@/lib/push", () => ({ notifyMember: (...a: unknown[]) => notifyMember(...a) }))

import { notifyCotisationRecorded, notifyPaymentCompleted } from "@/lib/payment-notify"
import { createAdherentFromForm } from "@/lib/adherents"

const base = { nom: "TESTNOTIF", prenoms: "Awa", tel: "+221770000789", paysRegion: "Sénégal", montant: "1400" }

async function clean() {
  await prisma.payment.deleteMany({ where: { customerName: { contains: "TESTNOTIF" } } })
  await prisma.adherent.deleteMany({ where: { nom: "TESTNOTIF" } })
}

async function member() {
  return createAdherentFromForm(base, { mode: "light", status: "actif", allowCreateCellule: true })
}

describe("notifyPaymentCompleted", () => {
  beforeEach(async () => {
    notifyMember.mockReset()
    await clean()
  })

  it("cotisation confirmée : une notification, une seule fois, sans montant", async () => {
    const a = await member()
    const p = await prisma.payment.create({
      data: { type: "cotisation", periode: "2026-11", amount: 1400, status: "completed", adherentId: a.id, customerName: "Awa TESTNOTIF" },
    })
    await notifyPaymentCompleted(p.id)
    await notifyPaymentCompleted(p.id) // confirmation reçue deux fois (IPN + suivi d'écran)
    expect(notifyMember).toHaveBeenCalledTimes(1)
    const [id, content, opts] = notifyMember.mock.calls[0]
    expect(id).toBe(a.id)
    expect(content.fr.body).toContain("novembre 2026")
    expect(JSON.stringify(content)).not.toMatch(/1\s?400|FCFA/)
    expect(opts).toMatchObject({ route: "/t/cotisations", webPath: "/mon-espace/historique" })
  })

  it("deux confirmations simultanées : une seule notification", async () => {
    const a = await member()
    const p = await prisma.payment.create({
      data: { type: "cotisation", periode: "2026-11", amount: 1400, status: "completed", adherentId: a.id, customerName: "Awa TESTNOTIF" },
    })
    await Promise.all([notifyPaymentCompleted(p.id), notifyPaymentCompleted(p.id), notifyPaymentCompleted(p.id)])
    expect(notifyMember).toHaveBeenCalledTimes(1)
  })

  it("adhésion → carte ; don → accueil", async () => {
    const a = await member()
    const adh = await prisma.payment.create({
      data: { type: "adhesion", periode: "2026-11", amount: 1400, status: "completed", adherentId: a.id, customerName: "Awa TESTNOTIF" },
    })
    const don = await prisma.payment.create({
      data: { type: "don", amount: 5000, status: "completed", adherentId: a.id, customerName: "Awa TESTNOTIF" },
    })
    await notifyPaymentCompleted(adh.id)
    await notifyPaymentCompleted(don.id)
    expect(notifyMember.mock.calls[0][2]).toMatchObject({ route: "/card" })
    expect(notifyMember.mock.calls[1][2]).toMatchObject({ route: "/t/home" })
    expect(notifyMember.mock.calls[1][1].ar.title).toBeTruthy()
  })

  it("rien si le paiement n'est pas confirmé ou sans membre rattaché", async () => {
    const a = await member()
    const pending = await prisma.payment.create({
      data: { type: "cotisation", periode: "2026-11", amount: 1400, status: "pending", adherentId: a.id, customerName: "Awa TESTNOTIF" },
    })
    const anon = await prisma.payment.create({
      data: { type: "don", amount: 2000, status: "completed", customerName: "Anon TESTNOTIF" },
    })
    await notifyPaymentCompleted(pending.id)
    await notifyPaymentCompleted(anon.id)
    expect(notifyMember).not.toHaveBeenCalled()
    // En attente, le marqueur n'est pas posé : la future confirmation pourra notifier.
    expect((await prisma.payment.findUnique({ where: { id: pending.id } }))?.pushNotifiedAt).toBeNull()
  })

  it("ne lève jamais, même si l'envoi échoue", async () => {
    const a = await member()
    notifyMember.mockRejectedValue(new Error("FCM en panne"))
    const p = await prisma.payment.create({
      data: { type: "don", amount: 1000, status: "completed", adherentId: a.id, customerName: "Awa TESTNOTIF" },
    })
    await expect(notifyPaymentCompleted(p.id)).resolves.toBeUndefined()
  })

  it("cotisation saisie à la main : notification avec le mois", async () => {
    const a = await member()
    await notifyCotisationRecorded(a.id, "2026-10")
    expect(notifyMember.mock.calls[0][1].fr.body).toContain("octobre 2026")
  })
})
