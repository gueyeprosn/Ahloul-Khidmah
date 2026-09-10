"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

type Versement = {
  periode: string
  periodeLabel: string
  montant: number
  statut: string
  canal: string
  paidAt: string | null
}

type MemberView = {
  id: string
  name: string
  suffix: string
  status: string
  cotisationPrevue: string
  versements: Versement[]
}

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"
}

function statusLabel(s: string) {
  if (s === "paye") return "Payé"
  if (s === "en_attente") return "En attente"
  return s
}

export function MesVersementsForm() {
  const [tel, setTel] = useState("")
  const [suffix, setSuffix] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [member, setMember] = useState<MemberView | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMember(null)
    setLoading(true)
    try {
      const res = await fetch("/api/mes-versements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tel: tel.trim(),
          suffix: suffix.trim().toUpperCase(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Identifiants incorrects."
        )
        return
      }
      setMember(data.member as MemberView)
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="tel"
            className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]"
          >
            Téléphone
          </label>
          <input
            id="tel"
            type="tel"
            autoComplete="tel"
            required
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            placeholder="77… ou +22177…"
            className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 text-sm outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
          />
        </div>
        <div>
          <label
            htmlFor="suffix"
            className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]"
          >
            4 derniers caractères de votre N° membre
          </label>
          <input
            id="suffix"
            type="text"
            required
            maxLength={4}
            minLength={4}
            value={suffix}
            onChange={(e) =>
              setSuffix(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4))
            }
            placeholder="ex. 5X2Z"
            className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 font-mono text-sm uppercase tracking-widest outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
          />
          <p className="mt-1.5 text-xs text-[var(--ak-ink-soft)]">
            Sur votre badge : AK-20260903-<strong>1F5X2Z</strong> → saisissez{" "}
            <strong>5X2Z</strong>
          </p>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Voir mes versements
        </button>
      </form>

      {member ? (
        <div className="space-y-4 rounded-xl border border-[var(--ak-gold)]/50 bg-white p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--ak-ink-soft)]">
              Membre
            </p>
            <p className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
              {member.name}
            </p>
            <p className="mt-1 font-mono text-sm text-[var(--ak-ink-soft)]">
              {member.id}
            </p>
            <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
              Cotisation prévue :{" "}
              <span className="font-medium text-[var(--ak-emerald-deep)]">
                {member.cotisationPrevue}
              </span>
            </p>
          </div>

          {member.versements.length === 0 ? (
            <p className="text-sm text-[var(--ak-ink-soft)]">
              Aucun versement enregistré pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--ak-gold)]/20">
              {member.versements.map((v) => (
                <li
                  key={v.periode}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium capitalize text-[var(--ak-emerald-deep)]">
                      {v.periodeLabel}
                    </p>
                    <p className="text-xs text-[var(--ak-ink-soft)]">
                      {v.canal}
                      {v.paidAt
                        ? ` · ${new Date(v.paidAt).toLocaleDateString("fr-FR")}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatFcfa(v.montant)}</p>
                    <p
                      className={
                        v.statut === "paye"
                          ? "text-xs text-emerald-700"
                          : "text-xs text-amber-700"
                      }
                    >
                      {statusLabel(v.statut)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => {
              setMember(null)
              setSuffix("")
            }}
            className="text-sm text-[var(--ak-emerald-mid)] underline"
          >
            Fermer
          </button>
        </div>
      ) : null}
    </div>
  )
}
