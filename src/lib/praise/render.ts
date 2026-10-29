// Vẽ thư khen lên canvas ngay trên trình duyệt (không gửi dữ liệu đi đâu, không dùng thư viện ngoài).
// Cùng một hàm vẽ cho: ảnh xem trước, ảnh PNG, trang PDF và bản in.
import { LETTER_H, LETTER_W, type PraiseTemplate } from './templates';
import { drawPhoto, slotBox, type LetterPhoto } from './photos';
import { EMOJIS, adjOf, fillVars, type BlockAdj, type BlockKey, type DesignItem, type PraiseDesign } from './design';

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
  /** lời kết phía trên chữ ký (mẫu trang trọng), vd "Yêu thương và trân trọng" */
  closing: string;
  /** ảnh chữ ký (tùy chọn) — chỉ nằm trên máy giáo viên */
  signature?: HTMLImageElement | null;
  /** ảnh học sinh trong khung (tùy chọn) — chỉ nằm trên máy giáo viên */
  photo?: LetterPhoto | null;
};

const F = { baloo: 'PraiseBaloo', oswald: 'PraiseOswald', script: 'PraiseScript' };
/** Tên phông dùng khi vẽ (có phông dự phòng nếu chưa tải được) */
export const FF = { baloo: 'PraiseBaloo, sans-serif', oswald: 'PraiseOswald, sans-serif', script: 'PraiseScript, cursive' };
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

export type LetterAssets = { art: HTMLImageElement; stickers: HTMLImageElement[]; items?: Map<string, HTMLImageElement> };

/** Bản nét cao (đã phóng to bằng AI, gấp đôi) của hình nền, sticker, biểu tượng — chỉ dùng khi xuất PDF / ảnh / in */
const HD_EMOJI = new Set(EMOJIS);
export function hdSrc(src: string): string | null {
  let m = /^\/praise\/([\w-]+)\.webp$/.exec(src);
  if (m) return `/praise/hd/${m[1]}.webp`;
  m = /^\/stickers\/([\w-]+)\.webp$/.exec(src);
  if (m) return `/stickers/hd/${m[1]}.webp`;
  m = /^\/emoji\/([\w-]+)\.png$/.exec(src);
  if (m && HD_EMOJI.has(m[1])) return `/emoji/hd/${m[1]}.webp`;
  return null;
}
/** hd: thử bản nét cao trước, lỗi thì dùng bản thường */
const loadBest = (src: string, hd: boolean) => {
  const h = hd ? hdSrc(src) : null;
  return h ? loadImage(h).catch(() => loadImage(src)) : loadImage(src);
};

