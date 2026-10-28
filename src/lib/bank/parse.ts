// Nạp đề từ tài liệu của giáo viên (Word .docx, Excel .xlsx) — chạy trên trình duyệt,
// file gốc không gửi lên máy chủ. Tách thành từng câu (bản nháp) để cô xem lại, sửa rồi mới lưu vào "Ngân hàng của tôi".
// Nhận các kiểu đề thường gặp:
//   Câu 1: … / Bài 2. … / 3) …        (đầu câu; "(M2)", "Mức 3" ghi mức)
//   A. …  B. …  C. …  D. …             (phương án, cùng dòng hoặc mỗi dòng một phương án; "*B." hoặc "B. … (đúng)" là đáp án)
//   Đáp án: B / ĐA: 25 / Đáp số: 12 kg (đáp án ngay dưới câu)
//   ĐÁP ÁN … 1-B, 2.C, 3: A           (bảng đáp án ở cuối đề)
//   Lời giải: …                        (giải thích)
import type { Muc } from '@/lib/exams/matrix';
import type { BookLesson } from '@/lib/exams/matrix';

export type DraftType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank';
export type Draft = {
  id: string;
  type: DraftType;
  prompt: string;
  options: string[];
  /** single: 1 phương án đúng · multiple: nhiều · true_false: 'Đúng' | 'Sai' · fill_blank: các đáp án chấp nhận */
  correct: string[];
  muc: Muc;
  lessonId: string;
  explanation: string;
  source: string;
  include: boolean;
  warn?: string;
};

let seq = 0;
export const draftId = () => `d${Date.now().toString(36)}${(seq++).toString(36)}`;

export const ACCEPT_DOCS = '.docx,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_DOC = 20 * 1024 * 1024;

export type Extracted = { kind: 'text'; lines: string[]; name: string } | { kind: 'rows'; rows: string[][]; name: string };

const clean = (s: string) => s.replace(/ /g, ' ').replace(/[\t ]+/g, ' ').trim();

export async function extractFile(file: File): Promise<Extracted> {
  if (file.size > MAX_DOC) throw new Error('File quá lớn (tối đa 20 MB).');
  const name = file.name;
  const buf = await file.arrayBuffer();
  if (/\.docx$/i.test(name)) {
    const { readDocx } = await import('@/lib/docx-read');
    const blocks = await readDocx(buf);
    const lines: string[] = [];
    for (const b of blocks) {
      if (b.t === 'p') b.text.split('\n').forEach((l) => { const c = clean(l); if (c) lines.push(c); });
      else for (const row of b.rows) { const c = clean(row.join('   ')); if (c) lines.push(c); }
    }
    return { kind: 'text', lines, name };
  }
  if (/\.xlsx$/i.test(name)) {
    const { readXlsx } = await import('@/lib/xlsx-read');
    const sh = await readXlsx(buf);
    return { kind: 'rows', rows: (sh.rows as unknown as unknown[][]).map((r) => r.map((c) => clean(String(c ?? '')))), name };
  }
  if (/\.pdf$/i.test(name)) throw new Error('Chưa nhận PDF: mở file PDF bằng Word (Tệp → Mở) để Word chuyển sang .docx, kiểm tra lại chữ rồi nạp file .docx.');
  throw new Error('Chỉ nhận file Word (.docx) hoặc Excel (.xlsx). File .doc / .xls đời cũ: mở bằng Word / Excel rồi “Lưu thành” .docx / .xlsx.');
}

/** Chữ gộp (để AI đọc làm tài liệu nguồn) */
export const extractedText = (e: Extracted) => (e.kind === 'text' ? e.lines.join('\n') : e.rows.map((r) => r.filter(Boolean).join(' | ')).join('\n'));

/* ------------------------------------------------------------ đoán mức, bài */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

