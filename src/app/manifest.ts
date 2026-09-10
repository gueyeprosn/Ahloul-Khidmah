import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AHLOUL KHIDMAH",
    short_name: "AHLOUL KHIDMAH",
    description:
      "Ensemble, servons la Mouridiyah avec Foi, Discipline, Savoir et Excellence. Recensement et adhésion.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0B3A25",
    theme_color: "#0B3A25",
    lang: "fr",
    dir: "auto",
    categories: ["social", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Adhérer",
        short_name: "Adhérer",
        description: "Fiche d'adhésion Ahloul Khidmah",
        url: "/#adhesion",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Contribuer",
        short_name: "Contribuer",
        description: "Faire un don",
        url: "/#contribuer",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  }
}
