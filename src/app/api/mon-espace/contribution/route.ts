import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getMemberSession } from "@/lib/member-auth"
import { createContributionCheckout } from "@/lib/contributions"
import { parseContributionAmount } from "@/features/contributions/schema"
import {
  PAYDUNYA_UNAVAILABLE_MESSAGE,
  PaydunyaUnavailableError,
  paydunyaConfigured,
} from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/** Le membre ne choisit QUE le montant : son identité vient de la base, jamais du navigateur. */
const bodySchema = z.object({
  montant: z.enum(["5000", "10000", "25000", "50000", "autre"], {
    message: "Choisissez un montant",
  }),
  montantAutre: z.string().trim().max(32).optional().or(z.literal("")),
})

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const limited = rateLimit(`member-contrib:${session.adherentId}:${clientIp(request)}`, 12, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  if (!paydunyaConfigured()) {
    return NextResponse.json({ error: PAYDUNYA_UNAVAILABLE_MESSAGE }, { status: 503 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Choisissez un montant." }, { status: 400 })
  }
  const { montant, montantAutre } = parsed.data
  const amount = parseContributionAmount(montant, montantAutre)
  if (!Number.isFinite(amount) || amount < 500) {
    return NextResponse.json({ error: "Montant minimum : 500 FCFA." }, { status: 400 })
  }

  const member = await prisma.adherent.findUnique({
    where: { id: session.adherentId },
    select: { id: true, prenoms: true, nom: true, tel: true, email: true },
  })
  if (!member) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })

  try {
    const { contribution, payment } = await createContributionCheckout(
      {
        prenoms: member.prenoms,
        nom: member.nom,
        tel: member.tel,
        email: member.email ?? "",
        montant,
        montantAutre: montantAutre || "",
        campagne: "general",
        message: "",
        anonymous: false,
        website: "",
      },
      { adherentId: member.id }
    )
    return NextResponse.json({
      ok: true,
      contributionId: contribution.id,
      paymentId: payment.id,
      url: payment.checkoutUrl,
      amount: payment.amount,
      // Pour préremplir le numéro du paiement mobile.
      phone: member.tel,
    })
  } catch (e) {
    if (e instanceof PaydunyaUnavailableError) {
      console.error(e.message)
      return NextResponse.json({ error: PAYDUNYA_UNAVAILABLE_MESSAGE }, { status: 503 })
    }
    console.error("member contribution", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
