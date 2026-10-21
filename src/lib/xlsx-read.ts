// Đọc file Excel .xlsx (Office Open XML) không cần thư viện: giải nén ZIP bằng DecompressionStream
// (có trên trình duyệt hiện đại và Node ≥ 18), đọc chuỗi dùng chung + ô của trang tính đầu tiên.
// Chỉ lấy giá trị hiển thị dạng chuỗi; ô ngày (số seri) trả về chuỗi số — nơi gọi tự xử lí.

export type Sheet = {
  name: string;
  /** rows[r][c] — chỉ số từ 0, ô trống là '' */
  rows: string[][];
  /** vùng gộp ô: [r1, c1, r2, c2] (chỉ số từ 0, gồm cả hai đầu) */
  merges: [number, number, number, number][];
  /** màu chữ của ô, dạng "RRGGBB" ('' = mặc định / không rõ). Ô chữ nhiều màu: màu chung của mọi đoạn có chữ, nếu cùng một màu */
  colors?: string[][];
};

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Đọc các mục trong file ZIP (theo thư mục trung tâm) */
export async function unzip(buf: ArrayBuffer | Uint8Array, want?: (name: string) => boolean): Promise<Map<string, Uint8Array>> {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Không phải file .xlsx hợp lệ (không đọc được cấu trúc ZIP).');
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (u32(b, p) !== 0x02014b50) break;
    const method = u16(b, p + 10), csize = u32(b, p + 20), nlen = u16(b, p + 28), xlen = u16(b, p + 30), clen = u16(b, p + 32), lho = u32(b, p + 42);
    const name = dec.decode(b.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (want && !want(name)) continue;
    const start = lho + 30 + u16(b, lho + 26) + u16(b, lho + 28);
    const raw = b.subarray(start, start + csize);
    if (method === 0) out.set(name, raw.slice());
    else if (method === 8) out.set(name, await inflateRaw(raw));
  }
  return out;
}

const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
/** nối mọi đoạn <t> trong một khối (chuỗi có nhiều kiểu chữ chia thành nhiều <r>) */
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unxml(m[1])).join('');

// bảng màu cũ của Excel (indexed): chỉ cần các màu hay dùng để tô chữ
const INDEXED: Record<string, string> = { 2: 'FF0000', 10: 'FF0000', 3: '00FF00', 11: '00FF00', 4: '0000FF', 12: '0000FF', 16: '800000', 53: 'FF6600', 60: '993300' };
/** <color rgb=".."/> | indexed | theme → "RRGGBB" ('' nếu mặc định / màu chủ đề) */
function colorOf(xml: string): string {
  const c = /<color\b([^>]*)\/?>/.exec(xml)?.[1] ?? '';
  const rgb = /rgb="([0-9A-Fa-f]{6,8})"/.exec(c)?.[1];
  if (rgb) return rgb.slice(-6).toUpperCase();
  const idx = /indexed="(\d+)"/.exec(c)?.[1];
  return idx ? INDEXED[idx] ?? '' : '';
}
/** màu chung của các đoạn chữ (<r>) trong chuỗi nhiều kiểu; null nếu không phải chuỗi nhiều kiểu hoặc các đoạn khác màu */
function runsColor(xml: string): string | null {
  const runs = [...xml.matchAll(/<r>([\s\S]*?)<\/r>/g)].filter((m) => texts(m[1]).trim());
  if (!runs.length) return null;
  const cs = new Set(runs.map((m) => colorOf(/<rPr>([\s\S]*?)<\/rPr>/.exec(m[1])?.[1] ?? '')));
  return cs.size === 1 ? [...cs][0] : null;
}

function colIndex(ref: string): number {
  let n = 0;
  for (const ch of ref) { const c = ch.charCodeAt(0); if (c < 65 || c > 90) break; n = n * 26 + (c - 64); }
  return n - 1;
}
const cellPos = (ref: string): [number, number] => [Number(/\d+/.exec(ref)?.[0] ?? 1) - 1, colIndex(ref)];

