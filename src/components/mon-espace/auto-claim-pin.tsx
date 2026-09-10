"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { PinSetupForm } from "@/components/mon-espace/pin-setup-form"

/**
 * Utilisé sur /paiement/retour (le visiteur a quitté puis est revenu sur le
 * site — le cas "reste sur la page" est géré par PostPaymentCelebration à
 * la place). Ouvre automatiquement la session mon-espace, puis affiche le
 * choix du PIN directement sur cette même page.
 */
export function AutoClaimPin({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [state, setState] = useState<"claiming" | "claimed" | "failed">(
    "claiming"
  )
  const [pinDone, setPinDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/mon-espace/claim-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ paymentId }),
        })
        if (cancelled) return
        if (res.ok) {
          setState("claimed")
          router.refresh()
        } else {
          setState("failed")
        }
      } catch {
        if (!cancelled) setState("failed")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [paymentId, router])

  if (state === "claiming") {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-[var(--ak-ink-soft)]">
        <Loader2 className="size-4 animate-spin text-[var(--ak-emerald-deep)]" />
        Ouverture de votre espace membre…
      </div>
    )
  }

  if (state === "failed") {
    return (
      <Link
        href="/mon-espace"
        className="inline-flex w-full items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-white"
      >
        Accéder à mon espace membre
      </Link>
    )
  }

  if (pinDone) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        Code enregistré — votre espace membre est prêt.
      </p>
    )
  }

  return (
    <div className="text-start">
      <PinSetupForm autoFocus onSaved={() => setPinDone(true)} />
    </div>
  )
}
