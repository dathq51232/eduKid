'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const UTM_KEY = 'edk_utm';
const ok = (v: string | null) => (v && /^[a-z0-9_-]{1,40}$/.test(v) ? v : null);
/**
 * Link marketing có UTM (bài đăng Fanpage / TikTok / Zalo): ghi nguồn + chiến dịch khi khách vào app,
 * nhớ 30 ngày trên máy để biết khách đó có mở trang Đăng ký không. Chỉ lưu tên nguồn & chiến dịch, không lưu gì về người dùng.
 */
function campaignHit(pathname: string): { s: string; c: string; k: 'click' | 'signup_page' } | undefined {
  try {
    const q = new URLSearchParams(window.location.search);
    const s = ok(q.get('utm_source')), c = ok(q.get('utm_campaign'));
    if (s && c) {
      localStorage.setItem(UTM_KEY, JSON.stringify({ s, c, t: Date.now() }));
      return { s, c, k: pathname === '/dang-ky' ? 'signup_page' : 'click' };
    }
    if (pathname === '/dang-ky') {
      const m = JSON.parse(localStorage.getItem(UTM_KEY) ?? 'null') as { s?: string; c?: string; t?: number } | null;
      if (m?.s && m.c && Date.now() - (m.t ?? 0) < 30 * 86_400_000) return { s: m.s, c: m.c, k: 'signup_page' };
    }
  } catch { /* chế độ riêng tư / chặn bộ nhớ: bỏ qua */ }
  return undefined;
}

/** Gửi một tín hiệu nhỏ khi đổi trang (lượt xem) và mỗi 2 phút khi tab đang mở (đang online). Không render gì, không setState. */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { doNotTrack?: string }).doNotTrack === '1') return;
    const send = (view: 0 | 1, u?: { s: string; c: string; k: 'click' | 'signup_page' }) => {
      try {
        void fetch('/api/track', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ p: pathname, v: view, ...(u ? { u } : {}) }) }).catch(() => {});
      } catch { /* bỏ qua */ }
    };
    send(1, campaignHit(pathname));
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') send(0); }, 120_000);
    return () => window.clearInterval(id);
  }, [pathname]);

  return null;
}
