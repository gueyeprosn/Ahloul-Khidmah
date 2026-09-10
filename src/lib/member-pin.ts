import bcrypt from "bcryptjs"
import { z } from "zod"

export const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Le code doit contenir exactement 4 chiffres")

export const pinSetSchema = z
  .object({
    pin: pinSchema,
    pinConfirm: pinSchema,
  })
  .refine((d) => d.pin === d.pinConfirm, {
    message: "Les deux codes ne correspondent pas",
    path: ["pinConfirm"],
  })

export async function hashMemberPin(pin: string) {
  return bcrypt.hash(pin, 12)
}

export async function verifyMemberPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash)
}
