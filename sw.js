/* sw.js — Happy Mango PWA */
const CACHE_NAME = "happy-mango-v1.0.0";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 安裝：先快取核心檔案
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 啟用：清掉舊快取
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 抓取：同源走 cache-first；其餘（CDN）走網路
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只處理 GET
  if (req.method !== "GET") return;

  // 同源（你的網站檔案）→ cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            // 把新抓到的同源檔案也放進快取
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => caches.match("./index.html"));
      })
    );
    return;
  }

  // 非同源（例如 tailwind/fontawesome CDN）→ network first
  event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
});