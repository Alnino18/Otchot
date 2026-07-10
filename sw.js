const CACHE = 'hisobot-fb-v2';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache) { return cache.addAll(ASSETS); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Network-first strategiya: Firebase real-time ma'lumotlar uchun
// HTML/JS doim networkdan, faqat offline holatda cache fallback
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  // Firebase so'rovlarini cache qilmaymiz
  if (e.request.url.indexOf('firestore.googleapis.com') > -1 ||
      e.request.url.indexOf('googleapis.com') > -1 ||
      e.request.url.indexOf('gstatic.com') > -1) {
    return; // browser default fetch
  }
  e.respondWith(
    fetch(e.request).then(function(res) {
      var resClone = res.clone();
      caches.open(CACHE).then(function(cache) { cache.put(e.request, resClone); });
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
