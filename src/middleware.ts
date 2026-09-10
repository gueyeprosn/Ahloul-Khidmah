import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { AUTH_COOKIE, safeInternalPath } from "@/lib/auth-shared"
import { STORE_PUBLIC_ENABLED } from "@/lib/store/store-status"

const protectedPrefixes = [
  "/dashboard",
  "/adherents",
  "/cotisations",
  "/contributions",
  "/cellules",
  "/competences",
  "/rapports",
  "/parametres",
  "/medias",
  "/temoignages",
  "/journal",
  "/admin",
]

function isProtectedPage(pathname: string) {
  return protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

function isPublicApi(pathname: string, method: string) {
  if (pathname === "/api/auth/login" && method === "POST") return true
  if (pathname === "/api/auth/logout" && method === "POST") return true
  // Création publique d'adhésion uniquement
  if (pathname === "/api/adhesions" && method === "POST") return true
  // Complétion de fiche publique
  if (
    method === "PATCH" &&
    /^\/api\/adhesions\/[^/]+$/.test(pathname)
  ) {
    return true
  }
  // PayDunya
  if (pathname === "/api/payments/ipn" && method === "POST") return true
  if (pathname === "/api/payments/checkout" && method === "POST") return true
  if (pathname === "/api/payments/softpay" && method === "POST") return true
  if (
    method === "GET" &&
    /^\/api\/payments\/[^/]+\/status$/.test(pathname)
  ) {
    return true
  }
  // Contribution publique (don sans adhésion)
  if (pathname === "/api/contributions" && method === "POST") return true
  // Liste des cellules (autocomplete adhésion)
  if (pathname === "/api/cellules/public" && method === "GET") return true
  // Catalogue boutique public (lecture seule)
  if (pathname === "/api/store/categories" && method === "GET") return true
  if (pathname === "/api/store/collections" && method === "GET") return true
  if (pathname === "/api/store/products" && method === "GET") return true
  if (
    method === "GET" &&
    /^\/api\/store\/products\/[^/]+$/.test(pathname)
  ) {
    return true
  }
  // Panier / checkout boutique (public, prix et stock revalidés côté serveur)
  if (pathname === "/api/store/checkout" && method === "POST") return true
  if (
    method === "GET" &&
    /^\/api\/store\/orders\/[^/]+\/status$/.test(pathname)
  ) {
    return true
  }
  if (
    method === "POST" &&
    /^\/api\/store\/orders\/[^/]+\/softpay$/.test(pathname)
  ) {
    return true
  }
  // Aperçu coupon (avant commande) — application réelle revalidée à
  // l'identique côté serveur dans createStoreOrder, jamais confiance ici.
  if (pathname === "/api/store/coupons/validate" && method === "POST") return true
  // Avis client — toujours vérifié serveur contre une commande payée réelle
  if (pathname === "/api/store/reviews" && method === "POST") return true
  // WhatsApp carte membre (status public + envoi avec vérif tel)
  if (pathname === "/api/whatsapp/status" && method === "GET") return true
  if (pathname === "/api/whatsapp/send-card" && method === "POST") return true
  // Suivi versements / espace membre
  if (pathname === "/api/mes-versements" && method === "POST") return true
  if (pathname === "/api/mon-espace/login" && method === "POST") return true
  if (pathname === "/api/mon-espace/logout" && method === "POST") return true
  if (pathname === "/api/mon-espace/claim-payment" && method === "POST") {
    return true
  }
  if (pathname === "/api/mon-espace/me" && (method === "GET" || method === "PATCH")) {
    return true
  }
  // Vérifiée par sa propre session membre (getMemberSession), pas la
  // session admin que ce middleware contrôle par défaut.
  if (pathname === "/api/mon-espace/pin" && method === "POST") return true
  if (pathname === "/api/mon-espace/photo" && method === "POST") return true
  if (pathname === "/api/mon-espace/cotisation-checkout" && method === "POST") {
    return true
  }
  // Webhook Meta : appelé par Meta, jamais par un admin connecté.
  // GET = handshake de vérification, POST = vérifié par signature HMAC
  // dans la route elle-même (voir api/whatsapp/webhook/route.ts).
  if (pathname === "/api/whatsapp/webhook" && (method === "GET" || method === "POST")) {
    return true
  }
  return false
}

function isApi(pathname: string) {
  return pathname.startsWith("/api/")
}

async function verifyToken(token: string) {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("no secret")
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
  if (typeof payload.role !== "string" || payload.role !== "admin") {
    throw new Error("invalid role")
  }
  return payload
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // --- Boutique masquée temporairement : pages publiques redirigées, création
  // de commande bloquée server-side. /admin/boutique reste accessible (déjà
  // protégé plus bas comme le reste de /admin) pour continuer à gérer le
  // catalogue/stock pendant que la vitrine publique est masquée. Voir
  // lib/store/store-status.ts pour rouvrir.
  if (!STORE_PUBLIC_ENABLED) {
    if (pathname === "/boutique" || pathname.startsWith("/boutique/")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    if (pathname === "/api/store/checkout" && method === "POST") {
      return NextResponse.json(
        { error: "La boutique est temporairement fermée." },
        { status: 503 }
      )
    }
  }

  // --- API protection ---
  if (isApi(pathname)) {
    if (isPublicApi(pathname, method)) {
      return NextResponse.next()
    }

    const token = request.cookies.get(AUTH_COOKIE)?.value
    if (!token) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    try {
      await verifyToken(token)
      return NextResponse.next()
    } catch {
      const res = NextResponse.json({ error: "Non autorisé" }, { status: 401 })
      res.cookies.delete(AUTH_COOKIE)
      return res
    }
  }

  // --- Login page ---
  // Pas de redirection automatique vers /dashboard même avec un cookie
  // présent : ce middleware ne vérifie que la signature JWT + le rôle, pas
  // sessionVersion (qui nécessite une lecture base, indisponible ici). Un
  // jeton signé mais révoqué (mot de passe changé, admin désactivé, ou
  // simplement émis avant l'ajout de sessionVersion) passerait ce contrôle
  // léger puis serait rejeté par getSession() côté dashboard — provoquant
  // une boucle de redirection infinie /login <-> /dashboard. Laisser /login
  // toujours s'afficher normalement élimine cette boucle.
  if (pathname === "/login") {
    return NextResponse.next()
  }

  // /admin seul → dashboard (évite 404 après login?next=/admin)
  if (pathname === "/admin") {
    const token = request.cookies.get(AUTH_COOKIE)?.value
    if (!token) {
      const login = new URL("/login", request.url)
      login.searchParams.set("next", "/dashboard")
      return NextResponse.redirect(login)
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isProtectedPage(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  if (!token) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", safeInternalPath(pathname))
    return NextResponse.redirect(login)
  }

  try {
    await verifyToken(token)
    return NextResponse.next()
  } catch {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", safeInternalPath(pathname))
    const res = NextResponse.redirect(login)
    res.cookies.delete(AUTH_COOKIE)
    return res
  }
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/adherents/:path*",
    "/cotisations/:path*",
    "/contributions/:path*",
    "/cellules/:path*",
    "/competences/:path*",
    "/rapports/:path*",
    "/parametres/:path*",
    "/medias/:path*",
    "/temoignages/:path*",
    "/journal/:path*",
    "/admin/:path*",
    "/boutique",
    "/boutique/:path*",
    "/api/:path*",
  ],
}
