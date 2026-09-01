/* 1519 - service worker: po pierwszym uruchomieniu gra dziala bez internetu.
   WAZNE: sam plik gry (index.html) pobieramy NAJPIERW Z SIECI, a z pamieci
   podrecznej tylko wtedy, gdy sieci nie ma. Dzieki temu podmiana index.html
   na serwerze dziala od razu, bez podmieniania tego pliku. */
const CACHE = '1519-v7';
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

function fresh(req) {                 // najpierw siec, kopia laduje do cache
  return fetch(req, {cache: 'no-store'}).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    return resp;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')));
}
function cached(req) {                // najpierw cache (ciezkie pliki Pyodide)
  return caches.match(req).then(hit => hit || fetch(req).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    return resp;
  }).catch(() => caches.match('./index.html')));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate'
              || url.pathname.endsWith('/')
              || url.pathname.endsWith('.html');
  e.respondWith(isPage ? fresh(e.request) : cached(e.request));
});
