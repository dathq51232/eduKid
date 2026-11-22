'use client';

// Văn bản & in ấn: (1) Mẫu văn bản đúng thể thức NĐ30 → Word / PDF; (2) Chuẩn hoá văn bản dán vào hoặc file .docx;
// (3) In bảng Excel đẹp (khổ ngang, lặp dòng tiêu đề, vừa chiều ngang). Mọi xử lý chạy trên máy cô — file không gửi đi đâu.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ClipboardCheck, Copy, FileSpreadsheet, FileText, PenLine, Printer, Sparkles, Upload, Wand2 } from 'lucide-react';
import { KINDS, SAMPLE, buildHtml, fileName, kindOf, type Doc, type DocKind, type Org } from '@/lib/vanban/nd30';
import { checkText, fixRows, fixText, type Issue } from '@/lib/vanban/check';
import { buildXlsx, range, sheetName } from '@/lib/xlsx';
import { htmlToDocx } from '@/lib/docx-write';
import { readDocx } from '@/lib/docx-read';
import { readXlsxAll, type Sheet } from '@/lib/xlsx-read';
import { asciiFilename } from '@/lib/filename';
import { DEFAULT_SETUP, DocEditor, Paper, SetupPanel, ZoomBar, pageCss, type PageSetup } from '@/components/classroom/PageEditor';
import '@/styles/vbe.css';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/ct.css';
import '@/styles/vb.css';

type Tab = 'mau' | 'chuan-hoa' | 'excel';
const ORG_KEY = 'van-ban:don-vi';
const today = () => new Date().toISOString().slice(0, 10);

