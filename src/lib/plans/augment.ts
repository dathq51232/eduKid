// "Bổ sung giáo án cũ": mở giáo án Word (.docx) của giáo viên, GIỮ NGUYÊN toàn bộ nội dung và trình bày,
// chỉ chèn thêm vào cuối từng hoạt động (Khởi động / Khám phá / Luyện tập / Vận dụng) các dòng: tích hợp năng lực số,
// hỗ trợ học sinh hoà nhập, phân hoá (src/lib/plans/augment-bank.ts). Lưu thành file mới, file gốc không đổi.
// Cách làm: quét word/document.xml thành cây đoạn văn / bảng / hàng / ô; tiêu đề hoạt động nhận theo chữ;
// cuối hoạt động = trước tiêu đề hoạt động kế tiếp hoặc trước mục "IV. Điều chỉnh sau bài dạy" / tiết, bài kế tiếp.
// Hoạt động soạn trong bảng (cột GV | HS): chèn vào cuối ô dài nhất của hàng cuối hoạt động. Chạy trên trình duyệt và Node.
import { unzip } from '../xlsx-read';
import { zipStore } from '../xlsx';
import { fixLegacyXml } from '../docx-legacy';
import { fold, subjectOf } from './schedule';
import type { ActivityKey, PlanSubject } from './generate';
import { augmentLines, type AugmentKind, type AugmentLine } from './augment-bank';

const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const xesc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ------------------------------------------------------------------ cây cấu trúc của document.xml
type Tag = 'w:tbl' | 'w:tr' | 'w:tc' | 'w:p' | 'w:sectPr';
type Node = { tag: Tag; start: number; end: number; parent: Node | null; kids: Node[] };

/** Quét các thẻ cấu trúc (bỏ qua nội dung khung chữ / hình lồng bên trong đoạn văn) */
function scan(xml: string): { roots: Node[]; paras: Node[] } {
  const roots: Node[] = [];
  const paras: Node[] = [];
  const stack: Node[] = [];
  let skip = 0;
  const re = /<(\/?)(w:tbl|w:tr|w:tc|w:p|w:sectPr|w:txbxContent|w:drawing|w:pict|mc:AlternateContent)\b[^>]*?(\/?)>/g;
  for (let m = re.exec(xml); m; m = re.exec(xml)) {
    const [whole, close, name, self] = m;
    if (name === 'w:txbxContent' || name === 'w:drawing' || name === 'w:pict' || name === 'mc:AlternateContent') {
      if (self) continue;
      skip += close ? -1 : 1;
      continue;
    }
    if (skip > 0) continue;
    const tag = name as Tag;
    if (!close) {
      const node: Node = { tag, start: m.index, end: m.index + whole.length, parent: stack[stack.length - 1] ?? null, kids: [] };
      (node.parent ? node.parent.kids : roots).push(node);
      if (tag === 'w:p') paras.push(node);
      if (!self) stack.push(node);
    } else {
      // đóng thẻ: lấy ra tới thẻ mở cùng tên (bỏ qua thẻ lệch nếu file có lỗi)
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) { stack[i].end = m.index + whole.length; stack.length = i; break; }
      }
    }
  }
  return { roots, paras };
}

const textOf = (xml: string, n: Node) => [...xml.slice(n.start, n.end).matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((t) => unxml(t[1])).join('').replace(/\s+/g, ' ').trim();
/** đoạn văn phần lớn là chữ đậm */
function isBold(xml: string, n: Node): boolean {
  let all = 0, bold = 0;
  for (const r of xml.slice(n.start, n.end).matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
    const t = [...r[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((x) => x[1]).join('').trim().length;
    all += t;
    if (/<w:b\/>|<w:b w:val="(1|true|on)"\/>/.test(r[1].split('</w:rPr>')[0] ?? '')) bold += t;
  }
  return all > 0 && bold / all > 0.6;
}
const up = (n: Node, tag: Tag): Node | null => { for (let p = n.parent; p; p = p.parent) if (p.tag === tag) return p; return null; };

// ------------------------------------------------------------------ nhận tiêu đề hoạt động
const ACT = /^(?:[ivx]+\s*[.)/]|\d+\s*[.)/:]|[a-dđ]\s*[.)]|\*+)?\s*(?:hoat dong|hd)?\s*\d*\s*[:.)\-–]?\s*(?:hoat dong\s*)?(khoi dong|mo dau|kham pha|hinh thanh kien thuc|tim hieu bai moi|luyen tap|thuc hanh|van dung|trai nghiem|cung co)\b/;
const NUMBERED = /^(?:[ivx]+|\d+|[a-d])\s*[.)]|^hoat dong\b|^hd\s*\d/;
/** mục kết thúc phần hoạt động: IV. Điều chỉnh / rút kinh nghiệm; bắt đầu tiết, bài kế tiếp */
const STOP = /^(?:(?:iv|4)\s*[.)/\-–]?\s*)?(?:dieu chinh sau|dieu chinh\b|rut kinh nghiem|nhan xet sau tiet)|^ke hoach (?:bai day|day hoc)\b|^tiet\s*\d+\s*(?:$|[:.\-–(])|^(?:i|1)\s*[.)]\s*(?:yeu cau can dat|muc tieu)/;

