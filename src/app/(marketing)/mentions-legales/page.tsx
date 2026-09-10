import type { Metadata } from "next"
import { SeoPageShell } from "@/components/seo/seo-page-shell"
import { contact } from "@/content/landing"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Mentions légales",
  description:
    "Mentions légales du site Ahloul Khidmah — Communauté des Serviteurs, Touba, Sénégal.",
  path: "/mentions-legales",
})

export default function MentionsLegalesPage() {
  return (
    <SeoPageShell
      eyebrow="Informations légales"
      title="Mentions légales"
      intro="Informations relatives à l'éditeur et à l'hébergement du site www.ahloulkhidmah.org."
      path="/mentions-legales"
      ctaLabel="Retour à l'adhésion"
    >
      <div className="space-y-8 text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Éditeur
          </h2>
          <p className="mt-3">
            <strong className="text-[var(--ak-ink)]">Ahloul Khidmah</strong> —
            La Communauté des Serviteurs
            <br />
            Siège / adresse de référence : {contact.address}
            <br />
            E-mail :{" "}
            <a
              href={`mailto:${contact.email}`}
              className="font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
            <br />
            WhatsApp : {contact.whatsappDisplay}
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Objet du site
          </h2>
          <p className="mt-3">
            La plateforme permet l&apos;adhésion nationale et internationale, la
            gestion des cotisations et les contributions au service de Touba et
            de la Mouridiyah.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Propriété intellectuelle
          </h2>
          <p className="mt-3">
            Les contenus (textes, images, logos, marques) présents sur ce site
            sont la propriété d&apos;Ahloul Khidmah ou utilisés avec
            autorisation. Toute reproduction non autorisée est interdite.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Contact
          </h2>
          <p className="mt-3">
            Pour toute question relative au site :{" "}
            <a
              href={`mailto:${contact.email}`}
              className="font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
          </p>
        </section>
      </div>
    </SeoPageShell>
  )
}