function download(bytes: Uint8Array | string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = asciiFilename(name);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const bodyOf = (html: string) => /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? html;

export default function DocStudio({ teacher, className }: { teacher: string; className: string }) {
  const [tab, setTab] = useState<Tab>('mau');
  const [org, setOrg] = useState<Org>({ parent: '', name: '', abbr: '', place: '', role: 'Giáo viên chủ nhiệm', onBehalf: '', signer: teacher });
  const [doc, setDoc] = useState<Doc>({ kind: 'thong-bao', no: '', date: today(), ...SAMPLE['thong-bao'] });
  const [printHtml, setPrintHtml] = useState<{ html: string; css: string } | null>(null);
  // đang sửa thẳng trên trang (từ Mẫu văn bản hoặc Chuẩn hoá)
  const [editing, setEditing] = useState<{ html: string; title: string; file: string } | null>(null);
  const [flash, setFlash] = useState('');
  // bảng đã chuẩn hoá ở tab Chuẩn hoá → mở sẵn ở tab In bảng Excel
  const [xlIn, setXlIn] = useState<{ file: string; sheets: Sheet[] } | null>(null);

  // thông tin đơn vị lưu trên máy cô (dùng lại cho mọi văn bản)
  useEffect(() => { try { const v = localStorage.getItem(ORG_KEY); if (v) setOrg((o) => ({ ...o, ...(JSON.parse(v) as Partial<Org>) })); } catch { /* bỏ qua */ } }, []);
  const setO = (patch: Partial<Org>) => setOrg((o) => { const n = { ...o, ...patch }; try { localStorage.setItem(ORG_KEY, JSON.stringify(n)); } catch { /* bỏ qua */ } return n; });
  const setD = (patch: Partial<Doc>) => setDoc((d) => ({ ...d, ...patch }));
  const pickKind = (kind: DocKind) => {
    const dirty = doc.body.trim() && doc.body !== SAMPLE[doc.kind].body;
    if (dirty && !window.confirm('Đổi loại văn bản sẽ thay nội dung đang soạn bằng nội dung mẫu. Tiếp tục?')) return;
    setDoc((d) => ({ ...d, kind, ...SAMPLE[kind] }));
  };

  const html = useMemo(() => buildHtml(org, doc), [org, doc]);
  const issues = useMemo(() => checkText([doc.subject, doc.to, doc.body, doc.recipients].join('\n')), [doc]);
  const print = (h: string, setup: PageSetup) => { setPrintHtml({ html: h, css: pageCss(setup) }); window.setTimeout(() => { window.print(); setPrintHtml(null); }, 80); };
  const word = (h: string, setup: PageSetup, file: string, title: string) => { download(htmlToDocx(h, new Map(), { title, fontSize: setup.fontSize, deco: setup }), `${file}.docx`, DOCX); setFlash('Đã tải file Word — mở bằng Word để ký, đóng dấu hoặc sửa tiếp.'); };
  const saveWord = () => word(html, DEFAULT_SETUP, fileName(doc), kindOf(doc.kind).label);
  const fixDoc = () => {
    let total = 0;
    const f = (s: string) => { const r = fixText(s); total += r.fixed; return r.text; };
    setDoc((d) => ({ ...d, subject: f(d.subject), to: f(d.to), body: f(d.body), recipients: f(d.recipients) }));
    setFlash(total ? `Đã sửa ${total} chỗ.` : 'Không có lỗi sửa tự động được.');
  };

  return (
    <div className="ct vb">
      <div className="ct-head no-print">
        <div>
          <p className="ct-sub">Lớp {className} · thể thức theo Nghị định 30/2020/NĐ-CP · file xử lý ngay trên máy, không gửi đi đâu</p>
          <h1>Văn bản & in ấn</h1>
        </div>
        <div className="ct-seg" role="tablist" aria-label="Chọn việc" hidden={Boolean(editing)}>
          <button type="button" role="tab" aria-selected={tab === 'mau'} className={tab === 'mau' ? 'is-on' : ''} onClick={() => setTab('mau')}><FileText aria-hidden="true" /> Mẫu văn bản</button>
          <button type="button" role="tab" aria-selected={tab === 'chuan-hoa'} className={tab === 'chuan-hoa' ? 'is-on' : ''} onClick={() => setTab('chuan-hoa')}><Wand2 aria-hidden="true" /> Chuẩn hoá</button>
          <button type="button" role="tab" aria-selected={tab === 'excel'} className={tab === 'excel' ? 'is-on' : ''} onClick={() => setTab('excel')}><FileSpreadsheet aria-hidden="true" /> In bảng Excel</button>
        </div>
      </div>
      {flash && <p className="adm-alert is-ok no-print" role="status" onClick={() => setFlash('')}>{flash}</p>}

      {editing ? (
        <DocEditor initialHtml={editing.html} title={editing.title}
          onBack={() => { if (window.confirm('Quay lại? Những chỗ vừa sửa trên trang sẽ không được giữ (hãy Tải Word hoặc In trước).')) setEditing(null); }}
          onPrint={(h, s) => print(h, s)} onWord={(h, s) => word(h, s, editing.file, editing.title)} />
      ) : <>
      {tab === 'mau' && (
        <div className="vb-grid no-print">
          <section className="dash-card vb-form">
            <div className="vb-kinds" role="radiogroup" aria-label="Loại văn bản">
              {KINDS.map((k) => <button key={k.id} type="button" role="radio" aria-checked={doc.kind === k.id} className={doc.kind === k.id ? 'is-on' : ''} onClick={() => pickKind(k.id)}>{k.label}</button>)}
            </div>
            <details className="vb-org" open={!org.name}>
              <summary>Thông tin đơn vị & người ký <small>(lưu trên máy này, dùng lại cho mọi văn bản)</small></summary>
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
            <div className="vb-fields">
              {doc.kind !== 'don' && <label>Số (để trống nếu chờ vào sổ)<input value={doc.no} maxLength={10} inputMode="numeric" onChange={(e) => setD({ no: e.target.value })} /></label>}
              <label>Ngày<input type="date" value={doc.date} onChange={(e) => setD({ date: e.target.value })} /></label>
              {doc.kind !== 'don' && <label className="vb-wide">Trích yếu<input value={doc.subject} maxLength={200} onChange={(e) => setD({ subject: e.target.value })} /></label>}
              <label className="vb-wide">Kính gửi (mỗi nơi một dòng, để trống nếu không có)<textarea rows={2} value={doc.to} maxLength={500} onChange={(e) => setD({ to: e.target.value })} /></label>
              <label className="vb-wide">Nội dung (mỗi dòng một đoạn; “I.”, “1.” là đề mục; “-” là gạch đầu dòng)<textarea rows={12} value={doc.body} maxLength={20000} onChange={(e) => setD({ body: e.target.value })} /></label>
              {doc.kind !== 'don' && doc.kind !== 'bien-ban' && <label className="vb-wide">Nơi nhận (mỗi nơi một dòng)<textarea rows={3} value={doc.recipients} maxLength={1000} onChange={(e) => setD({ recipients: e.target.value })} /></label>}
            </div>
            <div className="vb-acts">
              <button type="button" className="btn btn-primary btn-sm" onClick={saveWord}><FileText aria-hidden="true" /> Tải Word</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => print(html, DEFAULT_SETUP)}><Printer aria-hidden="true" /> In / lưu PDF</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing({ html: bodyOf(html), title: kindOf(doc.kind).label, file: fileName(doc) })}><PenLine aria-hidden="true" /> Sửa trực tiếp trên trang</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={fixDoc}><Sparkles aria-hidden="true" /> Sửa lỗi trình bày</button>
            </div>
            <IssueList issues={issues} />
          </section>
          <section className="vb-paper-wrap" aria-label="Xem trước văn bản">
            <div className="vb-paper" dangerouslySetInnerHTML={{ __html: bodyOf(html) }} />
          </section>
        </div>
      )}

      {tab === 'chuan-hoa' && <Normalizer onEdit={(h) => setEditing({ html: h, title: 'Văn bản đã chuẩn hoá', file: 'van-ban-chuan-hoa' })} onPrintSheets={(x) => { setXlIn(x); setTab('excel'); }} onUse={(text) => { setDoc((d) => ({ ...d, body: stripHeader(text) })); setTab('mau'); setFlash('Đã đưa nội dung vào mẫu — chọn loại văn bản, điền trích yếu rồi tải Word / PDF.'); }} onFlash={setFlash} />}

      {tab === 'excel' && <ExcelPrint key={xlIn?.file ?? ''} initial={xlIn} onPrint={print} />}

      </>}

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
      <summary><ClipboardCheck aria-hidden="true" /> {issues.length} chỗ nên sửa {issues.some((i) => i.fixable) && <small>(bấm “{fixLabel}” để sửa tự động)</small>}</summary>
      <ul>{issues.slice(0, 40).map((i, k) => <li key={k}><b>Dòng {i.line}:</b> {i.msg}{!i.fixable && <em> — cần sửa tay</em>}<span>{i.sample}</span></li>)}</ul>
    </details>
  );
}

