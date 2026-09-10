import { PageHeader } from "@/components/shared/page-header"
import { AdhesionForm } from "@/components/adhesion/adhesion-form"

export const metadata = { title: "Inscrire un membre" }

export default function NouvelleAdhesionPage() {
  return (
    <>
      <PageHeader
        title="Inscrire un membre"
        description="Formulaire court — le N° d’adhésion est attribué automatiquement. Pour un membre déjà payé en espèces (cellule), le compte est créé actif tout de suite."
      />
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#E6DCC0] bg-[var(--ak-ivory)] p-4 text-[var(--ak-ink)] shadow-sm md:p-6">
        <AdhesionForm mode="admin" />
      </div>
    </>
  )
}
