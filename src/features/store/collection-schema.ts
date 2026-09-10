import { z } from "zod"

export const COLLECTION_TYPE_VALUES = [
  "PERMANENTE",
  "SAISONNIERE",
  "EVENEMENTIELLE",
  "LIMITEE",
  "MEMBRE",
  "SOLIDAIRE",
] as const

export const collectionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Minuscules, chiffres et tirets uniquement"),
  name: z.string().trim().min(2).max(160),
  tagline: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(1).max(4000),
  type: z.enum(COLLECTION_TYPE_VALUES),
  coverImage: z.string().trim().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "URL invalide").optional().or(z.literal("")),
  bannerImage: z.string().trim().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "URL invalide").optional().or(z.literal("")),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide").optional().or(z.literal("")),
  active: z.boolean().optional(),
  startsAt: z.string().trim().max(40).optional().or(z.literal("")),
  endsAt: z.string().trim().max(40).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).optional(),
})

export const collectionUpdateSchema = collectionSchema.partial()

export type CollectionInput = z.infer<typeof collectionSchema>
