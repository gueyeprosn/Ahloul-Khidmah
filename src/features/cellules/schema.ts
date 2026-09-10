import { z } from "zod"

export const celluleSchema = z.object({
  name: z.string().trim().min(2, "Nom de cellule requis"),
  zone: z.string().trim().optional(),
})
