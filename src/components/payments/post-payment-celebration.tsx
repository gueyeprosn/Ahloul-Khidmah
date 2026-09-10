"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, X } from "lucide-react"
import { PinSetupForm } from "@/components/mon-espace/pin-setup-form"

type Props = {
  paymentId: string
  kind: "adhesion" | "don"
  onClose: () => void
}

type Phase = "loading" | "result"

/**
 * Popup de remerciement affiché juste après un paiement confirmé (adhésion
 * ou don), sans quitter la page — remplace la redirection vers
 * /paiement/retour quand SoftPayPanel détecte la confirmation en direct.
 * Tente automatiquement d'ouvrir la session mon-espace (comme
 * ClaimMonEspaceButton) : si un adhérent a été rattaché à ce paiement
 * (toujours pour une adhésion ; pour un don, seulement si un téléphone a
 * été renseigné — voir ensureAdherentFromContribution), propose
 * directement le choix du code PIN.
 */
export function PostPaymentCelebration({ paymentId, kind, onClose }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("loading")
  const [claimed, setClaimed] = useState(false)
  const [pinDone, setPinDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Le paiement est déjà confirmé à ce stade — ce délai est purement
    // pour l'effet visuel (éviter un popup qui "saute" directement au
    // résultat), pas une vraie attente technique.
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/mon-espace/claim-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ paymentId }),
        })
        if (!cancelled && res.ok) {
          setClaimed(true)
          router.refresh()
        }
      } catch {
        /* pas grave : le paiement a déjà réussi, le popup reste utile
           même sans session ouverte automatiquement */
      } finally {
        if (!cancelled) setPhase("result")
      }
    }, 900)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [paymentId, router])

  function close() {
    router.refresh()
    onClose()
  }

  const title =
    kind === "adhesion" ? "Adhésion confirmée" : "Contribution confirmée"
  const message =
    kind === "adhesion"
      ? "Merci pour votre adhésion à Ahloul Khidmah."
      : claimed
        ? "Merci pour votre don — il vous donne aussi accès à votre espace membre."
        : "Merci pour votre don."

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-6 text-center shadow-2xl md:p-8">
        {phase === "result" ? (
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="absolute top-3 right-3 rounded-full p-1.5 text-[var(--ak-ink-soft)] hover:bg-black/5"
          >
            <X className="size-5" />
          </button>
        ) : null}

        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
          {phase === "loading" ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <CheckCircle2 className="size-7" />
          )}
        </div>

        {phase === "loading" ? (
          <p className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)] md:text-2xl">
            Confirmation en cours…
          </p>
        ) : (
          <>
            <h2 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)] md:text-2xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">{message}</p>

            {claimed && !pinDone ? (
              <div className="mt-6 text-start">
                <PinSetupForm
                  autoFocus
                  onSaved={() => setPinDone(true)}
                  onSessionExpired={() => setClaimed(false)}
                />
              </div>
            ) : null}

            {claimed && pinDone ? (
              <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Code enregistré — votre espace membre est prêt.
              </p>
            ) : null}

            <button
              type="button"
              onClick={close}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--ak-emerald-mid)]"
            >
              {claimed && !pinDone ? "Plus tard" : "Fermer"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
