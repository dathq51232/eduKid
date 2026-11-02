// Dụng cụ trên Bảng trắng: thước kẻ (15 cm), êke, thước đo góc, compa. Kéo thân để di chuyển, kéo núm tròn để xoay.
// Vẽ bút sát mép thước / êke thì nét tự thẳng theo mép.
import type React from 'react';
import { CM, cmText } from '@/lib/board/types';

export type Inst = { x: number; y: number; rot: number };
export type Compass = { cx: number; cy: number; r: number; a: number };
export type Instruments = { ruler?: Inst; square?: Inst; protractor?: Inst; compass?: Compass };
export type InstKey = 'ruler' | 'square' | 'protractor';
export type Grab = (key: InstKey | 'compass', part: string, e: React.PointerEvent) => void;

const RL = 15 * CM, RH = 76;              // thước kẻ
const SQ: [number, number][] = [[0, 0], [10 * CM, 0], [0, 7 * CM]]; // êke: góc vuông ở gốc
const PR = 6.5 * CM;                       // bán kính thước đo góc

const rotP = (i: Inst, lx: number, ly: number): [number, number] => {
  const a = (i.rot * Math.PI) / 180;
  return [i.x + lx * Math.cos(a) - ly * Math.sin(a), i.y + lx * Math.sin(a) + ly * Math.cos(a)];
};

/** Các mép thẳng (toạ độ bảng) để nét bút bám theo, kèm một điểm nằm trong dụng cụ (để biết phía ngoài mép) */
export function instEdges(ins: Instruments): [number, number, number, number, number, number][] {
  const out: [number, number, number, number, number, number][] = [];
  if (ins.ruler) out.push([...rotP(ins.ruler, 0, 0), ...rotP(ins.ruler, RL, 0), ...rotP(ins.ruler, RL / 2, RH / 2)]);
  if (ins.square) {
    const p = SQ.map(([x, y]) => rotP(ins.square!, x, y)), c = rotP(ins.square, SQ[1][0] / 3, SQ[2][1] / 3);
    out.push([...p[0], ...p[1], ...c], [...p[0], ...p[2], ...c], [...p[1], ...p[2], ...c]);
  }
  if (ins.protractor) out.push([...rotP(ins.protractor, -PR, 0), ...rotP(ins.protractor, PR, 0), ...rotP(ins.protractor, 0, -PR / 2)]);
  return out;
}
/** Tìm mép gần điểm bắt đầu nét; trả về hàm chiếu điểm lên mép đó (lùi ra ngoài mép một khoảng off để nét không bị thước che) */
export function edgeSnap(ins: Instruments, x: number, y: number, tol = 24, off = 0): ((x: number, y: number) => [number, number]) | null {
  let best: [number, number, number, number, number, number] | null = null, bd = tol;
  for (const e of instEdges(ins)) {
    const [ax, ay, bx, by] = e, vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy;
    const t = ((x - ax) * vx + (y - ay) * vy) / l;
    if (t < -0.02 || t > 1.02) continue;
    const d = Math.hypot(x - ax - t * vx, y - ay - t * vy);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best) return null;
  const [ax, ay, bx, by, ix, iy] = best, vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy, L = Math.sqrt(l);
  let nx = -vy / L, ny = vx / L;
  if (nx * (ix - ax) + ny * (iy - ay) > 0) { nx = -nx; ny = -ny; } // pháp tuyến hướng ra ngoài dụng cụ
  return (px, py) => { const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l)); return [ax + t * vx + nx * off, ay + t * vy + ny * off]; };
}

const knob = (cx: number, cy: number, part: string, k: InstKey, grab: Grab, z: number) => (
  <g onPointerDown={(e) => { e.stopPropagation(); grab(k, part, e); }} style={{ cursor: 'grab' }}>
    <circle cx={cx} cy={cy} r={16 / z} fill="#7c3aed" stroke="#fff" strokeWidth={3 / z} />
    <path d={`M${cx - 7 / z} ${cy}a${7 / z} ${7 / z} 0 1 1 ${7 / z} ${7 / z}`} fill="none" stroke="#fff" strokeWidth={2.2 / z} strokeLinecap="round" />
  </g>
);

