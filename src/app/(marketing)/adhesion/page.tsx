import type { Metadata } from "next"
import { AdhesionForm } from "@/components/adhesion/adhesion-form"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Fiche d'adhésion nationale et internationale",
  description:
    "Adhérez à Ahloul Khidmah en ligne : rejoignez votre cellule, cotisez et servez Serigne Touba avec Foi, Discipline, Savoir et Excellence — Touba, Sénégal et diaspora.",
  path: "/adhesion",
  keywords: [
    "fiche d'adhésion Ahloul Khidmah",
    "adhésion mouride",
    "recensement national",
    "cellule mouride",
    "cotisation",
    "Touba",
    "diaspora",
  ],
})

export default async function AdhesionPage({
  searchParams,
}: {
  searchParams: Promise<{ montant?: string }>
}) {
  const params = await searchParams

  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_45%)]"
      />
      <div className="ak-pattern pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative mx-auto max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-gold)] uppercase">
          Recensement national et international
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-4xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
          Adhérer à Ahloul Khidmah
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ivory)]/75 md:text-lg">
          Rejoignez votre cellule — à Touba, au Sénégal ou dans la diaspora —
          et mettez votre compétence au service de Serigne Touba et de la
          Mouridiyah.
        </p>

        <div className="mt-10 rounded-3xl bg-[var(--ak-ivory)] p-4 text-[var(--ak-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.25)] md:p-8">
          <AdhesionForm defaultMontant={params.montant} />
        </div>
      </div>
    </section>
  )
}
