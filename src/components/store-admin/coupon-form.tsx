"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"

export type CouponFormValues = {
  code: string
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"
  value: number
  startsAt: string
  endsAt: string
  minOrderAmount: number
  maxUses: number | null
  usesPerCustomer: number | null
  active: boolean
  membersOnly: boolean
}

const EMPTY: CouponFormValues = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  startsAt: "",
  endsAt: "",
  minOrderAmount: 0,
  maxUses: null,
  usesPerCustomer: null,
  active: true,
  membersOnly: false,
}

export function CouponForm({
  mode,
  couponId,
  initial,
}: {
  mode: "create" | "edit"
  couponId?: string
  initial?: Partial<CouponFormValues>
}) {
  const router = useRouter()
  const [values, setValues] = useState<CouponFormValues>({ ...EMPTY, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const url = mode === "create" ? "/api/store/admin/coupons" : `/api/store/admin/coupons/${couponId}`
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          startsAt: values.startsAt || undefined,
          endsAt: values.endsAt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de l'enregistrement")
        setSubmitting(false)
        return
      }
      if (mode === "create") {
        router.push(`/admin/boutique/coupons/${data.coupon.id}`)
      } else {
        router.refresh()
      }
    } catch {
      setError("Erreur réseau")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cf-code">Code</Label>
          <Input
            id="cf-code"
            required
            value={values.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="EX. BIENVENUE10"
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-type">Type</Label>
          <select
            id="cf-type"
            value={values.type}
            onChange={(e) => set("type", e.target.value as CouponFormValues["type"])}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          >
            <option value="PERCENTAGE">Pourcentage</option>
            <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
            <option value="FREE_SHIPPING">Livraison gratuite</option>
          </select>
        </div>
      </div>

      {values.type !== "FREE_SHIPPING" && (
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="cf-value">
            {values.type === "PERCENTAGE" ? "Pourcentage (1-100)" : "Montant (FCFA)"}
          </Label>
          <Input
            id="cf-value"
            required
            type="number"
            min={values.type === "PERCENTAGE" ? 1 : 0}
            max={values.type === "PERCENTAGE" ? 100 : undefined}
            value={values.value}
            onChange={(e) => set("value", Number(e.target.value))}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cf-starts">Début (optionnel)</Label>
          <Input
            id="cf-starts"
            type="datetime-local"
            value={values.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-ends">Fin (optionnel)</Label>
          <Input
            id="cf-ends"
            type="datetime-local"
            value={values.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cf-min">Montant minimum (FCFA)</Label>
          <Input
            id="cf-min"
            type="number"
            min={0}
            value={values.minOrderAmount}
            onChange={(e) => set("minOrderAmount", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-maxuses">Utilisation max (total, vide = illimité)</Label>
          <Input
            id="cf-maxuses"
            type="number"
            min={1}
            value={values.maxUses ?? ""}
            onChange={(e) => set("maxUses", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cf-percustomer">Utilisation par client (vide = illimité)</Label>
          <Input
            id="cf-percustomer"
            type="number"
            min={1}
            value={values.usesPerCustomer ?? ""}
            onChange={(e) => set("usesPerCustomer", e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.active} onCheckedChange={(v) => set("active", Boolean(v))} />
          Actif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.membersOnly} onCheckedChange={(v) => set("membersOnly", Boolean(v))} />
          Réservé aux membres connectés
        </label>
      </div>

      {error && <InlineMessage message={error} />}

      <Button type="submit" disabled={submitting} className="bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]">
        {submitting ? "Enregistrement…" : mode === "create" ? "Créer le coupon" : "Enregistrer"}
      </Button>
    </form>
  )
}
