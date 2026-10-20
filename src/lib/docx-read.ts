// Đọc văn bản Word .docx không cần thư viện: lấy word/document.xml, tách đoạn văn và bảng theo thứ tự.
// Mỗi khối có: phần chữ (để nhận mục I/II/III/IV, bảng hoạt động…) và bản HTML giữ nguyên trình bày của file gốc
// (đậm, nghiêng, gạch chân, màu chữ, cỡ chữ, căn lề, thụt dòng, bảng có gộp ô và tô nền, hình ảnh) để xem trước
// và xuất lại Word đúng như bản giáo viên đã soạn. Chạy được trên trình duyệt và Node ≥ 18.

import { unzip } from './xlsx-read';

export type DocBlock =
  /** html: đoạn văn đã chuyển sang HTML (hình ghi là <img data-img="word/media/…">) */
  | { t: 'p'; text: string; bold: boolean; html: string }
  /** bảng: rows[r][c] là chữ trong ô (nhiều đoạn nối bằng \n) */
  | { t: 'table'; rows: string[][]; html: string };

export type DocxFull = {
  blocks: DocBlock[];
  /** hình trong file: đường dẫn trong gói (vd "word/media/image1.jpg") → nội dung */
  media: Map<string, Uint8Array>;
};

const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (xml: string, tag: string, name = 'w:val') => new RegExp(`<${tag}\\b[^>]*?\\s${name}="([^"]*)"`).exec(xml)?.[1];
/** w:b, w:i… bật/tắt (thiếu w:val = bật) */
const flag = (xml: string, tag: string): boolean | undefined => {
  const m = new RegExp(`<${tag}(\\s[^>]*)?/?>`).exec(xml);
  if (!m) return undefined;
  const v = /w:val="([^"]*)"/.exec(m[1] ?? '')?.[1];
  return !(v === '0' || v === 'false' || v === 'none');
};

// ------------------------------------------------------------------ chữ thuần (để nhận cấu trúc giáo án)

const STRIP = (x: string) => x
  .replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, '')
  .replace(/<w:pict>[\s\S]*?<\/w:pict>/g, '')
  .replace(/<w:object\b[\s\S]*?<\/w:object>/g, '');

/** chữ của một đoạn <w:p> */
function paraText(xml: string): { text: string; bold: boolean } {
  let text = '';
  let boldChars = 0, chars = 0;
  for (const r of STRIP(xml).replace(/<w:r\b[^>]*\/>/g, '').matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
    const body = r[1];
    const isBold = /<w:b\/>|<w:b w:val="(1|true|on)"\/>/.test(body.split('</w:rPr>')[0] ?? '');
    for (const m of body.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:cr\/>/g)) {
      const s = m[1] !== undefined ? unxml(m[1]) : m[0] === '<w:tab/>' ? ' ' : '\n';
      text += s;
      const n = s.trim().length;
      chars += n;
      if (isBold) boldChars += n;
    }
  }
  text = text.replace(/[  ]+/g, ' ').replace(/ *\n */g, '\n').trim();
  return { text, bold: chars > 0 && boldChars / chars > 0.6 };
}

/** tìm thẻ đóng tương ứng (có lồng nhau) */
function closeOf(xml: string, from: number, tag: string): number {
  const open = new RegExp(`<${tag}[\\s>]`, 'g'), close = `</${tag}>`;
  let depth = 1, pos = from;
  while (depth > 0) {
    const c = xml.indexOf(close, pos);
    if (c < 0) return xml.length;
    open.lastIndex = pos;
    let o: RegExpExecArray | null;
    while ((o = open.exec(xml)) && o.index < c) depth++;
    depth--;
    pos = c + close.length;
  }
  return pos;
}

