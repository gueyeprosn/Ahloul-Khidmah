"use client"

import { useMemo } from "react"
import { BadgeCheck, ShieldAlert, Clock } from "lucide-react"

/**
 * Volontairement minimal — page publique sans connexion (scan QR). Ne
 * transporte que ce qui sert à répondre à "cette carte est-elle valide ?".
 * Ne PAS ajouter tel/cellule/zoneRegion/profession/montant/canal ici : voir
 * P0-3 de l'audit sécurité (ces champs ne doivent jamais quitter le serveur
 * pour cette page, même sans être affichés à l'écran).
 */
export type ValidationTicket = {
  id: string
  nom: string
  prenoms: string
  memberNumber: number | null
  createdAt: string
  status?: string
}

type ValidationClientProps = {
  id: string
  ticket: ValidationTicket | null
}

export function ValidationClient({ id, ticket }: ValidationClientProps) {
  const dateLabel = useMemo(() => {
    if (!ticket) return ""
    return new Date(ticket.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }, [ticket])

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-rose-400/40 bg-rose-950/30 p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-rose-300" />
        <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-ivory)]">
          QR non reconnu
        </h1>
        <p className="mt-3 text-sm text-[var(--ak-ivory)]/70">
          Aucune adhésion trouvée pour{" "}
          <span className="font-mono text-[var(--ak-gold-light)]">{id}</span>.
        </p>
      </div>
    )
  }

  const pending = ticket.status === "en_attente"
  const archived = ticket.status === "archive"

  return (
    <div className="rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-6 text-[var(--ak-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.25)] md:p-8">
      <div className="flex items-start gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
          {pending ? (
            <Clock className="size-6" />
          ) : (
            <BadgeCheck className="size-6" />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--ak-emerald-mid)] uppercase">
            Validation Ahloul Khidmah
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
            {archived
              ? "Adhésion archivée"
              : pending
                ? "Adhésion en attente"
                : "Adhésion valide"}
          </h1>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 text-center">
        <p className="text-xs text-[var(--ak-ink-soft)] uppercase tracking-wider">
          N° d&apos;identification
        </p>
        <p className="mt-1 font-mono text-lg font-semibold text-[var(--ak-emerald-deep)] md:text-xl">
          {ticket.id}
        </p>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Membre" value={`${ticket.prenoms} ${ticket.nom}`} />
        {typeof ticket.memberNumber === "number" ? (
          <Row
            label="N° membre"
            value={`N° ${String(ticket.memberNumber).padStart(3, "0")}`}
          />
        ) : null}
        <Row label="Date d'adhésion" value={dateLabel} />
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--ak-emerald-deep)]/10 pb-2">
      <dt className="text-[var(--ak-ink-soft)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--ak-emerald-deep)]">
        {value}
      </dd>
    </div>
  )
}
