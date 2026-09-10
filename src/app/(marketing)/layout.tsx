import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Amiri, Cairo } from "next/font/google"
import { LandingNav } from "@/components/landing/landing-nav"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LocaleProvider } from "@/components/landing/locale-provider"
import { CartProvider } from "@/components/store/cart-provider"
import { StoreCartDrawer } from "@/components/store/store-cart-drawer"
import { StoreSearchPalette } from "@/components/store/store-search-palette"
import { MarketingJsonLd } from "@/components/seo/json-ld"
import { LOCALE_COOKIE, type Locale } from "@/i18n/landing"
import { buildMetadata } from "@/lib/seo"
import { getMemberSession } from "@/lib/member-auth"
import "./landing.css"

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
  // Évite le warning « préchargée mais non utilisée » (CSS route-split / next/font).
  preload: false,
})

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = buildMetadata({
  title: "Ahloul Khidmah — Servir la Mouridiyah",
  description:
    "Ensemble, servons la Mouridiyah avec Foi, Discipline, Savoir et Excellence. Adhésion nationale et internationale, cotisations et contributions — Touba, Sénégal et diaspora.",
  path: "/",
  absoluteTitle: true,
})

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jar = await cookies()
  const raw = jar.get(LOCALE_COOKIE)?.value
  const initialLocale: Locale = raw === "ar" ? "ar" : "fr"
  const memberSession = await getMemberSession()

  return (
    <LocaleProvider initialLocale={initialLocale}>
      <CartProvider>
        <MarketingJsonLd />
        <div
          id="marketing-shell"
          className={`${amiri.variable} ${cairo.variable} min-h-screen bg-[var(--ak-ivory)] font-[family-name:var(--font-cairo)] text-[var(--ak-ink)] antialiased`}
          lang={initialLocale === "ar" ? "ar" : "fr"}
          dir={initialLocale === "ar" ? "rtl" : "ltr"}
        >
          <LandingNav isMember={Boolean(memberSession)} />
          <main>{children}</main>
          <LandingFooter />
        </div>
        <StoreCartDrawer />
        <StoreSearchPalette />
      </CartProvider>
    </LocaleProvider>
  )
}
