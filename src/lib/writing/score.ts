// Luyện chữ trên màn hình: dựng chữ mẫu trên giấy ô li và chấm bài viết của em.
// Chấm theo hình dáng (nét bút phủ kín chữ mẫu, không ra ngoài nhiều), độ cao chữ và vị trí trên dòng kẻ.
// Chưa chấm được thứ tự nét (cần dữ liệu nét chuẩn của từng chữ).
export const CW = 1000;
export const U = 20;
export const ROW = 8 * U;
export const FONT = 'PraiseScript, cursive';
export const PEN = 0.45 * U;

export type Glyph = { text: string; x: number; base: number; w: number; guide: boolean };
export type Sheet = { h: number; fs: number; glyphs: Glyph[]; rows: number[] };
export type Stroke = { pts: [number, number][]; w: number };

let xhCache = 0;
function xHeight(c: CanvasRenderingContext2D) {
  if (!xhCache) {
    c.save(); c.font = `600 100px ${FONT}`;
    const m = c.measureText('x');
    xhCache = m.actualBoundingBoxAscent || 42;
    c.restore();
  }
  return xhCache;
}
export const resetFontCache = () => { xhCache = 0; };

/** Dàn chữ mẫu: chữ ngắn lặp lại hai dòng (dòng 1 tô theo, dòng 2 tự viết); câu dài thì xuống dòng theo từ */
export function buildSheet(c: CanvasRenderingContext2D, text: string, repeat: boolean, margin = 60): Sheet {
  const fs = (100 * 2 * U) / xHeight(c);
  c.save();
  c.font = `600 ${fs}px ${FONT}`;
  const glyphs: Glyph[] = [];
  const rows: number[] = [];
  const maxW = CW - margin * 2;
  if (repeat) {
    const w = c.measureText(text).width;
    const gap = Math.max(U * 2.2, w * 0.45);
    const n = Math.max(1, Math.min(8, Math.floor((maxW + gap) / (w + gap))));
    for (let r = 0; r < 2; r++) {
      const base = ROW * (r + 1);
      rows.push(base);
      for (let i = 0; i < n; i++) glyphs.push({ text, x: margin + i * (w + gap), base, w, guide: r === 0 || i === 0 });
    }
  } else {
    const words = text.split(/\s+/);
    let line = '';
    const lines: string[] = [];
    for (const wd of words) {
      const t = line ? `${line} ${wd}` : wd;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((ln, r) => {
      const base = ROW * (r + 1);
      rows.push(base);
      glyphs.push({ text: ln, x: margin, base, w: c.measureText(ln).width, guide: true });
    });
  }
  c.restore();
  return { h: ROW * rows.length + 4 * U, fs, glyphs, rows };
}

/** Vẽ chữ mẫu nét đứt; mode 'to' = mọi chữ, 'viet' = chỉ chữ đầu mỗi dòng (chữ mẫu) */
export function drawTemplate(c: CanvasRenderingContext2D, sh: Sheet, mode: 'to' | 'viet') {
  c.save();
  c.font = `600 ${sh.fs}px ${FONT}`;
  c.textBaseline = 'alphabetic';
  for (const g of sh.glyphs) {
    const show = mode === 'to' || g.x === Math.min(...sh.glyphs.filter((o) => o.base === g.base).map((o) => o.x));
    if (!show) continue;
    c.fillStyle = 'rgba(37, 99, 235, .10)';
    c.fillText(g.text, g.x, g.base);
    c.setLineDash([5, 5]);
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(37, 99, 235, .55)';
    c.strokeText(g.text, g.x, g.base);
    c.setLineDash([]);
  }
  c.restore();
}

export function drawStrokes(c: CanvasRenderingContext2D, strokes: Stroke[], color: string, widthAdd = 0, scale = 1) {
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = color; c.fillStyle = color;
  for (const s of strokes) {
    const w = (s.w + widthAdd) * scale;
    if (s.pts.length === 1) { c.beginPath(); c.arc(s.pts[0][0] * scale, s.pts[0][1] * scale, w / 2, 0, Math.PI * 2); c.fill(); continue; }
    c.lineWidth = w;
    c.beginPath();
    s.pts.forEach(([x, y], i) => (i ? c.lineTo(x * scale, y * scale) : c.moveTo(x * scale, y * scale)));
    c.stroke();
  }
  c.restore();
}

export type Result = { score: number; stars: number; coverage: number; precision: number; tips: string[]; overlay: HTMLCanvasElement };

function mask(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true })!;
  draw(c);
  return c.getImageData(0, 0, w, h).data;
}