/** Đọc trang tính đầu tiên của file .xlsx */
export async function readXlsx(buf: ArrayBuffer | Uint8Array): Promise<Sheet> {
  const files = await unzip(buf, (n) => n === 'xl/workbook.xml' || n === 'xl/sharedStrings.xml' || n === 'xl/styles.xml' || n === 'xl/_rels/workbook.xml.rels' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const dec = new TextDecoder();
  const get = (n: string) => (files.has(n) ? dec.decode(files.get(n)) : '');
  const wb = get('xl/workbook.xml');
  if (!wb) throw new Error('File không phải bảng tính Excel .xlsx (nếu là .xls, hãy mở bằng Excel và “Lưu thành” .xlsx).');
  const first = /<sheet\b[^>]*>/.exec(wb)?.[0] ?? '';
  const name = unxml(/name="([^"]*)"/.exec(first)?.[1] ?? 'Sheet1');
  const rid = /r:id="([^"]*)"/.exec(first)?.[1];
  let path = '';
  if (rid) {
    const rel = new RegExp(`<Relationship\\b[^>]*Id="${rid}"[^>]*>`).exec(get('xl/_rels/workbook.xml.rels'))?.[0] ?? '';
    const target = /Target="([^"]*)"/.exec(rel)?.[1];
    if (target) path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  }
  if (!files.has(path)) path = [...files.keys()].filter((k) => k.startsWith('xl/worksheets/')).sort()[0] ?? '';
  const xml = get(path);
  if (!xml) throw new Error('Không tìm thấy trang tính trong file.');

  const sis = [...get('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => m[1]);
  const shared = sis.map(texts);
  // màu chữ theo kiểu ô: cellXfs[s].fontId → fonts[fontId].color
  const styles = get('xl/styles.xml');
  const fonts = [...(/<fonts\b[^>]*>([\s\S]*?)<\/fonts>/.exec(styles)?.[1] ?? '').matchAll(/<font\b[^>]*?(?:\/>|>([\s\S]*?)<\/font>)/g)].map((m) => colorOf(m[1] ?? ''));
  const xfFont = [...(/<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? '').matchAll(/<xf\b([^>]*?)(?:\/>|>[\s\S]*?<\/xf>)/g)].map((m) => Number(/fontId="(\d+)"/.exec(m[1])?.[1] ?? 0));
  const colors: string[][] = [];
  const rows: string[][] = [];
  for (const m of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = m[1], body = m[2] ?? '';
    const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
    if (!ref) continue;
    const t = /\bt="([^"]*)"/.exec(attrs)?.[1] ?? 'n';
    const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
    let val = '';
    if (t === 's') val = shared[Number(v)] ?? '';
    else if (t === 'inlineStr') val = texts(body);
    else if (v !== undefined) val = unxml(v);
    if (!val) continue;
    const [r, c] = cellPos(ref);
    (rows[r] ??= [])[c] = val;
    const runs = t === 's' ? runsColor(sis[Number(v)] ?? '') : t === 'inlineStr' ? runsColor(body) : null;
    const cellColor = runs ?? fonts[xfFont[Number(/\bs="(\d+)"/.exec(attrs)?.[1] ?? 0)] ?? 0] ?? '';
    if (cellColor) (colors[r] ??= [])[c] = cellColor;
  }
  const width = Math.max(0, ...rows.filter(Boolean).map((r) => r.length));
  const full = Array.from({ length: rows.length }, (_, i) => Array.from({ length: width }, (_, j) => (rows[i]?.[j] ?? '').replace(/\r/g, '').trim()));
  const merges = [...xml.matchAll(/<mergeCell\b[^>]*ref="([A-Z]+\d+):([A-Z]+\d+)"/g)].map((m) => {
    const [r1, c1] = cellPos(m[1]); const [r2, c2] = cellPos(m[2]);
    return [r1, c1, r2, c2] as [number, number, number, number];
  });
  const colorGrid = full.map((row, i) => row.map((_, j) => colors[i]?.[j] ?? ''));
  return { name, rows: full, merges, colors: colorGrid };
}
