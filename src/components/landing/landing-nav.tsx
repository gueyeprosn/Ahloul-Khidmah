"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { IdCard, Search, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/components/landing/locale-provider"
import { useCart } from "@/components/store/cart-provider"
import type { Locale } from "@/i18n/landing"

/** Pages dont le haut est un hero vert foncé — nav ivoire transparente OK. */
function hasDarkHero(pathname: string) {
  if (pathname === "/") return true
  if (pathname === "/boutique") return true
  if (pathname === "/adhesion") return true
  if (pathname === "/contribuer") return true
  if (pathname === "/mission") return true
  if (pathname === "/vision") return true
  return false
}

export function LandingNav({ isMember = false }: { isMember?: boolean }) {
  const { dict, locale, setLocale } = useLocale()
  const { itemCount, openDrawer } = useCart()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  // Fond clair (fiche produit, panier…) → header vert dès le départ, sinon
  // texte/menu ivoire disparaissent sur l’ivoire de page.
  const solid = scrolled || open || !hasDarkHero(pathname)

  function goHome(e: React.MouseEvent<HTMLAnchorElement>) {
    setOpen(false)
    // Déjà sur l'accueil (souvent avec un #ancre) → remonter en haut
    if (pathname === "/") {
      e.preventDefault()
      window.history.replaceState(null, "", "/")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const links = [
    { href: "/qui-sommes-nous", label: dict.nav.about },
    { href: "#adhesion", label: dict.nav.adhesion },
    { href: "#contribuer", label: dict.nav.contribute },
    { href: "/boutique", label: dict.nav.store },
    { href: "/mediatheque", label: dict.nav.mediatheque },
    { href: "#faq", label: dict.nav.faq },
  ] as const

  // Les liens du menu ciblent des ancres qui n'existent que sur l'accueil.
  // Depuis une autre page, il faut d'abord naviguer vers "/" avant l'ancre,
  // sinon le clic ne fait rien (bug : le menu semblait "ne pas marcher").
  function sectionHref(hash: string) {
    if (hash.startsWith("/") && !hash.startsWith("/#")) return hash
    return pathname === "/" ? hash : `/${hash}`
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setScrolled(window.scrollY > 24)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  function switchLocale(next: Locale) {
    setLocale(next)
    setOpen(false)
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid
          ? "border-b border-[var(--ak-gold)]/20 bg-[var(--ak-emerald-deep)]/95 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="relative z-10 flex items-center gap-3"
          onClick={goHome}
        >
          <Image
            src="/brand/logo.png"
            alt="Ahloul Khidmah"
            width={36}
            height={36}
            className="size-9 rounded-full object-cover ring-1 ring-[var(--ak-gold)]/50"
          />
          <span className="font-[family-name:var(--font-amiri)] text-lg tracking-wide text-[var(--ak-ivory)] md:text-xl">
            Ahloul Khidmah
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={sectionHref(link.href)}
              className="text-sm text-[var(--ak-ivory)]/75 transition-colors hover:text-[var(--ak-gold-light)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center rounded-xl border border-white/20 bg-white/5 p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => switchLocale("fr")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 transition-colors",
                locale === "fr"
                  ? "bg-[var(--ak-gold)] text-[var(--ak-emerald-deep)]"
                  : "text-[var(--ak-ivory)]/70 hover:text-[var(--ak-ivory)]"
              )}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => switchLocale("ar")}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-[family-name:var(--font-amiri)] transition-colors",
                locale === "ar"
                  ? "bg-[var(--ak-gold)] text-[var(--ak-emerald-deep)]"
                  : "text-[var(--ak-ivory)]/70 hover:text-[var(--ak-ivory)]"
              )}
            >
              ع
            </button>
          </div>

          <button
            type="button"
            aria-label="Rechercher un produit (Ctrl+K)"
            className="hidden size-9 items-center justify-center rounded-full text-[var(--ak-ivory)]/85 transition-colors hover:bg-white/10 hover:text-[var(--ak-gold-light)] sm:inline-flex"
            onClick={() => {
              setOpen(false)
              window.dispatchEvent(new Event("ak-open-store-search"))
            }}
          >
            <Search className="size-5" aria-hidden />
          </button>

          <button
            type="button"
            aria-label="Panier"
            className="relative inline-flex size-9 items-center justify-center rounded-full text-[var(--ak-ivory)]/85 transition-colors hover:bg-white/10 hover:text-[var(--ak-gold-light)]"
            onClick={() => {
              setOpen(false)
              openDrawer()
            }}
          >
            <ShoppingBag className="size-5" aria-hidden />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[var(--ak-gold)] text-[10px] font-bold text-[var(--ak-emerald-deep)]">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {!isMember ? (
            <>
              <Link
                href="/mon-espace"
                className="hidden rounded-2xl bg-[var(--ak-gold)] px-4 py-2 text-sm font-semibold text-[var(--ak-emerald-deep)] transition-colors hover:bg-[var(--ak-gold-light)] sm:inline-flex"
                onClick={() => setOpen(false)}
              >
                {dict.nav.monEspace}
              </Link>
              <Link
                href={sectionHref("#adhesion")}
                className="ak-cta-solid hidden rounded-2xl px-4 py-2 text-sm font-semibold sm:inline-flex"
                onClick={() => setOpen(false)}
              >
                {dict.nav.join}
              </Link>
            </>
          ) : (
            // <a> volontairement (pas <Link>) : garantit un montage frais de
            // la page mon-espace même si on y est déjà, pour que la vue
            // plein écran du badge se déclenche à chaque clic. Seul bouton
            // affiché une fois connecté (le lien "Mon espace" devient
            // redondant, on y est déjà). Toujours visible dans la barre du
            // haut, y compris sur mobile : juste le pictogramme (à côté du
            // sélecteur de langue) quand la place manque pour le texte.
            <a
              href="/mon-espace?vue=badge"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--ak-gold)] px-2.5 py-2 text-sm font-semibold text-[var(--ak-emerald-deep)] transition-colors hover:bg-[var(--ak-gold-light)] sm:px-4"
              onClick={() => setOpen(false)}
              aria-label={dict.nav.voirBadge}
            >
              <IdCard className="size-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{dict.nav.voirBadge}</span>
            </a>
          )}

          <button
            type="button"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="inline-flex size-10 items-center justify-center rounded-lg text-[var(--ak-ivory)] lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="relative block size-5">
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-5 bg-current transition-all duration-200",
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-1"
                )}
              />
              <span
                className={cn(
                  "absolute top-1/2 left-0 block h-0.5 w-5 -translate-y-1/2 bg-current transition-opacity duration-200",
                  open && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 block h-0.5 w-5 bg-current transition-all duration-200",
                  open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-1"
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-[var(--ak-gold)]/15 bg-[var(--ak-emerald-deep)]/95 backdrop-blur-md lg:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={sectionHref(link.href)}
              className="rounded-lg px-3 py-3 text-sm text-[var(--ak-ivory)]/85 transition-colors hover:bg-white/5 hover:text-[var(--ak-gold-light)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!isMember ? (
            <>
              <Link
                href="/mon-espace"
                className="mt-2 rounded-2xl bg-[var(--ak-gold)] px-4 py-3 text-center text-sm font-semibold text-[var(--ak-emerald-deep)]"
                onClick={() => setOpen(false)}
              >
                {dict.nav.monEspace}
              </Link>
              <Link
                href={sectionHref("#adhesion")}
                className="ak-cta-solid mt-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                {dict.nav.joinNow}
              </Link>
            </>
          ) : (
            <a
              href="/mon-espace?vue=badge"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--ak-gold)] px-4 py-3 text-center text-sm font-semibold text-[var(--ak-emerald-deep)]"
              onClick={() => setOpen(false)}
            >
              <IdCard className="size-4" aria-hidden />
              {dict.nav.voirBadge}
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
