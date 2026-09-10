import type { Metadata } from "next"
import { ContributeForm } from "@/components/contribute/contribute-form"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { getContributeDict } from "@/i18n/contribute"
import { buildMetadata } from "@/lib/seo"
import Link from "next/link"

const t = getContributeDict("fr")

export const metadata: Metadata = buildMetadata({
  title: "Contribuer — Faire un don à Ahloul Khidmah",
  description:
    "Faites une contribution ponctuelle à Ahloul Khidmah. Soutenez Touba et la Mouridiyah en ligne, montant libre, paiement sécurisé — avec carte de membre incluse si vous renseignez votre téléphone.",
  path: "/contribuer",
  keywords: [
    "contribution Ahloul Khidmah",
    "don Mouridiyah",
    "soutenir Touba",
    "paiement en ligne",
    "khidma",
  ],
})

export default function ContribuerPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Contribuer", path: "/contribuer" },
        ]}
      />
      <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_45%)]"
        />
        <div className="ak-pattern pointer-events-none absolute inset-0 opacity-25" />

        <div className="relative mx-auto max-w-3xl">
          <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ivory)]/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-[var(--ak-gold-light)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden className="text-[var(--ak-gold)]/60">
                /
              </li>
              <li className="text-[var(--ak-ivory)]/80">Contribuer</li>
            </ol>
          </nav>

          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-gold)] uppercase">
            {t.paths.contribute.title}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-4xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
            Soutenez Ahloul Khidmah
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ivory)]/75 md:text-lg">
            {t.paths.contribute.text} Montant libre, pour Touba et la
            Mouridiyah — carte de membre incluse si vous renseignez votre
            téléphone.
          </p>

          <div className="mt-10 rounded-3xl bg-[var(--ak-ivory)] p-4 text-[var(--ak-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.25)] md:p-8">
            <ContributeForm />
            <p className="mt-6 text-center text-sm text-[var(--ak-ink-soft)]">
              Vous souhaitez rejoindre une cellule ?{" "}
              <Link
                href="/adhesion"
                className="font-semibold text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
              >
                Remplir la fiche d&apos;adhésion
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
