import { z } from "zod"

export const SORT_VALUES = ["pertinence", "nouveautes", "prix_asc", "prix_desc"] as const
export const AVAILABILITY_VALUES = ["all", "in_stock", "low_stock"] as const

export const catalogQuerySchema = z.object({
  categorie: z.string().trim().max(80).optional(),
  q: z.string().trim().max(120).optional(),
  /** Autocomplete : ne cherche que dans le nom / SKU */
  suggest: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional(),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  prixMin: z.coerce.number().int().min(0).optional(),
  prixMax: z.coerce.number().int().min(0).optional(),
  disponibilite: z.enum(AVAILABILITY_VALUES).optional().default("all"),
  promo: z.coerce.boolean().optional(),
  edition: z.coerce.boolean().optional(),
  nouveau: z.coerce.boolean().optional(),
  tri: z.enum(SORT_VALUES).optional().default("pertinence"),
})

export type CatalogQuery = z.infer<typeof catalogQuerySchema>

export const PAGE_SIZE = 24
