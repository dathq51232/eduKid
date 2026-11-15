// Xuất bài thao giảng thành file PowerPoint (.pptx) — chữ, hình khối, ảnh là vật thật sửa được trong PowerPoint;
// nền cảnh minh hoạ và hình trang trí phức tạp được chụp thành ảnh; câu hỏi / trò chơi đổi thành ô chữ + thẻ đáp án.
// Ghi chú của cô (và đáp án câu hỏi) nằm ở phần Ghi chú của từng trang. Không cần thư viện: tự viết XML (OOXML) rồi nén zip.
import { zipStore } from '@/lib/xlsx';
import { FONTS, SH, SW, bgCss, quizText, type Deck, type El, type ImgEl, type ShapeEl, type Slide, type TextEl } from './types';

export type Pic = { data: Uint8Array; ext: 'png' | 'jpeg' };
export type PptxHooks = {
  /** ảnh nền của trang i (nền + cảnh minh hoạ), null = dùng màu nền */
  bg: (i: number) => Promise<Pic | null>;
  /** ảnh của hình khối trang trí không có sẵn trong PowerPoint */
  shape: (i: number, e: ShapeEl) => Promise<Pic | null>;
  /** ảnh (đã đổi sang PNG) + kích thước gốc */
  img: (e: ImgEl) => Promise<{ data: Uint8Array; w: number; h: number } | null>;
  onProgress?: (done: number, total: number) => void;
};

const EMU = 12192000 / SW; // 7620 EMU cho 1 điểm của trang 1600 × 900
const e = (n: number) => Math.round(n * EMU);
const PT = 960 / SW; // cỡ chữ: 1 điểm trang = 0,6 pt
const esc = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/** màu CSS → RRGGBB + độ đục (0–1); null = trong suốt */
export function color(c: string | undefined): { hex: string; a: number } | null {
  if (!c) return null;
  const s = c.trim().toLowerCase();
  if (!s || s === 'transparent' || s === 'none') return null;
  if (s === 'white') return { hex: 'FFFFFF', a: 1 };
  if (s === 'black') return { hex: '000000', a: 1 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join('');
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return a < 0.02 ? null : { hex: h.slice(0, 6).toUpperCase(), a };
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith('%') ? (parseFloat(x) / 100) * 255 : parseFloat(x)));
    const a = p[3] === undefined ? 1 : p[3] > 1 ? p[3] / 255 : p[3];
    if (a < 0.02) return null;
    return { hex: p.slice(0, 3).map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase(), a };
  }
  return null;
}
/** màu chính của một nền CSS (màu đầu tiên trong dải chuyển màu) */
const firstColor = (css: string) => color(css.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]+\)/i)?.[0]);
const fill = (c: { hex: string; a: number } | null, op = 1) => {
  if (!c) return '<a:noFill/>';
  const a = Math.round(c.a * op * 100000);
  return `<a:solidFill><a:srgbClr val="${c.hex}">${a < 100000 ? `<a:alpha val="${a}"/>` : ''}</a:srgbClr></a:solidFill>`;
};
const xfrm = (x: number, y: number, w: number, h: number, rot = 0, flip = false) =>
  `<a:xfrm${rot ? ` rot="${Math.round((((rot % 360) + 360) % 360) * 60000)}"` : ''}${flip ? ' flipH="1"' : ''}><a:off x="${e(x)}" y="${e(y)}"/><a:ext cx="${Math.max(1, e(w))}" cy="${Math.max(1, e(h))}"/></a:xfrm>`;
const geom = (prst: string, adj?: number) => `<a:prstGeom prst="${prst}"><a:avLst>${adj !== undefined ? `<a:gd name="adj" fmla="val ${Math.round(adj)}"/>` : ''}</a:avLst></a:prstGeom>`;

