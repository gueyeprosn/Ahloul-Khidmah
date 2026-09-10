import type { Metadata } from "next"
import { SeoPageShell } from "@/components/seo/seo-page-shell"
import { contact } from "@/content/landing"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité d'Ahloul Khidmah : données d'adhésion, paiements, cookies et Google Analytics.",
  path: "/confidentialite",
})

export default function ConfidentialitePage() {
  return (
    <SeoPageShell
      eyebrow="Vie privée"
      title="Politique de confidentialité"
      intro="Comment Ahloul Khidmah collecte, utilise et protège vos données personnelles."
      path="/confidentialite"
      ctaLabel="Retour à l'adhésion"
    >
      <div className="space-y-8 text-sm leading-relaxed text-[var(--ak-ink-soft)] md:text-base">
        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Responsable du traitement
          </h2>
          <p className="mt-3">
            Ahloul Khidmah — {contact.address}
            <br />
            Contact :{" "}
            <a
              href={`mailto:${contact.email}`}
              className="font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Données collectées
          </h2>
          <p className="mt-3">
            Lors de l&apos;adhésion ou d&apos;une contribution, nous pouvons
            collecter : identité, contacts (téléphone, e-mail), informations de
            cellule, montant et canal de paiement, ainsi que des données
            techniques de navigation (via cookies / analytics).
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Finalités
          </h2>
          <ul className="mt-3 list-disc space-y-2 ps-5">
            <li>Traiter les adhésions et rattacher les membres aux cellules</li>
            <li>Gérer cotisations, contributions et reçus de paiement</li>
            <li>Communiquer sur le service communautaire (WhatsApp, e-mail)</li>
            <li>Améliorer le site (statistiques anonymisées via Google Analytics)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Conservation et sécurité
          </h2>
          <p className="mt-3">
            Les données sont conservées le temps nécessaire aux finalités
            ci-dessus et protégées par des mesures techniques adaptées
            (accès restreint, HTTPS, hébergement sécurisé).
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Vos droits
          </h2>
          <p className="mt-3">
            Vous pouvez demander l&apos;accès, la rectification ou la
            suppression de vos données en écrivant à{" "}
            <a
              href={`mailto:${contact.email}`}
              className="font-medium text-[var(--ak-emerald-deep)] underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)]">
            Cookies et mesure d&apos;audience
          </h2>
          <p className="mt-3">
            Le site utilise Google Analytics (gtag) pour comprendre
            l&apos;audience et améliorer l&apos;expérience. Ces outils peuvent
            déposer des cookies. Vous pouvez les limiter via les paramètres de
            votre navigateur.
          </p>
        </section>
      </div>
    </SeoPageShell>
  )
}
