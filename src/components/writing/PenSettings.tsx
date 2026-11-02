'use client';

// Bảng chỉnh bút (dùng chung Luyện chữ + Bảng trắng): kiểu bút, tẩy nét, màu, độ dày, đầu / đuôi nét thanh nhọn.
import { useMemo } from 'react';
import { Eraser } from 'lucide-react';
import { BRUSH, inkOutline, outlinePath, centerPath, type BrushKind, type InkPt } from '@/lib/writing/ink';

export type PenState = { tool: 'pen' | 'erase'; brush: BrushKind; color: string; size: number; taperStart: number; taperEnd: number };
export const DEFAULT_PEN: PenState = { tool: 'pen', brush: 'fountain', color: '#1e3a8a', size: 1, taperStart: 0, taperEnd: 18 };
export const PEN_COLORS = ['#1e3a8a', '#111827', '#7c3aed', '#be123c', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#db2777', '#ffffff'];
const MARKER_COLORS = ['#fde047', '#86efac', '#93c5fd', '#f9a8d4', '#fdba74'];

const TIPS: { id: string; label: string; v: [number, number] }[] = [
  { id: 'tron', label: 'Đầu tròn', v: [0, 0] },
  { id: 'duoi', label: 'Đuôi thanh nhọn', v: [0, 18] },
  { id: 'hai', label: 'Nhọn 2 đầu', v: [12, 22] },
  { id: 'long', label: 'Nét lông dài', v: [22, 44] },
];

// nét mẫu hình chữ S nhẹ để xem trước
const SAMPLE: InkPt[] = Array.from({ length: 40 }, (_, i) => {
  const t = i / 39;
  return [14 + t * 200, 34 - Math.sin(t * Math.PI * 1.6) * 14, 0.35 + Math.sin(t * Math.PI) * 0.55];
});

export function PenPreview({ pen, base = 6, bg }: { pen: PenState; base?: number; bg?: string }) {
  const b = BRUSH[pen.brush];
  const d = useMemo(() => pen.brush === 'marker' ? centerPath(SAMPLE)
    : outlinePath(inkOutline(SAMPLE, { size: base * b.mul * pen.size, thinning: b.thinning, taperStart: pen.taperStart, taperEnd: pen.taperEnd, streamline: 0 })),
  [pen, base, b]);
  return (
    <svg className="pen-preview" viewBox="0 0 228 64" aria-hidden="true" style={bg ? { background: bg } : undefined}>
      {pen.brush === 'marker'
        ? <path d={d} fill="none" stroke={pen.color} strokeOpacity={b.alpha} strokeWidth={base * b.mul * pen.size} strokeLinecap="round" strokeLinejoin="round" />
        : <path d={d} fill={pen.color} fillOpacity={b.alpha} />}
    </svg>
  );
}

export default function PenSettings({ value: pen, onChange, brushes, eraser = false, base = 6, dark = false }: {
  value: PenState; onChange: (p: PenState) => void; brushes: BrushKind[]; eraser?: boolean; base?: number; dark?: boolean;
}) {
  const set = (p: Partial<PenState>) => onChange({ ...pen, ...p });
  const isMarker = pen.brush === 'marker';
  const colors = isMarker ? MARKER_COLORS : PEN_COLORS;
  const pick = (b: BrushKind) => {
    const toMarker = b === 'marker', fromMarker = pen.brush === 'marker';
    set({ tool: 'pen', brush: b, ...(toMarker && !fromMarker ? { color: MARKER_COLORS[0] } : !toMarker && fromMarker ? { color: dark ? '#ffffff' : PEN_COLORS[0] } : {}) });
  };
  return (
    <section className="pen-set" aria-label="Chỉnh bút">
      <div className="pen-brushes" role="radiogroup" aria-label="Kiểu bút">
        {brushes.map((b) => (
          <button key={b} type="button" role="radio" aria-checked={pen.tool === 'pen' && pen.brush === b} className={pen.tool === 'pen' && pen.brush === b ? 'is-on' : ''} onClick={() => pick(b)} title={BRUSH[b].hint}>
            <PenPreview pen={{ ...pen, brush: b, size: 1, color: b === 'marker' ? MARKER_COLORS[0] : 'currentColor', ...(b === 'marker' ? {} : { taperStart: b === 'brush' ? 14 : pen.taperStart, taperEnd: b === 'brush' ? 30 : pen.taperEnd }) }} base={5} />
            <b>{BRUSH[b].label}</b>
          </button>
        ))}
        {eraser && (
          <button type="button" role="radio" aria-checked={pen.tool === 'erase'} className={`pen-eraser${pen.tool === 'erase' ? ' is-on' : ''}`} onClick={() => set({ tool: 'erase' })} title="Chạm vào nét nào thì xoá nét đó">
            <Eraser aria-hidden="true" /><b>Tẩy nét</b>
          </button>
        )}
      </div>

      <div className="pen-colors" role="radiogroup" aria-label="Màu bút">
        {colors.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={pen.color === c} aria-label={`Màu ${c}`} style={{ background: c }} className={pen.color === c ? 'is-on' : ''} onClick={() => set({ color: c, tool: 'pen' })} />
        ))}
        <label className="pen-custom" title="Chọn màu khác">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(pen.color) ? pen.color : '#1e3a8a'} onChange={(e) => set({ color: e.target.value, tool: 'pen' })} aria-label="Chọn màu khác" />
        </label>
      </div>

      <label className="pen-range">Độ dày nét <b>{Math.round(pen.size * 100)}%</b>
        <input type="range" min="0.4" max="3" step="0.1" value={pen.size} onChange={(e) => set({ size: Number(e.target.value) })} />
      </label>

      {!isMarker && (
        <fieldset className="pen-tip">
          <legend>Đầu / đuôi nét</legend>
          <div className="pen-tip-pick">
            {TIPS.map((t) => (
              <button key={t.id} type="button" aria-pressed={pen.taperStart === t.v[0] && pen.taperEnd === t.v[1]} className={pen.taperStart === t.v[0] && pen.taperEnd === t.v[1] ? 'is-on' : ''} onClick={() => set({ taperStart: t.v[0], taperEnd: t.v[1] })}>{t.label}</button>
            ))}
          </div>
          <label className="pen-range">Thon đầu nét <b>{pen.taperStart}</b>
            <input type="range" min="0" max="60" step="1" value={pen.taperStart} onChange={(e) => set({ taperStart: Number(e.target.value) })} />
          </label>
          <label className="pen-range">Thon đuôi nét <b>{pen.taperEnd}</b>
            <input type="range" min="0" max="80" step="1" value={pen.taperEnd} onChange={(e) => set({ taperEnd: Number(e.target.value) })} />
          </label>
        </fieldset>
      )}
      <PenPreview pen={pen} base={base} bg={dark ? '#1f3b2d' : undefined} />
    </section>
  );
}
