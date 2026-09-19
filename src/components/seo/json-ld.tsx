import { headers } from "next/headers"
import { contact } from "@/content/landing"
import { dictionaries } from "@/i18n/landing"
import { CSP_NONCE_HEADER } from "@/lib/csp"
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  OG_IMAGE,
  absoluteUrl,
} from "@/lib/seo"

async function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  // Échappe "<" : JSON.stringify ne le fait pas, et un champ contenant
  // littéralement "</script>" (ex. nom de produit) romprait sinon la balise
  // et permettrait d'injecter du HTML/JS.
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  const nonce = (await headers()).get(CSP_NONCE_HEADER) || undefined
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["Organization", "NGO"],
    name: SITE_NAME,
    alternateName: [SITE_TAGLINE, "أهل الخدمة", "Ahloul Khidma"],
    url: SITE_URL,
    logo: absoluteUrl("/icons/icon-512.png"),
    image: absoluteUrl(OG_IMAGE.url),
    description:
      "Communauté organisée au service de Touba et de la Mouridiyah — adhésion, cotisations et contributions. Foi, Discipline, Savoir et Excellence.",
    email: contact.email,
    foundingLocation: {
      "@type": "Place",
      name: "Touba",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Touba",
        addressCountry: "SN",
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Touba",
      addressCountry: "SN",
    },
    areaServed: [
      { "@type": "Country", name: "Senegal" },
      { "@type": "Place", name: "Diaspora mouride" },
    ],
    sameAs: [contact.website, contact.whatsappHref],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: contact.email,
        telephone: "+221752282828",
        availableLanguage: ["French", "Arabic"],
        areaServed: "SN",
      },
    ],
    knowsAbout: [
      "Mouridiyah",
      "Touba",
      "Khidma",
      "Serigne Touba",
      "Cheikh Ahmadou Bamba",
    ],
  }

  return <JsonLdScript data={data} />
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_TAGLINE,
    url: SITE_URL,
    inLanguage: ["fr-SN", "ar"],
    description:
      "Plateforme d'adhésion et de contribution Ahloul Khidmah — servir la Mouridiyah depuis Touba et la diaspora.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/icons/icon-512.png"),
    },
    potentialAction: {
      "@type": "JoinAction",
      target: absoluteUrl("/adhesion"),
      name: "Adhérer à Ahloul Khidmah",
    },
  }

  return <JsonLdScript data={data} />
}

export function FaqJsonLd() {
  const items = dictionaries.fr.faq.items
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fr-SN",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }

  return <JsonLdScript data={data} />
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[]
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }

  return <JsonLdScript data={data} />
}

const SCHEMA_AVAILABILITY: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
  preorder: "https://schema.org/PreOrder",
}

export function ProductJsonLd({
  name,
  description,
  slug,
  sku,
  price,
  priceIsRange,
  images,
  availability,
  reviewStats,
}: {
  name: string
  description: string
  slug: string
  sku: string
  price: number
  priceIsRange: boolean
  images: string[]
  availability: "in_stock" | "low_stock" | "out_of_stock" | "preorder"
  /** Étoiles (rich snippet Google) — omis si aucun avis approuvé. */
  reviewStats?: { average: number; count: number }
}) {
  const hasReviews = Boolean(reviewStats && reviewStats.count > 0)
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku,
    image: images.map((src) => absoluteUrl(src)),
    url: absoluteUrl(`/boutique/produits/${slug}`),
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(hasReviews && reviewStats
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewStats.average,
            reviewCount: reviewStats.count,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/boutique/produits/${slug}`),
      priceCurrency: "XOF",
      price,
      ...(priceIsRange ? { priceSpecification: { "@type": "PriceSpecification", minPrice: price } } : {}),
      availability: SCHEMA_AVAILABILITY[availability],
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  }

  return <JsonLdScript data={data} />
}

/** Organization + WebSite pour toutes les pages marketing. */
export function MarketingJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
    </>
  )
}
