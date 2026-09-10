"use client"

import { useLocale } from "@/components/landing/locale-provider"
import type { CmsTestimonial } from "@/lib/cms"

export function LandingTemoignages({
  items,
}: {
  items: CmsTestimonial[]
}) {
  const { dict, locale } = useLocale()
  const list =
    items.length > 0
      ? items.map((item) => ({
          quote: locale === "ar" ? item.quoteAr : item.quoteFr,
          name: item.name,
          role: locale === "ar" ? item.roleAr : item.roleFr,
        }))
      : dict.testimonials.items

  return (
    <section
      id="temoignages"
      className="scroll-mt-20 bg-white px-5 py-12 text-[var(--ak-ink)] md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {dict.testimonials.eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-4xl">
          {dict.testimonials.title}
        </h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {list.slice(0, 3).map((item, i) => (
            <blockquote
              key={(item.name || "t") + i}
              className="ak-reveal flex flex-col rounded-xl border border-[#E6DCC0] bg-[var(--ak-ivory)] p-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <p className="flex-1 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                «&nbsp;{item.quote}&nbsp;»
              </p>
              <footer className="mt-4 border-t border-[var(--ak-gold)]/25 pt-3">
                <cite className="not-italic">
                  <span className="block font-semibold text-[var(--ak-emerald-deep)]">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--ak-ink-soft)]">
                    {item.role}
                  </span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
