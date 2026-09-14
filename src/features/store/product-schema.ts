import { z } from "zod"

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

export function slugFromName(name: string) {
  return slugify(name)
}

export const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(80),
  sku: z.string().trim().min(2).max(40),
  description: z.string().trim().min(1).max(4000),
  price: z.coerce.number().int().min(0),
  compareAtPrice: z.coerce.number().int().min(0).nullable().optional(),
  categoryId: z.string().trim().max(64).nullable().optional(),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  limitedEdition: z.boolean().optional(),
  limitedTotal: z.coerce.number().int().min(0).nullable().optional(),
  preorder: z.boolean().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
})

export type ProductInput = z.infer<typeof productSchema>

export const variantSchema = z.object({
  label: z.string().trim().min(1).max(80),
  attributes: z.record(z.string(), z.string()).default({}),
  sku: z.string().trim().min(2).max(40),
  priceOverride: z.coerce.number().int().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0),
  active: z.boolean().optional(),
})

export const inventoryAdjustSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  variantId: z.string().trim().max(64).nullable().optional(),
  delta: z.coerce.number().int().refine((n) => n !== 0, "Le delta ne peut pas être 0"),
  reason: z.string().trim().min(2).max(300),
})

export const orderStatusUpdateSchema = z.object({
  status: z.string().trim().min(2).max(20),
})
