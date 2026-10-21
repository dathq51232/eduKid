// Sinh phiếu chính tả lớp 1 từ kho từ tự soạn (bank.ts): mỗi lần một phiếu khác (theo số ngẫu nhiên),
// có tranh, bài điền chữ, tập chép và trang đáp án. Xuất HTML dùng chung cho xem trước / in PDF / Word.

import { PAIRS, pairById, splitWord, toneless, type PairId } from './bank';
import { fitsLesson, NO_LIMIT, pairLesson, pairWeek } from './curriculum';

export type SheetOptions = {
  pairs: PairId[];
  /** số câu có tranh của mỗi cặp âm */
  picCount: number;
  /** số từ điền chữ (không tranh) của mỗi cặp âm */
  wordCount: number;
  copy: boolean;
  seed: number;
  title?: string;
  /** bài cuối lớp đã học (Tiếng Việt 1): phiếu chỉ dùng âm, vần, dấu đã học; bỏ trống = không giới hạn */
  lesson?: number;
  /** dòng ghi phạm vi in trên phiếu, vd "Tuần 7 · Bài 31–35" */
  scope?: string;
};
export type Item = { pic?: string; w: string; parts: { text: string; ans?: string }[]; ans: string[]; full: string };
export type Section = { kind: 'pics' | 'words' | 'copy'; pair?: PairId; heading: string; items: Item[]; sentences?: string[] };
export type Sheet = { title: string; subtitle: string; rules: string[]; sections: Section[]; seed: number; scope?: string;
  /** nhắc giáo viên: cặp chưa học, hoặc tuần này chưa đủ từ cho số câu đã chọn */
  notes: string[] };

/** số ngẫu nhiên lặp lại được theo seed (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle<T>(a: T[], r: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
/** chọn n từ, chia đều theo các âm của cặp (vd 4 c + 4 k), rồi trộn */
function balanced(words: string[], options: string[], n: number, r: () => number, picOf?: (w: string) => string): string[] {
  const groups = options.map((o) => shuffle(words.filter((w) => toneless(splitWord(w).ans[0]) === o), r));
  const out: string[] = [];
  const used = new Set<string>();
  let i = 0;
  while (out.length < n && groups.some((g) => g.length)) {
    const g = groups[i++ % groups.length];
    const w = g.shift();
    if (!w) continue;
    const pic = picOf?.(w);
    if (pic && used.has(pic)) continue; // một hình chỉ dùng một lần trong phiếu
    if (pic) used.add(pic);
    out.push(w);
  }
  return shuffle(out, r);
}
const item = (w: string, pic?: string): Item => ({ pic, w, ...splitWord(w) });
const orList = (o: string[]) => (o.length === 2 ? `${o[0]} hoặc ${o[1]}` : `${o.slice(0, -1).join(', ')} hoặc ${o[o.length - 1]}`);

export function makeSheet(opt: SheetOptions): Sheet {
  const r = rng(opt.seed);
  const lesson = opt.lesson ?? NO_LIMIT;
  const fit = (t: string) => fitsLesson(t, lesson);
  const notes: string[] = [];
  const pairs = opt.pairs.map(pairById).filter((p) => {
    if (pairLesson(p) <= lesson) return true;
    notes.push(`${p.title}: lớp chưa học (học xong ở tuần ${pairWeek(p)}), nên không đưa vào phiếu.`);
    return false;
  });
  const sections: Section[] = [];
  const copyPool = new Map(pairs.map((p) => [p.id, p.copy.filter(fit)]));
  for (const p of pairs) {
    const what = p.kind === 'van' ? `vần ${orList(p.options)}` : orList(p.options);
    if (opt.picCount > 0) {
      const pool = p.pics.filter((x) => fit(x.w));
      const picOf = (w: string) => pool.find((x) => x.w === w)!.pic;
      const chosen = balanced(pool.map((x) => x.w), p.options, opt.picCount, r, picOf);
      if (chosen.length) sections.push({ kind: 'pics', pair: p.id, heading: `Điền vào chỗ trống ${what}`, items: chosen.map((w) => item(w, picOf(w))) });
      if (chosen.length < opt.picCount) notes.push(`${p.title}: với bài đã học, mới có ${chosen.length} câu có tranh phù hợp (chọn ${opt.picCount}).`);
    }
    if (opt.wordCount > 0) {
      const chosen = balanced(p.words.filter(fit), p.options, opt.wordCount, r);
      if (chosen.length) sections.push({ kind: 'words', pair: p.id, heading: p.kind === 'van' ? `Điền ${what} vào chỗ chấm (thêm dấu thanh nếu có)` : `Điền ${p.options.join(' / ')} vào chỗ chấm`, items: chosen.map((w) => item(w)) });
      if (chosen.length < opt.wordCount) notes.push(`${p.title}: với bài đã học, mới có ${chosen.length} từ điền chữ phù hợp (chọn ${opt.wordCount}).`);
    }
  }
  if (opt.copy && pairs.length) {
    const sentences = pairs.map((p) => shuffle(copyPool.get(p.id)!, r)[0]).filter(Boolean).slice(0, 3);
    if (pairs.length === 1) sentences.push(shuffle(copyPool.get(pairs[0].id)!.filter((s) => !sentences.includes(s)), r)[0]);
    const list = sentences.filter(Boolean);
    if (list.length) sections.push({ kind: 'copy', heading: 'Tập chép', items: [], sentences: list });
    else notes.push('Tập chép: chưa có câu chỉ gồm âm, vần đã học, nên bỏ bài tập chép.');
  }
  const one = pairs.length === 1;
  return {
    title: opt.title?.trim() || (one ? 'Bài tập chính tả lớp 1' : 'Phiếu bài tập chính tả'),
    subtitle: one ? pairs[0].title : pairs.map((p) => p.options.join('/')).join(' · '),
    rules: pairs.map((p) => p.rule).filter((x): x is string => !!x),
    sections, seed: opt.seed, scope: opt.scope, notes,
  };
}

