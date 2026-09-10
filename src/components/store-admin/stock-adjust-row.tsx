"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { STOCK_ADJUST_REASONS } from "@/features/store/stock-reasons"

/** Raisons où l’on ajoute des unités (pas un stock absolu). */
const ADD_REASON_IDS = new Set(["reapprovisionnement", "retour", "precommande"])

export function StockAdjustRow({
  productId,
  variantId,
  currentStock,
}: {
  productId: string
  variantId: string | null
  currentStock: number
}) {
  const router = useRouter()
  const [reasonId, setReasonId] = useState("reapprovisionnement")
  const [qty, setQty] = useState("") // ajout OU nouveau stock selon la raison
  const [reasonOther, setReasonOther] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const isAddMode = ADD_REASON_IDS.has(reasonId)
  const isRupture = reasonId === "rupture"

  const parsedQty = useMemo(() => {
    const raw = qty.trim()
    if (raw === "") return null
    const n = Number(raw)
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null
    return n
  }, [qty])

  function resolveReason(): string | null {
    if (reasonId === "autre") {
      const custom = reasonOther.trim()
      return custom.length >= 2 ? custom : null
    }
    return STOCK_ADJUST_REASONS.find((r) => r.id === reasonId)?.label ?? null
  }

  const reasonOk = reasonId !== "autre" || reasonOther.trim().length >= 2

  const plan = useMemo(() => {
    if (isRupture) {
      if (currentStock === 0) return { ok: false as const, hint: "Stock déjà à 0" }
      return {
        ok: true as const,
        delta: -currentStock,
        next: 0,
        hint: `${currentStock} → 0`,
      }
    }
    if (parsedQty === null) {
      return {
        ok: false as const,
        hint: isAddMode ? "Indiquez la quantité à ajouter" : "Indiquez le nouveau stock",
      }
    }
    if (isAddMode) {
      if (parsedQty <= 0) {
        return { ok: false as const, hint: "La quantité à ajouter doit être > 0" }
      }
      return {
        ok: true as const,
        delta: parsedQty,
        next: currentStock + parsedQty,
        hint: `${currentStock} → ${currentStock + parsedQty} (+${parsedQty})`,
      }
    }
    if (parsedQty < 0) {
      return { ok: false as const, hint: "Le stock ne peut pas être négatif" }
    }
    if (parsedQty === currentStock) {
      return { ok: false as const, hint: "Identique au stock actuel — changez le chiffre" }
    }
    return {
      ok: true as const,
      delta: parsedQty - currentStock,
      next: parsedQty,
      hint: `${currentStock} → ${parsedQty} (${parsedQty - currentStock > 0 ? "+" : ""}${parsedQty - currentStock})`,
    }
  }, [isRupture, isAddMode, parsedQty, currentStock])

  const canSubmit = plan.ok && reasonOk && !loading

  async function submit() {
    const reason = resolveReason()
    if (!plan.ok || !reason) {
      setError(
        !reasonOk
          ? "Précisez la raison (Autre)"
          : "hint" in plan
            ? plan.hint
            : "Vérifiez la quantité"
      )
      return
    }

    setLoading(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch("/api/store/admin/inventory", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId,
          delta: plan.delta,
          reason,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || `Erreur ${res.status}`)
        return
      }
      setOkMsg(`Stock mis à jour : ${plan.next}`)
      setQty("")
      setOpen(false)
      router.refresh()
    } catch {
      setError("Erreur réseau — réessayez")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setReasonId("reapprovisionnement")
            setQty("")
            setReasonOther("")
            setError(null)
            setOkMsg(null)
            setOpen(true)
          }}
        >
          Ajuster
        </Button>
        {okMsg && <span className="text-[11px] text-emerald-700">{okMsg}</span>}
      </div>
    )
  }

  return (
    <div className="flex min-w-[16rem] flex-col gap-1.5 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={reasonId}
          onChange={(e) => {
            const next = e.target.value
            setReasonId(next)
            setError(null)
            if (next === "rupture") setQty("0")
            else if (ADD_REASON_IDS.has(next)) setQty("")
            else setQty(String(currentStock))
          }}
          aria-label="Raison"
          className="h-8 max-w-[12rem] rounded-md border border-input bg-background px-2 text-sm"
        >
          {STOCK_ADJUST_REASONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        {!isRupture && (
          <label className="flex items-center gap-1.5 text-xs text-[var(--ak-ink-soft)]">
            {isAddMode ? "Ajouter" : "Nouveau stock"}
            <Input
              type="number"
              min={isAddMode ? 1 : 0}
              step={1}
              inputMode="numeric"
              className="h-8 w-20"
              value={qty}
              placeholder={isAddMode ? "+ qty" : String(currentStock)}
              onChange={(e) => {
                setQty(e.target.value)
                setError(null)
              }}
              aria-label={isAddMode ? "Quantité à ajouter" : "Nouveau stock"}
            />
          </label>
        )}

        {reasonId === "autre" && (
          <Input
            placeholder="Précisez…"
            className="h-8 w-36"
            value={reasonOther}
            onChange={(e) => {
              setReasonOther(e.target.value)
              setError(null)
            }}
          />
        )}

        <Button
          type="button"
          size="sm"
          disabled={!canSubmit}
          onClick={submit}
          className="bg-[var(--ak-emerald-deep)] text-[var(--ak-ivory)] hover:bg-[var(--ak-emerald-mid)] disabled:opacity-50"
        >
          {loading ? "…" : "OK"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>

      <p className="text-[11px] text-[var(--ak-ink-soft)]">
        Actuel : <strong>{currentStock}</strong>
        {plan.ok ? ` → ${plan.hint}` : ` — ${plan.hint}`}
      </p>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
