import { NextResponse } from "next/server"
import {
  AUTH_COOKIE,
  createSessionToken,
  getSession,
  hashPassword,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth"
import { prisma } from "@/lib/db"
import { parametresUpdateSchema } from "@/features/parametres/schema"
import { logAudit } from "@/lib/audit-log"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  return NextResponse.json({ user })
}

export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = parametresUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const name = (parsed.data.name || "").trim()
  const currentPassword = parsed.data.currentPassword
  const newPassword = parsed.data.newPassword

  const user = await prisma.user.findUnique({ where: { id: session.id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  const data: {
    name?: string
    passwordHash?: string
    sessionVersion?: { increment: number }
  } = {}
  if (name.length >= 2) data.name = name

  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit faire au moins 8 caractères" },
        { status: 400 }
      )
    }
    const ok = await verifyPassword(currentPassword, user.passwordHash)
    if (!ok) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      )
    }
    data.passwordHash = await hashPassword(newPassword)
    // Invalide toutes les sessions déjà émises (y compris volées/oubliées
    // connectées ailleurs) — voir lib/auth.ts getSession().
    data.sessionVersion = { increment: 1 }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data,
    select: { id: true, email: true, name: true, role: true, sessionVersion: true },
  })

  await logAudit(
    session,
    "parametres.update",
    "User",
    session.id,
    Object.keys(data).filter((k) => k !== "sessionVersion").join(", ") || "profil"
  )

  const res = NextResponse.json({ ok: true, user: updated })

  if (data.sessionVersion) {
    // Le changement de mot de passe invalide les sessions existantes
    // (ex. un jeton volé ailleurs) — on réémet immédiatement un jeton valide
    // pour l'onglet courant afin que l'utilisateur qui vient de changer son
    // propre mot de passe ne soit pas déconnecté par sa propre action.
    const token = await createSessionToken(updated, updated.sessionVersion)
    res.cookies.set(AUTH_COOKIE, token, sessionCookieOptions())
  }

  return res
}