function mucTag(s: string): Muc | null {
  const m = fold(s).match(/(?:\(|\[|^|\s)(?:m|muc)\s*([123])(?:\)|\]|\s|:|$)/);
  return m ? (Number(m[1]) as Muc) : null;
}
function guessMuc(d: Pick<Draft, 'prompt' | 'type' | 'options'>): Muc {
  const p = fold(d.prompt);
  if (/giai bai toan|hoi .*(bao nhieu|may)|vi sao|em hay (viet|ke|neu)|theo em|tu (dat|viet) cau|lien he|van dung/.test(p) || (d.type === 'fill_blank' && p.length > 110)) return 3;
  if (d.type === 'single_choice' && p.length < 70) return 1;
  if (d.type === 'true_false') return 1;
  return 2;
}
const STOP = new Set(['bai', 'cac', 'cua', 'va', 'voi', 'trong', 'cho', 'nhung', 'mot', 'hai', 'ba', 'tiet', 'on', 'tap', 'luyen', 'the', 'and', 'unit', 'lesson']);
/** Đoán bài học theo chữ trùng với tên bài (hoặc "Bài 12") */
export function guessLesson(text: string, lessons: BookLesson[], fallback: string): string {
  const t = fold(text);
  let best = fallback, score = 0;
  for (const l of lessons) {
    const words = fold(l.title).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
    let s = words.filter((w) => t.includes(w)).length / Math.max(2, words.length);
    const no = l.ref?.match(/\d+/)?.[0];
    if (no && new RegExp(`\\bbai\\s*${no}\\b`).test(t)) s += 0.6;
    if (s > score) { score = s; best = l.id; }
  }
  return score >= 0.5 ? best : fallback;
}

/* ------------------------------------------------------------ tách câu từ văn bản */
const Q_START = /^(?:(?:câu|bài|question)\s*(\d+)\s*(?:\([^)]*\))?\s*[:.)\-–]?\s*|(\d{1,3})\s*[.)]\s+)(.*)$/i;
const ANS_LINE = /^(?:đáp\s*án|ĐA|trả\s*lời|đáp\s*số|kết\s*quả|answer|key)\s*(?:đúng)?\s*[:：.\-]\s*(.+)$/i;
const SOL_LINE = /^(?:lời\s*giải|giải\s*thích|hướng\s*dẫn|giải|bài\s*giải)\s*[:：.]\s*(.*)$/i;
const KEY_HEAD = /^(?:đáp\s*án|hướng\s*dẫn\s*chấm|ĐÁP ÁN|answer\s*key|key)\s*(?:và\s*hướng\s*dẫn\s*chấm)?\s*[:.]?\s*$/i;
const OPT_SPLIT = /(?:^|\s)\*?([A-Fa-f])\s*[.)]\s+/g;

/** Tách phương án trên một dòng: "A. 5   B. 6  C. 7" → [['A','5'],…]; dòng không bắt đầu bằng phương án → null */
function splitOptions(line: string): { letter: string; text: string; star: boolean }[] | null {
  if (!/^\*?[A-Fa-f]\s*[.)]\s+/.test(line)) return null;
  const marks: { i: number; letter: string; star: boolean; len: number }[] = [];
  let m: RegExpExecArray | null;
  OPT_SPLIT.lastIndex = 0;
  while ((m = OPT_SPLIT.exec(line))) {
    const star = m[0].includes('*');
    marks.push({ i: m.index + (m[0].startsWith(' ') ? 1 : 0), letter: m[1].toUpperCase(), star, len: m[0].trimStart().length });
  }
  // chỉ nhận chữ cái tăng dần A, B, C… (tránh nhầm "a) " trong lời văn)
  const first = marks[0]?.letter.charCodeAt(0) ?? 65;
  const ok: typeof marks = [];
  for (const x of marks) if (x.letter.charCodeAt(0) - first === ok.length) ok.push(x);
  if (!ok.length) return null;
  return ok.map((x, k) => {
    let text = line.slice(x.i + x.len, k + 1 < ok.length ? ok[k + 1].i : undefined).trim();
    let star = x.star;
    if (/\((?:đúng|đ)\)\s*$|\s\*$/i.test(text)) { star = true; text = text.replace(/\s*(\((?:đúng|đ)\)|\*)\s*$/i, ''); }
    return { letter: x.letter, text, star };
  });
}

