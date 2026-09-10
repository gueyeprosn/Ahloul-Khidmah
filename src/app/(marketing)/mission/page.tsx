import type { Metadata } from "next"
import { SeoPageShell } from "@/components/seo/seo-page-shell"
import { dictionaries } from "@/i18n/landing"
import { buildMetadata } from "@/lib/seo"

const t = dictionaries.fr.mission

export const metadata: Metadata = buildMetadata({
  title: "Mission — Servir la Mouridiyah",
  description:
    "La mission d'Ahloul Khidmah : mobiliser, organiser, financer, impacter et communiquer pour un khidma durable au service de Touba et de la Mouridiyah.",
  path: "/mission",
  keywords: [
    "mission Ahloul Khidmah",
    "khidma organisé",
    "Mouridiyah",
    "Touba",
    "piliers du service",
    "talibés engagés",
  ],
})

export default function MissionPage() {
  return (
    <SeoPageShell
      eyebrow={t.eyebrow}
      title={t.title}
      intro={t.intro}
      path="/mission"
    >
      <p className="text-base leading-relaxed text-[var(--ak-ink-soft)]">
        Ahloul Khidmah structure les forces de la Mouridiyah sous les
        orientations du Khalife général des Mourides. Notre objectif : transformer
        l&apos;énergie des talibés — au Sénégal et dans la diaspora — en actions
        concrètes, traçables et durables pour Touba.
      </p>

      <ol className="mt-10 space-y-8">
        {t.pillars.map((pillar, index) => (
          <li key={pillar.title} className="flex gap-4">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] font-[family-name:var(--font-amiri)] text-lg text-[var(--ak-gold-light)]"
            >
              {index + 1}
            </span>
            <div>
              <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
                {pillar.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
                {pillar.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SeoPageShell>
  )
}