const FACE: Record<string, string> = { baloo: 'Baloo 2', quick: 'Quicksand', script: 'Segoe Script', hand: 'Segoe Script' };
type Run = { text: string; size: number; color?: string; font?: string; bold?: boolean; italic?: boolean };
/** khối chữ: mỗi dòng (\n) là một đoạn */
function txBody(r: Run, o: { align?: 'l' | 'ctr' | 'r'; anchor?: 't' | 'ctr' | 'b'; ins?: [number, number] } = {}) {
  const c = color(r.color) ?? { hex: '1F2937', a: 1 };
  const face = esc(r.font ?? 'Quicksand');
  const rPr = `<a:rPr lang="vi-VN" sz="${Math.max(100, Math.min(400000, Math.round(r.size * PT * 100)))}"${r.bold ? ' b="1"' : ''}${r.italic ? ' i="1"' : ''} dirty="0">${fill(c)}<a:latin typeface="${face}"/><a:cs typeface="${face}"/></a:rPr>`;
  const [lx, ty] = o.ins ?? [0, 0];
  const paras = r.text.split('\n').map((line) => `<a:p><a:pPr algn="${o.align ?? 'ctr'}"/>${line ? `<a:r>${rPr}<a:t>${esc(line)}</a:t></a:r>` : ''}<a:endParaRPr lang="vi-VN" sz="${Math.round(r.size * PT * 100)}" dirty="0"/></a:p>`).join('');
  return `<p:txBody><a:bodyPr wrap="square" lIns="${e(lx)}" tIns="${e(ty)}" rIns="${e(lx)}" bIns="${e(ty)}" anchor="${o.anchor ?? 'ctr'}" rtlCol="0"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody>`;
}

class SlideXml {
  id = 2;
  parts: string[] = [];
  rels: string[] = [];
  media: { name: string; data: Uint8Array }[] = [];
  constructor(private counter: { n: number; seen: Map<string, string> }) {}
  addMedia(p: Pic | { data: Uint8Array; ext: 'png' | 'jpeg' }) {
    // cùng một ảnh dùng ở nhiều trang: chỉ lưu một lần trong file
    const d = p.data, key = `${p.ext}:${d.length}:${Array.from(d.subarray(0, 48)).join(',')}:${Array.from(d.subarray(Math.max(0, d.length / 2 - 24), d.length / 2 + 24)).join(',')}`;
    let name = this.counter.seen.get(key);
    if (!name) { name = `image${++this.counter.n}.${p.ext}`; this.counter.seen.set(key, name); this.media.push({ name, data: d }); }
    const rid = `rId${this.rels.length + 3}`;
    this.rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${name}"/>`);
    return rid;
  }
  sp(name: string, spPr: string, body = '', txBox = false) {
    this.parts.push(`<p:sp><p:nvSpPr><p:cNvPr id="${this.id++}" name="${esc(name)}"/><p:cNvSpPr${txBox ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr><p:spPr>${spPr}</p:spPr>${body || txBody({ text: '', size: 20 })}</p:sp>`);
  }
  pic(name: string, rid: string, x: number, y: number, w: number, h: number, o: { rot?: number; flip?: boolean; op?: number; src?: [number, number, number, number]; adj?: number } = {}) {
    const [l, t, r, b] = (o.src ?? [0, 0, 0, 0]).map((v) => Math.round(v * 100000));
    const alpha = o.op !== undefined && o.op < 1 ? `<a:alphaModFix amt="${Math.round(o.op * 100000)}"/>` : '';
    this.parts.push(`<p:pic><p:nvPicPr><p:cNvPr id="${this.id++}" name="${esc(name)}" descr="${esc(name)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`
      + `<p:blipFill><a:blip r:embed="${rid}">${alpha}</a:blip>${l || t || r || b ? `<a:srcRect l="${l}" t="${t}" r="${r}" b="${b}"/>` : '<a:srcRect/>'}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`
      + `<p:spPr>${xfrm(x, y, w, h, o.rot, o.flip)}${geom(o.adj ? 'roundRect' : 'rect', o.adj)}</p:spPr></p:pic>`);
  }
}

const PRESET: Partial<Record<ShapeEl['shape'], string>> = { rect: 'rect', round: 'roundRect', circle: 'ellipse', star: 'star5', heart: 'heart', arrow: 'rightArrow', cloud: 'cloud', bubble: 'wedgeRoundRectCallout', banner: 'ribbon2' };
const ln = (stroke: string | undefined, w: number, dash?: string, op = 1) => {
  const c = color(stroke);
  if (!c || w <= 0) return '<a:ln><a:noFill/></a:ln>';
  return `<a:ln w="${Math.round(w * EMU)}">${fill(c, op)}${dash ? `<a:prstDash val="${dash === 'dot' ? 'sysDot' : 'dash'}"/>` : ''}</a:ln>`;
};
const radAdj = (rad: number | undefined, w: number, h: number, px?: number) => {
  if (px !== undefined) return Math.min(50000, (px / Math.max(1, Math.min(w, h))) * 100000);
  return rad ? Math.min(50000, rad * 500) : undefined;
};

