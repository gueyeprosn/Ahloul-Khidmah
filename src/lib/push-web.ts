/**
 * Notifications push du site (PWA) via Firebase Cloud Messaging.
 *
 * Inerte tant que les variables NEXT_PUBLIC_FIREBASE_* ne sont pas définies :
 * le bouton « Activer les notifications » n'est alors pas affiché. Les valeurs
 * sont publiques par conception (ce ne sont pas des secrets) ; le compte de
 * service, lui, reste sur le serveur.
 *
 * Le service worker du site (`/sw.js`) reçoit les messages — pas de second
 * `firebase-messaging-sw.js`, qui entrerait en conflit sur la même portée.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

const TOKEN_KEY = "ak_push_token"

export function webPushConfigured() {
  return Boolean(
    config.apiKey && config.projectId && config.messagingSenderId && config.appId && VAPID_KEY
  )
}

/** Notifications web disponibles dans ce navigateur (iPhone : site installé seulement). */
export function webPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export function webPushStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export type EnableResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "config" | "denied" | "error" }

export async function enableWebPush(locale: "fr" | "ar" = "fr"): Promise<EnableResult> {
  if (!webPushConfigured()) return { ok: false, reason: "config" }
  if (!webPushSupported()) return { ok: false, reason: "unsupported" }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return { ok: false, reason: "denied" }

    const [{ initializeApp, getApps, getApp }, { getMessaging, getToken, isSupported }] =
      await Promise.all([import("firebase/app"), import("firebase/messaging")])
    if (!(await isSupported())) return { ok: false, reason: "unsupported" }

    const app = getApps().length ? getApp() : initializeApp(config)
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(getMessaging(app), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (!token) return { ok: false, reason: "error" }

    const res = await fetch("/api/mon-espace/push", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, locale }),
    })
    if (!res.ok) return { ok: false, reason: "error" }
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* stockage indisponible : le jeton reste enregistré côté serveur */
    }
    return { ok: true }
  } catch {
    return { ok: false, reason: "error" }
  }
}

export async function disableWebPush(): Promise<void> {
  const token = webPushStoredToken()
  try {
    if (token) {
      await fetch("/api/mon-espace/push", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
    }
    const [{ getApps, getApp }, { getMessaging, deleteToken, isSupported }] = await Promise.all([
      import("firebase/app"),
      import("firebase/messaging"),
    ])
    if (getApps().length && (await isSupported())) await deleteToken(getMessaging(getApp()))
  } catch {
    /* hors ligne : le serveur retirera le jeton à la première erreur d'envoi */
  } finally {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignoré */
    }
  }
}