/** bỏ quốc hiệu, tiêu ngữ, số, ngày tháng… ở đầu văn bản dán vào (mẫu tự thêm lại đúng thể thức) */
function stripHeader(text: string) {
  return text.split('\n').filter((l) => !/^(CỘNG HÒA XÃ HỘI|Độc lập - Tự do|Số: |.{0,40}, ngày \d{2} tháng|[─_-]{4,}$)/.test(l.trim())).join('\n').trim();
}

/** Văn bản thuần → các đoạn NĐ30 (căn đều, lùi đầu dòng 1 cm, cách đoạn 6pt) */
const paraHtml = (text: string) => text.split('\n').filter((l) => l.trim()).map((l) => `<p style="margin:0;margin-top:6pt;text-align:justify;text-indent:1cm;line-height:1.2">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('');

/* ---------------------------------------------------------- (2) chuẩn hoá văn bản */
type XlFixed = { file: string; sheets: Sheet[]; changes: { sheet: string; r: number; c: number; from: string; to: string }[] };

/** Ô chữ dạng số (không có số 0 ở đầu như số điện thoại) → ghi lại thành số trong file Excel */
const asCell = (v: string): string | number => (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(v.trim()) && v.trim().length < 16 ? Number(v.trim()) : v);

function Normalizer({ onUse, onFlash, onPrintSheets, onEdit }: { onUse: (text: string) => void; onFlash: (m: string) => void; onPrintSheets: (x: { file: string; sheets: Sheet[] }) => void; onEdit: (html: string) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [xl, setXl] = useState<XlFixed | null>(null);
  const issues = useMemo(() => checkText(text), [text]);

  const load = async (file: File) => {
    setErr(''); setBusy(true); setXl(null);
    try {
      const buf = await file.arrayBuffer();
      if (/\.xlsx$/i.test(file.name)) {
        // Excel: chuẩn hoá từng ô của mọi trang tính có dữ liệu
        const all = (await readXlsxAll(buf)).filter((s) => !s.hidden && s.rows.some((r) => r.some((c) => c?.trim())));
        if (!all.length) throw new Error('File không có trang tính nào có dữ liệu.');
        const changes: XlFixed['changes'] = [];
        const sheets = all.map((s) => {
          const f = fixRows(s.rows);
          f.changes.forEach(([r, c, from, to]) => changes.push({ sheet: s.name, r, c, from, to }));
          return { ...s, rows: f.rows };
        });
        setXl({ file: file.name, sheets, changes });
        onFlash(changes.length ? `Đã chuẩn hoá ${changes.length} ô trong ${sheets.length} trang tính.` : 'Bảng đã gọn gàng — không có ô nào cần sửa.');
      } else {
        const blocks = await readDocx(buf);
        setText(blocks.map((b) => (b.t === 'p' ? b.text : b.rows.map((r) => r.join(' | ')).join('\n'))).join('\n'));
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Không đọc được file.'); }
    setBusy(false);
  };
  const saveXl = () => {
    if (!xl) return;
    const used = new Set<string>();
    const bytes = buildXlsx(xl.sheets.map((s) => ({
      name: sheetName(s.name, used),
      rows: s.rows.map((r) => r.map(asCell)),
      merges: s.merges.map(([r1, c1, r2, c2]) => range(r1, c1, r2, c2)),
    })));
    download(bytes, xl.file.replace(/\.xlsx$/i, '') + '-chuan-hoa.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };
  const fix = () => { const r = fixText(text); setText(r.text); onFlash(r.fixed ? `Đã sửa ${r.fixed} chỗ.` : 'Không có lỗi sửa tự động được.'); };
  const word = () => {
    const html = `<html><body>${paraHtml(text)}</body></html>`;
    download(htmlToDocx(html, new Map(), { title: 'Văn bản', fontSize: 14 }), 'van-ban-chuan-hoa.docx', DOCX);
  };

  return (
    <section className="dash-card vb-norm no-print">
      <div className="vb-acts">
        <label className="btn btn-outline btn-sm vb-upload"><Upload aria-hidden="true" /> {busy ? 'Đang đọc…' : 'Mở file Word / Excel'}
          <input type="file" accept=".docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }} />
        </label>
        <span className="dash-muted">.docx, .xlsx — hoặc dán văn bản vào ô dưới</span>
      </div>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      {xl && (
        <div className="vb-xlfix">
          <p><b>{xl.file}</b> · {xl.sheets.length} trang tính · <b>{xl.changes.length}</b> ô đã chuẩn hoá (dấu cách, dấu câu, ngày dd/mm/yyyy, viết hoa cột họ tên).</p>
          {xl.changes.length > 0 && (
            <details open={xl.changes.length <= 8}>
              <summary>Xem các ô đã sửa</summary>
              <ul>{xl.changes.slice(0, 60).map((c, i) => <li key={i}><b>{xl.sheets.length > 1 ? `${c.sheet}!` : ''}{range(c.r, c.c, c.r, c.c).split(':')[0]}</b> <s>{c.from}</s> → {c.to}</li>)}</ul>
              {xl.changes.length > 60 && <p className="dash-muted">… và {xl.changes.length - 60} ô khác.</p>}
            </details>
          )}
          <div className="vb-acts">
            <button type="button" className="btn btn-primary btn-sm" onClick={saveXl}><FileSpreadsheet aria-hidden="true" /> Tải Excel đã chuẩn hoá</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onPrintSheets({ file: xl.file, sheets: xl.sheets })}><Printer aria-hidden="true" /> In bảng này →</button>
          </div>
          <p className="dash-muted">File tải về giữ chữ, số, ô gộp; màu nền, công thức và độ rộng cột gốc không giữ lại — nên dùng bản này để in hoặc dán lại vào file gốc.</p>
        </div>
      )}
      <textarea className="vb-text" rows={14} value={text} maxLength={60000} placeholder="Dán văn bản cần kiểm tra vào đây…" onChange={(e) => setText(e.target.value)} aria-label="Văn bản cần chuẩn hoá" />
      {text.trim() && (
        <>
          <IssueList issues={issues} fixLabel="Sửa tự động" />
          <div className="vb-acts">
            <button type="button" className="btn btn-primary btn-sm" onClick={fix}><Sparkles aria-hidden="true" /> Sửa tự động</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void navigator.clipboard.writeText(text).then(() => onFlash('Đã chép văn bản.'), () => onFlash('Máy chưa cho chép — bôi đen rồi chép tay.'))}><Copy aria-hidden="true" /> Chép</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={word}><FileText aria-hidden="true" /> Tải Word (Times New Roman 14, lề NĐ30)</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onEdit(paraHtml(text))}><PenLine aria-hidden="true" /> Xem trước & sửa trên trang</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onUse(text)}>Đưa vào mẫu văn bản →</button>
          </div>
          <p className="dash-muted">Đọc file Word chỉ lấy chữ (bảng thành dòng “ô | ô”); hình và định dạng gốc không giữ lại. Bản tải về dùng font, cỡ chữ, lề theo NĐ30.</p>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------- (3) in bảng Excel */
function trimSheet(s: Sheet) {
  let rows = s.rows.map((r) => r.map((c) => c ?? ''));
  while (rows.length && rows[rows.length - 1].every((c) => !c.trim())) rows = rows.slice(0, -1);
  const width = Math.max(0, ...rows.map((r) => { let w = r.length; while (w && !r[w - 1]?.trim()) w--; return w; }));
  return rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}

function ExcelPrint({ onPrint, initial }: { onPrint: (html: string, setup: PageSetup) => void; initial?: { file: string; sheets: Sheet[] } | null }) {
  const [sheets, setSheets] = useState<Sheet[]>(initial?.sheets ?? []);
  const [idx, setIdx] = useState(0);
  const [file, setFile] = useState(initial?.file ?? '');
  const [err, setErr] = useState('');
  const [title, setTitle] = useState('');
  const [head, setHead] = useState(1);
  const [grid, setGrid] = useState(true);
  const [zoom, setZoom] = useState(0.8);
  // bảng in: số trang dưới chân "Trang 1/3" (bảng nhiều trang dễ xếp thứ tự), khổ tự chọn theo số cột
  const [setup, setSetup] = useState<PageSetup>({ ...DEFAULT_SETUP, pageNum: 'bottom', pageFmt: 'trang-tong', hideFirst: false });
  // dữ liệu đang sửa (bấm vào ô để sửa thẳng trên trang)
  const [data, setData] = useState<string[][]>([]);

  const sheet = sheets[idx];
  useEffect(() => {
    const d = sheet ? trimSheet(sheet) : [];
    setData(d);
    setSetup((s) => ({ ...s, landscape: (d[0]?.length ?? 0) > 6 }));
  }, [sheet]);
  const rows = data;
  const cols = rows[0]?.length ?? 0;
  // dòng đầu chỉ có một ô chữ (tiêu đề gộp, vd "DANH SÁCH LỚP 1A1") → dùng làm tiêu đề in, dòng lặp lại bắt đầu từ dòng sau
  const autoTitle = rows.length > 2 && cols > 1 && rows[0].filter((c) => c.trim()).length === 1 ? rows[0].find((c) => c.trim())!.trim() : '';
  const start = autoTitle ? 1 : 0;
  const fs = cols > 14 ? 8 : cols > 10 ? 9 : cols > 7 ? 10.5 : 12;
  const h = Math.min(start + head, rows.length);
  const shownTitle = title.trim() || autoTitle;

  const load = async (f: File) => {
    setErr('');
    try {
      const all = (await readXlsxAll(await f.arrayBuffer())).filter((s) => !s.hidden && s.rows.some((r) => r.some((c) => c?.trim())));
      if (!all.length) { setErr('File không có trang tính nào có dữ liệu.'); return; }
      setSheets(all); setIdx(0); setFile(f.name); setTitle('');
    } catch (e) { setErr(e instanceof Error ? e.message : 'Không đọc được file.'); }
  };

  // ô gộp: ô đầu nhận rowspan/colspan, các ô bị gộp bỏ đi
  const { span, hidden } = useMemo(() => {
    const sp = new Map<string, [number, number]>(), hd = new Set<string>();
    for (const [r1, c1, r2, c2] of sheet?.merges ?? []) {
      sp.set(`${r1},${c1}`, [r2 - r1 + 1, c2 - c1 + 1]);
      for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) hd.add(`${r},${c}`);
    }
    return { span: sp, hidden: hd };
  }, [sheet]);
  const isNum = (c: string) => /^-?[\d.,]+%?$/.test(c.trim());

  const tableHtml = useMemo(() => {
    if (!rows.length) return '';
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    const tr = (r: string[], i: number, tag: 'th' | 'td') => `<tr>${r.map((c, j) => {
      if (hidden.has(`${i},${j}`)) return '';
      const sp = span.get(`${i},${j}`);
      return `<${tag}${sp ? ` rowspan="${sp[0]}" colspan="${sp[1]}"` : ''}${tag === 'td' && isNum(c) ? ' class="n"' : ''}>${esc(c)}</${tag}>`;
    }).join('')}</tr>`;
    return `<div class="vb-sheet${grid ? ' is-grid' : ''}" style="font-size:${fs}pt">${shownTitle ? `<h2>${esc(shownTitle)}</h2>` : ''}<table><thead>${rows.slice(start, h).map((r, i) => tr(r, i + start, 'th')).join('')}</thead><tbody>${rows.slice(h).map((r, i) => tr(r, i + h, 'td')).join('')}</tbody></table></div>`;
  }, [rows, h, grid, shownTitle, fs, start, span, hidden]);

  const editCell = (r: number, c: number, v: string) => setData((d) => (d[r]?.[c] === v ? d : d.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row))));
  const saveXl = () => {
    if (!sheet) return;
    const bytes = buildXlsx([{ name: sheetName(sheet.name), rows: rows.map((r) => r.map(asCell)), merges: sheet.merges.map(([r1, c1, r2, c2]) => range(r1, c1, r2, c2)) }]);
    download(bytes, (file.replace(/\.xlsx$/i, '') || 'bang') + '-da-sua.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };
  const cell = (c: string, r: number, j: number, Tag: 'th' | 'td') => {
    if (hidden.has(`${r},${j}`)) return null;
    const sp = span.get(`${r},${j}`);
    return (
      <Tag key={j} rowSpan={sp?.[0]} colSpan={sp?.[1]} className={Tag === 'td' && isNum(c) ? 'n' : undefined}
        contentEditable suppressContentEditableWarning onBlur={(e) => editCell(r, j, e.currentTarget.innerText.replace(/\n$/, ''))}>{c}</Tag>
    );
  };

  return (
    <section className="dash-card vb-xl no-print">
      <div className="vb-acts">
        <label className="btn btn-outline btn-sm vb-upload"><Upload aria-hidden="true" /> {file ? 'Mở file khác' : 'Mở file Excel (.xlsx)'}
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ''; }} />
        </label>
        {file && <span className="dash-muted">{file} · {rows.length} dòng × {cols} cột</span>}
      </div>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      {!sheet ? <p className="dash-muted">Danh sách lớp, bảng điểm, bảng thu quỹ… mở vào đây để sửa, in vừa trang, dòng tên cột lặp lại ở mỗi trang.</p> : (
        <div className="vbe-body">
          <aside className="vbe-side">
            <div className="vb-fields vb-xl-opts">
              {sheets.length > 1 && <label className="vb-wide">Trang tính<select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>{sheets.map((s, i) => <option key={i} value={i}>{s.name}</option>)}</select></label>}
              <label className="vb-wide">Tiêu đề in ở đầu<input value={title} maxLength={150} placeholder={autoTitle || sheet.name} onChange={(e) => setTitle(e.target.value)} /></label>
              <label>Dòng tên cột lặp lại<select value={head} onChange={(e) => setHead(Number(e.target.value))}>{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? 'Không lặp' : `${n} dòng`}</option>)}</select></label>
              <label className="vb-check"><input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} /> Kẻ khung</label>
            </div>
            <SetupPanel setup={setup} onChange={setSetup} showFont={false} />
            <p className="vbe-tip">Bấm vào ô trên trang để sửa chữ. Chữ {fs}pt để vừa {cols} cột.</p>
          </aside>
          <div className="vbe-main">
            <div className="vbe-tools">
              <button type="button" className="vbe-primary" onClick={() => onPrint(tableHtml, setup)}><Printer aria-hidden="true" /> In / lưu PDF</button>
              <button type="button" onClick={saveXl}><FileSpreadsheet aria-hidden="true" /> Tải Excel đã sửa</button>
              <ZoomBar zoom={zoom} onZoom={setZoom} />
            </div>
            <Paper setup={{ ...setup, fontSize: fs }} zoom={zoom}>
              <div className={`vb-sheet${grid ? ' is-grid' : ''}`}>
                {shownTitle && <h2>{shownTitle}</h2>}
                <table>
                  <thead>{rows.slice(start, h).map((r, i) => <tr key={i}>{r.map((c, j) => cell(c, i + start, j, 'th'))}</tr>)}</thead>
                  <tbody>{rows.slice(h).map((r, i) => <tr key={i}>{r.map((c, j) => cell(c, i + h, j, 'td'))}</tr>)}</tbody>
                </table>
              </div>
            </Paper>
          </div>
        </div>
      )}
    </section>
  );
}
