import { NextResponse } from "next/server"
import {
  applyMemberProfileUpdate,
  getAdherentForMemberSession,
  memberProfileUpdateSchema,
  serializeMemberPortal,
} from "@/lib/member-portal"
import { mobileError, readJson } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"

export async function GET(request: Request) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const adherent = await getAdherentForMemberSession(auth.adherentId)
  if (!adherent) return mobileError("not_found", "Dossier introuvable.", 404)
  return NextResponse.json({ member: await serializeMemberPortal(adherent) })
}

export async function PATCH(request: Request) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const parsed = memberProfileUpdateSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return mobileError("invalid_request", "Données invalides — vérifiez les champs.", 400)
  }
  const adherent = await applyMemberProfileUpdate(auth.adherentId, parsed.data)
  if (!adherent) return mobileError("not_found", "Dossier introuvable.", 404)
  return NextResponse.json({ member: await serializeMemberPortal(adherent) })
}
