"use client"

import { useLocale } from "@/components/landing/locale-provider"
import { PhotoSlideshow } from "@/components/landing/photo-slideshow"
import type { CmsPhoto } from "@/lib/cms"

export function LandingGalerie({
  photos,
  asPage = false,
}: {
  photos: CmsPhoto[]
  asPage?: boolean
}) {
  const { dict, isRtl } = useLocale()
  const t = dict.gallery
  const Heading = asPage ? "h1" : "h2"

  if (photos.length === 0) return null

  return (
    <section
      id="mediatheque"
      className="scroll-mt-20 bg-[var(--ak-ivory)] px-5 py-20 text-[var(--ak-ink)] md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {t.eyebrow}
        </p>
        <Heading
          className={`mt-4 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-5xl ${
            isRtl ? "text-right" : ""
          }`}
        >
          {t.title}
        </Heading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ink-soft)] md:text-lg">
          {t.intro}
        </p>

        <PhotoSlideshow
          photos={photos}
          className="mt-12 rounded-2xl border border-[#E6DCC0] bg-white shadow-[0_20px_50px_rgba(11,58,37,0.12)]"
        />
      </div>
    </section>
  )
}
