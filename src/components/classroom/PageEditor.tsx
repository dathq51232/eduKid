'use client';

// Xem trước & sửa thẳng trên trang A4 (Văn bản & in ấn) — thiết kế cho thầy cô lớn tuổi: nút to có chữ, phóng to được,
// đường đỏ mảnh đánh dấu chỗ sang trang (ước tính). Đầu trang, chân trang, số trang dùng chung cho In / PDF và Word.
import { useEffect, useRef, useState } from 'react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Bold, FileText, Italic, Minus, Plus, Printer, Redo2, Underline, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import type { PageDeco } from '@/lib/docx-write';

export type PageSetup = Required<Omit<PageDeco, 'landscape'>> & { landscape: boolean; fontSize: number };
/** Mặc định theo NĐ30: số trang giữa lề trên, không hiện ở trang đầu */
export const DEFAULT_SETUP: PageSetup = { header: '', footer: '', pageNum: 'top', pageFmt: 'num', hideFirst: true, landscape: false, fontSize: 14 };

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

export function DocEditor({ initialHtml, title, onBack, onPrint, onWord, initialSetup }: {
  initialHtml: string; title: string; onBack: () => void;
  onPrint: (html: string, setup: PageSetup) => void; onWord: (html: string, setup: PageSetup) => void; initialSetup?: Partial<PageSetup>;
}) {
  const [setup, setSetup] = useState<PageSetup>({ ...DEFAULT_SETUP, ...initialSetup });
  const [zoom, setZoom] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  // nội dung chỉ đặt một lần — sau đó thầy cô sửa thẳng trên trang (không ghi đè khi giao diện vẽ lại)
  useEffect(() => { if (ref.current) ref.current.innerHTML = initialHtml; }, [initialHtml]);
  // vừa khung màn hình lúc mở (điện thoại / máy tính bảng thu nhỏ trang)
  useEffect(() => { const w = ref.current?.closest('.vbe-scroll')?.clientWidth ?? 800; setZoom(Math.min(1, Math.max(0.5, +((w - 24) / 800).toFixed(1)))); }, []);
  const html = () => `<html><body>${ref.current?.innerHTML ?? ''}</body></html>`;
  const run = (cmd: string) => { ref.current?.focus(); document.execCommand(cmd, false); };

  return (
    <section className="vbe">
      <div className="vbe-top">
        <button type="button" className="btn btn-outline btn-sm" onClick={onBack}><ArrowLeft aria-hidden="true" /> Quay lại</button>
        <h2>{title}</h2>
        <div className="vbe-out">
          <button type="button" className="btn btn-primary" onClick={() => onWord(html(), setup)}><FileText aria-hidden="true" /> Tải Word</button>
          <button type="button" className="btn btn-outline" onClick={() => onPrint(html(), setup)}><Printer aria-hidden="true" /> In / lưu PDF</button>
        </div>
      </div>
      <div className="vbe-body">
        <aside className="vbe-side">
          <SetupPanel setup={setup} onChange={setSetup} />
          <p className="vbe-tip">Bấm vào chữ trên trang để sửa như trong Word. Đường đỏ mảnh là chỗ sang trang (ước tính).</p>
        </aside>
        <div className="vbe-main">
          <div className="vbe-tools" role="toolbar" aria-label="Định dạng chữ">
            {CMDS.map(({ cmd, label, Icon }) => (
              // onMouseDown + preventDefault: giữ nguyên vùng chữ đang bôi đen khi bấm nút
              <button key={cmd} type="button" onMouseDown={(e) => { e.preventDefault(); run(cmd); }}><Icon aria-hidden="true" /> {label}</button>
            ))}
            <ZoomBar zoom={zoom} onZoom={setZoom} />
          </div>
          <Paper setup={setup} zoom={zoom}>
            <div ref={ref} className="vbe-edit" contentEditable suppressContentEditableWarning spellCheck={false} aria-label="Nội dung văn bản — bấm để sửa" />
          </Paper>
        </div>
      </div>
    </section>
  );
}
