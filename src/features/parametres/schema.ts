import { z } from "zod"

export const parametresUpdateSchema = z.object({
  name: z.string().trim().optional(),
  currentPassword: z.string().optional().default(""),
  newPassword: z
    .union([z.string().min(8, "Le nouveau mot de passe doit faire au moins 8 caractères"), z.literal("")])
    .optional()
    .default(""),
})
