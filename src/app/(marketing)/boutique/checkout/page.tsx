"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IdCard, Package } from "lucide-react"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { useCart } from "@/components/store/cart-provider"
import { SHIPPING_ZONES } from "@/features/store/shipping"
import { formatFcfa } from "@/lib/format"

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [shippingZone, setShippingZone] = useState<string>(SHIPPING_ZONES[0].value)
  const [addressLine1, setAddressLine1] = useState("")
  const [addressCity, setAddressCity] = useState("")
  const [addressLandmark, setAddressLandmark] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  // Verrou synchrone — setSubmitting(true) seul ne suffit pas : son effet sur
  // le bouton n'est visible qu'au rendu suivant, laissant une fenêtre où un
  // double-clic très rapide (ou Entrée + clic) peut déclencher deux
  // créations de commande avant que le bouton ne se désactive réellement.
  const submittingRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [memberName, setMemberName] = useState<string | null>(null)

  const [couponInput, setCouponInput] = useState("")
  const [couponChecking, setCouponChecking] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    freeShipping: boolean
  } | null>(null)

  const needsAddress = shippingZone !== "retrait"

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/mon-espace/me", { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data?.member) return
        const m = data.member as {
          name?: string
          prenoms?: string
          nom?: string
          tel?: string
          email?: string
          zoneRegion?: string
        }
        setMemberName(m.name || `${m.prenoms ?? ""} ${m.nom ?? ""}`.trim() || "membre")
        setCustomerName((prev) => prev || m.name || `${m.prenoms ?? ""} ${m.nom ?? ""}`.trim())
        setCustomerPhone((prev) => prev || m.tel || "")
        setCustomerEmail((prev) => prev || m.email || "")
        if (m.zoneRegion) setAddressCity((prev) => prev || m.zoneRegion || "")
      } catch {
        /* session absente — checkout anonyme OK */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const baseShippingCost = useMemo(
    () => SHIPPING_ZONES.find((z) => z.value === shippingZone)?.cost ?? 0,
    [shippingZone]
  )
  const shippingCost = appliedCoupon?.freeShipping ? 0 : baseShippingCost
  const discount = appliedCoupon?.discountAmount ?? 0
  const total = Math.max(subtotal + shippingCost - discount, 0)

  async function handleApplyCoupon() {
    if (!couponInput.trim() || customerPhone.trim().length < 8) return
    setCouponChecking(true)
    setCouponError(null)
    try {
      const res = await fetch("/api/store/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: couponInput.trim(), subtotal, customerPhone }),
      })
      const data = await res.json()
      if (!data.valid) {
        setCouponError(data.error || "Code invalide")
        setAppliedCoupon(null)
        return
      }
      setAppliedCoupon({
        code: couponInput.trim().toUpperCase(),
        discountAmount: data.discountAmount,
        freeShipping: data.freeShipping,
      })
    } catch {
      setCouponError("Erreur réseau — réessayez")
    } finally {
      setCouponChecking(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput("")
    setCouponError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) return
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          shippingZone,
          shippingAddress: needsAddress
            ? {
                line1: addressLine1,
                city: addressCity,
                landmark: addressLandmark || undefined,
              }
            : undefined,
          notes: notes || undefined,
          couponCode: appliedCoupon?.code || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Impossible de créer la commande")
        submittingRef.current = false
        setSubmitting(false)
        return
      }
      clear()
      setOrderId(data.orderId)
    } catch {
      setError("Erreur réseau — réessayez")
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (items.length === 0 && !orderId) {
    return (
      <section className="mx-auto max-w-4xl px-5 pt-28 pb-20 text-center md:px-8 md:pt-36">
        <Package className="mx-auto size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
        <p className="mt-4 text-[var(--ak-ink-soft)]">Votre panier est vide.</p>
        <Link href="/boutique" className="ak-cta-solid mt-4 inline-flex rounded-2xl px-5 py-3 text-sm font-semibold">
          Découvrir la boutique
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-4xl px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ink-soft)]">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:underline">Accueil</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/boutique" className="hover:underline">Boutique</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/boutique/panier" className="hover:underline">Panier</Link></li>
          <li aria-hidden>/</li>
          <li className="text-[var(--ak-ink)]">Commande</li>
        </ol>
      </nav>

      <h1 className="font-[family-name:var(--font-amiri)] text-3xl text-[var(--ak-ink)] md:text-4xl">
        Finaliser ma commande
      </h1>

      {orderId ? (
        <div className="mt-8 max-w-md">
          <SoftPayPanel
            paymentId={orderId}
            defaultPhone={customerPhone}
            softpayEndpoint={(id) => `/api/store/orders/${id}/softpay`}
            statusEndpoint={(id) => `/api/store/orders/${id}/status`}
            retourUrl={(id) => `/boutique/commande/${id}`}
            onCompleted={() => router.push(`/boutique/commande/${orderId}`)}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-[0_4px_20px_rgba(11,58,37,0.08)]">
            {memberName ? (
              <div className="flex items-start gap-3 rounded-xl border border-[var(--ak-gold)]/35 bg-[var(--ak-ivory)] px-3 py-3 text-sm">
                <IdCard className="mt-0.5 size-4 shrink-0 text-[var(--ak-emerald-deep)]" aria-hidden />
                <p className="text-[var(--ak-ink)]">
                  Connecté en tant que <strong>{memberName}</strong> — vos infos sont préremplies.
                  Les codes promo membres s&apos;appliquent automatiquement.
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 py-2.5 text-sm text-[var(--ak-ink-soft)]">
                Membre Ahloul Khidmah ?{" "}
                <Link href="/mon-espace" className="font-medium text-[var(--ak-emerald-deep)] underline-offset-2 hover:underline">
                  Connectez-vous
                </Link>{" "}
                pour préremplir et accéder aux offres réservées.
              </p>
            )}

            <div>
              <label className="text-sm font-medium text-[var(--ak-ink)]">
                Nom complet
                <input
                  required
                  minLength={2}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                  placeholder="Prénom Nom"
                />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--ak-ink)]">
                Téléphone
                <input
                  required
                  minLength={8}
                  type="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                  placeholder="77 123 45 67"
                />
              </label>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--ak-ink)]">
                Email (optionnel)
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-[var(--ak-ink)]">Livraison</p>
              <div className="mt-2 space-y-2">
                {SHIPPING_ZONES.map((zone) => (
                  <label
                    key={zone.value}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3 py-2.5 text-sm ${
                      shippingZone === zone.value
                        ? "border-[var(--ak-emerald-mid)] bg-[var(--ak-ivory)]"
                        : "border-[#E6DCC0]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="shippingZone"
                        checked={shippingZone === zone.value}
                        onChange={() => setShippingZone(zone.value)}
                      />
                      {zone.label}
                    </span>
                    <span className="font-medium">
                      {zone.cost === 0 ? "Gratuit" : formatFcfa(zone.cost)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {needsAddress && (
              <div className="space-y-3 rounded-xl border border-[#E6DCC0] bg-[var(--ak-ivory)]/60 p-3">
                <p className="text-sm font-medium text-[var(--ak-ink)]">Adresse de livraison</p>
                <label className="block text-sm text-[var(--ak-ink)]">
                  Rue / quartier
                  <input
                    required
                    minLength={3}
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                    placeholder="Ex. Sicap Liberté 6, villa 12"
                  />
                </label>
                <label className="block text-sm text-[var(--ak-ink)]">
                  Ville
                  <input
                    required
                    minLength={2}
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                    placeholder="Dakar"
                  />
                </label>
                <label className="block text-sm text-[var(--ak-ink)]">
                  Point de repère (optionnel)
                  <input
                    value={addressLandmark}
                    onChange={(e) => setAddressLandmark(e.target.value)}
                    className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                    placeholder="Près de la mosquée…"
                  />
                </label>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[var(--ak-ink)]">
                Message (optionnel)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                  placeholder="Précision sur la livraison, horaires…"
                />
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="ak-cta-solid w-full rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Création de la commande…" : "Continuer vers le paiement"}
            </button>
          </form>

          <div className="h-fit rounded-2xl border border-[var(--ak-gold)]/30 bg-[var(--ak-ivory)] p-5">
            <p className="text-sm font-semibold text-[var(--ak-ink)]">Récapitulatif</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ak-ink-soft)]">
              {items.map((i) => (
                <li key={`${i.productId}-${i.variantId ?? "base"}`} className="flex justify-between gap-2">
                  <span>
                    {i.name}
                    {i.variantLabel ? ` (${i.variantLabel})` : ""} × {i.quantity}
                  </span>
                  <span>{formatFcfa(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-[var(--ak-gold)]/20 pt-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="font-medium text-[var(--ak-emerald-deep)]">
                    Code {appliedCoupon.code} appliqué
                  </span>
                  <button type="button" onClick={removeCoupon} className="text-xs text-[var(--ak-ink-soft)] underline-offset-2 hover:underline">
                    Retirer
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Code promo"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-[#E6DCC0] bg-white px-3 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
                  />
                  <button
                    type="button"
                    disabled={couponChecking || !couponInput.trim() || customerPhone.trim().length < 8}
                    onClick={handleApplyCoupon}
                    className="rounded-lg bg-[var(--ak-emerald-deep)] px-3 text-sm font-medium text-[var(--ak-ivory)] disabled:opacity-50"
                  >
                    {couponChecking ? "…" : "Appliquer"}
                  </button>
                </div>
              )}
              {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
              {!appliedCoupon && customerPhone.trim().length < 8 && (
                <p className="mt-1.5 text-xs text-[var(--ak-ink-soft)]">Renseignez votre téléphone pour appliquer un code.</p>
              )}
            </div>

            <div className="mt-4 space-y-1 border-t border-[var(--ak-gold)]/20 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--ak-ink-soft)]">Sous-total</span>
                <span>{formatFcfa(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Réduction</span>
                  <span>-{formatFcfa(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--ak-ink-soft)]">Livraison</span>
                <span>{shippingCost === 0 ? "Gratuit" : formatFcfa(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-[var(--ak-emerald-deep)]">
                <span>Total</span>
                <span>{formatFcfa(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
