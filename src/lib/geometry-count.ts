// Đếm hình trong một hình vẽ ghép từ các đoạn thẳng (dạng toán "đếm hình" nâng cao lớp 2–5).
// Đáp án được TÍNH từ chính hình vẽ (không đếm tay): tìm mọi giao điểm, nối các đoạn thẳng cùng nằm trên
// một đường, rồi đếm tam giác, tứ giác (lồi), hình chữ nhật, hình vuông, hình bình hành, hình thang, góc, đoạn thẳng.

export type Seg = [number, number, number, number];
type P = { x: number; y: number };

const EPS = 1e-6;
const cross = (o: P, a: P, b: P) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const key = (p: P) => `${Math.round(p.x * 1000)}:${Math.round(p.y * 1000)}`;

/** Nét vẽ sau khi gộp các đoạn thẳng thẳng hàng chồng / nối tiếp nhau */
type Stroke = { a: P; b: P };

function mergeCollinear(segs: Seg[]): Stroke[] {
  const left: Stroke[] = segs.map(([x1, y1, x2, y2]) => ({ a: { x: x1, y: y1 }, b: { x: x2, y: y2 } }));
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < left.length; i++) for (let j = i + 1; j < left.length; j++) {
      const s = left[i], t = left[j];
      if (Math.abs(cross(s.a, s.b, t.a)) > EPS * 1e3 || Math.abs(cross(s.a, s.b, t.b)) > EPS * 1e3) continue;
      // cùng đường thẳng: chiếu lên hướng của s
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, len2 = dx * dx + dy * dy;
      const proj = (p: P) => ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / len2;
      const [t0, t1] = [proj(t.a), proj(t.b)].sort((u, v) => u - v);
      if (t0 > 1 + EPS || t1 < -EPS) continue; // rời nhau
      const lo = Math.min(0, t0), hi = Math.max(1, t1);
      left[i] = { a: { x: s.a.x + dx * lo, y: s.a.y + dy * lo }, b: { x: s.a.x + dx * hi, y: s.a.y + dy * hi } };
      left.splice(j, 1);
      changed = true;
      break outer;
    }
  }
  return left;
}

function intersect(s: Stroke, t: Stroke): P | null {
  const d = (s.b.x - s.a.x) * (t.b.y - t.a.y) - (s.b.y - s.a.y) * (t.b.x - t.a.x);
  if (Math.abs(d) < EPS) return null;
  const u = ((t.a.x - s.a.x) * (t.b.y - t.a.y) - (t.a.y - s.a.y) * (t.b.x - t.a.x)) / d;
  const v = ((t.a.x - s.a.x) * (s.b.y - s.a.y) - (t.a.y - s.a.y) * (s.b.x - s.a.x)) / d;
  if (u < -EPS || u > 1 + EPS || v < -EPS || v > 1 + EPS) return null;
  return { x: s.a.x + u * (s.b.x - s.a.x), y: s.a.y + u * (s.b.y - s.a.y) };
}
const onStroke = (p: P, s: Stroke) => {
  if (Math.abs(cross(s.a, s.b, p)) > 1e-3 * Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y)) return false;
  const dot = (p.x - s.a.x) * (s.b.x - s.a.x) + (p.y - s.a.y) * (s.b.y - s.a.y);
  const len2 = (s.b.x - s.a.x) ** 2 + (s.b.y - s.a.y) ** 2;
  return dot >= -1e-3 && dot <= len2 + 1e-3;
};

export type Shape = { pts: number[]; area: number };
export type Analysis = {
  points: P[];
  /** mọi cặp điểm được nối bằng nét vẽ (= số đoạn thẳng) */
  segments: number;
  triangles: Shape[];
  /** tứ giác lồi có 4 cạnh nằm trên nét vẽ */
  quads: (Shape & { parallelPairs: number; rect: boolean; square: boolean })[];
  conn: (i: number, j: number) => boolean;
};

const areaOf = (ps: P[]) => Math.abs(ps.reduce((s, p, i) => s + p.x * ps[(i + 1) % ps.length].y - ps[(i + 1) % ps.length].x * p.y, 0)) / 2;
const par = (a: P, b: P, c: P, d: P) => Math.abs((b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)) < 1e-6 * Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(d.x - c.x, d.y - c.y) * 1e3;

