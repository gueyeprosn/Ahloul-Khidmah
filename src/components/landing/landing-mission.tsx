"use client"

import { useLocale } from "@/components/landing/locale-provider"

export function LandingMission() {
  const { dict } = useLocale()

  return (
    <section
      id="mission"
      className="scroll-mt-20 bg-white px-5 py-12 text-[var(--ak-ink)] md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {dict.mission.eyebrow}
        </p>
        <h2 className="mt-4 max-w-3xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-5xl">
          {dict.mission.title}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ink-soft)] md:text-lg">
          {dict.mission.intro}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {dict.mission.pillars.map((pillar, i) => (
            <article
              key={pillar.title}
              className="ak-reveal flex flex-col rounded-xl border border-[#E6DCC0] bg-[var(--ak-ivory)] p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="font-[family-name:var(--font-amiri)] text-sm text-[var(--ak-gold-dark)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                {pillar.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
