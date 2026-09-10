import { createHash } from "crypto"

export type PaydunyaMode = "test" | "live"

export function paydunyaConfigured() {
  return Boolean(
    process.env.PAYDUNYA_MASTER_KEY &&
      process.env.PAYDUNYA_PRIVATE_KEY &&
      process.env.PAYDUNYA_TOKEN
  )
}

export function paydunyaMode(): PaydunyaMode {
  return process.env.PAYDUNYA_MODE === "live" ? "live" : "test"
}

function apiBase() {
  return paydunyaMode() === "live"
    ? "https://app.paydunya.com/api/v1"
    : "https://app.paydunya.com/sandbox-api/v1"
}

function headers() {
  const master = process.env.PAYDUNYA_MASTER_KEY
  const priv = process.env.PAYDUNYA_PRIVATE_KEY
  const token = process.env.PAYDUNYA_TOKEN
  if (!master || !priv || !token) {
    throw new Error("Clés PayDunya manquantes")
  }
  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": master,
    "PAYDUNYA-PRIVATE-KEY": priv,
    "PAYDUNYA-TOKEN": token,
  }
}

export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.ahloulkhidmah.org"
  )
}

export function verifyPaydunyaHash(hash: string | undefined | null) {
  const master = process.env.PAYDUNYA_MASTER_KEY
  if (!master || !hash) return false
  const expected = createHash("sha512").update(master).digest("hex")
  return expected.toLowerCase() === String(hash).toLowerCase()
}

export type CreateInvoiceInput = {
  amount: number
  description: string
  paymentId: string
  adherentId?: string
  contributionId?: string
  /** "boutique" : paymentId référence une commande (Order), pas un Payment —
   * voir custom_data.order_id, consommé séparément par l'IPN. */
  type: "adhesion" | "cotisation" | "don" | "boutique"
  periode?: string
  customer?: { name?: string; email?: string; phone?: string }
  /** Chemins de retour dédiés (ex. commande boutique) — par défaut
   * /paiement/retour et /paiement/annule (adhésion/cotisation/don). */
  returnPath?: string
  cancelPath?: string
}

export type CreateInvoiceResult = {
  token: string
  url: string
  responseText?: string
}

export async function createCheckoutInvoice(
  input: CreateInvoiceInput
): Promise<CreateInvoiceResult> {
  const origin = siteOrigin()
  const body = {
    invoice: {
      total_amount: input.amount,
      description: input.description,
      customer: {
        name: input.customer?.name || "",
        email: input.customer?.email || "",
        phone: input.customer?.phone || "",
      },
    },
    store: {
      name: process.env.PAYDUNYA_STORE_NAME || "Ahloul Khidmah",
      tagline:
        process.env.PAYDUNYA_STORE_TAGLINE ||
        "Servir Serigne Touba avec Foi, Discipline, Savoir et Excellence",
      phone_number: process.env.PAYDUNYA_STORE_PHONE || "752282828",
      postal_address: process.env.PAYDUNYA_STORE_ADDRESS || "Touba, Sénégal",
      website_url: origin,
      logo_url: `${origin}/brand/logo.png`,
    },
    custom_data: {
      payment_id: input.type === "boutique" ? "" : input.paymentId,
      order_id: input.type === "boutique" ? input.paymentId : "",
      adherent_id: input.adherentId || "",
      contribution_id: input.contributionId || "",
      type: input.type,
      periode: input.periode || "",
    },
    actions: {
      callback_url: `${origin}/api/payments/ipn`,
      return_url: input.returnPath
        ? `${origin}${input.returnPath}`
        : `${origin}/paiement/retour?paymentId=${encodeURIComponent(input.paymentId)}`,
      cancel_url: input.cancelPath
        ? `${origin}${input.cancelPath}`
        : `${origin}/paiement/annule?paymentId=${encodeURIComponent(input.paymentId)}`,
    },
  }

  const res = await fetch(`${apiBase()}/checkout-invoice/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as {
    response_code?: string | number
    response_text?: string
    description?: string
    token?: string
    response_token?: string
    invoice_url?: string
    url?: string
  }

  const token = data.token || data.response_token
  const urlFromText =
    typeof data.response_text === "string" &&
    /^https?:\/\//i.test(data.response_text)
      ? data.response_text
      : undefined
  const url = data.invoice_url || data.url || urlFromText
  const code = String(data.response_code ?? "")

  if (!res.ok || (code && code !== "00") || !token || !url) {
    throw new Error(
      (urlFromText ? undefined : data.response_text) ||
        data.description ||
        "Impossible de créer la facture PayDunya"
    )
  }

  return {
    token,
    url,
    responseText: data.description || data.response_text,
  }
}

export type ConfirmInvoiceResult = {
  status: string
  receiptUrl?: string
  customerName?: string
  customerPhone?: string
  hash?: string
  raw: unknown
}

export async function confirmCheckoutInvoice(
  token: string
): Promise<ConfirmInvoiceResult> {
  const res = await fetch(
    `${apiBase()}/checkout-invoice/confirm/${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: headers(),
    }
  )
  const data = (await res.json()) as {
    status?: string
    response_code?: string | number
    receipt_url?: string
    customer?: { name?: string; phone?: string }
    hash?: string
  }

  return {
    status: String(data.status || "").toLowerCase(),
    receiptUrl: data.receipt_url,
    customerName: data.customer?.name,
    customerPhone: data.customer?.phone,
    hash: data.hash,
    raw: data,
  }
}