async function slideXml(s: Slide, i: number, hooks: PptxHooks, counter: { n: number; seen: Map<string, string> }) {
  const x = new SlideXml(counter);
  const notes: string[] = [];
  // nền: chụp ảnh nếu có cảnh minh hoạ / dải chuyển màu; nền một màu thì tô màu
  const css = bgCss(s.bg);
  const plain = !s.scene && /^#[0-9a-f]{3,8}$/i.test(css.trim());
  let bg = `<p:bg><p:bgPr>${fill(firstColor(css) ?? { hex: 'FFFFFF', a: 1 })}<a:effectLst/></p:bgPr></p:bg>`;
  if (!plain) {
    const pic = await hooks.bg(i);
    if (pic) { const rid = x.addMedia(pic); bg = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${rid}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>`; }
  }

  for (const el of s.els as El[]) {
    if (el.hide) continue;
    const op = el.op ?? 1;
    const rot = el.rot || 0;
    switch (el.kind) {
      case 'text': {
        const t = el as TextEl;
        const bgc = color(t.bg);
        x.sp(t.text.split('\n')[0].slice(0, 40) || 'Chữ', xfrm(t.x, t.y, t.w, t.h, rot) + geom(bgc ? 'roundRect' : 'rect', bgc ? radAdj(undefined, t.w, t.h, 26) : undefined) + fill(bgc, op) + '<a:ln><a:noFill/></a:ln>',
          txBody({ text: t.text, size: t.size, color: t.color, font: FACE[t.font], bold: FONTS[t.font].weight >= 700, italic: t.italic }, { align: t.align === 'left' ? 'l' : t.align === 'right' ? 'r' : 'ctr', ins: bgc ? [26, 12] : [4, 2] }), !bgc);
        break;
      }
      case 'img': {
        const p = await hooks.img(el);
        if (!p) { notes.push(`(Trang có ảnh “${el.name ?? 'ảnh'}” chưa xuất được — chèn lại ảnh này trong PowerPoint.)`); break; }
        const rid = x.addMedia({ data: p.data, ext: 'png' });
        let { x: X, y: Y, w: W, h: H } = el;
        let src: [number, number, number, number] | undefined;
        const c = el.crop;
        if (c && c.w > 0 && c.h > 0) src = [c.x, c.y, 1 - c.x - c.w, 1 - c.y - c.h];
        else if (el.rad) {
          // ảnh bo góc hiện kiểu "cover": cắt bớt phần thừa cho vừa khung
          const ir = p.w / p.h, fr = W / H;
          if (ir > fr) { const k = (1 - fr / ir) / 2; src = [k, 0, k, 0]; } else { const k = (1 - ir / fr) / 2; src = [0, k, 0, k]; }
        } else {
          // ảnh thường hiện kiểu "contain": đặt ảnh vừa trong khung, giữ tỉ lệ
          const ir = p.w / p.h, fr = W / H;
          if (ir > fr) { const nh = W / ir; Y += (H - nh) / 2; H = nh; } else { const nw = H * ir; X += (W - nw) / 2; W = nw; }
        }
        x.pic(el.name ?? 'Ảnh', rid, X, Y, W, H, { rot, flip: el.flip, op, src, adj: el.rad ? Math.min(50000, el.rad * 500) : undefined });
        break;
      }
      case 'shape': {
        const prst = PRESET[el.shape];
        const txt = el.text ? txBody({ text: el.text, size: el.size ?? 40, color: el.color ?? '#1f2937', font: FACE.baloo, bold: true }, { ins: [el.w * 0.08, el.h * 0.06] }) : '';
        if (prst) {
          const adj = el.shape === 'round' ? radAdj(el.rad ?? 30, el.w, el.h) : el.shape === 'rect' && el.rad ? radAdj(el.rad, el.w, el.h) : undefined;
          x.sp(el.text?.slice(0, 40) || 'Hình', xfrm(el.x, el.y, el.w, el.h, rot, el.flip) + geom(el.shape === 'rect' && adj ? 'roundRect' : prst, adj) + fill(color(el.fill), op) + ln(el.stroke, el.sw, el.dash, op), txt);
        } else {
          const pic = await hooks.shape(i, el);
          if (pic) { const rid = x.addMedia(pic); x.pic('Hình trang trí', rid, el.x, el.y, el.w, el.h, { rot, flip: el.flip, op }); }
          else x.sp('Hình', xfrm(el.x, el.y, el.w, el.h, rot) + geom('roundRect', 16000) + fill(color(el.fill), op) + ln(el.stroke, el.sw, el.dash, op), '');
          if (el.text) x.sp(el.text.slice(0, 40), xfrm(el.x, el.y, el.w, el.h, rot) + geom('rect') + '<a:noFill/><a:ln><a:noFill/></a:ln>', txt, true);
        }
        break;
      }
      case 'quiz': {
        // câu hỏi ở trên, thẻ đáp án xếp lưới bên dưới; đáp án đúng ghi vào Ghi chú
        const qh = Math.min(el.h * 0.3, 200), gap = 22;
        x.sp('Câu hỏi', xfrm(el.x, el.y, el.w, qh, rot) + geom('roundRect', 18000) + fill({ hex: 'FFFFFF', a: 0.95 }, op) + ln('#c7d2fe', 4), txBody({ text: el.q, size: 52, color: '#1e3a8a', font: FACE.baloo, bold: true }, { ins: [24, 8] }));
        const opts = el.mode === 'tf' ? ['Đúng', 'Sai'] : el.opts.map(quizText);
        const cols = opts.length <= 2 ? opts.length : el.cols;
        const rows = Math.ceil(opts.length / cols);
        const ow = (el.w - gap * (cols - 1)) / cols, oh = Math.min(170, (el.h - qh - gap * rows) / rows);
        const COL = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa'];
        opts.forEach((o, k) => {
          const cx = el.x + (k % cols) * (ow + gap), cy = el.y + qh + gap + Math.floor(k / cols) * (oh + gap);
          x.sp(`Đáp án ${String.fromCharCode(65 + k)}`, xfrm(cx, cy, ow, oh) + geom('roundRect', 22000) + fill(color(COL[k % COL.length]), op) + ln('#ffffff', 4),
            txBody({ text: `${String.fromCharCode(65 + k)}. ${o}`, size: 44, color: '#1f2937', font: FACE.baloo, bold: true }, { ins: [22, 6] }));
        });
        if (el.mode !== 'fill') notes.push(`Câu hỏi: ${el.q} — Đáp án đúng: ${String.fromCharCode(65 + el.a)}. ${opts[el.a] ?? ''}`);
        break;
      }
      case 'sort': {
        const ph = 120, gap = 18;
        x.sp('Đề bài', xfrm(el.x, el.y, el.w, ph, rot) + geom('rect') + '<a:noFill/><a:ln><a:noFill/></a:ln>', txBody({ text: el.prompt, size: 48, color: '#1e3a8a', font: FACE.baloo, bold: true }), true);
        // thẻ xáo cố định (đảo vòng) để học sinh sắp lại
        const items = el.items.length > 1 ? [...el.items.slice(1), el.items[0]].reverse() : el.items;
        const cols = Math.min(items.length, 4), rows = Math.ceil(items.length / cols);
        const iw = (el.w - gap * (cols - 1)) / cols, ih = Math.min(150, (el.h - ph - gap * rows) / rows);
        items.forEach((t, k) => x.sp('Thẻ', xfrm(el.x + (k % cols) * (iw + gap), el.y + ph + gap + Math.floor(k / cols) * (ih + gap), iw, ih) + geom('roundRect', 20000) + fill({ hex: 'FEF3C7', a: 1 }, op) + ln('#f59e0b', 4),
          txBody({ text: t, size: 42, color: '#1f2937', font: FACE.baloo, bold: true })));
        notes.push(`Sắp xếp — thứ tự đúng: ${el.items.join(' → ')}`);
        break;
      }
      case 'drop':
        x.sp('Ô thả', xfrm(el.x, el.y, el.w, el.h, rot) + geom('roundRect', 14000) + fill(color(el.color), 0.08 * op) + ln(el.color, 5, 'dash', op), txBody({ text: el.label, size: 36, color: el.color, font: FACE.baloo, bold: true }));
        break;
      case 'teams':
        x.sp('Thi đua tổ', xfrm(el.x, el.y, el.w, el.h, rot) + geom('roundRect', 10000) + fill({ hex: 'FFFFFF', a: 0.92 }, op) + ln('#f59e0b', 5), txBody({ text: `🏆 ${el.title || 'Bảng thi đua tổ'}\n(điểm các tổ hiện khi trình chiếu trên EduChain Kids)`, size: 40, color: '#92400e', font: FACE.baloo, bold: true }));
        break;
      case 'scene3d':
        x.sp('Cảnh 3D', xfrm(el.x, el.y, el.w, el.h, rot) + geom('roundRect', 8000) + fill({ hex: 'E0F2FE', a: 1 }, op) + ln('#0284c7', 5), txBody({ text: `🧊 Cảnh 3D: ${el.title}\n(mở bài trên EduChain Kids để xoay xem 3D)`, size: 40, color: '#075985', font: FACE.baloo, bold: true }));
        break;
    }
  }
  if (s.notes?.trim()) notes.unshift(s.notes.trim());
  const trans = s.trans === 'fade' || s.trans === 'flip' ? '<p:transition spd="med"><p:fade/></p:transition>' : s.trans === 'slide' ? '<p:transition spd="med"><p:push dir="l"/></p:transition>' : s.trans === 'zoom' ? '<p:transition spd="med"><p:zoom/></p:transition>' : '';
  const xml = `${HEAD}<p:sld ${NS}><p:cSld>${bg}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${x.parts.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${trans}</p:sld>`;
  const rels = `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${i + 1}.xml"/>${x.rels.join('')}</Relationships>`;
  return { xml, rels, media: x.media, notes: notes.join('\n') };
}

const notesXml = (text: string) => `${HEAD}<p:notes ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`
  + `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>`
  + `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>`
  + (text ? text.split('\n').map((l) => `<a:p>${l ? `<a:r><a:rPr lang="vi-VN" dirty="0"/><a:t>${esc(l)}</a:t></a:r>` : ''}<a:endParaRPr lang="vi-VN" dirty="0"/></a:p>`).join('') : '<a:p><a:endParaRPr lang="vi-VN" dirty="0"/></a:p>')
  + '</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>';

const THEME = (name: string) => `${HEAD}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${name}"><a:themeElements>`
  + '<a:clrScheme name="EduChain"><a:dk1><a:srgbClr val="1F2937"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1E3A8A"/></a:dk2><a:lt2><a:srgbClr val="F1F5F9"/></a:lt2>'
  + '<a:accent1><a:srgbClr val="7C3AED"/></a:accent1><a:accent2><a:srgbClr val="0EA5E9"/></a:accent2><a:accent3><a:srgbClr val="22C55E"/></a:accent3><a:accent4><a:srgbClr val="F59E0B"/></a:accent4><a:accent5><a:srgbClr val="EF4444"/></a:accent5><a:accent6><a:srgbClr val="EC4899"/></a:accent6>'
  + '<a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme>'
  + '<a:fontScheme name="EduChain"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
  + '<a:fmtScheme name="EduChain"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
  + '<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
  + '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
  + '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>'
  + '</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';
const SPTREE0 = '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>';
const CLRMAP = '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';
const LVL = '<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>';
const REL = (id: string, type: string, target: string) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
const RELS = (body: string) => `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${body}</Relationships>`;

export async function buildPptx(deck: Deck, hooks: PptxHooks): Promise<Uint8Array> {
  const n = deck.slides.length;
  const counter = { n: 0, seen: new Map<string, string>() };
  const files: [string, string | Uint8Array][] = [];
  const sl: Awaited<ReturnType<typeof slideXml>>[] = [];
  for (let i = 0; i < n; i++) { sl.push(await slideXml(deck.slides[i], i, hooks, counter)); hooks.onProgress?.(i + 1, n); }

  const ct = `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
    + '<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/>'
    + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
    + '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
    + '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
    + '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>'
    + '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    + '<Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
    + '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>'
    + '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>'
    + '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>'
    + '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
    + '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
    + sl.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/><Override PartName="/ppt/notesSlides/notesSlide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`).join('')
    + '</Types>';
  files.push(['[Content_Types].xml', ct]);
  files.push(['_rels/.rels', RELS(REL('rId1', 'officeDocument', 'ppt/presentation.xml')
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    + REL('rId3', 'extended-properties', 'docProps/app.xml'))]);
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  files.push(['docProps/core.xml', `${HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(deck.title)}</dc:title><dc:creator>EduChain Kids</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`]);
  files.push(['docProps/app.xml', `${HEAD}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>EduChain Kids</Application><Slides>${n}</Slides><PresentationFormat>Trình chiếu 16:9</PresentationFormat></Properties>`]);

  files.push(['ppt/presentation.xml', `${HEAD}<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst>`
    + `<p:sldIdLst>${sl.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${10 + i}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>`
    + `<p:defaultTextStyle>${LVL}</p:defaultTextStyle></p:presentation>`]);
  files.push(['ppt/_rels/presentation.xml.rels', RELS(REL('rId1', 'slideMaster', 'slideMasters/slideMaster1.xml') + REL('rId2', 'notesMaster', 'notesMasters/notesMaster1.xml')
    + REL('rId3', 'presProps', 'presProps.xml') + REL('rId4', 'viewProps', 'viewProps.xml') + REL('rId5', 'theme', 'theme/theme1.xml') + REL('rId6', 'tableStyles', 'tableStyles.xml')
    + sl.map((_, i) => REL(`rId${10 + i}`, 'slide', `slides/slide${i + 1}.xml`)).join(''))]);
  files.push(['ppt/presProps.xml', `${HEAD}<p:presentationPr ${NS}/>`]);
  files.push(['ppt/viewProps.xml', `${HEAD}<p:viewPr ${NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="80000"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`]);
  files.push(['ppt/tableStyles.xml', `${HEAD}<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`]);
  files.push(['ppt/theme/theme1.xml', THEME('EduChain Kids')]);
  files.push(['ppt/theme/theme2.xml', THEME('EduChain Kids Notes')]);
  files.push(['ppt/slideMasters/slideMaster1.xml', `${HEAD}<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>${SPTREE0}</p:cSld>${CLRMAP}`
    + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
    + `<p:txStyles><p:titleStyle>${LVL}</p:titleStyle><p:bodyStyle>${LVL}</p:bodyStyle><p:otherStyle>${LVL}</p:otherStyle></p:txStyles></p:sldMaster>`]);
  files.push(['ppt/slideMasters/_rels/slideMaster1.xml.rels', RELS(REL('rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml') + REL('rId2', 'theme', '../theme/theme1.xml'))]);
  files.push(['ppt/slideLayouts/slideLayout1.xml', `${HEAD}<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Trang trống">${SPTREE0}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`]);
  files.push(['ppt/slideLayouts/_rels/slideLayout1.xml.rels', RELS(REL('rId1', 'slideMaster', '../slideMasters/slideMaster1.xml'))]);
  files.push(['ppt/notesMasters/notesMaster1.xml', `${HEAD}<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`
    + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr></p:sp>'
    + '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="vi-VN"/><a:t>Ghi chú</a:t></a:r></a:p></p:txBody></p:sp>'
    + `</p:spTree></p:cSld>${CLRMAP}<p:notesStyle>${LVL}</p:notesStyle></p:notesMaster>`]);
  files.push(['ppt/notesMasters/_rels/notesMaster1.xml.rels', RELS(REL('rId1', 'theme', '../theme/theme2.xml'))]);
  sl.forEach((s, i) => {
    files.push([`ppt/slides/slide${i + 1}.xml`, s.xml]);
    files.push([`ppt/slides/_rels/slide${i + 1}.xml.rels`, s.rels]);
    files.push([`ppt/notesSlides/notesSlide${i + 1}.xml`, notesXml(s.notes)]);
    files.push([`ppt/notesSlides/_rels/notesSlide${i + 1}.xml.rels`, RELS(REL('rId1', 'notesMaster', '../notesMasters/notesMaster1.xml') + REL('rId2', 'slide', `../slides/slide${i + 1}.xml`))]);
    for (const m of s.media) files.push([`ppt/media/${m.name}`, m.data]);
  });
  const enc = new TextEncoder();
  return zipStore(files.map(([nm, d]) => [enc.encode(nm), typeof d === 'string' ? enc.encode(d) : d]));
}

export const SLIDE_PX = { w: SW, h: SH };