/** Tải sẵn hình nền + sticker của một mẫu, và ảnh trong thiết kế tuỳ chỉnh (nếu có). hd = true khi xuất file / in */
export async function loadTemplateAssets(t: PraiseTemplate, design?: PraiseDesign | null, hd = false): Promise<LetterAssets> {
  const [art, ...stickers] = await Promise.all([t.bg ? loadBest(t.bg, hd) : loadImage(artSrc(t)), ...t.stickers.map((s) => loadBest(`/stickers/${s.id}.webp`, hd))]);
  return { art, stickers, items: await loadItemImages(design, hd) };
}
export async function loadItemImages(design?: PraiseDesign | null, hd = false) {
  const items = new Map<string, HTMLImageElement>();
  const srcs = [...new Set((design?.items ?? []).filter((i) => i.kind === 'image').map((i) => (i as { src: string }).src))];
  await Promise.all(srcs.map(async (src) => { try { items.set(src, await loadBest(src, hd)); } catch { /* ảnh lỗi: bỏ qua */ } }));
  return items;
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

type Part = 'all' | 'title' | 'rest';
/** vị trí khối tiêu đề của lần vẽ gần nhất (để dời / phóng to riêng) */
const LAY = { titleTop: 0, titleBottom: 0 };

/** Phần chữ chính; trả về mép dưới. dry = chỉ đo, không vẽ; part = chỉ vẽ tiêu đề hoặc phần còn lại */
function drawBody(ctx: Ctx, t: PraiseTemplate, d: LetterData, s: number, dry: boolean, part: Part = 'all'): number {
  const rest = !dry && part !== 'title', ttl = !dry && part !== 'rest';
  const [x0, x1] = t.area ?? [t.side, LETTER_W - t.side];
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
      if (rest) { ctx.fillStyle = color; ctx.fillText(l, cx, y + (size * lh) / 2); }
      y += size * lh;
    }
  };

  if (hasSchool) lines(`600 ${46 * s}px ${FF.oswald}`, d.school, 46 * s, 1.26, t.ink, true);

  const ts = t.title.size * s;
  ctx.font = `800 ${ts}px ${FF.baloo}`;
  LAY.titleTop = y;
  if (ttl) ringText(ctx, 'THƯ KHEN', cx, y + ts * 0.55, t.title.fill, t.title.ring, 18 * s);
  y += ts * 1.04 + (t.gap ?? 0) * s;
  LAY.titleBottom = y;

  y += 12 * s;
  if (d.lead.trim()) lines(`500 ${46 * s}px ${FF.oswald}`, d.lead, 46 * s, 1.24, t.ink, true);

  y += 14 * s;
  if (rest) {
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
  if (rest) ringText(ctx, nameText, cx, y + ns * 0.66, t.name.fill, t.name.ring, 10 * s);
  y += ns * 1.28;

  if (d.extra.trim()) lines(`700 ${44 * s}px ${FF.baloo}`, d.extra, 44 * s, 1.18, t.ink);
  if (d.reason.trim()) { y += 4 * s; lines(`500 ${44 * s}px ${FF.oswald}`, d.reason, 44 * s, 1.2, t.ink, true); }
  if (d.wish.trim()) { y += 12 * s; lines(`600 ${35 * s}px ${FF.baloo}`, d.wish, 35 * s, 1.32, t.wish); }
  return y;
}

const FORMAL_BOTTOM = 772;

/** Kiểu trang trọng: mọi dòng căn giữa trang, tên viết tay có gạch chân */
function drawFormalBody(ctx: Ctx, t: PraiseTemplate, d: LetterData, s: number, dry: boolean, part: Part = 'all'): number {
  const rest = !dry && part !== 'title', ttl = !dry && part !== 'rest';
  const cx = LETTER_W / 2;
  const maxW = LETTER_W - 2 * t.side;
  let y = t.top;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = (font: string, text: string, size: number, lh: number, color: string, transform = false) => {
    ctx.font = font;
    for (const l of wrapLines(ctx, transform ? upper(text) : text, maxW)) {
      if (rest) { ctx.fillStyle = color; ctx.fillText(l, cx, y + (size * lh) / 2); }
      y += size * lh;
    }
  };

  const ts = t.title.size * s;
  ctx.font = `800 ${ts}px ${FF.baloo}`;
  LAY.titleTop = y;
  if (ttl) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.12)';
    ctx.shadowOffsetY = 4 * s;
    ctx.fillStyle = t.title.fill;
    ctx.fillText('THƯ KHEN', cx, y + ts * 0.56);
    ctx.restore();
  }
  y += ts * 1.02;

  // đường kẻ hoa văn: hai nét thanh + hình thoi ở giữa
  y += 10 * s;
  if (ttl) {
    ctx.save();
    ctx.strokeStyle = t.accent;
    ctx.fillStyle = t.accent;
    ctx.lineWidth = 3 * s;
    const half = 230 * s, gap = 22 * s;
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - gap, y); ctx.moveTo(cx + gap, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, y - 9 * s); ctx.lineTo(cx + 12 * s, y); ctx.lineTo(cx, y + 9 * s); ctx.lineTo(cx - 12 * s, y); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  y += 18 * s;
  LAY.titleBottom = y;

  if (t.school && d.school.trim()) lines(`600 ${46 * s}px ${FF.script}`, d.school.trim(), 46 * s, 1.3, t.ink);
  if (d.lead.trim()) { y += 4 * s; lines(`500 ${32 * s}px ${FF.oswald}`, d.lead, 32 * s, 1.35, t.ink, true); }

  // Tên học sinh: chữ viết tay, tự thu nhỏ cho vừa một dòng, gạch chân
  const name = d.name.trim();
  let ns = 104 * s;
  ctx.font = `600 ${ns}px ${FF.script}`;
  while (ctx.measureText(name).width > maxW - 40 && ns > 44 * s) { ns -= 2 * s; ctx.font = `600 ${ns}px ${FF.script}`; }
  const nw = ctx.measureText(name).width;
  if (rest) { ctx.fillStyle = t.name.fill; ctx.fillText(name, cx, y + ns * 0.62); }
  y += ns * 1.18;
  if (rest) {
    ctx.save();
    ctx.strokeStyle = t.name.fill;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2.5 * s;
    const half = Math.min(maxW / 2, nw / 2 + 50 * s);
    ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y); ctx.stroke();
    ctx.restore();
  }
  y += 16 * s;

  if (d.extra.trim()) lines(`700 ${38 * s}px ${FF.baloo}`, d.extra, 38 * s, 1.22, t.ink);
  if (d.reason.trim()) lines(`600 ${37 * s}px ${FF.baloo}`, d.reason, 37 * s, 1.28, t.ink);
  if (d.wish.trim()) { y += 6 * s; lines(`600 ${39 * s}px ${FF.script}`, d.wish, 39 * s, 1.3, t.wish); }
  return y;
}

