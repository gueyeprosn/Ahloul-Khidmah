import type { Localized } from "@/lib/push"

/** Où mène un tap sur la notification de bienvenue : le badge en plein écran. */
export const WELCOME_ROUTE = "/card" // application mobile
export const WELCOME_WEB_PATH = "/mon-espace?vue=badge" // site (PWA)

/**
 * Notification de bienvenue : nom du membre, numéro de badge et invitation à
 * voir son badge. Envoyée dès l'activation des notifications et à la
 * confirmation d'une adhésion.
 */
export function welcomeNotification(member: {
  id: string
  prenoms: string
  nom: string
}): Localized {
  const name = `${member.prenoms} ${member.nom}`.trim()
  return {
    fr: {
      title: "Bienvenue chez Ahloul Khidmah",
      body: `${name} — badge n° ${member.id}. Touchez ici pour voir votre badge.`,
    },
    ar: {
      title: "مرحبًا بك في Ahloul Khidmah",
      body: `${name} — بطاقة رقم ${member.id}. المس هنا لعرض بطاقتك.`,
    },
  }
}
