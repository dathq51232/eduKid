'use client';

// Văn bản & in ấn — 3 bước đơn giản cho thầy cô:
//   (1) Mẫu văn bản đúng thể thức NĐ30;
//   (2) Chuẩn hoá: tải file Word / Excel (hoặc dán chữ) → hiện ngay bản đã chuẩn hoá trên trang A4 để xem & sửa;
//   (3) Cấu hình in ấn (Word và Excel): đầu trang, chân trang, số trang, khổ giấy → In / PDF, tải Word / Excel.
// "Tài liệu đang làm" dùng chung giữa (2) và (3). Mọi xử lý chạy trên máy cô — file không gửi đi đâu.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ClipboardCheck, FileSpreadsheet, FileText, PenLine, Printer, Sparkles, Undo2, Upload, Wand2, X } from 'lucide-react';
import { KINDS, SAMPLE, buildHtml, fileName, kindOf, type Doc, type DocKind, type Org } from '@/lib/vanban/nd30';
import { FIELDS, compose, unitName, type Facts, type Field } from '@/lib/vanban/compose';

/** Loại văn bản có dòng “Kính gửi” */
const NEEDS_TO: DocKind[] = ['to-trinh', 'giay-moi', 'don'];
import { checkText, fixInline, fixRows, fixText, type Issue } from '@/lib/vanban/check';
import { buildXlsx, range, sheetName } from '@/lib/xlsx';
import { htmlToDocx, type DocImage } from '@/lib/docx-write';
import { readDocxFull } from '@/lib/docx-read';
import { readXlsxAll, type Sheet } from '@/lib/xlsx-read';
import { asciiFilename } from '@/lib/filename';
import { DEFAULT_SETUP, DEFAULT_VIEW, RbBtn, RbGroup, SHEET_SETUP, Workspace, pageCss, sheetHtml, trimSheet, type PageSetup, type SheetView } from '@/components/classroom/PageEditor';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/ct.css';
import '@/styles/vb.css';
import '@/styles/vbe.css';

type Tab = 'mau' | 'chuan-hoa' | 'in-an';
type Change = { sheet: string; r: number; c: number; from: string; to: string };
/** Tài liệu đang làm (dùng chung Chuẩn hoá ↔ Cấu hình in ấn). id đổi = mở trình sửa mới */
type Work =
  | { id: number; kind: 'doc'; name: string; file: string; html: string; images: Map<string, DocImage>; fixed: number; orig: string | null }
  | { id: number; kind: 'sheet'; name: string; file: string; sheets: Sheet[]; changes: Change[]; orig: Sheet[] | null };
// orig: bản trước khi bấm Chuẩn hoá (null = chưa chuẩn hoá) — để "Về bản gốc"

const ORG_KEY = 'van-ban:don-vi';
const today = () => new Date().toISOString().slice(0, 10);
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const bodyOf = (html: string) => /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? html;
const baseName = (n: string) => n.replace(/\.(docx|xlsx)$/i, '') || 'van-ban';
let seq = 0;

