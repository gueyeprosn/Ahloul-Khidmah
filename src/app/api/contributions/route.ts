import { NextResponse } from "next/server"
import { contributionSchema } from "@/features/contributions/schema"
import { createContributionCheckout } from "@/lib/contributions"
import { paydunyaConfigured } from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`contrib:${ip}`, 15, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  if (!paydunyaConfigured()) {
    return NextResponse.json(
      {
        error:
          "Les paiements en ligne ne sont pas encore disponibles. Contactez Ahloul Khidmah via WhatsApp.",
      },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const parsed = contributionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { contribution, payment } = await createContributionCheckout(
      parsed.data
    )

    return NextResponse.json({
      ok: true,
      contributionId: contribution.id,
      paymentId: payment.id,
      url: payment.checkoutUrl,
      amount: payment.amount,
    })
  } catch (e) {
    console.error(e)
    const message =
      process.env.NODE_ENV === "production"
        ? "Erreur contribution"
        : e instanceof Error
          ? e.message
          : "Erreur contribution"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
