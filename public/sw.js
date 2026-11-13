// EduChain Kids — bộ nhớ đệm để chiếu bài giảng khi mất mạng (chỉ đăng ký khi thầy cô bấm "Lưu để chiếu offline").
// - Tệp tĩnh của app (/_next/static, mô hình 3D, hình, phông chữ): lấy từ bộ nhớ trước, chưa có thì tải rồi giữ lại.
// - Trang /chieu-offline: lấy mạng trước, mất mạng thì dùng bản đã giữ.
// - Mất mạng khi mở trang khác: đưa về /chieu-offline (danh sách bài đã lưu trên máy).
// Dữ liệu bài + ảnh / âm thanh / mô hình riêng của cô nằm trong IndexedDB (src/lib/offline/store.ts), không ở đây.
const STATIC = 'edk-static-v1';
const PAGES = 'edk-pages-v1';
const OFFLINE_URL = '/chieu-offline';
const MAX_STATIC = 600;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add(OFFLINE_URL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = new Set([STATIC, PAGES]);
    for (const k of await caches.keys()) if (k.startsWith('edk-') && !keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isStatic = (u) =>
  (u.origin === self.location.origin && (/^\/_next\/static\//.test(u.pathname) || /^\/(models|emoji|brand|stickers|fonts|sounds)\//.test(u.pathname) || /\.(?:glb|webp|png|svg|woff2|mp3)$/.test(u.pathname)))
  || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC; i++) await cache.delete(keys[i]);
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()).then(() => trim(cache)).catch(() => {}); }
  return res;
}

async function page(req, url) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (url.pathname === OFFLINE_URL && res.ok) cache.put(OFFLINE_URL, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = (await cache.match(OFFLINE_URL)) ?? (await caches.match(OFFLINE_URL));
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === self.location.origin) { e.respondWith(page(req, url)); return; }
  if (isStatic(url)) e.respondWith(cacheFirst(req));
});
