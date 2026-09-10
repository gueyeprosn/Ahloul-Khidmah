import { z } from "zod"
import { SHIPPING_ZONES } from "@/features/store/shipping"

const ZONE_VALUES = SHIPPING_ZONES.map((z) => z.value) as [string, ...string[]]

export const checkoutItemSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  variantId: z.string().trim().max(64).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99),
})

export const shippingAddressSchema = z.object({
  line1: z.string().trim().min(3, "Adresse trop courte").max(200),
  city: z.string().trim().min(2, "Ville requise").max(100),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
})

export const storeCheckoutSchema = z
  .object({
    items: z.array(checkoutItemSchema).min(1).max(30),
    customerName: z.string().trim().min(2).max(120),
    customerPhone: z.string().trim().min(8).max(32),
    customerEmail: z
      .string()
      .trim()
      .max(160)
      .email("Email invalide")
      .optional()
      .or(z.literal("")),
    shippingZone: z.enum(ZONE_VALUES, { message: "Choisissez une zone de livraison" }),
    shippingAddress: shippingAddressSchema.optional(),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    couponCode: z.string().trim().max(40).optional().or(z.literal("")),
    website: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.shippingZone === "retrait") return
    if (!data.shippingAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Indiquez une adresse de livraison",
        path: ["shippingAddress"],
      })
    }
  })

export type StoreCheckoutInput = z.infer<typeof storeCheckoutSchema>
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>
