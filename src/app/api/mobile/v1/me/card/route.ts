import { NextResponse } from "next/server"
import { rateLimitPersistent } from "@/lib/rate-limit-persistent"
import { mobileError, rateLimited } from "@/lib/mobile/http"
import { authenticateMobile } from "@/lib/mobile/session"
import { CARD_FORMATS, cardEtag, loadCardSource, renderCard, type CardSize } from "@/lib/mobile/card"

/**
 * Carte membre du membre CONNECTÉ (jamais celle d'un autre : l'identifiant vient
 * du jeton, pas de la requête). Image générée par le serveur à partir du modèle
 * officiel ; l'application l'affiche telle quelle.
 *
 * - `?size=display` (défaut) : WebP 680×1020, ≈ 80 Ko.
 * - `?size=full` : PNG 1024×1536 d'origine, pour le partage.
 * Validation par ETag : un 304 ne rend rien et ne coûte presque aucun octet.
 */
export async function GET(request: Request) {
  const auth = await authenticateMobile(request)
  if (!auth) return mobileError("unauthorized", "Non connecté.", 401)

  const sizeParam = new URL(request.url).searchParams.get("size") ?? "display"
  if (sizeParam !== "display" && sizeParam !== "full") {
    return mobileError("invalid_request", "Taille inconnue.", 400)
  }
  const size: CardSize = sizeParam

  const source = await loadCardSource(auth.adherentId)
  if (!source) return mobileError("not_found", "Dossier introuvable.", 404)
  if (source.status !== "actif") {
    return mobileError("card_unavailable", "Votre carte n'est pas disponible pour le moment.", 409)
  }

  const etag = await cardEtag(source.data, size)
  // Les cartes contiennent des données personnelles : jamais de cache partagé.
  const headers = { ETag: etag, "Cache-Control": "private, no-cache" }
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers })
  }

  // Seuls les vrais rendus comptent dans la limite (CPU), pas les 304.
  const limit = await rateLimitPersistent(`m-card:${auth.adherentId}`, 30, 15 * 60 * 1000)
  if (!limit.ok) return rateLimited(limit.retryAfter)

  const body = await renderCard(source.data, size)
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: { ...headers, "Content-Type": CARD_FORMATS[size].mime, "Content-Length": String(body.length) },
  })
}
