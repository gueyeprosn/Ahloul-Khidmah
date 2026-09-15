import type { Metadata } from "next"
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { SeoPageShell } from "@/components/seo/seo-page-shell"
import { dictionaries } from "@/i18n/landing"
import { buildMetadata } from "@/lib/seo"

const t = dictionaries.fr.faq

export const metadata: Metadata = buildMetadata({
  title: "FAQ — Adhésion, cotisations et contributions",
  description:
    "Questions fréquentes sur l'adhésion Ahloul Khidmah, les cotisations, l'usage des fonds, l'adhésion depuis l'étranger et les contributions ponctuelles.",
  path: "/faq",
  keywords: [
    "FAQ Ahloul Khidmah",
    "adhésion mouride",
    "cotisation",
    "contribution Touba",
    "diaspora mouride",
  ],
})

export default function FaqPage() {
  return (
    <>
      <FaqJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "FAQ", path: "/faq" },
        ]}
      />
      <SeoPageShell
        eyebrow={t.eyebrow}
        title={t.title}
        intro="Tout ce qu'il faut savoir pour rejoindre Ahloul Khidmah ou soutenir la communauté par une contribution."
        path="/faq"
      >
        <dl className="space-y-8">
          {t.items.map((item) => (
            <div key={item.q}>
              <dt>
                <h2 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-emerald-deep)] md:text-2xl">
                  {item.q}
                </h2>
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </SeoPageShell>
    </>
  )
}
