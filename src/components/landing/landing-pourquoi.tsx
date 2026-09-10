"use client"

import { BookOpen, Globe2, HeartHandshake, Users } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"

const icons = {
  "heart-handshake": HeartHandshake,
  users: Users,
  "book-open": BookOpen,
  "globe-2": Globe2,
}

export function LandingPourquoi() {
  const { dict } = useLocale()

  return (
    <section
      id="pourquoi"
      className="scroll-mt-20 bg-[var(--ak-ivory)] px-5 py-12 text-[var(--ak-ink)] md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {dict.why.eyebrow}
        </p>
        <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-5xl">
          {dict.why.title}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ink-soft)] md:text-lg">
          {dict.why.intro}
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dict.why.items.map((item, i) => {
            const Icon = icons[item.icon]
            return (
              <article
                key={item.title}
                className="ak-reveal rounded-2xl border border-[#E6DCC0] bg-white p-6 shadow-[0_10px_30px_rgba(11,58,37,0.06)]"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                  {item.text}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
