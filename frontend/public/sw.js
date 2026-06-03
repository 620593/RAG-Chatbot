/**
 * RAG Chatbot — Service Worker
 * Provides offline shell caching so the UI loads without network.
 * API calls (/chat, /upload, /health) are always network-first — no stale AI data.
 */

const CACHE_NAME = "rag-chatbot-v1";

// App shell resources to cache on install
const PRECACHE_URLS = [
  "/",
  "/_next/static/css/app/layout.css",
];

// API paths that should NEVER be served from cache
const API_PATHS = ["/chat", "/upload", "/health", "/status", "/api/"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache the root shell page
      return cache.add("/").catch(() => {
        // Ignore pre-cache failures (Next.js dynamic routes may not be static)
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (POST for chat/upload always goes to network)
  if (event.request.method !== "GET") return;

  // Skip API routes — always use network, never cache
  const isApiCall = API_PATHS.some((path) => url.pathname.startsWith(path));
  if (isApiCall) return;

  // Skip cross-origin requests (e.g., Render backend, external fonts)
  if (url.origin !== self.location.origin) {
    // For Google Fonts and other CDN assets — cache-first
    if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) =>
          cache.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
        )
      );
    }
    return;
  }

  // For Next.js static assets (_next/static) — cache-first strategy
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // For HTML pages — network-first, fall back to cache (offline shell)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a fresh copy of the page
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() =>
        // Offline fallback: serve cached version
        caches.match(event.request).then(
          (cached) => cached || caches.match("/")
        )
      )
  );
});
