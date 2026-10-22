// Offline support for the paintings app.
// Bump VERSION whenever index.html, app.js, paintings.json or any image changes.
const VERSION = 'v23';
const SHELL = `shell-${VERSION}`;
const IMAGES = `images-${VERSION}`;
const FONTS = 'fonts';

const SHELL_FILES = [
  './', 'index.html', 'app.js', 'config.js', 'paintings.json', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'
];

async function imageList(kind) {
  const res = await caches.match('paintings.json') || await fetch('paintings.json');
  const paintings = await res.clone().json();
  return paintings.flatMap(p => p.images.map(i => `img/${kind}/${i.file}`));
}

// Install: the app shell and every gallery thumbnail, so the gallery works offline right away.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(SHELL_FILES);
    const images = await caches.open(IMAGES);
    await images.addAll(await imageList('thumb'));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL, IMAGES, FONTS];
    for (const key of await caches.keys()) if (!keep.includes(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

// The page asks for this once it is idle: download the full-size images in the background.
self.addEventListener('message', event => {
  if (event.data !== 'cache-large') return;
  event.waitUntil((async () => {
    const images = await caches.open(IMAGES);
    for (const url of await imageList('large')) {
      if (await images.match(url)) continue;
      try { await images.add(url); } catch (e) { /* offline or failed, try again next visit */ }
    }
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(req, FONTS));
    return;
  }
  if (url.origin !== location.origin) return;

  if (url.pathname.includes('/img/')) {
    event.respondWith(cacheFirst(req, IMAGES));
  } else if (req.mode === 'navigate') {
    // Fresh page when online, cached page when not.
    event.respondWith(fetch(req).catch(() => caches.match('index.html')));
  } else if (/\/(app|config)\.js$|paintings\.json$/.test(url.pathname)) {
    // Code and settings: fresh when online, so an update shows on the very next open.
    event.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req)));
  } else {
    event.respondWith(staleWhileRevalidate(req, SHELL));
  }
});

async function cacheFirst(req, cacheName) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(cacheName)).put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fresh = fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fresh;
}
