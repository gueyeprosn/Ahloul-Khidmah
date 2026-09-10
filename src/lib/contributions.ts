import { prisma } from "@/lib/db"
import {
  campagneLabel,
  parseContributionAmount,
  type ContributionFormValues,
} from "@/features/contributions/schema"
import {
  createCheckoutInvoice,
  paydunyaConfigured,
} from "@/lib/paydunya"

export async function createContributionCheckout(
  values: ContributionFormValues
) {
  if (!paydunyaConfigured()) {
    throw new Error(
      "PayDunya non configuré — renseignez PAYDUNYA_MASTER_KEY, PAYDUNYA_PRIVATE_KEY, PAYDUNYA_TOKEN"
    )
  }

  const amount = parseContributionAmount(values.montant, values.montantAutre)
  if (!amount || amount < 500) {
    throw new Error("Montant invalide (minimum 500 FCFA)")
  }

  const anonymous = Boolean(values.anonymous)
  const prenoms = anonymous ? null : values.prenoms?.trim() || null
  const nom = anonymous ? null : values.nom?.trim() || null
  const tel = anonymous ? null : values.tel?.trim() || null
  const email = anonymous ? null : values.email?.trim() || null
  const displayName =
    [prenoms, nom].filter(Boolean).join(" ").trim() || "Contributeur anonyme"

  const contribution = await prisma.contribution.create({
    data: {
      prenoms,
      nom,
      tel,
      email,
      amount,
      message: values.message?.trim() || null,
      campagne: values.campagne,
      status: "pending",
      canal: "paydunya",
    },
  })

  const payment = await prisma.payment.create({
    data: {
      contributionId: contribution.id,
      type: "don",
      amount,
      status: "pending",
      customerName: displayName,
      customerPhone: tel,
    },
  })

  const invoice = await createCheckoutInvoice({
    amount,
    description: `Contribution Ahloul Khidmah — ${campagneLabel(values.campagne)}`,
    paymentId: payment.id,
    contributionId: contribution.id,
    type: "don",
    customer: {
      name: displayName,
      email: email || undefined,
      phone: tel || undefined,
    },
  })

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      token: invoice.token,
      checkoutUrl: invoice.url,
    },
  })

  return {
    contribution,
    payment: updated,
  }
}

/** Relance un don en attente (facture existante ou nouvelle). */
export async function resumeContributionPayment(contributionId: string) {
  if (!paydunyaConfigured()) {
    throw new Error("PayDunya non configuré")
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    include: { payment: true },
  })
  if (!contribution) throw new Error("Contribution introuvable")
  if (contribution.status === "completed") {
    throw new Error("Cette contribution est déjà confirmée")
  }

  if (contribution.payment?.token) {
    return contribution.payment
  }

  const displayName =
    [contribution.prenoms, contribution.nom].filter(Boolean).join(" ").trim() ||
    "Contributeur"

  const payment =
    contribution.payment ||
    (await prisma.payment.create({
      data: {
        contributionId: contribution.id,
        type: "don",
        amount: contribution.amount,
        status: "pending",
        customerName: displayName,
        customerPhone: contribution.tel,
      },
    }))

  const invoice = await createCheckoutInvoice({
    amount: contribution.amount,
    description: `Contribution Ahloul Khidmah — ${campagneLabel(contribution.campagne)}`,
    paymentId: payment.id,
    contributionId: contribution.id,
    type: "don",
    customer: {
      name: displayName,
      email: contribution.email || undefined,
      phone: contribution.tel || undefined,
    },
  })

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      token: invoice.token,
      checkoutUrl: invoice.url,
      status: "pending",
    },
  })
}