/** các phần tử con trực tiếp <tag> trong một khối */
function children(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}[\\s>]`, 'g');
  let m: RegExpExecArray | null;
  let pos = 0;
  while ((re.lastIndex = pos, m = re.exec(xml))) {
    const end = closeOf(xml, m.index + tag.length + 1, tag);
    out.push(xml.slice(m.index, end));
    pos = end;
  }
  return out;
}

function cellText(tc: string): string {
  return [...tc.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((m) => paraText(m[0]).text).filter(Boolean).join('\n');
}
const tableRows = (tbl: string) => children(tbl, 'w:tr').map((tr) => children(tr, 'w:tc').map(cellText));

// ------------------------------------------------------------------ HTML giữ trình bày

type RunProps = { b?: boolean; i?: boolean; u?: boolean; strike?: boolean; color?: string; sz?: number; hl?: string; caps?: boolean; va?: string };
type ParaProps = { jc?: string; before?: number; after?: number; left?: number; first?: number; line?: number };
type Style = { basedOn?: string; r: RunProps; p: ParaProps };
type Ctx = { styles: Map<string, Style>; def: { r: RunProps; p: ParaProps }; rels: Map<string, string> };

const HL: Record<string, string> = { yellow: '#ffff00', green: '#00ff00', cyan: '#00ffff', magenta: '#ff00ff', blue: '#0000ff', red: '#ff0000', darkBlue: '#000080', darkCyan: '#008080', darkGreen: '#008000', darkMagenta: '#800080', darkRed: '#800000', darkYellow: '#808000', darkGray: '#808080', lightGray: '#c0c0c0', black: '#000000' };

function runProps(rPr: string): RunProps {
  const p: RunProps = {};
  const b = flag(rPr, 'w:b'); if (b !== undefined) p.b = b;
  const i = flag(rPr, 'w:i'); if (i !== undefined) p.i = i;
  const u = attr(rPr, 'w:u'); if (u !== undefined) p.u = u !== 'none';
  const s = flag(rPr, 'w:strike'); if (s !== undefined) p.strike = s;
  const c = attr(rPr, 'w:color'); if (c && c !== 'auto' && /^[0-9a-f]{6}$/i.test(c)) p.color = `#${c}`;
  const sz = attr(rPr, 'w:sz'); if (sz) p.sz = Number(sz) / 2;
  const hl = attr(rPr, 'w:highlight'); if (hl && HL[hl]) p.hl = HL[hl];
  const shd = attr(rPr, 'w:shd', 'w:fill'); if (!p.hl && shd && /^[0-9a-f]{6}$/i.test(shd)) p.hl = `#${shd}`;
  const caps = flag(rPr, 'w:caps'); if (caps !== undefined) p.caps = caps;
  const va = attr(rPr, 'w:vertAlign'); if (va && va !== 'baseline') p.va = va;
  return p;
}
function paraProps(pPr: string): ParaProps {
  const p: ParaProps = {};
  const jc = attr(pPr, 'w:jc'); if (jc) p.jc = jc;
  const sp = /<w:spacing\b[^>]*>/.exec(pPr)?.[0] ?? '';
  const bf = /w:before="(\d+)"/.exec(sp)?.[1]; if (bf) p.before = Number(bf) / 20;
  const af = /w:after="(\d+)"/.exec(sp)?.[1]; if (af) p.after = Number(af) / 20;
  const ln = /w:line="(\d+)"/.exec(sp)?.[1]; if (ln && /w:lineRule="auto"/.test(sp) || ln && !/w:lineRule=/.test(sp)) p.line = Number(ln) / 240;
  const ind = /<w:ind\b[^>]*>/.exec(pPr)?.[0] ?? '';
  const l = /w:(?:left|start)="(-?\d+)"/.exec(ind)?.[1]; if (l) p.left = Number(l) / 20;
  const f = /w:firstLine="(\d+)"/.exec(ind)?.[1]; if (f) p.first = Number(f) / 20;
  const h = /w:hanging="(\d+)"/.exec(ind)?.[1]; if (h) p.first = -Number(h) / 20;
  return p;
}

function parseStyles(xml: string): Pick<Ctx, 'styles' | 'def'> {
  const styles = new Map<string, Style>();
  for (const m of xml.matchAll(/<w:style\b([^>]*)>([\s\S]*?)<\/w:style>/g)) {
    const id = /w:styleId="([^"]*)"/.exec(m[1])?.[1];
    if (!id) continue;
    const body = m[2];
    styles.set(id, {
      basedOn: attr(body, 'w:basedOn'),
      r: runProps(/<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(body)?.[1] ?? ''),
      p: paraProps(/<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(body)?.[1] ?? ''),
    });
  }
  const dr = /<w:rPrDefault>([\s\S]*?)<\/w:rPrDefault>/.exec(xml)?.[1] ?? '';
  const dp = /<w:pPrDefault>([\s\S]*?)<\/w:pPrDefault>/.exec(xml)?.[1] ?? '';
  return { styles, def: { r: runProps(dr), p: paraProps(dp) } };
}
function styleChain(ctx: Ctx, id: string | undefined): Style[] {
  const out: Style[] = [];
  const seen = new Set<string>();
  while (id && !seen.has(id)) { seen.add(id); const s = ctx.styles.get(id); if (!s) break; out.unshift(s); id = s.basedOn; }
  return out;
}

