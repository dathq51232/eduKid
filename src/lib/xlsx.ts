// Tạo file Excel .xlsx ngay trên trình duyệt — không dùng thư viện ngoài, không gửi dữ liệu đi đâu.
// Hỗ trợ đủ cho biểu mẫu nhà trường: nhiều trang tính, gộp ô, kẻ khung, chữ đậm/nghiêng, xuống dòng, độ rộng cột.
// File .xlsx là gói zip (lưu không nén) chứa các tệp XML theo chuẩn Office Open XML.

/** Kiểu ô (chỉ số trong styles.xml) */
export const XS = {
  plain: 0,
  header: 1, // đậm, giữa, khung, xuống dòng
  text: 2, // khung, căn trái, xuống dòng
  center: 3, // khung, căn giữa
  title: 4, // đậm cỡ 13, căn giữa
  bold: 5, // đậm, căn giữa, không khung
  italic: 6, // nghiêng, căn giữa, không khung
  boldLeft: 7, // đậm, căn trái, không khung
  note: 8, // nghiêng, căn trái, không khung
  red: 9, // chữ đỏ, khung, căn trái, xuống dòng (vd tiết trống trong lịch báo giảng)
} as const;
export type XStyle = (typeof XS)[keyof typeof XS];
export type XValue = string | number | null | undefined;
export type XCell = XValue | { v: XValue; s: XStyle };
export type XSheet = {
  name: string;
  rows: XCell[][];
  /** vùng gộp dạng "A1:C1" */
  merges?: string[];
  /** độ rộng cột (đơn vị ký tự) */
  cols?: number[];
  /** chiều cao dòng (point) theo chỉ số dòng 0-based */
  heights?: Record<number, number>;
  /** cố định đến dòng/cột này khi cuộn (0-based, số dòng/cột được giữ) */
  freeze?: { rows: number; cols: number };
  landscape?: boolean;
};

export function colName(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}
export const ref = (r: number, c: number) => `${colName(c)}${r + 1}`;
export const range = (r1: number, c1: number, r2: number, c2: number) => `${ref(r1, c1)}:${ref(r2, c2)}`;

const esc = (s: string) => s
  // bỏ ký tự điều khiển XML không cho phép
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Tên trang tính hợp lệ: ≤ 31 ký tự, không có []:*?/\ */
export function sheetName(raw: string, used: Set<string> = new Set()): string {
  const base = raw.replace(/[[\]:*?/\\]/g, '-').trim().slice(0, 31) || 'Sheet';
  let name = base;
  for (let i = 2; used.has(name.toLowerCase()); i++) name = `${base.slice(0, 28)}(${i})`;
  used.add(name.toLowerCase());
  return name;
}

function sheetXml(sh: XSheet): string {
  const out: string[] = [];
  out.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  out.push('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">');
  out.push('<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  if (sh.freeze && (sh.freeze.rows || sh.freeze.cols)) {
    const { rows: fr, cols: fc } = sh.freeze;
    const pane = fr && fc ? 'bottomRight' : fr ? 'bottomLeft' : 'topRight';
    out.push(`<sheetViews><sheetView workbookViewId="0"><pane${fc ? ` xSplit="${fc}"` : ''}${fr ? ` ySplit="${fr}"` : ''} topLeftCell="${ref(fr, fc)}" activePane="${pane}" state="frozen"/></sheetView></sheetViews>`);
  }
  out.push('<sheetFormatPr defaultRowHeight="15"/>');
  if (sh.cols?.length) out.push(`<cols>${sh.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`);
  out.push('<sheetData>');
  sh.rows.forEach((row, r) => {
    const h = sh.heights?.[r];
    const cells: string[] = [];
    row.forEach((cell, c) => {
      const { v, s } = cell !== null && typeof cell === 'object' ? cell : { v: cell, s: XS.plain as XStyle };
      const sa = s ? ` s="${s}"` : '';
      if (v === null || v === undefined || v === '') {
        if (s) cells.push(`<c r="${ref(r, c)}"${sa}/>`);
      } else if (typeof v === 'number' && Number.isFinite(v)) {
        cells.push(`<c r="${ref(r, c)}"${sa}><v>${v}</v></c>`);
      } else {
        cells.push(`<c r="${ref(r, c)}"${sa} t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`);
      }
    });
    out.push(`<row r="${r + 1}"${h ? ` ht="${h}" customHeight="1"` : ''}>${cells.join('')}</row>`);
  });
  out.push('</sheetData>');
  if (sh.merges?.length) out.push(`<mergeCells count="${sh.merges.length}">${sh.merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`);
  out.push('<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>');
  out.push(`<pageSetup paperSize="9" orientation="${sh.landscape ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>`);
  out.push('</worksheet>');
  return out.join('');
}

const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
  + '<fonts count="5">'
  + '<font><sz val="11"/><name val="Times New Roman"/><family val="1"/></font>'
  + '<font><b/><sz val="11"/><name val="Times New Roman"/><family val="1"/></font>'
  + '<font><i/><sz val="11"/><name val="Times New Roman"/><family val="1"/></font>'
  + '<font><b/><sz val="13"/><name val="Times New Roman"/><family val="1"/></font>'
  + '<font><sz val="11"/><color rgb="FFFF0000"/><name val="Times New Roman"/><family val="1"/></font>'
  + '</fonts>'
  + '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
  + '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>'
  + '<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>'
  + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
  + '<cellXfs count="10">'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
  + '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
  + '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
  + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
  + '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>'
  + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>'
  + '<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
  + '</cellXfs>'
  + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
  + '</styleSheet>';

/** Dựng nội dung file .xlsx */
export function buildXlsx(sheets: XSheet[]): Uint8Array {
  const used = new Set<string>();
  const names = sheets.map((s) => sheetName(s.name, used));
  const files: [string, string][] = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
      + '</Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
      + names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') + '</sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
      + `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', STYLES],
    ...sheets.map((s, i): [string, string] => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)]),
  ];
  const enc = new TextEncoder();
  return zipStore(files.map(([n, t]) => [enc.encode(n), enc.encode(t)]));
}

// ------------------------------------------------------------------ zip (lưu không nén)
let CRC_TABLE: Uint32Array | null = null;
function crc32(buf: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function zipStore(entries: [Uint8Array, Uint8Array][]): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  // ngày giờ DOS cố định (01/01/2024) — nội dung không phụ thuộc thời điểm tạo
  const dosTime = 0, dosDate = ((2024 - 1980) << 9) | (1 << 5) | 1;
  for (const [name, data] of entries) {
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    local.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const parts = [...local, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(parts.reduce((a, b) => a + b.length, 0));
  let p = 0;
  for (const part of parts) { out.set(part, p); p += part.length; }
  return out;
}

/** Tải file .xlsx về máy (chỉ chạy trên trình duyệt) */
export function downloadXlsx(filename: string, sheets: XSheet[]) {
  const bytes = buildXlsx(sheets);
  const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