// ------------------------------------------------------------------ HTML

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const img = (name: string, size: number) => `<img data-img="/emoji/${name}.png" width="${size}" height="${size}" alt="" />`;
const COLORS = ['#e8f4ff', '#fff3e0', '#f1f8e9', '#fce4ec', '#ede7f6', '#e0f7fa', '#fffde7'];
const BADGE = ['#ff8a65', '#4fc3f7', '#81c784', '#f06292', '#9575cd', '#4db6ac', '#ffb74d'];

function wordHtml(it: Item, answers: boolean, blankWide = false) {
  return it.parts.map((p) => (p.ans
    ? answers ? `<b style="color:#d32f2f">${esc(p.text)}</b>` : `<span style="color:#9e9e9e">${blankWide ? '……' : '…'}</span>`
    : esc(p.text))).join('');
}

/** Toàn bộ văn bản HTML (đề + trang đáp án nếu withKey). Dùng được cho xem trước, in, xuất .docx */
export function sheetHtml(sheet: Sheet, opts: { withKey?: boolean; school?: string; className?: string; teacher?: string } = {}): string {
  let n = 0;
  const body: string[] = [];
  const big = sheet.sections.filter((x) => x.kind === 'pics').length <= 1;
  const PIC = big ? 86 : 50, FS = big ? 16 : 13;
  // thông tin do giáo viên nhập: trường, lớp, giáo viên (để trống thì in dòng chấm để viết tay)
  const f = (v: string | undefined, dots: string) => (v?.trim() ? `<b>${esc(v.trim())}</b>` : dots);
  const info = `<p style="text-align:center;margin:0 0 2pt;font-size:12pt;color:#37474f">Trường: ${f(opts.school, '………………………………')} &emsp; Lớp: ${f(opts.className, '…………')} &emsp; Giáo viên: ${f(opts.teacher, '……………………………')}</p>`;
  const head = (answers: boolean) => `
  <table width="100%" cellspacing="0" cellpadding="0" style="width:100%"><tr>
    <td width="16%" style="vertical-align:middle;text-align:left">${img('sun-with-face', 56)}</td>
    <td style="vertical-align:middle;text-align:center">
      <p class="ws-t1" style="text-align:center;margin:0;font-size:16pt;font-weight:bold;color:#1565c0">${esc(sheet.title)}${answers ? ' — ĐÁP ÁN' : ''}</p>
      <p class="ws-t2" style="text-align:center;margin:0;font-size:24pt;font-weight:bold;color:#e53935">${esc(sheet.subtitle)}</p>
    </td>
    <td width="16%" style="vertical-align:middle;text-align:right">${img('rainbow', 56)}</td>
  </tr></table>
  ${info}
  ${sheet.scope ? `<p style="text-align:center;margin:0 0 2pt;font-size:11pt;color:#607d8b">Ôn theo bài đã học: ${esc(sheet.scope)}</p>` : ''}
  ${answers ? '' : '<p style="margin:2pt 0 4pt;font-size:13pt">Họ và tên học sinh: ……………………………………………………………</p>'}
  ${sheet.rules.length && !answers ? `<table width="100%" cellspacing="0" cellpadding="4" style="width:100%;margin:0 0 6pt"><tr><td bgcolor="#fff8e1" style="background:#fff8e1;border:1px dashed #ffb300;padding:4pt 8pt">${img('light-bulb', 22)} <b style="color:#e65100">Ghi nhớ:</b> ${sheet.rules.map(esc).join(' ')}</td></tr></table>` : ''}`;

  const sec = (s: Section, answers: boolean, i: number) => {
    n++;
    const badge = `<span style="background:${BADGE[i % BADGE.length]};color:#fff;font-weight:bold;padding:1pt 8pt;border-radius:10px">Bài ${n}</span>`;
    const h = `<p style="margin:6pt 0 3pt;font-size:13pt">${badge} <b>${esc(s.heading)}</b></p>`;
    if (s.kind === 'pics') {
      const cols = 4;
      const rows: string[] = [];
      for (let k = 0; k < s.items.length; k += cols) {
        const cells = s.items.slice(k, k + cols).map((it) => `<td width="25%" bgcolor="${COLORS[i % COLORS.length]}" style="background:${COLORS[i % COLORS.length]};border:1px solid #cfd8dc;text-align:center;vertical-align:middle;padding:${big ? 3 : 1}pt">
          <p style="text-align:center;margin:${big ? 4 : 0}pt 0 0">${img(it.pic!, PIC)}</p>
          <p style="text-align:center;margin:2pt 0 ${big ? 4 : 0}pt;font-size:${FS}pt">${wordHtml(it, answers, true)}</p></td>`);
        while (cells.length < cols) cells.push('<td width="25%" style="border:0"></td>');
        rows.push(`<tr>${cells.join('')}</tr>`);
      }
      return h + `<table width="100%" border="1" cellspacing="0" cellpadding="4" style="width:100%;border-collapse:collapse">${rows.join('')}</table>`;
    }
    if (s.kind === 'words') {
      const cols = 4;
      const rows: string[] = [];
      for (let k = 0; k < s.items.length; k += cols) {
        const cells = s.items.slice(k, k + cols).map((it) => `<td width="25%" style="padding:${big ? 4 : 1}pt 6pt;font-size:${FS}pt">${wordHtml(it, answers, true)}</td>`);
        while (cells.length < cols) cells.push('<td width="25%"></td>');
        rows.push(`<tr>${cells.join('')}</tr>`);
      }
      return h + `<table width="100%" cellspacing="0" cellpadding="3" style="width:100%;border:1.5px dashed ${BADGE[i % BADGE.length]};border-radius:10px">${rows.join('')}</table>`;
    }
    // tập chép: câu mẫu + dòng kẻ ô li
    const lines = (s.sentences ?? []).map((t) => `<p class="ws-hand" style="margin:0;font-size:${big ? 18 : 16}pt;color:#1a237e">${esc(t)}</p>`).join('');
    const ruled = answers ? '' : `<table width="100%" cellspacing="0" cellpadding="0" class="ws-oli" style="width:100%;margin-top:4pt">${Array.from({ length: Math.max(2, (s.sentences ?? []).length) }, () => `<tr style="height:${big ? 24 : 20}pt"><td style="border-bottom:1px solid #90caf9">&nbsp;</td></tr>`).join('')}</table>`;
    return h + lines + ruled;
  };

  body.push(head(false));
  sheet.sections.forEach((s, i) => body.push(sec(s, false, i)));
  body.push(`<p style="text-align:center;margin:10pt 0 0;font-size:10pt;color:#90a4ae">Phiếu số ${sheet.seed % 10000} · EduChain Kids</p>`);
  if (opts.withKey) {
    n = 0;
    body.push('<p style="page-break-before:always;margin:0">&nbsp;</p>');
    body.push(head(true));
    sheet.sections.filter((s) => s.kind !== 'copy').forEach((s, i) => {
      n++;
      body.push(`<p style="margin:8pt 0 2pt;font-size:13pt"><b>Bài ${n}.</b> ${esc(s.heading)}</p>`);
      body.push(`<p style="margin:0 0 4pt;font-size:13pt">${s.items.map((it, k) => `${k + 1}) ${wordHtml(it, true)}`).join('&emsp; ')}</p>`);
      void i;
    });
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sheet.title)}</title><style>
@page { size: 21cm 29.7cm; margin: 12mm 12mm 12mm 14mm; }
body { font-family: 'Baloo 2', 'Times New Roman', serif; font-weight: 600; font-size: 13pt; color: #263238; margin: 0; line-height: 1.25; }
@font-face { font-family: 'Baloo 2'; font-weight: 600; src: url('/fonts/praise/baloo-2-latin-600-normal.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Baloo 2'; font-weight: 600; src: url('/fonts/praise/baloo-2-vietnamese-600-normal.woff2') format('woff2'); unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB; }
@font-face { font-family: 'Baloo 2'; font-weight: 700; src: url('/fonts/praise/baloo-2-latin-700-normal.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Baloo 2'; font-weight: 700; src: url('/fonts/praise/baloo-2-vietnamese-700-normal.woff2') format('woff2'); unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB; }
@font-face { font-family: 'Baloo 2'; font-weight: 800; src: url('/fonts/praise/baloo-2-latin-800-normal.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Baloo 2'; font-weight: 800; src: url('/fonts/praise/baloo-2-vietnamese-800-normal.woff2') format('woff2'); unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB; }
@font-face { font-family: 'Dancing Script'; font-weight: 600; src: url('/fonts/praise/dancing-script-latin-600-normal.woff2') format('woff2'); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Dancing Script'; font-weight: 600; src: url('/fonts/praise/dancing-script-vietnamese-600-normal.woff2') format('woff2'); unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB; }
p { margin: 0 0 4pt; }
table td { vertical-align: top; }
table { page-break-inside: avoid; }
.ws-hand { font-family: 'Dancing Script', cursive; font-weight: 600; }
td[bgcolor] { border-radius: 12px; }
</style></head><body>${body.join('\n')}</body></html>`;
}

export const ALL_PAIRS = PAIRS.map((p) => ({ id: p.id, title: p.title, options: p.options, kind: p.kind, lesson: pairLesson(p), week: pairWeek(p) }));
