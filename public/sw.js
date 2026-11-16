// Service worker tối giản: mở app nhanh + dùng được khi mạng chập chờn.
// Không bao giờ lưu đệm dữ liệu Supabase (khác nguồn) — dữ liệu luôn lấy mới.
const BAN = 'ns-aff-v1'
const GOC = new URL(self.registration.scope).href

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== BAN) await caches.delete(k)
  await self.clients.claim()
})()))

self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET') return
  const u = new URL(r.url)
  if (u.origin !== location.origin) return
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => {
      if (res.ok || res.status === 404) { const c = res.clone(); caches.open(BAN).then((x) => x.put(GOC, c)) }
      return res
    }).catch(() => caches.match(GOC)))
    return
  }
  if (u.pathname.includes('/assets/') || /\.(png|svg|webmanifest)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => {
      if (res.ok) { const c = res.clone(); caches.open(BAN).then((x) => x.put(r, c)) }
      return res
    })))
  }
})
