import type { Metadata } from "next"

export const SITE_URL = "https://www.ahloulkhidmah.org"
export const SITE_NAME = "Ahloul Khidmah"
export const SITE_TAGLINE = "La Communauté des Serviteurs"
export const OG_IMAGE = {
  url: "/brand/og-share.jpg",
  width: 1200,
  height: 630,
  alt: "Ahloul Khidmah — La Communauté des Serviteurs",
} as const

export const DEFAULT_DESCRIPTION =
  "Ahloul Khidmah — La Communauté des Serviteurs. Adhésion nationale et internationale, cotisations et contributions au service de Touba et de la Mouridiyah. Foi, Discipline, Savoir et Excellence."

/** Mots-clés stratégiques Mouridiyah / Touba / adhésion (FR). */
export const DEFAULT_KEYWORDS = [
  "Ahloul Khidmah",
  "Ahloul Khidma",
  "Mouridiyah",
  "Mouride",
  "Touba",
  "Serigne Touba",
  "Cheikh Ahmadou Bamba",
  "khidma",
  "adhésion mouride",
  "cotisation mouride",
  "communauté des serviteurs",
  "diaspora mouride",
  "talibé",
  "Sénégal",
]

type BuildMetadataOptions = {
  title: string
  description?: string
  path?: string
  noIndex?: boolean
  /** Si false, n’applique pas le template « · Ahloul Khidmah » (titre absolu). */
  absoluteTitle?: boolean
  keywords?: string[]
  /** Image OG/Twitter dédiée (ex. photo produit) — sinon l'image du site. */
  image?: { url: string; width?: number; height?: number; alt?: string }
}

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return SITE_URL
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noIndex = false,
  absoluteTitle = false,
  keywords = DEFAULT_KEYWORDS,
  image,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path)
  const ogImage = image
    ? {
        url: image.url,
        width: image.width ?? OG_IMAGE.width,
        height: image.height ?? OG_IMAGE.height,
        alt: image.alt ?? title,
      }
    : {
        url: OG_IMAGE.url,
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        alt: OG_IMAGE.alt,
      }
  const resolvedTitle = absoluteTitle
    ? { absolute: title }
    : title

  return {
    title: resolvedTitle,
    description,
    keywords,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "religion",
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "fr_SN",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  }
}
