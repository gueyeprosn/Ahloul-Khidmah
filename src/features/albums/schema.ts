import { z } from "zod"

export const albumCreateSchema = z.object({
  title: z.string().trim().min(2, "Titre requis"),
  description: z.string().trim().optional(),
  key: z.string().trim().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

export const albumUpdateSchema = z.object({
  title: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
})
