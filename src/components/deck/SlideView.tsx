'use client';

// Vẽ một trang thao giảng (khổ chuẩn 1600 × 900, co giãn theo khung). Ba chế độ:
//  - edit: chọn, kéo, đổi cỡ vật (trình soạn)
//  - play: chạy hiệu ứng, kích hoạt khi bấm, câu hỏi, kéo thả, cảnh 3D (trình chiếu)
//  - thumb: ảnh thu nhỏ tĩnh
import { quizSizes } from '@/lib/deck/fit';
import TeamAvatar from '@/components/classroom/TeamAvatar';
import dynamic from 'next/dynamic';
import SceneBg from './SceneBg';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { FONTS, FX_BY_ID, SH, SW, bgCss, quizImage, quizText, type El, type ShapeEl, type Slide, type SortEl } from '@/lib/deck/types';
import type { SubjectCode } from '@/lib/types';
import { animIterations, fxEasing, fxFrames, planSlide, type Step } from '@/lib/deck/player';
import { playSound } from '@/lib/deck/sounds';
import { questionSegments, speakSegments, stopSpeaking } from '@/lib/speech';

const Scene3DBox = dynamic(() => import('./Scene3DBox'), { ssr: false });

/** Khung giữ tỉ lệ 16:9, trả về tỉ lệ thu phóng cho nội dung 1600 × 900 */
export function SlideFrame({ children, className, style }: { children: (scale: number) => React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / SW));
    ro.observe(el); setScale(el.clientWidth / SW);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className={`dk-frame ${className ?? ''}`} style={style}>{scale > 0 && children(scale)}</div>;
}

