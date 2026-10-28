// Chụp tác phẩm bằng điện thoại → tự tìm mép tờ giấy, làm phẳng (nắn phối cảnh), chỉnh sáng, làm trắng giấy.
// Chạy hoàn toàn trên trình duyệt, không gửi ảnh gốc đi đâu.
export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt]; // trên-trái, trên-phải, dưới-phải, dưới-trái
export type Enhance = 'none' | 'auto' | 'paper';

const MAX_IN = 2200;
const MAX_OUT = 1600;

/** Đọc ảnh (đã xoay đúng chiều theo EXIF), thu về cạnh dài tối đa 2200px */
export async function loadPhoto(file: Blob): Promise<HTMLCanvasElement> {
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { bmp = await createImageBitmap(file); }
  const k = Math.min(1, MAX_IN / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

export function rotate90(src: HTMLCanvasElement, dir: 1 | -1): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.height; c.height = src.width;
  const x = c.getContext('2d')!;
  x.translate(c.width / 2, c.height / 2);
  x.rotate((dir * Math.PI) / 2);
  x.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

export const fullQuad = (w: number, h: number): Quad => [[0, 0], [w, 0], [w, h], [0, h]];

/** Tìm tờ giấy: vùng sáng liền khối lớn nhất (ngưỡng Otsu), lấy 4 góc ngoài cùng. Không tìm được thì trả cả ảnh. */
export function detectPaper(src: HTMLCanvasElement): Quad {
  const k = 256 / Math.max(src.width, src.height);
  const w = Math.max(8, Math.round(src.width * k)), h = Math.max(8, Math.round(src.height * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(src, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const g = new Uint8Array(w * h);
  const hist = new Array(256).fill(0);
  for (let i = 0; i < w * h; i++) { const v = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) | 0; g[i] = v; hist[v]++; }
  // ngưỡng Otsu
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue;
    const wF = w * h - wB; if (!wF) break;
    sB += t * hist[t];
    const mB = sB / wB, mF = (sum - sB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  // vùng sáng liền khối lớn nhất
  const lab = new Int32Array(w * h).fill(-1);
  let bestN = 0, bestId = -1;
  const stack: number[] = [];
  let id = 0;
  for (let i = 0; i < w * h; i++) {
    if (g[i] <= thr || lab[i] !== -1) continue;
    let n = 0; stack.push(i); lab[i] = id;
    while (stack.length) {
      const p = stack.pop()!; n++;
      const px = p % w, py = (p / w) | 0;
      const nb = [px > 0 ? p - 1 : -1, px < w - 1 ? p + 1 : -1, py > 0 ? p - w : -1, py < h - 1 ? p + w : -1];
      for (const q of nb) if (q >= 0 && lab[q] === -1 && g[q] > thr) { lab[q] = id; stack.push(q); }
    }
    if (n > bestN) { bestN = n; bestId = id; }
    id++;
  }
  if (bestId < 0 || bestN < w * h * 0.12 || bestN > w * h * 0.985) return fullQuad(src.width, src.height);
  let tl: Pt = [0, 0], tr: Pt = [0, 0], br: Pt = [0, 0], bl: Pt = [0, 0];
  let a = Infinity, b = -Infinity, cc = -Infinity, dd = Infinity;
  for (let i = 0; i < w * h; i++) {
    if (lab[i] !== bestId) continue;
    const px = i % w, py = (i / w) | 0;
    if (px + py < a) { a = px + py; tl = [px, py]; }
    if (px - py > b) { b = px - py; tr = [px, py]; }
    if (px + py > cc) { cc = px + py; br = [px, py]; }
    if (px - py < dd) { dd = px - py; bl = [px, py]; }
  }
  const s = (p: Pt): Pt => [Math.min(src.width, Math.max(0, (p[0] + 0.5) / k)), Math.min(src.height, Math.max(0, (p[1] + 0.5) / k))];
  const q: Quad = [s(tl), s(tr), s(br), s(bl)];
  // tứ giác quá méo / quá nhỏ thì không tin
  const area = Math.abs(polyArea(q));
  if (area < src.width * src.height * 0.1) return fullQuad(src.width, src.height);
  return q;
}
function polyArea(q: Quad) {
  let s = 0;
  for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; s += x1 * y2 - x2 * y1; }
  return s / 2;
}

/** Ma trận nắn phối cảnh: điểm (u,v) của ảnh đích → điểm trong ảnh gốc */
function homography(dst: Quad, src: Quad): number[] {
  // giải hệ 8 ẩn bằng khử Gauss
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = dst[i], [X, Y] = src[i];
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y, X]);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y, Y]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const v = A[c][c] || 1e-12;
    for (let k = c; k < 9; k++) A[c][k] /= v;
    for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c]; for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]; }
  }
  return [...A.map((r) => r[8]), 1];
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Nắn tờ giấy về hình chữ nhật (cạnh dài tối đa 1600px) */
export function warp(src: HTMLCanvasElement, q: Quad): HTMLCanvasElement {
  let ow = Math.max(dist(q[0], q[1]), dist(q[3], q[2]));
  let oh = Math.max(dist(q[0], q[3]), dist(q[1], q[2]));
  const k = Math.min(1, MAX_OUT / Math.max(ow, oh));
  ow = Math.max(16, Math.round(ow * k)); oh = Math.max(16, Math.round(oh * k));
  const out = document.createElement('canvas'); out.width = ow; out.height = oh;
  const oc = out.getContext('2d')!;
  const isFull = q[0][0] === 0 && q[0][1] === 0 && q[2][0] === src.width && q[2][1] === src.height && q[1][1] === 0 && q[3][0] === 0;
  if (isFull) { oc.drawImage(src, 0, 0, ow, oh); return out; }
  const sd = src.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, src.width, src.height).data;
  const sw = src.width, shh = src.height;
  const H = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], q);
  const img = oc.createImageData(ow, oh);
  const o = img.data;
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const zz = H[6] * x + H[7] * y + H[8];
      const X = (H[0] * x + H[1] * y + H[2]) / zz, Y = (H[3] * x + H[4] * y + H[5]) / zz;
      const x0 = Math.max(0, Math.min(sw - 2, X | 0)), y0 = Math.max(0, Math.min(shh - 2, Y | 0));
      const fx = Math.min(1, Math.max(0, X - x0)), fy = Math.min(1, Math.max(0, Y - y0));
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const j = (y * ow + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        o[j + ch] = (sd[i00 + ch] * (1 - fx) + sd[i10 + ch] * fx) * (1 - fy) + (sd[i01 + ch] * (1 - fx) + sd[i11 + ch] * fx) * fy;
      }
      o[j + 3] = 255;
    }
  }
  oc.putImageData(img, 0, 0);
  return out;
}

