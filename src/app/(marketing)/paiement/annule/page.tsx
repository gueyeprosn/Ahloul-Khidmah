import type { Metadata } from "next"
import Link from "next/link"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Paiement annulé",
  description: "Paiement annulé — Ahloul Khidmah.",
  path: "/paiement/annule",
  noIndex: true,
})

export default async function PaiementAnnulePage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>
}) {
  const { paymentId } = await searchParams

  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
      />
      <div className="relative mx-auto max-w-lg rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-8 text-center text-[var(--ak-ink)]">
        <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
          Paiement annulé
        </h1>
        <p className="mt-3 text-sm text-[var(--ak-ink-soft)]">
          Vous avez quitté la page PayDunya sans finaliser le paiement.
          {paymentId ? ` Réf. ${paymentId.slice(0, 12)}…` : ""}
        </p>
        <Link
          href="/#adhesion"
          className="mt-8 inline-flex rounded-full bg-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Retour à l&apos;adhésion
        </Link>
      </div>
    </section>
  )
}
