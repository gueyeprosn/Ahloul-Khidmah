import { z } from "zod"

export const reviewSubmitSchema = z.object({
  orderId: z.string().trim().min(1).max(64),
  productId: z.string().trim().min(1).max(64),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(1000),
  website: z.string().max(100).optional(),
})

export const reviewStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
})
