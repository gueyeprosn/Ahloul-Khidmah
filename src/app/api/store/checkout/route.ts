import { NextResponse } from "next/server"
import { storeCheckoutSchema } from "@/features/store/checkout-schema"
import { CheckoutError, createStoreOrder } from "@/lib/store/checkout"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`store-checkout:${ip}`, 15, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    )
  }

  const body = await request.json()
  const parsed = storeCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await createStoreOrder(parsed.data)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("store checkout error", e)
    const message =
      process.env.NODE_ENV === "production"
        ? "Erreur lors de la commande"
        : e instanceof Error
          ? e.message
          : "Erreur lors de la commande"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
