"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import {
  formatMontantLabel,
  type AdhesionTicket,
} from "@/lib/adhesion-id"
import { memberIdSuffix } from "@/lib/member-access"
import { cn } from "@/lib/utils"
import { useOptionalLocale } from "@/components/landing/locale-provider"
import { getFormDict } from "@/i18n/form"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { contact } from "@/content/landing"

type AdhesionSuccessProps = {
  ticket: AdhesionTicket
  paymentUrl?: string | null
  paymentId?: string | null
  onReset: () => void
  className?: string
}

export function AdhesionSuccess({
  ticket,
  paymentUrl,
  paymentId,
  onReset,
  className,
}: AdhesionSuccessProps) {
  const { locale } = useOptionalLocale()
  const dict = getFormDict(locale)
  const t = dict.success
  const montantLabel = formatMontantLabel(ticket.montant)
  const fullName = `${ticket.prenoms} ${ticket.nom}`.trim()
  const accessSuffix = memberIdSuffix(ticket.id)
  const [paying, setPaying] = useState(false)
  const [activePaymentId, setActivePaymentId] = useState<string | null>(
    paymentId || null
  )
  const [panelOpen, setPanelOpen] = useState(Boolean(paymentId))
  // Inscription manuelle admin (canal "cellule" = déjà payé en espèces) :
  // pas de proposition de paiement en ligne, ce serait trompeur.
  const alreadyPaidOffline = ticket.canal === "cellule"

  const ensurePaymentAndOpen = async () => {
    if (activePaymentId) {
      setPanelOpen(true)
      return
    }
    setPaying(true)
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adherentId: ticket.id,
          type: "adhesion",
        }),
      })
      const data = (await res.json()) as {
        url?: string
        paymentId?: string
        error?: string
      }
      if (!res.ok || !data.paymentId) {
        alert(data.error || "Paiement indisponible")
        return
      }
      setActivePaymentId(data.paymentId)
      setPanelOpen(true)
    } catch {
      alert("Erreur réseau")
    } finally {
      setPaying(false)
    }
  }

  // Legacy: si seulement paymentUrl sans id, tenter checkout pour SoftPay
  void paymentUrl

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale === "ar" ? "ar" : "fr"}
      className={cn(
        "rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-6 text-center shadow-[0_10px_30px_rgba(11,58,37,0.12)] md:p-10",
        className
      )}
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
        <CheckCircle2 className="size-7" />
      </div>

      <h3 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
        {t.title}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--ak-ink-soft)] md:text-base">
        {t.subtitle}
      </p>

      <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-xl border border-[var(--ak-gold)]/50 bg-white px-5 py-3">
        <span className="text-xs tracking-[0.2em] text-[var(--ak-ink-soft)] uppercase">
          {t.idLabel}
        </span>
        <span className="font-mono text-xl font-semibold tracking-wide text-[var(--ak-emerald-deep)] md:text-2xl">
          {ticket.id}
        </span>
      </div>

      <div className="mx-auto mt-4 max-w-md rounded-xl border border-[var(--ak-emerald-mid)]/40 bg-[#E7F0EA] px-4 py-3 text-sm text-[var(--ak-ink-soft)]">
        <p className="font-semibold text-[var(--ak-emerald-deep)]">
          Accès espace membre
        </p>
        <p className="mt-1">
          Téléphone + code{" "}
          <span className="font-mono font-bold tracking-widest text-[var(--ak-emerald-deep)]">
            {accessSuffix}
          </span>
        </p>
        <a
          href="/mon-espace"
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Ouvrir mon espace
        </a>
      </div>

      <dl className="mx-auto mt-6 max-w-xs space-y-1.5 text-start text-sm text-[var(--ak-ink-soft)]">
        <div className="flex justify-between gap-3">
          <dt>{t.member}</dt>
          <dd className="font-medium text-[var(--ak-emerald-deep)]">
            {fullName}
          </dd>
        </div>
        {ticket.celluleLocale && ticket.celluleLocale !== "À préciser" ? (
          <div className="flex justify-between gap-3">
            <dt>{t.cell}</dt>
            <dd className="font-medium text-[var(--ak-emerald-deep)]">
              {ticket.celluleLocale}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt>{t.dues}</dt>
          <dd className="font-medium text-[var(--ak-emerald-deep)]">
            {montantLabel}
          </dd>
        </div>
      </dl>

      <div className="mt-8 rounded-2xl border border-[#E6DCC0] bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-[var(--ak-emerald-deep)]">
          {t.downloadCard}
        </p>
        <MemberCardActions
          member={{
            id: ticket.id,
            prenoms: ticket.prenoms,
            nom: ticket.nom,
            celluleLocale: ticket.celluleLocale,
            tel: ticket.tel,
            whatsapp: ticket.tel,
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!alreadyPaidOffline && !panelOpen ? (
          <button
            type="button"
            onClick={() => void ensurePaymentAndOpen()}
            disabled={paying}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {paying ? "…" : t.payNow}
          </button>
        ) : null}
        <a
          href={contact.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-[var(--ak-emerald-deep)]"
        >
          Contacter Ahloul Khidmah
        </a>
      </div>

      {alreadyPaidOffline ? (
        <p className="mt-3 text-xs text-[var(--ak-ink-soft)]">
          Cotisation déjà réglée en espèces (versement cellule) — aucun
          paiement en ligne nécessaire.
        </p>
      ) : panelOpen && activePaymentId ? (
        <div className="mt-6 text-start">
          <SoftPayPanel
            paymentId={activePaymentId}
            defaultPhone={ticket.tel}
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--ak-ink-soft)]">{t.payHint}</p>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-5 text-sm text-[var(--ak-ink-soft)] underline-offset-4 hover:underline"
      >
        {t.reset}
      </button>
    </div>
  )
}
