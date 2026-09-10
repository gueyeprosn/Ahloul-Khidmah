"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { SoftPayPanel } from "@/components/payments/softpay-panel"
import { MemberPhotoUpload } from "@/components/mon-espace/member-photo-upload"
import { BadgeFullscreen } from "@/components/mon-espace/badge-fullscreen"
import { PinSetupForm } from "@/components/mon-espace/pin-setup-form"
import { PhoneInput } from "@/components/shared/phone-input"
import { prepareMemberPhoto } from "@/lib/prepare-member-photo"

const fetchOpts: RequestInit = { credentials: "same-origin" }

type Versement = {
  periode: string
  periodeLabel: string
  montant: number
  statut: string
  canal: string
  paidAt: string | null
}

type WalletTransactionView = {
  id: string
  type: "credit" | "debit"
  amount: number
  label: string
  reference: string | null
  createdAt: string
}

type MemberView = {
  id: string
  name: string
  suffix: string
  hasPin: boolean
  nom: string
  prenoms: string
  tel: string
  whatsapp: string
  email: string
  profession: string
  autreProfession: string
  celluleLocale: string
  zoneRegion: string
  status: string
  ficheComplete: boolean
  dateEntree: string | null
  memberNumber: number | null
  photoUrl: string | null
  cotisationPrevue: string
  versements: Versement[]
  walletBalance: number
  walletTransactions: WalletTransactionView[]
}

type Tab = "profil" | "carte" | "versements" | "wallet"

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"
}

function statusLabel(s: string) {
  if (s === "paye") return "Payé"
  if (s === "en_attente") return "En attente"
  if (s === "actif") return "Actif"
  if (s === "archive") return "Archivé"
  return s
}

