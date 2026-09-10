"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"
import { cn } from "@/lib/utils"

export function LandingHero({ isMember = false }: { isMember?: boolean }) {
  const { dict, isRtl, locale } = useLocale()

  return (
    <section className="relative flex h-dvh min-h-[360px] flex-col overflow-hidden">
      <Image
        src="/brand/touba-hero.jpg"
        alt="Grande Mosquée de Touba"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,31,20,0.55)_0%,rgba(11,58,37,0.72)_45%,rgba(6,31,20,0.88)_100%)]"
      />
      <div
        aria-hidden
        className="ak-pattern pointer-events-none absolute inset-0 opacity-25"
      />
      <div aria-hidden className="ak-hero-flare pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-5 py-[clamp(1rem,6dvh,4rem)] text-center md:px-8">
        <div className="ak-hero-logo-wrap relative mb-[clamp(0.5rem,2.5dvh,2.25rem)]">
          <div aria-hidden className="ak-logo-glow" />
          <div aria-hidden className="ak-logo-flare" />
          <div className="ak-logo-stage">
            <div className="ak-logo-spin">
              <div className="ak-logo-face ak-logo-face-front">
                <Image
                  src="/brand/logo.png"
                  alt="Logo Ahloul Khidmah"
                  width={220}
                  height={220}
                  priority
                  className="size-[min(30vw,18dvh,180px)] rounded-full object-cover md:size-[min(20vw,20dvh,200px)]"
                />
              </div>
              <div className="ak-logo-face ak-logo-face-back" aria-hidden>
                <Image
                  src="/brand/logo.png"
                  alt=""
                  width={220}
                  height={220}
                  className="size-[min(30vw,18dvh,180px)] rounded-full object-cover md:size-[min(20vw,20dvh,200px)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ak-hero-copy max-w-3xl space-y-[clamp(0.5rem,2dvh,1.25rem)]">
          <p
            className="font-[family-name:var(--font-amiri)] text-[clamp(1.25rem,min(5.5vw,4.5dvh),3.75rem)] leading-none text-[var(--ak-gold-light)] drop-shadow-[0_2px_18px_rgba(201,162,76,0.45)]"
            dir={locale === "ar" ? "rtl" : "ltr"}
            lang={locale === "ar" ? "ar" : "fr"}
          >
            {dict.hero.brand}
          </p>
          <h1
            className={cn(
              "font-[family-name:var(--font-amiri)] text-[clamp(1.25rem,min(5vw,4dvh),3.25rem)] leading-[1.15] tracking-tight text-[var(--ak-ivory)]",
              isRtl && "leading-[1.35]"
            )}
          >
            {dict.hero.title}
          </h1>
          <p className="mx-auto hidden max-w-2xl text-[clamp(0.7rem,min(2.2vw,1.8dvh),1rem)] leading-relaxed text-[var(--ak-ivory)]/85 [@media(max-height:560px)]:hidden sm:block">
            {dict.hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-[clamp(0.5rem,1.5dvh,1rem)] pt-[clamp(0.25rem,1.5dvh,1rem)]">
            <a
              href={isMember ? "/mon-espace" : "#adhesion"}
              className="ak-cta-primary inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl px-7 py-3.5 text-base font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-gold)] md:px-9 md:text-lg"
            >
              {isMember ? dict.nav.monEspace : dict.hero.primaryCta}
              <ArrowRight className={cn("size-5", isRtl && "rotate-180")} />
            </a>
            <a
              href="#contribuer"
              className="ak-cta-ghost inline-flex min-h-12 cursor-pointer items-center rounded-2xl px-6 py-3.5 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-gold)] md:px-8"
            >
              {dict.hero.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
