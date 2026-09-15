"use client"

import { useEffect, useState } from "react"
import { Play, Minus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/components/landing/locale-provider"
import { YOUTUBE_PLAYLIST_ID, buildYoutubeEmbedUrl } from "@/lib/youtube-widget-config"

const DISMISS_KEY = "ak_yt_dismiss"

/**
 * Petit disque façon vinyle — tourne pendant la lecture (assumée dès
 * `activated`, YouTube ne nous donne pas l'état lecture/pause réel sans
 * l'API JS IFrame, qu'on évite ici pour rester sur un simple `<iframe>`).
 */
function VinylDisc({ spinning, size = 16 }: { spinning: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--ak-gold)] bg-[var(--ak-emerald-deep)]",
        spinning && "ak-yt-vinyl"
      )}
      style={{ width: size, height: size }}
    >
      {/* Repère excentré (asymétrique) — rend la rotation perceptible,
          un simple anneau + point centré serait visuellement immobile. */}
      <span
        className="absolute rounded-full bg-[var(--ak-gold)]/70"
        style={{
          width: Math.round(size * 0.16),
          height: Math.round(size * 0.16),
          top: Math.round(size * 0.16),
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <span
        className="rounded-full bg-[var(--ak-gold)]"
        style={{ width: Math.round(size * 0.3), height: Math.round(size * 0.3) }}
      />
    </span>
  )
}

export function YoutubeWidget() {
  const { dict } = useLocale()
  const [closed, setClosed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setClosed(true)
    } catch {
      // navigation privée / quota — le widget reste affiché pour cette page
    }
  }, [])

  function close() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // navigation privée / quota — masquage en mémoire seulement
    }
    setClosed(true)
    setActivated(false)
  }

  if (closed) return null

  return (
    <div
      role="complementary"
      aria-label={dict.youtubeWidget.regionLabel}
      className={cn(
        // Position fixe à l'écran (coin bas-gauche), volontairement physique
        // et non logique (`start-4`) : un widget flottant se repère à un
        // coin d'écran, pas au sens de lecture — reste bas-gauche même en
        // arabe (dir="rtl"). z-40, sous les z-50/z-[80]/z-[100] existants
        // (tiroir panier, palette de recherche, bannière d'installation) :
        // tout modal déjà présent recouvre naturellement le widget.
        "fixed bottom-4 left-4 z-40 overflow-hidden rounded-2xl border border-[var(--ak-gold)]/40 bg-[var(--ak-emerald-deep)] shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-[width,height] duration-300",
        collapsed ? "size-14 rounded-full" : "w-[320px] max-w-[calc(100vw-2rem)]"
      )}
    >
      {!collapsed && (
        <div className="flex items-center justify-between px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <VinylDisc spinning={activated} />
            <span className="truncate text-xs font-semibold text-[var(--ak-gold-light)]">
              {dict.youtubeWidget.regionLabel}
            </span>
          </span>
          <div className="flex shrink-0 gap-1">
            {activated && (
              <button
                type="button"
                aria-label={dict.youtubeWidget.minimize}
                onClick={() => setCollapsed(true)}
                className="flex size-7 items-center justify-center rounded-full text-[var(--ak-ivory)]/85 hover:bg-white/10"
              >
                <Minus className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              aria-label={dict.youtubeWidget.close}
              onClick={close}
              className="flex size-7 items-center justify-center rounded-full text-[var(--ak-ivory)]/85 hover:bg-white/10"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/*
        L'iframe, une fois créée, reste montée en permanence (clé stable,
        jamais de changement de `src`) : réduire/agrandir ne fait que
        redimensionner ce conteneur en CSS, le son continue sans coupure.
      */}
      <div className={cn("relative", collapsed ? "size-14" : "aspect-video w-full")}>
        {activated && (
          <iframe
            key="yt-widget-player"
            src={buildYoutubeEmbedUrl(YOUTUBE_PLAYLIST_ID, { autoplay: true, muted: false })}
            className="size-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            title={dict.youtubeWidget.regionLabel}
          />
        )}

        {!activated && (
          <button
            type="button"
            aria-label={dict.youtubeWidget.activateSound}
            onClick={() => setActivated(true)}
            className="absolute inset-0 flex items-center justify-center bg-[var(--ak-emerald-mid)]"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-[var(--ak-gold)]/90">
              <Play className="size-6 text-[var(--ak-emerald-deep)]" aria-hidden />
            </span>
          </button>
        )}

        {collapsed && activated && (
          <button
            type="button"
            aria-label={dict.youtubeWidget.expand}
            onClick={() => setCollapsed(false)}
            className="absolute inset-0 flex items-center justify-center bg-[var(--ak-emerald-deep)]/70"
          >
            <VinylDisc spinning size={40} />
          </button>
        )}
      </div>
    </div>
  )
}
