import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sendAdherentBadgeWhatsApp } from "@/lib/send-member-badge"
import { sendAdherentBadgeEmail } from "@/lib/send-member-email"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const wa = await sendAdherentBadgeWhatsApp(id, { force: true })
  const mail = await sendAdherentBadgeEmail(id, { force: true })

  if (wa.ok || mail.ok) {
    const parts: string[] = []
    if (wa.ok) parts.push("WhatsApp")
    if (mail.ok) parts.push("email")
    return NextResponse.json({
      ok: true,
      message: `Badge envoyé (${parts.join(" + ")}).`,
      whatsapp: wa.ok,
      email: mail.ok,
    })
  }

  if (wa.reason === "no_cloud" && mail.reason === "no_mail") {
    return NextResponse.json(
      { error: "WhatsApp Cloud et email SMTP non configurés." },
      { status: 503 }
    )
  }
  if (wa.reason === "not_found" || mail.reason === "not_found") {
    return NextResponse.json({ error: "Adhérent introuvable." }, { status: 404 })
  }
  if (wa.reason === "no_phone" && mail.reason === "no_email") {
    return NextResponse.json(
      { error: "Ni téléphone ni email renseignés." },
      { status: 400 }
    )
  }

  const err =
    (wa.ok ? null : wa.error) ||
    (mail.ok ? null : mail.error) ||
    "Échec de l'envoi."
  return NextResponse.json({ error: err }, { status: 502 })
}
