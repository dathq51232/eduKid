// Tạo file Word .docx thật (Office Open XML) từ HTML do app sinh ra — không dùng thư viện ngoài.
// HTML đầu vào là loại "gọn" của app: p, h1–h3, div, span, b/i/u, br, img, table (colspan, rowspan, bgcolor, viền)
// cùng các bản gốc chuyển từ file Word của trường (src/lib/docx-read.ts). Word, WPS, LibreOffice, Google Docs đều mở được.
// Thể thức NĐ30: A4, lề trên/dưới 20 mm, trái 30 mm, phải 15 mm, Times New Roman.

import { zipStore } from './xlsx';

export type DocImage = { bytes: Uint8Array; mime: string; width?: number; height?: number };

// ------------------------------------------------------------------ đọc HTML (dạng gọn, đã chuẩn hoá)

type El = { tag: string; attrs: Record<string, string>; kids: Node[] };
type Node = El | { text: string };
const isEl = (n: Node): n is El => 'tag' in n;
const VOID = new Set(['br', 'img', 'meta', 'hr', 'link', 'input', 'col', 'wbr']);
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', emsp: ' ', ensp: ' ', thinsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', bull: '•', middot: '·', laquo: '«', raquo: '»', copy: '©', deg: '°', times: '×', divide: '÷' };
const decode = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)); return Number.isFinite(n) && n > 0 ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});

