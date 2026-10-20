// Vẽ thư khen lên canvas ngay trên trình duyệt (không gửi dữ liệu đi đâu, không dùng thư viện ngoài).
// Cùng một hàm vẽ cho: ảnh xem trước, ảnh PNG, trang PDF và bản in.
import { LETTER_H, LETTER_W, type PraiseTemplate } from './templates';

export type LetterData = {
  school: string;
  lead: string;
  name: string;
  className: string;
  extra: string;
  reason: string;
  wish: string;
  /** dòng nơi, ngày đã ghép sẵn */
  placeDate: string;
  role: string;
  teacher: string;
  /** ảnh chữ ký (tùy chọn) — chỉ nằm trên máy giáo viên */
  signature?: HTMLImageElement | null;
};

const F = { baloo: 'PraiseBaloo', oswald: 'PraiseOswald', script: 'PraiseScript' };
/** Tên phông dùng khi vẽ (có phông dự phòng nếu chưa tải được) */
const FF = { baloo: 'PraiseBaloo, sans-serif', oswald: 'PraiseOswald, sans-serif', script: 'PraiseScript, cursive' };
const RANGE_LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const RANGE_VI = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
const FONT_FILES: [family: string, file: string, weight: string][] = [
  [F.baloo, 'baloo-2', '600'], [F.baloo, 'baloo-2', '700'], [F.baloo, 'baloo-2', '800'],
  [F.oswald, 'oswald', '500'], [F.oswald, 'oswald', '600'],
  [F.script, 'dancing-script', '600'],
];

let fontsReady: Promise<void> | null = null;
/** Tải phông của thư khen (một lần). Lỗi tải phông thì vẫn vẽ bằng phông dự phòng. */
export function loadPraiseFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = Promise.all(
      FONT_FILES.flatMap(([family, file, weight]) =>
        (['latin', 'vietnamese'] as const).map(async (sub) => {
          const face = new FontFace(family, `url(/fonts/praise/${file}-${sub}-${weight}-normal.woff2) format('woff2')`, {
            weight, unicodeRange: sub === 'latin' ? RANGE_LATIN : RANGE_VI,
          });
          await face.load();
          document.fonts.add(face);
        }),
      ),
    ).then(() => undefined, () => undefined);
  }
  return fontsReady;
}

