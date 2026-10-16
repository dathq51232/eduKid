// Quy tắc "không vượt trước": một câu có nằm trong phạm vi kiến thức của bài không.
// Dùng chung cho: kiểm tra nội dung (scripts/check-content.ts) và bộ chọn câu khi "Đổi bộ câu hỏi" (src/lib/sets.ts).

import { gs1Learned } from './ta1-hk1';
import { gs2Learned } from './ta2-vocab';
import { gs3Learned, VI_TOKENS3 } from './ta3-vocab';
import { gs4Learned, VI_TOKENS4 } from './ta4-vocab';
import { gs5Learned, VI_TOKENS5 } from './ta5-vocab';
import { checkSyllable } from './viet-inventory';
import type { ContentQuestion, Scope } from './types';

export const EN_FUNCTION = new Set(['hello', 'hi', 'goodbye', 'bye', 'i', "i'm", 'this', 'is', 'my', 'a', 'an', 'have', 'yes', 'no', 'please', 'can', 'you', 'see', 'what', 'it']);
// Tên gọi các thành phần (đọc cùng thầy cô từ những bài đầu): không tính là nội dung phải tự đọc
export const VI_META = new Set(['dấu', 'huyền', 'sắc', 'hỏi', 'nặng', 'ngã', 'thanh', 'ngang', 'không', 'có', 'âm', 'vần', 'chữ', 'tiếng']);
// Tiếng trong tên riêng địa danh (học sinh đọc như tên riêng, không phải vần cần học): Sa Pa
export const VI_PROPER = new Set(['pa']);
export const VI_ASCII = new Set(['tranh', 'con', 'xe', 'khoai', 'bi', 'khu', 'em', 'meo', 'ca', 'lon', 'tay', 'xanh', 'nghe', 'ra', 'lan', 'lau', 'chanh', 'quay', 'hai', 'ba', 'hoa', 'leo', 'mi', 'chi', 'nhin', 'nho', 'tra', 'loi', 'chia', 'cho', 'gia', 'ban', 'ai', 'la', 'qua', 'mat', 'trai', 'gai', 'chua', 'anh', 'bao', 'trong', 'tai', 'cha', 'bo', 'u', 'yo', 'pizza', 'kia', 'xin', 'vua', 'cam', 'voi', 'bay', 'mo', 'ti', 'vi', 'to', 'nho', 'cu', 'moi', 'dau', 'tim', 'den', 'xe', 'tau', 'ga', 'cho', 'tho', 'ngua', 'ho', 'khi', 'cong', 'bac', 'si', 'nau', 'an', 've', 'doc', 'viet', 'nghe', 'nhac', 'keo', 'ca', 'hat']);

