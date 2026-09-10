import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { prisma } from "@/lib/db"
import { completePaymentByToken } from "@/lib/payments"
import { formatFcfa } from "@/lib/format"
import { buildMetadata } from "@/lib/seo"
import { MemberCardActions } from "@/components/adhesion/member-card-actions"
import { AutoClaimPin } from "@/components/mon-espace/auto-claim-pin"
import { isWhatsAppCloudConfigured } from "@/lib/whatsapp"

export const metadata: Metadata = buildMetadata({
  title: "Retour paiement",
  description: "Confirmation de paiement Ahloul Khidmah.",
  path: "/paiement/retour",
  noIndex: true,
})

export default async function PaiementRetourPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string; token?: string }>
}) {
  const { paymentId, token: qsToken } = await searchParams

  let payment = paymentId
    ? await prisma.payment.findUnique({ where: { id: paymentId } })
    : null

  if (!payment && qsToken) {
    payment = await prisma.payment.findFirst({ where: { token: qsToken } })
  }

  // Confirmer auprès de PayDunya si encore pending
  if (payment?.token && payment.status === "pending") {
    try {
      const result = await completePaymentByToken(payment.token)
      if (result.payment) payment = result.payment
    } catch {
      // leave pending
    }
    payment = await prisma.payment.findUnique({ where: { id: payment.id } })
  }

  const status = payment?.status || "unknown"
  const ok = status === "completed"
  const failed = status === "failed" || status === "canceled"
  const isDon = payment?.type === "don"
  const adherentId = payment?.adherentId
  const needsFiche =
    ok &&
    !isDon &&
    adherentId &&
    (
      await prisma.adherent.findUnique({
        where: { id: adherentId },
        select: { ficheComplete: true },
      })
    )?.ficheComplete === false

  const whatsappCloud = isWhatsAppCloudConfigured()

  const adherentMeta =
    ok && adherentId
      ? await prisma.adherent.findUnique({
          where: { id: adherentId },
          select: { badgeSentAt: true },
        })
      : null

  const badgeSent = Boolean(adherentMeta?.badgeSentAt)

  const okMessage = adherentId
    ? whatsappCloud
      ? badgeSent
        ? isDon
          ? "Merci pour votre don — il vous donne aussi accès à votre badge membre, envoyé sur WhatsApp."
          : "Merci pour votre adhésion. Votre badge membre vous a été envoyé sur WhatsApp."
        : isDon
          ? "Merci pour votre don — il vous donne aussi accès à votre badge membre, en cours d'envoi sur WhatsApp."
          : "Merci pour votre adhésion. Votre badge membre est en cours d'envoi sur WhatsApp."
      : isDon
        ? "Merci pour votre don — il vous donne aussi accès à votre badge membre. Téléchargez-le ci-dessous."
        : "Merci pour votre adhésion. Téléchargez votre badge membre ci-dessous."
    : isDon
      ? "Merci pour votre soutien. Votre contribution a été enregistrée — vous n'êtes pas inscrit comme adhérent."
      : "Merci pour votre contribution. Votre cotisation a été enregistrée auprès d'Ahloul Khidmah."

  const adherent =
    ok && adherentId
      ? await prisma.adherent.findUnique({
          where: { id: adherentId },
          select: {
            id: true,
            prenoms: true,
            nom: true,
            celluleLocale: true,
            zoneRegion: true,
            tel: true,
            whatsapp: true,
            memberNumber: true,
            photoUrl: true,
          },
        })
      : null

  return (
    <section className="relative min-h-[100svh] px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#164A2E_0%,var(--ak-emerald-deep)_50%)]"
      />
      <div className="relative mx-auto max-w-lg rounded-2xl border border-[var(--ak-gold)] bg-[var(--ak-ivory)] p-8 text-center text-[var(--ak-ink)] shadow-xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--ak-emerald-deep)] text-[var(--ak-gold-light)]">
          {ok ? (
            <CheckCircle2 className="size-7" />
          ) : failed ? (
            <XCircle className="size-7" />
          ) : (
            <Clock className="size-7" />
          )}
        </div>

        <h1 className="font-[family-name:var(--font-amiri)] text-2xl text-[var(--ak-emerald-deep)] md:text-3xl">
          {ok
            ? isDon
              ? "Contribution confirmée"
              : payment?.type === "adhesion"
                ? "Adhésion confirmée"
                : "Paiement confirmé"
            : failed
              ? "Paiement non abouti"
              : "Paiement en cours"}
        </h1>

        <p className="mt-3 text-sm text-[var(--ak-ink-soft)]">
          {ok
            ? okMessage
            : failed
              ? "Le paiement a été annulé ou a échoué. Vous pouvez réessayer."
              : "La confirmation peut prendre quelques instants (saisie du code mobile). Rechargez cette page si besoin."}
        </p>

        {payment ? (
          <dl className="mt-6 space-y-2 text-left text-sm">
            <Row label="Référence" value={payment.id.slice(0, 12)} />
            <Row label="Montant" value={formatFcfa(payment.amount)} />
            {payment.periode ? (
              <Row label="Période" value={payment.periode} />
            ) : null}
            {payment.receiptUrl ? (
              <div className="pt-2">
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ak-emerald-mid)] underline"
                >
                  Télécharger le reçu PayDunya
                </a>
              </div>
            ) : null}
          </dl>
        ) : null}

        {adherent ? (
          <div className="mt-8 rounded-xl border border-[#E6DCC0] bg-white px-4 py-5 text-left">
            <p className="mb-4 text-center text-sm font-semibold text-[var(--ak-emerald-deep)]">
              {adherentId ? "Votre badge membre" : "Votre carte membre"}
            </p>
            <MemberCardActions member={adherent} />
          </div>
        ) : null}

        {ok && payment?.id && adherentId ? (
          <div className="mt-6 space-y-3">
            <AutoClaimPin paymentId={payment.id} />
          </div>
        ) : null}

        {needsFiche ? (
          <div className="mt-8 rounded-xl border border-dashed border-[var(--ak-emerald-mid)] bg-[#E7F0EA] px-4 py-5 text-sm">
            <p className="text-[var(--ak-ink-soft)]">
              Vous pouvez compléter votre fiche membre maintenant, ou y revenir
              plus tard depuis mon espace.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={`/adhesion/completer?id=${encodeURIComponent(adherentId!)}`}
                className="rounded-full bg-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Compléter ma fiche
              </Link>
              <Link
                href="/mon-espace"
                className="rounded-full border border-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
              >
                Mon espace
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={isDon && !adherentId ? "/#contribuer" : "/mon-espace"}
              className="rounded-full border border-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
            >
              {isDon && !adherentId ? "Retour à l'accueil" : "Mon espace"}
            </Link>
            {!ok ? (
              <Link
                href={isDon ? "/#contribuer" : "/#adhesion"}
                className="rounded-full border border-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
              >
                Réessayer
              </Link>
            ) : null}
            {ok && isDon && !adherentId ? (
              <Link
                href="/#adhesion"
                className="rounded-full border border-[var(--ak-emerald-deep)] px-5 py-2.5 text-sm font-semibold text-[var(--ak-emerald-deep)]"
              >
                Devenir membre
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--ak-emerald-deep)]/10 pb-2">
      <dt className="text-[var(--ak-ink-soft)]">{label}</dt>
      <dd className="font-medium text-[var(--ak-emerald-deep)]">{value}</dd>
    </div>
  )
}
