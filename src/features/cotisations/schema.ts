import { z } from "zod"

export const cotisationCreateSchema = z.object({
  adherentId: z.string().trim().min(1, "adherentId requis"),
  periode: z.string().optional(),
  canal: z.string().trim().optional().default("cellule"),
  note: z.string().trim().max(200).optional(),
})

export const cotisationCancelSchema = z.object({
  action: z.literal("annuler"),
  cotisationId: z.string().trim().min(1, "cotisationId requis"),
})
