// Đọc văn bản Word .docx không cần thư viện: lấy word/document.xml, tách đoạn văn và bảng (bỏ hình ảnh).
// Chạy được trên trình duyệt và Node ≥ 18 (dùng chung bộ giải nén của xlsx-read).

import { unzip } from './xlsx-read';

export type DocBlock =
  | { t: 'p'; text: string; bold: boolean }
  /** bảng: rows[r][c] là chữ trong ô (nhiều đoạn nối bằng \n) */
  | { t: 'table'; rows: string[][] };

const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');

/** chữ của một đoạn <w:p> */
function paraText(xml: string): { text: string; bold: boolean } {
  let text = '';
  let boldChars = 0, chars = 0;
  for (const r of xml.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
    const body = r[1];
    const isBold = /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(body.split('</w:rPr>')[0] ?? '');
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
  // ô có thể chứa bảng lồng: lấy lần lượt mọi đoạn
  return [...tc.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map((m) => paraText(m[0]).text).filter(Boolean).join('\n');
}

function tableRows(tbl: string): string[][] {
  return children(tbl, 'w:tr').map((tr) => children(tr, 'w:tc').map(cellText));
}

/** Đọc các khối (đoạn, bảng) của tài liệu theo thứ tự */
export async function readDocx(buf: ArrayBuffer | Uint8Array): Promise<DocBlock[]> {
  const files = await unzip(buf, (n) => n === 'word/document.xml');
  const raw = files.get('word/document.xml');
  if (!raw) throw new Error('Không phải file Word .docx (nếu là .doc, mở bằng Word rồi “Lưu thành” .docx).');
  let xml = new TextDecoder().decode(raw);
  const b = xml.indexOf('<w:body>');
  const e = xml.lastIndexOf('</w:body>');
  xml = xml.slice(b >= 0 ? b + 8 : 0, e > 0 ? e : undefined)
    // bỏ hình, bản dự phòng của khung chữ, trường ẩn
    .replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, '')
    .replace(/<w:drawing>[\s\S]*?<\/w:drawing>/g, '')
    .replace(/<w:pict>[\s\S]*?<\/w:pict>/g, '')
    .replace(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g, '')
    .replace(/<w:del\b[\s\S]*?<\/w:del>/g, '');
  const out: DocBlock[] = [];
  const re = /<w:p[\s>]|<w:tbl>|<w:sdt>/g;
  let m: RegExpExecArray | null;
  let pos = 0;
  while ((re.lastIndex = pos, m = re.exec(xml))) {
    if (m[0] === '<w:tbl>') {
      const end = closeOf(xml, m.index + 7, 'w:tbl');
      const rows = tableRows(xml.slice(m.index, end)).filter((r) => r.some((c) => c));
      if (rows.length) out.push({ t: 'table', rows });
      pos = end;
    } else if (m[0] === '<w:sdt>') {
      pos = m.index + 7; // nội dung trong khối điều khiển: đọc tiếp các đoạn bên trong
    } else {
      const end = closeOf(xml, m.index + 4, 'w:p');
      const p = paraText(xml.slice(m.index, end));
      if (p.text) out.push({ t: 'p', ...p });
      pos = end;
    }
  }
  return out;
}
