"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Loader2, MessageCircle, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineMessage } from "@/components/shared/inline-message"
import { contact } from "@/content/landing"
import {
  memberBadgePhone,
  type MemberBadgeData,
} from "@/lib/member-badge"
import {
  dataUrlToFile,
  downloadDataUrl,
  renderMemberBadgePng,
} from "@/lib/member-badge-client"
import { buildMemberCardWaMeUrl } from "@/lib/whatsapp-shared"
import { cn } from "@/lib/utils"

type Props = {
  member: {
    id: string
    prenoms: string
    nom: string
    celluleLocale?: string | null
    zoneRegion?: string | null
    tel?: string | null
    whatsapp?: string | null
    validationUrl?: string
    memberNumber?: number | null
    photoUrl?: string | null
  }
  className?: string
  compact?: boolean
  /** "whatsapp" (défaut) : envoi direct à l'adhérent. "share" : partage natif
   * de l'image (réseaux sociaux, enregistrer sur l'appareil…) — utilisé
   * depuis /mon-espace, où l'adhérent partage sa propre carte lui-même. */
  variant?: "whatsapp" | "share"
}

export function MemberCardActions({
  member,
  className,
  compact = false,
  variant = "whatsapp",
}: Props) {
  const [badgeDataUrl, setBadgeDataUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [busy, setBusy] = useState<"download" | "send" | null>(null)
  const [msg, setMsg] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [cloud, setCloud] = useState(false)

  const validationUrl = useMemo(() => {
    if (member.validationUrl) return member.validationUrl
    if (typeof window !== "undefined") {
      return `${window.location.origin}/valider/${encodeURIComponent(member.id)}`
    }
    return `https://www.ahloulkhidmah.org/valider/${encodeURIComponent(member.id)}`
  }, [member.id, member.validationUrl])

  const badgeInput: MemberBadgeData = useMemo(
    () => ({
      id: member.id,
      prenoms: member.prenoms,
      nom: member.nom,
      celluleLocale: member.celluleLocale,
      zoneRegion: member.zoneRegion,
      tel: member.tel,
      whatsapp: member.whatsapp,
      validationUrl,
      memberNumber: member.memberNumber,
      photoUrl: member.photoUrl,
    }),
    [
      member.id,
      member.prenoms,
      member.nom,
      member.celluleLocale,
      member.zoneRegion,
      member.tel,
      member.whatsapp,
      member.memberNumber,
      member.photoUrl,
      validationUrl,
    ]
  )

  const ensureBadge = useCallback(async () => {
    if (badgeDataUrl) return badgeDataUrl
    const dataUrl = await renderMemberBadgePng(badgeInput)
    setBadgeDataUrl(dataUrl)
    return dataUrl
  }, [badgeDataUrl, badgeInput])

  useEffect(() => {
    let cancelled = false
    // Démarre un rendu canvas asynchrone à chaque changement de badgeInput
    // (pas une synchronisation de prop) — le flag loading doit repasser à
    // true avant que la promesse ne résolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewLoading(true)
    void renderMemberBadgePng(badgeInput)
      .then((url) => {
        if (!cancelled) {
          setBadgeDataUrl(url)
          setPreviewLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    if (variant === "whatsapp") {
      void fetch("/api/whatsapp/status")
        .then((r) => r.json())
        .then((d: { cloud?: boolean }) => {
          if (!cancelled) setCloud(Boolean(d.cloud))
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [badgeInput, variant])

  const openWaMe = useCallback(() => {
    const url = buildMemberCardWaMeUrl(badgeInput)
    if (!url) {
      setMsg({
        type: "error",
        text: "Numéro WhatsApp / téléphone manquant ou invalide.",
      })
      return false
    }
    window.open(url, "_blank", "noopener,noreferrer")
    return true
  }, [badgeInput])

  const sendWhatsApp = useCallback(async () => {
    setBusy("send")
    setMsg(null)
    try {
      // Le serveur régénère la carte lui-même à partir de l'ID membre — on
      // n'a plus besoin de lui envoyer une image (voir P1-2 audit sécurité).
      const phone = memberBadgePhone(badgeInput)
      const res = await fetch("/api/whatsapp/send-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adherentId: member.id,
          tel: phone,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        mode?: string
        fallback?: string
        url?: string
        error?: string
      }

      if (data.ok && data.mode === "cloud") {
        setMsg({
          type: "success",
          text: "Carte envoyée sur WhatsApp de l’adhérent.",
        })
        return
      }

      if (data.fallback === "wa_me" && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer")
        setMsg({
          type: "success",
          text: cloud
            ? "Envoi Cloud indisponible — WhatsApp ouvert (validez Envoyer)."
            : "WhatsApp ouvert avec le message prérempli — validez Envoyer.",
        })
        return
      }

      if (!openWaMe()) return
      setMsg({
        type: "success",
        text: "WhatsApp ouvert avec le message prérempli — validez Envoyer.",
      })
    } catch {
      if (openWaMe()) {
        setMsg({ type: "success", text: "WhatsApp ouvert (mode lien)." })
      } else {
        setMsg({ type: "error", text: "Envoi WhatsApp impossible." })
      }
    } finally {
      setBusy(null)
    }
  }, [badgeInput, cloud, member.id, openWaMe])

  async function onDownload() {
    setBusy("download")
    setMsg(null)
    try {
      const dataUrl = await ensureBadge()
      downloadDataUrl(dataUrl, `ahloul-khidmah-carte-${member.id}.png`)
      setMsg({ type: "success", text: "Carte téléchargée." })
    } catch {
      setMsg({ type: "error", text: "Génération de la carte impossible." })
    } finally {
      setBusy(null)
    }
  }

  /** Partage natif de l'image (réseaux sociaux, messagerie, enregistrer sur
   * l'appareil…) via la feuille de partage du système. Si l'appareil ne
   * supporte pas le partage de fichiers, la carte est téléchargée à la
   * place — l'action reste toujours utile. */
  async function onShare() {
    setBusy("send")
    setMsg(null)
    const filename = `ahloul-khidmah-carte-${member.id}.png`
    try {
      const dataUrl = await ensureBadge()
      const file = dataUrlToFile(dataUrl, filename)
      const shareData: ShareData = {
        files: [file],
        title: "Ma carte membre Ahloul Khidmah",
        text: "Voici ma carte membre Ahloul Khidmah.",
      }
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        setMsg({ type: "success", text: "Partage ouvert." })
        return
      }
      downloadDataUrl(dataUrl, filename)
      setMsg({
        type: "success",
        text: "Partage non disponible sur cet appareil — carte téléchargée à la place.",
      })
    } catch (e) {
      // L'utilisateur a fermé la feuille de partage sans choisir — pas une erreur.
      if (e instanceof Error && e.name === "AbortError") return
      setMsg({ type: "error", text: "Partage impossible." })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {!compact ? (
        <div className="mx-auto w-full max-w-[300px]">
          <div className="relative overflow-hidden rounded-[1.4rem] bg-[linear-gradient(145deg,#0B3A25,#061F14_55%,#12512F)] p-[3px] shadow-[0_24px_50px_rgba(11,58,37,0.28)]">
            <div className="overflow-hidden rounded-[1.25rem] bg-[#061F14] p-2">
              {badgeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badgeDataUrl}
                  alt={`Carte membre ${member.prenoms} ${member.nom}`}
                  className="h-auto w-full rounded-[0.95rem]"
                />
              ) : (
                <div className="flex aspect-[680/1080] items-center justify-center rounded-[0.95rem] bg-[var(--ak-ivory)] text-sm text-[var(--ak-ink-soft)]">
                  {previewLoading ? (
                    <Loader2 className="size-6 animate-spin text-[var(--ak-emerald-mid)]" />
                  ) : (
                    "Aperçu indisponible"
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-center font-mono text-xs tracking-wide text-[var(--ak-emerald-deep)]">
            {member.id}
          </p>
          {!member.photoUrl ? (
            <p className="mt-2 text-center text-xs text-[var(--ak-ink-soft)]">
              Ajoutez votre photo pour personnaliser la carte.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          onClick={() => void onDownload()}
          disabled={busy !== null}
          className="ak-cta-solid h-auto rounded-2xl px-5 py-3"
        >
          {busy === "download" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Télécharger la carte
        </Button>
        {variant === "share" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onShare()}
            disabled={busy !== null}
            className="h-auto rounded-2xl border-[var(--ak-emerald-deep)] px-5 py-3 text-[var(--ak-emerald-deep)]"
          >
            {busy === "send" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Share2 className="size-4" />
            )}
            Partager
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => void sendWhatsApp()}
            disabled={busy !== null}
            className="h-auto rounded-2xl border-[var(--ak-emerald-deep)] px-5 py-3 text-[var(--ak-emerald-deep)]"
          >
            {busy === "send" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MessageCircle className="size-4" />
            )}
            Envoyer par WhatsApp
          </Button>
        )}
      </div>

      {msg ? <InlineMessage message={msg.text} variant={msg.type} /> : null}

      {variant === "whatsapp" ? (
        <p className="text-center text-xs text-[var(--ak-ink-soft)]">
          {cloud
            ? "Envoi Cloud WhatsApp activé (image + message)."
            : "Mode lien WhatsApp — l’adhérent confirme l’envoi. Contact asso : "}
          {!cloud ? (
            <a
              href={contact.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {contact.whatsappDisplay}
            </a>
          ) : null}
        </p>
      ) : (
        <p className="text-center text-xs text-[var(--ak-ink-soft)]">
          Partagez l’image vers vos réseaux ou une messagerie, ou enregistrez-la sur votre appareil.
        </p>
      )}
    </div>
  )
}
