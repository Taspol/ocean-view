const CACHE_NAME = 'ocean-fishing-v2';
const TILE_CACHE = 'ocean-fishing-tiles-v2';
const RUNTIME_CACHE = 'ocean-fishing-runtime-v2';

const urlsToCache = [
  '/maps',
  '/dashboard',
  '/prediction',
  '/settings',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // If some files fail, continue anyway
        return urlsToCache
          .filter((url) => url)
          .map((url) => new Request(url, { method: 'GET' }))
          .reduce((promise, request) => {
            return promise.then(() =>
              fetch(request)
                .then((response) => {
                  if (response.ok) {
                    return cache.put(request, response);
                  }
                })
                .catch(() => {
                  // Ignore errors for individual files
                })
            );
          }, Promise.resolve());
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName !== CACHE_NAME &&
              cacheName !== TILE_CACHE &&
              cacheName !== RUNTIME_CACHE
          )
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first for dynamic content, cache first for tiles
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle tile requests (OSM tiles)
  if (url.pathname.includes('/tile/') || url.hostname.includes('tile.openstreetmap')) {
    event.respondWith(cacheFirstTile(request));
    return;
  }

  // Handle API requests - network first
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Default: Network first, fallback to cache
  event.respondWith(networkFirstWithFallback(request));
});

// Cache first strategy for tiles
async function cacheFirstTile(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a placeholder if offline
    return new Response('Offline', { status: 503 });
  }
}

// Cache first strategy for navigation with network fallback
async function cacheFirstWithNetworkFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Fallback page if available
    return cache.match('/');
  }
}

// Network first strategy with cache fallback
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Message handling - for cache management from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_TILES') {
    const tileUrls = event.data.tiles;
    event.waitUntil(
      caches.open(TILE_CACHE).then((cache) => {
        return Promise.all(
          tileUrls.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  cache.put(url, response);
                }
              })
              .catch(() => {
                // Ignore individual tile failures
              })
          )
        );
      })
    );
  }

  if (event.data && event.data.type === 'CLEAR_TILE_CACHE') {
    event.waitUntil(caches.delete(TILE_CACHE));
  }
});
