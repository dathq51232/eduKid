'use client';

// Khung bàn cờ (dùng chung cờ vua & cờ tướng) + nút Toàn màn hình:
// phóng to cả khu chơi (bàn + thẻ người chơi + nút). Máy không hỗ trợ (iPhone) thì phủ kín cửa sổ, Esc để thoát.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function BoardStage({ children }: { children: React.ReactNode }) {
  const [fs, setFs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const area = useCallback(() => ref.current?.closest<HTMLElement>('.chs-play') ?? null, []);

  // Thoát toàn màn hình bằng phím Esc / nút hệ thống → cập nhật lại nút
  useEffect(() => {
    const on = () => { if (!document.fullscreenElement) { setFs(false); area()?.classList.remove('is-fs'); } };
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, [area]);
  const toggleFs = useCallback(async () => {
    const el = area(); if (!el) return;
    if (fs) {
      el.classList.remove('is-fs'); setFs(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      return;
    }
    el.classList.add('is-fs'); setFs(true);
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); // không được thì vẫn phủ kín cửa sổ
  }, [fs, area]);
  // Phủ kín cửa sổ (máy không có API toàn màn hình): Esc để thoát
  useEffect(() => {
    if (!fs) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) { area()?.classList.remove('is-fs'); setFs(false); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [fs, area]);

  return (
    <div className="bv">
      <div className="bv-bar">
        <button type="button" className="bv-fs" onClick={toggleFs} aria-pressed={fs} title={fs ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình'}>
          {fs ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}<span>{fs ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      </div>
      <div ref={ref} className="chs-boardwrap">{children}</div>
    </div>
  );
}
