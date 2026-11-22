'use client';

// Khung soạn & in kiểu Word / Excel (Văn bản & in ấn): thanh ribbon gom công cụ theo nhóm có tên —
//   Trang chủ: Tệp · Chuẩn hoá · Phông chữ · Đoạn văn · Chỉnh sửa (bảng: Bảng tính)
//   Bố cục trang: Khổ giấy · Số trang · Đầu & chân trang
//   Thu phóng luôn ở góc phải. Trang A4 thật bên dưới, sửa thẳng được; đường đỏ mảnh = chỗ sang trang (ước tính).
// Nút: biểu tượng trên – chữ dưới, đủ to cho thầy cô lớn tuổi mà vẫn gọn.
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

/* ---------------------------------------------------------- ribbon */
/** Nút ribbon: biểu tượng trên, chữ dưới */
export function RbBtn({ icon, label, onClick, pressed, primary, disabled, keepFocus, small }: {
  icon?: React.ReactNode; label: string; onClick?: () => void; pressed?: boolean; primary?: boolean; disabled?: boolean;
  /** giữ vùng chữ đang bôi đen (nút định dạng chữ) */
  keepFocus?: boolean;
  /** nút nhỏ: biểu tượng cạnh chữ, xếp 2 hàng trong nhóm (như Word) */
  small?: boolean;
}) {
  return (
    <button type="button" className={`vbe-rb${small ? ' is-small' : ''}${primary ? ' is-primary' : ''}`} aria-pressed={pressed} disabled={disabled}
      onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined} onClick={onClick}>
      {icon}<span>{label}</span>
    </button>
  );
}
/** Nhóm ribbon: các nút + tên nhóm ở dưới (như Word) */
export function RbGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="vbe-rg" role="group" aria-label={label}>
      <div className="vbe-rg-items">{children}</div>
      <div className="vbe-rg-label">{label}</div>
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

/* ---------------------------------------------------------- bảng tính */
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

/* ---------------------------------------------------------- khung soạn & in */
type DocProps = { kind: 'doc'; docKey: number; html: string; onHtml: (h: string) => void };
type SheetProps = { kind: 'sheet'; sheets: Sheet[]; idx: number; onIdx: (i: number) => void; onSheets: (s: Sheet[]) => void; view: SheetView; onView: (v: SheetView) => void };
type RibbonTab = 'home' | 'layout';

/**
 * Khung soạn & in dùng chung (Chuẩn hoá, Cấu hình in ấn). fileGroup / extraGroup: nút do nơi gọi truyền vào
 * (Mở, Tải, In, Đóng; Chuẩn hoá theo mẫu / Về bản gốc). startTab: thẻ ribbon mở sẵn.
 */
