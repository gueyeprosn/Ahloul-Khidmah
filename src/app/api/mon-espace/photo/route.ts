import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { fileTypeFromBuffer } from "file-type"
import { prisma } from "@/lib/db"
import { getMemberSession } from "@/lib/member-auth"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"])
const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 })
  }

  const ip = clientIp(request)
  const limited = rateLimit(`mon-espace-photo:${ip}`, 10, 15 * 60 * 1000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    )
  }

  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 5 Mo)" },
        { status: 400 }
      )
    }

    const buf = Buffer.from(await file.arrayBuffer())

    // Signature binaire réelle, pas le mimetype déclaré par le client
    // (même principe que /api/medias/upload).
    const detected = await fileTypeFromBuffer(buf)
    if (!detected || !ALLOWED.has(detected.mime)) {
      return NextResponse.json(
        { error: "Format non supporté (jpg, png, webp)" },
        { status: 400 }
      )
    }

    const ext = EXT[detected.mime] || ".jpg"
    const name = `membre-${session.adherentId}-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`
    const dir = path.join(process.cwd(), "public", "uploads")
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), buf)

    const photoUrl = `/uploads/${name}`
    await prisma.adherent.update({
      where: { id: session.adherentId },
      data: { photoUrl },
    })

    return NextResponse.json({ ok: true, photoUrl })
  } catch (e) {
    console.error(e)
    const message =
      process.env.NODE_ENV === "production"
        ? "Upload impossible"
        : e instanceof Error
          ? e.message
          : "Upload impossible"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
