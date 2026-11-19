"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, ImageIcon, Loader2, RefreshCw, X } from "lucide-react"
import { PhotoCropDialog } from "@/components/mon-espace/photo-crop-dialog"

type Stage = "choose" | "camera" | "crop"

type Props = {
  open: boolean
  onClose: () => void
  /** Photo finale, carrée et recadrée. Le parent l'envoie au serveur. */
  onPhoto: (file: File) => void
  /** Format illisible (ex. HEIC) : le parent applique son recadrage automatique. */
  onUnreadable?: (original: File) => void
}

/**
 * Parcours « photo du badge » : choisir la source (appareil photo ou galerie),
 * puis recadrer avant l'envoi. L'appareil photo passe par getUserMedia (marche
 * aussi sur ordinateur) ; si la caméra est refusée ou absente, la galerie et
 * l'application photo du téléphone restent proposées.
 */
export function PhotoFlow({ open, onClose, onPhoto, onUnreadable }: Props) {
  const [stage, setStage] = useState<Stage>("choose")
  const [picked, setPicked] = useState<File | null>(null)

  // À chaque ouverture, on repart du choix de la source.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      setStage("choose")
      setPicked(null)
    }, 0)
    return () => clearTimeout(t)
  }, [open])

  const finish = useCallback(
    (file: File) => {
      setPicked(null)
      onPhoto(file)
      onClose()
    },
    [onPhoto, onClose]
  )

  if (!open) return null

  if (stage === "crop" && picked) {
    return (
      <PhotoCropDialog
        file={picked}
        onCancel={() => setStage("choose")}
        onConfirm={finish}
        onUnreadable={(original) => {
          setPicked(null)
          onUnreadable?.(original)
          onClose()
        }}
      />
    )
  }

  if (stage === "camera") {
    return (
      <CameraCapture
        onCancel={() => setStage("choose")}
        onCapture={(file) => {
          setPicked(file)
          setStage("crop")
        }}
        onFile={(file) => {
          setPicked(file)
          setStage("crop")
        }}
      />
    )
  }

  return (
    <Chooser
      onClose={onClose}
      onCamera={() => setStage("camera")}
      onFile={(file) => {
        setPicked(file)
        setStage("crop")
      }}
    />
  )
}

function Overlay({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center"
    >
      {children}
    </div>
  )
}

function Chooser({
  onClose,
  onCamera,
  onFile,
}: {
  onClose: () => void
  onCamera: () => void
  onFile: (f: File) => void
}) {
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <Overlay label="Ajouter ma photo">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--ak-ivory)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
              Ma photo de badge
            </h2>
            <p className="mt-1 text-xs text-[var(--ak-ink-soft)]">
              Elle apparaît dans le cercle de votre carte membre. Vous pourrez la recadrer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--ak-ink-soft)] hover:bg-black/5"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onCamera}
            className="flex w-full items-center gap-3 rounded-xl bg-[var(--ak-emerald-deep)] px-4 py-3.5 text-left text-sm font-semibold text-white"
          >
            <Camera className="size-5" aria-hidden />
            Prendre une photo
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--ak-emerald-deep)] px-4 py-3.5 text-left text-sm font-semibold text-[var(--ak-emerald-deep)]"
          >
            <ImageIcon className="size-5" aria-hidden />
            Importer depuis la galerie
          </button>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (f) onFile(f)
            }}
          />
        </div>
      </div>
    </Overlay>
  )
}

function CameraCapture({
  onCancel,
  onCapture,
  onFile,
}: {
  onCancel: () => void
  onCapture: (f: File) => void
  onFile: (f: File) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nativeRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFailed("Caméra non disponible dans ce navigateur.")
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          await v.play().catch(() => {})
        }
        setReady(true)
      } catch (e) {
        const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
        setFailed(
          denied
            ? "Accès à l'appareil photo refusé. Autorisez-le dans les réglages du navigateur, ou utilisez les options ci-dessous."
            : "Aucune caméra utilisable sur cet appareil."
        )
      }
    }
    // setState hors du corps synchrone de l'effet (changement de caméra : on repart de zéro).
    const reset = setTimeout(() => {
      setReady(false)
      setFailed(null)
      void start()
    }, 0)
    return () => {
      clearTimeout(reset)
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [facing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])

  async function shoot() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    // Carré centré sur la partie utile de l'image (le recadrage fin vient ensuite).
    const side = Math.min(v.videoWidth, v.videoHeight)
    const canvas = document.createElement("canvas")
    canvas.width = Math.min(side, 1280)
    canvas.height = canvas.width
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(
      v,
      (v.videoWidth - side) / 2,
      (v.videoHeight - side) / 2,
      side,
      side,
      0,
      0,
      canvas.width,
      canvas.height
    )
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92))
    if (!blob) return
    onCapture(new File([blob], "photo.jpg", { type: "image/jpeg" }))
  }

  const fileInputs = (
    <>
      <input
        ref={nativeRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f) onFile(f)
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          if (f) onFile(f)
        }}
      />
    </>
  )

  return (
    <Overlay label="Prendre une photo">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--ak-ivory)] p-5 text-center shadow-2xl">
        <h2 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
          Prendre une photo
        </h2>

        {failed ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{failed}</p>
            <button
              type="button"
              onClick={() => nativeRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ak-emerald-deep)] px-4 py-3 text-sm font-semibold text-white"
            >
              <Camera className="size-4" /> Ouvrir l&apos;application photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--ak-emerald-deep)] px-4 py-3 text-sm font-semibold text-[var(--ak-emerald-deep)]"
            >
              <ImageIcon className="size-4" /> Importer depuis la galerie
            </button>
            <button type="button" onClick={onCancel} className="text-sm text-[var(--ak-ink-soft)] underline">
              Retour
            </button>
            {fileInputs}
          </div>
        ) : (
          <>
            <div className="relative mx-auto mt-4 aspect-square w-full max-w-[320px] overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="size-full object-cover"
                // Aperçu en miroir pour le selfie ; la photo enregistrée n'est pas inversée.
                style={{ transform: facing === "user" ? "scaleX(-1)" : undefined }}
              />
              {!ready ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-white" />
                </span>
              ) : null}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "radial-gradient(circle at center, transparent 0, transparent 47%, rgba(0,0,0,0.45) 48%)",
                }}
              />
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-[var(--ak-emerald-deep)] px-4 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => void shoot()}
                disabled={!ready}
                aria-label="Prendre la photo"
                className="flex size-16 items-center justify-center rounded-full border-4 border-[var(--ak-gold)] bg-[var(--ak-emerald-deep)] text-white disabled:opacity-50"
              >
                <Camera className="size-7" />
              </button>
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                aria-label="Changer de caméra"
                className="flex size-11 items-center justify-center rounded-full border border-[var(--ak-emerald-deep)] text-[var(--ak-emerald-deep)]"
              >
                <RefreshCw className="size-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  )
}