const runCss = (r: RunProps, base: RunProps) => {
  const c: string[] = [];
  if (r.b) c.push('font-weight:bold'); else if (base.b) c.push('font-weight:normal');
  if (r.i) c.push('font-style:italic');
  const deco = [r.u && 'underline', r.strike && 'line-through'].filter(Boolean).join(' ');
  if (deco) c.push(`text-decoration:${deco}`);
  if (r.color) c.push(`color:${r.color}`);
  if (r.sz && r.sz !== base.sz) c.push(`font-size:${r.sz}pt`);
  if (r.hl) c.push(`background:${r.hl}`);
  if (r.caps) c.push('text-transform:uppercase');
  if (r.va === 'superscript') c.push('vertical-align:super;font-size:smaller');
  if (r.va === 'subscript') c.push('vertical-align:sub;font-size:smaller');
  return c.join(';');
};

const EMU_PX = 9525;
function drawingHtml(xml: string, ctx: Ctx): string {
  const rid = /<a:blip\b[^>]*r:(?:embed|link)="([^"]*)"/.exec(xml)?.[1] ?? /<v:imagedata\b[^>]*r:id="([^"]*)"/.exec(xml)?.[1];
  const target = rid ? ctx.rels.get(rid) : undefined;
  if (!target) return '';
  let w = 0, h = 0;
  const ext = /<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/.exec(xml);
  if (ext) { w = Math.round(Number(ext[1]) / EMU_PX); h = Math.round(Number(ext[2]) / EMU_PX); }
  else {
    const st = /style="([^"]*)"/.exec(/<v:shape\b[^>]*>/.exec(xml)?.[0] ?? '')?.[1] ?? '';
    const pw = /width:([\d.]+)pt/.exec(st)?.[1], ph = /height:([\d.]+)pt/.exec(st)?.[1];
    if (pw && ph) { w = Math.round(Number(pw) * 4 / 3); h = Math.round(Number(ph) * 4 / 3); }
  }
  const floatAnchor = /<wp:anchor\b/.test(xml);
  return `<img data-img="${esc(target)}"${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''} alt=""${floatAnchor ? ' style="display:block;margin:4pt auto"' : ''} />`;
}

function paraHtml(xml: string, ctx: Ctx): string {
  const pPr = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(xml)?.[1] ?? '';
  const chain = styleChain(ctx, attr(pPr, 'w:pStyle') ?? 'Normal');
  const pp: ParaProps = Object.assign({}, ctx.def.p, ...chain.map((s) => s.p), paraProps(pPr.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/, '')));
  const base: RunProps = Object.assign({}, ctx.def.r, ...chain.map((s) => s.r));
  let inner = '';
  // đọc lần lượt các run (cả trong hyperlink, ins), bỏ qua phần đã xoá
  const body = xml.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, '').replace(/<w:del\b[\s\S]*?<\/w:del>/g, '').replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '');
  for (const r of body.replace(/<w:r\b[^>]*\/>/g, '').matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
    const rb = r[1];
    const rPr = /^\s*<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(rb)?.[1] ?? '';
    const rs = attr(rPr, 'w:rStyle');
    const props: RunProps = Object.assign({}, base, ...styleChain(ctx, rs).map((s) => s.r), runProps(rPr));
    let out = '';
    for (const m of rb.replace(/^\s*<w:rPr>[\s\S]*?<\/w:rPr>/, '').matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|<w:cr\/>|<w:sym\b[^>]*\/>|<w:drawing>[\s\S]*?<\/w:drawing>|<w:pict>[\s\S]*?<\/w:pict>|<mc:AlternateContent>[\s\S]*?<\/mc:AlternateContent>/g)) {
      const t = m[0];
      if (m[1] !== undefined) out += esc(unxml(m[1])).replace(/ {2}/g, ' &nbsp;');
      else if (t === '<w:tab/>') out += '&emsp;';
      else if (t.startsWith('<w:br') || t === '<w:cr/>') out += /w:type="page"/.test(t) ? '' : '<br/>';
      else if (t.startsWith('<w:sym')) { const ch = /w:char="([0-9A-F]+)"/i.exec(t)?.[1]; if (ch) out += `&#x${ch.replace(/^F0/i, '')};`; }
      else out += drawingHtml(t, ctx);
    }
    if (!out) continue;
    const css = runCss(props, base);
    inner += css ? `<span style="${css}">${out}</span>` : out;
  }
  const css: string[] = [];
  if (pp.jc) css.push(`text-align:${pp.jc === 'both' || pp.jc === 'distribute' ? 'justify' : pp.jc === 'end' ? 'right' : pp.jc === 'start' ? 'left' : pp.jc}`);
  css.push(`margin:${pp.before ?? 0}pt 0 ${pp.after ?? 0}pt ${pp.left ?? 0}pt`);
  if (pp.first) css.push(`text-indent:${pp.first}pt`);
  if (pp.line) css.push(`line-height:${Math.round(pp.line * 100) / 100}`);
  if (base.sz) css.push(`font-size:${base.sz}pt`);
  if (base.b) css.push('font-weight:bold');
  if (base.color) css.push(`color:${base.color}`);
  return `<p style="${css.join(';')}">${inner || '&nbsp;'}</p>`;
}

