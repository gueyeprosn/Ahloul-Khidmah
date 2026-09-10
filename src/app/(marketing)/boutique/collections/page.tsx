import type { Metadata } from "next"
import Link from "next/link"
import { Layers } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { AppImage } from "@/components/media/app-image"
import { getActiveCollections } from "@/lib/store/collections"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Collections — Ahloul Khidmah Store",
  description: "Nos collections éditoriales — sélections thématiques, saisonnières et événementielles.",
  path: "/boutique/collections",
})

const TYPE_LABEL: Record<string, string> = {
  PERMANENTE: "Permanente",
  SAISONNIERE: "Saisonnière",
  EVENEMENTIELLE: "Événementielle",
  LIMITEE: "Édition limitée",
  MEMBRE: "Réservée aux membres",
  SOLIDAIRE: "Solidaire",
}

export default async function CollectionsPage() {
  const collections = await getActiveCollections()

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/boutique" },
          { name: "Collections", path: "/boutique/collections" },
        ]}
      />

      <section className="relative overflow-hidden bg-[var(--ak-emerald-deep)] px-5 pt-28 pb-16 md:px-8 md:pt-36 md:pb-20">
        <div className="relative mx-auto max-w-6xl">
          <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ivory)]/55">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-[var(--ak-gold-light)]">
                  Accueil
                </Link>
              </li>
              <li aria-hidden className="text-[var(--ak-gold)]/60">/</li>
              <li>
                <Link href="/boutique" className="hover:text-[var(--ak-gold-light)]">
                  Boutique
                </Link>
              </li>
              <li aria-hidden className="text-[var(--ak-gold)]/60">/</li>
              <li className="text-[var(--ak-ivory)]/80">Collections</li>
            </ol>
          </nav>

          <h1 className="font-[family-name:var(--font-amiri)] text-3xl text-[var(--ak-ivory)] md:text-4xl">
            Nos collections
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--ak-ivory)]/75">
            Des sélections éditoriales pensées autour d&apos;un thème, d&apos;une saison ou d&apos;un événement.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
        {collections.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 py-16 text-center">
            <Layers className="size-10 text-[var(--ak-ink-soft)]/40" aria-hidden />
            <p className="text-[var(--ak-ink-soft)]">Aucune collection disponible pour le moment.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <Link
                key={c.slug}
                href={`/boutique/collections/${c.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_4px_20px_rgba(11,58,37,0.08)] transition-shadow hover:shadow-[0_8px_30px_rgba(11,58,37,0.14)]"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--ak-emerald-deep)] to-[var(--ak-emerald-mid)]">
                  {c.coverImage ? (
                    <AppImage
                      src={c.coverImage}
                      alt={c.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Layers className="size-12 text-[var(--ak-gold)]/70" aria-hidden />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-xs font-semibold tracking-[0.2em] text-[var(--ak-gold-dark)] uppercase">
                    {TYPE_LABEL[c.type] || c.type}
                  </span>
                  <h2 className="font-[family-name:var(--font-amiri)] text-xl text-[var(--ak-ink)]">
                    {c.name}
                  </h2>
                  {c.tagline && (
                    <p className="text-sm text-[var(--ak-ink-soft)]">{c.tagline}</p>
                  )}
                  <span className="mt-auto pt-2 text-xs text-[var(--ak-ink-soft)]">
                    {c._count.products} produit{c._count.products > 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
