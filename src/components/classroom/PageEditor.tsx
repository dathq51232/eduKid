'use client';

// Xem trước & sửa thẳng trên trang A4 (Văn bản & in ấn) — thiết kế cho thầy cô lớn tuổi: nút to có chữ, phóng to được,
// đường đỏ mảnh đánh dấu chỗ sang trang (ước tính). Đầu trang, chân trang, số trang dùng chung cho In / PDF và Word.
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, Redo2, Underline, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import type { PageDeco } from '@/lib/docx-write';
import type { Sheet } from '@/lib/xlsx-read';

export type PageSetup = Required<Omit<PageDeco, 'landscape'>> & { landscape: boolean; fontSize: number };
/** Mặc định theo NĐ30: số trang giữa lề trên, không hiện ở trang đầu */
export const DEFAULT_SETUP: PageSetup = { header: '', footer: '', pageNum: 'top', pageFmt: 'num', hideFirst: true, landscape: false, fontSize: 14 };
/** Bảng tính: "Trang 1/3" dưới chân (bảng nhiều trang dễ xếp thứ tự) */
export const SHEET_SETUP: PageSetup = { ...DEFAULT_SETUP, pageNum: 'bottom', pageFmt: 'trang-tong', hideFirst: false };

const cssStr = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
const numCss = (f: PageSetup['pageFmt']) => (f === 'trang' ? '"Trang " counter(page)' : f === 'trang-tong' ? '"Trang " counter(page) "/" counter(pages)' : 'counter(page)');

/** CSS @page khi in: khổ, lề NĐ30 (dọc) / lề hẹp (ngang), đầu trang – chân trang – số trang bằng ô lề của trang */
export function pageCss(s: PageSetup): string {
  const margin = s.landscape ? '15mm 12mm 15mm 12mm' : '20mm 15mm 20mm 30mm';
  const box = 'font-family:"Times New Roman",Times,serif;font-size:12pt;white-space:pre;';
  const top = [s.pageNum === 'top' ? numCss(s.pageFmt) : '', s.header.trim() ? cssStr(s.header.trim()) : ''].filter(Boolean).join(' "\\A" ');
  const bottom = [s.footer.trim() ? cssStr(s.footer.trim()) : '', s.pageNum === 'bottom' ? numCss(s.pageFmt) : ''].filter(Boolean).join(' "\\A" ');
  const first = s.hideFirst && s.pageNum !== 'none'
    ? `@page :first { @top-center { content: ${s.header.trim() ? cssStr(s.header.trim()) : 'none'}; ${box} } @bottom-center { content: ${s.footer.trim() ? cssStr(s.footer.trim()) : 'none'}; ${box} } }`
    : '';
  return `@page { size: A4 ${s.landscape ? 'landscape' : 'portrait'}; margin: ${margin};${top ? ` @top-center { content: ${top}; ${box} }` : ''}${bottom ? ` @bottom-center { content: ${bottom}; ${box} }` : ''} } ${first}`;
}

/* ---------------------------------------------------------- cài đặt trang (dùng chung văn bản / bảng) */
export function SetupPanel({ setup, onChange, showFont = true }: { setup: PageSetup; onChange: (s: PageSetup) => void; showFont?: boolean }) {
  const set = (p: Partial<PageSetup>) => onChange({ ...setup, ...p });
  return (
    <div className="vbe-setup">
      <label>Đầu trang <small>(chữ ở lề trên mỗi trang, vd tên trường)</small><input value={setup.header} maxLength={120} placeholder="Để trống nếu không cần" onChange={(e) => set({ header: e.target.value })} /></label>
      <label>Chân trang <small>(chữ ở lề dưới mỗi trang)</small><input value={setup.footer} maxLength={120} placeholder="Để trống nếu không cần" onChange={(e) => set({ footer: e.target.value })} /></label>
      <fieldset>
        <legend>Số trang</legend>
        <div className="vbe-seg">
          {([['none', 'Không đánh'], ['top', 'Giữa lề trên (NĐ30)'], ['bottom', 'Giữa lề dưới']] as const).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={setup.pageNum === v} onClick={() => set({ pageNum: v })}>{l}</button>
          ))}
        </div>
        {setup.pageNum !== 'none' && (
          <div className="vbe-seg">
            {([['num', '1, 2, 3'], ['trang', 'Trang 1'], ['trang-tong', 'Trang 1/3']] as const).map(([v, l]) => (
              <button key={v} type="button" aria-pressed={setup.pageFmt === v} onClick={() => set({ pageFmt: v })}>{l}</button>
            ))}
          </div>
        )}
        {setup.pageNum !== 'none' && (
          <label className="vbe-check"><input type="checkbox" checked={setup.hideFirst} onChange={(e) => set({ hideFirst: e.target.checked })} /> Không hiện số ở trang đầu (theo NĐ30)</label>
        )}
      </fieldset>
      <fieldset>
        <legend>Khổ giấy</legend>
        <div className="vbe-seg">
          <button type="button" aria-pressed={!setup.landscape} onClick={() => set({ landscape: false })}>A4 dọc</button>
          <button type="button" aria-pressed={setup.landscape} onClick={() => set({ landscape: true })}>A4 ngang</button>
        </div>
      </fieldset>
      {showFont && (
        <fieldset>
          <legend>Cỡ chữ cả văn bản</legend>
          <div className="vbe-seg vbe-font">
            <button type="button" aria-label="Chữ nhỏ hơn" onClick={() => set({ fontSize: Math.max(10, setup.fontSize - 1) })}><Minus aria-hidden="true" /></button>
            <b>{setup.fontSize}</b>
            <button type="button" aria-label="Chữ to hơn" onClick={() => set({ fontSize: Math.min(18, setup.fontSize + 1) })}><Plus aria-hidden="true" /></button>
          </div>
        </fieldset>
      )}
    </div>
  );
}