function tableHtml(xml: string, ctx: Ctx): string {
  const tblPr = /<w:tblPr>([\s\S]*?)<\/w:tblPr>/.exec(xml)?.[1] ?? '';
  const grid = [...(/<w:tblGrid>([\s\S]*?)<\/w:tblGrid>/.exec(xml)?.[1] ?? '').matchAll(/<w:gridCol\b[^>]*w:w="(\d+)"/g)].map((m) => Number(m[1]));
  const total = grid.reduce((a, b) => a + b, 0) || 1;
  const borders = /<w:tblBorders>([\s\S]*?)<\/w:tblBorders>/.exec(tblPr)?.[1];
  const noBorder = borders ? !/w:val="(single|thick|double|dotted|dashed)"/.test(borders) : !/TableGrid|Grid|Table/i.test(attr(tblPr, 'w:tblStyle') ?? '');
  const bd = noBorder ? '' : 'border:1px solid #000;';
  const rows = children(xml, 'w:tr');
  // vMerge: ô "restart" nhận rowspan = số ô "continue" bên dưới cùng cột lưới
  type Cell = { xml: string; col: number; span: number; vm: 'restart' | 'cont' | null; rowspan: number };
  const cells: Cell[][] = rows.map((tr) => {
    let col = 0;
    return children(tr, 'w:tc').map((tc) => {
      const tcPr = /<w:tcPr>([\s\S]*?)<\/w:tcPr>/.exec(tc)?.[1] ?? '';
      const span = Number(attr(tcPr, 'w:gridSpan') ?? 1) || 1;
      const vmTag = /<w:vMerge(\s[^>]*)?\/?>/.exec(tcPr);
      const vm = vmTag ? (/w:val="restart"/.test(vmTag[0]) ? 'restart' : 'cont') : null;
      const c: Cell = { xml: tc, col, span, vm, rowspan: 1 };
      col += span;
      return c;
    });
  });
  for (let r = 0; r < cells.length; r++) for (const c of cells[r]) {
    if (c.vm !== 'restart') continue;
    for (let k = r + 1; k < cells.length; k++) { const below = cells[k].find((x) => x.col === c.col); if (below?.vm === 'cont') c.rowspan++; else break; }
  }
  const body = cells.map((row, r) => {
    const tr = rows[r];
    const height = attr(/<w:trPr>([\s\S]*?)<\/w:trPr>/.exec(tr)?.[1] ?? '', 'w:trHeight');
    const tds = row.filter((c) => c.vm !== 'cont').map((c) => {
      const tcPr = /<w:tcPr>([\s\S]*?)<\/w:tcPr>/.exec(c.xml)?.[1] ?? '';
      const fill = attr(tcPr, 'w:shd', 'w:fill');
      const va = attr(tcPr, 'w:vAlign');
      const w = grid.slice(c.col, c.col + c.span).reduce((a, b) => a + b, 0);
      const css = [bd, 'padding:2pt 4pt', `vertical-align:${va === 'center' ? 'middle' : va === 'bottom' ? 'bottom' : 'top'}`];
      if (fill && /^[0-9a-f]{6}$/i.test(fill)) css.push(`background:#${fill}`);
      const inner = cellContent(c.xml.replace(/<w:tcPr>[\s\S]*?<\/w:tcPr>/, ''), ctx);
      return `<td${c.span > 1 ? ` colspan="${c.span}"` : ''}${c.rowspan > 1 ? ` rowspan="${c.rowspan}"` : ''}${w ? ` width="${Math.round((w / total) * 100)}%"` : ''}${fill && /^[0-9a-f]{6}$/i.test(fill) ? ` bgcolor="#${fill}"` : ''} style="${css.join(';')}">${inner}</td>`;
    }).join('');
    return `<tr${height ? ` style="height:${Math.round(Number(height) / 20)}pt"` : ''}>${tds}</tr>`;
  }).join('');
  const jc = attr(tblPr, 'w:jc');
  return `<table width="100%" cellspacing="0" cellpadding="3"${noBorder ? '' : ' border="1"'} style="border-collapse:collapse;width:100%;margin:2pt 0${jc === 'center' ? ';margin-left:auto;margin-right:auto' : ''}">${body}</table>`;
}