type Raw = { no: number; prompt: string[]; opts: { letter: string; text: string; star: boolean }[]; ans: string; sol: string[]; muc: Muc | null };

function finish(r: Raw, key: Map<number, string>, lessons: BookLesson[], fallback: string, source: string): Draft | null {
  const prompt = r.prompt.join('\n').replace(/\s*\((?:M|Mức)\s*[123]\)\s*/gi, ' ').trim();
  if (!prompt && !r.opts.length) return null;
  const ans = (r.ans || key.get(r.no) || '').trim();
  const d: Draft = { id: draftId(), type: 'fill_blank', prompt, options: [], correct: [], muc: 2, lessonId: fallback, explanation: r.sol.join('\n').trim(), source, include: true };
  if (r.opts.length >= 2) {
    d.options = r.opts.map((o) => o.text);
    const stars = r.opts.filter((o) => o.star).map((o) => o.text);
    const letters = (ans.match(/\b[A-F]\b/gi) ?? []).map((x) => x.toUpperCase());
    const byLetter = letters.map((l) => r.opts.find((o) => o.letter === l)?.text).filter(Boolean) as string[];
    const correct = stars.length ? stars : byLetter.length ? byLetter : d.options.filter((o) => ans && o.trim() === ans);
    d.type = correct.length > 1 ? 'multiple_choice' : 'single_choice';
    d.correct = correct;
    if (!correct.length) d.warn = 'Chưa thấy đáp án — chọn phương án đúng.';
  } else if (/(?:^|\s)(?:Đ|S|Đúng|Sai)$/.test(ans) && /đúng ghi Đ|đúng hay sai|Đ\s*\/\s*S|đúng\s*\/\s*sai/i.test(prompt)) {
    d.type = 'true_false'; d.correct = [/^S|Sai/i.test(ans) ? 'Sai' : 'Đúng'];
  } else {
    d.correct = ans ? ans.split(/\s*(?:;|\bhoặc\b|\/)\s*/i).map((x) => x.trim()).filter(Boolean).slice(0, 5) : [];
    if (!d.correct.length) d.warn = 'Chưa có đáp án / hướng dẫn chấm — điền để in kèm đáp án.';
  }
  d.muc = r.muc ?? guessMuc(d);
  d.lessonId = guessLesson(`${prompt} ${d.options.join(' ')}`, lessons, fallback);
  return d;
}

export function parseText(lines: string[], lessons: BookLesson[], fallback: string, source: string): Draft[] {
  const out: Draft[] = [];
  const key = new Map<number, string>();
  // bảng đáp án cuối đề
  const kh = lines.findIndex((l) => KEY_HEAD.test(l));
  const body = kh >= 0 ? lines.slice(0, kh) : lines;
  if (kh >= 0) {
    const tail = lines.slice(kh + 1).join('  ');
    for (const m of tail.matchAll(/(?:câu\s*)?(\d{1,3})\s*[-.:)–]\s*([A-F](?:\s*,\s*[A-F])*)\b/gi)) key.set(Number(m[1]), m[2].toUpperCase());
  }
  let cur: Raw | null = null;
  let auto = 0;
  const useCau = body.some((l) => /^(?:câu|bài|question)\s*\d+/i.test(clean(l)));
  const push = () => { if (cur) { const d = finish(cur, key, lessons, fallback, source); if (d) out.push(d); } cur = null; };
  for (const raw of body) {
    const line = clean(raw);
    if (!line) continue;
    const qm = line.match(Q_START);
    const opts = splitOptions(line);
    // đề viết "Câu 1 / Bài 1" thì dòng "1." "2)" bên trong là ý nhỏ của câu, không phải câu mới
    if (qm && !opts && (!useCau || qm[1])) {
      push();
      const no = Number(qm[1] ?? qm[2] ?? ++auto);
      auto = no;
      cur = { no, prompt: qm[3] ? [qm[3]] : [], opts: [], ans: '', sol: [], muc: mucTag(line) };
      continue;
    }
    if (!cur) continue; // phần đầu đề (tiêu đề, họ tên…) bỏ qua
    const c = cur as Raw;
    if (opts) { c.opts.push(...opts); continue; }
    const am = line.match(ANS_LINE);
    if (am) { c.ans = am[1].trim(); continue; }
    const sm = line.match(SOL_LINE);
    if (sm) { if (sm[1]) c.sol.push(sm[1]); continue; }
    if (c.ans || c.sol.length) c.sol.push(line);
    else if (c.opts.length) c.opts[c.opts.length - 1].text += ` ${line}`;
    else c.prompt.push(line);
    if (!c.muc) c.muc = mucTag(line);
  }
  push();
  return out;
}

