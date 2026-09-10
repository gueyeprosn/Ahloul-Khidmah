"use client"

import { useLocale } from "@/components/landing/locale-provider"
import { getContributeDict } from "@/i18n/contribute"
import { ContributeForm } from "@/components/contribute/contribute-form"

export function LandingContribuer() {
  const { locale } = useLocale()
  const t = getContributeDict(locale)

  return (
    <section
      id="contribuer"
      className="scroll-mt-20 bg-[var(--ak-ivory)] px-5 py-12 text-[var(--ak-ink)] md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {t.paths.contribute.title}
        </p>
        <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-4xl">
          {t.form.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
          {t.paths.contribute.text}
        </p>

        <div className="mt-8 rounded-2xl border border-[#E6DCC0] bg-white p-1 shadow-[0_20px_50px_rgba(11,58,37,0.12)] md:p-1.5">
          <div className="p-3 md:p-4 lg:p-5">
            <ContributeForm />
          </div>
        </div>
      </div>
    </section>
  )
}