export function Workspace(props: (DocProps | SheetProps) & {
  setup: PageSetup; onSetup: (s: PageSetup) => void; fileGroup: React.ReactNode;
  /** nhóm "Xuất" ở thẻ Bố cục trang (chỉ Tải + In) — như Word, thẻ Bố cục không có Mở / Đóng */
  outGroup?: React.ReactNode;
  extraGroup?: { label: string; node: React.ReactNode }; startTab?: RibbonTab; below?: React.ReactNode;
}) {
  const { setup, onSetup, fileGroup, outGroup, extraGroup, startTab = 'home', below } = props;
  const [rtab, setRtab] = useState<RibbonTab>(startTab);
  const mainRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.9);
  // vừa khung lúc mở / đổi khổ (điện thoại, máy tính bảng thu nhỏ trang)
  useEffect(() => {
    const w = mainRef.current?.clientWidth ?? 900;
    setZoom(Math.min(1, Math.max(0.5, +((w - 40) / ((setup.landscape ? 297 : 210) * 3.78)).toFixed(1))));
  }, [setup.landscape]);
  const set = (p: Partial<PageSetup>) => onSetup({ ...setup, ...p });

  /* ----- văn bản: vùng sửa trên trang ----- */
  const editRef = useRef<HTMLDivElement>(null);
  const latest = useRef(props.kind === 'doc' ? props.html : '');
  const report = useRef(props.kind === 'doc' ? props.onHtml : () => {});
  if (props.kind === 'doc') report.current = props.onHtml;
  const docKey = props.kind === 'doc' ? props.docKey : -1;
  // chỉ đặt nội dung khi mở văn bản mới (docKey đổi); sau đó thầy cô sửa thẳng trên trang
  useEffect(() => {
    if (props.kind === 'doc' && editRef.current) { editRef.current.innerHTML = props.html; latest.current = props.html; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);
  // báo ngay mỗi lần sửa: chuyển tab liền sau khi gõ vẫn giữ bản mới nhất
  const changed = () => { latest.current = editRef.current?.innerHTML ?? latest.current; report.current(latest.current); };
  const cmd = (c: string) => () => { editRef.current?.focus(); document.execCommand(c, false); changed(); };

  /* ----- bảng tính ----- */
  const sheet = props.kind === 'sheet' ? props.sheets[props.idx] ?? props.sheets[0] : null;
  const rows = useMemo(() => (sheet ? trimSheet(sheet) : []), [sheet]);
  const { span, hidden } = useMemo(() => spans(sheet?.merges ?? []), [sheet]);
  const cols = rows[0]?.length ?? 0;

  const zoomGroup = (
    <div className="vbe-zoom" role="group" aria-label="Thu phóng trang">
      <button type="button" aria-label="Thu nhỏ" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}><ZoomOut aria-hidden="true" /></button>
      <b>{Math.round(zoom * 100)}%</b>
      <button type="button" aria-label="Phóng to" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(1)))}><ZoomIn aria-hidden="true" /></button>
    </div>
  );

  const home = (
    <>
      <RbGroup label="Tệp">{fileGroup}</RbGroup>
      {extraGroup && <RbGroup label={extraGroup.label}>{extraGroup.node}</RbGroup>}
      {props.kind === 'doc' ? (
        <>
          <RbGroup label="Phông chữ">
            <div className="vbe-grid2">
              <RbBtn small keepFocus icon={<Bold aria-hidden="true" />} label="Đậm" onClick={cmd('bold')} />
              <RbBtn small keepFocus icon={<Italic aria-hidden="true" />} label="Nghiêng" onClick={cmd('italic')} />
              <RbBtn small keepFocus icon={<Underline aria-hidden="true" />} label="Gạch chân" onClick={cmd('underline')} />
              <div className="vbe-size" title="Cỡ chữ cả văn bản">
                <button type="button" aria-label="Chữ nhỏ hơn" onClick={() => set({ fontSize: Math.max(10, setup.fontSize - 1) })}><Minus aria-hidden="true" /></button>
                <b aria-label={`Cỡ chữ ${setup.fontSize}`}>{setup.fontSize}</b>
                <button type="button" aria-label="Chữ to hơn" onClick={() => set({ fontSize: Math.min(18, setup.fontSize + 1) })}><Plus aria-hidden="true" /></button>
              </div>
            </div>
          </RbGroup>
          <RbGroup label="Đoạn văn">
            <div className="vbe-grid2">
              <RbBtn small keepFocus icon={<AlignLeft aria-hidden="true" />} label="Trái" onClick={cmd('justifyLeft')} />
              <RbBtn small keepFocus icon={<AlignCenter aria-hidden="true" />} label="Giữa" onClick={cmd('justifyCenter')} />
              <RbBtn small keepFocus icon={<AlignRight aria-hidden="true" />} label="Phải" onClick={cmd('justifyRight')} />
              <RbBtn small keepFocus icon={<AlignJustify aria-hidden="true" />} label="Đều" onClick={cmd('justifyFull')} />
            </div>
          </RbGroup>
          <RbGroup label="Chỉnh sửa">
            <div className="vbe-grid1">
              <RbBtn small keepFocus icon={<Undo2 aria-hidden="true" />} label="Hoàn tác" onClick={cmd('undo')} />
              <RbBtn small keepFocus icon={<Redo2 aria-hidden="true" />} label="Làm lại" onClick={cmd('redo')} />
            </div>
          </RbGroup>
        </>
      ) : props.kind === 'sheet' && (
        <RbGroup label="Bảng tính">
          {props.sheets.length > 1 && (
            <label className="vbe-field">Trang tính
              <select value={props.sheets.indexOf(sheet!)} onChange={(e) => props.onIdx(Number(e.target.value))}>{props.sheets.map((s, i) => <option key={i} value={i}>{s.name}</option>)}</select>
            </label>
          )}
          <label className="vbe-field">Dòng tên cột lặp lại
            <select value={props.view.head} onChange={(e) => props.onView({ ...props.view, head: Number(e.target.value) })}>{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 0 ? 'Không lặp' : `${n} dòng`}</option>)}</select>
          </label>
          <label className="vbe-field vbe-wide">Tiêu đề in ở đầu bảng
            <input value={props.view.title} maxLength={150} placeholder={autoTitleOf(rows) || sheet?.name} onChange={(e) => props.onView({ ...props.view, title: e.target.value })} />
          </label>
          <label className="vbe-tick"><input type="checkbox" checked={props.view.grid} onChange={(e) => props.onView({ ...props.view, grid: e.target.checked })} /> Kẻ khung</label>
        </RbGroup>
      )}
    </>
  );

  const layout = (
    <>
      <RbGroup label="Xuất">{outGroup ?? fileGroup}</RbGroup>
      <RbGroup label="Khổ giấy">
        <RbBtn icon={<span className="vbe-paper-ic" aria-hidden="true" />} label="A4 dọc" pressed={!setup.landscape} onClick={() => set({ landscape: false })} />
        <RbBtn icon={<span className="vbe-paper-ic is-land" aria-hidden="true" />} label="A4 ngang" pressed={setup.landscape} onClick={() => set({ landscape: true })} />
      </RbGroup>
      <RbGroup label="Số trang">
        <div className="vbe-grid1">
          <label className="vbe-inline">Vị trí
            <select value={setup.pageNum} onChange={(e) => set({ pageNum: e.target.value as PageSetup['pageNum'] })}>
              <option value="none">Không đánh số</option><option value="top">Giữa lề trên (NĐ30)</option><option value="bottom">Giữa lề dưới</option>
            </select>
          </label>
          <label className="vbe-inline">Kiểu số
            <select value={setup.pageFmt} disabled={setup.pageNum === 'none'} onChange={(e) => set({ pageFmt: e.target.value as PageSetup['pageFmt'] })}>
              <option value="num">1, 2, 3</option><option value="trang">Trang 1</option><option value="trang-tong">Trang 1/3</option>
            </select>
          </label>
        </div>
        <label className="vbe-tick vbe-tick-col"><input type="checkbox" checked={setup.hideFirst} disabled={setup.pageNum === 'none'} onChange={(e) => set({ hideFirst: e.target.checked })} /> Ẩn số ở<br />trang đầu</label>
      </RbGroup>
      <RbGroup label="Đầu & chân trang">
        <div className="vbe-grid1">
          <label className="vbe-inline">Đầu trang<input value={setup.header} maxLength={120} placeholder="vd: tên trường" onChange={(e) => set({ header: e.target.value })} /></label>
          <label className="vbe-inline">Chân trang<input value={setup.footer} maxLength={120} placeholder="để trống nếu không cần" onChange={(e) => set({ footer: e.target.value })} /></label>
        </div>
      </RbGroup>
    </>
  );

  const cell = (c: string, r: number, j: number, Tag: 'th' | 'td') => {
    if (hidden.has(`${r},${j}`) || props.kind !== 'sheet' || !sheet) return null;
    const sp = span.get(`${r},${j}`);
    const edit = (v: string) => {
      if (rows[r]?.[j] === v) return;
      const next = sheet.rows.map((row, i) => (i === r ? Array.from({ length: Math.max(row.length, j + 1) }, (_, k) => (k === j ? v : row[k] ?? '')) : row));
      props.onSheets(props.sheets.map((s) => (s === sheet ? { ...s, rows: next } : s)));
    };
    return (
      <Tag key={j} rowSpan={sp?.[0]} colSpan={sp?.[1]} className={Tag === 'td' && isNum(c) ? 'n' : undefined}
        contentEditable suppressContentEditableWarning onBlur={(e) => edit(e.currentTarget.innerText.replace(/\n$/, ''))}>{c}</Tag>
    );
  };
  const auto = autoTitleOf(rows), start = auto ? 1 : 0;
  const h = props.kind === 'sheet' ? Math.min(start + props.view.head, rows.length) : 0;

  return (
    <div className="vbe-ws">
      <div className="vbe-ribbon">
        <div className="vbe-rtabs" role="tablist" aria-label="Thanh công cụ">
          <button type="button" role="tab" aria-selected={rtab === 'home'} onClick={() => setRtab('home')}>Trang chủ</button>
          <button type="button" role="tab" aria-selected={rtab === 'layout'} onClick={() => setRtab('layout')}>Bố cục trang</button>
          {zoomGroup}
        </div>
        <div className="vbe-rbody">{rtab === 'home' ? home : layout}</div>
      </div>
      {below}
      <div className="vbe-main" ref={mainRef}>
        {props.kind === 'doc' ? (
          <Paper setup={setup} zoom={zoom}>
            <div ref={editRef} className="vbe-edit" contentEditable suppressContentEditableWarning spellCheck={false} onInput={changed} aria-label="Nội dung văn bản — bấm để sửa" />
          </Paper>
        ) : (
          <Paper setup={{ ...setup, fontSize: fontFor(cols) }} zoom={zoom}>
            <div className={`vb-sheet${props.view.grid ? ' is-grid' : ''}`}>
              {(props.view.title.trim() || auto) && <h2>{props.view.title.trim() || auto}</h2>}
              <table>
                <thead>{rows.slice(start, h).map((r, i) => <tr key={i}>{r.map((c, j) => cell(c, i + start, j, 'th'))}</tr>)}</thead>
                <tbody>{rows.slice(h).map((r, i) => <tr key={i + h}>{r.map((c, j) => cell(c, i + h, j, 'td'))}</tr>)}</tbody>
              </table>
            </div>
          </Paper>
        )}
        <p className="vbe-tip">{props.kind === 'doc' ? 'Bấm vào chữ trên trang để sửa như trong Word.' : `Bấm vào ô để sửa. ${rows.length} dòng × ${cols} cột · chữ ${fontFor(cols)}pt cho vừa trang.`} Đường đỏ mảnh là chỗ sang trang (ước tính).</p>
      </div>
    </div>
  );
}
