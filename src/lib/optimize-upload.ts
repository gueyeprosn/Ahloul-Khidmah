import sharp from "sharp"

/** Côté maximal d'une image téléversée : suffisant pour un écran mobile ou desktop. */
const MAX_SIDE = 1600

/**
 * Allège une image téléversée avant stockage : taille bornée, orientation
 * EXIF appliquée puis retirée, métadonnées (GPS…) supprimées, recompression.
 * Le format est conservé (la route déduit l'extension du type détecté).
 * En cas d'échec ou de fichier plus gros qu'avant, renvoie l'original.
 */
export async function optimizeUpload(buf: Buffer, mime: string): Promise<Buffer> {
  // Les GIF peuvent être animés : on ne les touche pas.
  if (mime === "image/gif") return buf
  try {
    let pipeline = sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    if (mime === "image/jpeg") pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true })
    else if (mime === "image/png") pipeline = pipeline.png({ compressionLevel: 9, palette: false })
    else if (mime === "image/webp") pipeline = pipeline.webp({ quality: 80 })
    else return buf
    const out = await pipeline.toBuffer()
    return out.length < buf.length ? out : buf
  } catch {
    return buf
  }
}
