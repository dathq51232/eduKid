import type { NextConfig } from 'next';

// Header bảo mật cho mọi trang. CSP vừa phải: chỉ tải mã/ảnh từ chính trang và Supabase,
// cấm nhúng trang vào web khác (chống clickjacking), cấm plugin, cấm gửi form ra ngoài.
// Địa chỉ Supabase đang cấu hình (kể cả tên miền riêng) luôn được phép, ngoài *.supabase.co
const SUPABASE_ORIGIN = (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin; } catch { return ''; } })();
const SB = SUPABASE_ORIGIN && !SUPABASE_ORIGIN.endsWith('.supabase.co') ? ` ${SUPABASE_ORIGIN}` : '';
const SB_WS = SB.replace(/^ http/, ' ws');

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co https://cdn.jsdelivr.net https://fastly.jsdelivr.net https://unpkg.com https://registry.npmmirror.com${SB}`,
  `media-src 'self' data: blob: https://*.supabase.co${SB}`, // tiếng giới thiệu tác phẩm (Phòng triển lãm) nằm trong Supabase Storage
  "font-src 'self' data:",
  `connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co${SB}${SB_WS}`,
  "frame-src 'self' blob: data:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Không gom tài liệu nội bộ / bí mật vào gói máy chủ (Vercel). Không route nào đọc các thư mục này lúc chạy;
  // (thư mục docs/, .claude/, data/… chỉ dùng khi phát triển trên máy).
  outputFileTracingExcludes: {
    '*': ['docs/**', '.claude/**', '.env*', 'data/**', 'CLAUDE.md', 'graphify-out/**', 'supabase/**'],
  },
  experimental: {
    // giữ trang vừa xem trong bộ nhớ trình duyệt một lúc: quay lại tab vừa mở thì hiện ngay, không chờ máy chủ dựng lại
    staleTimes: { dynamic: 30, static: 300 },
  },
  async headers() {
    // Trang dev (next dev) cần 'unsafe-eval' cho hot reload: chỉ gắn CSP khi chạy bản production
    if (process.env.NODE_ENV !== 'production') return [];
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  // game Robot lập trình đã gỡ (10/2026): link cũ đưa về trang trò chơi
  async redirects() {
    type Redirects = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>;
    const list: Redirects = [{ source: '/tro-choi/robot-lap-trinh', destination: '/tro-choi', permanent: false }];
    // Gom mọi tên miền phụ về tên miền chính (SEO: tránh trùng nội dung). CHỈ bật khi educhainkids.com đã gắn vào Vercel
    // và chạy được: đặt CANONICAL_REDIRECT=on (Production) rồi Redeploy. Danh sách host cũ: CANONICAL_OLD_HOSTS (cách nhau dấu phẩy).
    if (process.env.CANONICAL_REDIRECT === 'on') {
      const target = (process.env.NEXT_PUBLIC_SITE_URL || 'https://educhainkids.com').replace(/\/+$/, '');
      const oldHosts = (process.env.CANONICAL_OLD_HOSTS || 'www.educhainkids.com,educhain-kids-dev.vercel.app')
        .split(',').map((h) => h.trim()).filter((h) => h && h !== new URL(target).host);
      for (const host of oldHosts) {
        list.push({ source: '/:path*', has: [{ type: 'host', value: host }], destination: `${target}/:path*`, permanent: true });
      }
    }
    return list;
  },
};

export default nextConfig;
