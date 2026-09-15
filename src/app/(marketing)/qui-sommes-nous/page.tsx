import type { Metadata } from "next"
import { QuiSommesNousContent } from "@/components/landing/qui-sommes-nous-content"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Qui sommes-nous — Ahloul Khidmah",
  description:
    "Ahloul Khidmah : organisation au service de la Mouridiyah, portée par Dieuwrigne Serigne Mbackiyou Faye sous le Ndiguel du Khalife général Serigne Mouhamadou Mountakha Mbacké. Mobiliser, organiser, financer, impacter.",
  path: "/qui-sommes-nous",
  keywords: [
    "Ahloul Khidmah",
    "qui sommes-nous",
    "من نحن",
    "أهل الخدمة",
    "Mouridiyah",
    "Dieuwrigne Mbackiyou Faye",
    "Serigne Mouhamadou Mountakha Mbacké",
    "Cheikh Ahmadou Bamba",
    "Touba",
    "khidma",
    "Ndiguel",
  ],
})

export default function QuiSommesNousPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", path: "/" },
          { name: "Qui sommes-nous", path: "/qui-sommes-nous" },
        ]}
      />
      <QuiSommesNousContent />
    </>
  )
}
