/* GameRoom: offline helper.
   Always tries the network first, so a new upload reaches everyone the next time they open GameRoom.
   Keeps a copy of the app so it still opens with no signal. Never caches the database. */
const CACHE = "gameroom-v1";
const SHELL = ["./", "index.html", "games.json", "questions.json", "words.json", "manifest.webmanifest",
  "icons/icon.svg", "icons/apple-touch-icon.png", "../shared/config.js", "../shared/account.js", "../shared/vendor/supabase.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;   // the database and fonts go straight to the network
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
