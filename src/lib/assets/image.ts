// Chuẩn hoá ảnh tải lên ngay trên trình duyệt (không gửi ảnh gốc lên máy chủ):
//  - hoa văn góc vở: xoá nền trắng (tuỳ chọn), cắt bỏ viền trống, thu vào khung vuông 800 px, canh vào góc hoặc giữa;
//  - tranh trong cảnh 3D: thu cạnh dài về tối đa 1024 px.
// Nhận PNG, JPG, WebP, GIF (khung đầu), SVG (vẽ ra ảnh — không giữ mã bên trong SVG).

export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg';
export const MAX_IMAGE_INPUT = 15 * 1024 * 1024;

export async function readImage(file: File): Promise<HTMLImageElement> {
  if (file.size > MAX_IMAGE_INPUT) throw new Error('Ảnh quá lớn (tối đa 15 MB).');
  if (!/^image\//.test(file.type) && !/\.svg$/i.test(file.name)) throw new Error('Chỉ nhận ảnh PNG, JPG, WebP, GIF hoặc SVG.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    // SVG không ghi kích thước: vẽ ở 1000 px
    if (!img.naturalWidth || !img.naturalHeight) { img.width = 1000; img.height = 1000; }
    return img;
  } catch {
    throw new Error('Không đọc được ảnh này (file hỏng hoặc định dạng lạ).');
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function canvasOf(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

/** Xuất WebP (trình duyệt cũ không có WebP thì PNG / JPEG) */
export function toBlob(c: HTMLCanvasElement, q = 0.9, opaque = false): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => {
    if (b && b.type === 'image/webp') return res(b);
    c.toBlob((b2) => (b2 ? res(b2) : rej(new Error('Không nén được ảnh.'))), opaque ? 'image/jpeg' : 'image/png', q);
  }, 'image/webp', q));
}

export type DecoOptions = { removeWhite: boolean; align: 'corner' | 'center'; size?: number };

/** Hoa văn góc vở: trả về ảnh vuông nền trong suốt + tỉ lệ phần hình */
export async function prepareDeco(file: File, o: DecoOptions): Promise<{ blob: Blob; w: number; h: number; fill: number }> {
  const img = await readImage(file);
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min(1, 1600 / Math.max(iw, ih));
  const c = canvasOf(iw * k, ih * k);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height);
  const px = d.data;
  // xoá nền trắng: trắng hẳn thì trong suốt, gần trắng thì mờ dần (viền mịn)
  if (o.removeWhite) {
    for (let i = 0; i < px.length; i += 4) {
      const m = Math.min(px[i], px[i + 1], px[i + 2]);
      if (m >= 245) px[i + 3] = 0;
      else if (m >= 215) px[i + 3] = Math.round(px[i + 3] * ((245 - m) / 30));
    }
    g.putImageData(d, 0, 0);
  }
  // cắt viền trống
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    if (px[(y * c.width + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) throw new Error(o.removeWhite ? 'Ảnh toàn màu trắng — bỏ chọn “Xoá nền trắng” rồi thử lại.' : 'Ảnh trống.');
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const S = o.size ?? 800;
  const s = S / Math.max(cw, ch);
  const out = canvasOf(S, S);
  const og = out.getContext('2d')!;
  og.imageSmoothingQuality = 'high';
  const dw = cw * s, dh = ch * s;
  const dx = o.align === 'corner' ? 0 : (S - dw) / 2, dy = o.align === 'corner' ? 0 : (S - dh) / 2;
  og.drawImage(c, x0, y0, cw, ch, dx, dy, dw, dh);
  return { blob: await toBlob(out, 0.9), w: S, h: S, fill: Math.max(dw, dh) / S };
}

/** Tranh đứng trong cảnh 3D: thu cạnh dài về 1024 px, giữ tỉ lệ */
export async function prepareBoard(file: File): Promise<{ blob: Blob; thumb: Blob; w: number; h: number }> {
  const img = await readImage(file);
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min(1, 1024 / Math.max(iw, ih));
  const c = canvasOf(iw * k, ih * k);
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); // ảnh trong suốt: nền trắng như tờ tranh
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, c.width, c.height);
  const t = canvasOf(128, 128); const tg = t.getContext('2d')!;
  const ts = 128 / Math.max(c.width, c.height);
  tg.drawImage(c, (128 - c.width * ts) / 2, (128 - c.height * ts) / 2, c.width * ts, c.height * ts);
  return { blob: await toBlob(c, 0.86, true), thumb: await toBlob(t, 0.8), w: c.width, h: c.height };
}

export const baseName = (f: File) => f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 60) || 'Ảnh của tôi';