/** Khung trang A4 có lề, đầu/chân trang mẫu và đường sang trang; zoom để thầy cô xem chữ to */
export function Paper({ setup, zoom, children }: { setup: PageSetup; zoom: number; children: React.ReactNode }) {
  const num = setup.pageFmt === 'trang' ? 'Trang 1' : setup.pageFmt === 'trang-tong' ? 'Trang 1/…' : '1';
  return (
    <div className="vbe-scroll">
      <div className={`vbe-page${setup.landscape ? ' is-land' : ''}`} style={{ zoom, fontSize: `${setup.fontSize}pt` }}>
        <div className="vbe-hd" aria-hidden="true">
          {setup.pageNum === 'top' && <span className="vbe-num">{setup.hideFirst ? '(trang 1 không hiện số)' : num}</span>}
          {setup.header.trim() && <span>{setup.header}</span>}
        </div>
        {children}
        <div className="vbe-ft" aria-hidden="true">
          {setup.footer.trim() && <span>{setup.footer}</span>}
          {setup.pageNum === 'bottom' && <span className="vbe-num">{setup.hideFirst ? '(trang 1 không hiện số)' : num}</span>}
        </div>
      </div>
    </div>
  );
}

export function ZoomBar({ zoom, onZoom }: { zoom: number; onZoom: (z: number) => void }) {
  return (
    <div className="vbe-zoom" role="group" aria-label="Phóng to thu nhỏ trang">
      <button type="button" onClick={() => onZoom(Math.max(0.5, +(zoom - 0.1).toFixed(1)))}><ZoomOut aria-hidden="true" /> Thu nhỏ</button>
      <b>{Math.round(zoom * 100)}%</b>
      <button type="button" onClick={() => onZoom(Math.min(1.6, +(zoom + 0.1).toFixed(1)))}><ZoomIn aria-hidden="true" /> Phóng to</button>
    </div>
  );
}

/** Zoom vừa khung lúc mở (điện thoại / máy tính bảng thu nhỏ trang) */
function useFitZoom(ref: React.RefObject<HTMLElement | null>, pageMm: number) {
  const [zoom, setZoom] = useState(0.9);
  useEffect(() => {
    const w = ref.current?.closest('.vbe-main')?.clientWidth ?? 900;
    setZoom(Math.min(1, Math.max(0.5, +((w - 40) / (pageMm * 3.78)).toFixed(1))));
  }, [ref, pageMm]);
  return [zoom, setZoom] as const;
}

/* ---------------------------------------------------------- sửa văn bản trên trang */
const CMDS: { cmd: string; label: string; Icon: typeof Bold }[] = [
  { cmd: 'bold', label: 'Đậm', Icon: Bold },
  { cmd: 'italic', label: 'Nghiêng', Icon: Italic },
  { cmd: 'underline', label: 'Gạch chân', Icon: Underline },
  { cmd: 'justifyLeft', label: 'Căn trái', Icon: AlignLeft },
  { cmd: 'justifyCenter', label: 'Căn giữa', Icon: AlignCenter },
  { cmd: 'justifyRight', label: 'Căn phải', Icon: AlignRight },
  { cmd: 'justifyFull', label: 'Căn đều', Icon: AlignJustify },
  { cmd: 'undo', label: 'Hoàn tác', Icon: Undo2 },
  { cmd: 'redo', label: 'Làm lại', Icon: Redo2 },
];

