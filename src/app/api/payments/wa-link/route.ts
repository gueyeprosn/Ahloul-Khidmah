import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { resolveUnpaidPeriodes, startPaydunyaCheckout } from "@/lib/payments"
import { paydunyaConfigured } from "@/lib/paydunya"
import { currentPeriode, labelPeriode } from "@/lib/periode"
import { formatFcfa } from "@/lib/format"
import { normalizeWaPhone } from "@/lib/whatsapp-shared"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  if (!paydunyaConfigured()) {
    return NextResponse.json(
      { error: "Paiement en ligne non configuré" },
      { status: 503 }
    )
  }

  const body = await request.json()
  const adherentId = String(body.adherentId || "")
  const type =
    body.type === "adhesion" ? ("adhesion" as const) : ("cotisation" as const)
  if (!adherentId) {
    return NextResponse.json({ error: "adherentId requis" }, { status: 400 })
  }

  const adherent = await prisma.adherent.findUnique({
    where: { id: adherentId },
  })
  if (!adherent) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 })
  }

  const phone = normalizeWaPhone(adherent.whatsapp || adherent.tel)
  if (!phone) {
    return NextResponse.json(
      { error: "Numéro WhatsApp / téléphone invalide" },
      { status: 400 }
    )
  }

  const periode = currentPeriode()
  const monthsCountRaw = Number(body.monthsCount)
  const monthsCount =
    type === "cotisation" && Number.isFinite(monthsCountRaw)
      ? Math.min(Math.max(Math.trunc(monthsCountRaw), 1), 12)
      : 1

  const periodes =
    monthsCount > 1
      ? await resolveUnpaidPeriodes(adherentId, monthsCount)
      : undefined

  const payment = await startPaydunyaCheckout({
    adherentId,
    type,
    periode,
    periodes,
  })
  if (!payment.checkoutUrl) {
    return NextResponse.json(
      { error: "Lien de paiement indisponible" },
      { status: 500 }
    )
  }

  const text = [
    `Salam ${adherent.prenoms},`,
    type === "adhesion"
      ? `Voici le lien pour régler votre adhésion Ahloul Khidmah (${formatFcfa(payment.amount)}).`
      : periodes && periodes.length > 1
        ? `Voici le lien pour régler ${periodes.length} mois de cotisation (${periodes.map(labelPeriode).join(", ")}) en un seul paiement — ${formatFcfa(payment.amount)}.`
        : `Voici le lien pour régler votre cotisation ${periode} (${formatFcfa(payment.amount)}).`,
    payment.checkoutUrl,
    "Ahloul Khidmah — Wave ou Orange Money.",
  ].join("\n")

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    url: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
  })
}
