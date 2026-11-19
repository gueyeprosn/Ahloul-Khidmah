import { existsSync, readFileSync } from "fs"
import { cert, getApps, initializeApp, type App } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { prisma } from "@/lib/db"

/**
 * Notifications push (FCM, API HTTP v1) envoyées depuis ce serveur : pas de
 * Cloud Functions, donc compatible avec le plan Spark. Utilise le compte de
 * service déjà configuré pour les sauvegardes (FIREBASE_SERVICE_ACCOUNT_PATH).
 */

const APP_NAME = "ak-push"
/** FCM accepte au plus 500 jetons par envoi groupé. */
const BATCH = 500

export function pushConfigured() {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  return Boolean(path && existsSync(path))
}

function firebaseApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME)
  if (existing) return existing
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  if (!path || !existsSync(path)) {
    throw new Error("Compte de service Firebase introuvable")
  }
  const credentials = JSON.parse(readFileSync(path, "utf8"))
  return initializeApp({ credential: cert(credentials) }, APP_NAME)
}

/**
 * Routes ouvertes dans l'application mobile au tap (Flutter). Liste fermée :
 * une notification ne doit jamais pouvoir ouvrir autre chose.
 */
export function safeMobileRoute(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const r = raw.trim()
  if (r === "/card" || r === "/pay") return r
  return /^\/t\/[a-z0-9_-]{1,32}$/.test(r) ? r : null
}

/** Chemins du site ouverts au clic (PWA) : internes uniquement. */
export function safeWebPath(raw: unknown): string {
  if (typeof raw !== "string") return "/mon-espace"
  const p = raw.trim()
  if (!p.startsWith("/") || p.startsWith("//") || p.includes("\\")) return "/mon-espace"
  return /^\/[A-Za-z0-9/_\-.?=&]*$/.test(p) ? p : "/mon-espace"
}

export type PushAudience = { kind: "all" } | { kind: "member"; adherentId: string }

export type PushInput = {
  title: string
  body: string
  /** Route Flutter (voir safeMobileRoute). */
  route?: string | null
  /** Chemin du site pour la PWA (voir safeWebPath). */
  webPath?: string | null
  audience: PushAudience
}

export type PushResult = {
  targeted: number
  sent: number
  failed: number
  removed: number
}

const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
])

/** Envoie un même message à une liste de jetons ; retire les jetons périmés. */
async function deliver(
  tokens: string[],
  message: { title: string; body: string; route?: string | null; webPath?: string | null }
): Promise<PushResult> {
  const result: PushResult = { targeted: tokens.length, sent: 0, failed: 0, removed: 0 }
  if (tokens.length === 0) return result

  const messaging = getMessaging(firebaseApp())
  const route = safeMobileRoute(message.route)
  const webPath = safeWebPath(message.webPath)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.ahloulkhidmah.org").replace(/\/$/, "")
  // Toutes les valeurs de `data` doivent être des chaînes.
  const data: Record<string, string> = { url: webPath }
  if (route) data.route = route

  for (let i = 0; i < tokens.length; i += BATCH) {
    const chunk = tokens.slice(i, i + BATCH)
    const res = await messaging.sendEachForMulticast({
      tokens: chunk,
      notification: { title: message.title, body: message.body },
      data,
      android: { priority: "high", ttl: 24 * 60 * 60 * 1000 },
      apns: { payload: { aps: { sound: "default" } } },
      webpush: {
        fcmOptions: { link: `${siteUrl}${webPath}` },
        notification: { icon: "/icons/icon-192.png" },
      },
    })
    result.sent += res.successCount
    result.failed += res.failureCount

    const dead: string[] = []
    res.responses.forEach((r, idx) => {
      if (!r.success && r.error && DEAD_TOKEN_CODES.has(r.error.code)) dead.push(chunk[idx])
    })
    if (dead.length) {
      const del = await prisma.deviceToken.deleteMany({ where: { token: { in: dead } } })
      result.removed += del.count
    }
  }
  return result
}

export async function sendPush(input: PushInput): Promise<PushResult> {
  const rows = await prisma.deviceToken.findMany({
    where:
      input.audience.kind === "member"
        ? { adherentId: input.audience.adherentId }
        : {},
    select: { token: true },
  })
  return deliver(
    rows.map((r) => r.token),
    input
  )
}

export type Localized = { fr: { title: string; body: string }; ar: { title: string; body: string } }

/**
 * Notifie les appareils d'UN membre, chacun dans la langue enregistrée
 * (arabe si `locale = ar`, français sinon). Ne lève jamais : une notification
 * ne doit pas faire échouer l'opération métier qui la déclenche.
 */
export async function notifyMember(
  adherentId: string,
  content: Localized,
  opts: { route?: string | null; webPath?: string | null } = {}
): Promise<PushResult | null> {
  try {
    if (!pushConfigured()) return null
    const rows = await prisma.deviceToken.findMany({
      where: { adherentId },
      select: { token: true, locale: true },
    })
    const ar = rows.filter((r) => r.locale === "ar").map((r) => r.token)
    const fr = rows.filter((r) => r.locale !== "ar").map((r) => r.token)
    const [a, f] = await Promise.all([
      deliver(ar, { ...content.ar, ...opts }),
      deliver(fr, { ...content.fr, ...opts }),
    ])
    return {
      targeted: a.targeted + f.targeted,
      sent: a.sent + f.sent,
      failed: a.failed + f.failed,
      removed: a.removed + f.removed,
    }
  } catch (e) {
    console.error("notifyMember", e)
    return null
  }
}
