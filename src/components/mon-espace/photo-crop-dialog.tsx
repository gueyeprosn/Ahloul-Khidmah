"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, ZoomIn, ZoomOut } from "lucide-react"
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampCrop,
  coverScale,
  cropSourceRect,
  zoomAround,
  type CropState,
} from "@/lib/photo-crop"

type Props = {
  /** Photo choisie (galerie ou appareil photo). `null` = dialogue fermé. */
  file: File | null
  onCancel: () => void
  /** Photo carrée recadrée (JPEG). */
  onConfirm: (cropped: File) => void
  /** Format illisible par le navigateur (ex. HEIC) : on retombe sur le recadrage automatique. */
  onUnreadable: (original: File) => void
}

const OUTPUT_SIDE = 1024

/**
 * Recadrage de la photo du badge : fenêtre carrée avec cercle repère (la photo
 * est affichée dans un disque sur la carte), déplacement au doigt/souris,
 * zoom au pincement, à la molette ou au curseur.
 */
export function PhotoCropDialog({ file, onCancel, onConfirm, onUnreadable }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [state, setState] = useState<CropState>({ zoom: 1, tx: 0, ty: 0 })
  const [vp, setVp] = useState(300)
  const [busy, setBusy] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; zoom: number } | null>(null)

  // Adresse locale de la photo (jamais envoyée au serveur à ce stade).
  useEffect(() => {
    if (!file) return
    const u = URL.createObjectURL(file)
    const t = setTimeout(() => {
      setUrl(u)
      setNatural(null)
      setState({ zoom: 1, tx: 0, ty: 0 })
    }, 0)
    return () => {
      clearTimeout(t)
      URL.revokeObjectURL(u)
    }
  }, [file])

  // Taille de la fenêtre : s'adapte à l'écran (téléphone étroit compris).
  useEffect(() => {
    if (!file) return
    const measure = () => setVp(Math.round(Math.min(window.innerWidth - 48, 340)))
    const t = setTimeout(measure, 0)
    window.addEventListener("resize", measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", measure)
    }
  }, [file])

  // Échap ferme.
  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [file, onCancel])

  const apply = useCallback(
    (next: CropState) => {
      if (!natural) return
      setState(clampCrop(next, natural.w, natural.h, vp))
    },
    [natural, vp]
  )

  // Si la fenêtre change de taille, on recadre pour rester valide.
  useEffect(() => {
    if (!natural) return
    const t = setTimeout(() => setState((s) => clampCrop(s, natural.w, natural.h, vp)), 0)
    return () => clearTimeout(t)
  }, [vp, natural])

  if (!file) return null

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: state.zoom }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId)
    if (!prev || !natural) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const rect = boxRef.current?.getBoundingClientRect()
      const mx = (a.x + b.x) / 2 - (rect?.left ?? 0)
      const my = (a.y + b.y) / 2 - (rect?.top ?? 0)
      setState((s) =>
        zoomAround(s, gesture.current!.zoom * (dist / gesture.current!.dist), mx, my, natural.w, natural.h, vp)
      )
      return
    }
    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      setState((s) => clampCrop({ ...s, tx: s.tx + dx, ty: s.ty + dy }, natural.w, natural.h, vp))
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) gesture.current = null
  }

  function onWheel(e: React.WheelEvent) {
    if (!natural) return
    const rect = boxRef.current?.getBoundingClientRect()
    const mx = e.clientX - (rect?.left ?? 0)
    const my = e.clientY - (rect?.top ?? 0)
    setState((s) => zoomAround(s, s.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), mx, my, natural.w, natural.h, vp))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = 12
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    const m = moves[e.key]
    if (m) {
      e.preventDefault()
      apply({ ...state, tx: state.tx + m[0], ty: state.ty + m[1] })
    } else if (e.key === "+" || e.key === "=") apply({ ...state, zoom: state.zoom * 1.1 })
    else if (e.key === "-") apply({ ...state, zoom: state.zoom / 1.1 })
  }

  async function confirm() {
    const img = imgRef.current
    if (!img || !natural || !file) return
    setBusy(true)
    try {
      const { sx, sy, size } = cropSourceRect(state, natural.w, natural.h, vp)
      const canvas = document.createElement("canvas")
      const out = Math.min(OUTPUT_SIDE, Math.round(size))
      canvas.width = out
      canvas.height = out
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas")
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, sx, sy, size, size, 0, 0, out, out)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9))
      if (!blob) throw new Error("blob")
      const base = file.name.replace(/\.[^.]+$/, "") || "photo"
      onConfirm(new File([blob], `${base}.jpg`, { type: "image/jpeg" }))
    } catch {
      onUnreadable(file)
    } finally {
      setBusy(false)
    }
  }

  const scale = natural ? coverScale(natural.w, natural.h, vp) * state.zoom : 1
  const imgStyle = natural
    ? {
        width: natural.w * scale,
        height: natural.h * scale,
        left: vp / 2 - (natural.w * scale) / 2 + state.tx,
        top: vp / 2 - (natural.h * scale) / 2 + state.ty,
      }
    : undefined

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Recadrer ma photo"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--ak-ivory)] p-5 text-center shadow-2xl">
        <h2 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
          Recadrer ma photo
        </h2>
        <p className="mt-1 text-xs text-[var(--ak-ink-soft)]">
          Glissez pour placer votre visage dans le cercle, pincez ou utilisez le curseur pour zoomer.
        </p>

        <div
          ref={boxRef}
          tabIndex={0}
          role="application"
          aria-label="Zone de recadrage : flèches pour déplacer, plus et moins pour zoomer"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          className="relative mx-auto mt-4 touch-none cursor-grab overflow-hidden rounded-xl bg-black select-none active:cursor-grabbing"
          style={{ width: vp, height: vp }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget
                setNatural({ w: el.naturalWidth, h: el.naturalHeight })
              }}
              onError={() => onUnreadable(file)}
              className="pointer-events-none absolute max-w-none"
              style={imgStyle ?? { opacity: 0 }}
            />
          ) : null}
          {!natural ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-white" />
            </span>
          ) : null}
          {/* Voile assombri autour du cercle : ce qui est hors du disque ne sera pas visible sur la carte. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(circle at center, transparent 0, transparent 47%, rgba(0,0,0,0.55) 48%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-full border-2 border-[var(--ak-gold)]"
            style={{ inset: "2%" }}
          />
        </div>

        <div className="mx-auto mt-4 flex max-w-[300px] items-center gap-3">
          <ZoomOut className="size-4 shrink-0 text-[var(--ak-ink-soft)]" aria-hidden />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={state.zoom}
            aria-label="Zoom"
            onChange={(e) => apply({ ...state, zoom: Number(e.target.value) })}
            className="h-2 w-full accent-[var(--ak-emerald-deep)]"
          />
          <ZoomIn className="size-4 shrink-0 text-[var(--ak-ink-soft)]" aria-hidden />
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-full border border-[var(--ak-emerald-deep)] px-4 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)] disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={busy || !natural}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}
