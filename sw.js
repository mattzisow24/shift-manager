const CACHE_NAME = 'shift-manager-v28';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo-revolution.png',
  '/bays.png',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

function isAppShell(url, request) {
  return request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html';
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Let Firebase/Firestore network requests pass through (auth, sync)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }

  // The app itself is network-first so every launch with signal gets the
  // newest version; the cache only serves it when offline. Everything else
  // (icons, SDK) is cache-first.
  if (isAppShell(url, e.request)) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put('/index.html', copy));
        }
        return resp;
      }).catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