const images = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = images.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => { images.delete(src); reject(new Error(`Không tải được ảnh ${src}`)); };
      im.src = src;
    });
    images.set(src, p);
  }
  return p;
}
const artSrc = (t: PraiseTemplate) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(t.art())}`;

/** Tải sẵn hình nền + sticker của một mẫu */
export async function loadTemplateAssets(t: PraiseTemplate) {
  const [art, ...stickers] = await Promise.all([loadImage(artSrc(t)), ...t.stickers.map((s) => loadImage(`/stickers/${s.id}.webp`))]);
  return { art, stickers };
}

const upper = (s: string) => s.toLocaleUpperCase('vi-VN');

/** Ngắt dòng theo chiều rộng; giữ các dòng người dùng tự xuống */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (line && ctx.measureText(next).width > maxW) { out.push(line); line = w; } else line = next;
    }
    if (line) out.push(line);
  }
  return out;
}

const CONTENT_BOTTOM = 748;

type Ctx = CanvasRenderingContext2D;
function ringText(ctx: Ctx, text: string, x: number, y: number, fill: string, ring: string, width: number) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.strokeStyle = ring;
  ctx.lineWidth = width;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/** Phần chữ chính; trả về mép dưới. dry = chỉ đo, không vẽ */
function drawBody(ctx: Ctx, t: PraiseTemplate, d: LetterData, s: number, dry: boolean): number {
  const x0 = 70;
  const x1 = LETTER_W - t.right - 70;
  const cx = (x0 + x1) / 2;
  const maxW = x1 - x0;
  const hasSchool = t.school && d.school.trim().length > 0;
  let y = t.top - (hasSchool ? 60 : 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = (font: string, text: string, size: number, lh: number, color: string, transform = false) => {
    ctx.font = font;
    const ls = wrapLines(ctx, transform ? upper(text) : text, maxW);
    for (const l of ls) {
      if (!dry) { ctx.fillStyle = color; ctx.fillText(l, cx, y + (size * lh) / 2); }
      y += size * lh;
    }
  };

  if (hasSchool) lines(`600 ${46 * s}px ${FF.oswald}`, d.school, 46 * s, 1.26, t.ink, true);

  const ts = t.title.size * s;
  ctx.font = `800 ${ts}px ${FF.baloo}`;
  if (!dry) ringText(ctx, 'THƯ KHEN', cx, y + ts * 0.55, t.title.fill, t.title.ring, 18 * s);
  y += ts * 1.04;

  y += 12 * s;
  if (d.lead.trim()) lines(`500 ${46 * s}px ${FF.oswald}`, d.lead, 46 * s, 1.24, t.ink, true);

  y += 14 * s;
  if (!dry) {
    ctx.save();
    ctx.strokeStyle = '#f5b04a';
    ctx.lineWidth = 7 * s;
    ctx.setLineDash([22 * s, 10 * s]);
    const half = Math.min(310 * s, maxW * 0.36);
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.restore();
  }
  y += 14 * s;

  // Tên + lớp: một dòng, tự thu nhỏ khi tên dài
  const nameText = `${upper(d.name.trim())}${d.className ? ` – ${upper(d.className)}` : ''}`;
  let ns = 84 * s;
  ctx.font = `800 ${ns}px ${FF.baloo}`;
  while (ctx.measureText(nameText).width > maxW - 10 && ns > 38 * s) {
    ns -= 2 * s;
    ctx.font = `800 ${ns}px ${FF.baloo}`;
  }
  if (!dry) ringText(ctx, nameText, cx, y + ns * 0.66, t.name.fill, t.name.ring, 10 * s);
  y += ns * 1.28;

  if (d.extra.trim()) lines(`700 ${44 * s}px ${FF.baloo}`, d.extra, 44 * s, 1.18, t.ink);
  if (d.reason.trim()) { y += 4 * s; lines(`500 ${44 * s}px ${FF.oswald}`, d.reason, 44 * s, 1.2, t.ink, true); }
  if (d.wish.trim()) { y += 12 * s; lines(`600 ${35 * s}px ${FF.baloo}`, d.wish, 35 * s, 1.32, t.wish); }
  return y;
}

/** Thu nhỏ một dòng chữ cho vừa chiều rộng */
function fitFont(ctx: Ctx, text: string, weight: string, family: string, size: number, maxW: number) {
  let fs = size;
  ctx.font = `${weight} ${fs}px ${family}`;
  while (ctx.measureText(text).width > maxW && fs > 16) { fs -= 1; ctx.font = `${weight} ${fs}px ${family}`; }
  return fs;
}

/** Vẽ trọn một thư lên ctx (hệ tọa độ 1414 × 1000; gọi ctx.scale trước nếu cần ảnh lớn hơn) */
export function drawLetter(ctx: Ctx, t: PraiseTemplate, assets: { art: HTMLImageElement; stickers: HTMLImageElement[] }, d: LetterData) {
  ctx.save();
  ctx.clearRect(0, 0, LETTER_W, LETTER_H);
  ctx.drawImage(assets.art, 0, 0, LETTER_W, LETTER_H);
  t.stickers.forEach((st, i) => {
    const im = assets.stickers[i];
    if (!im) return;
    const h = (st.w * im.naturalHeight) / im.naturalWidth;
    ctx.save();
    ctx.translate(st.x + st.w / 2, st.y + h / 2);
    if (st.rot) ctx.rotate((st.rot * Math.PI) / 180);
    ctx.shadowColor = 'rgba(0,0,0,.14)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(im, -st.w / 2, -h / 2, st.w, h);
    ctx.restore();
  });

  // Chữ dài thì thu cả khối cho vừa trước phần ký tên
  let s = 1;
  while (s > 0.62 && drawBody(ctx, t, d, s, true) > CONTENT_BOTTOM) s -= 0.03;
  drawBody(ctx, t, d, s, false);

  // Khối ký tên
  const sx = t.signX;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.ink;
  if (d.placeDate.trim()) {
    fitFont(ctx, d.placeDate, '700', FF.baloo, 31, 560);
    ctx.fillText(d.placeDate, sx, 790);
  }
  if (d.role.trim()) {
    fitFont(ctx, upper(d.role), '800', FF.baloo, 31, 600);
    ctx.fillText(upper(d.role), sx, 829);
  }
  if (d.signature) {
    const im = d.signature;
    const k = Math.min(280 / im.naturalWidth, 80 / im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    ctx.drawImage(im, sx - w / 2, 884 - h / 2, w, h);
    if (d.teacher.trim()) {
      fitFont(ctx, d.teacher, '700', FF.baloo, 30, 560);
      ctx.fillText(d.teacher, sx, 930);
    }
  } else if (d.teacher.trim()) {
    fitFont(ctx, d.teacher, '600', FF.script, 52, 520);
    ctx.fillText(d.teacher, sx, 908);
  }
  ctx.restore();
}

/** Tạo canvas chứa một thư với hệ số phóng (1 = 1414 × 1000 px) */
export function renderLetterCanvas(t: PraiseTemplate, assets: { art: HTMLImageElement; stickers: HTMLImageElement[] }, d: LetterData, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(LETTER_W * scale);
  c.height = Math.round(LETTER_H * scale);
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ vẽ ảnh (canvas).');
  ctx.scale(scale, scale);
  drawLetter(ctx, t, assets, d);
  return c;
}

export function canvasBlob(c: HTMLCanvasElement, type: 'image/png' | 'image/jpeg', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh.'))), type, quality));
}
