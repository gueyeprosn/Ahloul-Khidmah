import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { resumeContributionPayment } from "@/lib/contributions"
import { contributionActionSchema } from "@/features/payments/schema"
import { logAudit } from "@/lib/audit-log"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()
  const parsed = contributionActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  }
  const { action } = parsed.data

  const contribution = await prisma.contribution.findUnique({
    where: { id },
    include: { payment: true },
  })
  if (!contribution) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  }

  if (action === "cancel") {
    if (contribution.status === "completed") {
      return NextResponse.json(
        { error: "Impossible d'annuler un don déjà confirmé" },
        { status: 400 }
      )
    }
    await prisma.$transaction([
      prisma.contribution.update({
        where: { id },
        data: { status: "canceled" },
      }),
      ...(contribution.payment
        ? [
            prisma.payment.update({
              where: { id: contribution.payment.id },
              data: { status: "canceled" },
            }),
          ]
        : []),
    ])
    await logAudit(
      session,
      "contribution.status_change",
      "Contribution",
      id,
      `annulé (${contribution.amount} FCFA)`
    )
    return NextResponse.json({ ok: true })
  }

  if (action === "retry") {
    try {
      const payment = await resumeContributionPayment(id)
      return NextResponse.json({
        ok: true,
        paymentId: payment.id,
        url: payment.checkoutUrl,
      })
    } catch (e) {
      console.error(e)
      const message =
        process.env.NODE_ENV === "production"
          ? "Erreur relance"
          : e instanceof Error
            ? e.message
            : "Erreur relance"
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 })
}
