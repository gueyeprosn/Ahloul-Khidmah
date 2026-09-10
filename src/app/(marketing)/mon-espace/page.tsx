import type { Metadata } from "next"
import { MonEspaceClient } from "@/components/mon-espace/mon-espace-client"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Mon espace membre",
  description:
    "Accédez à votre profil Ahloul Khidmah et suivez vos versements avec votre téléphone et les 4 derniers caractères de votre N° membre.",
  path: "/mon-espace",
  noIndex: true,
})

export default function MonEspacePage() {
  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
      />
      <div className="relative mx-auto max-w-lg rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-6 shadow-xl md:max-w-xl md:p-8">
        <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
          Mon espace
        </h1>
        <p className="mt-2 text-sm text-[var(--ak-ink-soft)]">
          Consultez et mettez à jour votre profil, suivez vos cotisations.
          Identifiants : téléphone + 4 derniers caractères de votre N° badge.
        </p>
        <div className="mt-6">
          <MonEspaceClient />
        </div>
      </div>
    </section>
  )
}
