import Image, { type ImageProps } from "next/image"

/**
 * Les fichiers runtime sous /uploads/ sont servis par nginx, pas toujours
 * fiables via l’optimiseur Next (soft-404 cache → HTTP 400).
 * On laisse next/image pour le layout, sans passer par /_next/image.
 */
function isRuntimeUpload(src: ImageProps["src"]) {
  return typeof src === "string" && src.startsWith("/uploads/")
}

export function AppImage({ src, unoptimized, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      src={src}
      unoptimized={unoptimized ?? isRuntimeUpload(src)}
    />
  )
}
