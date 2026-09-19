import { prisma } from "@/lib/db"
import { completeStoreOrderByToken } from "@/lib/store/checkout"
import { releaseCouponClaimForOrder } from "@/lib/store/coupon-claims"

const STALE_TIMEOUT_MS = 45 * 60 * 1000
const SWEEP_INTERVAL_MS = 10 * 60 * 1000
const BATCH_SIZE = 50

/**
 * Reprend les commandes PENDING/UNPAID abandonnées depuis plus de 45 min —
 * un panier dont le client n'est jamais revenu sur la page de confirmation
 * et pour lequel aucun webhook PayDunya n'est jamais arrivé laisserait sinon
 * le stock "reserved" bloqué indéfiniment (Audit Boutique §10).
 *
 * Pour chaque commande : tente d'abord une reconfirmation PayDunya sûre
 * (peut résoudre le vrai statut si personne n'a jamais redéclenché le poll
 * client) via la même completeStoreOrderByToken que le reste du parcours de
 * paiement — jamais de décision basée sur un statut supposé. Si la commande
 * est toujours PENDING ensuite (PayDunya répond encore "pending", ou aucune
 * facture n'a jamais été créée), force l'annulation et la libération du
 * stock — mêmes étapes que l'annulation manuelle admin
 * (api/store/admin/orders/[id]/route.ts), déclenchées par le temps plutôt
 * qu'un clic. Le CAS sur status: "PENDING" (au lieu de paymentStatus) est le
 * même que celui utilisé partout ailleurs pour ce champ, et empêche tout
 * double traitement si l'admin annule au même moment.
 */
export async function releaseStaleReservations() {
  const cutoff = new Date(Date.now() - STALE_TIMEOUT_MS)
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", paymentStatus: "UNPAID", createdAt: { lt: cutoff } },
    include: { items: true },
    take: BATCH_SIZE,
  })

  for (const order of stale) {
    if (order.paymentToken) {
      try {
        await completeStoreOrderByToken(order.paymentToken)
      } catch (e) {
        // Erreur réseau/API PayDunya : on ne force pas l'annulation sur une
        // incertitude, on retentera au prochain passage.
        console.error("reservation-cleanup: reconfirmation échouée", order.orderNumber, e)
        continue
      }
    }

    const claimed = await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    })
    // count === 0 : déjà traitée entre-temps (payée par la reconfirmation
    // ci-dessus, ou annulée par un admin) — rien à relâcher, déjà fait.
    if (claimed.count === 0) continue

    await releaseCouponClaimForOrder(order)

    for (const item of order.items) {
      if (!item.productId) continue
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { reserved: { decrement: item.quantity } },
        })
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { reserved: { decrement: item.quantity } },
        })
      }
      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          type: "RELEASE",
          quantity: item.quantity,
          reason: `Commande ${order.orderNumber} expirée — paiement jamais confirmé sous 45 min`,
          orderId: order.id,
        },
      })
    }
  }
}

let started = false

/** Démarre le balayage périodique — appelé une fois au démarrage du serveur (voir instrumentation.ts). */
export function startReservationCleanup() {
  if (started) return
  started = true
  const tick = () => {
    releaseStaleReservations().catch((e) =>
      console.error("reservation-cleanup: balayage échoué", e)
    )
  }
  tick()
  setInterval(tick, SWEEP_INTERVAL_MS).unref?.()
}
