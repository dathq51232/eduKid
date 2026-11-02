// Bộ dựng nét bút (11/2026): biến chuỗi điểm (x, y, lực nhấn) thành viền nét có độ dày thay đổi,
// đầu / đuôi nét thon nhọn như nét thanh chữ viết tay. Dùng chung cho Luyện chữ (canvas) và Bảng trắng (SVG).
export type InkPt = [number, number, number?];
export type InkOpts = {
  size: number;          // độ dày nét chuẩn
  thinning?: number;     // 0 → nét đều; 1 → nét đổi mạnh theo lực nhấn / tốc độ
  taperStart?: number;   // độ dài đoạn thon ở đầu nét (cùng đơn vị toạ độ); 0 = đầu tròn
  taperEnd?: number;     // độ dài đoạn thon ở cuối nét; 0 = đuôi tròn
  streamline?: number;   // 0..0.9 làm mượt tay run
};

const dist = (a: InkPt, b: InkPt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const easeTip = (t: number) => t * (2 - t); // thon nhanh ở mũi, đầy dần về thân nét

/** Có dùng bút cảm ứng thật không (lực nhấn thay đổi)? Không thì mô phỏng lực theo tốc độ tay. */
function realPressure(pts: InkPt[]) {
  let lo = 1, hi = 0;
  for (const p of pts) { const v = p[2] ?? 0.5; if (v < lo) lo = v; if (v > hi) hi = v; }
  return hi - lo > 0.05;
}

/** Viền nét (đa giác khép kín) */
export function inkOutline(raw: InkPt[], o: InkOpts): [number, number][] {
  const size = Math.max(0.5, o.size);
  const thin = Math.min(1, Math.max(0, o.thinning ?? 0));
  const sl = Math.min(0.9, Math.max(0, o.streamline ?? 0.35));
  if (!raw.length) return [];
  // 1. làm mượt + bỏ điểm trùng
  const pts: InkPt[] = [[raw[0][0], raw[0][1], raw[0][2] ?? 0.5]];
  for (let i = 1; i < raw.length; i++) {
    const q = pts[pts.length - 1], p = raw[i];
    const n: InkPt = [q[0] + (p[0] - q[0]) * (1 - sl), q[1] + (p[1] - q[1]) * (1 - sl), p[2] ?? 0.5];
    if (dist(n, q) > size * 0.12) pts.push(n);
  }
  const last = raw[raw.length - 1];
  if (raw.length > 1 && dist(last, pts[pts.length - 1]) > 0.3) pts.push([last[0], last[1], last[2] ?? 0.5]);
  if (pts.length === 1) {
    const [x, y] = pts[0], r = size / 2, out: [number, number][] = [];
    for (let a = 0; a < 16; a++) out.push([x + Math.cos((a / 16) * Math.PI * 2) * r, y + Math.sin((a / 16) * Math.PI * 2) * r]);
    return out;
  }
  // 2. chiều dài tích luỹ + lực nhấn
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i]));
  const total = L[L.length - 1];
  const real = realPressure(pts);
  const press: number[] = [];
  let sim = 0.5;
  for (let i = 0; i < pts.length; i++) {
    if (real) { press.push(pts[i][2] ?? 0.5); continue; }
    const v = i ? dist(pts[i - 1], pts[i]) / size : 0;     // đi nhanh → nét mảnh
    sim += (Math.min(1, Math.max(0, 1 - v * 0.35)) - sim) * 0.3;
    press.push(sim);
  }
  // 3. độ dày từng điểm (có thon đầu / đuôi)
  let ts = Math.max(0, o.taperStart ?? 0), te = Math.max(0, o.taperEnd ?? 0);
  if (ts + te > total * 0.9 && ts + te > 0) { const k = (total * 0.9) / (ts + te); ts *= k; te *= k; }
  const W = pts.map((_, i) => {
    let w = size * (1 + thin * (press[i] - 0.5) * 1.4);
    w = Math.max(size * 0.18, w);
    if (ts > 0) w *= Math.max(0.04, easeTip(Math.min(1, L[i] / ts)));
    if (te > 0) w *= Math.max(0.04, easeTip(Math.min(1, (total - L[i]) / te)));
    return w;
  });
  // 4. hai mép trái / phải
  const left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const r = W[i] / 2;
    left.push([pts[i][0] - dy * r, pts[i][1] + dx * r]);
    right.push([pts[i][0] + dy * r, pts[i][1] - dx * r]);
  }
  // 5. đầu / đuôi tròn khi không thon
  const cap = (c: InkPt, from: [number, number], r: number, dir: number): [number, number][] => {
    const out: [number, number][] = [];
    const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
    for (let k = 1; k < 8; k++) { const a = a0 + dir * (k / 8) * Math.PI; out.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); }
    return out;
  };
  const n = pts.length - 1;
  const endCap = te > 0 ? [] : cap(pts[n], left[n], W[n] / 2, -1);
  const startCap = ts > 0 ? [] : cap(pts[0], right[0], W[0] / 2, -1);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}

/** Đa giác → đường SVG mượt (đường cong bậc hai qua trung điểm) */
export function outlinePath(poly: [number, number][]): string {
  if (poly.length < 3) return '';
  const f = (v: number) => Math.round(v * 10) / 10;
  const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${f(mid(poly[poly.length - 1], poly[0])[0])} ${f(mid(poly[poly.length - 1], poly[0])[1])}`;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], m = mid(p, poly[(i + 1) % poly.length]);
    d += `Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + 'Z';
}

/** Đường giữa của nét (cho bút dạ quang và vùng bấm chọn) */
export function centerPath(pts: InkPt[]): string {
  if (!pts.length) return '';
  const f = (v: number) => Math.round(v * 10) / 10;
  return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join('') + (pts.length === 1 ? `l0.1 0` : '');
}

export type BrushKind = 'fountain' | 'ink' | 'pencil' | 'brush' | 'marker';
/** Thông số theo kiểu bút */
export const BRUSH: Record<BrushKind, { label: string; hint: string; thinning: number; alpha: number; mul: number }> = {
  fountain: { label: 'Bút máy', hint: 'Nét thanh – đậm theo lực nhấn', thinning: 0.7, alpha: 1, mul: 0.9 },
  ink: { label: 'Bút mực', hint: 'Nét mực liền, đều', thinning: 0.12, alpha: 1, mul: 1.15 },
  brush: { label: 'Bút lông', hint: 'Nét to nhỏ rõ, mũi nhọn', thinning: 0.95, alpha: 1, mul: 1.6 },
  pencil: { label: 'Bút chì', hint: 'Nét chì mềm', thinning: 0.25, alpha: 0.62, mul: 0.65 },
  marker: { label: 'Bút dạ quang', hint: 'Tô nổi, gạch chân', thinning: 0, alpha: 0.35, mul: 3.2 },
};
