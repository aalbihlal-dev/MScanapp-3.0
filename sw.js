const CACHE = 'module-scanner-v23';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ONLY intercept GET — never touch POST/API calls
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  if (e.request.method !== 'GET') return;
  if (url.indexOf('api.anthropic.com') !== -1) return;
  if (url.indexOf('api.airtable.com') !== -1) return;
  if (url.indexOf('content.airtable.com') !== -1) return;
  if (url.indexOf('cloudinary.com') !== -1) return;

  // Network-first for index.html — always gets fresh version
  if (url.indexOf('index.html') !== -1 || e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
