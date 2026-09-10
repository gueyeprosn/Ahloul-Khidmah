"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AppImage } from "@/components/media/app-image"
import { cn } from "@/lib/utils"
import type { CmsPhoto } from "@/lib/cms"

type PhotoSlideshowProps = {
  photos: CmsPhoto[]
  className?: string
  aspectClass?: string
  intervalMs?: number
}

export function PhotoSlideshow({
  photos,
  className,
  aspectClass = "aspect-[16/10]",
  intervalMs = 5000,
}: PhotoSlideshowProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const total = photos.length || 1

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + total) % total)
    },
    [total]
  )

  useEffect(() => {
    if (paused || photos.length <= 1) return
    const id = window.setInterval(() => go(1), intervalMs)
    return () => window.clearInterval(id)
  }, [go, paused, photos.length, intervalMs])

  if (photos.length === 0) return null

  const current = photos[index]

  return (
    <div
      className={cn("group relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.changedTouches[0]?.clientX ?? null
      }}
      onTouchEnd={(e) => {
        const start = touchX.current
        const end = e.changedTouches[0]?.clientX
        touchX.current = null
        if (start == null || end == null) return
        const delta = end - start
        if (Math.abs(delta) < 40) return
        go(delta < 0 ? 1 : -1)
      }}
    >
      <div className={cn("relative w-full overflow-hidden", aspectClass)}>
        {photos.map((photo, i) => (
          <div
            key={photo.id || photo.src}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={i !== index}
          >
            <AppImage
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 1100px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,31,20,0.55),transparent_45%)]"
        />

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Photo précédente"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/55 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Photo suivante"
              onClick={() => go(1)}
              className="absolute top-1/2 right-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/55 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}

        {(current.caption || current.alt) && (
          <p className="absolute inset-x-0 bottom-10 z-10 px-5 text-center text-sm text-[var(--ak-ivory)]/90 md:bottom-12 md:text-base">
            {current.caption || current.alt}
          </p>
        )}

        {photos.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
            {photos.map((photo, i) => (
              <button
                key={photo.id || photo.src}
                type="button"
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-[var(--ak-gold-light)]"
                    : "w-2 bg-white/45 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
