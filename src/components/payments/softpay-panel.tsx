"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CanalIcon } from "@/components/adhesion/canal-icon"
import {
  isMobileDevice,
  openSoftpayDestination,
  softpayRedirectUrl,
} from "@/lib/softpay-redirect"

export type SoftpayPanelLabels = {
  title: string
  subtitle: string
  wave: string
  orange: string
  phone: string
  pay: string
  paying: string
  waveHint: string
  orangeHint: string
  openWave: string
  openOm: string
  openMaxit: string
  waiting: string
  error: string
  changeMethod: string
  fallbackHint: string
}

const DEFAULT_LABELS_FR: SoftpayPanelLabels = {
  title: "Payer en ligne",
  subtitle: "Choisissez Wave ou Orange Money — sans passer par la page PayDunya.",
  wave: "Wave",
  orange: "Orange Money",
  phone: "Téléphone du paiement",
  pay: "Continuer le paiement",
  paying: "Connexion…",
  waveHint: "Cliquez ci-dessous pour ouvrir Wave et valider le paiement.",
  orangeHint: "Scannez le QR avec Orange Money, ou ouvrez l’application.",
  openWave: "Ouvrir Wave",
  openOm: "Ouvrir Orange Money",
  openMaxit: "Ouvrir Maxit",
  waiting: "En attente de confirmation du paiement…",
  error: "Paiement indisponible",
  changeMethod: "Changer de moyen",
  fallbackHint:
    "Mode test : SoftPay nécessite des clés live. Ouverture du paiement sécurisé classique.",
}

type SoftpayPanelProps = {
  paymentId: string
  defaultPhone?: string
  labels?: Partial<SoftpayPanelLabels>
  className?: string
  onCompleted?: () => void
  /** Mode compact : moins de titres, Wave/OM visibles sans scroll */
  compact?: boolean
  /** Masque le titre (déjà affiché par le parent) */
  hideHeader?: boolean
  /** Endpoints personnalisés (réutilisation hors adhésion/cotisation/don,
   * ex. commandes boutique) — par défaut les routes /api/payments/*. */
  statusEndpoint?: (paymentId: string) => string
  softpayEndpoint?: (paymentId: string) => string
  retourUrl?: (paymentId: string) => string
}

type SoftpayResponse = {
  ok?: boolean
  alreadyPaid?: boolean
  fallback?: boolean
  method?: "wave" | "orange"
  message?: string
  url?: string
  omUrl?: string
  maxitUrl?: string
  qrDataUrl?: string
  error?: string
}

