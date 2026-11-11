'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Gửi một tín hiệu nhỏ khi đổi trang (lượt xem) và mỗi 2 phút khi tab đang mở (đang online). Không render gì, không setState. */
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { doNotTrack?: string }).doNotTrack === '1') return;
    const send = (view: 0 | 1) => {
      try {
        void fetch('/api/track', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ p: pathname, v: view }) }).catch(() => {});
      } catch { /* bỏ qua */ }
    };
    send(1);
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') send(0); }, 120_000);
    return () => window.clearInterval(id);
  }, [pathname]);

  return null;
}
