import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/login",
          "/adherents",
          "/cotisations",
          "/contributions",
          "/cellules",
          "/competences",
          "/rapports",
          "/parametres",
          "/medias",
          "/temoignages",
          "/api/",
          "/paiement/",
          "/valider/",
          "/adhesion/completer",
          "/mes-versements",
          "/mon-espace",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
