'use client';

// Khung hiển thị bàn cờ (dùng chung cờ vua & cờ tướng):
// - Góc nhìn: Nhìn thẳng (2D) / Góc 3D (góc nhìn thứ 3) / Cận cảnh (sau lưng quân mình), xoay camera trái–phải.
//   Chỉ nghiêng bàn bằng CSS 3D (transform) — không thêm thư viện, trình duyệt tự tính điểm chạm theo hình 3D.
// - Toàn màn hình: phóng to cả khu chơi (bàn + đồng hồ + nút). Máy không hỗ trợ (iPhone) thì phủ kín cửa sổ.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Box, Maximize2, Minimize2, RotateCcw, RotateCw, ScanEye, Square } from 'lucide-react';

export type View = 'top' | 'tp' | 'close';
const VIEWS: { id: View; label: string; Icon: typeof Box; tilt: number; fit: number }[] = [
  { id: 'top', label: 'Nhìn thẳng', Icon: Square, tilt: 0, fit: 1 },
  { id: 'tp', label: 'Góc 3D', Icon: Box, tilt: 40, fit: 1 },
  { id: 'close', label: 'Cận cảnh', Icon: ScanEye, tilt: 56, fit: 1 },
];
const KEY = 'co-goc-nhin';

/** Bàn cờ đọc để biết có đang ở 3D không (cờ vua dựng quân đứng thay vì vẽ phẳng) */
export const BoardViewCtx = createContext<{ is3d: boolean }>({ is3d: false });
export const useBoardView = () => useContext(BoardViewCtx);

export default function BoardStage({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>('top');
  const [spin, setSpin] = useState(0);
  const [fs, setFs] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nhớ góc nhìn em chọn (đọc sau khi gắn để không lệch với HTML dựng sẵn ở máy chủ)
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { view?: View; spin?: number } | null;
      if (v && VIEWS.some((x) => x.id === v.view)) { setView(v.view as View); setSpin(Number(v.spin) || 0); }
    } catch { /* bỏ qua */ }
  }, []);
  const save = (v: View, s: number) => { try { localStorage.setItem(KEY, JSON.stringify({ view: v, spin: s })); } catch { /* bỏ qua */ } };
  const pick = (v: View) => { const s = v === 'top' ? 0 : spin; setView(v); setSpin(s); save(v, s); };
  const turn = (d: number) => { const s = Math.max(-45, Math.min(45, spin + d)); setSpin(s); save(view, s); };

  const area = () => ref.current?.closest<HTMLElement>('.chs-play') ?? null;
  // Thoát toàn màn hình bằng phím Esc / nút hệ thống → cập nhật lại nút
  useEffect(() => {
    const on = () => { if (!document.fullscreenElement) { setFs(false); area()?.classList.remove('is-fs'); } };
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFs = useCallback(async () => {
    const el = area(); if (!el) return;
    if (fs) {
      el.classList.remove('is-fs'); setFs(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      return;
    }
    el.classList.add('is-fs'); setFs(true);
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); // không được thì vẫn phủ kín cửa sổ
  }, [fs]);
  // Phủ kín cửa sổ (máy không có API toàn màn hình): Esc để thoát
  useEffect(() => {
    if (!fs) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) { area()?.classList.remove('is-fs'); setFs(false); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [fs]);

  const cur = VIEWS.find((v) => v.id === view)!;
  const is3d = view !== 'top';
  // Bàn xoay thì hình chiếu rộng ra (cos + sin) → thu nhỏ tương ứng để không tràn khung
  const rad = (Math.abs(spin) * Math.PI) / 180;
  const fit = cur.fit / (Math.cos(rad) + Math.sin(rad));
  const style = { '--tilt': `${cur.tilt}deg`, '--spin': `${spin}deg`, '--fit': fit.toFixed(3) } as React.CSSProperties;

  return (
    <BoardViewCtx.Provider value={{ is3d }}>
      <div className="bv-bar" role="toolbar" aria-label="Góc nhìn bàn cờ">
        <div className="bv-seg" role="group" aria-label="Chọn góc nhìn">
          {VIEWS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => pick(id)} title={label}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </div>
        {is3d && (
          <div className="bv-seg" role="group" aria-label="Xoay camera">
            <button type="button" onClick={() => turn(-15)} disabled={spin <= -45} title="Xoay camera sang trái" aria-label="Xoay camera sang trái"><RotateCcw aria-hidden="true" /></button>
            <button type="button" onClick={() => turn(15)} disabled={spin >= 45} title="Xoay camera sang phải" aria-label="Xoay camera sang phải"><RotateCw aria-hidden="true" /></button>
          </div>
        )}
        <button type="button" className="bv-fs" onClick={toggleFs} aria-pressed={fs} title={fs ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình'}>
          {fs ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}<span>{fs ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>
      </div>
      <div ref={ref} className={`chs-boardwrap bv-stage${is3d ? ' is-3d' : ''} v-${view}`} style={style}>
        {children}
      </div>
    </BoardViewCtx.Provider>
  );
}
