import { prisma } from "@/lib/db"
import { labelPeriode } from "@/lib/periode"
import { notifyMember, type Localized } from "@/lib/push"
import { WELCOME_ROUTE, WELCOME_WEB_PATH, welcomeNotification } from "@/lib/welcome-notification"

/**
 * Textes des notifications de paiement. Volontairement SANS montant ni nom :
 * une notification s'affiche sur l'écran verrouillé.
 */
const DON: Localized = {
  fr: { title: "Merci pour votre contribution", body: "Votre contribution a bien été reçue. Que Dieu vous le rende." },
  ar: { title: "شكرًا على مساهمتك", body: "تم استلام مساهمتك. جزاك الله خيرًا." },
}

function cotisation(periodes: string[]): Localized {
  const fr =
    periodes.length === 1
      ? `Votre cotisation de ${labelPeriode(periodes[0])} est bien enregistrée. Merci !`
      : "Vos cotisations sont bien enregistrées. Merci !"
  return {
    fr: { title: "Paiement reçu", body: fr },
    ar: { title: "تم استلام الدفعة", body: "تم تسجيل اشتراكك. بارك الله فيك." },
  }
}

function parsePeriodes(raw: string | null, fallback: string | null): string[] {
  if (raw) {
    try {
      const v = JSON.parse(raw) as unknown
      if (Array.isArray(v) && v.length && v.every((x) => typeof x === "string")) return v as string[]
    } catch {
      /* repli sur `periode` */
    }
  }
  return fallback ? [fallback] : []
}

/**
 * Notifie le membre qu'un paiement (adhésion, cotisation ou don) est confirmé.
 *
 * Une seule fois par paiement, même si la confirmation arrive deux fois
 * (notification PayDunya + suivi de l'écran) : `pushNotifiedAt` est posé de
 * façon atomique avant l'envoi. Ne lève jamais.
 */
export async function notifyPaymentCompleted(paymentId: string): Promise<void> {
  try {
    const claimed = await prisma.payment.updateMany({
      where: { id: paymentId, status: "completed", pushNotifiedAt: null },
      data: { pushNotifiedAt: new Date() },
    })
    if (claimed.count !== 1) return

    const p = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!p?.adherentId) return // don anonyme / visiteur : aucun appareil à joindre

    if (p.type === "adhesion") {
      const member = await prisma.adherent.findUnique({
        where: { id: p.adherentId },
        select: { id: true, prenoms: true, nom: true },
      })
      if (member) {
        await notifyMember(p.adherentId, welcomeNotification(member), {
          route: WELCOME_ROUTE,
          webPath: WELCOME_WEB_PATH,
        })
      }
    } else if (p.type === "cotisation") {
      await notifyMember(p.adherentId, cotisation(parsePeriodes(p.periodes, p.periode)), {
        route: "/t/cotisations",
        webPath: "/mon-espace/historique",
      })
    } else {
      await notifyMember(p.adherentId, DON, { route: "/t/home", webPath: "/mon-espace/historique" })
    }
  } catch (e) {
    console.error("notifyPaymentCompleted", e)
  }
}

/** Cotisation enregistrée à la main par un administrateur (espèces, Wave, cellule…). */
export async function notifyCotisationRecorded(adherentId: string, periode: string): Promise<void> {
  await notifyMember(adherentId, cotisation([periode]), {
    route: "/t/cotisations",
    webPath: "/mon-espace/historique",
  })
}