export function MonEspaceClient() {
  const [tel, setTel] = useState("")
  const [suffix, setSuffix] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [member, setMember] = useState<MemberView | null>(null)
  const [tab, setTab] = useState<Tab>("profil")
  const [fullscreenBadge, setFullscreenBadge] = useState(false)
  const [focusPin, setFocusPin] = useState(false)
  const [justSavedPin, setJustSavedPin] = useState(false)
  const router = useRouter()

  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [avatarBroken, setAvatarBroken] = useState(false)

  const [payMonthsCount, setPayMonthsCount] = useState(1)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [payment, setPayment] = useState<{
    paymentId: string
    amount: number
    periodes: string[]
  } | null>(null)

  const [form, setForm] = useState({
    nom: "",
    prenoms: "",
    whatsapp: "",
    email: "",
    profession: "",
    autreProfession: "",
  })

  const hydrateForm = useCallback((m: MemberView) => {
    setForm({
      nom: m.nom,
      prenoms: m.prenoms,
      whatsapp: m.whatsapp,
      email: m.email,
      profession: m.profession,
      autreProfession: m.autreProfession,
    })
  }, [])

  const refreshMember = useCallback(async () => {
    try {
      const res = await fetch("/api/mon-espace/me", fetchOpts)
      if (!res.ok) {
        setMember(null)
        return false
      }
      const data = await res.json()
      if (data.member) {
        setMember(data.member)
        hydrateForm(data.member)
        return true
      }
      setMember(null)
      return false
    } catch {
      setMember(null)
      return false
    }
  }, [hydrateForm])

  useEffect(() => {
    // Ouvert depuis "Voir mon badge" (?vue=badge) ou juste après une
    // adhésion payée (?vue=pin, pour amener directement au choix du code
    // PIN) — lu directement dans l'URL, pas via useSearchParams(), pour
    // éviter d'imposer un Suspense boundary à ce composant client. Lecture
    // indisponible côté serveur, donc uniquement possible ici (après montage).
    const vue = new URLSearchParams(window.location.search).get("vue")
    if (vue === "badge") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullscreenBadge(true)
    } else if (vue === "pin") {
      setFocusPin(true)
    }
  }, [])

  useEffect(() => {
    if (!member || !focusPin) return
    const timer = window.setTimeout(() => {
      document.getElementById("pin-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 350)
    return () => window.clearTimeout(timer)
    // Le focus du champ est géré par PinSetupForm (prop autoFocus).
  }, [member, focusPin])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/mon-espace/me", fetchOpts)
        if (!res.ok) {
          if (!cancelled) setMember(null)
          return
        }
        const data = await res.json()
        if (!cancelled && data.member) {
          setMember(data.member)
          hydrateForm(data.member)
        }
      } catch {
        if (!cancelled) setMember(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrateForm])

  async function onLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch("/api/mon-espace/login", {
        ...fetchOpts,
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
        setMember(null)
        return
      }
      // Confirme que le cookie de session est bien pris en compte (évite
      // l'UI « connecté » sans pouvoir photo/PIN tant qu'on n'a pas rafraîchi).
      const ok = await refreshMember()
      if (!ok && data.member) {
        setMember(data.member as MemberView)
        hydrateForm(data.member as MemberView)
      }
      setTab("profil")
      setSuccess("Connexion réussie.")
      // Le menu (rendu côté serveur) affiche "Adhérer" ou "Voir mon badge"
      // selon la session — sans ça, il resterait sur l'état "non connecté"
      // jusqu'au prochain chargement de page.
      router.refresh()
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally {
      setLoading(false)
    }
  }

  async function onLogout() {
    setLoading(true)
    try {
      await fetch("/api/mon-espace/logout", { ...fetchOpts, method: "POST" })
    } finally {
      setMember(null)
      setSuccess(null)
      setError(null)
      setLoading(false)
      setFullscreenBadge(false)
      router.refresh()
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const res = await fetch("/api/mon-espace/me", {
        ...fetchOpts,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          setMember(null)
          setError("Session expirée — reconnectez-vous.")
          return
        }
        setError(
          typeof data.error === "string" ? data.error : "Enregistrement impossible."
        )
        return
      }
      if (data.member) {
        setMember(data.member)
        hydrateForm(data.member)
      }
      setSuccess("Profil mis à jour.")
    } catch {
      setError("Impossible de contacter le serveur.")
    } finally {
      setSaving(false)
    }
  }

  async function onPayCotisation() {
    setPayError(null)
    setPayLoading(true)
    try {
      const res = await fetch("/api/mon-espace/cotisation-checkout", {
        ...fetchOpts,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthsCount: payMonthsCount }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.paymentId) {
        if (res.status === 401) {
          setMember(null)
          setPayError("Session expirée — reconnectez-vous.")
          return
        }
        setPayError(
          typeof data.error === "string"
            ? data.error
            : "Paiement en ligne indisponible."
        )
        return
      }
      setPayment({
        paymentId: data.paymentId,
        amount: data.amount,
        periodes: data.periodes || [],
      })
    } catch {
      setPayError("Impossible de contacter le serveur.")
    } finally {
      setPayLoading(false)
    }
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setPhotoError(null)
    setPhotoUploading(true)
    try {
      const prepared = await prepareMemberPhoto(file)
      const formData = new FormData()
      formData.append("file", prepared)
      const res = await fetch("/api/mon-espace/photo", {
        ...fetchOpts,
        method: "POST",
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          setMember(null)
          setPhotoError("Session expirée — reconnectez-vous pour envoyer la photo.")
          return
        }
        if (res.status === 413) {
          setPhotoError("Photo trop lourde — réessayez avec une image plus légère.")
          return
        }
        setPhotoError(
          typeof data.error === "string" ? data.error : "Envoi impossible."
        )
        return
      }
      const photoUrl =
        typeof data.photoUrl === "string"
          ? `${data.photoUrl}?t=${Date.now()}`
          : null
      setMember((m) => (m ? { ...m, photoUrl: photoUrl || data.photoUrl } : m))
      setAvatarBroken(false)
      setSuccess("Photo enregistrée — elle apparaît sur votre carte.")
      setTab("carte")
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Impossible de contacter le serveur."
      )
    } finally {
      setPhotoUploading(false)
    }
  }

  if (loading && !member) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-[var(--ak-emerald-deep)]" />
      </div>
    )
  }

  if (!member) {
    return (
      <form onSubmit={onLogin} className="space-y-4">
        <div className="min-w-0">
          <label
            htmlFor="tel"
            className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]"
          >
            Téléphone
          </label>
          <PhoneInput
            id="tel"
            value={tel}
            onChange={setTel}
            required
            className="[&_input]:rounded-xl [&_input]:border-[var(--ak-gold)]/40 [&_input]:bg-white [&_input]:px-4 [&_input]:py-3 [&_select]:rounded-xl [&_select]:border-[var(--ak-gold)]/40 [&_select]:bg-white"
          />
        </div>
        <div className="min-w-0">
          <label
            htmlFor="suffix"
            className="mb-1.5 block text-sm font-medium leading-snug text-[var(--ak-emerald-deep)]"
          >
            Code PIN ou 4 derniers caractères du N°
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
            placeholder="ex. 5X2Z ou 1234"
            className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 font-mono text-sm uppercase tracking-widest outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
          />
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ak-ink-soft)]">
            Les 4 derniers caractères du N° badge fonctionnent toujours (ex.{" "}
            <span className="whitespace-nowrap">
              AK-…-<strong>1F5X2Z</strong> → <strong>5X2Z</strong>
            </span>
            ). Si vous avez choisi un PIN à 4 chiffres, vous pouvez aussi
            l&apos;utiliser.
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
          Accéder à mon espace
        </button>
      </form>
    )
  }

  if (fullscreenBadge) {
    return (
      <BadgeFullscreen
        member={{
          id: member.id,
          prenoms: member.prenoms,
          nom: member.nom,
          celluleLocale: member.celluleLocale,
          zoneRegion: member.zoneRegion,
          tel: member.tel,
          whatsapp: member.whatsapp,
          memberNumber: member.memberNumber,
          photoUrl: member.photoUrl,
        }}
        photoUploading={photoUploading}
        photoError={photoError}
        onPhotoSelected={(e) => void onPhotoSelected(e)}
        onClose={() => {
          setFullscreenBadge(false)
          window.history.replaceState(null, "", "/mon-espace")
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--ak-gold)] bg-[#E8F0EA]">
            {member.photoUrl && !avatarBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={member.photoUrl}
                src={member.photoUrl}
                alt=""
                className="h-full w-full object-cover object-center"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span className="font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-emerald-deep)]">
                {`${member.prenoms.charAt(0)}${member.nom.charAt(0)}`.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--ak-ink-soft)]">
              Connecté
            </p>
            <p className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
              {member.name}
            </p>
            <p className="mt-0.5 font-mono text-sm text-[var(--ak-ink-soft)]">
              {member.id}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ak-gold)]/50 px-3 py-1.5 text-xs font-medium text-[var(--ak-emerald-deep)]"
        >
          <LogOut className="size-3.5" />
          Déconnexion
        </button>
      </div>

      {!member.ficheComplete ? (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Votre fiche est incomplète.{" "}
          <Link
            href={`/adhesion/completer?id=${encodeURIComponent(member.id)}&tel=${encodeURIComponent(member.tel)}`}
            className="font-semibold underline"
          >
            Compléter maintenant
          </Link>
        </div>
      ) : null}

      {!member.hasPin ? (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Sécurisez votre compte :</strong> vous n&apos;avez pas encore
          défini de code PIN. Sans PIN, votre espace reste accessible avec les
          4 derniers caractères de votre N° membre, visibles sur votre carte —
          ce n&apos;est pas un secret.{" "}
          <button
            type="button"
            onClick={() => setTab("profil")}
            className="font-semibold underline"
          >
            Créer mon code PIN
          </button>
        </div>
      ) : null}

      <div className="flex gap-2 rounded-full bg-[var(--ak-emerald-deep)]/5 p-1">
        <button
          type="button"
          onClick={() => setTab("profil")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            tab === "profil"
              ? "bg-[var(--ak-emerald-deep)] text-white"
              : "text-[var(--ak-emerald-deep)]"
          }`}
        >
          Mon profil
        </button>
        <button
          type="button"
          onClick={() => setTab("carte")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            tab === "carte"
              ? "bg-[var(--ak-emerald-deep)] text-white"
              : "text-[var(--ak-emerald-deep)]"
          }`}
        >
          Ma carte
        </button>
        <button
          type="button"
          onClick={() => setTab("versements")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            tab === "versements"
              ? "bg-[var(--ak-emerald-deep)] text-white"
              : "text-[var(--ak-emerald-deep)]"
          }`}
        >
          Versements
        </button>
        <button
          type="button"
          onClick={() => setTab("wallet")}
          className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
            tab === "wallet"
              ? "bg-[var(--ak-emerald-deep)] text-white"
              : "text-[var(--ak-emerald-deep)]"
          }`}
        >
          Portefeuille
        </button>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      {tab === "profil" ? (
        <div className="space-y-6">
        <form onSubmit={onSaveProfile} className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-[var(--ak-gold)]/30 bg-white p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--ak-ink-soft)]">Statut</dt>
              <dd className="font-medium capitalize">
                {statusLabel(member.status)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ak-ink-soft)]">Cotisation</dt>
              <dd className="font-medium">{member.cotisationPrevue}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ak-ink-soft)]">Cellule</dt>
              <dd className="font-medium">{member.celluleLocale}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--ak-ink-soft)]">Zone / région</dt>
              <dd className="font-medium">{member.zoneRegion}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-[var(--ak-ink-soft)]">
                Téléphone (identifiant — non modifiable ici)
              </dt>
              <dd className="font-medium">{member.tel}</dd>
            </div>
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nom"
              value={form.nom}
              onChange={(v) => setForm((f) => ({ ...f, nom: v }))}
              required
            />
            <Field
              label="Prénom(s)"
              value={form.prenoms}
              onChange={(v) => setForm((f) => ({ ...f, prenoms: v }))}
              required
            />
            <Field
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
            <Field
              label="Profession"
              value={form.profession}
              onChange={(v) => setForm((f) => ({ ...f, profession: v }))}
              required
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]">
                Précisions profession
              </label>
              <textarea
                value={form.autreProfession}
                onChange={(e) =>
                  setForm((f) => ({ ...f, autreProfession: e.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 text-sm outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer mon profil
          </button>
        </form>

        {!member.photoUrl ? (
          <MemberPhotoUpload
            photoUrl={member.photoUrl}
            name={member.name}
            uploading={photoUploading}
            error={photoError}
            onSelected={(e) => void onPhotoSelected(e)}
          />
        ) : null}

        {!member.hasPin || justSavedPin ? (
          <PinSetupForm
            autoFocus={focusPin}
            onSaved={() => {
              setJustSavedPin(true)
              setMember((m) => (m ? { ...m, hasPin: true } : m))
            }}
            onSessionExpired={() => setMember(null)}
          />
        ) : null}
        </div>
      ) : tab === "carte" ? (
        <div className="space-y-5">
          <MemberPhotoUpload
            photoUrl={member.photoUrl}
            name={member.name}
            uploading={photoUploading}
            error={photoError}
            onSelected={(e) => void onPhotoSelected(e)}
            compact
          />
          <div className="rounded-2xl border border-[var(--ak-gold)]/45 bg-white p-5 shadow-[0_12px_36px_rgba(11,58,37,0.08)]">
            <MemberCardActions
              member={{
                id: member.id,
                prenoms: member.prenoms,
                nom: member.nom,
                celluleLocale: member.celluleLocale,
                zoneRegion: member.zoneRegion,
                tel: member.tel,
                whatsapp: member.whatsapp,
                memberNumber: member.memberNumber,
                photoUrl: member.photoUrl,
              }}
            />
          </div>
        </div>
      ) : tab === "versements" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--ak-gold)]/50 bg-white p-5">
            <p className="text-sm font-medium text-[var(--ak-emerald-deep)]">
              Payer ma cotisation
            </p>
            <p className="mt-0.5 text-xs text-[var(--ak-ink-soft)]">
              En retard sur plusieurs mois ? Réglez-les en un seul paiement.
            </p>

            {payment ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-[var(--ak-ink-soft)]">
                  {payment.periodes.length > 1
                    ? `${payment.periodes.length} mois — `
                    : ""}
                  <span className="font-semibold text-[var(--ak-emerald-deep)]">
                    {formatFcfa(payment.amount)}
                  </span>
                </p>
                <SoftPayPanel
                  paymentId={payment.paymentId}
                  defaultPhone={member.tel}
                  compact
                  onCompleted={() => {
                    setPayment(null)
                    setSuccess("Paiement confirmé — merci !")
                    void refreshMember()
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPayment(null)}
                  className="text-xs text-[var(--ak-ink-soft)] underline-offset-4 hover:underline"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  aria-label="Nombre de mois à régler"
                  value={payMonthsCount}
                  onChange={(e) => setPayMonthsCount(Number(e.target.value))}
                  className="min-h-11 rounded-xl border border-[var(--ak-gold)]/40 bg-white px-3 text-sm outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
                >
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} mois
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={payLoading}
                  onClick={() => void onPayCotisation()}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {payLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Payer maintenant
                </button>
              </div>
            )}
            {payError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {payError}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-[var(--ak-gold)]/50 bg-white p-5">
          <p className="mb-3 text-sm text-[var(--ak-ink-soft)]">
            Cotisation prévue :{" "}
            <span className="font-medium text-[var(--ak-emerald-deep)]">
              {member.cotisationPrevue}
            </span>
          </p>
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
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--ak-gold)]/50 bg-white p-5">
            <p className="text-xs text-[var(--ak-ink-soft)]">Solde du portefeuille</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                member.walletBalance >= 0
                  ? "text-[var(--ak-emerald-deep)]"
                  : "text-destructive"
              }`}
            >
              {formatFcfa(member.walletBalance)}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--ak-gold)]/50 bg-white p-5">
            <p className="mb-3 text-sm font-medium text-[var(--ak-emerald-deep)]">
              Historique
            </p>
            {member.walletTransactions.length === 0 ? (
              <p className="text-sm text-[var(--ak-ink-soft)]">
                Aucun mouvement enregistré pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--ak-gold)]/20">
                {member.walletTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[var(--ak-emerald-deep)]">
                        {t.label}
                      </p>
                      <p className="text-xs text-[var(--ak-ink-soft)]">
                        {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <p
                      className={
                        t.type === "credit"
                          ? "font-semibold text-[var(--ak-emerald-deep)]"
                          : "font-semibold text-destructive"
                      }
                    >
                      {t.type === "credit" ? "+" : "−"}
                      {formatFcfa(t.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  className = "",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-[var(--ak-emerald-deep)]">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--ak-gold)]/40 bg-white px-4 py-3 text-sm outline-none ring-[var(--ak-emerald-mid)] focus:ring-2"
      />
    </div>
  )
}
