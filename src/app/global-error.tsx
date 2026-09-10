"use client"

import { useEffect } from "react"
import "./globals.css"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="fr">
      <body className="min-h-full bg-[var(--ak-ivory)] font-sans text-[var(--ak-ink)] antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--ak-emerald-mid)] uppercase">
            Erreur
          </p>
          <h1 className="mt-3 text-xl font-semibold text-[var(--ak-emerald-deep)]">
            Une erreur est survenue
          </h1>
          <p className="mt-2 max-w-md text-sm text-[var(--ak-ink-soft)]">
            Le site a rencontré un problème inattendu. Ça arrive parfois juste
            après une mise à jour du site — recharger la page suffit
            généralement.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ak-emerald-mid)]"
          >
            Recharger la page
          </button>
        </div>
      </body>
    </html>
  )
}