export function analyze(segs: Seg[]): Analysis {
  const strokes = mergeCollinear(segs);
  const points: P[] = [];
  const seen = new Map<string, number>();
  const add = (p: P) => { const k = key(p); if (!seen.has(k)) { seen.set(k, points.length); points.push(p); } };
  for (const s of strokes) { add(s.a); add(s.b); }
  for (let i = 0; i < strokes.length; i++) for (let j = i + 1; j < strokes.length; j++) { const p = intersect(strokes[i], strokes[j]); if (p) add(p); }
  const n = points.length;
  const on = strokes.map((s) => points.map((p) => onStroke(p, s)));
  const C: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  for (const row of on) for (let i = 0; i < n; i++) if (row[i]) for (let j = 0; j < n; j++) if (row[j] && i !== j) C[i][j] = true;
  const conn = (i: number, j: number) => C[i][j];
  let segments = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (C[i][j]) segments++;

  const triangles: Shape[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (C[i][j]) for (let k = j + 1; k < n; k++)
    if (C[i][k] && C[j][k] && Math.abs(cross(points[i], points[j], points[k])) > 1e-6) triangles.push({ pts: [i, j, k], area: areaOf([points[i], points[j], points[k]]) });

  const quads: Analysis['quads'] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) {
    for (const o of [[a, b, c, d], [a, b, d, c], [a, c, b, d]]) {
      if (!(C[o[0]][o[1]] && C[o[1]][o[2]] && C[o[2]][o[3]] && C[o[3]][o[0]])) continue;
      const ps = o.map((i) => points[i]);
      const cs = ps.map((_, i) => cross(ps[i], ps[(i + 1) % 4], ps[(i + 2) % 4]));
      if (!(cs.every((x) => x > 1e-6) || cs.every((x) => x < -1e-6))) continue;
      const p1 = par(ps[0], ps[1], ps[3], ps[2]), p2 = par(ps[1], ps[2], ps[0], ps[3]);
      const dot = (ps[1].x - ps[0].x) * (ps[3].x - ps[0].x) + (ps[1].y - ps[0].y) * (ps[3].y - ps[0].y);
      const rect = p1 && p2 && Math.abs(dot) < 1e-6 * Math.hypot(ps[1].x - ps[0].x, ps[1].y - ps[0].y) * Math.hypot(ps[3].x - ps[0].x, ps[3].y - ps[0].y) * 1e3;
      const square = rect && Math.abs(Math.hypot(ps[1].x - ps[0].x, ps[1].y - ps[0].y) - Math.hypot(ps[3].x - ps[0].x, ps[3].y - ps[0].y)) < 1e-6 * 1e3;
      quads.push({ pts: o, area: areaOf(ps), parallelPairs: (p1 ? 1 : 0) + (p2 ? 1 : 0), rect, square });
      break;
    }
  }
  return { points, segments, triangles, quads, conn };
}

/** Số góc (nhỏ hơn góc bẹt) có đỉnh tại điểm gần (x, y) nhất, cạnh nằm trên nét vẽ */
export function anglesAt(a: Analysis, x: number, y: number): number {
  const o = a.points.reduce((best, p, i) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(a.points[best].x - x, a.points[best].y - y) ? i : best), 0);
  const dirs: number[] = [];
  for (let j = 0; j < a.points.length; j++) if (j !== o && a.conn(o, j)) {
    const t = Math.atan2(a.points[j].y - a.points[o].y, a.points[j].x - a.points[o].x);
    if (!dirs.some((d) => Math.abs(d - t) < 1e-6)) dirs.push(t);
  }
  let count = 0;
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) {
    let d = Math.abs(dirs[i] - dirs[j]);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > 1e-6 && d < Math.PI - 1e-6) count++;
  }
  return count;
}

export type ShapeKind = 'triangle' | 'quad' | 'rectangle' | 'square' | 'parallelogram' | 'trapezoid';
/** Danh sách hình theo loại. trapezoid = hình thang có đúng một cặp cạnh đối song song (không tính hình bình hành) */
export function shapesOf(a: Analysis, kind: ShapeKind): Shape[] {
  if (kind === 'triangle') return a.triangles;
  return a.quads.filter((q) => kind === 'quad' || (kind === 'rectangle' && q.rect) || (kind === 'square' && q.square)
    || (kind === 'parallelogram' && q.parallelPairs === 2) || (kind === 'trapezoid' && q.parallelPairs === 1));
}

/** Nhóm hình theo số "mảnh nhỏ nhất" (diện tích chia cho diện tích hình nhỏ nhất) — dùng để viết lời giải đếm theo nhóm */
export function groupByPieces(shapes: Shape[], unit?: number): [number, number][] {
  if (!shapes.length) return [];
  const u = unit ?? Math.min(...shapes.map((s) => s.area));
  const m = new Map<number, number>();
  for (const s of shapes) { const k = Math.round((s.area / u) * 100) / 100; m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((x, y) => x[0] - y[0]);
}
