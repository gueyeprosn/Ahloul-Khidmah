import { z } from "zod"

export const temoignageCreateSchema = z.object({
  quoteFr: z.string().trim().min(8, "Citation FR/AR et nom requis"),
  quoteAr: z.string().trim().min(8, "Citation FR/AR et nom requis"),
  name: z.string().trim().min(2, "Citation FR/AR et nom requis"),
  roleFr: z.string().trim().optional(),
  roleAr: z.string().trim().optional(),
  published: z.boolean().optional(),
})

export const temoignageMoveSchema = z.object({
  action: z.literal("move"),
  dir: z.enum(["up", "down"]),
})

export const temoignageUpdateSchema = z.object({
  quoteFr: z.string().trim().optional(),
  quoteAr: z.string().trim().optional(),
  name: z.string().trim().optional(),
  roleFr: z.string().trim().optional(),
  roleAr: z.string().trim().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
})
