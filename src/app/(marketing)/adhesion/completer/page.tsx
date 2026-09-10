import type { Metadata } from "next"
import { AdhesionCompleteForm } from "@/components/adhesion/adhesion-complete-form"
import Link from "next/link"
import { buildMetadata } from "@/lib/seo"
import { prisma } from "@/lib/db"

export const metadata: Metadata = buildMetadata({
  title: "Compléter ma fiche",
  description: "Complétez votre fiche membre Ahloul Khidmah.",
  path: "/adhesion/completer",
  noIndex: true,
})

export default async function CompleterFichePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tel?: string }>
}) {
  const { id, tel: telQs } = await searchParams

  if (!id?.trim()) {
    return (
      <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
        />
        <div className="relative mx-auto max-w-lg rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-8 text-center">
          <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Lien incomplet
          </h1>
          <p className="mt-3 text-sm text-[var(--ak-ink-soft)]">
            Identifiant d&apos;adhésion manquant. Revenez depuis la page de
            confirmation de paiement.
          </p>
          <Link
            href="/#adhesion"
            className="mt-6 inline-block rounded-full bg-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Retour à l&apos;adhésion
          </Link>
        </div>
      </section>
    )
  }

  const adherent = await prisma.adherent.findUnique({
    where: { id: id.trim() },
    select: {
      id: true,
      nom: true,
      prenoms: true,
      tel: true,
      whatsapp: true,
      profession: true,
      email: true,
      ficheComplete: true,
    },
  })

  if (!adherent) {
    return (
      <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
        />
        <div className="relative mx-auto max-w-lg rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-8 text-center">
          <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Dossier introuvable
          </h1>
          <p className="mt-3 text-sm text-[var(--ak-ink-soft)]">
            Aucune adhésion ne correspond à cette référence.
          </p>
          <Link
            href="/#adhesion"
            className="mt-6 inline-block rounded-full bg-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Retour à l&apos;adhésion
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
      />
      <div className="relative mx-auto max-w-2xl rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-6 shadow-xl md:p-8">
        <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
          Compléter ma fiche
        </h1>
        <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
          Réf. {adherent.id}
          {adherent.ficheComplete ? " · Fiche déjà complète (modifiable)" : ""}
        </p>
        <div className="mt-6">
          <AdhesionCompleteForm
            adherentId={adherent.id}
            initial={{
              nom: adherent.nom,
              prenoms: adherent.prenoms,
              tel: telQs?.trim() || adherent.tel,
              whatsapp: adherent.whatsapp || "",
              profession:
                adherent.profession === "À préciser" ? "" : adherent.profession,
            }}
          />
        </div>
      </div>
    </section>
  )
}
