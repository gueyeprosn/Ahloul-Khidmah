"use client"

import { Check } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"

export function LandingValeurs() {
  const { dict } = useLocale()

  return (
    <section
      id="valeurs"
      className="scroll-mt-20 bg-[var(--ak-ivory)] px-5 py-20 text-[var(--ak-ink)] md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {dict.values.eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-5xl">
          {dict.values.title}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ink-soft)] md:text-lg">
          {dict.values.intro}
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {dict.values.items.map((item, i) => (
            <article
              key={item.title}
              className="ak-reveal text-center sm:text-start"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)] sm:mx-0">
                <Check className="size-5" strokeWidth={2.5} aria-hidden />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
