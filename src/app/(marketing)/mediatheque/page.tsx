import type { Metadata } from "next"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { LandingGalerie } from "@/components/landing/landing-galerie"
import { getGaleriePhotos } from "@/lib/cms"
import { dictionaries } from "@/i18n/landing"
import { buildMetadata } from "@/lib/seo"

const t = dictionaries.fr.gallery

export const revalidate = 60

export const metadata: Metadata = buildMetadata({
  title: "Médiathèque — photos du khidma",
  description:
    "Médiathèque Ahloul Khidmah : diaporama de photos du service, de la communauté et du rayonnement à Touba.",
  path: "/mediatheque",
  keywords: [
    "médiathèque Ahloul Khidmah",
    "photos Touba",
    "galerie mouride",
    "khidma",
    "Ahloul Khidmah",
  ],
})

export default async function MediathequePage() {
  const photos = await getGaleriePhotos()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: t.eyebrow, path: "/mediatheque" },
        ]}
      />
      <div className="pt-8 md:pt-12">
        {photos.length > 0 ? (
          <LandingGalerie photos={photos} asPage />
        ) : (
          <section className="px-5 py-28 md:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-emerald-mid)] uppercase">
                {t.eyebrow}
              </p>
              <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-4xl text-[var(--ak-emerald-deep)]">
                {t.title}
              </h1>
              <p className="mt-5 text-base text-[var(--ak-ink-soft)]">
                Les photos seront bientôt disponibles.
              </p>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