/**
 * Sửa văn bản trên trang. initialHtml chỉ đặt lúc mở (đổi văn bản thì đổi `key`); mỗi lần sửa báo onChange(html) để
 * nơi gọi giữ bản mới nhất (chuyển tab, in, tải Word đều dùng bản này). Thanh nút hành động do nơi gọi truyền vào.
 */
export function DocEditor({ initialHtml, setup, onChange, actions }: { initialHtml: string; setup: PageSetup; onChange: (html: string) => void; actions?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useFitZoom(ref, setup.landscape ? 297 : 210);
  // bản mới nhất + hàm báo lên luôn ở ref: khi đóng trình sửa (chuyển tab) vẫn báo đủ chỗ vừa sửa, không phụ thuộc lần vẽ lại
  const latest = useRef(initialHtml);
  const report = useRef(onChange);
  report.current = onChange;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đặt nội dung lúc mở; sau đó thầy cô sửa thẳng trên trang
  useEffect(() => { if (ref.current) ref.current.innerHTML = initialHtml; }, []);
  // báo ngay mỗi lần sửa (không chờ): chuyển tab liền sau khi gõ thì trình sửa ở tab kia vẫn mở đúng bản mới nhất
  const changed = () => {
    latest.current = ref.current?.innerHTML ?? latest.current;
    report.current(latest.current);
  };
  const run = (cmd: string) => { ref.current?.focus(); document.execCommand(cmd, false); changed(); };

  return (
    <div className="vbe-main">
      <div className="vbe-tools" role="toolbar" aria-label="Định dạng chữ">
        {actions}
        {CMDS.map(({ cmd, label, Icon }) => (
          // onMouseDown + preventDefault: giữ nguyên vùng chữ đang bôi đen khi bấm nút
          <button key={cmd} type="button" onMouseDown={(e) => { e.preventDefault(); run(cmd); }}><Icon aria-hidden="true" /> {label}</button>
        ))}
        <ZoomBar zoom={zoom} onZoom={setZoom} />
      </div>
      <Paper setup={setup} zoom={zoom}>
        <div ref={ref} className="vbe-edit" contentEditable suppressContentEditableWarning spellCheck={false} onInput={changed} aria-label="Nội dung văn bản — bấm để sửa" />
      </Paper>
    </div>
  );
}

/* ---------------------------------------------------------- sửa bảng tính trên trang */
export type SheetView = { title: string; head: number; grid: boolean };
export const DEFAULT_VIEW: SheetView = { title: '', head: 1, grid: true };

export function trimSheet(s: Sheet): string[][] {
  let rows = s.rows.map((r) => r.map((c) => c ?? ''));
  while (rows.length && rows[rows.length - 1].every((c) => !c.trim())) rows = rows.slice(0, -1);
  const width = Math.max(0, ...rows.map((r) => { let w = r.length; while (w && !r[w - 1]?.trim()) w--; return w; }));
  return rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}
const isNum = (c: string) => /^-?[\d.,]+%?$/.test(c.trim());
/** dòng đầu chỉ có một ô chữ (tiêu đề gộp, vd "DANH SÁCH LỚP 1A1") → dùng làm tiêu đề in */
const autoTitleOf = (rows: string[][]) => (rows.length > 2 && (rows[0]?.length ?? 0) > 1 && rows[0].filter((c) => c.trim()).length === 1 ? rows[0].find((c) => c.trim())!.trim() : '');
const fontFor = (cols: number) => (cols > 14 ? 8 : cols > 10 ? 9 : cols > 7 ? 10.5 : 12);

function spans(merges: Sheet['merges']) {
  const span = new Map<string, [number, number]>(), hidden = new Set<string>();
  for (const [r1, c1, r2, c2] of merges) {
    span.set(`${r1},${c1}`, [r2 - r1 + 1, c2 - c1 + 1]);
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) hidden.add(`${r},${c}`);
  }
  return { span, hidden };
}

/** HTML bảng để in (thead lặp lại mỗi trang) */
export function sheetHtml(sheet: Sheet, view: SheetView): string {
  const rows = trimSheet(sheet);
  if (!rows.length) return '';
  const { span, hidden } = spans(sheet.merges);
  const auto = autoTitleOf(rows), start = auto ? 1 : 0, h = Math.min(start + view.head, rows.length), t = view.title.trim() || auto;
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  const tr = (r: string[], i: number, tag: 'th' | 'td') => `<tr>${r.map((c, j) => {
    if (hidden.has(`${i},${j}`)) return '';
    const sp = span.get(`${i},${j}`);
    return `<${tag}${sp ? ` rowspan="${sp[0]}" colspan="${sp[1]}"` : ''}${tag === 'td' && isNum(c) ? ' class="n"' : ''}>${esc(c)}</${tag}>`;
  }).join('')}</tr>`;
  return `<div class="vb-sheet${view.grid ? ' is-grid' : ''}" style="font-size:${fontFor(rows[0].length)}pt">${t ? `<h2>${esc(t)}</h2>` : ''}<table><thead>${rows.slice(start, h).map((r, i) => tr(r, i + start, 'th')).join('')}</thead><tbody>${rows.slice(h).map((r, i) => tr(r, i + h, 'td')).join('')}</tbody></table></div>`;
}

