import { NextResponse } from "next/server"
import { z } from "zod"
import { validateCoupon } from "@/lib/store/coupons"
import { getMemberSession } from "@/lib/member-auth"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const bodySchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.coerce.number().int().min(0),
  customerPhone: z.string().trim().min(1).max(32),
})

/** Aperçu (avant commande) — la vraie application est revalidée à l'identique dans createStoreOrder. */
export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`coupon-validate:${ip}`, 30, 5 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de demandes" }, { status: 429 })
  }

  const body = await request.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const memberSession = await getMemberSession()
  const result = await validateCoupon({
    code: parsed.data.code,
    subtotal: parsed.data.subtotal,
    customerPhone: parsed.data.customerPhone,
    isMember: Boolean(memberSession),
  })

  if (!result.ok) {
    return NextResponse.json({ valid: false, error: result.error })
  }
  return NextResponse.json({
    valid: true,
    discountAmount: result.discountAmount,
    freeShipping: result.freeShipping,
  })
}
