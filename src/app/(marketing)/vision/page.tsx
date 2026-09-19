import type { Metadata } from "next"
import { SeoPageShell } from "@/components/seo/seo-page-shell"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { dictionaries } from "@/i18n/landing"
import { buildMetadata } from "@/lib/seo"

const t = dictionaries.fr.vision

export const metadata: Metadata = buildMetadata({
  title: "Vision — Touba, capitale spirituelle exemplaire",
  description:
    "La vision d'Ahloul Khidmah : faire de Touba une grande capitale spirituelle du monde musulman — moderne, organisée, accueillante et exemplaire, au service de la Mouridiyah.",
  path: "/vision",
  keywords: [
    "vision Ahloul Khidmah",
    "Touba capitale spirituelle",
    "Mouridiyah",
    "développement Touba",
    "Serigne Touba",
  ],
})

export default function VisionPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Vision", path: "/vision" },
        ]}
      />
      <SeoPageShell
        eyebrow={t.eyebrow}
        title={t.title}
        intro={t.summary}
      >
        <div className="space-y-6 text-base leading-relaxed text-[var(--ak-ink-soft)] whitespace-pre-line">
          {t.full.replace("Ahloul Khidma", "Ahloul Khidmah")}
        </div>

        <h2 className="mt-10 font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
          Une ambition spirituelle et concrète
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[var(--ak-ink-soft)]">
          Cette vision ne se limite pas à la ville. Elle porte le rayonnement
          intellectuel, culturel, social et institutionnel de la Mouridiyah au
          Sénégal et à l&apos;international — fidèle aux valeurs de Foi,
          Discipline, Savoir et Excellence.
        </p>
      </SeoPageShell>
    </>
  )
}
