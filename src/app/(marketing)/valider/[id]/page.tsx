import type { Metadata } from "next"
import { ValidationClient } from "@/components/adhesion/validation-client"
import { prisma } from "@/lib/db"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Validation d'adhésion",
  description:
    "Vérification du QR code et du numéro d'identification Ahloul Khidmah.",
  path: "/valider",
  noIndex: true,
})

export default async function ValiderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId).slice(0, 64)

  // Page publique (scan QR, sans connexion) — on ne lit volontairement que
  // le strict nécessaire pour répondre à "cette carte est-elle valide ?" :
  // pas de téléphone, cellule, région, profession, montant ni canal (voir
  // P0-3 de l'audit sécurité — ces champs ne doivent jamais quitter le
  // serveur pour cette page, même sans être affichés à l'écran).
  const adherent = await prisma.adherent.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      prenoms: true,
      memberNumber: true,
      createdAt: true,
      status: true,
    },
  })

  const ticket = adherent
    ? {
        id: adherent.id,
        nom: adherent.nom,
        prenoms: adherent.prenoms,
        memberNumber: adherent.memberNumber,
        createdAt: adherent.createdAt.toISOString(),
        status: adherent.status,
      }
    : null

  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
      />
      <div className="ak-pattern pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative mx-auto max-w-lg">
        <ValidationClient id={id} ticket={ticket} />
      </div>
    </section>
  )
}
