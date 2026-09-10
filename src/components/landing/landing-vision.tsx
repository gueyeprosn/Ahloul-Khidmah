"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"
import { cn } from "@/lib/utils"
import type { CmsPhoto } from "@/lib/cms"

export function LandingVision({ slides }: { slides: CmsPhoto[] }) {
  const { dict, isRtl } = useLocale()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = slides.length || 1

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + total) % total)
    },
    [total]
  )

  useEffect(() => {
    if (paused || slides.length <= 1) return
    const id = window.setInterval(() => go(1), 4500)
    return () => window.clearInterval(id)
  }, [go, paused, slides.length])

  if (slides.length === 0) return null

  return (
    <section
      id="vision"
      className="scroll-mt-20 overflow-hidden bg-[var(--ak-emerald-deep)] px-5 py-20 md:px-8 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id || slide.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out",
                i === index ? "opacity-100" : "opacity-0"
              )}
              aria-hidden={i !== index}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(6,31,20,0.45),transparent_50%)]"
          />

          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-opacity hover:bg-black/50 md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-opacity hover:bg-black/50 md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id || slide.src}
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
        </div>

        <div className={cn(isRtl && "text-right")}>
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-gold)] uppercase">
            {dict.vision.eyebrow}
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
            {dict.vision.title}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[var(--ak-ivory)]/80 md:text-lg">
            {dict.vision.summary}
          </p>

          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[var(--ak-gold)]/40 px-5 py-3 text-sm font-semibold text-[var(--ak-gold-light)] transition-colors hover:border-[var(--ak-gold)] hover:bg-white/5"
          >
            {open ? dict.vision.readLess : dict.vision.readMore}
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[var(--ak-ivory)]/70 md:text-base">
                {dict.vision.full}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
