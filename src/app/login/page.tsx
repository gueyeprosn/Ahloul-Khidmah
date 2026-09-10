import type { Metadata } from "next"
import { Suspense } from "react"
import LoginPage from "./page-client"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Connexion",
  description: "Espace administrateur Ahloul Khidmah.",
  path: "/login",
  noIndex: true,
})

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-[#061f14]" />}>
      <LoginPage />
    </Suspense>
  )
}