export default function InstrumentsLayer({ ins, grab, zoom, canDraw }: { ins: Instruments; grab: Grab; zoom: number; canDraw: (e: React.PointerEvent) => boolean }) {
  // đang cầm bút và bấm sát mép thước: để bảng vẽ nét thẳng; còn lại: kéo thước
  const body = (k: InstKey) => ({ onPointerDown: (e: React.PointerEvent) => { if (canDraw(e)) return; e.stopPropagation(); grab(k, 'move', e); }, style: { cursor: 'move' } as React.CSSProperties });
  const label = { fontFamily: 'Arial, sans-serif', fontWeight: 700, fill: '#1e293b', textAnchor: 'middle' as const };
  return (
    <g className="no-export">
      {ins.ruler && (
        <g transform={`translate(${ins.ruler.x} ${ins.ruler.y}) rotate(${ins.ruler.rot})`}>
          <rect x={-12} y={0} width={RL + 24} height={RH} rx={8} fill="#fef9c3" fillOpacity={0.88} stroke="#a16207" strokeWidth={1.5} {...body('ruler')} />
          {Array.from({ length: 151 }, (_, i) => {
            const x = (i * CM) / 10, len = i % 10 ? (i % 5 ? 10 : 16) : 24;
            return <line key={i} x1={x} y1={0} x2={x} y2={len} stroke="#1e293b" strokeWidth={i % 10 ? 1 : 1.6} pointerEvents="none" />;
          })}
          {Array.from({ length: 16 }, (_, i) => <text key={i} x={i * CM} y={44} fontSize={15} {...label} pointerEvents="none">{i}</text>)}
          <text x={RL / 2} y={66} fontSize={12} {...label} fill="#a16207" pointerEvents="none">cm · kéo bút sát mép trên để kẻ thẳng</text>
          {knob(RL + 30, RH / 2, 'rot', 'ruler', grab, zoom)}
          <text x={RL + 30} y={RH / 2 - 26} fontSize={14} {...label} fill="#7c3aed" pointerEvents="none">{Math.round(((ins.ruler.rot % 360) + 360) % 360)}°</text>
        </g>
      )}
      {ins.square && (
        <g transform={`translate(${ins.square.x} ${ins.square.y}) rotate(${ins.square.rot})`}>
          <polygon points={SQ.map((p) => p.join(',')).join(' ')} fill="#bae6fd" fillOpacity={0.6} stroke="#0369a1" strokeWidth={2} strokeLinejoin="round" {...body('square')} />
          <polygon points={`${CM * 1.6},${CM * 1.2} ${CM * 5.2},${CM * 1.2} ${CM * 1.6},${CM * 3.7}`} fill="#ffffff" fillOpacity={0.55} pointerEvents="none" />
          {Array.from({ length: 101 }, (_, i) => {
            const x = (i * CM) / 10, len = i % 10 ? (i % 5 ? 8 : 13) : 19;
            return <line key={i} x1={x} y1={0} x2={x} y2={len} stroke="#0c4a6e" strokeWidth={i % 10 ? 1 : 1.5} pointerEvents="none" />;
          })}
          {Array.from({ length: 71 }, (_, i) => {
            const y = (i * CM) / 10, len = i % 10 ? (i % 5 ? 8 : 13) : 19;
            return <line key={i} x1={0} y1={y} x2={len} y2={y} stroke="#0c4a6e" strokeWidth={i % 10 ? 1 : 1.5} pointerEvents="none" />;
          })}
          {Array.from({ length: 10 }, (_, i) => <text key={i} x={(i + 1) * CM} y={36} fontSize={13} {...label} pointerEvents="none">{i + 1}</text>)}
          <path d="M0 26H26V0" fill="none" stroke="#e11d48" strokeWidth={2.5} pointerEvents="none" />
          {knob(10 * CM + 34, 0, 'rot', 'square', grab, zoom)}
        </g>
      )}
      {ins.protractor && (
        <g transform={`translate(${ins.protractor.x} ${ins.protractor.y}) rotate(${ins.protractor.rot})`}>
          <path d={`M${-PR - 14} 0A${PR + 14} ${PR + 14} 0 0 1 ${PR + 14} 0V22H${-PR - 14}Z`} fill="#dcfce7" fillOpacity={0.75} stroke="#15803d" strokeWidth={2} {...body('protractor')} />
          {Array.from({ length: 181 }, (_, d) => {
            const a = Math.PI - (d * Math.PI) / 180, r1 = PR, r0 = PR - (d % 10 ? (d % 5 ? 9 : 15) : 24);
            return <line key={d} x1={Math.cos(a) * r0} y1={-Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={-Math.sin(a) * r1} stroke="#14532d" strokeWidth={d % 10 ? 0.9 : 1.6} pointerEvents="none" />;
          })}
          {Array.from({ length: 19 }, (_, i) => {
            const d = i * 10, a = Math.PI - (d * Math.PI) / 180;
            return (
              <g key={d} pointerEvents="none">
                <text x={Math.cos(a) * (PR - 38)} y={-Math.sin(a) * (PR - 38) + 5} fontSize={13} {...label}>{d}</text>
                <text x={Math.cos(a) * (PR - 60)} y={-Math.sin(a) * (PR - 60) + 4} fontSize={10.5} {...label} fill="#b91c1c">{180 - d}</text>
              </g>
            );
          })}
          <line x1={-PR} y1={0} x2={PR} y2={0} stroke="#14532d" strokeWidth={1.6} pointerEvents="none" />
          <circle cx={0} cy={0} r={5} fill="none" stroke="#b91c1c" strokeWidth={2} pointerEvents="none" />
          <line x1={0} y1={-12} x2={0} y2={12} stroke="#b91c1c" strokeWidth={1.5} pointerEvents="none" />
          {knob(PR + 40, 10, 'rot', 'protractor', grab, zoom)}
        </g>
      )}
      {ins.compass && <CompassView c={ins.compass} grab={grab} zoom={zoom} />}
    </g>
  );
}

function CompassView({ c, grab, zoom }: { c: Compass; grab: Grab; zoom: number }) {
  const px = c.cx + Math.cos(c.a) * c.r, py = c.cy + Math.sin(c.a) * c.r;
  const mx = (c.cx + px) / 2, my = (c.cy + py) / 2;
  const leg = Math.max(90, c.r * 0.55);
  const hx = mx + Math.sin(c.a) * leg, hy = my - Math.cos(c.a) * leg; // khớp compa nằm phía trên đoạn bán kính
  const z = zoom;
  return (
    <g>
      <line x1={c.cx} y1={c.cy} x2={px} y2={py} stroke="#7c3aed" strokeWidth={1.5 / z} strokeDasharray={`${6 / z} ${5 / z}`} pointerEvents="none" />
      <text x={mx} y={my + 22 / z} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={15 / z} fill="#7c3aed" pointerEvents="none">r = {cmText(c.r)}</text>
      <line x1={hx} y1={hy} x2={c.cx} y2={c.cy} stroke="#64748b" strokeWidth={9} strokeLinecap="round" pointerEvents="none" />
      <line x1={hx} y1={hy} x2={px} y2={py} stroke="#94a3b8" strokeWidth={9} strokeLinecap="round" pointerEvents="none" />
      <circle cx={hx} cy={hy} r={11} fill="#334155" pointerEvents="none" />
      <g onPointerDown={(e) => { e.stopPropagation(); grab('compass', 'move', e); }} style={{ cursor: 'move' }}>
        <circle cx={c.cx} cy={c.cy} r={16 / z} fill="#334155" fillOpacity={0.25} stroke="#334155" strokeWidth={2 / z} />
        <circle cx={c.cx} cy={c.cy} r={3.5} fill="#0f172a" />
      </g>
      <g onPointerDown={(e) => { e.stopPropagation(); grab('compass', 'radius', e); }} style={{ cursor: 'ew-resize' }}>
        <circle cx={px} cy={py} r={16 / z} fill="#facc15" fillOpacity={0.45} stroke="#a16207" strokeWidth={2 / z} />
        <circle cx={px} cy={py} r={4} fill="#a16207" />
      </g>
    </g>
  );
}
