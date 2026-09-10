import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { prisma } from "@/lib/db"
import { completeStoreOrderByToken } from "@/lib/store/checkout"
import { shippingLabelFor } from "@/features/store/shipping"
import { formatFcfa } from "@/lib/format"
import { buildMetadata } from "@/lib/seo"
import { ProductReviewForm } from "@/components/store/product-review-form"

export const metadata: Metadata = buildMetadata({
  title: "Votre commande",
  description: "Confirmation de commande Ahloul Khidmah Store.",
  path: "/boutique/commande",
  noIndex: true,
})

type Params = { params: Promise<{ id: string }> }

export default async function CommandePage({ params }: Params) {
  const { id } = await params

  let order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) notFound()

  if (order.paymentStatus === "UNPAID" && order.paymentToken) {
    try {
      const result = await completeStoreOrderByToken(order.paymentToken)
      if (result.order) order = result.order
    } catch {
      // laisser en attente — le poll côté client ou le webhook réessaieront
    }
  }
  if (!order) notFound()

  const paid = order.paymentStatus === "PAID"
  const cancelled = order.status === "CANCELLED"

  const reviewedProductIds = paid
    ? new Set(
        (
          await prisma.review.findMany({
            where: { orderId: order.id },
            select: { productId: true },
          })
        ).map((r) => r.productId)
      )
    : new Set<string>()
  const reviewableItems = paid
    ? order.items.filter((item, i, arr) => item.productId && arr.findIndex((o) => o.productId === item.productId) === i)
    : []

  return (
    <section className="mx-auto max-w-2xl px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div className="rounded-3xl bg-white p-6 shadow-[0_10px_40px_rgba(11,58,37,0.1)] md:p-10">
        <div className="flex flex-col items-center text-center">
          {paid ? (
            <CheckCircle2 className="size-12 text-emerald-600" aria-hidden />
          ) : cancelled ? (
            <XCircle className="size-12 text-red-500" aria-hidden />
          ) : (
            <Clock className="size-12 text-amber-500" aria-hidden />
          )}
          <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-ink)] md:text-3xl">
            {paid
              ? "Commande confirmée"
              : cancelled
                ? "Commande annulée"
                : "Paiement en attente"}
          </h1>
          <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
            {paid
              ? "Merci pour votre commande — elle sera préparée sous peu."
              : cancelled
                ? "Cette commande n'a pas été réglée. Votre panier n'a pas été débité."
                : "Votre paiement est en cours de confirmation. Cette page se met à jour automatiquement."}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-[var(--ak-gold)]/20 pt-4 text-sm">
          <span className="text-[var(--ak-ink-soft)]">Référence</span>
          <span className="font-semibold text-[var(--ak-ink)]">{order.orderNumber}</span>
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2 text-[var(--ak-ink-soft)]">
              <span>{item.productName} × {item.quantity}</span>
              <span>{formatFcfa(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-[var(--ak-gold)]/20 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--ak-ink-soft)]">Sous-total</span>
            <span>{formatFcfa(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Réduction{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-{formatFcfa(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--ak-ink-soft)]">
              Livraison{order.shippingZone ? ` — ${shippingLabelFor(order.shippingZone)}` : ""}
            </span>
            <span>{order.shippingCost === 0 ? "Gratuit" : formatFcfa(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-[var(--ak-emerald-deep)]">
            <span>Total</span>
            <span>{formatFcfa(order.total)}</span>
          </div>
        </div>

        {reviewableItems.length > 0 && (
          <div className="mt-8 space-y-3 border-t border-[var(--ak-gold)]/20 pt-6">
            <p className="text-sm font-semibold text-[var(--ak-ink)]">Votre avis compte</p>
            {reviewableItems.map((item) =>
              item.productId && !reviewedProductIds.has(item.productId) ? (
                <ProductReviewForm
                  key={item.productId}
                  orderId={order.id}
                  productId={item.productId}
                  productName={item.productName}
                />
              ) : (
                <p key={item.id} className="text-sm text-[var(--ak-ink-soft)]">
                  Merci pour votre avis sur {item.productName}.
                </p>
              )
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/boutique"
            className="rounded-2xl border border-[var(--ak-ink)]/15 px-5 py-3 text-center text-sm font-semibold text-[var(--ak-ink)] hover:bg-[var(--ak-ink)]/5"
          >
            Retour à la boutique
          </Link>
          {cancelled && (
            <Link
              href="/boutique/panier"
              className="ak-cta-solid rounded-2xl px-5 py-3 text-center text-sm font-semibold"
            >
              Réessayer
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
