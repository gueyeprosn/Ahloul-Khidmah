import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getSession } from "@/lib/auth"
import {
  completeAdherentProfile,
  updateAdherentByAdmin,
} from "@/lib/adherents"
import { prisma } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const adherent = await prisma.adherent.findUnique({ where: { id } })
  if (!adherent) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  }

  return NextResponse.json({
    adherent: {
      ...adherent,
      domaines: JSON.parse(adherent.domaines || "[]"),
    },
  })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const session = await getSession()

  // Admin : changement de statut
  if (body.status && session) {
    const status = String(body.status || "")
    if (!["actif", "en_attente", "archive"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }
    const adherent = await prisma.adherent.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json({ ok: true, adherent })
  }

  // Admin : correction de profil (erreurs de saisie)
  if (body.action === "update" && session) {
    try {
      const adherent = await updateAdherentByAdmin(id, body)
      return NextResponse.json({ ok: true, adherent })
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Données invalides — vérifiez les champs obligatoires.",
            details: e.flatten(),
          },
          { status: 400 }
        )
      }
      if (e instanceof Error && e.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 })
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

  // Public ou admin : complétion de fiche
  if (body.action === "complete") {
    if (!session) {
      const ip = clientIp(request)
      const limited = rateLimit(`complete:${ip}`, 10, 15 * 60 * 1000)
      if (!limited.ok) {
        return NextResponse.json({ error: "Trop de demandes" }, { status: 429 })
      }
    }
    try {
      const adherent = await completeAdherentProfile(id, body, {
        // Admin connecté : peut finaliser sans contrainte téléphone
        skipTelCheck: Boolean(session),
      })
      // Email souvent saisi ici : envoyer le badge + accès si adresse présente
      if (adherent.email?.trim()) {
        const { queueAdherentBadgeEmail } = await import(
          "@/lib/send-member-email"
        )
        queueAdherentBadgeEmail(adherent.id)
      }
      return NextResponse.json({ ok: true, adherent })
    } catch (e) {
      if (e instanceof ZodError) {
        return NextResponse.json(
          {
            error:
              "Données invalides — vérifiez nom, prénom, téléphone et profession.",
            details: e.flatten(),
          },
          { status: 400 }
        )
      }
      if (e instanceof Error && e.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Introuvable" }, { status: 404 })
      }
      if (e instanceof Error && e.message === "TEL_MISMATCH") {
        return NextResponse.json(
          {
            error:
              "Le téléphone ne correspond pas à ce dossier. Utilisez le même numéro que lors de l’adhésion (ex. 77… ou +22177…).",
          },
          { status: 403 }
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

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
}
