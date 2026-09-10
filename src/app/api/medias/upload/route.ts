import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { randomBytes } from "crypto"
import { NextResponse } from "next/server"
import { fileTypeFromBuffer } from "file-type"
import { getSession } from "@/lib/auth"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
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

    // Le mimetype déclaré par le client (file.type) n'est qu'une métadonnée
    // falsifiable — la vraie vérification lit la signature binaire réelle
    // (magic bytes) pour décider du format et de l'extension écrite sur disque.
    const detected = await fileTypeFromBuffer(buf)
    if (!detected || !ALLOWED.has(detected.mime)) {
      return NextResponse.json(
        { error: "Format non supporté (jpg, png, webp, gif)" },
        { status: 400 }
      )
    }

    const ext = EXT[detected.mime] || ".jpg"
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`
    const dir = path.join(process.cwd(), "public", "uploads")
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), buf)

    return NextResponse.json({
      ok: true,
      src: `/uploads/${name}`,
    })
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
