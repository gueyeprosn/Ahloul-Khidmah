"use client"

import { ArrowRight, HandCoins, Users } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"
import { getContributeDict } from "@/i18n/contribute"
import { cn } from "@/lib/utils"

export function LandingChemins() {
  const { locale, isRtl } = useLocale()
  const t = getContributeDict(locale)

  return (
    <section
      id="chemins"
      className="scroll-mt-20 bg-[linear-gradient(180deg,#F7F3E8_0%,var(--ak-ivory)_100%)] px-5 py-20 md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {t.eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-5xl">
          {t.title}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ink-soft)] md:text-lg">
          {t.intro}
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-[#E6DCC0] bg-white p-7 shadow-[0_10px_30px_rgba(11,58,37,0.06)]">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
              <Users className="size-6" aria-hidden />
            </div>
            <h3 className="mt-5 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
              {t.paths.member.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
              {t.paths.member.text}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--ak-ink)]">
              {t.paths.member.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ak-gold)]" />
                  {p}
                </li>
              ))}
            </ul>
            <a
              href="#adhesion"
              className="ak-cta-solid mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold"
            >
              {t.paths.member.cta}
              <ArrowRight className={cn("size-4", isRtl && "rotate-180")} />
            </a>
          </article>

          <article className="flex flex-col rounded-2xl border border-[#E6DCC0] bg-white p-7 shadow-[0_10px_30px_rgba(11,58,37,0.06)]">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
              <HandCoins className="size-6" aria-hidden />
            </div>
            <h3 className="mt-5 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
              {t.paths.contribute.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
              {t.paths.contribute.text}
            </p>
            <ul className="mt-5 space-y-2 text-sm text-[var(--ak-ink)]">
              {t.paths.contribute.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--ak-gold)]" />
                  {p}
                </li>
              ))}
            </ul>
            <a
              href="#contribuer"
              className="ak-cta-outline mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold"
            >
              {t.paths.contribute.cta}
              <ArrowRight className={cn("size-4", isRtl && "rotate-180")} />
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}