export function ShapeSvg({ e }: { e: ShapeEl }) {
  const W = Math.max(40, Math.round(e.w || 100));
  const H = Math.max(40, Math.round(e.h || 100));
  const sw = Math.max(0, e.sw ?? 4);
  const dash = e.dash === 'dash' ? `${Math.max(10, sw * 3)} ${Math.max(8, sw * 2)}` : e.dash === 'dot' ? `1 ${Math.max(8, sw * 2.4)}` : undefined;
  const p = {
    fill: e.fill,
    stroke: e.stroke || 'none',
    strokeWidth: sw,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    strokeDasharray: dash,
  };
  const pad = Math.max(3, Math.ceil(sw / 2) + 2);
  const lipColor = e.stroke && e.stroke !== '#ffffff' && e.stroke !== 'transparent' ? e.stroke : 'rgba(15, 23, 42, 0.16)';

  const body = (() => {
    switch (e.shape) {
      case 'rect':
      case 'round': {
        const isBgRole = e.role === 'card' || e.role === 'cardback' || e.role === 'tape';
        const lip = isBgRole || e.fill === 'transparent' ? 0 : Math.min(8, Math.max(4, Math.round(H * 0.055)));
        const bw = Math.max(10, W - pad * 2);
        const bh = Math.max(10, H - pad * 2 - lip);
        const defR = e.shape === 'round'
          ? (e.role === 'card' ? Math.min(36, Math.min(bw, bh) * 0.045) : Math.min(30, Math.min(bw, bh) * 0.24))
          : 0;
        const r = e.rad != null ? (Math.min(bw, bh) / 2) * (e.rad / 100) : defR;
        const rx = Math.min(bw / 2, Math.max(0, r));
        return (
          <>
            {lip > 0 && (
              <rect x={pad} y={pad + lip} width={bw} height={bh} rx={rx} ry={rx} fill={lipColor} opacity={0.85} />
            )}
            <rect x={pad} y={pad} width={bw} height={bh} rx={rx} ry={rx} {...p} />
            {!isBgRole && e.fill !== 'transparent' && bh >= 48 && (
              <rect
                x={pad + sw * 0.6 + 3}
                y={pad + sw * 0.6 + 3}
                width={Math.max(4, bw - sw * 1.2 - 6)}
                height={Math.max(6, Math.min(18, bh * 0.18))}
                rx={Math.max(2, rx - 4)}
                fill="rgba(255,255,255,0.32)"
                pointerEvents="none"
              />
            )}
          </>
        );
      }
      case 'circle': {
        const S = Math.min(W, H);
        const lip = e.fill === 'transparent' ? 0 : Math.min(7, Math.max(3, Math.round(S * 0.045)));
        const r = Math.max(8, (S - pad * 2 - lip) / 2);
        const cx = W / 2;
        const cy = (H - lip) / 2;
        return (
          <>
            {lip > 0 && <circle cx={cx} cy={cy + lip} r={r} fill={lipColor} opacity={0.85} />}
            <circle cx={cx} cy={cy} r={r} {...p} />
            {e.fill !== 'transparent' && (
              <ellipse cx={cx} cy={cy - r * 0.52} rx={r * 0.55} ry={r * 0.22} fill="rgba(255,255,255,0.32)" pointerEvents="none" />
            )}
          </>
        );
      }
      case 'star': {
        const S = Math.min(W, H);
        const cx = W / 2, cy = H / 2;
        const R = Math.max(12, S / 2 - pad - 3);
        const r = R * 0.46;
        const pts = Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rad = i % 2 === 0 ? R : r;
          return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`;
        }).join(' ');
        const ptsLip = Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const rad = i % 2 === 0 ? R : r;
          return `${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad + 5).toFixed(1)}`;
        }).join(' ');
        return (
          <>
            <polygon points={ptsLip} fill={lipColor} opacity={0.75} />
            <polygon points={pts} {...p} />
            <circle cx={cx} cy={cy - R * 0.18} r={R * 0.22} fill="rgba(255,255,255,0.28)" pointerEvents="none" />
          </>
        );
      }
      case 'heart': {
        const S = Math.min(W, H);
        const ox = (W - S) / 2, oy = (H - S) / 2;
        const k = S / 100;
        const d = `M ${ox + 50 * k} ${oy + 90 * k} C ${ox + 18 * k} ${oy + 68 * k} ${ox + 4 * k} ${oy + 50 * k} ${ox + 4 * k} ${oy + 31 * k} C ${ox + 4 * k} ${oy + 14 * k} ${ox + 17 * k} ${oy + 6 * k} ${ox + 31 * k} ${oy + 6 * k} C ${ox + 41 * k} ${oy + 6 * k} ${ox + 47 * k} ${oy + 12 * k} ${ox + 50 * k} ${oy + 20 * k} C ${ox + 53 * k} ${oy + 12 * k} ${ox + 59 * k} ${oy + 6 * k} ${ox + 69 * k} ${oy + 6 * k} C ${ox + 83 * k} ${oy + 6 * k} ${ox + 96 * k} ${oy + 14 * k} ${ox + 96 * k} ${oy + 31 * k} C ${ox + 96 * k} ${oy + 50 * k} ${ox + 82 * k} ${oy + 68 * k} ${ox + 50 * k} ${oy + 90 * k} Z`;
        return (
          <>
            <path d={d} transform="translate(0, 5)" fill={lipColor} opacity={0.75} />
            <path d={d} {...p} />
          </>
        );
      }
      case 'arrow': {
        const lip = Math.min(6, Math.max(3, Math.round(H * 0.05)));
        const x0 = pad, x1 = W - pad;
        const cy = (H - lip) / 2;
        const headW = Math.min((x1 - x0) * 0.38, (H - pad * 2) * 0.72);
        const shaftX = x1 - headW;
        const sh = (H - pad * 2 - lip) * 0.26;
        const yTop = pad, yBot = H - pad - lip;
        const pts = `${x0},${cy - sh} ${shaftX},${cy - sh} ${shaftX},${yTop} ${x1},${cy} ${shaftX},${yBot} ${shaftX},${cy + sh} ${x0},${cy + sh}`;
        const ptsLip = `${x0},${cy - sh + lip} ${shaftX},${cy - sh + lip} ${shaftX},${yTop + lip} ${x1},${cy + lip} ${shaftX},${yBot + lip} ${shaftX},${cy + lip + sh} ${x0},${cy + lip + sh}`;
        return (
          <>
            <polygon points={ptsLip} fill={lipColor} opacity={0.8} strokeLinejoin="round" />
            <polygon points={pts} {...p} />
          </>
        );
      }
      case 'cloud': {
        const kx = W / 100, ky = H / 100;
        const d = `M ${22 * kx} ${84 * ky} C ${8 * kx} ${84 * ky} ${3 * kx} ${72 * ky} ${7 * kx} ${61 * ky} C ${2 * kx} ${49 * ky} ${11 * kx} ${36 * ky} ${24 * kx} ${39 * ky} C ${26 * kx} ${20 * ky} ${45 * kx} ${11 * ky} ${59 * kx} ${21 * ky} C ${68 * kx} ${10 * ky} ${88 * kx} ${15 * ky} ${88 * kx} ${32 * ky} C ${98 * kx} ${36 * ky} ${98 * kx} ${56 * ky} ${90 * kx} ${63 * ky} C ${96 * kx} ${74 * ky} ${87 * kx} ${85 * ky} ${75 * kx} ${84 * ky} Z`;
        return (
          <>
            <path d={d} transform="translate(0, 5)" fill={lipColor} opacity={0.7} />
            <path d={d} {...p} />
          </>
        );
      }
      case 'bubble': {
        const th = Math.min(28, Math.max(12, Math.round(H * 0.12)));
        const tw = Math.min(36, Math.max(16, Math.round(W * 0.07)));
        const lip = Math.min(6, Math.max(3, Math.round(H * 0.035)));
        const x0 = pad, y0 = pad;
        const bw = Math.max(24, W - pad * 2);
        const bh = Math.max(24, H - pad * 2 - th - lip);
        const r = Math.min(32, Math.min(bw, bh) * 0.22);
        const tx = Math.min(x0 + r + tw * 1.4, x0 + bw * 0.35);
        const x1 = x0 + bw, y1 = y0 + bh;
        const d = [
          `M ${x0 + r} ${y0}`,
          `H ${x1 - r}`,
          `Q ${x1} ${y0} ${x1} ${y0 + r}`,
          `V ${y1 - r}`,
          `Q ${x1} ${y1} ${x1 - r} ${y1}`,
          `H ${tx}`,
          `L ${tx - tw * 0.6} ${y1 + th}`,
          `L ${Math.max(x0 + r, tx - tw)} ${y1}`,
          `H ${x0 + r}`,
          `Q ${x0} ${y1} ${x0} ${y1 - r}`,
          `V ${y0 + r}`,
          `Q ${x0} ${y0} ${x0 + r} ${y0}`,
          'Z',
        ].join(' ');
        return (
          <>
            <path d={d} transform={`translate(0, ${lip})`} fill={lipColor} opacity={0.78} />
            <path d={d} {...p} />
          </>
        );
      }
      case 'wheel': {
        const S = Math.min(W, H);
        const cx = W / 2, cy = H / 2;
        const R = Math.max(16, S / 2 - pad - 4);
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        const slices = colors.map((col, i) => {
          const a0 = (i * Math.PI) / 3 - Math.PI / 2;
          const a1 = ((i + 1) * Math.PI) / 3 - Math.PI / 2;
          const x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R;
          const x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
          return <path key={i} d={`M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`} fill={col} stroke="#ffffff" strokeWidth={Math.max(2, R * 0.03)} />;
        });
        const pegs = Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={cx + Math.cos(a) * R} cy={cy + Math.sin(a) * R} r={Math.max(2.5, R * 0.045)} fill="#ffffff" stroke="#b45309" strokeWidth={1.5} />;
        });
        return (
          <>
            <circle cx={cx} cy={cy + 6} r={R + 3} fill="rgba(15,23,42,0.22)" />
            {slices}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={e.stroke || '#fbbf24'} strokeWidth={Math.max(4, R * 0.07)} />
            {pegs}
            <circle cx={cx} cy={cy} r={R * 0.25} fill="#ffffff" stroke="#f59e0b" strokeWidth={Math.max(3, R * 0.04)} />
          </>
        );
      }
      case 'mystery': {
        const lip = Math.min(8, Math.max(4, Math.round(H * 0.06)));
        const bw = Math.max(16, W - pad * 2);
        const bh = Math.max(16, H - pad * 2 - lip);
        const rx = Math.min(28, Math.min(bw, bh) * 0.22);
        const cx = W / 2, cy = pad + bh / 2;
        const cr = Math.min(bw, bh) * 0.34;
        return (
          <>
            <rect x={pad} y={pad + lip} width={bw} height={bh} rx={rx} fill={e.stroke || '#b45309'} opacity={0.9} />
            <rect x={pad} y={pad} width={bw} height={bh} rx={rx} fill={e.fill || '#fbbf24'} stroke={e.stroke || '#f59e0b'} strokeWidth={sw} />
            <rect x={pad + 8} y={pad + 8} width={Math.max(6, bw - 16)} height={Math.max(6, bh - 16)} rx={Math.max(6, rx - 6)} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={2.5} strokeDasharray="8 6" />
            <circle cx={cx} cy={cy} r={cr} fill="rgba(255,255,255,0.28)" />
          </>
        );
      }
      case 'tray': {
        const lip = Math.min(8, Math.max(4, Math.round(H * 0.045)));
        const bw = Math.max(20, W - pad * 2);
        const bh = Math.max(20, H - pad * 2 - lip);
        const rx = Math.min(28, Math.min(bw, bh) * 0.16);
        const rim = Math.min(14, Math.max(6, Math.round(Math.min(bw, bh) * 0.06)));
        return (
          <>
            <rect x={pad} y={pad + lip} width={bw} height={bh} rx={rx} fill="#92400e" opacity={0.85} />
            <rect x={pad} y={pad} width={bw} height={bh} rx={rx} fill={e.fill || '#f59e0b'} stroke={e.stroke || '#b45309'} strokeWidth={sw} />
            <rect x={pad + rim} y={pad + rim} width={Math.max(8, bw - rim * 2)} height={Math.max(8, bh - rim * 2)} rx={Math.max(6, rx - 6)} fill="#fffbeb" stroke="#fde68a" strokeWidth={2} />
          </>
        );
      }
      case 'banner': {
        const tailW = Math.min(36, W * 0.1);
        const inset = Math.min(22, H * 0.24);
        const y0 = pad, y1 = H - pad - 5;
        const cy = (y0 + y1) / 2;
        const d = `M ${pad} ${y0} H ${W - pad} L ${W - pad - inset} ${cy} L ${W - pad} ${y1} H ${pad} L ${pad + inset} ${cy} Z`;
        void tailW;
        return (
          <>
            <path d={d} transform="translate(0, 5)" fill={lipColor} opacity={0.8} />
            <path d={d} {...p} />
          </>
        );
      }
      case 'sticky': {
        // Giấy Note sổ tay (Slide 2, 3, 6, 8, 9, 11): có miếng băng dính Washi ở mép trên & góc dưới phải quăn nhẹ
        const tapeH = Math.min(36, Math.max(18, Math.round(H * 0.1)));
        const tapeW = Math.min(220, Math.max(90, Math.round(W * 0.34)));
        const tx0 = (W - tapeW) / 2, tx1 = tx0 + tapeW;
        const y0 = Math.round(tapeH * 0.55), y1 = H - 6;
        const x0 = 6, x1 = W - 6;
        const r = Math.min(18, Math.min(W, H) * 0.05);
        const curl = Math.min(42, Math.max(18, Math.round(Math.min(W, H) * 0.13)));
        const isGolden = /f5c76b|fbbf24|fde68a|facc15/i.test(e.fill || '');
        const paperFill = e.fill && e.fill !== 'transparent' ? e.fill : '#f9eedb';
        const bodyPath = [
          `M ${x0 + r} ${y0}`,
          `H ${x1 - r}`,
          `Q ${x1} ${y0} ${x1} ${y0 + r}`,
          `V ${y1 - curl}`,
          `Q ${x1} ${y1 - curl * 0.25} ${x1 - curl} ${y1}`,
          `H ${x0 + r}`,
          `Q ${x0} ${y1} ${x0} ${y1 - r}`,
          `V ${y0 + r}`,
          `Q ${x0} ${y0} ${x0 + r} ${y0}`,
          'Z',
        ].join(' ');
        const curlPath = `M ${x1} ${y1 - curl} C ${x1 - curl * 0.65} ${y1 - curl * 0.9} ${x1 - curl * 0.9} ${y1 - curl * 0.65} ${x1 - curl} ${y1} Q ${x1 - curl * 0.3} ${y1 - curl * 0.2} ${x1} ${y1 - curl} Z`;
        // Miếng băng dính Washi viền răng cưa 2 đầu
        const tapePath = [
          `M ${tx0} 2`,
          `H ${tx1}`,
          `L ${tx1 - 5} ${2 + tapeH * 0.25}`,
          `L ${tx1 + 3} ${2 + tapeH * 0.5}`,
          `L ${tx1 - 4} ${2 + tapeH * 0.75}`,
          `L ${tx1} ${2 + tapeH}`,
          `H ${tx0}`,
          `L ${tx0 + 5} ${2 + tapeH * 0.75}`,
          `L ${tx0 - 3} ${2 + tapeH * 0.5}`,
          `L ${tx0 + 4} ${2 + tapeH * 0.25}`,
          'Z',
        ].join(' ');
        return (
          <>
            <path d={bodyPath} transform="translate(0, 5)" fill="rgba(15,23,42,0.08)" />
            <path d={bodyPath} fill={paperFill} stroke={e.stroke && e.stroke !== '#ffffff' ? e.stroke : 'none'} strokeWidth={e.sw || 0} />
            <path d={curlPath} fill={isGolden ? '#b88328' : '#e2cfb4'} opacity={0.88} />
            {isGolden ? (
              /* Băng dính xanh cổ vịt chấm bi trắng (Slide 9, 11) */
              <g>
                <path d={tapePath} fill="#3f7d7a" opacity={0.94} />
                {Array.from({ length: 11 }, (_, i) => {
                  const dx = tx0 + 14 + (i * (tapeW - 28)) / 10;
                  const dy = i % 2 === 0 ? 2 + tapeH * 0.34 : 2 + tapeH * 0.68;
                  return <circle key={i} cx={dx} cy={dy} r={Math.max(2.5, tapeH * 0.11)} fill="#fef9e7" />;
                })}
              </g>
            ) : (
              /* Băng dính hồng cam kẻ sọc zíc-zắc vẽ tay (Slide 2, 3, 6, 8) */
              <g>
                <path d={tapePath} fill="#f2b3a9" opacity={0.92} />
                <path
                  d={Array.from({ length: 18 }, (_, i) => {
                    const zx = tx0 + 8 + (i * (tapeW - 16)) / 17;
                    const zy = i % 2 === 0 ? 5 : tapeH - 1;
                    return `${i === 0 ? 'M' : 'L'} ${zx.toFixed(1)} ${zy.toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#d9776c"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </>
        );
      }
      case 'plaid-card': {
        // Thẻ bước thực hành có Nhãn Kẻ Caro xanh viền rách răng cưa ở đầu thẻ (Slide 7: Bước 1, Bước 2, Bước 3)
        const headH = Math.min(115, Math.max(54, Math.round(H * 0.23)));
        const headW = Math.round(W * 0.78);
        const hx0 = Math.round((W - headW) / 2), hx1 = hx0 + headW;
        const cardY = Math.round(headH * 0.52);
        const cardH = H - cardY - 6;
        const paperFill = e.fill && e.fill !== 'transparent' ? e.fill : '#faeedb';
        const headPath = [
          `M ${hx0 + 8} 4`,
          `H ${hx1 - 8}`,
          `L ${hx1} ${4 + headH * 0.2}`,
          `L ${hx1 - 5} ${4 + headH * 0.4}`,
          `L ${hx1 + 2} ${4 + headH * 0.6}`,
          `L ${hx1 - 4} ${4 + headH * 0.8}`,
          `L ${hx1 - 6} ${4 + headH}`,
          `H ${hx0 + 6}`,
          `L ${hx0 + 2} ${4 + headH * 0.8}`,
          `L ${hx0 + 6} ${4 + headH * 0.6}`,
          `L ${hx0} ${4 + headH * 0.4}`,
          `L ${hx0 + 5} ${4 + headH * 0.2}`,
          'Z',
        ].join(' ');
        return (
          <>
            <rect x={8} y={cardY + 5} width={W - 16} height={cardH} rx={12} fill="rgba(15,23,42,0.07)" />
            <rect x={8} y={cardY} width={W - 16} height={cardH} rx={12} fill={paperFill} />
            <path d={headPath} fill="#e2ebd7" stroke="#ffffff" strokeWidth={3} />
            {/* Hoạ tiết kẻ caro xanh cốm trên nhãn tiêu đề */}
            {Array.from({ length: 5 }, (_, i) => (
              <line key={`h${i}`} x1={hx0 + 6} y1={12 + i * ((headH - 12) / 4)} x2={hx1 - 6} y2={12 + i * ((headH - 12) / 4)} stroke="#c5d6b3" strokeWidth={5} opacity={0.55} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={hx0 + 18 + i * ((headW - 36) / 8)} y1={6} x2={hx0 + 18 + i * ((headW - 36) / 8)} y2={headH} stroke="#c5d6b3" strokeWidth={5} opacity={0.45} />
            ))}
          </>
        );
      }
      case 'badge-card': {
        // Thẻ vuông có Biểu tượng Tròn (Mặt trời mỉm cười) nhô 50% ra khỏi mép trên thẻ (Slide 4, 5)
        const R = Math.min(72, Math.max(32, Math.round(Math.min(W, H) * 0.19)));
        const cy = R + 18, cx = W / 2;
        const cardY = cy;
        const cardH = H - cardY - 6;
        const paperFill = e.fill && e.fill !== 'transparent' ? e.fill : '#faeedb';
        const sunColor = e.stroke && e.stroke !== '#ffffff' ? e.stroke : '#ecc978';
        return (
          <>
            <rect x={8} y={cardY + 5} width={W - 16} height={cardH} rx={12} fill="rgba(15,23,42,0.06)" />
            <rect x={8} y={cardY} width={W - 16} height={cardH} rx={12} fill={paperFill} />
            {/* 8 tia nắng tròn nhỏ quanh mặt trời */}
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              const r0 = R + 10, r1 = R + 22;
              return (
                <line
                  key={i}
                  x1={cx + Math.cos(a) * r0}
                  y1={cy + Math.sin(a) * r0}
                  x2={cx + Math.cos(a) * r1}
                  y2={cy + Math.sin(a) * r1}
                  stroke={sunColor}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={cx} cy={cy} r={R} fill={sunColor} />
            {/* Khuôn mặt mỉm cười má hồng dễ thương */}
            <ellipse cx={cx - R * 0.26} cy={cy + R * 0.04} rx={R * 0.07} ry={R * 0.12} fill="#111827" />
            <ellipse cx={cx + R * 0.26} cy={cy + R * 0.04} rx={R * 0.07} ry={R * 0.12} fill="#111827" />
            <ellipse cx={cx - R * 0.34} cy={cy + R * 0.18} rx={R * 0.1} ry={R * 0.055} fill="#e07a5f" opacity={0.85} />
            <ellipse cx={cx + R * 0.34} cy={cy + R * 0.18} rx={R * 0.1} ry={R * 0.055} fill="#e07a5f" opacity={0.85} />
            <path d={`M ${cx - R * 0.11} ${cy + R * 0.16} Q ${cx} ${cy + R * 0.28} ${cx + R * 0.11} ${cy + R * 0.16}`} fill="none" stroke="#111827" strokeWidth={3.5} strokeLinecap="round" />
          </>
        );
      }
      case 'flower-bullet': {
        // Bông hoa cúc 8 cánh làm đầu dòng (Slide 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
        const S = Math.min(W, H);
        const cx = W / 2, cy = H / 2;
        const pr = S * 0.22;
        const dist = S * 0.24;
        const petalFill = e.fill && e.fill !== 'transparent' ? e.fill : '#eebfb8';
        const centerFill = e.stroke && e.stroke !== '#ffffff' ? e.stroke : '#d97757';
        return (
          <>
            {Array.from({ length: 8 }, (_, i) => {
              const deg = i * 45;
              return (
                <ellipse
                  key={i}
                  cx={cx}
                  cy={cy - dist}
                  rx={pr * 0.55}
                  ry={pr}
                  fill={petalFill}
                  transform={`rotate(${deg} ${cx} ${cy})`}
                />
              );
            })}
            <circle cx={cx} cy={cy} r={S * 0.13} fill={centerFill} />
          </>
        );
      }
    }
  })();
  return (
    <svg
      className="dk-shape"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={e.shadow ? { filter: 'drop-shadow(0 12px 20px rgba(15,23,42,.20))' } : undefined}
    >
      {body}
    </svg>
  );
}

