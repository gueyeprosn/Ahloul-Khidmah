"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLocale } from "@/components/landing/locale-provider"
import { cn } from "@/lib/utils"

export function LandingCta({ isMember = false }: { isMember?: boolean }) {
  const { dict, isRtl } = useLocale()

  return (
    <section className="relative overflow-hidden bg-[var(--ak-emerald-deep)] px-5 py-14 md:px-8 md:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(201,162,76,0.18),transparent_55%)]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <h2 className="font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
            {isMember ? dict.nav.monEspace : dict.nav.joinNow}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ak-ivory)]/70 md:text-lg">
            {dict.adhesion.intro}{" "}
            {dict.footer.slogan}.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={isMember ? "/mon-espace" : "#adhesion"}
            className="inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--ak-gold-light),var(--ak-gold))] px-7 py-3.5 text-sm font-bold text-[var(--ak-emerald-deep)] transition-opacity hover:opacity-95"
          >
            {isMember ? dict.nav.monEspace : dict.nav.join}
            <ArrowRight className={cn("size-4", isRtl && "rotate-180")} />
          </Link>
          <Link
            href="#contribuer"
            className="inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[var(--ak-gold)]/50 px-7 py-3.5 text-sm font-semibold text-[var(--ak-ivory)] transition-colors hover:bg-white/5"
          >
            {dict.nav.contribute}
          </Link>
        </div>
      </div>
    </section>
  )
}
