import { prisma } from "@/lib/db"
import {
  softpayOrangeMoneySenegal,
  softpayPhoneSn,
  softpayWaveSenegal,
  type SoftpayMethod,
} from "@/lib/paydunya"

export type SoftpayOutcome =
  | { kind: "not_found" }
  | { kind: "already_paid" }
  | { kind: "no_invoice" }
  | { kind: "phone_required" }
  | {
      kind: "ok"
      paymentId: string
      method: SoftpayMethod
      message: string
      url?: string
      omUrl?: string
      maxitUrl?: string
      qrDataUrl?: string
      fees?: number
      currency?: string
    }
  /** SoftPay indisponible (mode test PayDunya, panne opérateur) : paiement classique. */
  | { kind: "fallback"; paymentId: string; method: SoftpayMethod; url: string; message: string; detail: string }
  | { kind: "error"; detail: string }

/**
 * Lance un paiement SoftPay (Wave / Orange Money) sur la facture PayDunya d'un
 * paiement existant. Logique unique, partagée par la route web publique et par
 * l'API mobile.
 *
 * `onlyForAdherentId` : l'API mobile n'accepte que les paiements de l'adhérent
 * connecté (un paiement d'un autre membre est « introuvable », jamais « interdit »,
 * pour ne pas permettre de sonder des identifiants).
 */
export async function startSoftpay(opts: {
  paymentId: string
  method: SoftpayMethod
  phone?: string
  onlyForAdherentId?: string
}): Promise<SoftpayOutcome> {
  const payment = await prisma.payment.findUnique({
    where: { id: opts.paymentId },
    include: { adherent: true, contribution: true },
  })
  if (!payment) return { kind: "not_found" }
  if (opts.onlyForAdherentId && payment.adherentId !== opts.onlyForAdherentId) {
    return { kind: "not_found" }
  }
  if (payment.status === "completed") return { kind: "already_paid" }
  if (!payment.token) return { kind: "no_invoice" }

  const nameFromAdherent = payment.adherent
    ? `${payment.adherent.prenoms} ${payment.adherent.nom}`.trim()
    : ""
  const nameFromContribution = payment.contribution
    ? `${payment.contribution.prenoms || ""} ${payment.contribution.nom || ""}`.trim()
    : ""
  const fullName =
    nameFromAdherent ||
    nameFromContribution ||
    payment.customerName ||
    "Client Ahloul Khidmah"
  const email = payment.adherent?.email || payment.contribution?.email || ""

  const phone =
    softpayPhoneSn(opts.phone || "") ||
    softpayPhoneSn(payment.adherent?.whatsapp) ||
    softpayPhoneSn(payment.adherent?.tel) ||
    softpayPhoneSn(payment.contribution?.tel) ||
    softpayPhoneSn(payment.customerPhone)
  if (phone.length < 9) return { kind: "phone_required" }

  try {
    const result =
      opts.method === "wave"
        ? await softpayWaveSenegal({
            token: payment.token,
            fullName,
            email: email || undefined,
            phone,
          })
        : await softpayOrangeMoneySenegal({
            token: payment.token,
            customerName: fullName,
            email: email || undefined,
            phone,
          })
    return {
      kind: "ok",
      paymentId: payment.id,
      method: opts.method,
      message: result.message,
      url: result.url,
      omUrl: result.omUrl,
      maxitUrl: result.maxitUrl,
      qrDataUrl: result.qrDataUrl,
      fees: result.fees,
      currency: result.currency,
    }
  } catch (err) {
    console.error("SoftPay error", err)
    const detail = err instanceof Error ? err.message : "Erreur SoftPay"
    if (payment.checkoutUrl) {
      return {
        kind: "fallback",
        paymentId: payment.id,
        method: opts.method,
        url: payment.checkoutUrl,
        message: "SoftPay indisponible — paiement classique",
        detail,
      }
    }
    return { kind: "error", detail }
  }
}
