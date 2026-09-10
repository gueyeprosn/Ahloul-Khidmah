import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { prisma } from "@/lib/db"
import { getMemberSession } from "@/lib/member-auth"
import {
  getAdherentForMemberSession,
  memberProfileUpdateSchema,
  serializeMemberPortal,
} from "@/lib/member-portal"

export async function GET() {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const adherent = await getAdherentForMemberSession(session.adherentId)
  if (!adherent) {
    return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    member: await serializeMemberPortal(adherent),
  })
}

export async function PATCH(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  try {
    const data = memberProfileUpdateSchema.parse(json)
    const existing = await prisma.adherent.findUnique({
      where: { id: session.adherentId },
      select: { id: true, email: true, badgeEmailSentAt: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })
    }

    const email = data.email?.trim() || null
    await prisma.adherent.update({
      where: { id: session.adherentId },
      data: {
        nom: data.nom.trim(),
        prenoms: data.prenoms.trim(),
        whatsapp: data.whatsapp?.trim() || null,
        email,
        profession: data.profession.trim(),
        autreProfession: data.autreProfession?.trim() || null,
        ficheComplete: true,
      },
    })

    // Premier email renseigné → envoi badge / accès
    if (email && !existing.email && !existing.badgeEmailSentAt) {
      const { queueAdherentBadgeEmail } = await import(
        "@/lib/send-member-email"
      )
      queueAdherentBadgeEmail(session.adherentId)
    }

    const adherent = await getAdherentForMemberSession(session.adherentId)
    return NextResponse.json({
      ok: true,
      member: adherent ? await serializeMemberPortal(adherent) : null,
    })
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Données invalides — vérifiez les champs.",
          details: e.flatten(),
        },
        { status: 400 }
      )
    }
    console.error(e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