/** Sửa bảng: bấm ô để sửa chữ; chọn trang tính, tiêu đề, số dòng tên cột lặp lại, kẻ khung */
export function SheetEditor({ sheets, idx, onIdx, onSheets, view, onView, setup, actions }: {
  sheets: Sheet[]; idx: number; onIdx: (i: number) => void; onSheets: (s: Sheet[]) => void;
  view: SheetView; onView: (v: SheetView) => void; setup: PageSetup; actions?: React.ReactNode;
}) {
  const sheet = sheets[idx] ?? sheets[0];
  const rows = useMemo(() => (sheet ? trimSheet(sheet) : []), [sheet]);
  const { span, hidden } = useMemo(() => spans(sheet?.merges ?? []), [sheet]);
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useFitZoom(ref, setup.landscape ? 297 : 210);
  if (!sheet) return null;
  const auto = autoTitleOf(rows), start = auto ? 1 : 0, h = Math.min(start + view.head, rows.length), cols = rows[0]?.length ?? 0;
  const edit = (r: number, c: number, v: string) => {
    if (rows[r]?.[c] === v) return;
    const next = sheet.rows.map((row, i) => (i === r ? Array.from({ length: Math.max(row.length, c + 1) }, (_, j) => (j === c ? v : row[j] ?? '')) : row));
    onSheets(sheets.map((s) => (s === sheet ? { ...s, rows: next } : s)));
  };
  const cell = (c: string, r: number, j: number, Tag: 'th' | 'td') => {
    if (hidden.has(`${r},${j}`)) return null;
    const sp = span.get(`${r},${j}`);
    return (
      <Tag key={j} rowSpan={sp?.[0]} colSpan={sp?.[1]} className={Tag === 'td' && isNum(c) ? 'n' : undefined}
        contentEditable suppressContentEditableWarning onBlur={(e) => edit(r, j, e.currentTarget.innerText.replace(/\n$/, ''))}>{c}</Tag>
    );
  };
  return (
    <div className="vbe-main" ref={ref}>
      <div className="vbe-tools">
        {actions}
        {sheets.length > 1 && (
          <label className="vbe-pick">Trang tính
            <select value={sheets.indexOf(sheet)} onChange={(e) => onIdx(Number(e.target.value))}>{sheets.map((s, i) => <option key={i} value={i}>{s.name}</option>)}</select>
          </label>
        )}
        <label className="vbe-pick">Dòng tên cột lặp lại
          <select value={view.head} onChange={(e) => onView({ ...view, head: Number(e.target.value) })}>{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? 'Không lặp' : `${n} dòng`}</option>)}</select>
        </label>
        <label className="vbe-pick vbe-checkbox"><input type="checkbox" checked={view.grid} onChange={(e) => onView({ ...view, grid: e.target.checked })} /> Kẻ khung</label>
        <ZoomBar zoom={zoom} onZoom={setZoom} />
      </div>
      <label className="vbe-title">Tiêu đề in ở đầu bảng<input value={view.title} maxLength={150} placeholder={auto || sheet.name} onChange={(e) => onView({ ...view, title: e.target.value })} /></label>
      <Paper setup={{ ...setup, fontSize: fontFor(cols) }} zoom={zoom}>
        <div className={`vb-sheet${view.grid ? ' is-grid' : ''}`}>
          {(view.title.trim() || auto) && <h2>{view.title.trim() || auto}</h2>}
          <table>
            <thead>{rows.slice(start, h).map((r, i) => <tr key={i}>{r.map((c, j) => cell(c, i + start, j, 'th'))}</tr>)}</thead>
            <tbody>{rows.slice(h).map((r, i) => <tr key={i + h}>{r.map((c, j) => cell(c, i + h, j, 'td'))}</tr>)}</tbody>
          </table>
        </div>
      </Paper>
      <p className="vbe-tip">Bấm vào ô trên trang để sửa chữ. {rows.length} dòng × {cols} cột · chữ {fontFor(cols)}pt cho vừa trang.</p>
    </div>
  );
}
