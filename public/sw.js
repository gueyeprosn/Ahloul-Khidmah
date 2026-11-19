/* Ahloul Khidmah — Service Worker (cache réseau + assets) */
const CACHE_VERSION = "ak-v8"
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

/* ---- Notifications push (FCM) ------------------------------------------ */

/** Chemin interne uniquement : une notification ne doit jamais ouvrir un site tiers. */
function safeNotificationPath(raw) {
  if (typeof raw !== "string") return "/mon-espace"
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "/mon-espace"
  return /^\/[A-Za-z0-9/_\-.?=&]*$/.test(raw) ? raw : "/mon-espace"
}

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    return
  }
  // FCM envoie { notification: { title, body }, data: { … } } ; on accepte aussi data seul.
  const n = payload.notification || {}
  const d = payload.data || {}
  const title = n.title || d.title || "Ahloul Khidmah"
  event.waitUntil(
    self.registration.showNotification(title, {
      body: n.body || d.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { path: safeNotificationPath(d.url) },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(
    safeNotificationPath(event.notification.data && event.notification.data.path),
    self.location.origin
  ).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          return client.navigate(target).then((c) => (c || client).focus())
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
