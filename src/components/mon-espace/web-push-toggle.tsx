"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import {
  disableWebPush,
  enableWebPush,
  webPushConfigured,
  webPushStoredToken,
  webPushSupported,
} from "@/lib/push-web"

type View = "hidden" | "off" | "on" | "denied" | "ios-hint"

/** Réglage « notifications » de l'espace membre (PWA). Masqué si non configuré. */
export function WebPushToggle() {
  const [view, setView] = useState<View>("hidden")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Lecture de l'état du navigateur après le rendu (jamais côté serveur).
    const timer = setTimeout(() => {
      if (!webPushConfigured()) return
      if (!webPushSupported()) {
        // iPhone : l'API n'existe que dans le site installé sur l'écran d'accueil.
        if (/iphone|ipad/i.test(navigator.userAgent)) setView("ios-hint")
        return
      }
      if (Notification.permission === "denied") setView("denied")
      else setView(Notification.permission === "granted" && webPushStoredToken() ? "on" : "off")
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  if (view === "hidden") return null

  async function toggle() {
    if (busy) return
    setBusy(true)
    setError(null)
    if (view === "on") {
      await disableWebPush()
      setView("off")
    } else {
      const lang = document.documentElement.lang === "ar" ? "ar" : "fr"
      const res = await enableWebPush(lang)
      if (res.ok) setView("on")
      else if (res.reason === "denied") setView("denied")
      else setError("Activation impossible pour le moment. Réessayez plus tard.")
    }
    setBusy(false)
  }

  return (
    <div className="rounded-xl border border-[var(--ak-gold)]/50 bg-white p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-[var(--ak-emerald-deep)]">Notifications</p>
          <p className="mt-0.5 text-xs text-[var(--ak-ink-soft)]">
            {view === "denied"
              ? "Notifications bloquées : autorisez-les dans les réglages de votre navigateur pour ce site."
              : view === "ios-hint"
                ? "Sur iPhone, ajoutez d'abord ce site à l'écran d'accueil (Partager → Sur l'écran d'accueil), puis rouvrez-le depuis l'icône."
                : "Recevez les rappels de cotisation et les annonces de l'association."}
          </p>
        </div>
        {view === "off" || view === "on" ? (
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={busy}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-xs font-semibold disabled:opacity-60 ${
              view === "on"
                ? "border border-[var(--ak-emerald-deep)] text-[var(--ak-emerald-deep)]"
                : "bg-[var(--ak-emerald-deep)] text-white"
            }`}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : view === "on" ? <BellOff className="size-4" /> : <Bell className="size-4" />}
            {view === "on" ? "Désactiver" : "Activer"}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  )
}
