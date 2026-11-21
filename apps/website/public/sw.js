const CACHE_NAME = "taskflow-shell-v1";
const CORE_URLS = [
  "/",
  "/app",
  "/manifest.webmanifest",
  "/icons/taskflow-192.png",
  "/icons/taskflow-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch("/app");
    if (!response.ok) throw new Error(`Could not cache the TaskFlow app shell (${response.status}).`);

    const html = await response.clone().text();
    await cache.put("/app", response);
    await cache.addAll(CORE_URLS.filter((url) => url !== "/app"));

    const assets = [...new Set([...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)]
      .map((match) => new URL(match[1], self.location.origin).href)
      .filter((url) => new URL(url).origin === self.location.origin))];
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("taskflow-") && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
        return response;
      } catch {
        return await caches.match(request) || await caches.match("/app") || await caches.match("/");
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
