"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/components/landing/locale-provider"

const AdhesionForm = dynamic(
  () =>
    import("@/components/adhesion/adhesion-form").then((m) => m.AdhesionForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 rounded-2xl border border-[#E6DCC0] bg-white p-6 shadow-[0_16px_40px_rgba(11,58,37,0.1)]">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-40" />
      </div>
    ),
  }
)

type LandingAdhesionProps = {
  defaultMontant?: string
}

export function LandingAdhesion({ defaultMontant }: LandingAdhesionProps) {
  const { dict } = useLocale()

  return (
    <section
      id="adhesion"
      className="scroll-mt-20 bg-[linear-gradient(180deg,#F7F3E8_0%,var(--ak-ivory)_100%)] px-5 py-12 text-[var(--ak-ink)] md:px-8 md:py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
          {dict.adhesion.eyebrow}
        </p>
        <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-amiri)] text-3xl leading-tight text-[var(--ak-emerald-deep)] md:text-4xl">
          {dict.adhesion.title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
          {dict.adhesion.intro}
        </p>

        <div className="mt-8 rounded-2xl border border-[#E6DCC0] bg-white p-1 shadow-[0_20px_50px_rgba(11,58,37,0.12)] md:p-1.5">
          <div className="p-3 md:p-4 lg:p-5">
            <AdhesionForm defaultMontant={defaultMontant} compact />
          </div>
        </div>
      </div>
    </section>
  )
}
