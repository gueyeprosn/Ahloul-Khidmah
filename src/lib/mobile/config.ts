import { z } from "zod"
import { prisma } from "@/lib/db"

/**
 * Configuration distante de l'application mobile (contrat v1).
 *
 * Règles de conformité boutiques : ce fichier ne décrit que des DONNÉES.
 * Aucun code n'est jamais téléchargé ou exécuté — un écran `native` doit déjà
 * exister dans le binaire installé (`screen` inconnu → écran de repli côté app).
 */
const semver = z.string().regex(/^\d+\.\d+\.\d+$/, "Version attendue : X.Y.Z")
const slug = z.string().regex(/^[a-z][a-z0-9_-]{1,31}$/)
const bilingual = z.object({
  fr: z.string().trim().min(1).max(120),
  ar: z.string().trim().max(120).optional(),
})
const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "HTTPS obligatoire")

export const mobileTabSchema = z
  .object({
    id: slug, // identifiant STABLE de la rubrique, jamais réutilisé
    label: bilingual,
    icon: z.string().max(32).optional(),
    type: z.enum(["native", "webview", "external"]),
    screen: slug.optional(),
    url: httpsUrl.optional(),
    requiresAuth: z.boolean().default(false),
    feature: slug.optional(), // drapeau qui doit être actif pour afficher l'onglet
  })
  .superRefine((t, ctx) => {
    if (t.type === "native" && !t.screen) {
      ctx.addIssue({ code: "custom", message: "screen requis pour native", path: ["screen"] })
    }
    if (t.type !== "native" && !t.url) {
      ctx.addIssue({ code: "custom", message: "url requise", path: ["url"] })
    }
  })

export const mobileConfigSchema = z
  .object({
    minAppVersion: semver,
    recommendedVersion: semver,
    maintenance: z.object({
      enabled: z.boolean(),
      message: bilingual.nullable(),
    }),
    features: z.record(slug, z.boolean()),
    tabs: z.array(mobileTabSchema).min(1).max(8),
    webAllowlist: z.array(z.string().regex(/^[a-z0-9.-]+$/)).max(10),
    messages: z
      .array(
        z.object({
          id: slug,
          level: z.enum(["info", "warning"]),
          text: bilingual,
        })
      )
      .max(5),
  })
  .superRefine((cfg, ctx) => {
    const ids = new Set<string>()
    cfg.tabs.forEach((t, i) => {
      if (ids.has(t.id)) {
        ctx.addIssue({ code: "custom", message: "id d'onglet dupliqué", path: ["tabs", i, "id"] })
      }
      ids.add(t.id)
      if (t.type === "webview" && t.url) {
        const host = new URL(t.url).hostname
        if (!cfg.webAllowlist.includes(host)) {
          ctx.addIssue({
            code: "custom",
            message: `hôte non autorisé : ${host}`,
            path: ["tabs", i, "url"],
          })
        }
      }
    })
  })

export type MobileConfigPayload = z.infer<typeof mobileConfigSchema>

/** Config embarquée côté serveur si aucune version active valide n'existe. */
export const DEFAULT_MOBILE_CONFIG: MobileConfigPayload = {
  minAppVersion: "1.0.0",
  recommendedVersion: "1.0.0",
  maintenance: { enabled: false, message: null },
  features: { barkelu: true, payments: true },
  tabs: [
    { id: "home", label: { fr: "Accueil", ar: "الرئيسية" }, icon: "home", type: "native", screen: "home", requiresAuth: false },
    { id: "cotisations", label: { fr: "Cotisations", ar: "الاشتراكات" }, icon: "wallet", type: "native", screen: "cotisations", requiresAuth: true, feature: "payments" },
    { id: "barkelu", label: { fr: "Barkelu", ar: "بركلو" }, icon: "shop", type: "native", screen: "barkelu", requiresAuth: false, feature: "barkelu" },
    { id: "account", label: { fr: "Mon compte", ar: "حسابي" }, icon: "person", type: "native", screen: "account", requiresAuth: true },
  ],
  webAllowlist: ["www.ahloulkhidmah.org"],
  messages: [],
}

export type ActiveMobileConfig = { version: number; payload: MobileConfigPayload }

/** Version active valide, sinon repli sûr (jamais d'erreur côté application). */
export async function getActiveMobileConfig(): Promise<ActiveMobileConfig> {
  try {
    const row = await prisma.mobileConfig.findFirst({
      where: { active: true },
      orderBy: { version: "desc" },
    })
    if (row) {
      const parsed = mobileConfigSchema.safeParse(JSON.parse(row.payload))
      if (parsed.success) return { version: row.version, payload: parsed.data }
      console.error("MobileConfig v%s invalide, repli sur la config par défaut", row.version)
    }
  } catch (e) {
    console.error("getActiveMobileConfig", e)
  }
  return { version: 0, payload: DEFAULT_MOBILE_CONFIG }
}
