import { createHmac, timingSafeEqual } from "crypto"
import { NextResponse } from "next/server"

/**
 * Webhook Meta WhatsApp Cloud API.
 *
 * GET  : handshake de vérification (hub.challenge) au moment où on
 *        configure l'URL de callback dans le tableau de bord Meta.
 * POST : événements réels (statuts de livraison, messages entrants).
 *        On ne fait qu'accuser réception pour l'instant — Meta exige une
 *        réponse 200 rapide, sinon il retente puis désactive le webhook.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const expected = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Vérification échouée" }, { status: 403 })
}

function isValidSignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  // Sans WHATSAPP_APP_SECRET configuré, on ne peut pas vérifier — on ne
  // bloque pas la mise en route mais on le signale clairement en log.
  if (!appSecret) {
    console.warn(
      "WhatsApp webhook: WHATSAPP_APP_SECRET absent, signature non vérifiée"
    )
    return true
  }
  if (!signatureHeader?.startsWith("sha256=")) return false

  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex")
  const provided = signatureHeader.slice("sha256=".length)

  const a = Buffer.from(expected, "hex")
  const b = Buffer.from(provided, "hex")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-hub-signature-256")

  if (!isValidSignature(rawBody, signature)) {
    console.error("WhatsApp webhook: signature invalide")
    return NextResponse.json({ error: "Signature invalide" }, { status: 403 })
  }

  try {
    const payload = JSON.parse(rawBody)
    // Journalisation minimale pour l'instant (statuts de livraison, etc.).
    // À étendre si on a besoin de réagir à des messages entrants.
    console.log("WhatsApp webhook event:", JSON.stringify(payload).slice(0, 2000))
  } catch (e) {
    console.error("WhatsApp webhook: payload illisible", e)
  }

  return NextResponse.json({ ok: true })
}
