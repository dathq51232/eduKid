'use client';

// Cắt ảnh (kiểu Canva): kéo khung chọn phần giữ lại, kéo 8 nút ở góc / cạnh để đổi cỡ, chọn nhanh tỉ lệ.
// Kết quả là phần giữ lại theo tỉ lệ 0–1 của ảnh gốc (không sửa file ảnh — bỏ cắt lúc nào cũng được).
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { Crop as CropIcon, X } from 'lucide-react';
import type { Crop } from '@/lib/deck/types';

const RATIOS: { k: string; label: string; r: number | null }[] = [
  { k: 'free', label: 'Tự do', r: null }, { k: '1', label: 'Vuông 1:1', r: 1 }, { k: '43', label: '4:3', r: 4 / 3 },
  { k: '169', label: '16:9', r: 16 / 9 }, { k: '34', label: 'Dọc 3:4', r: 3 / 4 },
];
type Handle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const MIN = 0.04;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** khung lớn nhất có tỉ lệ r (bề ngang / bề cao, tính bằng điểm ảnh) nằm giữa ảnh */
function fitRatio(r: number, nw: number, nh: number): Crop {
  const rf = (r * nh) / nw; // tỉ lệ tính theo phần của ảnh
  const w = rf >= 1 ? 1 : rf, h = rf >= 1 ? 1 / rf : 1;
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

export default function ImageCrop({ src, initial, onApply, onClose }: {
  src: string; initial?: Crop; onApply: (c: Crop | undefined, nat: { w: number; h: number }) => void; onClose: () => void;
}) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [c, setC] = useState<Crop>(initial ?? { x: 0, y: 0, w: 1, h: 1 });
  const [ratio, setRatio] = useState<string>('free');
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ h: Handle; sx: number; sy: number; c0: Crop } | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const r = RATIOS.find((x) => x.k === ratio)?.r ?? null;
  const pickRatio = (k: string) => {
    setRatio(k);
    const rr = RATIOS.find((x) => x.k === k)?.r;
    if (rr && nat) setC(fitRatio(rr, nat.w, nat.h));
  };

  const down = (h: Handle) => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { h, sx: e.clientX, sy: e.clientY, c0: c };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, el = box.current; if (!d || !el || !nat) return;
    const b = el.getBoundingClientRect();
    const dx = (e.clientX - d.sx) / b.width, dy = (e.clientY - d.sy) / b.height;
    const o = d.c0;
    if (d.h === 'move') { setC({ ...o, x: clamp(o.x + dx, 0, 1 - o.w), y: clamp(o.y + dy, 0, 1 - o.h) }); return; }
    let L = o.x, T = o.y, R = o.x + o.w, B = o.y + o.h;
    if (d.h.includes('w')) L = clamp(L + dx, 0, R - MIN);
    if (d.h.includes('e')) R = clamp(R + dx, L + MIN, 1);
    if (d.h.includes('n')) T = clamp(T + dy, 0, B - MIN);
    if (d.h.includes('s')) B = clamp(B + dy, T + MIN, 1);
    if (r) {
      // giữ tỉ lệ: bề cao theo bề ngang (kéo cạnh trên / dưới thì ngược lại), không vượt ra ngoài ảnh
      const rf = (r * nat.h) / nat.w;
      let w = R - L, h = B - T;
      if (d.h === 'n' || d.h === 's') w = h * rf; else h = w / rf;
      const maxW = d.h.includes('w') ? o.x + o.w : 1 - L, maxH = d.h.includes('n') ? o.y + o.h : 1 - T;
      if (w > maxW) { w = maxW; h = w / rf; }
      if (h > maxH) { h = maxH; w = h * rf; }
      if (d.h.includes('w')) L = o.x + o.w - w; else if (d.h === 'n' || d.h === 's') L = clamp(o.x + (o.w - w) / 2, 0, 1 - w);
      if (d.h.includes('n')) T = o.y + o.h - h;
      R = L + w; B = T + h;
    }
    setC({ x: L, y: T, w: R - L, h: B - T });
  };
  const up = () => { drag.current = null; };
  const full = c.x < 0.002 && c.y < 0.002 && c.w > 0.996 && c.h > 0.996;

  return (
    <div className="ct-modal-bg" onClick={onClose}>
      <div className="ct-modal icr" role="dialog" aria-modal="true" aria-label="Cắt ảnh" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-head"><h2><CropIcon aria-hidden="true" /> Cắt ảnh</h2><button type="button" className="ct-x" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button></div>
        <div className="icr-ratios" role="radiogroup" aria-label="Tỉ lệ khung cắt">
          {RATIOS.map((x) => <button key={x.k} type="button" role="radio" aria-checked={ratio === x.k} className={ratio === x.k ? 'is-on' : ''} onClick={() => pickRatio(x.k)}>{x.label}</button>)}
        </div>
        <div className="icr-stage">
          <div className="icr-img" ref={box} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={nat ? { aspectRatio: `${nat.w} / ${nat.h}` } : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh gốc để cắt */}
            <img src={src} alt="" draggable={false} onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth || 1, h: e.currentTarget.naturalHeight || 1 })} />
            {nat && (
              <div className="icr-box" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.w * 100}%`, height: `${c.h * 100}%` }} onPointerDown={down('move')} aria-label="Khung cắt — kéo để dời">
                <i className="icr-g" aria-hidden="true" />
                {HANDLES.map((h) => <span key={h} className={`icr-h is-${h}`} onPointerDown={down(h)} aria-hidden="true" />)}
              </div>
            )}
          </div>
        </div>
        <p className="dash-muted icr-tip">Kéo khung để chọn phần giữ lại, kéo các nút tròn để đổi cỡ.{nat ? ` Phần giữ lại: ${Math.round(c.w * nat.w)} × ${Math.round(c.h * nat.h)} điểm ảnh.` : ' Đang tải ảnh…'}</p>
        <div className="ct-modal-foot">
          {initial && <button type="button" className="btn btn-outline" onClick={() => nat && onApply(undefined, nat)}>Bỏ cắt (ảnh gốc)</button>}
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-outline" onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-primary" disabled={!nat} onClick={() => nat && onApply(full ? undefined : c, nat)}><CropIcon aria-hidden="true" /> Cắt ảnh</button>
        </div>
      </div>
    </div>
  );
}
