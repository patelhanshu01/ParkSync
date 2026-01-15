const CACHE_VERSION = 'v1';
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-cache-${CACHE_VERSION}`;
const ASSET_EXTENSIONS = [
  '.js',
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.webp',
  '.ico',
  '.woff',
  '.woff2'
];

const shouldHandleApi = (url) => url.pathname.startsWith('/api/');
const isSameOrigin = (url) => url.origin === self.location.origin;
const isAssetRequest = (url) => ASSET_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const keep = new Set([API_CACHE, ASSET_CACHE]);
      return Promise.all(
        keys.map((key) => (keep.has(key) ? Promise.resolve() : caches.delete(key)))
      );
    }).then(() => self.clients.claim())
  );
});

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
};

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ message: 'Offline or cache miss' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (shouldHandleApi(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (isSameOrigin(url) && isAssetRequest(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  }
});