function download(bytes: Uint8Array | string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = asciiFilename(name);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** Văn bản thuần → các đoạn NĐ30 (căn đều, lùi đầu dòng 1 cm, cách đoạn 6pt) */
const paraHtml = (text: string) => text.split('\n').filter((l) => l.trim()).map((l) => `<p style="margin:0;margin-top:6pt;text-align:justify;text-indent:1cm;line-height:1.2">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('');
/** Ô chữ dạng số (không có số 0 ở đầu như số điện thoại) → ghi lại thành số trong file Excel */
const asCell = (v: string): string | number => (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(v.trim()) && v.trim().length < 16 ? Number(v.trim()) : v);
/** Chữ thuần của HTML (mỗi đoạn / ô một dòng) — để kiểm tra lỗi còn lại và đưa vào mẫu */
function htmlText(html: string) {
  const d = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  return [...d.body.querySelectorAll('p, li, td, th, h1, h2, h3')].filter((e) => !e.querySelector('p, li, td')).map((e) => e.textContent ?? '').filter((t) => t.trim()).join('\n');
}
/** Sửa chữ trong HTML của file Word, giữ nguyên đậm / nghiêng / bảng / hình. Trả về số đoạn chữ đã sửa */
function fixHtml(html: string): { html: string; fixed: number } {
  const d = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const walk = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
  let fixed = 0;
  let prev: Node | null = null;
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const v = n.nodeValue ?? '';
    let nv = fixInline(v);
    // dấu cách trước dấu câu nằm ở chỗ giáp hai đoạn định dạng khác nhau: "<b>thông báo</b> , các"
    if (prev && /\S$/.test(prev.nodeValue ?? '') && /^\s+[,.;:!?)]/.test(nv)) nv = nv.replace(/^\s+/, '');
    if (nv !== v) { n.nodeValue = nv; fixed++; }
    if (nv.trim()) prev = n;
  }
  return { html: d.body.innerHTML, fixed };
}
const P_BODY = 'margin:0;margin-top:6pt;text-align:justify;text-indent:1cm;line-height:1.2';
const P_HEAD = 'margin:0;margin-top:12pt;margin-bottom:4pt;font-weight:bold';
const P_CELL = 'margin:0;text-align:left';
/**
 * Chuẩn hoá cả file Word theo mẫu NĐ30: một font Times New Roman, một cỡ chữ (theo cài đặt trang), chữ đen,
 * đoạn căn đều – lùi đầu dòng 1 cm – cách đoạn 6pt; dòng IN HOA ngắn là đề mục (in đậm, dòng đầu căn giữa);
 * bỏ màu chữ, cỡ chữ, phông, căn lề lộn xộn và đoạn trống; GIỮ đậm / nghiêng / gạch chân, bảng (kẻ khung), hình.
 * Sau đó sửa chữ (dấu cách, dấu câu lặp, ngày tháng…). Trả về số chỗ đã sửa.
 */
function normalizeHtml(html: string): { html: string; fixed: number } {
  const d = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const body = d.body;
  let fmt = 0;
  // 1. chữ: chỉ giữ đậm / nghiêng / gạch chân; bỏ span, font, liên kết, màu, cỡ chữ
  for (const el of [...body.querySelectorAll('span, font, a, strong, b, em, i, u, mark, small, big, sup, sub')].reverse()) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'sup' || tag === 'sub') { if (el.getAttribute('style')) { el.removeAttribute('style'); fmt++; } continue; }
    const st = (el.getAttribute('style') ?? '').toLowerCase();
    const bold = tag === 'b' || tag === 'strong' || /font-weight:\s*(bold|[6-9]00)/.test(st);
    const ital = tag === 'i' || tag === 'em' || /font-style:\s*italic/.test(st);
    const und = tag === 'u' || /text-decoration[^;]*underline/.test(st);
    if (st || el.getAttribute('color') || el.getAttribute('size') || el.getAttribute('face')) fmt++;
    let node: Node = d.createDocumentFragment();
    while (el.firstChild) node.appendChild(el.firstChild);
    for (const t of [und && 'u', ital && 'i', bold && 'b']) if (t) { const w = d.createElement(t); w.appendChild(node); node = w; }
    el.replaceWith(node);
  }
  // 2. đề mục h1–h6 → đoạn in đậm
  for (const h of [...body.querySelectorAll('h1, h2, h3, h4, h5, h6')]) {
    const p = d.createElement('p');
    while (h.firstChild) p.appendChild(h.firstChild);
    p.setAttribute('data-head', '1');
    h.replaceWith(p); fmt++;
  }
  // 3. bảng: kẻ khung đen, chữ căn trái
  for (const t of body.querySelectorAll('table')) { t.setAttribute('border', '1'); t.setAttribute('style', 'width:100%;border-collapse:collapse;margin-top:6pt'); }
  for (const c of body.querySelectorAll('td, th')) { c.setAttribute('style', 'border:1px solid #000;padding:2pt 4pt;vertical-align:top'); c.removeAttribute('bgcolor'); }
  // 4. đoạn văn (khối lá: không chứa khối khác)
  let first = true;
  for (const b of [...body.querySelectorAll('p, div, li')]) {
    if (b.querySelector('p, div, li, table')) { b.removeAttribute('style'); continue; }
    const t = (b.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!t && !b.querySelector('img')) { b.remove(); fmt++; continue; }
    const old = b.getAttribute('style') ?? '';
    ['style', 'class', 'align'].forEach((a) => b.removeAttribute(a));
    let style: string;
    if (b.closest('td, th')) style = P_CELL;
    else if (b.querySelector('img') && !t) style = 'margin:6pt 0;text-align:center';
    else {
      // IN HOA, ngắn → đề mục; đề mục đầu tiên của văn bản (tiêu đề) căn giữa
      const caps = t.length <= 90 && /\p{L}/u.test(t) && t === t.toLocaleUpperCase('vi');
      const head = b.hasAttribute('data-head') || caps || /^[IVX]+\.\s/.test(t);
      style = head ? `${P_HEAD};text-align:${first ? 'center' : 'left'}` : P_BODY;
      if (head && caps) b.innerHTML = b.innerHTML.replace(/<\/?b>/g, '');
    }
    first = false;
    b.removeAttribute('data-head');
    if (style !== old) fmt++;
    b.setAttribute('style', style);
  }
  // 5. sửa chữ (giữ định dạng)
  const r = fixHtml(body.innerHTML);
  return { html: r.html, fixed: fmt + r.fixed };
}
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp' };

/** Đọc file Word / Excel thành tài liệu đang làm; normalize = chuẩn hoá luôn (tab Chuẩn hoá) */
async function loadWork(file: File, normalize: boolean): Promise<Work> {
  const buf = await file.arrayBuffer();
  if (/\.xlsx$/i.test(file.name)) {
    const all = (await readXlsxAll(buf)).filter((s) => !s.hidden && s.rows.some((r) => r.some((c) => c?.trim())));
    if (!all.length) throw new Error('File không có trang tính nào có dữ liệu.');
    const changes: Change[] = [];
    const sheets = all.map((s) => {
      if (!normalize) return s;
      const f = fixRows(s.rows);
      f.changes.forEach(([r, c, from, to]) => changes.push({ sheet: s.name, r, c, from, to }));
      return { ...s, rows: f.rows };
    });
    return { id: ++seq, kind: 'sheet', name: file.name, file: baseName(file.name), sheets, changes, orig: normalize ? all : null };
  }
  if (!/\.docx$/i.test(file.name)) throw new Error('Chỉ mở được file Word .docx hoặc Excel .xlsx (file .doc / .xls: mở bằng Word / Excel rồi “Lưu thành” định dạng mới).');
  const full = await readDocxFull(buf);
  // hình trong file: hiện trên trang bằng đường dẫn tạm, xuất Word lại bằng nội dung gốc (khoá data-img)
  const images = new Map<string, DocImage>();
  for (const [path, bytes] of full.media) images.set(path, { bytes, mime: MIME[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/png' });
  let html = full.blocks.map((b) => b.html).join('');
  html = html.replace(/<img data-img="([^"]+)"/g, (m, p: string) => {
    const img = images.get(p);
    return img ? `${m} src="${URL.createObjectURL(new Blob([img.bytes as BlobPart], { type: img.mime }))}"` : m;
  });
  let fixed = 0;
  const orig = html;
  if (normalize) { const r = normalizeHtml(html); html = r.html; fixed = r.fixed; }
  return { id: ++seq, kind: 'doc', name: file.name, file: baseName(file.name), html, images, fixed, orig: normalize ? orig : null };
}

export default function DocStudio({ teacher, className }: { teacher: string; className: string }) {
  const [tab, setTab] = useState<Tab>('mau');
  const [org, setOrg] = useState<Org>({ parent: '', name: '', abbr: '', place: '', role: 'Giáo viên chủ nhiệm', onBehalf: '', signer: teacher });
  const [doc, setDoc] = useState<Doc>({ kind: 'thong-bao', no: '', date: today(), ...SAMPLE['thong-bao'] });
  const [printHtml, setPrintHtml] = useState<{ html: string; css: string } | null>(null);
  const [flash, setFlash] = useState('');
  // tài liệu đang làm + cài đặt trang + cách hiện bảng
  const [work, setWork] = useState<Work | null>(null);
  const [setup, setSetup] = useState<PageSetup>(DEFAULT_SETUP);
  const [view, setView] = useState<SheetView>(DEFAULT_VIEW);
  const [sheetIdx, setSheetIdx] = useState(0);

  // thông tin đơn vị lưu trên máy cô (dùng lại cho mọi văn bản)
  useEffect(() => { try { const v = localStorage.getItem(ORG_KEY); if (v) setOrg((o) => ({ ...o, ...(JSON.parse(v) as Partial<Org>) })); } catch { /* bỏ qua */ } }, []);
  const setO = (patch: Partial<Org>) => setOrg((o) => { const n = { ...o, ...patch }; try { localStorage.setItem(ORG_KEY, JSON.stringify(n)); } catch { /* bỏ qua */ } return n; });
  const setD = (patch: Partial<Doc>) => setDoc((d) => ({ ...d, ...patch }));
  // Thông tin chính để tự sinh nội dung; lastGen: nội dung vừa sinh (sửa tay rồi mới hỏi trước khi ghi đè)
  const [facts, setFacts] = useState<Facts>({});
  const [lastGen, setLastGen] = useState('');
  const dirtyBody = () => Boolean(doc.body.trim()) && doc.body !== SAMPLE[doc.kind].body && doc.body !== lastGen;
  const pickKind = (kind: DocKind) => {
    if (dirtyBody() && !window.confirm('Đổi loại văn bản sẽ thay nội dung đang soạn bằng nội dung mẫu. Tiếp tục?')) return;
    setDoc((d) => ({ ...d, kind, ...SAMPLE[kind] }));
    setFacts({}); setLastGen('');
  };
  const factInput = (f: Field) => (
    <label key={`${doc.kind}-${f.key}`} className={f.wide ? 'vb-wide' : ''}>{f.label}
      <input value={facts[f.key] ?? ''} maxLength={300} placeholder={f.placeholder} onChange={(e) => setFacts((x) => ({ ...x, [f.key]: e.target.value }))} />
    </label>
  );
  const generate = () => {
    if (dirtyBody() && !window.confirm('Thay nội dung đang soạn bằng nội dung tự sinh?')) return;
    const c = compose(doc.kind, facts, { unit: org.name, className, signer: org.signer, role: org.role, date: doc.date });
    setDoc((d) => ({ ...d, body: c.body, subject: c.subject || d.subject, to: c.to ?? d.to }));
    setLastGen(c.body);
    setFlash('Đã sinh nội dung — xem bản xem trước bên phải, sửa lại nếu cần.');
  };

  const html = useMemo(() => buildHtml(org, doc), [org, doc]);
  const issues = useMemo(() => checkText([doc.subject, doc.to, doc.body, doc.recipients].join('\n')), [doc]);

  /** Mở tài liệu mới: đặt lại cài đặt trang (bảng nhiều cột → khổ ngang) */
  const open = (w: Work) => {
    setWork(w); setSheetIdx(0); setView(DEFAULT_VIEW);
    setSetup(w.kind === 'sheet' ? { ...SHEET_SETUP, landscape: (trimSheet(w.sheets[0])[0]?.length ?? 0) > 6 } : DEFAULT_SETUP);
  };
  /** Bấm "Chuẩn hoá theo mẫu": văn bản → normalizeHtml; bảng → fixRows mọi trang tính. Giữ bản gốc để "Về bản gốc" */
  const normalizeWork = () => {
    if (!work || work.orig) return;
    if (work.kind === 'doc') {
      const r = normalizeHtml(work.html);
      setWork({ ...work, id: ++seq, orig: work.html, html: r.html, fixed: r.fixed });
      setSetup((s) => ({ ...s, fontSize: 14 }));
      setFlash(r.fixed ? `Đã chuẩn hoá ${r.fixed} chỗ theo mẫu NĐ30.` : 'Văn bản đã đúng mẫu — không có chỗ nào cần sửa.');
    } else {
      const changes: Change[] = [];
      const sheets = work.sheets.map((s) => { const f = fixRows(s.rows); f.changes.forEach(([r, c, from, to]) => changes.push({ sheet: s.name, r, c, from, to })); return { ...s, rows: f.rows }; });
      setWork({ ...work, orig: work.sheets, sheets, changes });
      setFlash(changes.length ? `Đã chuẩn hoá ${changes.length} ô trong ${sheets.length} trang tính.` : 'Bảng đã gọn gàng — không có ô nào cần sửa.');
    }
  };
  const restoreWork = () => {
    if (!work?.orig) return;
    if (work.kind === 'doc') setWork({ ...work, id: ++seq, html: work.orig, orig: null, fixed: 0 });
    else setWork({ ...work, sheets: work.orig, orig: null, changes: [] });
    setFlash('Đã trả về bản gốc.');
  };
  const close = () => { if (window.confirm('Đóng tài liệu này? Những chỗ đã sửa sẽ không được giữ (hãy tải về trước).')) setWork(null); };
  const docHtml = useCallback((h: string) => setWork((w) => (w && w.kind === 'doc' && w.html !== h ? { ...w, html: h } : w)), []);
  const setSheets = (sheets: Sheet[]) => setWork((w) => (w && w.kind === 'sheet' ? { ...w, sheets } : w));

  const print = (h: string, s: PageSetup) => { setPrintHtml({ html: h, css: pageCss(s) }); window.setTimeout(() => { window.print(); setPrintHtml(null); }, 80); };
  const saveWord = (h: string, s: PageSetup, file: string, title: string, images: Map<string, DocImage> = new Map()) => {
    download(htmlToDocx(`<html><body>${bodyOf(h)}</body></html>`, images, { title, fontSize: s.fontSize, deco: s }), `${file}.docx`, DOCX);
    setFlash('Đã tải file Word — mở bằng Word để ký, đóng dấu hoặc sửa tiếp.');
  };
  const saveExcel = (w: Extract<Work, { kind: 'sheet' }>) => {
    const used = new Set<string>();
    download(buildXlsx(w.sheets.map((s) => ({ name: sheetName(s.name, used), rows: s.rows.map((r) => r.map((c) => asCell(c ?? ''))), merges: s.merges.map(([r1, c1, r2, c2]) => range(r1, c1, r2, c2)) }))), `${w.file}-da-sua.xlsx`, XLSX);
    setFlash('Đã tải file Excel (giữ chữ, số, ô gộp; màu nền, công thức, độ rộng cột gốc không giữ lại).');
  };
  const printWork = () => {
    if (!work) return;
    if (work.kind === 'doc') print(work.html, setup);
    else print(sheetHtml(work.sheets[sheetIdx] ?? work.sheets[0], view), setup);
  };
  const fixDoc = () => {
    let total = 0;
    const f = (s: string) => { const r = fixText(s); total += r.fixed; return r.text; };
    setDoc((d) => ({ ...d, subject: f(d.subject), to: f(d.to), body: f(d.body), recipients: f(d.recipients) }));
    setFlash(total ? `Đã sửa ${total} chỗ.` : 'Không có lỗi sửa tự động được.');
  };

  const tabBtn = (t: Tab, label: string, Icon: typeof FileText) => (
    <button type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'is-on' : ''} onClick={() => setTab(t)}><Icon aria-hidden="true" /> {label}</button>
  );

  return (
    <div className="ct vb">
      <div className="ct-head no-print">
        <div>
          <p className="ct-sub">Lớp {className} · thể thức theo Nghị định 30/2020/NĐ-CP · file xử lý ngay trên máy, không gửi đi đâu</p>
          <h1>Văn bản & in ấn</h1>
        </div>
        <div className="ct-seg" role="tablist" aria-label="Chọn việc">
          {tabBtn('mau', 'Mẫu văn bản', FileText)}
          {tabBtn('chuan-hoa', 'Chuẩn hoá', Wand2)}
          {tabBtn('in-an', 'Cấu hình in ấn', Printer)}
        </div>
      </div>
      {flash && <p className="adm-alert is-ok no-print" role="status" onClick={() => setFlash('')}>{flash}</p>}

      {tab === 'mau' && (
        <>
        <div className="vbe-ribbon vbe-ribbon-lite no-print">
          <div className="vbe-rbody">
            <RbGroup label="Tệp">
              <RbBtn primary icon={<FileText aria-hidden="true" />} label="Tải Word" onClick={() => saveWord(html, DEFAULT_SETUP, fileName(doc), kindOf(doc.kind).label)} />
              <RbBtn icon={<Printer aria-hidden="true" />} label="In / PDF" onClick={() => print(html, DEFAULT_SETUP)} />
            </RbGroup>
            <RbGroup label="Soạn tiếp">
              <RbBtn icon={<PenLine aria-hidden="true" />} label="Sửa trên trang & cấu hình in" onClick={() => { open({ id: ++seq, kind: 'doc', name: kindOf(doc.kind).label, file: fileName(doc), html: bodyOf(html), images: new Map(), fixed: 0, orig: null }); setTab('in-an'); }} />
            </RbGroup>
            <RbGroup label="Kiểm tra">
              <RbBtn icon={<Sparkles aria-hidden="true" />} label="Sửa lỗi trình bày" onClick={fixDoc} />
            </RbGroup>
          </div>
        </div>
        <div className="vb-grid no-print">
          <section className="dash-card vb-form">
            <div className="vb-kinds" role="radiogroup" aria-label="Loại văn bản">
              {KINDS.map((k) => <button key={k.id} type="button" role="radio" aria-checked={doc.kind === k.id} className={doc.kind === k.id ? 'is-on' : ''} onClick={() => pickKind(k.id)}>{k.label}</button>)}
            </div>
            <details className="vb-org" open={!org.name}>
              {/* đã điền: thu gọn thành một dòng tóm tắt, bấm để sửa */}
              <summary>{org.name.trim()
                ? <><b>{unitName(org.name)}</b> · {org.signer || '…'}{org.role ? ` (${org.role})` : ''} <small className="vb-edit-link">Sửa</small></>
                : <>Thông tin đơn vị & người ký <small>(điền một lần, lưu trên máy này)</small></>}</summary>
              <div className="vb-fields">
                <label>Cơ quan chủ quản<input value={org.parent} maxLength={100} placeholder="UBND XÃ …" onChange={(e) => setO({ parent: e.target.value })} /></label>
                <label>Tên đơn vị<input value={org.name} maxLength={100} placeholder="TRƯỜNG TIỂU HỌC …" onChange={(e) => setO({ name: e.target.value })} /></label>
                <label>Viết tắt (trong số ký hiệu)<input value={org.abbr} maxLength={20} placeholder="THTĐ" onChange={(e) => setO({ abbr: e.target.value })} /></label>
                <label>Địa danh<input value={org.place} maxLength={60} placeholder="Tân Định" onChange={(e) => setO({ place: e.target.value })} /></label>
                <label>Chức vụ người ký<input value={org.role} maxLength={60} onChange={(e) => setO({ role: e.target.value })} /></label>
                <label>Ký thay (nếu có)<input value={org.onBehalf} maxLength={60} placeholder="KT. HIỆU TRƯỞNG" onChange={(e) => setO({ onBehalf: e.target.value })} /></label>
                <label className="vb-wide">Họ tên người ký<input value={org.signer} maxLength={80} onChange={(e) => setO({ signer: e.target.value })} /></label>
              </div>
            </details>
            {/* Thông tin chính → Tự sinh nội dung (theo loại văn bản, đúng văn phong) */}
            <div className="vb-facts">
              <div className="vb-facts-hd"><b>Thông tin chính</b><span>Điền vài ý, bấm “Tự sinh nội dung” — sửa lại tuỳ ý.</span></div>
              {/* 2–3 ô chính hiện sẵn; ô phụ trong "Thêm chi tiết" (không bắt buộc) */}
              <div className="vb-fields">
                {FIELDS[doc.kind].filter((f) => !f.extra).map((f) => factInput(f))}
              </div>
              {FIELDS[doc.kind].some((f) => f.extra) && (
                <details className="vb-more" key={doc.kind}>
                  <summary>Thêm chi tiết <small>(không bắt buộc: {FIELDS[doc.kind].filter((f) => f.extra).map((f) => f.label.toLowerCase()).join(', ')})</small></summary>
                  <div className="vb-fields">{FIELDS[doc.kind].filter((f) => f.extra).map((f) => factInput(f))}</div>
                </details>
              )}
              <button type="button" className="btn btn-primary vb-gen" onClick={generate} disabled={!Object.values(facts).some((v) => v?.trim())}><Sparkles aria-hidden="true" /> Tự sinh nội dung</button>
            </div>
            <div className="vb-fields vb-fields-3">
              {doc.kind !== 'don' && <label>Số<input value={doc.no} maxLength={10} inputMode="numeric" placeholder="chờ vào sổ" onChange={(e) => setD({ no: e.target.value })} /></label>}
              <label>Ngày<input type="date" value={doc.date} onChange={(e) => setD({ date: e.target.value })} /></label>
              {NEEDS_TO.includes(doc.kind) && <label>Kính gửi<input value={doc.to} maxLength={200} onChange={(e) => setD({ to: e.target.value })} /></label>}
            </div>
            <div className="vb-fields">
              {doc.kind !== 'don' && <label className="vb-wide">Trích yếu<input value={doc.subject} maxLength={200} onChange={(e) => setD({ subject: e.target.value })} /></label>}
              <label className="vb-wide">Nội dung <small>(mỗi dòng một đoạn; “I.”, “1.” là đề mục; “-” là gạch đầu dòng)</small><textarea rows={9} value={doc.body} maxLength={20000} onChange={(e) => setD({ body: e.target.value })} /></label>
            </div>
            {doc.kind !== 'don' && doc.kind !== 'bien-ban' && (
              <details className="vb-org vb-rec">
                <summary>Nơi nhận <small>({doc.recipients.split('\n').filter((x) => x.trim()).map((x) => x.trim().replace(/[;.]$/, '')).join(', ') || 'chưa có'})</small></summary>
                <textarea rows={3} value={doc.recipients} maxLength={1000} aria-label="Nơi nhận, mỗi nơi một dòng" onChange={(e) => setD({ recipients: e.target.value })} />
              </details>
            )}
            <IssueList issues={issues} />
          </section>
          <section className="vb-paper-wrap" aria-label="Xem trước văn bản">
            <div className="vb-paper" dangerouslySetInnerHTML={{ __html: bodyOf(html) }} />
          </section>
        </div>
        </>
      )}

      {(tab === 'chuan-hoa' || tab === 'in-an') && (
        <section className="vb-norm no-print">
          {!work ? (
            <Landing normalize={tab === 'chuan-hoa'} onOpen={(w) => { open(w); setFlash(tab === 'chuan-hoa' ? 'Đã mở file — xem bản gốc bên dưới, bấm “Chuẩn hoá theo mẫu” để đưa về đúng mẫu.' : 'Đã mở file — đặt khổ giấy, số trang, đầu & chân trang ở thẻ “Bố cục trang”.'); }} />
          ) : (
            <Workspace key={`${tab}-${work.id}`} startTab={tab === 'in-an' ? 'layout' : 'home'} setup={setup} onSetup={setSetup}
              {...(work.kind === 'doc'
                ? { kind: 'doc' as const, docKey: work.id, html: work.html, onHtml: docHtml }
                : { kind: 'sheet' as const, sheets: work.sheets, idx: sheetIdx, onIdx: setSheetIdx, onSheets: setSheets, view, onView: setView })}
              fileGroup={<>
                <OpenBtn onOpen={(w) => { if (window.confirm('Mở file mới sẽ thay tài liệu đang làm. Tiếp tục?')) { open(w); setFlash('Đã mở file mới.'); } }} />
                <RbBtn icon={work.kind === 'doc' ? <FileText aria-hidden="true" /> : <FileSpreadsheet aria-hidden="true" />} label={work.kind === 'doc' ? 'Tải Word' : 'Tải Excel'}
                  onClick={() => (work.kind === 'doc' ? saveWord(work.html, setup, work.file, work.name, work.images) : saveExcel(work))} />
                <RbBtn primary icon={<Printer aria-hidden="true" />} label="In / PDF" onClick={printWork} />
                <RbBtn icon={<X aria-hidden="true" />} label="Đóng" onClick={close} />
              </>}
              outGroup={<>
                <RbBtn icon={work.kind === 'doc' ? <FileText aria-hidden="true" /> : <FileSpreadsheet aria-hidden="true" />} label={work.kind === 'doc' ? 'Tải Word' : 'Tải Excel'}
                  onClick={() => (work.kind === 'doc' ? saveWord(work.html, setup, work.file, work.name, work.images) : saveExcel(work))} />
                <RbBtn primary icon={<Printer aria-hidden="true" />} label="In / PDF" onClick={printWork} />
              </>}
              extraGroup={tab === 'chuan-hoa' ? {
                label: 'Chuẩn hoá',
                node: <>
                  {!work.orig
                    ? <RbBtn primary icon={<Sparkles aria-hidden="true" />} label="Chuẩn hoá theo mẫu" onClick={normalizeWork} />
                    : <RbBtn icon={<Undo2 aria-hidden="true" />} label="Về bản gốc" onClick={restoreWork} />}
                  {work.kind === 'doc' && <RbBtn icon={<PenLine aria-hidden="true" />} label="Đưa vào mẫu" onClick={() => { setDoc((d) => ({ ...d, body: stripHeader(htmlText(work.html)) })); setTab('mau'); setFlash('Đã đưa nội dung vào mẫu — chọn loại văn bản, điền trích yếu rồi tải Word / PDF.'); }} />}
                </>,
              } : undefined}
              below={<WorkInfo work={work} />} />
          )}
        </section>
      )}

      {printHtml && createPortal(
        <div className="vb-print">
          <style>{printHtml.css}</style>
          <div dangerouslySetInnerHTML={{ __html: bodyOf(printHtml.html) }} />
        </div>, document.body,
      )}
    </div>
  );
}

function IssueList({ issues, fixLabel = 'Sửa lỗi trình bày' }: { issues: Issue[]; fixLabel?: string }) {
  if (!issues.length) return <p className="vb-ok"><CheckCircle2 aria-hidden="true" /> Không thấy lỗi trình bày thường gặp.</p>;
  return (
    <details className="vb-issues" open={issues.length <= 6}>
      <summary><ClipboardCheck aria-hidden="true" /> {issues.length} chỗ nên sửa {issues.some((i) => i.fixable) && fixLabel && <small>(bấm “{fixLabel}” để sửa tự động)</small>}</summary>
      <ul>{issues.slice(0, 40).map((i, k) => <li key={k}><b>Dòng {i.line}:</b> {i.msg}{!i.fixable && <em> — cần sửa tay</em>}<span>{i.sample}</span></li>)}</ul>
    </details>
  );
}

/** bỏ quốc hiệu, tiêu ngữ, số, ngày tháng… ở đầu văn bản (mẫu tự thêm lại đúng thể thức) */
function stripHeader(text: string) {
  return text.split('\n').filter((l) => !/^(CỘNG HÒA XÃ HỘI|Độc lập - Tự do|Số: |.{0,40}, ngày \d{2} tháng|[─_-]{4,}$)/.test(l.trim())).join('\n').trim();
}

/** Nút "Mở file" trên ribbon (Word .docx / Excel .xlsx) */
function OpenBtn({ onOpen, big }: { onOpen: (w: Work) => void; big?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (f: File) => {
    setErr(''); setBusy(true);
    try { onOpen(await loadWork(f, false)); } catch (e) { setErr(e instanceof Error ? e.message : 'Không đọc được file.'); }
    setBusy(false);
  };
  return (
    <>
      <label className={big ? 'btn btn-primary vb-upload vbe-open' : 'vbe-rb vb-upload'}>
        <Upload aria-hidden="true" /><span>{busy ? 'Đang đọc…' : big ? 'Mở file Word / Excel' : 'Mở file'}</span>
        <input type="file" accept=".docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = ''; }} />
      </label>
      {err && <p className="adm-alert is-error vbe-err" role="alert">{err}</p>}
    </>
  );
}

/** Chưa có tài liệu: nút mở file to; ở Chuẩn hoá thêm ô dán chữ */
function Landing({ normalize, onOpen }: { normalize: boolean; onOpen: (w: Work) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="dash-card vbe-landing">
      <OpenBtn big onOpen={onOpen} />
      <p className="dash-muted">{normalize
        ? 'Mở file Word hoặc Excel để xem bản gốc, rồi bấm “Chuẩn hoá theo mẫu”: một font, cùng cỡ chữ, chữ đen, căn đều, lùi đầu dòng; sửa dấu câu, ngày tháng. Giữ chữ đậm, nghiêng, bảng, hình.'
        : 'Mở file Word hoặc Excel (hoặc chuẩn hoá ở bước trước) để đặt khổ giấy, số trang, đầu & chân trang rồi in hay lưu PDF. Bảng nhiều trang tự lặp lại dòng tên cột.'}</p>
      {normalize && (
        <details className="vbe-paste">
          <summary>Hoặc dán văn bản vào đây</summary>
          <textarea className="vb-text" rows={10} value={text} maxLength={60000} placeholder="Dán văn bản…" onChange={(e) => setText(e.target.value)} aria-label="Văn bản cần chuẩn hoá" />
          <button type="button" className="btn btn-primary" disabled={!text.trim()} onClick={() => onOpen({ id: ++seq, kind: 'doc', name: 'Văn bản dán vào', file: 'van-ban', html: paraHtml(text), images: new Map(), fixed: 0, orig: null })}><FileText aria-hidden="true" /> Mở trên trang</button>
        </details>
      )}
    </div>
  );
}

/** Dưới ribbon: tên file, các ô Excel đã sửa, lỗi còn lại cần sửa tay */
function WorkInfo({ work }: { work: Work }) {
  const remaining = useMemo(() => (work.kind === 'doc' && work.orig ? checkText(htmlText(work.html)).filter((i) => !i.fixable) : []), [work]);
  return (
    <div className="vbe-info">
      <span className="vbe-doc">{work.kind === 'doc' ? <FileText aria-hidden="true" /> : <FileSpreadsheet aria-hidden="true" />} <b>{work.name}</b>
        {work.orig && <span className="vbe-done"><CheckCircle2 aria-hidden="true" /> Đã chuẩn hoá {work.kind === 'doc' ? `${work.fixed} chỗ` : `${work.changes.length} ô`}</span>}
      </span>
      {work.kind === 'sheet' && work.changes.length > 0 && (
        <details className="vb-xlfix">
          <summary>Xem {work.changes.length} ô đã sửa</summary>
          <ul>{work.changes.slice(0, 80).map((c, i) => <li key={i}><b>{work.sheets.length > 1 ? `${c.sheet}!` : ''}{range(c.r, c.c, c.r, c.c).split(':')[0]}</b> <s>{c.from}</s> → {c.to}</li>)}</ul>
          {work.changes.length > 80 && <p className="dash-muted">… và {work.changes.length - 80} ô khác.</p>}
        </details>
      )}
      {remaining.length > 0 && <IssueList issues={remaining} fixLabel="" />}
    </div>
  );
}
