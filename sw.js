/* 1519 - service worker: po pierwszym uruchomieniu gra dziala bez internetu. */
const CACHE = '1519-v1';
const CORE = ['./', './index.html', './manifest.webmanifest',
              './icon-192.png', './icon-512.png',
              './pyodide/pyodide.js', './pyodide/pyodide.asm.js',
              './pyodide/pyodide.asm.wasm', './pyodide/python_stdlib.zip',
              './pyodide/pyodide-lock.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
