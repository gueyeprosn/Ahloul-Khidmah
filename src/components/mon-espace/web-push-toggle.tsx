"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, BellRing, CheckCircle2, Loader2 } from "lucide-react"
import {
  disableWebPush,
  enableWebPush,
  refreshWebPushRegistration,
  webPushConfigured,
  webPushStoredToken,
  webPushSupported,
} from "@/lib/push-web"

type View = "hidden" | "off" | "on" | "denied" | "ios-hint"

/**
 * - `card` (défaut) : petit réglage activer / désactiver.
 * - `prominent` : invitation bien visible (après une adhésion ou un paiement).
 * - `banner` : invitation visible au premier passage, avec « Plus tard » ;
 *   revient ensuite en simple carte.
 */
type Variant = "card" | "prominent" | "banner"

const LATER_KEY = "ak_push_later"
const LATER_DAYS = 3

const BENEFITS = [
  "Les annonces et actualités de l'association",
  "Les rappels de cotisation",
  "La confirmation de vos paiements et les informations importantes",
]

function postponed() {
  try {
    const t = Number(localStorage.getItem(LATER_KEY))
    return Number.isFinite(t) && t > 0 && Date.now() - t < LATER_DAYS * 24 * 3600 * 1000
  } catch {
    return false
  }
}

/** Réglage « notifications » de l'espace membre (PWA). Masqué si non configuré. */
export function WebPushToggle({ variant = "card" }: { variant?: Variant }) {
  const [view, setView] = useState<View>("hidden")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [later, setLater] = useState(true)
  const [justEnabled, setJustEnabled] = useState(false)

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
      else if (Notification.permission === "granted" && webPushStoredToken()) {
        setView("on")
        // Rattache ce navigateur au membre connecté (idempotent côté serveur).
        void refreshWebPushRegistration(document.documentElement.lang === "ar" ? "ar" : "fr")
      } else setView("off")
      setLater(postponed())
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
      if (res.ok) {
        setView("on")
        setJustEnabled(true)
      }
      else if (res.reason === "denied") setView("denied")
      else setError("Activation impossible pour le moment. Réessayez plus tard.")
    }
    setBusy(false)
  }

  function postpone() {
    try {
      localStorage.setItem(LATER_KEY, String(Date.now()))
    } catch {
      /* stockage indisponible : on masque seulement pour cette visite */
    }
    setLater(true)
  }

  const showInvite =
    (variant === "prominent" || (variant === "banner" && !later)) &&
    (view === "off" || view === "ios-hint" || view === "denied" || justEnabled)

  if (showInvite) {
    return (
      <div
        role="region"
        aria-label="Activer les notifications"
        className="rounded-2xl border-2 border-[var(--ak-gold)] bg-[#FFF9E8] p-5 text-start shadow-sm"
      >
        {justEnabled && view === "on" ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-700" aria-hidden />
            <div>
              <p className="font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-emerald-deep)]">
                Notifications activées
              </p>
              <p className="mt-0.5 text-sm text-[var(--ak-ink-soft)]">
                Vous recevrez ici les annonces, vos rappels et vos confirmations. Une notification de
                bienvenue vient de vous être envoyée : touchez-la pour voir votre badge.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
                <BellRing className="size-5" aria-hidden />
              </span>
              <p className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
                Restez informé
              </p>
            </div>
            <p className="mt-3 text-sm text-[var(--ak-ink)]">
              Activez les notifications pour recevoir :
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--ak-ink-soft)]">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>

            {view === "denied" ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages de votre
                navigateur (icône à gauche de l&apos;adresse), puis rechargez la page.
              </p>
            ) : view === "ios-hint" ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Sur iPhone : touchez <strong>Partager</strong>, puis <strong>Sur l&apos;écran d&apos;accueil</strong>,
                et rouvrez le site depuis son icône. Les notifications pourront alors être activées.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void toggle()}
                disabled={busy}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 text-base font-semibold text-white shadow-sm transition hover:bg-[var(--ak-emerald-mid)] focus-visible:ring-4 focus-visible:ring-[var(--ak-emerald-mid)]/40 focus-visible:outline-none disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-5 animate-spin" /> : <Bell className="size-5" aria-hidden />}
                Activer les notifications
              </button>
            )}

            {variant === "banner" ? (
              <button
                type="button"
                onClick={postpone}
                className="mx-auto mt-3 block text-sm text-[var(--ak-ink-soft)] underline"
              >
                Plus tard
              </button>
            ) : null}
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
          </>
        )}
      </div>
    )
  }

  // « Plus tard » (ou rien à proposer) : seulement le petit réglage en dessous.
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
