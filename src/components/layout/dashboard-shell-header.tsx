"use client"

import { usePathname } from "next/navigation"
import { AppHeader } from "@/components/layout/app-header"

const labels: Record<string, string> = {
  "": "Vue d'ensemble",
  adherents: "Adhérents",
  nouveau: "Nouvelle adhésion",
  cotisations: "Cotisations",
  contributions: "Contributions",
  cellules: "Cellules",
  competences: "Compétences",
  rapports: "Rapports",
  detail: "Rapport détaillé",
  medias: "Albums photo",
  temoignages: "Témoignages",
  journal: "Journal d'activité",
  parametres: "Paramètres",
  profil: "Profil",
  organisation: "Organisation",
}

function labelFor(segment: string) {
  if (labels[segment]) return labels[segment]
  // IDs adhérents / UUID-like
  if (/^[A-Z]{2,}-|\d{6,}|^[a-f0-9-]{8,}$/i.test(segment)) return "Détail"
  return segment
}

export function DashboardShellHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs =
    pathname === "/dashboard"
      ? [{ label: "Vue d'ensemble" }]
      : [
          { label: "Dashboard", href: "/dashboard" },
          ...segments
            .filter((segment) => segment !== "dashboard")
            .map((segment, index, arr) => {
              const pathSegments = segments.slice(
                0,
                segments.indexOf(segment) + 1
              )
              const href = "/" + pathSegments.join("/")
              const isLast = index === arr.length - 1
              return {
                label: labelFor(segment),
                href: isLast ? undefined : href,
              }
            }),
        ]

  return <AppHeader breadcrumbs={breadcrumbs} />
}
