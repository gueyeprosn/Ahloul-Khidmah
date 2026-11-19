"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, HandCoins, Loader2 } from "lucide-react"
import { CONTRIBUTION_AMOUNTS } from "@/features/contributions/schema"
import { PaymentUnavailableDialog } from "@/components/payments/payment-unavailable-dialog"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { cn } from "@/lib/utils"

type Props = {
  /** Prénom ou nom complet du membre connecté, pour le message d'accueil. */
  memberName?: string | null
  className?: string
  /** Titre affiché au-dessus du choix du montant (masquer dans un bloc qui a déjà son titre). */
  hideTitle?: boolean
}

function fmt(n: number) {
  return `${new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ")} FCFA`
}

/**
 * Contribution d'un MEMBRE CONNECTÉ : il ne choisit que le montant. Nom,
 * téléphone et coordonnées sont ceux de sa fiche, lus par le serveur (jamais
 * saisis ni envoyés par le navigateur).
 */
export function MemberContributeForm({ memberName, className, hideTitle = false }: Props) {
  const router = useRouter()
  const [montant, setMontant] = useState<string>("10000")
  const [autre, setAutre] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [pay, setPay] = useState<{ paymentId: string; phone: string } | null>(null)
  const [done, setDone] = useState(false)

  const autreNumber = Number(autre.replace(/\s/g, ""))
  const amountValue =
    montant === "autre" ? (Number.isFinite(autreNumber) ? autreNumber : 0) : Number(montant)
  const valid = amountValue >= 500

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !valid) return
    ;(document.activeElement as HTMLElement | null)?.blur()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/mon-espace/contribution", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant, montantAutre: montant === "autre" ? autre : "" }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        paymentId?: string
        phone?: string
      }
      if (res.status === 503) {
        setUnavailable(data.error || "Paiement indisponible")
        return
      }
      if (res.status === 401) {
        setError("Votre session a expiré. Reconnectez-vous depuis « Mon espace ».")
        return
      }
      if (!res.ok || !data.paymentId) {
        setError(data.error || "Contribution impossible pour le moment. Réessayez.")
        return
      }
      setPay({ paymentId: data.paymentId, phone: data.phone || "" })
    } catch {
      setError("Erreur réseau. Réessayez.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className={cn("space-y-4 text-center", className)}>
        <CheckCircle2 className="mx-auto size-12 text-[var(--ak-emerald-mid)]" aria-hidden />
        <div>
          <p className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Merci{memberName ? `, ${memberName.split(" ")[0]}` : ""} !
          </p>
          <p className="mt-1 text-sm text-[var(--ak-ink-soft)]">
            Votre contribution est enregistrée. Vous la retrouverez dans votre historique.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/mon-espace/historique"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--ak-emerald-deep)] px-5 text-sm font-semibold text-white"
          >
            Voir mon historique
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(false)
              setPay(null)
            }}
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--ak-emerald-deep)] px-5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
          >
            Contribuer à nouveau
          </button>
        </div>
      </div>
    )
  }

  if (pay) {
    return (
      <div className={cn("space-y-3", className)}>
        <p className="text-center text-sm font-medium text-[var(--ak-emerald-deep)]">
          Contribution de {fmt(amountValue)} — choisissez votre moyen de paiement
        </p>
        <SoftPayPanel
          paymentId={pay.paymentId}
          defaultPhone={pay.phone}
          compact
          hideHeader
          onCompleted={() => {
            setDone(true)
            router.refresh()
          }}
        />
        <button
          type="button"
          onClick={() => setPay(null)}
          className="mx-auto block text-xs text-[var(--ak-ink-soft)] underline"
        >
          Changer le montant
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={cn("space-y-4", className)} noValidate>
      <PaymentUnavailableDialog message={unavailable} onClose={() => setUnavailable(null)} />

      {!hideTitle ? (
        <div className="text-center">
          <HandCoins className="mx-auto size-8 text-[var(--ak-emerald-mid)]" aria-hidden />
          <h3 className="mt-2 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Contribuer
          </h3>
          <p className="mt-1 text-sm text-[var(--ak-ink-soft)]">
            {memberName ? `${memberName}, c` : "C"}hoisissez un montant : vos informations sont déjà
            renseignées.
          </p>
        </div>
      ) : null}

      <fieldset>
        <legend className="sr-only">Montant de la contribution</legend>
        <div className="grid grid-cols-2 gap-2">
          {CONTRIBUTION_AMOUNTS.map((a) => {
            const active = montant === a.value
            return (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMontant(a.value)}
                className={cn(
                  "min-h-12 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all",
                  a.value === "autre" && "col-span-2",
                  active
                    ? "border-[var(--ak-emerald-mid)] bg-[#E7F0EA] text-[var(--ak-emerald-deep)]"
                    : "border-[#E6DCC0] bg-[var(--ak-ivory)] text-[var(--ak-ink)] hover:border-[var(--ak-gold)]"
                )}
              >
                {a.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {montant === "autre" ? (
        <div>
          <label htmlFor="member-contrib-autre" className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]">
            Votre montant (minimum 500 FCFA)
          </label>
          <input
            id="member-contrib-autre"
            inputMode="numeric"
            autoComplete="off"
            value={autre}
            onChange={(e) => setAutre(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder="Ex. 15000"
            className="w-full rounded-xl border border-[#DED2AE] bg-white px-4 py-3 text-base outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
          />
        </div>
      ) : null}

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <button
        type="submit"
        disabled={busy || !valid}
        className="ak-cta-solid flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <HandCoins className="size-5" />}
        {valid ? `Contribuer ${fmt(amountValue)}` : "Choisissez un montant"}
      </button>
    </form>
  )
}
