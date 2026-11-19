import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getMemberSession } from "@/lib/member-auth"
import {
  applyMemberProfileUpdate,
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
    const adherent = await applyMemberProfileUpdate(session.adherentId, data)
    if (!adherent) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 })
    }
    return NextResponse.json({
      ok: true,
      member: await serializeMemberPortal(adherent),
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
