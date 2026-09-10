import { z } from "zod"

export const adminCreateSchema = z.object({
  name: z.string().trim().min(2, "Nom requis"),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Mot de passe (8 caractères min.) requis"),
})

export const adminToggleActiveSchema = z.object({
  id: z.string().trim().min(1, "id requis"),
  active: z.boolean(),
})