/** Hàng dưới kiểu trang trọng: trái "Lớp …, nơi – ngày"; phải lời kết + người ký */
function drawFormalFooter(ctx: Ctx, t: PraiseTemplate, d: LetterData) {
  const [lx, rx] = t.cols ?? [320, 1094];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.ink;
  let ly = 812;
  if (d.className.trim()) {
    fitFont(ctx, `Lớp ${d.className}`, '800', FF.baloo, 38, 380);
    ctx.fillText(`Lớp ${d.className}`, lx, ly);
    ly += 48;
  }
  const pd = d.placeDate.trim();
  if (pd) {
    const cut = pd.indexOf(', ');
    const parts = cut > 0 ? [pd.slice(0, cut + 1), pd.slice(cut + 2)] : [pd];
    for (const part of parts) {
      fitFont(ctx, part, '600', FF.baloo, 28, 400);
      ctx.fillText(part, lx, ly);
      ly += 36;
    }
  }
  let ry = 812;
  if (d.closing.trim()) {
    fitFont(ctx, upper(d.closing), '800', FF.baloo, 30, 480);
    ctx.fillText(upper(d.closing), rx, ry);
    ry += 44;
  }
  const who = [d.role.trim(), d.teacher.trim()].filter(Boolean).join(': ');
  if (d.signature) {
    const im = d.signature;
    const k = Math.min(260 / im.naturalWidth, 70 / im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    ctx.drawImage(im, rx - w / 2, ry + 4, w, h);
    ry += h + 26;
    if (who) { fitFont(ctx, who, '700', FF.baloo, 28, 460); ctx.fillText(who, rx, ry); }
  } else if (who) {
    fitFont(ctx, who, '600', FF.script, 46, 460);
    ctx.fillText(who, rx, ry + 12);
  }
}

/** Thu nhỏ một dòng chữ cho vừa chiều rộng */
function fitFont(ctx: Ctx, text: string, weight: string, family: string, size: number, maxW: number) {
  let fs = size;
  ctx.font = `${weight} ${fs}px ${family}`;
  while (ctx.measureText(text).width > maxW && fs > 16) { fs -= 1; ctx.font = `${weight} ${fs}px ${family}`; }
  return fs;
}

/** Mẫu sau khi áp màu chữ tuỳ chỉnh */
function withColors(t: PraiseTemplate, design?: PraiseDesign | null): PraiseTemplate {
  const c = design?.colors;
  if (!c) return t;
  return {
    ...t,
    ink: c.ink ?? t.ink,
    wish: c.wish ?? t.wish,
    title: { ...t.title, fill: c.title ?? t.title.fill, ring: c.titleRing ?? t.title.ring },
    name: { ...t.name, fill: c.name ?? t.name.fill },
  };
}

/** Khung (trước khi dời) của 3 khối có sẵn, kèm tâm để phóng to quanh tâm */
type Box = { x: number; y: number; w: number; h: number };
function baseBoxes(ctx: Ctx, t: PraiseTemplate, d: LetterData): { s: number; title: Box; body: Box; sign: Box } {
  if (t.layout === 'formal') {
    let s = 1;
    while (s > 0.6 && drawFormalBody(ctx, t, d, s, true) > FORMAL_BOTTOM) s -= 0.03;
    const end = drawFormalBody(ctx, t, d, s, true);
    const ts = t.title.size * s;
    ctx.font = `800 ${ts}px ${FF.baloo}`;
    const tw = Math.max(ctx.measureText('THƯ KHEN').width, 460 * s) + 30;
    const [lx, rx] = t.cols ?? [320, 1094];
    return {
      s,
      title: { x: LETTER_W / 2 - tw / 2, y: LAY.titleTop, w: tw, h: LAY.titleBottom - LAY.titleTop },
      body: { x: t.side, y: LAY.titleBottom, w: LETTER_W - 2 * t.side, h: Math.max(40, end - LAY.titleBottom) },
      sign: { x: lx - 220, y: 784, w: rx - lx + 440, h: 176 },
    };
  }
  let s = 1;
  const bottom = t.bottom ?? CONTENT_BOTTOM;
  while (s > 0.5 && drawBody(ctx, t, d, s, true) > bottom) s -= 0.03;
  const end = drawBody(ctx, t, d, s, true);
  const [x0, x1] = t.area ?? [t.side, LETTER_W - t.side];
  const ts = t.title.size * s;
  ctx.font = `800 ${ts}px ${FF.baloo}`;
  const tw = ctx.measureText('THƯ KHEN').width + 40;
  const cx = (x0 + x1) / 2;
  const fy = (t.footY ?? 790) - 790;
  const sw = Math.min(t.signW ?? 560, 520);
  return {
    s,
    title: { x: cx - tw / 2, y: LAY.titleTop, w: tw, h: LAY.titleBottom - LAY.titleTop },
    body: { x: x0, y: LAY.titleBottom, w: x1 - x0, h: Math.max(40, end - LAY.titleBottom) },
    sign: { x: t.signX - sw / 2, y: 768 + fy, w: sw, h: 180 },
  };
}
/** Áp dời / phóng to (quanh tâm khung) cho một khung */
const adjBox = (b: Box, a: BlockAdj): Box => {
  const cx = b.x + b.w / 2 + a.dx, cy = b.y + b.h / 2 + a.dy;
  return { x: cx - (b.w * a.k) / 2, y: cy - (b.h * a.k) / 2, w: b.w * a.k, h: b.h * a.k };
};
function withAdj(ctx: Ctx, b: Box, a: BlockAdj, fn: () => void) {
  if (a.hide) return;
  ctx.save();
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  ctx.translate(cx + a.dx, cy + a.dy);
  ctx.scale(a.k, a.k);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

let measureCtx: Ctx | null = null;
const mctx = () => (measureCtx ??= document.createElement('canvas').getContext('2d')!);

/** Khung trên thư (đã dời) của các khối có sẵn — cho trình chỉnh sửa */
export function blockBoxes(t: PraiseTemplate, d: LetterData, design?: PraiseDesign | null): Record<BlockKey, Box> {
  const tt = withColors(t, design);
  const b = baseBoxes(mctx(), tt, d);
  return { title: adjBox(b.title, adjOf(design, 'title')), body: adjBox(b.body, adjOf(design, 'body')), sign: adjBox(b.sign, adjOf(design, 'sign')) };
}

const itemVars = (d: LetterData) => ({ name: d.name.trim(), className: d.className, placeDate: d.placeDate, school: d.school, teacher: d.teacher });
const textOf = (it: Extract<DesignItem, { kind: 'text' }>, d: LetterData) => { const v = fillVars(it.text, itemVars(d)); return it.upper ? upper(v) : v; };

/** Khung (chưa xoay) của một đồ vật thêm vào, tâm (x, y) */
export function itemBox(it: DesignItem, d: LetterData, assets?: LetterAssets | null): Box {
  if (it.kind === 'text') {
    const ctx = mctx();
    ctx.font = `${it.bold ? 800 : 600} ${it.size}px ${FF[it.font]}`;
    const rows = textOf(it, d).split('\n');
    const w = Math.max(20, ...rows.map((r) => ctx.measureText(r).width)) + 12;
    const h = rows.length * it.size * 1.15 + 8;
    return { x: it.x - w / 2, y: it.y - h / 2, w, h };
  }
  if (it.kind === 'image') {
    const im = assets?.items?.get(it.src);
    const h = im ? (it.w * im.naturalHeight) / im.naturalWidth : it.w;
    return { x: it.x - it.w / 2, y: it.y - h / 2, w: it.w, h };
  }
  return { x: it.x - it.w / 2, y: it.y - it.h / 2, w: it.w, h: it.h };
}

function starPath(ctx: Ctx, w: number, h: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2, r = i % 2 ? 0.45 : 1;
    const x = Math.cos(a) * r * (w / 2), y = Math.sin(a) * r * (h / 2) + h * 0.05;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}
function heartPath(ctx: Ctx, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(0, h * 0.42);
  ctx.bezierCurveTo(-w * 0.62, -h * 0.05, -w * 0.38, -h * 0.62, 0, -h * 0.22);
  ctx.bezierCurveTo(w * 0.38, -h * 0.62, w * 0.62, -h * 0.05, 0, h * 0.42);
  ctx.closePath();
}

/** Vẽ một đồ vật thêm vào (chữ, ảnh, hình) */
export function drawItem(ctx: Ctx, it: DesignItem, d: LetterData, assets?: LetterAssets | null) {
  const b = itemBox(it, d, assets);
  ctx.save();
  ctx.translate(it.x, it.y);
  if (it.rot) ctx.rotate((it.rot * Math.PI) / 180);
  ctx.globalAlpha = it.opacity ?? 1;
  if (it.kind === 'text') {
    ctx.font = `${it.bold ? 800 : 600} ${it.size}px ${FF[it.font]}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = it.align;
    const ax = it.align === 'left' ? -b.w / 2 + 6 : it.align === 'right' ? b.w / 2 - 6 : 0;
    const rows = textOf(it, d).split('\n');
    rows.forEach((row, i) => {
      const yy = (i - (rows.length - 1) / 2) * it.size * 1.15;
      if (it.ring) ringText(ctx, row, ax, yy, it.color, it.ring, Math.max(4, it.size * 0.16));
      else { ctx.fillStyle = it.color; ctx.fillText(row, ax, yy); }
    });
  } else if (it.kind === 'image') {
    const im = assets?.items?.get(it.src);
    if (im) ctx.drawImage(im, -b.w / 2, -b.h / 2, b.w, b.h);
  } else {
    const { w, h } = it;
    ctx.fillStyle = it.fill;
    ctx.strokeStyle = it.stroke;
    ctx.lineWidth = it.sw;
    ctx.lineJoin = 'round';
    if (it.shape === 'line') {
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0);
      ctx.strokeStyle = it.stroke === 'transparent' ? it.fill : it.stroke;
      ctx.lineWidth = Math.max(2, it.sw || h);
      ctx.stroke();
    } else {
      if (it.shape === 'rect') { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, it.radius ?? 24); }
      else if (it.shape === 'circle') { ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2); }
      else if (it.shape === 'star') starPath(ctx, w, h);
      else heartPath(ctx, w, h);
      if (it.fill !== 'transparent') ctx.fill();
      if (it.sw > 0 && it.stroke !== 'transparent') ctx.stroke();
    }
  }
  ctx.restore();
}

/** Vẽ trọn một thư lên ctx (hệ tọa độ 1414 × 1000; gọi ctx.scale trước nếu cần ảnh lớn hơn) */
export function drawLetter(ctx: Ctx, t0: PraiseTemplate, assets: LetterAssets, d: LetterData, design?: PraiseDesign | null) {
  const t = withColors(t0, design);
  ctx.save();
  ctx.clearRect(0, 0, LETTER_W, LETTER_H);
  ctx.drawImage(assets.art, 0, 0, LETTER_W, LETTER_H);
  if (!design?.hideStickers) t.stickers.forEach((st, i) => {
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
  if (t.panel) {
    const p = t.panel;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.filter = 'blur(18px)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const lb of t.labels ?? []) {
    ctx.save();
    ctx.translate(lb.x, lb.y);
    if (lb.rot) ctx.rotate((lb.rot * Math.PI) / 180);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${lb.size}px ${FF[lb.font ?? 'baloo']}`;
    const rows = lb.text.split('\n');
    rows.forEach((row, i) => {
      const yy = (i - (rows.length - 1) / 2) * lb.size * 1.05;
      if (lb.stroke) ringText(ctx, row, 0, yy, lb.color, lb.stroke, lb.size * 0.22);
      else { ctx.fillStyle = lb.color; ctx.fillText(row, 0, yy); }
    });
    ctx.restore();
  }

  const B = baseBoxes(ctx, t, d);
  const s = B.s;
  const parts: [BlockKey, (c: Ctx) => void][] = t.layout === 'formal'
    ? [['title', (c) => drawFormalBody(c, t, d, s, false, 'title')], ['body', (c) => drawFormalBody(c, t, d, s, false, 'rest')], ['sign', (c) => drawFormalFooter(c, t, d)]]
    : [['title', (c) => drawBody(c, t, d, s, false, 'title')], ['body', (c) => drawBody(c, t, d, s, false, 'rest')], ['sign', (c) => drawSign(c, t, d)]];
  // ảnh học sinh: chữ tự thu nhỏ / dời sang bên để không bị khung ảnh che
  const ph = d.photo, room = ph && ph.slot.on && ph.slot.wrap !== false && (ph.photo || ph.slot.empty === 'frame') ? slotBox(ph.slot) : null;
  for (const [k, draw] of parts) {
    const a = adjOf(design, k);
    const fit = room && !a.hide ? makeRoom(B[k], a, room, draw) : null;
    if (fit) { ctx.save(); ctx.translate(fit.cx2, fit.cy); ctx.scale(fit.k, fit.k); ctx.translate(-fit.cx, -fit.cy); }
    withAdj(ctx, B[k], a, () => draw(ctx));
    if (fit) ctx.restore();
  }
  if (d.photo) drawPhoto(ctx, d.photo);
  for (const it of design?.items ?? []) drawItem(ctx, it, d, assets);
  ctx.restore();
}

/** Đo phần chữ thật của một khối (vẽ thử lên canvas nhỏ rồi tìm điểm có mực) */
let inkCanvas: HTMLCanvasElement | null = null;
function inkBox(b: Box, a: BlockAdj, draw: (c: Ctx) => void): Box | null {
  const K = 0.25, W = Math.ceil(LETTER_W * K), H = Math.ceil(LETTER_H * K);
  inkCanvas ??= document.createElement('canvas');
  inkCanvas.width = W; inkCanvas.height = H;
  const ic = inkCanvas.getContext('2d', { willReadFrequently: true });
  if (!ic) return null;
  ic.setTransform(K, 0, 0, K, 0, 0);
  ic.clearRect(0, 0, LETTER_W, LETTER_H);
  ic.save();
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  ic.translate(cx + a.dx, cy + a.dy); ic.scale(a.k, a.k); ic.translate(-cx, -cy);
  draw(ic);
  ic.restore();
  const data = ic.getImageData(0, 0, W, H).data;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  return { x: x0 / K, y: y0 / K, w: (x1 - x0 + 1) / K, h: (y1 - y0 + 1) / K };
}
function makeRoom(b: Box, a: BlockAdj, P: { x: number; y: number; w: number; h: number }, draw: (c: Ctx) => void) {
  const r = inkBox(b, a, draw);
  if (!r) return null;
  const gap = 18;
  const overlapX = r.x < P.x + P.w + gap && r.x + r.w > P.x - gap, overlapY = r.y < P.y + P.h && r.y + r.h > P.y;
  if (!overlapX || !overlapY) return null;
  const A = adjBox(b, a);
  const left = P.x + P.w / 2 < r.x + r.w / 2; // ảnh ở bên trái phần chữ
  const lo = left ? P.x + P.w + gap : Math.min(A.x, r.x), hi = left ? Math.max(A.x + A.w, r.x + r.w) : P.x - gap;
  const free = hi - lo;
  if (free < r.w * 0.5) return null; // ảnh nằm giữa chữ: không cố nhường
  const k = Math.min(1, free / r.w);
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const w2 = r.w * k;
  const cx2 = Math.min(hi - w2 / 2, Math.max(lo + w2 / 2, cx));
  return { cx, cy, cx2, k };
}

/** Khối ký tên (kiểu vui nhộn và tranh vẽ) */
function drawSign(ctx: Ctx, t: PraiseTemplate, d: LetterData) {
  const sx = t.signX;
  const fy = (t.footY ?? 790) - 790;
  const sw = t.signW ?? 560;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = t.ink;
  if (d.placeDate.trim()) {
    fitFont(ctx, d.placeDate, '700', FF.baloo, 31, sw);
    ctx.fillText(d.placeDate, sx, 790 + fy);
  }
  if (d.role.trim()) {
    fitFont(ctx, upper(d.role), '800', FF.baloo, 31, sw);
    ctx.fillText(upper(d.role), sx, 829 + fy);
  }
  if (d.signature) {
    const im = d.signature;
    const k = Math.min(Math.min(280, sw) / im.naturalWidth, 80 / im.naturalHeight);
    const w = im.naturalWidth * k, h = im.naturalHeight * k;
    ctx.drawImage(im, sx - w / 2, 884 + fy - h / 2, w, h);
    if (d.teacher.trim()) {
      fitFont(ctx, d.teacher, '700', FF.baloo, 30, sw);
      ctx.fillText(d.teacher, sx, 930 + fy);
    }
  } else if (d.teacher.trim()) {
    fitFont(ctx, d.teacher, '600', FF.script, 52, Math.min(520, sw));
    ctx.fillText(d.teacher, sx, 908 + fy);
  }
}

/** Tạo canvas chứa một thư với hệ số phóng (1 = 1414 × 1000 px) */
export function renderLetterCanvas(t: PraiseTemplate, assets: LetterAssets, d: LetterData, scale: number, design?: PraiseDesign | null): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(LETTER_W * scale);
  c.height = Math.round(LETTER_H * scale);
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Trình duyệt không hỗ trợ vẽ ảnh (canvas).');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.scale(scale, scale);
  drawLetter(ctx, t, assets, d, design);
  return c;
}

export function canvasBlob(c: HTMLCanvasElement, type: 'image/png' | 'image/jpeg', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Không tạo được ảnh.'))), type, quality));
}
