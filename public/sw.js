/* Ahloul Khidmah — Service Worker (cache réseau + assets) */
const CACHE_VERSION = "ak-v7"
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGE_CACHE = `${CACHE_VERSION}-pages`

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/brand/logo.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("ak-") && !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isApiOrAuth(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/adherents") ||
    url.pathname.startsWith("/cellules") ||
    url.pathname.startsWith("/cotisations") ||
    url.pathname.startsWith("/competences") ||
    url.pathname.startsWith("/rapports") ||
    url.pathname.startsWith("/parametres") ||
    url.pathname.startsWith("/mon-espace") ||
    url.pathname.startsWith("/paiement/")
  )
}

/** Photos membres & médias — jamais en cache SW (sinon image cassée / obsolète). */
function isUserUpload(url) {
  return url.pathname.startsWith("/uploads/")
}

function isStaticAsset(url) {
  if (isUserUpload(url)) return false
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?|css|js)$/i.test(url.pathname)
  )
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  if (url.origin !== self.location.origin) return

  // API, auth, espace membre, uploads : réseau uniquement
  if (isApiOrAuth(url) || isUserUpload(url)) {
    return
  }

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
            }
            return response
          })
          .catch(() => cached || Response.error())
      })
    )
    return
  }

  // HTML / navigation: network-first, fallback cache
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const home = await caches.match("/")
          return (
            home ||
            new Response("Hors ligne — Ahloul Khidmah", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          )
        })
    )
  }
})

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