export function currentPeriode() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Normalise un téléphone SN pour SoftPay (ex. 777777777). */
export function softpayPhoneSn(raw: string | undefined | null): string {
  let d = String(raw || "").replace(/\D/g, "")
  if (d.startsWith("00")) d = d.slice(2)
  if (d.startsWith("221")) d = d.slice(3)
  if (d.startsWith("0") && d.length === 10) d = d.slice(1)
  return d
}

export type SoftpayMethod = "wave" | "orange"

export type SoftpayResult = {
  success: boolean
  message: string
  url?: string
  omUrl?: string
  maxitUrl?: string
  qrDataUrl?: string
  fees?: number
  currency?: string
}

/** SoftPay opérateurs : endpoints sur l’API v1 (pas sandbox-api). */
function softpayApiBase() {
  return "https://app.paydunya.com/api/v1"
}

async function softpayJson(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${softpayApiBase()}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error(
      paydunyaMode() === "test"
        ? "SoftPay Wave/Orange n’est pas disponible en sandbox. Passez en mode live (clés live_*) ou utilisez le paiement classique."
        : "Réponse SoftPay invalide"
    )
  }
  return { res, data }
}

function extractOrangeQrDataUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const u = new URL(url)
    const b64 =
      u.searchParams.get("data[qrcode]") ||
      u.searchParams.get("data%5Bqrcode%5D")
    if (b64) {
      return `data:image/png;base64,${b64}`
    }
    const m = url.match(/data(?:%5B|\[)qrcode(?:%5D|\])=([^&]+)/i)
    if (m?.[1]) {
      return `data:image/png;base64,${decodeURIComponent(m[1])}`
    }
  } catch {
    /* ignore */
  }
  return undefined
}

export async function softpayWaveSenegal(input: {
  token: string
  fullName: string
  email?: string
  phone: string
}): Promise<SoftpayResult> {
  const phone = softpayPhoneSn(input.phone)
  if (phone.length < 9) {
    throw new Error("Numéro Wave invalide")
  }

  // Facture sandbox (test_*) incompatible SoftPay live → message clair
  if (paydunyaMode() === "test" || input.token.startsWith("test_")) {
    throw new Error(
      "SoftPay Wave nécessite le mode live PayDunya (clés live_private_*). En test, utilisez le paiement classique."
    )
  }

  const { res, data } = await softpayJson("/softpay/wave-senegal", {
    wave_senegal_fullName: input.fullName,
    wave_senegal_email: input.email || "",
    wave_senegal_phone: phone,
    wave_senegal_payment_token: input.token,
  })

  const success = Boolean(data.success)
  const message = String(data.message || "")
  const url = typeof data.url === "string" ? data.url : undefined

  if (!res.ok || !success || !url) {
    throw new Error(message || "Échec SoftPay Wave")
  }

  return {
    success: true,
    message: message || "Ouvrez Wave pour finaliser",
    url,
    fees: typeof data.fees === "number" ? data.fees : undefined,
    currency: typeof data.currency === "string" ? data.currency : undefined,
  }
}

export async function softpayOrangeMoneySenegal(input: {
  token: string
  customerName: string
  email?: string
  phone: string
}): Promise<SoftpayResult> {
  const phone = softpayPhoneSn(input.phone)
  if (phone.length < 9) {
    throw new Error("Numéro Orange Money invalide")
  }

  if (paydunyaMode() === "test" || input.token.startsWith("test_")) {
    throw new Error(
      "SoftPay Orange Money nécessite le mode live PayDunya (clés live_private_*). En test, utilisez le paiement classique."
    )
  }

  const { res, data } = await softpayJson("/softpay/new-orange-money-senegal", {
    customer_name: input.customerName,
    customer_email: input.email || "",
    phone_number: phone,
    invoice_token: input.token,
  })

  const success = Boolean(data.success)
  const message = String(data.message || "")
  const url = typeof data.url === "string" ? data.url : undefined
  const other = (data.other_url || {}) as {
    om_url?: string
    maxit_url?: string
  }

  if (!res.ok || !success) {
    throw new Error(message || "Échec SoftPay Orange Money")
  }

  return {
    success: true,
    message: message || "Scannez le QR ou ouvrez Orange Money",
    url,
    omUrl: other.om_url,
    maxitUrl: other.maxit_url,
    qrDataUrl: extractOrangeQrDataUrl(url),
    fees: typeof data.fees === "number" ? data.fees : undefined,
    currency: typeof data.currency === "string" ? data.currency : undefined,
  }
}


