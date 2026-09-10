import { z } from "zod"

export const photoCreateSchema = z.object({
  albumId: z.string().trim().min(1, "albumId et src requis"),
  src: z.string().trim().min(1, "albumId et src requis"),
  alt: z.string().trim().optional(),
  caption: z.string().trim().optional(),
  published: z.boolean().optional(),
})

export const photoMoveSchema = z.object({
  action: z.literal("move"),
  dir: z.enum(["up", "down"]),
})

export const photoUpdateSchema = z.object({
  alt: z.string().optional(),
  caption: z.string().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
})
