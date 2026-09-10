"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

const fetchOpts: RequestInit = { credentials: "same-origin" }

type Props = {
  /** Appelé une fois le PIN enregistré avec succès. */
  onSaved?: () => void
  /** Appelé si la session a expiré pendant l'enregistrement. */
  onSessionExpired?: () => void
  compact?: boolean
  /** Focalise le premier champ au montage (ex. popup post-paiement). */
  autoFocus?: boolean
}

/**
 * Formulaire de choix du code PIN — extrait de mon-espace-client.tsx pour
 * être réutilisé à la fois dans l'onglet "Mon profil" et dans le popup de
 * remerciement post-paiement (src/components/payments/post-payment-celebration.tsx).
 * Repose sur la session mon-espace déjà ouverte (cookie) — pas de paymentId
 * ici, /api/mon-espace/pin lit la session comme partout ailleurs.
 */
export function PinSetupForm({
  onSaved,
  onSessionExpired,
  compact,
  autoFocus,
}: Props) {
  const [pin, setPin] = useState("")
  const [pinConfirm, setPinConfirm] = useState("")
  const [pinSaving, setPinSaving] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinMessage, setPinMessage] = useState<string | null>(null)
  const pinInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) pinInputRef.current?.focus()
  }, [autoFocus])

  async function onSavePin(e: React.FormEvent) {
    e.preventDefault()
    setPinError(null)
    setPinMessage(null)
    setPinSaving(true)
    try {
      const res = await fetch("/api/mon-espace/pin", {
        ...fetchOpts,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, pinConfirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          setPinError("Session expirée — reconnectez-vous pour créer un PIN.")
          onSessionExpired?.()
          return
        }
        setPinError(
          typeof data.error === "string" ? data.error : "Enregistrement impossible."
        )
        return
      }
      setPin("")
      setPinConfirm("")
      setPinMessage(
        "Code PIN enregistré — utilisez-le dès votre prochaine connexion."
      )
      onSaved?.()
    } catch {
      setPinError("Impossible de contacter le serveur.")
    } finally {
      setPinSaving(false)
    }
  }

  return (
    <form
      id="pin-form"
      onSubmit={onSavePin}
      className={
        compact
          ? "space-y-3"
          : "space-y-3 rounded-xl border border-[var(--ak-gold)]/30 bg-white p-4"
      }
    >
      <div>
        <p className="text-sm font-medium text-[var(--ak-emerald-deep)]">
          Code d&apos;accès (PIN)
        </p>
        <p className="mt-0.5 text-xs text-[var(--ak-ink-soft)]">
          Choisissez un code à 4 chiffres pour vous connecter plus
          simplement. Les 4 derniers caractères du N° badge restent aussi
          valables.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]">
            Nouveau code (4 chiffres)
          </label>
          <input
            ref={pinInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="\d{4}"
            maxLength={4}
            required
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 text-center font-mono text-lg tracking-[0.5em] outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]">
            Confirmer le code
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="new-password"
            pattern="\d{4}"
            maxLength={4}
            required
            value={pinConfirm}
            onChange={(e) =>
              setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 text-center font-mono text-lg tracking-[0.5em] outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
          />
        </div>
      </div>
      {pinError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {pinError}
        </p>
      ) : null}
      {pinMessage ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {pinMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pinSaving || pin.length !== 4 || pinConfirm.length !== 4}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-[var(--ak-emerald-deep)] disabled:opacity-60"
      >
        {pinSaving ? <Loader2 className="size-4 animate-spin" /> : null}
        Enregistrer ce code
      </button>
    </form>
  )
}
