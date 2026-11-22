// 予備品カウンタ：電波がなくても開けるように、アプリのファイルを端末にしまっておく
// （ファイルを直してアップロードし直すときは、CACHE の番号を上げる）
const CACHE = 'yobihin-counter-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// しまってあるものをすぐ返し、つながっていれば裏で新しい版に入れ替える（次に開いたときから新しい版）
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const net = caches.open(CACHE).then(c => fetch(e.request)
    .then(r => { if (r.ok) c.put(e.request, r.clone()); return r; })
    .catch(() => null));
  e.waitUntil(net.then(() => null));
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    return hit || (await net) || (await c.match('./index.html')) || Response.error();
  }));
});