type Pick = { i: number; ok: boolean };
/** Trạng thái trò Sắp xếp: slots[i] = chỉ số thẻ (trong items) đặt ở ô i; bad = các ô vừa đặt sai (nháy đỏ) */
type SortSt = { slots: (number | null)[]; bad: number[]; ok: boolean };
const sortInit = (e: SortEl): SortSt => ({ slots: e.items.map(() => null), bad: [], ok: false });
function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Xáo thẻ theo id vật (hai cửa sổ chiếu xáo giống nhau), bảo đảm không trùng thứ tự đúng */
export function sortShuffle(e: SortEl): number[] {
  const idx = e.items.map((_, i) => i); let h = hashStr(e.id) || 1;
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (idx.length > 1 && idx.every((v, i) => e.items[v] === e.items[i])) idx.push(idx.shift()!);
  return idx;
}
function SortBody({ e, mode, st, onTile }: { e: SortEl; mode: 'edit' | 'play' | 'thumb'; st?: SortSt; onTile?: (tile: number) => void }) {
  const n = e.items.length, long = Math.max(...e.items.map((t) => t.length), 1);
  const fs = Math.max(24, Math.min(60, e.w / Math.max(n * Math.max(long, 3) * 0.62, 10), (e.h - 120) / 4.2));
  const s = st ?? sortInit(e);
  const order = sortShuffle(e);
  const used = new Set(s.slots.filter((x): x is number => x !== null));
  const shown = mode === 'edit' ? e.items.map((_, i) => i) : null; // khi soạn: hiện thứ tự đúng ở ô
  const tile = (i: number, cls: string, key: string | number) => (
    <button key={key} type="button" className={`dk-tile${cls}`} style={{ fontSize: fs }} disabled={mode !== 'play' || s.ok}
      onPointerDown={(ev) => { if (mode === 'play') ev.stopPropagation(); }}
      onClick={(ev) => { if (mode !== 'play') return; ev.stopPropagation(); onTile?.(i); }}>{e.items[i]}</button>
  );
  return (
    <div className={`dk-sort${s.ok ? ' is-ok' : ''}`}>
      {e.prompt && <div className="dk-sort-q" style={{ fontSize: Math.min(54, fs * 1.05) }}>{e.prompt}</div>}
      {(s.ok || s.bad.length > 0) && <div className={`dk-sort-feedback${s.ok ? ' is-ok' : ' is-bad'}`} role="status" aria-live="polite">
       {s.ok ? 'Tuyệt vời! Em đã sắp xếp chính xác.' : `Chưa đúng ở ${s.bad.map((i) => `ô ${i + 1}`).join(', ')}. Thử lại nhé!`}
      </div>}
      <div className="dk-sort-slots">
        {e.items.map((_, k) => {
          const v = shown ? shown[k] : s.slots[k];
          return <div key={k} className={`dk-slot${s.bad.includes(k) ? ' is-bad' : ''}`} style={{ minHeight: fs * 1.9, minWidth: fs * 2.2 }}>
            <i>{k + 1}</i>{v !== null && v !== undefined ? tile(v, s.ok ? ' is-ok' : s.bad.includes(k) ? ' is-bad' : '', 'p' + k) : null}
          </div>;
        })}
      </div>
      {mode !== 'edit' && <div className="dk-sort-pool">{order.filter((i) => !used.has(i)).map((i) => tile(i, '', i))}</div>}
    </div>
  );
}
function ElBody({ e, mode, assetUrl, pick, onPick, sort, onTile, board }: { e: El; mode: 'edit' | 'play' | 'thumb'; assetUrl?: (p: string) => string | undefined; pick?: Pick; onPick?: (i: number) => void; sort?: SortSt; onTile?: (t: number) => void; board?: BoardTeam[] }) {
  switch (e.kind) {
    case 'text': {
      const f = FONTS[e.font] ?? FONTS.baloo;
      return (
        <div className={`dk-text${e.bg ? ' has-bg' : ''}`} style={{ fontFamily: f.css, fontWeight: f.weight, fontSize: e.size, color: e.color, textAlign: e.align, fontStyle: e.italic ? 'italic' : undefined,
          background: e.bg || undefined, padding: e.bg ? '12px 26px' : undefined, borderRadius: e.bg ? 26 : undefined,
          boxShadow: e.bg ? '0 6px 0 rgba(15, 23, 42, 0.11), 0 10px 22px rgba(15, 23, 42, 0.07)' : undefined,
          border: e.bg ? '2.5px solid rgba(255, 255, 255, 0.88)' : undefined,
          WebkitTextStroke: e.stroke ? `${e.strokeW ?? 10}px ${e.stroke}` : undefined, paintOrder: e.stroke ? 'stroke fill' : undefined, textShadow: e.shadow ? '0 8px 0 rgba(0,0,0,.18), 0 2px 14px rgba(0,0,0,.12)' : undefined, justifyContent: e.align === 'center' ? 'center' : e.align === 'right' ? 'flex-end' : 'flex-start' }}>
          <span>{e.text}</span>
        </div>
      );
    }
    case 'img': {
      const src = e.asset ? assetUrl?.(e.src) : e.src;
      const st: React.CSSProperties = {
        ...(e.rad ? { borderRadius: `${e.rad / 2}%`, objectFit: 'cover' } : {}),
        filter: e.shadow ? 'drop-shadow(0 14px 22px rgba(15,23,42,.26))' : 'drop-shadow(0 8px 14px rgba(15,23,42,.15))',
      };
      // eslint-disable-next-line @next/next/no-img-element -- hình dán / ảnh của cô, kích thước tự do
      return src ? <img className="dk-img" src={src} alt={e.name ?? ''} draggable={false} style={st} /> : <div className="dk-img-wait">🖼</div>;
    }
    case 'shape': return (
      <>
        <ShapeSvg e={e} />
        {e.text && (
          <div
            className="dk-shape-text"
            style={{
              color: e.color ?? '#1f2937',
              fontSize: e.size ?? 40,
              fontFamily: FONTS.baloo.css,
              fontWeight: 800,
              paddingBottom: e.shape === 'bubble' ? '7%' : undefined,
              textShadow: e.shape === 'mystery' || e.shape === 'wheel' ? '0 3px 0 rgba(15,23,42,0.18)' : undefined,
            }}
          >
            {e.text}
          </div>
        )}
      </>
    );
    case 'quiz': {
      // cỡ chữ theo nội dung: lớn nhất mà câu hỏi và mọi đáp án vẫn nằm trong khung
      const { qs, os } = quizSizes({ w: e.w, h: e.h, q: e.q, opts: e.opts.map(quizText), cols: e.cols, img: e.opts.some((o) => !!quizImage(o)) });
      const COL = ['#ef4444', '#2563eb', '#f59e0b', '#16a34a', '#9333ea', '#0891b2'];
      return (
        <div className="dk-quiz">
          <div className="dk-quiz-q" style={{ fontSize: qs }}>{e.q}</div>
          <div className="dk-quiz-opts" style={{ gridTemplateColumns: e.cols === 2 ? '1fr 1fr' : '1fr' }}>
            {e.opts.map((o, i) => {
              const text = quizText(o);
              const image = quizImage(o);
              const imageSrc = image && typeof o !== 'string' && o.imageAsset ? assetUrl?.(image) : image;
              const st = pick && pick.i === i ? (pick.ok ? ' is-ok' : ' is-bad') : pick?.ok && i === e.a ? '' : '';
              return (
                <button key={i} type="button" className={`dk-opt${st}${mode === 'edit' && i === e.a ? ' is-key' : ''}`} style={{ fontSize: os }}
                  disabled={mode !== 'play' || !!pick?.ok}
                  onPointerDown={(ev) => { if (mode === 'play') ev.stopPropagation(); }}
                  onClick={(ev) => { if (mode !== 'play') return; ev.stopPropagation(); onPick?.(i); }}>
                  <b style={{ background: COL[i % COL.length] }}>{String.fromCharCode(65 + i)}</b>
                  {imageSrc && <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- hình đáp án trong bài thao giảng */}
                    <img src={imageSrc} alt={text} style={{ width: 82, height: 82, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} draggable={false} />
                  </>}
                  <span>{text}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case 'sort': return <SortBody e={e} mode={mode} st={sort} onTile={onTile} />;
    case 'teams': return <TeamsBoard title={e.title} teams={board?.length ? board : SAMPLE_BOARD} live={mode === 'play'} />;
    case 'drop': return <div className="dk-drop" style={{ borderColor: e.color, color: e.color }}><span>{e.label}</span></div>;
    case 'scene3d':
      return mode === 'play' && e.lesson ? <Scene3DBox lessonId={e.lesson} title={e.title} />
        : <div className="dk-scene-ph"><span>🧊</span><b>{e.title || 'Cảnh 3D'}</b><small>{mode === 'edit' ? 'Xoay, phóng to được khi trình chiếu' : ''}</small></div>;
  }
}

export type PlayAction = { t: 'step' } | { t: 'back' } | { t: 'trigger'; el: string } | { t: 'quiz'; el: string; i: number } | { t: 'drop'; el: string; x: number; y: number } | { t: 'sort'; el: string; tile: number };
/** điểm một tổ cho Bảng thi đua tổ */
export type BoardTeam = { name: string; emoji: string; color: string; score: number };
const SAMPLE_BOARD: BoardTeam[] = [['Tổ 1', '🚀', '#2457c5', 7], ['Tổ 2', '🌻', '#15803d', 9], ['Tổ 3', '⚡', '#c2410c', 6], ['Tổ 4', '🌈', '#6d3fe0', 8]].map(([name, emoji, color, score]) => ({ name, emoji, color, score } as BoardTeam));
function TeamsBoard({ title, teams, live }: { title: string; teams: BoardTeam[]; live: boolean }) {
  const max = Math.max(1, ...teams.map((t) => t.score)), top = Math.max(...teams.map((t) => t.score));
  return (
    <div className={`dk-board${live ? ' is-live' : ''}`}>
      {title && <div className="dk-board-t">{title}</div>}
      <div className="dk-board-cols">{teams.map((t, i) => (
        <div key={i} className="dk-board-c">
          <div className="dk-board-bar" style={{ height: `${Math.max(12, (Math.max(0, t.score) / max) * 100)}%`, background: t.color, animationDelay: `${i * 0.15}s` }}>
            {t.score === top && top > 0 && <span className="dk-board-cup">🏆</span>}<b>{t.score}</b>
          </div>
          <span className="dk-board-n"><TeamAvatar emoji={t.emoji} size={54} className="team-av-in" /> {t.name}</span>
        </div>
      ))}</div>
    </div>
  );
}
export type PlayApi = { apply: (a: PlayAction) => boolean; stepsLeft: () => number; stepIndex: () => number };

type Props = {
  slide: Slide; mode: 'edit' | 'play' | 'thumb'; scale: number;
  speechSubject?: SubjectCode;
  assetUrl?: (path: string) => string | undefined;
  /* soạn */
  sel?: string | null; onSelect?: (id: string | null, add?: boolean) => void;
  /** các vật đang chọn (chọn nhiều / nhóm) */ multi?: string[];
  /** kéo khung chọn trên nền trang */ onSelectMany?: (ids: string[]) => void;
  onChange?: (id: string, patch: Partial<El>, record: boolean) => void;
  onEditText?: (id: string) => void;
  /** vật đang sửa chữ trực tiếp trên trang (ô gõ đè lên vật) */
  editing?: string | null;
  /* chiếu */
  onAction?: (a: PlayAction) => void;
  onLink?: (n: number) => void;
  /** chạy sẵn đến bước số mấy (khi mở lại trang / cửa sổ chiếu mới mở) */
  startStep?: number;
  /** lớp trả lời đúng / làm xong trò chơi (để cô cộng điểm thi đua tổ) */
  onWin?: (what: string) => void;
  /** điểm các tổ cho Bảng thi đua tổ */
  board?: BoardTeam[];
  /** hiện lưới và hút vật vào lưới khi kéo */
  snapGrid?: boolean;
};
const SlideView = forwardRef<PlayApi, Props>(function SlideView({ slide, mode, scale, assetUrl, speechSubject = 'tieng-viet', sel, onSelect, multi, onSelectMany, onChange, onEditText, editing, onAction, onLink, startStep = 0, onWin, board, snapGrid = false }, ref) {
  const winRef = useRef(onWin); winRef.current = onWin;
  const plan = useMemo(() => planSlide(slide), [slide]);
  const play = mode === 'play';
  useEffect(() => () => { if (play) stopSpeaking(); }, [play]);
  const [hidden, setHidden] = useState<Set<string>>(() => (play ? new Set(plan.hidden) : new Set()));
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [done, setDone] = useState<Set<string>>(new Set()); // vật đã kéo đúng ô
  const [sorts, setSorts] = useState<Record<string, SortSt>>({});
  const [speaking, setSpeaking] = useState(false);
  const [speechProblem, setSpeechProblem] = useState<'unsupported' | 'no_vi_voice' | null>(null);
  const sortsRef = useRef(sorts); sortsRef.current = sorts;
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const step = useRef(0);
  const fired = useRef(new Set<string>());
  const timers = useRef<number[]>([]);
  const hiddenRef = useRef(hidden); hiddenRef.current = hidden;

  const show = useCallback((id: string, v: boolean) => {
    const n = nodes.current.get(id); if (n) n.style.visibility = v ? '' : 'hidden';
    setHidden((h) => { if (v ? !h.has(id) : h.has(id)) return h; const s = new Set(h); if (v) s.delete(id); else s.add(id); return s; });
  }, []);

  const run = useCallback((cues: Step, instant = false) => {
    for (const c of cues) {
      const go = () => {
        const n = nodes.current.get(c.anim.el)?.querySelector<HTMLElement>('.dk-a');
        const g = FX_BY_ID[c.anim.fx].group;
        if (g === 'in') show(c.anim.el, true);
        if (instant) { if (g === 'out') show(c.anim.el, false); return; }
        playSound(c.anim.sound);
        const a = n?.animate(fxFrames(c.anim.fx), { duration: c.anim.dur * 1000, easing: fxEasing(c.anim.fx, c.anim.ease), iterations: animIterations(c.anim) });
        if (g === 'out') { if (a) a.onfinish = () => show(c.anim.el, false); else show(c.anim.el, false); }
      };
      if (instant || c.at <= 0) go(); else timers.current.push(window.setTimeout(go, c.at * 1000));
    }
  }, [show]);

  // vào trang: chạy nhóm tự chạy + âm thanh của trang, rồi chạy nhanh đến bước đã đi (khi đồng bộ)
  useEffect(() => {
    if (!play) return;
    playSound(slide.sound);
    run(plan.auto, startStep > 0);
    for (let i = 0; i < startStep && i < plan.steps.length; i++) run(plan.steps[i], true);
    step.current = Math.min(startStep, plan.steps.length);
    const t = timers.current;
    return () => { t.forEach((x) => clearTimeout(x)); t.length = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoneAt = (x: number, y: number) => slide.els.find((z) => z.kind === 'drop' && x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) as Extract<El, { kind: 'drop' }> | undefined;
  const apply = useCallback((a: PlayAction): boolean => {
    switch (a.t) {
      case 'step': {
        if (step.current >= plan.steps.length) return false;
        run(plan.steps[step.current]); step.current++; return true;
      }
      case 'back': return false;
      case 'trigger': {
        const cues = plan.triggers[a.el]; if (!cues) return false;
        fired.current.add(a.el); run(cues);
        // mở miếng che đáp án (âm "đúng rồi") → hỏi cô cộng điểm cho tổ nào
        if (cues.some((c) => c.anim.sound === 'ding')) window.setTimeout(() => winRef.current?.('Mở đáp án'), 800);
        return true;
      }
      case 'quiz': {
        const q = slide.els.find((x) => x.id === a.el); if (!q || q.kind !== 'quiz') return false;
        const ok = a.i === q.a;
        setPicks((p) => ({ ...p, [a.el]: { i: a.i, ok } }));
        playSound(ok ? 'tada' : 'wrong');
        if (ok) { const n = nodes.current.get(a.el); n?.querySelector<HTMLElement>('.dk-a')?.animate(fxFrames('pulse'), { duration: 700 }); burst(n); window.setTimeout(() => winRef.current?.('Trả lời đúng'), 900); }
        return true;
      }
      case 'drop': {
        const e = slide.els.find((x) => x.id === a.el); if (!e) return false;
        const cx = a.x + e.w / 2, cy = a.y + e.h / 2, z = zoneAt(cx, cy);
        if (z && z.accept.includes(e.id)) {
          setPos((p) => ({ ...p, [e.id]: { x: Math.round(Math.min(Math.max(cx, z.x + e.w / 2), z.x + z.w - e.w / 2) - e.w / 2), y: Math.round(Math.min(Math.max(cy, z.y + e.h / 2), z.y + z.h - e.h / 2) - e.h / 2) } }));
          setDone((d) => { const nd = new Set(d).add(e.id); if (slide.els.filter((x) => x.drag).every((x) => nd.has(x.id))) window.setTimeout(() => winRef.current?.('Kéo thả đúng hết'), 900); return nd; }); playSound('ding'); burst(nodes.current.get(e.id));
        } else if (z) {
          setPos((p) => { const n = { ...p }; delete n[e.id]; return n; }); playSound('wrong');
          nodes.current.get(e.id)?.querySelector<HTMLElement>('.dk-a')?.animate(fxFrames('shake'), { duration: 500 });
        } else setPos((p) => ({ ...p, [e.id]: { x: a.x, y: a.y } }));
        return true;
      }
      case 'sort': {
        const e = slide.els.find((x) => x.id === a.el); if (!e || e.kind !== 'sort') return false;
        const cur = sortsRef.current[e.id] ?? sortInit(e);
        if (cur.ok) return false;
        const slots = [...cur.slots];
        const at = slots.indexOf(a.tile);
        if (at >= 0) { slots[at] = null; playSound('whoosh'); }
        else { const k = slots.indexOf(null); if (k < 0) return false; slots[k] = a.tile; playSound('pop'); }
        let next: SortSt = { slots, bad: [], ok: false };
        if (!slots.includes(null)) {
          const bad = slots.map((v, k) => (e.items[v!] === e.items[k] ? -1 : k)).filter((k) => k >= 0);
          if (!bad.length) {
            next = { slots, bad: [], ok: true }; playSound('tada'); window.setTimeout(() => winRef.current?.('Sắp xếp đúng'), 1100);
            const n = nodes.current.get(e.id); window.setTimeout(() => burst(n), 50);
          } else {
            next = { slots, bad, ok: false }; playSound('wrong');
            timers.current.push(window.setTimeout(() => setSorts((m) => {
              const c = m[e.id]; if (!c) return m;
              return { ...m, [e.id]: { slots: c.slots.map((v, k) => (bad.includes(k) ? null : v)), bad: [], ok: false } };
            }), 900));
          }
        }
        sortsRef.current = { ...sortsRef.current, [e.id]: next };
        setSorts(sortsRef.current);
        return true;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, run, slide.els]);
  useImperativeHandle(ref, () => ({ apply, stepsLeft: () => plan.steps.length - step.current, stepIndex: () => step.current }), [apply, plan]);

  /* ---------- kéo khi trình chiếu ---------- */
  const playDrag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const toSlide = (ev: { clientX: number; clientY: number }, root: HTMLElement) => { const r = root.getBoundingClientRect(); return [(ev.clientX - r.left) / scale, (ev.clientY - r.top) / scale]; };
  const rootRef = useRef<HTMLDivElement>(null);

  /* ---------- soạn: kéo / đổi cỡ ---------- */
  const edit = useRef<{ id: string; kind: 'move' | 'size' | 'rot'; sx: number; sy: number; x0: number; y0: number; w0: number; h0: number; ratio: boolean; moved: boolean;
    /** đã chọn sẵn trước khi bấm (bấm lần hai vào chữ = sửa trực tiếp) */ was?: boolean;
    /** kéo cả nhóm / nhiều vật: vị trí ban đầu của từng vật */ many: { id: string; x: number; y: number; w: number; h: number }[] } | null>(null);
  // đường gióng khi kéo (canh giữa trang, mép / giữa vật khác)
  type GuideLine = { pos: number; kind: 'center' | 'margin' | 'el'; label: string };
  const [guides, setGuides] = useState<{ v: GuideLine[]; h: GuideLine[] }>({ v: [], h: [] });
  const marquee = useRef<{ x0: number; y0: number; moved: boolean } | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const onElDown = (e: El, ev: React.PointerEvent, kind: 'move' | 'size' | 'rot' = 'move') => {
    if (mode === 'thumb') return;
    if (mode === 'edit') {
      ev.stopPropagation();
      if (editing === e.id) return;
      if (ev.shiftKey && kind === 'move') { onSelect?.(e.id, true); return; }
      const was = sel === e.id && (!multi || multi.length <= 1);
      // vật thuộc vùng đang chọn nhiều / thuộc nhóm → kéo cả vùng
      const ids = multi && multi.length > 1 && multi.includes(e.id) ? multi : e.group ? slide.els.filter((x) => x.group === e.group).map((x) => x.id) : [e.id];
      if (!(multi && multi.length > 1 && multi.includes(e.id))) onSelect?.(e.id);
      if (e.lock && kind === 'move') return;
      (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
      const many = kind === 'move' ? slide.els.filter((x) => ids.includes(x.id) && !x.lock).map((x) => ({ id: x.id, x: x.x, y: x.y, w: x.w, h: x.h })) : [];
      edit.current = { id: e.id, kind, sx: ev.clientX, sy: ev.clientY, x0: e.x, y0: e.y, w0: e.w, h0: e.h, ratio: e.kind === 'img' || (e.kind === 'shape' && (e.shape === 'circle' || e.shape === 'star' || e.shape === 'heart')), moved: false, many, was };
      return;
    }
    // chiếu
    if (e.drag && !done.has(e.id)) {
      ev.stopPropagation();
      (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
      const p = pos[e.id] ?? { x: e.x, y: e.y };
      const [x, y] = toSlide(ev, rootRef.current!);
      playDrag.current = { id: e.id, ox: x - p.x, oy: y - p.y, sx: ev.clientX, sy: ev.clientY, moved: false };
    }
  };
  const onElMove = (ev: React.PointerEvent) => {
    const d = edit.current;
    if (d) {
      const dx = (ev.clientX - d.sx) / scale, dy = (ev.clientY - d.sy) / scale;
      if (!d.moved && Math.hypot(dx, dy) < 2) return;
      d.moved = true;
      if (d.kind === 'rot' && rootRef.current) {
        // xoay quanh tâm vật; Shift: bước 15°, gần 0/90/180/270 thì hút vào
        const [px, py] = toSlide(ev, rootRef.current);
        let a = (Math.atan2(py - (d.y0 + d.h0 / 2), px - (d.x0 + d.w0 / 2)) * 180) / Math.PI + 90;
        a = ((Math.round(a) % 360) + 360) % 360;
        if (ev.shiftKey) a = Math.round(a / 15) * 15 % 360;
        else for (const k of [0, 90, 180, 270, 360]) if (Math.abs(a - k) <= 4) a = k % 360;
        onChange?.(d.id, { rot: a > 180 ? a - 360 : a }, false);
        return;
      }
      if (d.kind === 'move') {
        // khung bao của các vật đang kéo → gióng theo tâm trang (X:800, Y:450), mép lề an toàn và vật khác (giữ Alt để tắt)
        const L = Math.min(...d.many.map((m) => m.x)), T = Math.min(...d.many.map((m) => m.y));
        const Rr = Math.max(...d.many.map((m) => m.x + m.w)), B = Math.max(...d.many.map((m) => m.y + m.h));
        let sx = dx, sy = dy;
        const gv: GuideLine[] = [], gh: GuideLine[] = [];
        if (!ev.altKey && snapGrid) {
          sx += Math.round((L + sx) / 20) * 20 - (L + sx);
          sy += Math.round((T + sy) / 20) * 20 - (T + sy);
        }
        if (!ev.altKey) {
          const others = slide.els.filter((o) => !d.many.some((m) => m.id === o.id));
          const tx: GuideLine[] = [
            { pos: SW / 2, kind: 'center', label: 'Tâm dọc · 800' },
            { pos: 80, kind: 'margin', label: 'Lề trái · 80' },
            { pos: SW - 80, kind: 'margin', label: 'Lề phải · 1520' },
            ...others.flatMap((o) => [
              { pos: o.x, kind: 'el' as const, label: 'Mép trái vật' },
              { pos: Math.round(o.x + o.w / 2), kind: 'el' as const, label: 'Tâm vật khác' },
              { pos: o.x + o.w, kind: 'el' as const, label: 'Mép phải vật' },
            ]),
          ];
          const ty: GuideLine[] = [
            { pos: SH / 2, kind: 'center', label: 'Tâm ngang · 450' },
            { pos: 60, kind: 'margin', label: 'Lề trên · 60' },
            { pos: SH - 60, kind: 'margin', label: 'Lề dưới · 840' },
            ...others.flatMap((o) => [
              { pos: o.y, kind: 'el' as const, label: 'Mép trên vật' },
              { pos: Math.round(o.y + o.h / 2), kind: 'el' as const, label: 'Tâm vật khác' },
              { pos: o.y + o.h, kind: 'el' as const, label: 'Mép dưới vật' },
            ]),
          ];
          const tol = Math.min(18, Math.max(8, Math.round(10 / Math.max(scale, 0.2))));
          const snap = (vals: number[], targets: GuideLine[], out: GuideLine[]) => {
            let best: { d: number; guide: GuideLine } | null = null;
            for (const v of vals) {
              for (const t of targets) {
                const k = t.pos - v;
                if (Math.abs(k) <= tol) {
                  const bonus = t.kind === 'center' ? 3 : 0;
                  if (!best || (Math.abs(k) - bonus) < Math.abs(best.d)) {
                    best = { d: k, guide: t };
                  }
                }
              }
            }
            if (best && !out.some((g) => Math.abs(g.pos - best!.guide.pos) < 2)) {
              out.push(best.guide);
            }
            return best?.d ?? 0;
          };
          sx += snap([L + dx, (L + Rr) / 2 + dx, Rr + dx], tx, gv);
          sy += snap([T + dy, (T + B) / 2 + dy, B + dy], ty, gh);
        }
        setGuides({ v: gv, h: gh });
        for (const m of d.many) onChange?.(m.id, { x: Math.round(m.x + sx), y: Math.round(m.y + sy) }, false);
      } else {
        let w = Math.max(30, d.w0 + dx), h = Math.max(24, d.h0 + dy);
        if (d.ratio || ev.shiftKey) { const k = Math.max(w / d.w0, h / d.h0); w = d.w0 * k; h = d.h0 * k; }
        const gv: GuideLine[] = [], gh: GuideLine[] = [];
        if (!ev.altKey) {
          const others = slide.els.filter((o) => o.id !== d.id);
          const tx: GuideLine[] = [
            { pos: SW / 2, kind: 'center', label: 'Tâm dọc · 800' },
            { pos: SW - 80, kind: 'margin', label: 'Lề phải · 1520' },
            ...others.flatMap((o) => [
              { pos: o.x, kind: 'el' as const, label: 'Mép vật khác' },
              { pos: o.x + o.w, kind: 'el' as const, label: 'Mép vật khác' },
            ]),
          ];
          const ty: GuideLine[] = [
            { pos: SH / 2, kind: 'center', label: 'Tâm ngang · 450' },
            { pos: SH - 60, kind: 'margin', label: 'Lề dưới · 840' },
            ...others.flatMap((o) => [
              { pos: o.y, kind: 'el' as const, label: 'Mép vật khác' },
              { pos: o.y + o.h, kind: 'el' as const, label: 'Mép vật khác' },
            ]),
          ];
          const tol = Math.min(16, Math.max(8, Math.round(9 / Math.max(scale, 0.2))));
          for (const t of tx) {
            if (Math.abs(t.pos - (d.x0 + w)) <= tol) {
              w = Math.max(30, t.pos - d.x0);
              gv.push(t);
              break;
            }
          }
          for (const t of ty) {
            if (Math.abs(t.pos - (d.y0 + h)) <= tol) {
              h = Math.max(24, t.pos - d.y0);
              gh.push(t);
              break;
            }
          }
        }
        setGuides({ v: gv, h: gh });
        onChange?.(d.id, { w: Math.round(w), h: Math.round(h) }, false);
      }
      return;
    }
    const p = playDrag.current;
    if (p && rootRef.current) {
      const [x, y] = toSlide(ev, rootRef.current);
      if (!p.moved && Math.hypot(ev.clientX - p.sx, ev.clientY - p.sy) < 4) return;
      p.moved = true;
      setPos((s) => ({ ...s, [p.id]: { x: Math.round(x - p.ox), y: Math.round(y - p.oy) } }));
    }
  };
  const onElUp = (e: El) => {
    const d = edit.current; edit.current = null;
    if (d) {
      setGuides({ v: [], h: [] });
      if (d.moved) onChange?.(d.id, {}, true);
      else if (d.kind === 'move' && d.was && (e.kind === 'text' || e.kind === 'shape')) onEditText?.(e.id); // bấm lần hai vào chữ: sửa trực tiếp
      return;
    }
    const p = playDrag.current; playDrag.current = null;
    if (p) {
      if (p.moved) { const q = pos[p.id] ?? { x: e.x, y: e.y }; const a: PlayAction = { t: 'drop', el: p.id, x: q.x, y: q.y }; apply(a); onAction?.(a); return; }
      click(e);
    }
  };
  // bấm vào vật khi chiếu: kích hoạt / chuyển trang
  const click = (e: El) => {
    if (!play) return;
    if (plan.triggers[e.id]) { const a: PlayAction = { t: 'trigger', el: e.id }; apply(a); onAction?.(a); return; }
    if (e.link) onLink?.(e.link);
  };
  const readAloud = useCallback(async () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const quiz = slide.els.filter((e): e is Extract<El, { kind: 'quiz' }> => e.kind === 'quiz' && !e.hide);
    const content = slide.els.filter((e) => !e.hide).flatMap((e) => {
      switch (e.kind) {
        case 'text': return [e.text];
        case 'shape': return e.text ? [e.text] : [];
        case 'quiz': return [e.q];
        case 'sort': return [e.prompt, ...e.items];
        case 'drop': return [e.label];
        case 'scene3d': return [e.title];
        case 'teams': return [e.title];
        case 'img': return e.name ? [e.name] : [];
      }
    }).filter(Boolean);
    const prompt = content.join('. ') || slide.notes || 'Nội dung trang';
    const opts = quiz.flatMap((e) => e.opts.map((o) => quizText(o)));
    const result = await speakSegments(questionSegments(prompt, opts, speechSubject), {
      rate: 0.9, onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false),
    });
    setSpeechProblem(result.ok ? null : result.reason);
    if (!result.ok) setSpeaking(false);
  }, [slide, speaking, speechSubject]);

  return (
    <div ref={rootRef} className={`dk-slide is-${mode}`} style={{ width: SW, height: SH, transform: `scale(${scale})`, background: bgCss(slide.bg) }}
      onPointerDown={(ev) => {
        if (mode !== 'edit') return;
        const [x, y] = toSlide(ev, rootRef.current!);
        marquee.current = { x0: x, y0: y, moved: false };
        (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
      }}
      onPointerMove={(ev) => {
        const m = marquee.current; if (!m || !rootRef.current) return;
        const [x, y] = toSlide(ev, rootRef.current);
        if (!m.moved && Math.hypot(x - m.x0, y - m.y0) < 6) return;
        m.moved = true;
        setBox({ x: Math.min(x, m.x0), y: Math.min(y, m.y0), w: Math.abs(x - m.x0), h: Math.abs(y - m.y0) });
      }}
      onPointerUp={() => {
        const m = marquee.current; marquee.current = null; if (!m) return;
        if (!m.moved || !box) { onSelect?.(null); setBox(null); return; }
        const b = box; setBox(null);
        onSelectMany?.(slide.els.filter((e) => e.x < b.x + b.w && e.x + e.w > b.x && e.y < b.y + b.h && e.y + e.h > b.y).map((e) => e.id));
      }}>
      {play && (
        <>
          <button type="button" className={`dk-tts${speaking ? ' is-on' : ''}`} onClick={(ev) => { ev.stopPropagation(); void readAloud(); }} title={speaking ? 'Dừng đọc' : 'Đọc nội dung trang'} aria-label={speaking ? 'Dừng đọc' : 'Đọc nội dung trang'} aria-pressed={speaking}>{speaking ? '⏹' : '🔊'}</button>
          {speechProblem && <div className="dk-tts-msg" role="status">
            {speechProblem === 'no_vi_voice' ? 'Máy chưa có giọng đọc Tiếng Việt. Thử Microsoft Edge hoặc cài giọng Tiếng Việt trong cài đặt Windows.' : 'Trình duyệt này không hỗ trợ đọc nội dung.'}
            <button type="button" onClick={() => setSpeechProblem(null)} aria-label="Đóng">×</button>
          </div>}
        </>
      )}
      {slide.scene && (
        <SceneBg
          id={slide.scene}
          variant={
            slide.sceneVariant ??
            (slide.phase === 'Trang bìa' || slide.els.some((e) => e.role === 'divider')
              ? 'cover'
              : slide.phase === 'Khám phá'
              ? 'right'
              : slide.phase === 'Vận dụng'
              ? 'left'
              : 'bottom')
          }
        />
      )}
      {mode === 'edit' && snapGrid && <i className="dk-grid-overlay" aria-hidden="true" />}
      {slide.els.map((e) => {
        const p = play ? pos[e.id] : undefined;
        const clickable = play && (!!plan.triggers[e.id] || !!e.link || (!!e.drag && !done.has(e.id)));
        return (
          <div key={e.id} data-id={e.id} ref={(n) => { if (n) nodes.current.set(e.id, n); else nodes.current.delete(e.id); }}
            className={`dk-el k-${e.kind}${e.hide ? ' is-hide' : ''}${mode === 'edit' && editing === e.id ? ' is-editing' : ''}${e.flip ? ' is-flip' : ''}${sel === e.id || multi?.includes(e.id) ? ' is-sel' : ''}${multi && multi.length > 1 && multi.includes(e.id) && sel !== e.id ? ' is-sel2' : ''}${clickable ? ' is-click' : ''}${play && e.drag && !done.has(e.id) ? ' is-drag' : ''}${done.has(e.id) ? ' is-done' : ''}`}
            style={{ left: p?.x ?? e.x, top: p?.y ?? e.y, width: e.w, height: e.h, transform: e.rot ? `rotate(${e.rot}deg)` : undefined, visibility: (play && hidden.has(e.id)) || (e.hide && mode !== 'edit') ? 'hidden' : undefined, zIndex: play && playDrag.current?.id === e.id ? 50 : undefined }}
            onPointerDown={(ev) => onElDown(e, ev)} onPointerMove={onElMove} onPointerUp={() => onElUp(e)}
            onClick={(ev) => { if (play && !e.drag && clickable) { ev.stopPropagation(); click(e); } }}
            onDoubleClick={() => { if (mode === 'edit' && (e.kind === 'text' || e.kind === 'shape' || e.kind === 'quiz' || e.kind === 'sort')) onEditText?.(e.id); }}>
            <div className="dk-a" style={e.op != null && e.op < 1 ? { opacity: e.op } : undefined}><ElBody e={e} mode={mode} assetUrl={assetUrl} pick={picks[e.id]} onPick={(i) => { const a: PlayAction = { t: 'quiz', el: e.id, i }; apply(a); onAction?.(a); }}
              board={board} sort={sorts[e.id]} onTile={(tile) => { const a: PlayAction = { t: 'sort', el: e.id, tile }; if (apply(a)) onAction?.(a); }} /></div>
            {mode === 'edit' && editing === e.id && (e.kind === 'text' || e.kind === 'shape') && <InlineText e={e} onText={(t, done) => onChange?.(e.id, done ? {} : { text: t }, done)} onDone={() => onEditText?.('')} />}
            {mode === 'edit' && sel === e.id && !e.lock && editing !== e.id && (!multi || multi.length <= 1) && <span className="dk-rot" title="Kéo để xoay (giữ Shift: bước 15°)" onPointerDown={(ev) => onElDown(e, ev, 'rot')} onPointerMove={onElMove} onPointerUp={() => onElUp(e)}>⟳</span>}
            {mode === 'edit' && sel === e.id && !e.lock && (!multi || multi.length <= 1) && <span className="dk-size" onPointerDown={(ev) => onElDown(e, ev, 'size')} onPointerMove={onElMove} onPointerUp={() => onElUp(e)} />}
            {mode === 'edit' && <AnimBadges slide={slide} id={e.id} />}
          </div>
        );
      })}
      {mode === 'edit' && guides.v.map((g, i) => (
        <i key={`v${i}`} className={`dk-guide is-v is-${g.kind}`} style={{ left: g.pos }}>
          <span className="dk-guide-badge">{g.label}</span>
        </i>
      ))}
      {mode === 'edit' && guides.h.map((g, i) => (
        <i key={`h${i}`} className={`dk-guide is-h is-${g.kind}`} style={{ top: g.pos }}>
          <span className="dk-guide-badge">{g.label}</span>
        </i>
      ))}
      {mode === 'edit' && box && <i className="dk-marquee" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />}
    </div>
  );
});
export default memo(SlideView);

/** Ô gõ chữ đè lên vật (sửa trực tiếp trên trang): gõ là thấy ngay; bấm ra ngoài / Esc để xong */
function InlineText({ e, onText, onDone }: { e: El; onText: (t: string, done: boolean) => void; onDone: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = ref.current; if (t) { t.focus(); t.select(); } }, []);
  const tx = e.kind === 'text' ? e : null, sh = e.kind === 'shape' ? e : null;
  const f = FONTS[tx?.font ?? 'baloo'] ?? FONTS.baloo;
  const val = tx ? tx.text : sh?.text ?? '';
  return (
    <textarea ref={ref} className={`dk-inline${sh ? ' is-shape' : ''}`} defaultValue={val} aria-label="Sửa chữ trên trang" spellCheck={false}
      style={{ fontFamily: f.css, fontWeight: f.weight, fontSize: tx ? tx.size : sh?.size ?? 40, color: tx ? tx.color : sh?.color ?? '#1f2937', textAlign: tx ? tx.align : 'center', fontStyle: tx?.italic ? 'italic' : undefined }}
      onPointerDown={(ev) => ev.stopPropagation()} onDoubleClick={(ev) => ev.stopPropagation()}
      onChange={(ev) => onText(ev.target.value, false)}
      onBlur={() => { onText('', true); onDone(); }}
      onKeyDown={(ev) => { ev.stopPropagation(); if (ev.key === 'Escape') (ev.target as HTMLTextAreaElement).blur(); }} />
  );
}

/** Số thứ tự hiệu ứng / dấu kích hoạt hiện trên vật khi soạn */
function AnimBadges({ slide, id }: { slide: Slide; id: string }) {
  const idx: string[] = [];
  slide.anims.forEach((a, i) => { if (a.el === id) idx.push(a.trigger ? `🎯${i + 1}` : String(i + 1)); });
  const isTrig = slide.anims.some((a) => a.trigger === id);
  if (!idx.length && !isTrig) return null;
  return (
    <span className="dk-badges">
      {isTrig && <i className="is-trg" title="Bấm vào vật này để chạy hiệu ứng">🎯</i>}
      {idx.slice(0, 4).map((t, i) => <i key={i} className={t.startsWith('🎯') ? 'is-trg2' : ''}>{t.replace('🎯', '')}</i>)}
    </span>
  );
}

/** Pháo giấy nhỏ quanh vật (khi trả lời đúng / kéo đúng) */
function burst(n?: HTMLElement | null) {
  if (!n) return;
  const host = n.parentElement; if (!host) return;
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const cx = n.offsetLeft + n.offsetWidth / 2, cy = n.offsetTop + n.offsetHeight / 2;
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('i');
    d.className = 'dk-confetti';
    d.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]}`;
    host.appendChild(d);
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220;
    d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r + 120}px) rotate(${Math.random() * 720}deg) scale(.6)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
  }
}