function keyOf(f: string): ActivityKey {
  if (/khoi dong|mo dau/.test(f)) return 'khoi-dong';
  if (/van dung|trai nghiem|cung co/.test(f)) return 'van-dung';
  if (/luyen tap|thuc hanh/.test(f)) return 'luyen-tap';
  return 'kham-pha';
}

export type FoundActivity = { key: ActivityKey; title: string; lines: AugmentLine[] };
export type AugmentResult = { bytes: Uint8Array; activities: FoundActivity[]; legacyRuns: number; subject: PlanSubject | null };

/** Đoạn XML của một dòng chèn thêm (Times New Roman, nhãn đậm nghiêng) */
function lineXml(l: AugmentLine): string {
  const f = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/>';
  return `<w:p><w:pPr><w:spacing w:before="40" w:after="40"/><w:jc w:val="both"/></w:pPr>`
    + `<w:r><w:rPr>${f}<w:b/><w:i/></w:rPr><w:t xml:space="preserve">${xesc(`* ${l.label}: `)}</w:t></w:r>`
    + `<w:r><w:rPr>${f}<w:i/></w:rPr><w:t xml:space="preserve">${xesc(l.text)}</w:t></w:r></w:p>`;
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * Tìm hoạt động và vị trí chèn trong document.xml rồi chèn. Trả về XML mới + danh sách hoạt động đã bổ sung.
 * subject: môn (để chọn câu năng lực số theo môn); null = tự đoán theo tên file / chữ trong giáo án.
 */
export function augmentXml(xml: string, kinds: AugmentKind[], subject: PlanSubject | null): { xml: string; activities: FoundActivity[]; subject: PlanSubject | null } {
  const { roots, paras } = scan(xml);
  type Mark = { n: Node; f: string; text: string; act?: ActivityKey };
  const marks: Mark[] = [];
  for (const n of paras) {
    const text = textOf(xml, n);
    if (!text || text.length > 140) continue;
    const f = fold(text);
    if (STOP.test(f)) { marks.push({ n, f, text }); continue; }
    if (text.length <= 100 && ACT.test(f) && (NUMBERED.test(f) || isBold(xml, n))) marks.push({ n, f, text, act: keyOf(f) });
  }
  // tiêu đề cùng loại liền nhau (vd "3. Luyện tập" rồi "Luyện tập 1") = một hoạt động
  const heads: Mark[] = [];
  for (const m of marks) {
    const prev = heads[heads.length - 1];
    if (m.act && prev?.act && prev.act === m.act && !marks.slice(marks.indexOf(prev) + 1, marks.indexOf(m)).some((x) => !x.act)) continue;
    heads.push(m);
  }

  /** bảng ngoài cùng chứa một đoạn; đoạn có nằm trong bảng đó không */
  const outerTable = (n: Node): Node | null => { let t = up(n, 'w:tbl'); while (t && up(t, 'w:tbl')) t = up(t, 'w:tbl'); return t; };
  const inside = (n: Node, t: Node) => n.start > t.start && n.end <= t.end;
  /** vị trí chèn ngay TRƯỚC đoạn b (cuối hoạt động trước đó) */
  const before = (b: Node): number => {
    const cell = up(b, 'w:tc');
    if (!cell) return b.start;
    const firstInCell = cell.kids.find((k) => k.tag === 'w:p' || k.tag === 'w:tbl') === b;
    if (!firstInCell) return b.start;
    const row = up(b, 'w:tr');
    const tbl = row && up(row, 'w:tbl');
    const rows = tbl ? tbl.kids.filter((k) => k.tag === 'w:tr') : [];
    const prevRow = row ? rows[rows.indexOf(row) - 1] : undefined;
    if (!prevRow) return tbl ? tbl.start : b.start;
    return endOfLongestCell(prevRow);
  };
  /** cuối ô có nhiều chữ nhất của một hàng (thường là cột "Hoạt động của GV") */
  const endOfLongestCell = (row: Node): number => {
    const cells = row.kids.filter((k) => k.tag === 'w:tc');
    const best = cells.reduce((a, c) => (textOf(xml, c).length > textOf(xml, a).length ? c : a), cells[0]);
    return best.end - '</w:tc>'.length;
  };
  /** hoạt động cuối không có mốc kết thúc: cuối bảng chứa nó, hoặc cuối văn bản */
  const tail = (h: Node): number => {
    const tbl = outerTable(h);
    if (tbl) { const rows = tbl.kids.filter((k) => k.tag === 'w:tr'); if (rows.length) return endOfLongestCell(rows[rows.length - 1]); }
    const sect = roots.filter((r) => r.tag === 'w:sectPr').pop();
    if (sect) return sect.start;
    const e = xml.lastIndexOf('</w:body>');
    return e >= 0 ? e : xml.length;
  };

  const subj = subject ?? guessSubject(paras.slice(0, 40).map((n) => textOf(xml, n)).join(' '));
  const inserts: { at: number; xml: string; order: number }[] = [];
  const activities: FoundActivity[] = [];
  heads.forEach((h, i) => {
    if (!h.act) return;
    const next = heads[i + 1];
    // hoạt động soạn trong bảng mà mốc kết thúc nằm ngoài bảng (vd "IV. Điều chỉnh" sau bảng): chèn vào hàng cuối của bảng
    const tbl = outerTable(h.n);
    const at = next && !(tbl && !inside(next.n, tbl)) ? before(next.n) : tail(h.n);
    const lines = augmentLines(h.act, subj, kinds, hash(`${h.text}|${i}`));
    if (!lines.length) return;
    inserts.push({ at, xml: lines.map(lineXml).join(''), order: i });
    activities.push({ key: h.act, title: h.text, lines });
  });
  // chèn từ cuối lên để vị trí phía trước không bị lệch; cùng vị trí thì giữ thứ tự hoạt động
  inserts.sort((a, b) => b.at - a.at || b.order - a.order);
  let out = xml;
  for (const ins of inserts) out = out.slice(0, ins.at) + ins.xml + out.slice(ins.at);
  return { xml: out, activities, subject: subj };
}

/** Đoán môn theo chữ đầu giáo án ("Môn: Toán", "TIẾNG VIỆT"…) */
function guessSubject(head: string): PlanSubject | null {
  const f = fold(head);
  const m = /mon\s*(?:hoc)?\s*[:\-]?\s*([a-z ]{3,24})/.exec(f);
  const r = subjectOf(m?.[1] ?? (/tieng viet/.test(f) ? 'tiếng việt' : /tieng anh/.test(f) ? 'tiếng anh' : /\btoan\b/.test(f) ? 'toán' : ''));
  return r.subject === 'khac' ? null : r.subject;
}

/**
 * Bổ sung một file giáo án .docx: trả về file mới (giữ nguyên mọi phần khác của gói Word).
 * fixLegacy: đổi luôn chữ phông cũ (.VnTime / VNI) sang Unicode Times New Roman.
 */
export async function augmentDocx(buf: ArrayBuffer | Uint8Array, o: { kinds: AugmentKind[]; subject?: PlanSubject | null; fixLegacy?: boolean; fileName?: string }): Promise<AugmentResult> {
  const files = await unzip(buf);
  const raw = files.get('word/document.xml');
  if (!raw) throw new Error('Không phải file Word .docx (file .doc: mở bằng Word rồi “Lưu thành” .docx).');
  const dec = new TextDecoder();
  let xml = dec.decode(raw);
  let legacyRuns = 0;
  if (o.fixLegacy !== false) {
    const fx = fixLegacyXml(xml, dec.decode(files.get('word/styles.xml') ?? new Uint8Array()));
    xml = fx.xml; legacyRuns = fx.runs;
  }
  const fromName = o.fileName ? subjectOf(o.fileName.replace(/[_-]+/g, ' ')).subject : 'khac';
  const subject = o.subject ?? (fromName !== 'khac' ? fromName : null);
  const res = augmentXml(xml, o.kinds, subject);
  files.set('word/document.xml', new TextEncoder().encode(res.xml));
  const enc = new TextEncoder();
  const bytes = zipStore([...files].map(([n, d]) => [enc.encode(n), d]));
  return { bytes, activities: res.activities, legacyRuns, subject: res.subject };
}
