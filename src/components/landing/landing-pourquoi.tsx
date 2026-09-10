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

        <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {dict.why.items.map((item, i) => {
            const Icon = icons[item.icon]
            return (
              <article
                key={item.title}
                className="ak-reveal flex items-start gap-4 border-[var(--ak-gold)]/50 border-s-2 ps-5"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--ak-ink-soft)]">
                    {item.text}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
