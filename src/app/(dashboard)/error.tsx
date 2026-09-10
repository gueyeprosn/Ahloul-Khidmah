"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E6DCC0] bg-white px-6 py-16 text-center">
      <p className="text-xs font-semibold tracking-[0.2em] text-[var(--ak-emerald-mid)] uppercase">
        Erreur
      </p>
      <h2 className="mt-3 text-xl font-semibold text-[var(--ak-emerald-deep)]">
        Une erreur est survenue
      </h2>
      <p className="mt-2 max-w-md text-sm text-[var(--ak-ink-soft)]">
        {error.message || "Impossible d’afficher cette page pour le moment."}
      </p>
      <Button
        className="mt-6 bg-[var(--ak-emerald-deep)] hover:bg-[var(--ak-emerald-mid)]"
        onClick={retry}
      >
        Réessayer
      </Button>
    </div>
  )
}
