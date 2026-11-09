/* RUMBO — service worker (generado por tools/build.js; versión __VERSION__).
 * Guarda el juego en la caché del navegador para que funcione sin conexión tras la primera carga.
 * Funciona solo con HTTPS (GitHub Pages lo es) o en localhost. */
const CACHE = 'rumbo-__VERSION__';
const ARCHIVOS = __ARCHIVOS__;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rumbo-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    if (hit) return hit;
    return fetch(e.request).then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); } return r; })
      .catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
  }));
});
