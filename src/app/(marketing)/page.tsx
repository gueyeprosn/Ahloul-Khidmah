import type { Metadata } from "next"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingJoin } from "@/components/landing/landing-join"
import { LandingPourquoi } from "@/components/landing/landing-pourquoi"
import { LandingMission } from "@/components/landing/landing-mission"
import { LandingStoreMention } from "@/components/landing/landing-store-mention"
import { LandingGalerie } from "@/components/landing/landing-galerie"
import { LandingTemoignages } from "@/components/landing/landing-temoignages"
import { LandingFaq } from "@/components/landing/landing-faq"
import { LandingCta } from "@/components/landing/landing-cta"
import { ScrollToAdhesion } from "@/components/landing/scroll-to-adhesion"
import { FaqJsonLd } from "@/components/seo/json-ld"
import { getGaleriePhotos, getTestimonials } from "@/lib/cms"
import { buildMetadata } from "@/lib/seo"
import { getMemberSession } from "@/lib/member-auth"

/** Cache serveur CMS / pics de visite (layout cookie = toujours dynamique côté Next). */
export const revalidate = 60

export const metadata: Metadata = buildMetadata({
  title: "Ahloul Khidmah — Adhésion et contribution au service de Touba",
  description:
    "Rejoignez Ahloul Khidmah : adhésion nationale et internationale, ou contribution ponctuelle avec carte de membre incluse. Communauté des Serviteurs au service de Serigne Touba, Touba et la diaspora mouride.",
  path: "/",
  absoluteTitle: true,
})

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ montant?: string }>
}) {
  const params = await searchParams
  const [testimonials, photos, memberSession] = await Promise.all([
    getTestimonials(),
    getGaleriePhotos(),
    getMemberSession(),
  ])
  const isMember = Boolean(memberSession)

  return (
    <>
      <FaqJsonLd />
      <ScrollToAdhesion isMember={isMember} />
      <LandingHero isMember={isMember} />
      <LandingJoin defaultMontant={params.montant} isMember={isMember} />
      <LandingPourquoi />
      <LandingMission />
      <LandingStoreMention />
      <LandingGalerie photos={photos} />
      <LandingTemoignages items={testimonials} />
      <LandingFaq />
      <LandingCta isMember={isMember} />
    </>
  )
}
