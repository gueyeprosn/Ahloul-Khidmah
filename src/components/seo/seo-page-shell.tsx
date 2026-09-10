import Link from "next/link"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"

type SeoPageShellProps = {
  eyebrow: string
  title: string
  intro: string
  path: string
  children: React.ReactNode
  ctaHref?: string
  ctaLabel?: string
  ctaOr?: string
  ctaContributeLabel?: string
  homeLabel?: string
}

export function SeoPageShell({
  eyebrow,
  title,
  intro,
  path,
  children,
  ctaHref = "/adhesion",
  ctaLabel = "Adhérer maintenant",
  ctaOr = "Ou",
  ctaContributeLabel = "Faire un don",
  homeLabel = "Accueil",
}: SeoPageShellProps) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel, path: "/" },
          { name: title, path },
        ]}
      />
      <article className="relative">
        <div className="relative overflow-hidden bg-[var(--ak-emerald-deep)] px-5 pt-28 pb-16 md:px-8 md:pt-36 md:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_60%,var(--ak-emerald-deep)_100%)]"
          />
          <div className="ak-pattern pointer-events-none absolute inset-0 opacity-20" />

          <div className="relative mx-auto max-w-3xl">
            <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-[var(--ak-ivory)]/55">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-[var(--ak-gold-light)]">
                    {homeLabel}
                  </Link>
                </li>
                <li aria-hidden className="text-[var(--ak-gold)]/60">
                  /
                </li>
                <li className="text-[var(--ak-ivory)]/80">{eyebrow}</li>
              </ol>
            </nav>

            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--ak-gold)] uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-amiri)] text-4xl leading-tight text-[var(--ak-ivory)] md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--ak-ivory)]/75 md:text-lg">
              {intro}
            </p>
          </div>
        </div>

        <div className="relative mx-auto -mt-8 max-w-3xl px-5 pb-20 md:px-8 md:pb-28">
          <div className="rounded-3xl border border-[#E6DCC0] bg-[var(--ak-ivory)] p-6 text-[var(--ak-ink)] shadow-[0_20px_50px_rgba(0,0,0,0.18)] md:p-10">
            {children}

            <div className="mt-12 border-t border-[#E6DCC0] pt-8">
              <Link
                href={ctaHref}
                className="ak-cta-solid inline-flex items-center justify-center rounded-2xl px-7 py-3.5 text-sm font-bold"
              >
                {ctaLabel}
              </Link>
              <p className="mt-4 text-sm text-[var(--ak-ink-soft)]">
                {ctaOr}{" "}
                <Link
                  href="/contribuer"
                  className="font-semibold text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
                >
                  {ctaContributeLabel}
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}