/** Chỉnh màu: 'auto' kéo giãn độ sáng (1%–99%) + tăng màu nhẹ; 'paper' làm trắng nền giấy, giữ nét (hợp bài viết, tranh chì) */
export function enhance(src: HTMLCanvasElement, mode: Enhance): HTMLCanvasElement {
  if (mode === 'none') return src;
  const w = src.width, h = src.height;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const oc = out.getContext('2d', { willReadFrequently: true })!;
  oc.drawImage(src, 0, 0);
  const img = oc.getImageData(0, 0, w, h);
  const d = img.data;
  if (mode === 'paper') {
    // nền giấy ước lượng bằng ảnh rất nhỏ được làm mờ, rồi chia từng điểm cho nền
    const bw = Math.max(4, Math.round(w / 24)), bh = Math.max(4, Math.round(h / 24));
    const b = document.createElement('canvas'); b.width = bw; b.height = bh;
    const bc = b.getContext('2d', { willReadFrequently: true })!;
    bc.filter = 'blur(2px)';
    // lấy giá trị sáng (nền) thay vì trung bình để nét đậm không làm tối nền
    const small = document.createElement('canvas'); small.width = bw * 4; small.height = bh * 4;
    const sc = small.getContext('2d', { willReadFrequently: true })!;
    sc.drawImage(src, 0, 0, small.width, small.height);
    const sd = sc.getImageData(0, 0, small.width, small.height).data;
    const bi = bc.createImageData(bw, bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      for (let ch = 0; ch < 3; ch++) {
        let mx = 0;
        for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) mx = Math.max(mx, sd[(((y * 4 + yy) * small.width) + x * 4 + xx) * 4 + ch]);
        bi.data[(y * bw + x) * 4 + ch] = mx;
      }
      bi.data[(y * bw + x) * 4 + 3] = 255;
    }
    const raw = document.createElement('canvas'); raw.width = bw; raw.height = bh;
    raw.getContext('2d')!.putImageData(bi, 0, 0);
    bc.drawImage(raw, 0, 0);
    const big = document.createElement('canvas'); big.width = w; big.height = h;
    const gc = big.getContext('2d', { willReadFrequently: true })!;
    gc.imageSmoothingQuality = 'high';
    gc.drawImage(b, 0, 0, w, h);
    const bg = gc.getImageData(0, 0, w, h).data;
    for (let i = 0; i < d.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const v = (d[i + ch] / Math.max(40, bg[i + ch])) * 255;
        d[i + ch] = Math.min(255, v < 235 ? v * 0.96 : 255);
      }
    }
  } else {
    const hist = [new Array(256).fill(0), new Array(256).fill(0), new Array(256).fill(0)];
    for (let i = 0; i < d.length; i += 16) for (let ch = 0; ch < 3; ch++) hist[ch][d[i + ch]]++;
    const n = d.length / 16;
    const lo = hist.map((hh) => { let s = 0; for (let v = 0; v < 256; v++) { s += hh[v]; if (s > n * 0.01) return v; } return 0; });
    const hi = hist.map((hh) => { let s = 0; for (let v = 255; v >= 0; v--) { s += hh[v]; if (s > n * 0.01) return v; } return 255; });
    for (let i = 0; i < d.length; i += 4) {
      const r = (d[i] - lo[0]) * 255 / Math.max(30, hi[0] - lo[0]);
      const g = (d[i + 1] - lo[1]) * 255 / Math.max(30, hi[1] - lo[1]);
      const bb = (d[i + 2] - lo[2]) * 255 / Math.max(30, hi[2] - lo[2]);
      const m = (r + g + bb) / 3;
      d[i] = Math.max(0, Math.min(255, m + (r - m) * 1.15));
      d[i + 1] = Math.max(0, Math.min(255, m + (g - m) * 1.15));
      d[i + 2] = Math.max(0, Math.min(255, m + (bb - m) * 1.15));
    }
  }
  oc.putImageData(img, 0, 0);
  return out;
}
