"use client"

import { useEffect } from "react"

const RELOAD_FLAG = "ak_chunk_reload"

// Après chaque déploiement, les fichiers JS changent de nom. Un onglet resté
// ouvert depuis avant le déploiement peut essayer de charger un ancien
// fichier qui n'existe plus (page blanche, "This page couldn't load"). On
// détecte ce cas précis et on recharge automatiquement une seule fois,
// plutôt que de laisser la page cassée pour l'utilisateur.
function isChunkLoadError(message: unknown): boolean {
  if (typeof message !== "string") return false
  return /ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module/i.test(
    message
  )
}

export function ChunkErrorReload() {
  useEffect(() => {
    try {
      // La page vient de charger avec succès : on efface le drapeau d'un
      // éventuel rechargement précédent pour autoriser un futur recours.
      sessionStorage.removeItem(RELOAD_FLAG)
    } catch {
      /* stockage indisponible (navigation privée stricte) — sans conséquence */
    }

    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(RELOAD_FLAG) === "1") return
        sessionStorage.setItem(RELOAD_FLAG, "1")
      } catch {
        /* si le stockage échoue, on tente quand même un seul rechargement */
      }
      window.location.reload()
    }

    const onError = (e: ErrorEvent) => {
      if (isChunkLoadError(e.error?.message || e.message)) reloadOnce()
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason
      const message =
        reason instanceof Error ? reason.message : String(reason ?? "")
      if (isChunkLoadError(message)) reloadOnce()
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