export function SoftPayPanel({
  paymentId,
  defaultPhone = "",
  labels: labelsPartial,
  className,
  onCompleted,
  compact = false,
  hideHeader = false,
  statusEndpoint = (id) => `/api/payments/${encodeURIComponent(id)}/status`,
  softpayEndpoint = () => "/api/payments/softpay",
  retourUrl = (id) => `/paiement/retour?paymentId=${encodeURIComponent(id)}`,
}: SoftpayPanelProps) {
  const t = { ...DEFAULT_LABELS_FR, ...labelsPartial }
  const [method, setMethod] = useState<"wave" | "orange" | null>(null)
  const [phone, setPhone] = useState(defaultPhone)
  const [prevDefaultPhone, setPrevDefaultPhone] = useState(defaultPhone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SoftpayResponse | null>(null)
  const [polling, setPolling] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  // Verrou synchrone — évite qu'un double-clic déclenche deux tentatives de
  // paiement SoftPay concurrentes avant que le bouton ne se désactive
  // réellement (même raisonnement que boutique/checkout/page.tsx).
  const startingRef = useRef(false)

  // Resynchronise `phone` quand le parent change `defaultPhone`, sans passer
  // par un effet (évite le rendu en cascade — voir react-hooks/set-state-in-effect).
  if (defaultPhone !== prevDefaultPhone) {
    setPrevDefaultPhone(defaultPhone)
    setPhone(defaultPhone)
  }

  const goRetour = useCallback(() => {
    if (onCompleted) {
      onCompleted()
      return
    }
    window.location.href = retourUrl(paymentId)
  }, [onCompleted, paymentId, retourUrl])

  useEffect(() => {
    if (!polling || !paymentId) return
    let stopped = false
    const tick = async () => {
      try {
        const res = await fetch(statusEndpoint(paymentId))
        const data = (await res.json()) as { status?: string }
        if (!stopped && data.status === "completed") {
          setPolling(false)
          goRetour()
        }
      } catch {
        /* ignore */
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), 4000)
    // Le paiement se confirme dans l'app Wave/Orange Money : l'onglet passe
    // en arrière-plan pendant ce temps, et les navigateurs mobiles peuvent
    // alors ralentir voire suspendre l'intervalle. Sans ce filet, le retour
    // sur l'onglet pouvait rester bloqué sur "en attente" même si le
    // paiement avait bien abouti entre-temps — d'où le versement manquant
    // tant que la page n'était pas rechargée manuellement.
    const onVisible = () => {
      if (document.visibilityState === "visible") void tick()
    }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onVisible)
    return () => {
      stopped = true
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onVisible)
    }
  }, [polling, paymentId, goRetour, statusEndpoint])

  async function startPay(selected: "wave" | "orange") {
    if (startingRef.current) return
    startingRef.current = true
    setMethod(selected)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(softpayEndpoint(paymentId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          method: selected,
          phone: phone.trim() || undefined,
        }),
      })
      const data = (await res.json()) as SoftpayResponse
      if (!res.ok || data.error) {
        setError(data.error || t.error)
        setMethod(null)
        return
      }
      if (data.alreadyPaid) {
        goRetour()
        return
      }
      setPolling(true)
      const redirected = openSoftpayDestination(data)
      if (redirected) {
        setRedirecting(true)
        return
      }
      setResult(data)
    } catch {
      setError(t.error)
      setMethod(null)
    } finally {
      setLoading(false)
      startingRef.current = false
    }
  }

  return (
    <div
      className={cn(
        "text-start",
        compact
          ? "rounded-xl border border-[#E6DCC0] bg-white p-3 md:p-4"
          : "rounded-2xl border border-[#E6DCC0] bg-white p-5 shadow-[0_10px_30px_rgba(11,58,37,0.08)] md:p-6",
        className
      )}
    >
      {!hideHeader ? (
        <>
          <h4
            className={cn(
              "font-[family-name:var(--font-amiri)] text-[var(--ak-emerald-deep)]",
              compact ? "text-lg" : "text-xl md:text-2xl"
            )}
          >
            {t.title}
          </h4>
          {!compact ? (
            <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">{t.subtitle}</p>
          ) : null}
        </>
      ) : null}

      {!result && !redirecting ? (
        <>
          <label
            className={cn(
              "block text-sm font-medium text-[var(--ak-ink)]",
              hideHeader || compact ? "mt-0" : "mt-5"
            )}
          >
            {t.phone}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] px-3 py-2.5 text-sm outline-none focus:border-[var(--ak-emerald-mid)]"
              placeholder="77 000 00 00"
              inputMode="tel"
            />
          </label>

          <div
            className={cn(
              "grid gap-2 sm:grid-cols-2",
              compact ? "mt-2.5" : "mt-4 gap-3"
            )}
          >
            <button
              type="button"
              disabled={loading}
              onClick={() => void startPay("wave")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] text-start transition-all hover:border-[var(--ak-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-emerald-mid)] disabled:opacity-50",
                compact ? "min-h-12 px-3 py-2.5" : "min-h-14 px-4 py-3.5"
              )}
            >
              <CanalIcon
                canal="wave"
                className={compact ? "size-9" : "size-10"}
              />
              <span>
                <span className="block text-sm font-bold text-[var(--ak-emerald-deep)]">
                  {t.wave}
                </span>
                <span className="text-xs text-[var(--ak-ink-soft)]">
                  {loading && method === "wave" ? t.paying : t.pay}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void startPay("orange")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#E6DCC0] bg-[var(--ak-ivory)] text-start transition-all hover:border-[var(--ak-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-emerald-mid)] disabled:opacity-50",
                compact ? "min-h-12 px-3 py-2.5" : "min-h-14 px-4 py-3.5"
              )}
            >
              <CanalIcon
                canal="orange"
                className={compact ? "size-9" : "size-10"}
              />
              <span>
                <span className="block text-sm font-bold text-[var(--ak-emerald-deep)]">
                  {t.orange}
                </span>
                <span className="text-xs text-[var(--ak-ink-soft)]">
                  {loading && method === "orange" ? t.paying : t.pay}
                </span>
              </span>
            </button>
          </div>
        </>
      ) : redirecting ? (
        <div className="mt-5 space-y-3 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-[var(--ak-emerald-deep)]" />
          <p className="text-sm font-medium text-[var(--ak-emerald-deep)]">
            {method === "orange"
              ? isMobileDevice()
                ? "Ouverture d'Orange Money…"
                : "Redirection vers le QR code Orange Money…"
              : isMobileDevice()
                ? "Ouverture de Wave…"
                : "Redirection vers le QR code Wave…"}
          </p>
          <p className="text-xs text-[var(--ak-ink-soft)]">{t.waiting}</p>
        </div>
      ) : result ? (
        <div className="mt-5 space-y-4">
          {result.fallback ? (
            <>
              <p className="text-sm text-[var(--ak-ink-soft)]">{t.fallbackHint}</p>
              {result.message ? (
                <p className="text-xs text-[color-mix(in_oklch,var(--ak-gold-dark),var(--ak-ink)_40%)]">{result.message}</p>
              ) : null}
              {result.url ? (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-bold text-white"
                >
                  Ouvrir le paiement
                </a>
              ) : null}
            </>
          ) : result.method === "wave" ? (
            <>
              <p className="text-sm font-medium text-[var(--ak-emerald-deep)]">
                {t.waveHint}
              </p>
              {result.url ? (
                <a
                  href={result.url}
                  className="inline-flex w-full justify-center rounded-full bg-[var(--ak-emerald-deep)] px-5 py-4 text-base font-bold text-white"
                  onClick={(e) => {
                    e.preventDefault()
                    openSoftpayDestination(result)
                  }}
                >
                  {t.openWave}
                </a>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--ak-ink-soft)]">{t.orangeHint}</p>
              {result.qrDataUrl && !isMobileDevice() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.qrDataUrl}
                  alt="QR Orange Money"
                  className="mx-auto size-48 rounded-xl border border-[#E6DCC0] bg-white p-2"
                />
              ) : null}
              {softpayRedirectUrl(result) ? (
                <a
                  href={softpayRedirectUrl(result) || "#"}
                  className="inline-flex w-full justify-center rounded-full bg-[var(--ak-emerald-deep)] px-5 py-4 text-base font-bold text-white"
                  onClick={(e) => {
                    e.preventDefault()
                    openSoftpayDestination(result)
                  }}
                >
                  {isMobileDevice() ? t.openOm : "Afficher le QR Orange Money"}
                </a>
              ) : result.url ? (
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[var(--ak-emerald-deep)] underline"
                >
                  Afficher le QR Orange Money
                </a>
              ) : null}
              {isMobileDevice() && result.maxitUrl ? (
                <a
                  href={result.maxitUrl}
                  className="inline-flex w-full justify-center rounded-full border border-[var(--ak-emerald-deep)] px-4 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
                >
                  {t.openMaxit}
                </a>
              ) : null}
            </>
          )}

          <p className="flex items-center gap-2 text-sm text-[var(--ak-ink-soft)]">
            {polling ? <Loader2 className="size-4 animate-spin" /> : null}
            {t.waiting}
          </p>

          <button
            type="button"
            className="text-xs text-[var(--ak-ink-soft)] underline-offset-4 hover:underline"
            onClick={() => {
              setResult(null)
              setMethod(null)
              setPolling(false)
              setRedirecting(false)
              setError(null)
            }}
          >
            {t.changeMethod}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading || redirecting ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-[var(--ak-ink-soft)]">
          <Loader2 className="size-4 animate-spin" />
          {redirecting ? t.waiting : t.paying}
        </p>
      ) : null}
    </div>
  )
}