export function parseHtml(html: string): El {
  const root: El = { tag: 'root', attrs: {}, kids: [] };
  const stack: El[] = [root];
  const src = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<!doctype[^>]*>/gi, '').replace(/<(style|script|title|head)\b[\s\S]*?<\/\1>/gi, '');
  const re = /<\/?([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m[4] !== undefined) { if (m[4]) top.kids.push({ text: decode(m[4]) }); continue; }
    const tag = m[1].toLowerCase();
    if (m[0][1] === '/') {
      const i = stack.map((e) => e.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of m[2].matchAll(/([^\s=>/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = decode(a[3] ?? a[4] ?? a[5] ?? '');
    const el: El = { tag, attrs, kids: [] };
    top.kids.push(el);
    if (!VOID.has(tag) && !m[3]) stack.push(el);
  }
  return root;
}

const css = (s = '') => Object.fromEntries(s.split(';').map((x) => x.split(':')).filter((x) => x.length >= 2).map(([k, ...v]) => [k.trim().toLowerCase(), v.join(':').trim()]));
const pt = (v?: string): number | undefined => {
  if (!v) return undefined;
  const m = /^(-?[\d.]+)\s*(pt|px|mm|cm|in|em)?$/.exec(v.trim());
  if (!m) return undefined;
  const n = Number(m[1]);
  return m[2] === 'px' ? n * 0.75 : m[2] === 'mm' ? n * 2.835 : m[2] === 'cm' ? n * 28.35 : m[2] === 'in' ? n * 72 : m[2] === 'em' ? n * 12 : n;
};
const hex = (v?: string) => {
  if (!v) return undefined;
  const s = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s.slice(1).toUpperCase();
  if (/^#[0-9a-f]{3}$/.test(s)) return s.slice(1).split('').map((c) => c + c).join('').toUpperCase();
  const rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(s);
  if (rgb) return rgb.slice(1).map((x) => Number(x).toString(16).padStart(2, '0')).join('').toUpperCase();
  const named: Record<string, string> = { black: '000000', red: 'FF0000', blue: '0000FF', green: '008000', white: 'FFFFFF', yellow: 'FFFF00', gray: '808080', grey: '808080' };
  return named[s];
};
const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ------------------------------------------------------------------ định dạng

type RP = { b?: boolean; i?: boolean; u?: boolean; strike?: boolean; color?: string; sz?: number; bg?: string; caps?: boolean; va?: 'superscript' | 'subscript' };
type PP = { jc?: string; before?: number; after?: number; left?: number; first?: number; line?: number; pbb?: boolean };

/** các lớp CSS app dùng trong văn bản (doc-style.ts, plans/word.ts) */
const CLASS: Record<string, { r?: RP; p?: PP }> = {
  c: { p: { jc: 'center' } },
  muted: { r: { color: '555555', sz: 11 } },
  'nd30-org': { r: { caps: true, sz: 13 }, p: { jc: 'center', after: 0 } },
  'nd30-nation': { r: { b: true, sz: 12 }, p: { jc: 'center', after: 0 } },
  'nd30-motto': { r: { b: true, sz: 13 }, p: { jc: 'center', after: 0 } },
  'nd30-place': { r: { i: true, sz: 13 }, p: { jc: 'center', after: 0 } },
  role: { r: { b: true, caps: true, sz: 13 }, p: { jc: 'center' } },
  name: { r: { b: true, sz: 14 }, p: { jc: 'center' } },
};
const TAG: Record<string, { r?: RP; p?: PP }> = {
  h1: { r: { b: true, sz: 14 }, p: { jc: 'center', before: 6, after: 2 } },
  h2: { r: { b: true, sz: 14 }, p: { before: 10, after: 4 } },
  h3: { r: { b: true, sz: 14 }, p: { before: 6, after: 2 } },
  th: { r: { b: true }, p: { jc: 'center' } },
  b: { r: { b: true } }, strong: { r: { b: true } }, i: { r: { i: true } }, em: { r: { i: true } }, u: { r: { u: true } },
  s: { r: { strike: true } }, sup: { r: { va: 'superscript' } }, sub: { r: { va: 'subscript' } },
};

function runFrom(el: El, base: RP): RP {
  const r: RP = { ...base, ...TAG[el.tag]?.r };
  for (const c of (el.attrs.class ?? '').split(/\s+/)) if (CLASS[c]?.r) Object.assign(r, CLASS[c].r);
  const s = css(el.attrs.style);
  if (s['font-weight']) r.b = /bold|[6-9]00/.test(s['font-weight']);
  if (s['font-style']) r.i = s['font-style'] === 'italic';
  if (s['text-decoration']) { r.u = /underline/.test(s['text-decoration']); r.strike = /line-through/.test(s['text-decoration']); }
  if (s.color && hex(s.color)) r.color = hex(s.color);
  if (s['font-size']) { const v = pt(s['font-size']); if (v) r.sz = v; }
  const bg = hex(s.background ?? s['background-color']); if (bg && el.tag === 'span') r.bg = bg;
  if (s['text-transform']) r.caps = s['text-transform'] === 'uppercase';
  if (s['vertical-align'] === 'super') r.va = 'superscript';
  if (s['vertical-align'] === 'sub') r.va = 'subscript';
  return r;
}
function paraFrom(el: El): PP {
  const p: PP = { ...TAG[el.tag]?.p };
  for (const c of (el.attrs.class ?? '').split(/\s+/)) if (CLASS[c]?.p) Object.assign(p, CLASS[c].p);
  const s = css(el.attrs.style);
  if (s['text-align']) p.jc = s['text-align'];
  if (el.attrs.align) p.jc = el.attrs.align;
  if (s.margin) {
    const v = s.margin.split(/\s+/).map(pt);
    const [t, r, b, l] = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v;
    void r;
    if (t !== undefined) p.before = t; if (b !== undefined) p.after = b; if (l !== undefined && l > 0) p.left = l;
  }
  if (s['margin-top']) p.before = pt(s['margin-top']);
  if (s['margin-bottom']) p.after = pt(s['margin-bottom']);
  if (s['margin-left']) p.left = pt(s['margin-left']);
  if (s['text-indent']) p.first = pt(s['text-indent']);
  if (s['line-height'] && /^[\d.]+$/.test(s['line-height'])) p.line = Number(s['line-height']);
  if (s['page-break-before'] === 'always') p.pbb = true;
  return p;
}

const rPrXml = (r: RP) => {
  const o: string[] = [];
  if (r.b) o.push('<w:b/><w:bCs/>');
  if (r.i) o.push('<w:i/><w:iCs/>');
  if (r.caps) o.push('<w:caps/>');
  if (r.strike) o.push('<w:strike/>');
  if (r.color) o.push(`<w:color w:val="${r.color}"/>`);
  if (r.sz) o.push(`<w:sz w:val="${Math.round(r.sz * 2)}"/><w:szCs w:val="${Math.round(r.sz * 2)}"/>`);
  if (r.u) o.push('<w:u w:val="single"/>');
  if (r.bg) o.push(`<w:shd w:val="clear" w:color="auto" w:fill="${r.bg}"/>`);
  if (r.va) o.push(`<w:vertAlign w:val="${r.va}"/>`);
  return o.length ? `<w:rPr>${o.join('')}</w:rPr>` : '';
};
const JC: Record<string, string> = { center: 'center', right: 'right', justify: 'both', left: 'left', both: 'both', end: 'right', start: 'left' };
const tw = (p: number) => Math.round(p * 20);
function pPrXml(p: PP, pbb: boolean, extra = '') {
  const o: string[] = [];
  if (pbb || p.pbb) o.push('<w:pageBreakBefore/>');
  const sp = [`w:before="${tw(p.before ?? 0)}"`, `w:after="${tw(p.after ?? 0)}"`];
  sp.push(`w:line="${Math.round((p.line ?? 1.15) * 240)}" w:lineRule="auto"`);
  o.push(`<w:spacing ${sp.join(' ')}/>`);
  if (p.left || p.first) o.push(`<w:ind${p.left ? ` w:left="${tw(p.left)}"` : ''}${p.first ? (p.first > 0 ? ` w:firstLine="${tw(p.first)}"` : ` w:hanging="${tw(-p.first)}"`) : ''}/>`);
  if (p.jc && JC[p.jc]) o.push(`<w:jc w:val="${JC[p.jc]}"/>`);
  return `<w:pPr>${o.join('')}${extra}</w:pPr>`;
}

// ------------------------------------------------------------------ chuyển đổi

type Ctx = {
  images: Map<string, DocImage>;
  rels: { id: string; target: string; type: 'image' }[];
  media: [string, Uint8Array][];
  imgIds: Map<string, string>;
  pid: number;
  /** bề rộng vùng chữ hiện tại (twip) */
  width: number;
  pendingBreak: boolean;
};
const PORTRAIT_W = 9355; // 21 cm − 3 cm − 1,5 cm
const LAND_W = 14287; // 29,7 cm − 2,5 cm − 2 cm
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/bmp': 'bmp' };

function imageRun(el: El, ctx: Ctx): string {
  const key = el.attrs['data-img'] ?? el.attrs.src ?? '';
  const img = ctx.images.get(key);
  if (!img || !EXT[img.mime]) return '';
  let id = ctx.imgIds.get(key);
  if (!id) {
    id = `rIdImg${ctx.imgIds.size + 1}`;
    const name = `media/image${ctx.imgIds.size + 1}.${EXT[img.mime]}`;
    ctx.imgIds.set(key, id);
    ctx.rels.push({ id, target: name, type: 'image' });
    ctx.media.push([`word/${name}`, img.bytes]);
  }
  const w = Number(el.attrs.width) || img.width || 200;
  let h = Number(el.attrs.height) || img.height || 0;
  if (!h) h = img.width && img.height ? Math.round((w * img.height) / img.width) : Math.round(w * 0.75);
  let cx = w * 9525, cy = h * 9525;
  const max = ctx.width * 635; // twip → EMU
  if (cx > max) { cy = Math.round((cy * max) / cx); cx = max; }
  const n = ++ctx.pid;
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Hình ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="image${n}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

const INLINE = new Set(['span', 'b', 'strong', 'i', 'em', 'u', 's', 'sup', 'sub', 'a', 'br', 'img', 'font', 'small', 'big', 'label', 'code']);
const isInline = (n: Node) => !isEl(n) || INLINE.has(n.tag);

function runs(nodes: Node[], r: RP, ctx: Ctx): string {
  let out = '';
  for (const n of nodes) {
    if (!isEl(n)) {
      const t = n.text.replace(/[\r\n\t]+/g, ' ');
      if (!t) continue;
      // tab → w:tab; giữ khoảng trắng đầu/cuối
      out += t.split(' ').map((part, i) => `${i ? `<w:r>${rPrXml(r)}<w:tab/></w:r>` : ''}${part ? `<w:r>${rPrXml(r)}<w:t xml:space="preserve">${x(part)}</w:t></w:r>` : ''}`).join('');
      continue;
    }
    if (n.tag === 'br') { out += /page-break-before:\s*always/.test(n.attrs.style ?? '') ? '<w:r><w:br w:type="page"/></w:r>' : `<w:r>${rPrXml(r)}<w:br/></w:r>`; continue; }
    if (n.tag === 'img') { out += imageRun(n, ctx); continue; }
    out += runs(n.kids, runFrom(n, r), ctx);
  }
  return out;
}

function paragraph(inl: Node[], r: RP, p: PP, ctx: Ctx): string {
  const pbb = ctx.pendingBreak; ctx.pendingBreak = false;
  return `<w:p>${pPrXml(p, pbb, rPrXml(r))}${runs(inl, r, ctx)}</w:p>`;
}

/** chuyển các nút cấp khối thành XML (w:p, w:tbl) */
function blocks(nodes: Node[], r: RP, p: PP, ctx: Ctx): string[] {
  const out: string[] = [];
  let line: Node[] = [];
  const flush = () => {
    if (line.some((n) => (isEl(n) ? true : n.text.trim()))) out.push(paragraph(line, r, p, ctx));
    line = [];
  };
  for (const n of nodes) {
    if (isInline(n)) {
      // <br style="page-break-before:always"> đứng riêng = ngắt trang
      if (isEl(n) && n.tag === 'br' && /page-break-before:\s*always/.test(n.attrs.style ?? '') && !line.some((k) => !isEl(k) ? k.text.trim() : true)) { line = []; ctx.pendingBreak = true; continue; }
      line.push(n); continue;
    }
    flush();
    const el = n as El;
    const s = css(el.attrs.style);
    if (s['page-break-before'] === 'always' && el.tag !== 'p') ctx.pendingBreak = true;
    if (el.tag === 'table') { out.push(...table(el, r, ctx)); continue; }
    if (el.tag === 'p' || /^h[1-6]$/.test(el.tag) || el.tag === 'li') {
      const rr = runFrom(el, r), pp = { ...p, ...paraFrom(el) };
      if (el.tag === 'p' && !('margin' in s) && !('margin-bottom' in s) && pp.after === undefined) pp.after = 6;
      // đoạn chỉ chứa ngắt trang
      const onlyBreak = el.kids.every((k) => isEl(k) ? false : !k.text.replace(/ /g, '').trim()) && pp.pbb;
      if (onlyBreak) { ctx.pendingBreak = true; continue; }
      // đoạn có bảng/khối con (HTML không chuẩn): xử lí như div
      if (el.kids.some((k) => !isInline(k))) { out.push(...blocks(el.kids, rr, pp, ctx)); continue; }
      out.push(paragraph(el.kids, rr, pp, ctx));
      continue;
    }
    if (el.tag === 'div' && /\bLand\b/.test(el.attrs.class ?? '')) {
      const w = ctx.width; ctx.width = LAND_W;
      out.push(...blocks(el.kids, runFrom(el, r), { ...p, ...paraFrom(el) }, ctx));
      ctx.width = w;
      // kết thúc phần trang ngang
      out.push(`<w:p><w:pPr><w:sectPr>${sect(true)}</w:sectPr></w:pPr></w:p>`);
      continue;
    }
    // div, section, ul, ol, body, html…
    out.push(...blocks(el.kids, runFrom(el, r), { ...p, ...paraFrom(el), pbb: false }, ctx));
  }
  flush();
  return out;
}

function table(el: El, r: RP, ctx: Ctx): string[] {
  const s = css(el.attrs.style);
  const bordered = (el.attrs.border && el.attrs.border !== '0') || /solid/.test(s.border ?? '');
  const rows: El[] = [];
  const collect = (e: El) => { for (const k of e.kids) if (isEl(k)) { if (k.tag === 'tr') rows.push(k); else if (['tbody', 'thead', 'tfoot'].includes(k.tag)) collect(k); } };
  collect(el);
  if (!rows.length) return [];
  type C = { el: El; col: number; span: number; rows: number };
  // xếp ô vào lưới (có rowspan)
  const grid: (C | 'cont' | null)[][] = [];
  const placed: C[][] = rows.map(() => []);
  rows.forEach((tr, ri) => {
    grid[ri] ??= [];
    let col = 0;
    for (const td of tr.kids.filter((k): k is El => isEl(k) && (k.tag === 'td' || k.tag === 'th'))) {
      while (grid[ri][col]) col++;
      const span = Math.max(1, Number(td.attrs.colspan) || 1), rs = Math.max(1, Number(td.attrs.rowspan) || 1);
      const c: C = { el: td, col, span, rows: rs };
      for (let k = 0; k < rs; k++) { grid[ri + k] ??= []; for (let j = 0; j < span; j++) grid[ri + k][col + j] = k === 0 && j === 0 ? c : k === 0 ? null : 'cont'; }
      // ô bị gộp theo chiều ngang ở hàng đầu: đánh dấu null (không xuất)
      placed[ri].push(c);
      col += span;
    }
  });
  const ncol = Math.max(1, ...grid.map((g) => g.length));
  // bề rộng cột: lấy từ hàng có đủ ô đơn, theo % hoặc chia đều
  const widths = new Array(ncol).fill(0);
  for (const row of placed) for (const c of row) if (c.span === 1) { const w = c.el.attrs.width ?? css(c.el.attrs.style).width; const pct = w && /%$/.test(w) ? Number(w.replace('%', '')) : 0; if (pct && !widths[c.col]) widths[c.col] = pct; }
  const known = widths.reduce((a, b) => a + b, 0);
  const unknown = widths.filter((w) => !w).length;
  for (let i = 0; i < ncol; i++) if (!widths[i]) widths[i] = unknown ? Math.max(5, (100 - known) / unknown) : 100 / ncol;
  const sum = widths.reduce((a, b) => a + b, 0);
  const tblW = ctx.width;
  const colW = widths.map((w) => Math.round((w / sum) * tblW));
  const border = bordered ? '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders>' : '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';
  const jc = /margin-left:\s*auto/.test(el.attrs.style ?? '') || el.attrs.align === 'center' ? '<w:jc w:val="center"/>' : '';
  const outerW = ctx.width;
  const trs = rows.map((tr, ri) => {
    const trs = css(tr.attrs.style);
    const h = pt(trs.height);
    const isHead = tr.kids.some((k) => isEl(k) && k.tag === 'th') && ri === 0;
    const trPr = h || isHead ? `<w:trPr>${h ? `<w:trHeight w:val="${tw(h)}"/>` : ''}${isHead ? '<w:tblHeader/>' : ''}</w:trPr>` : '';
    let cells = '';
    for (let col = 0; col < ncol;) {
      const g = grid[ri]?.[col];
      if (g && g !== 'cont') {
        const c = g;
        const w = colW.slice(c.col, c.col + c.span).reduce((a, b) => a + b, 0);
        const cs = css(c.el.attrs.style);
        const fill = hex(c.el.attrs.bgcolor) ?? hex(cs.background ?? cs['background-color']);
        const va = cs['vertical-align'] ?? c.el.attrs.valign;
        const top = /solid/.test(cs['border-top'] ?? '') && !bordered;
        const tcPr = `<w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${c.span > 1 ? `<w:gridSpan w:val="${c.span}"/>` : ''}${c.rows > 1 ? '<w:vMerge w:val="restart"/>' : ''}${top ? '<w:tcBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/></w:tcBorders>' : ''}${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ''}${va === 'middle' || va === 'center' ? '<w:vAlign w:val="center"/>' : va === 'bottom' ? '<w:vAlign w:val="bottom"/>' : ''}</w:tcPr>`;
        ctx.width = Math.max(600, w - 216);
        const cr = runFrom(c.el, r);
        const inner = blocks(c.el.kids, cr, { ...paraFrom(c.el), after: 0 }, ctx);
        ctx.width = outerW;
        if (!inner.length || !inner[inner.length - 1].startsWith('<w:p>')) inner.push(`<w:p>${pPrXml({ after: 0 }, false)}</w:p>`);
        cells += `<w:tc>${tcPr}${inner.join('')}</w:tc>`;
        col += c.span;
      } else if (g === 'cont') {
        // ô nằm dưới ô gộp dọc: tìm ô gốc để biết bề ngang
        let k = ri - 1; let origin: C | null = null;
        while (k >= 0 && !origin) { const gg = grid[k][col]; if (gg && gg !== 'cont') origin = gg; k--; }
        const span = origin?.span ?? 1;
        const w = colW.slice(col, col + span).reduce((a, b) => a + b, 0);
        cells += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}<w:vMerge/></w:tcPr><w:p>${pPrXml({ after: 0 }, false)}</w:p></w:tc>`;
        col += span;
      } else {
        // thiếu ô (hàng ngắn hơn lưới): thêm ô trống để bảng hợp lệ
        cells += `<w:tc><w:tcPr><w:tcW w:w="${colW[col]}" w:type="dxa"/></w:tcPr><w:p>${pPrXml({ after: 0 }, false)}</w:p></w:tc>`;
        col++;
      }
    }
    return `<w:tr>${trPr}${cells}</w:tr>`;
  }).join('');
  const pbb = ctx.pendingBreak;
  ctx.pendingBreak = false;
  const pre = pbb ? `<w:p><w:pPr><w:pageBreakBefore/><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>` : '';
  return [`${pre}<w:tbl><w:tblPr><w:tblW w:w="${tblW}" w:type="dxa"/>${jc}${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="28" w:type="dxa"/><w:left w:w="85" w:type="dxa"/><w:bottom w:w="28" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>${colW.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${trs}</w:tbl>`, `<w:p>${pPrXml({ after: 0, line: 1 }, false)}</w:p>`];
}

const sect = (land: boolean) => land
  ? '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1417" w:header="567" w:footer="567" w:gutter="0"/>'
  : '<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1701" w:header="567" w:footer="567" w:gutter="0"/>';

const enc = (s: string) => new TextEncoder().encode(s);

/**
 * HTML → file .docx. images: khoá của <img data-img="…"> (hoặc src) → nội dung hình.
 * Mặc định: Times New Roman 14, A4 dọc; khối <div class="Land"> thành phần trang ngang.
 */
export function htmlToDocx(html: string, images: Map<string, DocImage> = new Map(), opts: { title?: string; fontSize?: number } = {}): Uint8Array {
  const root = parseHtml(html);
  const body = root.kids.find((k): k is El => isEl(k) && k.tag === 'html')?.kids.find((k): k is El => isEl(k) && k.tag === 'body') ?? root;
  const ctx: Ctx = { images, rels: [], media: [], imgIds: new Map(), pid: 0, width: PORTRAIT_W, pendingBreak: false };
  const xml = blocks(body.kids, {}, {}, ctx).join('');
  const sz = Math.round((opts.fontSize ?? 14) * 2);
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${W}><w:body>${xml}<w:sectPr>${sect(false)}</w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:lang w:val="vi-VN" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${ctx.rels.map((r) => `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${r.target}"/>`).join('')}</Relationships>`;
  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="bmp" ContentType="image/bmp"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const root2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(opts.title ?? 'Kế hoạch bài dạy')}</dc:title><dc:creator>EduChain Kids</dc:creator></cp:coreProperties>`;
  return zipStore([
    [enc('[Content_Types].xml'), enc(types)],
    [enc('_rels/.rels'), enc(root2)],
    [enc('docProps/core.xml'), enc(core)],
    [enc('word/document.xml'), enc(doc)],
    [enc('word/styles.xml'), enc(styles)],
    [enc('word/_rels/document.xml.rels'), enc(rels)],
    ...ctx.media.map(([n, b]) => [enc(n), b] as [Uint8Array, Uint8Array]),
  ]);
}
