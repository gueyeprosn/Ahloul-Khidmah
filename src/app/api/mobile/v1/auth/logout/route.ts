import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { readJson } from "@/lib/mobile/http"
import { revokeMobileSession } from "@/lib/mobile/session"

const bodySchema = z.object({
  refreshToken: z.string().min(20).max(200),
  // Jeton push de l'appareil : détaché du compte à la déconnexion, pour ne
  // plus recevoir de notifications personnelles sur un appareil déconnecté.
  pushToken: z.string().min(10).max(4096).optional(),
})

/** Idempotent : répond toujours ok (ne révèle pas si le jeton existait). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await readJson(request))
  if (parsed.success) {
    await revokeMobileSession(parsed.data.refreshToken)
    if (parsed.data.pushToken) {
      await prisma.deviceToken.updateMany({
        where: { token: parsed.data.pushToken },
        data: { adherentId: null },
      })
    }
  }
  return NextResponse.json({ ok: true })
}
