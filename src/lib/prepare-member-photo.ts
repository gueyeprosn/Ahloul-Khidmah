/** Compresse / recadre une photo pour le cercle membre (carré centré, JPEG). */
export async function prepareMemberPhoto(
  file: File,
  opts?: { maxEdge?: number; maxBytes?: number; quality?: number }
): Promise<File> {
  const maxEdge = opts?.maxEdge ?? 1280
  const maxBytes = opts?.maxBytes ?? 900_000
  const quality = opts?.quality ?? 0.85

  if (
    !file.type.startsWith("image/") &&
    !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)
  ) {
    throw new Error("Choisissez une image (jpg, png ou webp).")
  }

  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  // Portraits : biais haut pour garder le visage dans le cercle
  const sy =
    bitmap.height > bitmap.width * 1.05
      ? Math.max(0, (bitmap.height - side) * 0.18)
      : (bitmap.height - side) / 2

  const out = Math.min(maxEdge, side)
  const canvas = document.createElement("canvas")
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    throw new Error("Compression impossible sur cet appareil.")
  }
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out)
  bitmap.close()

  let q = quality
  let blob: Blob | null = null
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", q)
    )
    if (!blob) break
    if (blob.size <= maxBytes) break
    q = Math.max(0.45, q - 0.12)
  }

  if (!blob) {
    throw new Error("Impossible de préparer la photo.")
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "photo"
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" })
}