/* ------------------------------------------------------------ bảng Excel / CSV */
const COLS: [keyof RowMap, RegExp][] = [
  ['prompt', /^(cau hoi|noi dung|de bai|cau|question|prompt)$/],
  ['a', /^(a|phuong an a|lua chon a|dap an a|option a)$/], ['b', /^(b|phuong an b|lua chon b|dap an b|option b)$/],
  ['c', /^(c|phuong an c|lua chon c|dap an c|option c)$/], ['d', /^(d|phuong an d|lua chon d|dap an d|option d)$/],
  ['answer', /^(dap an( dung)?|dap so|dung|answer|key|ket qua)$/], ['muc', /^(muc|muc do|level|m)$/],
  ['lesson', /^(bai|bai hoc|lesson|chu de)$/], ['sol', /^(giai thich|loi giai|huong dan|explanation)$/],
];
type RowMap = { prompt: number; a: number; b: number; c: number; d: number; answer: number; muc: number; lesson: number; sol: number };

export function parseRows(rows: string[][], lessons: BookLesson[], fallback: string, source: string): Draft[] {
  const nonEmpty = rows.filter((r) => r.some(Boolean));
  if (!nonEmpty.length) return [];
  const head = nonEmpty[0].map((h) => fold(h).replace(/[^a-z0-9 ]/g, '').trim());
  const map: Partial<RowMap> = {};
  head.forEach((h, i) => { for (const [k, re] of COLS) if (map[k] === undefined && re.test(h)) map[k] = i; });
  const hasHead = map.prompt !== undefined;
  const M: RowMap = hasHead
    ? { prompt: map.prompt!, a: map.a ?? -1, b: map.b ?? -1, c: map.c ?? -1, d: map.d ?? -1, answer: map.answer ?? -1, muc: map.muc ?? -1, lesson: map.lesson ?? -1, sol: map.sol ?? -1 }
    : { prompt: 0, a: 1, b: 2, c: 3, d: 4, answer: 5, muc: 6, lesson: -1, sol: 7 }; // không có dòng tiêu đề: Câu | A | B | C | D | Đáp án | Mức | Giải thích
  const out: Draft[] = [];
  for (const r of hasHead ? nonEmpty.slice(1) : nonEmpty) {
    const g = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
    const prompt = g(M.prompt);
    if (!prompt) continue;
    const opts = [g(M.a), g(M.b), g(M.c), g(M.d)].filter(Boolean);
    const ans = g(M.answer);
    const raw: Raw = { no: out.length + 1, prompt: [prompt], opts: opts.map((t, k) => ({ letter: 'ABCD'[k], text: t, star: false })), ans, sol: g(M.sol) ? [g(M.sol)] : [], muc: null };
    const d = finish(raw, new Map(), lessons, fallback, source);
    if (!d) continue;
    const mm = g(M.muc).match(/[123]/);
    if (mm) d.muc = Number(mm[0]) as Muc;
    const lt = g(M.lesson);
    if (lt) d.lessonId = guessLesson(lt, lessons, d.lessonId);
    out.push(d);
  }
  return out;
}

