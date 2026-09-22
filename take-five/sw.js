/* Take Five — service worker.
   Bump CACHE whenever you deploy. Anything cached under the old name is
   deleted on activate, so a stale app can never linger. */
const CACHE = "takefive-v4";

/* The app shell. questions.json is deliberately NOT here — it is fetched
   network-first below so new questions appear as soon as you deploy them. */
const SHELL = [
  './',
  'index.html',
  'app.css',
  'app.js',
  'config.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);

  /* Never cache API traffic — game state must always be live. */
  if(url.origin !== self.location.origin) return;

  /* questions.json and the shell: try the network first so a deploy lands
     immediately, fall back to cache when there is no connection. */
  e.respondWith(
    fetch(req)
      .then(res=>{
        if(res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return res;
      })
      .catch(()=> caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});
