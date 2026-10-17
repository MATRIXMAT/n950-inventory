const CACHE = "n950-inventory-ios-android-v8";

const STATIC = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(k => k !== CACHE)
        .map(k => caches.delete(k))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);

        cache.put("index.html", fresh.clone());

        return fresh;
      } catch {
        return (
          (await caches.match("index.html")) ||
          (await caches.match("./"))
        );
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);

    if (cached) return cached;

    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE);

      cache.put(req, fresh.clone());

      return fresh;
    } catch {
      return cached;
    }
  })());
});