export function parseExtracted(e: Extracted, lessons: BookLesson[], fallback: string): Draft[] {
  return e.kind === 'rows' ? parseRows(e.rows, lessons, fallback, e.name) : parseText(e.lines, lessons, fallback, e.name);
}

/* ------------------------------------------------------------ kiểm tra phép tính (môn Toán) */
const num = (s: string): number | null => {
  const t = s.replace(/\s/g, '').replace(/[a-zđ²³%]+$/i, '');
  if (!/^-?[\d.,]+$/.test(t)) return null;
  // "1.250" = 1250 (dấu chấm ngăn hàng nghìn); "2,5" = 2.5
  const v = Number(t.replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};
function evalExpr(e: string): number | null {
  const s = e.replace(/×|x(?=\s*\d)|\*/g, '*').replace(/:|÷/g, '/').replace(/[−–]/g, '-').replace(/(\d)\.(?=\d{3})/g, '$1').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, '');
  if (!/^[\d.+\-*/()]+$/.test(s) || !/[+\-*/]/.test(s)) return null;
  // phân tích đệ quy đơn giản (không dùng eval)
  let i = 0;
  const peek = () => s[i];
  const atom = (): number => {
    if (peek() === '(') { i++; const v = sum(); i++; return v; }
    if (peek() === '-') { i++; return -atom(); }
    const m = s.slice(i).match(/^\d+(\.\d+)?/); if (!m) throw new Error('bad');
    i += m[0].length; return Number(m[0]);
  };
  const prod = (): number => { let v = atom(); while (peek() === '*' || peek() === '/') { const op = s[i++]; const r = atom(); v = op === '*' ? v * r : v / r; } return v; };
  const sum = (): number => { let v = prod(); while (peek() === '+' || peek() === '-') { const op = s[i++]; const r = prod(); v = op === '+' ? v + r : v - r; } return v; };
  try { const v = sum(); return i === s.length && Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : null; } catch { return null; }
}

/** Câu có phép tính "… = ?" mà đáp án khác kết quả máy tính → trả về lời cảnh báo */
export function checkMath(d: Pick<Draft, 'prompt' | 'type' | 'options' | 'correct'>): string | undefined {
  const m = d.prompt.match(/([\d(][\d\s.,+\-−–×x*:÷/()]*[+\-−–×x*:÷/][\d\s.,+\-−–×x*:÷/()]*\d\)?)\s*=\s*(?:\?|…|\.{2,}|_{2,}|\[\s*\]|$)/);
  if (!m) return undefined;
  const v = evalExpr(m[1]);
  if (v === null) return undefined;
  const ans = d.correct[0] ?? '';
  const a = num(ans);
  if (a === null) return undefined;
  if (Math.abs(a - v) > 1e-6) return `Máy tính ra ${String(v).replace('.', ',')} nhưng đáp án ghi ${ans} — kiểm tra lại.`;
  return undefined;
}

/* ------------------------------------------------------------ sang dạng câu trong đề */
export function answerOf(d: Draft): Record<string, unknown> {
  if (d.type === 'single_choice') return { correct: d.correct[0] ?? '' };
  if (d.type === 'multiple_choice') return { correct: d.correct };
  if (d.type === 'true_false') return { correct: d.correct[0] === 'Sai' ? 'Sai' : 'Đúng' };
  return { accepted: d.correct };
}

export function draftProblem(d: Draft): string | null {
  if (!d.prompt.trim()) return 'Thiếu nội dung câu hỏi.';
  if ((d.type === 'single_choice' || d.type === 'multiple_choice') && d.options.filter((o) => o.trim()).length < 2) return 'Cần ít nhất 2 phương án.';
  if ((d.type === 'single_choice' || d.type === 'multiple_choice') && !d.correct.some((c) => d.options.includes(c))) return 'Chưa chọn đáp án đúng.';
  return null;
}