/** Chấm bài: so nét bút với chữ mẫu (ảnh thu nhỏ một nửa cho nhanh) */
export function scoreWriting(sh: Sheet, strokes: Stroke[]): Result {
  const S = 0.5;
  const w = Math.round(CW * S), h = Math.round(sh.h * S);
  const font = `600 ${sh.fs * S}px ${FONT}`;
  const text = (c: CanvasRenderingContext2D, stroke = 0) => {
    c.font = font; c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineJoin = 'round'; c.lineWidth = stroke;
    for (const g of sh.glyphs) { c.fillText(g.text, g.x * S, g.base * S); if (stroke) c.strokeText(g.text, g.x * S, g.base * S); }
  };
  const core = mask(w, h, (c) => text(c));
  const zone = mask(w, h, (c) => text(c, U * 1.1 * S));
  const ink = mask(w, h, (c) => drawStrokes(c, strokes, '#000', 0, S));
  const inkFat = mask(w, h, (c) => drawStrokes(c, strokes, '#000', U * 0.9, S));
  let nCore = 0, nCov = 0, nInk = 0, nIn = 0;
  const ov = document.createElement('canvas'); ov.width = w; ov.height = h;
  const oc = ov.getContext('2d')!;
  const od = oc.createImageData(w, h);
  for (let i = 3; i < core.length; i += 4) {
    const isCore = core[i] > 100, isInk = ink[i] > 100;
    if (isCore) { nCore++; if (inkFat[i] > 100) nCov++; else { od.data[i - 3] = 249; od.data[i - 2] = 115; od.data[i - 1] = 22; od.data[i] = 150; } }
    if (isInk) { nInk++; if (zone[i] > 100) nIn++; else { od.data[i - 3] = 220; od.data[i - 2] = 38; od.data[i - 1] = 38; od.data[i] = 220; } }
  }
  oc.putImageData(od, 0, 0);
  const coverage = nCore ? nCov / nCore : 0;
  const precision = nInk ? nIn / nInk : 0;
  let score = Math.round(100 * (0.55 * coverage + 0.45 * precision));
  const tips: string[] = [];
  if (nInk < 20) { score = 0; tips.push('Em chưa viết gì. Cầm bút viết theo chữ mẫu nhé!'); }
  else {
    if (coverage < 0.65) tips.push('Còn thiếu nét (chỗ tô màu cam): viết đủ các nét theo chữ mẫu.');
    if (precision < 0.75) tips.push('Nét bút ra ngoài chữ mẫu (chỗ màu đỏ): viết chậm lại, nhìn kĩ dòng kẻ.');
    // độ cao và vị trí trên dòng kẻ, từng dòng
    for (const base of sh.rows) {
      const top = base - ROW + U, bot = base + 3 * U;
      const pts = strokes.flatMap((s) => s.pts).filter(([, y]) => y > top && y < bot);
      if (pts.length < 6) continue;
      const ys = pts.map((p) => p[1]).sort((a, b) => a - b);
      const lo = ys[Math.floor(ys.length * 0.95)];
      const hi = ys[Math.floor(ys.length * 0.05)];
      const glyphH = (() => {
        const c = document.createElement('canvas').getContext('2d')!; c.font = `600 ${sh.fs}px ${FONT}`;
        const g = sh.glyphs.find((x) => x.base === base)!; const m = c.measureText(g.text);
        return m.actualBoundingBoxAscent + Math.min(m.actualBoundingBoxDescent, U * 3);
      })();
      const ratio = (lo - hi) / Math.max(1, glyphH);
      if (ratio > 1.3 && !tips.some((t) => t.includes('cao'))) tips.push('Chữ hơi cao, to hơn mẫu: viết nhỏ lại cho vừa ô li.');
      if (ratio < 0.7 && !tips.some((t) => t.includes('nhỏ'))) tips.push('Chữ hơi nhỏ: viết cao bằng chữ mẫu (chữ thường cao 2 li).');
    }
  }
  if (score >= 75 && !tips.length) tips.push('Nét chữ đều, đúng mẫu. Giỏi lắm!');
  const stars = score >= 80 ? 3 : score >= 60 ? 2 : score >= 35 ? 1 : 0;
  return { score, stars, coverage, precision, tips, overlay: ov };
}