/** Nội dung học sinh phải đọc: lựa chọn, đáp án, vế ghép, và phần trong ngoặc kép/ngoặc đơn của đề */
export function contentStrings(q: ContentQuestion): string[] {
  const k = q.key as Record<string, unknown>;
  // Nhãn "Đúng"/"Sai" của câu đúng-sai là chữ cố định trên giao diện, không tính là nội dung
  const fromKey = [q.type === 'true_false' ? undefined : k.correct, k.accepted, k.order, k.pairs && Object.entries(k.pairs as object).flat()]
    .flat()
    .filter((x): x is string => typeof x === 'string');
  const quoted = [...q.prompt.matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  return [...q.options, ...(q.left ?? []), ...fromKey, ...quoted];
}

/** Danh sách vấn đề (rỗng = câu nằm trong phạm vi của bài) */
export function scopeProblems(q: ContentQuestion, scope: Scope): string[] {
  const out: string[] = [];
  const texts = contentStrings(q);
  if (scope.kind === 'math') {
    const all = [q.prompt, ...texts].join(' ');
    for (const n of all.match(/\d+/g) ?? []) if (Number(n) > scope.maxNumber) out.push(`dùng số ${n} > phạm vi ${scope.maxNumber}`);
    if (/\d\s*\+\s*\d|\.\.\.\s*\+|\+\s*\.\.\./.test(all) && !scope.ops.includes('+')) out.push('dùng phép cộng trước khi học');
    if (/\d\s*[-−]\s*\d|\.\.\.\s*[-−]|[-−]\s*\.\.\./.test(all) && !scope.ops.includes('-')) out.push('dùng phép trừ trước khi học');
    if (scope.pt2) out.push(...twoDigitProblems(all, scope.pt2));
  }
  if (scope.kind === 'viet') {
    for (const t of texts) {
      for (const w of t.split(/[\s.,!?;:()…_“”"'‘’]+/).filter((x) => /\p{L}/u.test(x))) {
        if (VI_META.has(w.toLowerCase()) || VI_PROPER.has(w.toLowerCase())) continue;
        const problem = checkSyllable(w, scope.lessonNo);
        if (problem) out.push(`"${w}" dùng ${problem}, mới học đến bài ${scope.lessonNo}`);
      }
    }
  }
  if (scope.kind === 'math2') {
    const all = [q.prompt, ...texts].join(' ');
    for (const n of normNums(all).match(/\d+/g) ?? []) if (Number(n) > scope.maxNumber) out.push(`dùng số ${n} > phạm vi ${scope.maxNumber}`);
    out.push(...opsProblems(all, scope));
  }
  if (scope.kind === 'math5') {
    const all = [q.prompt, ...texts].join(' ');
    out.push(...math5Problems(all, scope));
  }
  if (scope.kind === 'english') {
    const learned = new Set([...(scope.book === 'gs5' ? [...gs5Learned(scope.unit), ...VI_TOKENS5, ...VI_TOKENS4, ...VI_TOKENS3] : scope.book === 'gs4' ? [...gs4Learned(scope.unit), ...VI_TOKENS4, ...VI_TOKENS3] : scope.book === 'gs3' ? [...gs3Learned(scope.unit), ...VI_TOKENS3] : scope.book === 'gs2' ? gs2Learned(scope.unit) : gs1Learned(scope.unit)), ...(scope.extra ?? [])]);
    for (const t of texts) {
      for (const raw of t.split(/[^A-Za-zÀ-ỹ']+/).filter(Boolean)) {
        if (!/^[A-Za-z']+$/.test(raw)) continue; // từ tiếng Việt có dấu
        const w = raw.toLowerCase();
        if (w.length === 1 || ((q.form === 'TA.CHUCAI' || q.form === 'TA.AM') && w.length <= 4) || learned.has(w) || EN_FUNCTION.has(w) || VI_ASCII.has(w)) continue;
        out.push(`từ "${raw}" chưa học đến Unit ${scope.unit}`);
      }
    }
  }
  return out;
}

const PT2_ORDER = ['none', 'add1', 'add', 'sub1', 'all'] as const;
type Pt2 = (typeof PT2_ORDER)[number];
const atLeast = (have: Pt2, need: Pt2) => PT2_ORDER.indexOf(have) >= PT2_ORDER.indexOf(need);

/**
 * Phép cộng, trừ có số lớn hơn 10 (Học kì 2): chỉ dùng loại phép tính đã học, và luôn KHÔNG NHỚ
 * (cộng: hàng đơn vị cộng lại không quá 9; trừ: chữ số hàng đơn vị của số bị trừ không bé hơn của số trừ).
 * Phép tính trong phạm vi 10 (đã học ở Học kì 1) luôn được dùng.
 */
export function twoDigitProblems(text: string, pt2: Pt2): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(\d+)\s*([+\-−])\s*(\d+)/g)) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    const expr = `${a} ${m[2]} ${b}`;
    if (m[2] === '+') {
      if (a + b <= 10) continue;
      if (a + b > 100) out.push(`${expr}: kết quả vượt 100`);
      else if ((a % 10) + (b % 10) > 9) out.push(`${expr}: phép cộng có nhớ (chưa học ở lớp 1)`);
      if (!atLeast(pt2, 'add1')) out.push(`${expr}: chưa học cộng số có hai chữ số`);
      else if (!atLeast(pt2, 'add') && a > 9 && b > 9) out.push(`${expr}: chưa học cộng hai số có hai chữ số`);
    } else {
      if (a <= 10 && b <= a) continue;
      if (b > a) out.push(`${expr}: số trừ lớn hơn số bị trừ`);
      else if (a % 10 < b % 10) out.push(`${expr}: phép trừ có nhớ (chưa học ở lớp 1)`);
      if (!atLeast(pt2, 'sub1')) out.push(`${expr}: chưa học trừ số có hai chữ số`);
      else if (!atLeast(pt2, 'all') && b > 9) out.push(`${expr}: chưa học trừ hai số có hai chữ số`);
    }
  }
  return out;
}

const hasCarry = (a: number, b: number) => {
  for (; a > 0 || b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) if ((a % 10) + (b % 10) > 9) return true;
  return false;
};
const hasBorrow = (a: number, b: number) => {
  for (; b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) if (a % 10 < b % 10) return true;
  return false;
};

/**
 * Lớp 2 trở lên: chỉ dùng phép tính đã học. Cộng/trừ CÓ NHỚ chỉ khi đã học (carry); phép nhân/chia chỉ trong các
 * bảng đã học (một thừa số / số chia thuộc tables, thương và thừa số còn lại không quá 10).
 * Viết số có dấu cách hàng nghìn ("1 000") được gộp lại trước khi kiểm.
 */
/** Gộp số viết tách lớp: "1 000" (lớp 2) và số lớp 3 viết bằng khoảng trắng hẹp U+202F ("12 345") */
/** Lớp 5: chưa học số thập phân thì không được có số thập phân; phần nguyên không vượt phạm vi */
export function math5Problems(text: string, scope: { maxNumber: number; decimal: boolean }): string[] {
  const out: string[] = [];
  const t = normNums(text);
  for (const m of t.matchAll(/(\d+),(\d+)/g)) if (!scope.decimal) out.push(`số thập phân ${m[0]} (chưa học)`);
  for (const n of t.replace(/(\d+),(\d+)/g, '$1').match(/\d+/g) ?? []) if (Number(n) > scope.maxNumber) out.push(`dùng số ${n} > phạm vi`);
  return out;
}
export const normNums = (text: string) => text.replace(/(^|\D)1 000(?!\d)/g, '$11000').replace(/(\d)\u202F(?=\d{3})/g, '$1');

export function opsProblems(text: string, scope: { ops: readonly string[]; carry: boolean; carryMax?: number; tables?: readonly number[]; bigMul?: boolean; remainder?: boolean; mulMax?: number; pow10?: boolean }): string[] {
  const out: string[] = [];
  // phân số (3/4) không kiểm theo quy tắc số tự nhiên
  const t = normNums(text).replace(/\d+\/\d+/g, 'PS');
  for (const m of t.matchAll(/(\d+)\s*([+\-−×:])\s*(\d+)/g)) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    const op = m[2] === '−' ? '-' : m[2];
    const expr = `${a} ${m[2]} ${b}`;
    if (!scope.ops.includes(op as '+')) { out.push(`${expr}: chưa học phép tính "${op}"`); continue; }
    const carryOk = (top: number) => scope.carry && top <= (scope.carryMax ?? Infinity);
    if (op === '+' && hasCarry(a, b) && a + b > 10 && !carryOk(a + b)) out.push(`${expr}: phép cộng có nhớ (chưa học ở phạm vi này)`);
    if (op === '-') {
      if (b > a) out.push(`${expr}: số trừ lớn hơn số bị trừ`);
      else if (hasBorrow(a, b) && a > 10 && !carryOk(a)) out.push(`${expr}: phép trừ có nhớ (chưa học ở phạm vi này)`);
    }
    const tables = scope.tables ?? [];
    const inTable = (x: number, y: number) => (tables.includes(x) && y <= 10) || (tables.includes(y) && x <= 10);
    const lim = scope.mulMax ?? 10;
    const p10 = (x: number) => !!scope.pow10 && [10, 100, 1000].includes(x);
    if (op === '×' && scope.bigMul) { if (!(Math.min(a, b) <= lim || p10(Math.min(a, b)) || p10(Math.max(a, b)) || inTable(a, b))) out.push(`${expr}: thừa số lớn hơn phạm vi đã học`); continue; }
    if (op === ':' && scope.bigMul) {
      if (!(b <= Math.max(9, lim === 10 ? 9 : lim) || (b === 10 && a % 10 === 0) || p10(b))) out.push(`${expr}: số chia lớn hơn phạm vi đã học`);
      else if (a % b !== 0 && !scope.remainder) out.push(`${expr}: phép chia có dư (chưa học)`);
      continue;
    }
    if (op === '×' && !inTable(a, b)) out.push(`${expr}: ngoài bảng nhân đã học (${tables.join(', ') || 'chưa học'})`);
    if (op === ':' && !(tables.includes(b) && a % b === 0 && a / b <= 10)) out.push(`${expr}: ngoài bảng chia đã học (${tables.join(', ') || 'chưa học'})`);
  }
  return out;
}