function cellContent(xml: string, ctx: Ctx): string {
  let out = '';
  const re = /<w:p[\s>]|<w:tbl>/g;
  let m: RegExpExecArray | null;
  let pos = 0;
  while ((re.lastIndex = pos, m = re.exec(xml))) {
    if (m[0] === '<w:tbl>') { const end = closeOf(xml, m.index + 7, 'w:tbl'); out += tableHtml(xml.slice(m.index, end), ctx); pos = end; }
    else { const end = closeOf(xml, m.index + 4, 'w:p'); out += paraHtml(xml.slice(m.index, end), ctx); pos = end; }
  }
  return out || '&nbsp;';
}

// ------------------------------------------------------------------ đọc tài liệu

/** Đọc toàn bộ: các khối (chữ + HTML) và hình ảnh */
export async function readDocxFull(buf: ArrayBuffer | Uint8Array): Promise<DocxFull> {
  const files = await unzip(buf, (n) => n === 'word/document.xml' || n === 'word/styles.xml' || n === 'word/_rels/document.xml.rels' || n.startsWith('word/media/'));
  const raw = files.get('word/document.xml');
  if (!raw) throw new Error('Không phải file Word .docx (nếu là .doc, mở bằng Word rồi “Lưu thành” .docx).');
  const dec = new TextDecoder();
  const rels = new Map<string, string>();
  for (const m of dec.decode(files.get('word/_rels/document.xml.rels') ?? new Uint8Array()).matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]*)"/.exec(m[0])?.[1], target = /Target="([^"]*)"/.exec(m[0])?.[1];
    if (id && target && /\/image"/.test(m[0]) && !/TargetMode="External"/.test(m[0])) rels.set(id, target.startsWith('/') ? target.slice(1) : `word/${target.replace(/^\.\//, '')}`);
  }
  const ctx: Ctx = { ...parseStyles(dec.decode(files.get('word/styles.xml') ?? new Uint8Array())), rels };
  let xml = dec.decode(raw);
  const b = xml.indexOf('<w:body>');
  const e = xml.lastIndexOf('</w:body>');
  xml = xml.slice(b >= 0 ? b + 8 : 0, e > 0 ? e : undefined)
    .replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '')
    // chữ trong khung (text box) nằm lồng trong hình: bỏ để không làm lệch việc tách đoạn
    .replace(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g, '')
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '')
    .replace(/<w:del\b[\s\S]*?<\/w:del>/g, '');
  const blocks: DocBlock[] = [];
  const re = /<w:p[\s>]|<w:tbl>|<w:sdt>/g;
  let m: RegExpExecArray | null;
  let pos = 0;
  let blank = 0;
  while ((re.lastIndex = pos, m = re.exec(xml))) {
    if (m[0] === '<w:tbl>') {
      const end = closeOf(xml, m.index + 7, 'w:tbl');
      const t = xml.slice(m.index, end);
      const rows = tableRows(t).filter((r) => r.some((c) => c));
      const html = tableHtml(t, ctx);
      if (rows.length || /<img/.test(html)) blocks.push({ t: 'table', rows, html });
      pos = end; blank = 0;
    } else if (m[0] === '<w:sdt>') {
      pos = m.index + 7;
    } else {
      const end = closeOf(xml, m.index + 4, 'w:p');
      const px = xml.slice(m.index, end);
      const p = paraText(px);
      const html = paraHtml(px, ctx);
      const img = /<img/.test(html);
      // giữ tối đa 1 dòng trống liên tiếp (khoảng cách như bản gốc)
      if (p.text || img) { blocks.push({ t: 'p', ...p, html }); blank = 0; }
      else if (!blank++) blocks.push({ t: 'p', text: '', bold: false, html });
      pos = end;
    }
  }
  const media = new Map<string, Uint8Array>();
  for (const [k, v] of files) if (k.startsWith('word/media/')) media.set(k, v);
  return { blocks, media };
}

/** Chỉ các khối (chữ + HTML) */
export async function readDocx(buf: ArrayBuffer | Uint8Array): Promise<DocBlock[]> {
  return (await readDocxFull(buf)).blocks;
}
