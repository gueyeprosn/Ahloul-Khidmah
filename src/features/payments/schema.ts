import { z } from "zod"

export const checkoutSchema = z.object({
  adherentId: z.string().trim().min(1, "adherentId requis").max(64),
  type: z.enum(["adhesion", "cotisation"]).optional().default("adhesion"),
  periode: z.string().trim().max(7).optional(),
})

export const softpaySchema = z.object({
  paymentId: z.string().trim().min(1, "paymentId requis").max(64),
  method: z.enum(["wave", "orange"], { message: "Méthode invalide (wave | orange)" }),
  phone: z.string().trim().max(32).optional(),
})

export const contributionActionSchema = z.object({
  action: z.enum(["cancel", "retry"], { message: "Action invalide" }),
})
