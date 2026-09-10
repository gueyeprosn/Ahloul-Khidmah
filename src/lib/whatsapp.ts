import { normalizeWaPhone } from "@/lib/whatsapp-shared"

export {
  normalizeWaPhone,
  buildMemberCardWaMeUrl,
  phonesMatch,
} from "@/lib/whatsapp-shared"

export function isWhatsAppCloudConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  )
}

function graphBase() {
  const version = process.env.WHATSAPP_API_VERSION?.trim() || "v21.0"
  return `https://graph.facebook.com/${version}`
}

/** Upload PNG base64 puis envoi message image via Cloud API. */
export async function sendWhatsAppCloudMedia(input: {
  to: string
  caption: string
  imageBase64: string
}): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const token = process.env.WHATSAPP_TOKEN?.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  if (!token || !phoneNumberId) {
    return { ok: false, error: "WhatsApp Cloud non configuré" }
  }

  const to = normalizeWaPhone(input.to)
  if (!to) return { ok: false, error: "Numéro WhatsApp invalide" }

  try {
    const bin = Buffer.from(input.imageBase64, "base64")
    const form = new FormData()
    form.append("messaging_product", "whatsapp")
    form.append("type", "image/png")
    form.append(
      "file",
      new File([new Uint8Array(bin)], "carte-membre.png", {
        type: "image/png",
      })
    )

    const uploadRes = await fetch(
      `${graphBase()}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }
    )
    const uploadData = (await uploadRes.json()) as {
      id?: string
      error?: { message?: string }
    }
    if (!uploadRes.ok || !uploadData.id) {
      return {
        ok: false,
        error: uploadData.error?.message || "Upload média WhatsApp échoué",
      }
    }

    const sendRes = await fetch(
      `${graphBase()}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "image",
          image: {
            id: uploadData.id,
            caption: input.caption.slice(0, 1024),
          },
        }),
      }
    )
    const sendData = (await sendRes.json()) as {
      messages?: { id: string }[]
      error?: { message?: string }
    }
    if (!sendRes.ok) {
      return {
        ok: false,
        error: sendData.error?.message || "Envoi WhatsApp échoué",
      }
    }

    return { ok: true, messageId: sendData.messages?.[0]?.id }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur WhatsApp Cloud",
    }
  }
}

/**
 * Message texte simple via Cloud API (mêmes identifiants que
 * sendWhatsAppCloudMedia — pas une nouvelle intégration). Comme pour les
 * badges, ne fonctionne de façon fiable que dans la fenêtre de conversation
 * de 24h ouverte par le client (ici : juste après sa commande) — même
 * limitation déjà acceptée pour l'envoi des cartes membres.
 */
export async function sendWhatsAppCloudText(input: {
  to: string
  body: string
}): Promise<{ ok: true; messageId?: string } | { ok: false; error: string }> {
  const token = process.env.WHATSAPP_TOKEN?.trim()
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  if (!token || !phoneNumberId) {
    return { ok: false, error: "WhatsApp Cloud non configuré" }
  }

  const to = normalizeWaPhone(input.to)
  if (!to) return { ok: false, error: "Numéro WhatsApp invalide" }

  try {
    const res = await fetch(`${graphBase()}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: input.body.slice(0, 4096) },
      }),
    })
    const data = (await res.json()) as {
      messages?: { id: string }[]
      error?: { message?: string }
    }
    if (!res.ok) {
      return { ok: false, error: data.error?.message || "Envoi WhatsApp échoué" }
    }
    return { ok: true, messageId: data.messages?.[0]?.id }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur WhatsApp Cloud",
    }
  }
}
