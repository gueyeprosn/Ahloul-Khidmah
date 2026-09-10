import { z } from "zod"

export const sendCardSchema = z.object({
  adherentId: z.string().trim().min(1, "Adhérent requis").max(64, "Adhérent requis"),
  tel: z.string().trim().optional().default(""),
})
