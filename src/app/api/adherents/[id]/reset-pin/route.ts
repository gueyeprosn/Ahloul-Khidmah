import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

/**
 * Réinitialise le PIN d'un adhérent (admin uniquement) — utile quand un
 * membre l'a oublié. Le compte retombe alors sur les 4 derniers caractères
 * de son N° membre (comportement historique, transition P0-2 phase A) le
 * temps qu'il en choisisse un nouveau depuis /mon-espace.
 */
export async function POST(_request: Request, { params }: Params) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { id } = await params
  const adherent = await prisma.adherent.findUnique({ where: { id } })
  if (!adherent) {
    return NextResponse.json({ error: "Adhérent introuvable" }, { status: 404 })
  }

  await prisma.adherent.update({
    where: { id },
    // sessionVersion incrémenté : invalide toute session /mon-espace déjà
    // ouverte sur cet appareil (voir lib/member-auth.ts getMemberSession()).
    data: { pinHash: null, sessionVersion: { increment: 1 } },
  })

  return NextResponse.json({ ok: true })
}
