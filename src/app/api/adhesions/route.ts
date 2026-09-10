import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { adhesionLightSchema } from "@/features/adherents/schema"
import { getSession } from "@/lib/auth"
import {
  draftToPreview,
  startAdhesionCheckoutFromDraft,
} from "@/lib/adhesion-checkout"
import { adherentToTicket, createAdherentFromForm } from "@/lib/adherents"
import { prisma } from "@/lib/db"
import { paydunyaConfigured } from "@/lib/paydunya"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") || "").trim().slice(0, 80)
  const status = (searchParams.get("status") || "").trim().slice(0, 32)

  const adherents = await prisma.adherent.findMany({
    where: {
      AND: [
        status ? { status } : {},
        q
          ? {
              OR: [
                { nom: { contains: q } },
                { prenoms: { contains: q } },
                { id: { contains: q } },
                { tel: { contains: q } },
                { celluleLocale: { contains: q } },
                { zoneRegion: { contains: q } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json({ adherents })
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  const limited = rateLimit(`adhesion:${ip}`, 8, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      }
    )
  }

  try {
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Type invalide" }, { status: 415 })
    }

    const body = await request.json()
    const session = await getSession()
    const mode =
      !session || body.mode === "light"
        ? ("light" as const)
        : ("full" as const)

    if (mode === "light") {
      if (!paydunyaConfigured()) {
        return NextResponse.json(
          {
            error:
              "Le paiement en ligne n'est pas disponible pour le moment. Réessayez plus tard.",
          },
          { status: 503 }
        )
      }

      const draft = adhesionLightSchema.parse(body)
      const payment = await startAdhesionCheckoutFromDraft(draft)

      return NextResponse.json({
        ok: true,
        paymentId: payment.id,
        paymentUrl: payment.checkoutUrl,
        preview: draftToPreview(draft),
      })
    }

    const adherent = await createAdherentFromForm(body, {
      status: "actif",
      allowCreateCellule: true,
      mode: "admin",
    })

    const ticket = adherentToTicket(adherent)

    return NextResponse.json({
      ok: true,
      ticket,
      adherent: ticket,
      paymentUrl: null,
      paymentId: null,
    })
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: e.flatten() },
        { status: 400 }
      )
    }
    if (e instanceof Error && e.message === "INCOMPLETE_PHONE") {
      return NextResponse.json(
        {
          error:
            (e as Error & { detail?: string }).detail ||
            "Numéro de téléphone incomplet.",
        },
        { status: 400 }
      )
    }
    if (e instanceof Error && e.message === "DUPLICATE_PHONE") {
      return NextResponse.json(
        {
          error:
            "Ce numéro de téléphone est déjà utilisé par un autre adhérent.",
        },
        { status: 409 }
      )
    }
    console.error(e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
