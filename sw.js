const CACHE = "n950-inventory-modern-v5";

const STATIC = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {

  self.skipWaiting();

  event.waitUntil(

    caches
      .open(CACHE)
      .then(
        cache =>
          cache.addAll(STATIC)
      )

  );

});


self.addEventListener("activate", event => {

  event.waitUntil(

    (async () => {

      const keys =
        await caches.keys();

      await Promise.all(

        keys
          .filter(
            key =>
              key !== CACHE
          )
          .map(
            key =>
              caches.delete(key)
          )

      );

      await self.clients.claim();

    })()

  );

});


self.addEventListener("fetch", event => {

  const req =
    event.request;

  if(
    req.method !== "GET"
  ) return;


  event.respondWith(

    (async () => {

      try{

        const fresh =
          await fetch(req);

        const cache =
          await caches.open(CACHE);


        if(
          fresh &&
          fresh.status === 200 &&
          fresh.type !== "opaque"
        ){

          cache.put(
            req,
            fresh.clone()
          );

        }


        return fresh;


      }catch{

        const cached =
          await caches.match(req);


        if(cached){

          return cached;

        }


        if(
          req.mode === "navigate"
        ){

          return caches.match(
            "./index.html"
          );

        }


        throw new Error(
          "Offline and resource not cached"
        );

      }

    })()

  );

});
