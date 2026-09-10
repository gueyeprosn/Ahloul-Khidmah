import { z } from "zod"

export const COUPON_TYPES = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"] as const

export const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement"),
  type: z.enum(COUPON_TYPES),
  value: z.coerce.number().int().min(0).max(1_000_000),
  startsAt: z.string().trim().max(40).optional().or(z.literal("")),
  endsAt: z.string().trim().max(40).optional().or(z.literal("")),
  minOrderAmount: z.coerce.number().int().min(0),
  maxUses: z.coerce.number().int().min(1).nullable().optional(),
  usesPerCustomer: z.coerce.number().int().min(1).nullable().optional(),
  active: z.boolean().optional(),
  membersOnly: z.boolean().optional(),
})

function checkPercentageRange(
  data: Pick<z.infer<typeof couponBaseSchema>, "type" | "value">,
  ctx: z.RefinementCtx
) {
  if (data.type === "PERCENTAGE" && (data.value < 1 || data.value > 100)) {
    ctx.addIssue({
      code: "custom",
      message: "Un pourcentage doit être entre 1 et 100",
      path: ["value"],
    })
  }
}

/** Création — tous les champs requis, validation croisée type/value incluse. */
export const couponSchema = couponBaseSchema.superRefine(checkPercentageRange)

/** Mise à jour — champs partiels (la validation croisée type/value se refait côté admin UI). */
export const couponUpdateSchema = couponBaseSchema.partial()

export type CouponInput = z.infer<typeof couponSchema>
