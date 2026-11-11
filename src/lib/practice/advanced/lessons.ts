// Mục "Chuyên đề nâng cao" (Toán, Tiếng Việt, Tiếng Anh lớp 1–5): mỗi chuyên đề là một bài ở chế độ "Nâng cao" của trang Chọn bài,
// có bộ câu gốc 8 câu (rút từ bộ sinh với hạt giống cố định), "Đổi bộ câu hỏi" và "Luyện tập thêm" sinh đề mới không giới hạn.
// Thêm chuyên đề: Toán viết GenPool (sinh ngược từ đáp án, có vét cạn) trong topics-*.ts; Tiếng Việt / Tiếng Anh viết TplPool
// trong lang-*.ts; rồi thêm một dòng vào ADV_TOPICS.

import type { ContentLesson, ContentQuestion, Level, Scope } from '../../content/types';
import type { SubjectCode } from '../../types';
import { entry, type AnyPool, type Entry } from '../core';
import { makeRng, type Rng } from '../rng';
import type { PracticeQuestion } from '../kit';
import { toPool, type AdvCtx, type AdvGrade, type GenPool } from './engine';
import { AGES, MIXES, PAGES, TREES } from './topics-a';
import { FRACS, WORKS } from './topics-b';
import { EQUALS, QUICKS, SEQS } from './topics-c';
import { G1_AGES, G1_BLANKS, G1_LINES, G1_SEQS } from './topics-g1';
import { TV_KHAC_LOAI, TV_CAU_DO, TV_CHINH_TA, TV_SAP_XEP, TV_THANH_NGU, TV_TRAI_NGHIA } from './lang-tv';
import { TA_ODD, TA_REORDER, TA_SPELL } from './lang-ta';

/** Bộ mẫu câu trực tiếp (Tiếng Việt, Tiếng Anh): mỗi mẫu trả về một câu hỏi hoặc null khi không hợp lớp */
export type Tpl = (r: Rng, c: AdvCtx, l: Level) => PracticeQuestion | null;
export type TplPool = Record<Level, Tpl[]>;
export type AdvTopic = { slug: string; name: string; description: string; grades: AdvGrade[]; subject?: SubjectCode; pool?: GenPool; tpl?: TplPool };
const templatesOf = (t: AdvTopic): TplPool => (t.pool ? toPool(t.pool) : t.tpl!);

export const ADV_TOPICS: AdvTopic[] = [
  // ----------------------------------------------------------------- Toán lớp 1
  { slug: 'xep-hang', name: 'Xếp hàng – vị trí', grades: [1], pool: G1_LINES,
    description: 'Đứng thứ mấy từ trái, từ phải; hàng có mấy bạn; giữa hai bạn có mấy bạn.' },
  { slug: 'o-trong', name: 'Tìm số trong ô trống', grades: [1], pool: G1_BLANKS,
    description: 'Số nào cộng, trừ để được kết quả cho trước; hai vế bằng nhau; số có hai chữ số.' },
  { slug: 'quy-luat-day', name: 'Quy luật dãy số', grades: [1], pool: G1_SEQS,
    description: 'Đếm thêm 1, 2, 5, 10; dãy giảm dần; tìm số còn thiếu; hai dãy đan xen.' },
  { slug: 'hon-kem', name: 'Hơn kém – tuổi', grades: [1], pool: G1_AGES,
    description: 'Nhiều hơn, ít hơn; hơn kém bao nhiêu tuổi không đổi; ba bạn so với nhau.' },
  // ----------------------------------------------------------------- Toán lớp 2–3
  { slug: 'them-bot', name: 'Thêm bớt cho bằng nhau', grades: [2, 3], pool: EQUALS,
    description: 'Bạn này cho bạn kia bao nhiêu thì bằng nhau, cho rồi vẫn còn hơn, tìm số lúc đầu, ba bạn chia lại cho đều.' },
  { slug: 'quy-luat-day', name: 'Quy luật dãy số', grades: [2, 3], pool: SEQS,
    description: 'Viết tiếp dãy cách đều, tìm số còn thiếu, số thứ n, đếm số các số; dãy có hiệu tăng dần, hai dãy đan xen, dãy gấp đôi.' },
  { slug: 'tinh-nhanh', name: 'Tính nhanh', grades: [2, 3], pool: QUICKS,
    description: 'Ghép số tròn chục, tròn trăm; cộng trừ 9, 99, 999; ghép cặp dãy số; thừa số chung.' },
  // Lớp 4–5
  { slug: 'trong-cay', name: 'Trồng cây – khoảng cách', grades: [4, 5], pool: TREES,
    description: 'Trồng cây hai đầu, một đầu, không trồng đầu, vòng tròn; cưa gỗ, leo cầu thang, trồng xen kẽ.' },
  { slug: 'tinh-tuoi', name: 'Tính tuổi', grades: [4, 5], pool: AGES,
    description: 'Hiệu số tuổi không đổi; tổng tuổi tăng theo số người; tổng – hiệu, hiệu – tỉ ở hiện tại, quá khứ, tương lai.' },
  { slug: 'gia-thiet-tam', name: 'Giả thiết tạm (gà – chó)', grades: [4, 5], pool: MIXES,
    description: 'Gà – chó, xe ba bánh – xe đạp, vé người lớn – trẻ em, cuộc thi có điểm trừ.' },
  { slug: 'danh-so-trang', name: 'Đánh số trang – đếm chữ số', grades: [4, 5], pool: PAGES,
    description: 'Đếm chữ số khi đánh số trang, bài toán ngược, đếm số lần xuất hiện một chữ số, tìm chữ số thứ k.' },
  { slug: 'day-phan-so', name: 'Dãy phân số khử dần', grades: [5], pool: FRACS,
    description: 'Tổng dãy phân số có quy luật: tách mỗi số hạng thành hiệu hai phân số để các số ở giữa triệt tiêu.' },
  { slug: 'cong-viec-chung', name: 'Công việc chung – vòi nước', grades: [5], pool: WORKS,
    description: 'Nhiều người cùng làm, có người nghỉ giữa chừng; vòi chảy vào – vòi tháo ra.' },
  // ----------------------------------------------------------------- Tiếng Việt
  { slug: 'tv-cau-do', subject: 'tieng-viet', name: 'Giải câu đố', grades: [1, 2, 3], tpl: TV_CAU_DO,
    description: 'Đố vật, đố con vật, đố hiện tượng; đố chữ: đổi dấu thanh thành tiếng mới.' },
  { slug: 'tv-chinh-ta', subject: 'tieng-viet', name: 'Quy tắc c/k, g/gh, ng/ngh', grades: [1, 2], tpl: TV_CHINH_TA,
    description: 'k, gh, ngh đứng trước i, e, ê; c, g, ng đứng trước các âm còn lại. Chọn chữ đúng, tìm từ viết sai.' },
  { slug: 'tv-sap-xep', subject: 'tieng-viet', name: 'Sắp xếp từ thành câu', grades: [1, 2, 3], tpl: TV_SAP_XEP,
    description: 'Sắp xếp các từ thành câu đúng, câu dài dần, có dấu phẩy.' },
  { slug: 'tv-tu-khac-loai', subject: 'tieng-viet', name: 'Tìm từ khác loại', grades: [1, 2, 3, 4, 5], tpl: TV_KHAC_LOAI,
    description: 'Lớp 1: nhóm sự vật; lớp 2–3: từ chỉ sự vật, hoạt động, đặc điểm; lớp 4–5: danh từ, động từ, tính từ.' },
  { slug: 'tv-thanh-ngu', subject: 'tieng-viet', name: 'Thành ngữ, tục ngữ', grades: [2, 3, 4, 5], tpl: TV_THANH_NGU,
    description: 'Thành ngữ so sánh (nhanh như cắt, chậm như rùa…); lớp 4–5: hiểu nghĩa tục ngữ.' },
  { slug: 'tv-trai-nghia', subject: 'tieng-viet', name: 'Từ trái nghĩa – đồng nghĩa', grades: [2, 3, 4, 5], tpl: TV_TRAI_NGHIA,
    description: 'Tìm từ trái nghĩa, cặp từ trái nghĩa; lớp 3–5: từ đồng nghĩa (cùng nghĩa).' },
  // ----------------------------------------------------------------- Tiếng Anh (chỉ dùng vốn từ đã học của lớp)
  { slug: 'ta-odd-one-out', subject: 'tieng-anh', name: 'Odd one out – Chọn từ khác loại', grades: [1, 2, 3, 4, 5], tpl: TA_ODD,
    description: 'Chọn từ không cùng nhóm: con vật, đồ ăn, màu sắc, gia đình, đồ dùng học tập… (vốn từ đã học của lớp).' },
  { slug: 'ta-spelling', subject: 'tieng-anh', name: 'Spelling – Đánh vần', grades: [1, 2, 3, 4, 5], tpl: TA_SPELL,
    description: 'Điền chữ cái còn thiếu, chọn cách đánh vần đúng, sắp xếp chữ cái thành từ.' },
  { slug: 'ta-reorder', subject: 'tieng-anh', name: 'Reorder – Sắp xếp thành câu', grades: [2, 3, 4, 5], tpl: TA_REORDER,
    description: 'Sắp xếp các từ thành câu đúng theo mẫu câu đã học.' },
];

// Phạm vi kiến thức (dùng cho kiểm tra "không vượt trước"): lớp 2 bảng nhân 2, 5; lớp 3 nhân chia với số có một chữ số; lớp 4 đủ 4 phép tính với số nhiều chữ số; lớp 5 có phân số.
const SCOPE: Record<AdvGrade, Scope> = {
  1: { kind: 'math', maxNumber: 100, ops: ['+', '-'], pt2: 'all' },
  2: { kind: 'math2', maxNumber: 1000, ops: ['+', '-', '×', ':'], carry: true, carryMax: 1000, tables: [2, 5] },
  3: { kind: 'math2', maxNumber: 100000, ops: ['+', '-', '×', ':'], carry: true, carryMax: 100000, tables: [2, 3, 4, 5, 6, 7, 8, 9], bigMul: true, remainder: true },
  4: { kind: 'math2', maxNumber: 999999999, ops: ['+', '-', '×', ':'], carry: true, carryMax: 999999999, tables: [2, 3, 4, 5, 6, 7, 8, 9], bigMul: true, remainder: true, mulMax: 99, pow10: true },
  5: { kind: 'math5', maxNumber: 999999999, ops: ['+', '-', '×', ':'], decimal: true },
};
export { advId } from '../../content/knowledge-nc';
import { advId } from '../../content/knowledge-nc';
const TARGET: Level[] = [1, 1, 2, 2, 3, 3, 4, 5];
const subjectOf = (t: AdvTopic): SubjectCode => t.subject ?? 'toan';
/** Phạm vi theo môn: Tiếng Việt lớp 1 đã học hết các vần; Tiếng Anh: hết sách của lớp */
const LAST_UNIT: Record<AdvGrade, number> = { 1: 16, 2: 16, 3: 20, 4: 20, 5: 20 };
const EN_BOOK = { 2: 'gs2', 3: 'gs3', 4: 'gs4', 5: 'gs5' } as const;
function scopeOf(t: AdvTopic, grade: AdvGrade): Scope {
  const s = subjectOf(t);
  if (s === 'tieng-viet') return grade === 1 ? { kind: 'viet', lessonNo: 90 } : { kind: 'viet2', grade };
  if (s === 'tieng-anh') return grade === 1 ? { kind: 'english', unit: LAST_UNIT[1] } : { kind: 'english', unit: LAST_UNIT[grade], book: EN_BOOK[grade] };
  return SCOPE[grade];
}
const UNIT: Record<SubjectCode, { letter: string; title: string; topic: (g: number) => string }> = {
  toan: { letter: 'T', title: 'Chuyên đề nâng cao · Tư duy', topic: (g) => (g === 1 ? 'T1.PT' : `T${g}.TD`) },
  'tieng-viet': { letter: 'V', title: 'Chuyên đề nâng cao · Tiếng Việt', topic: (g) => (g === 1 ? 'V1.VIET' : `V${g}.TU`) },
  'tieng-anh': { letter: 'A', title: 'Chuyên đề nâng cao · Tiếng Anh', topic: (g) => (g === 1 ? 'A1.EXTRA' : `A${g}.LANG`) },
};
import { ADV_BOOK } from '../../content/knowledge-nc';
export { ADV_BOOK };

/** Câu sinh tự động → câu soạn sẵn (ô điền một đáp số → fill_blank) */
function toContent(q: PracticeQuestion): ContentQuestion {
  const rest: PracticeQuestion = { ...q };
  delete rest.blanks; delete rest.figure; delete rest.optionFigures; delete rest.statements;
  if (q.type !== 'fill_blanks') return rest;
  const line = (q.blanks ?? [])[0]?.replace('{}/{}', '?').replace('{}', '?') ?? 'Đáp số: ?';
  const accepted = [...new Set((q.key as { answers: string[][] }).answers.map((a) => a.join('/')))];
  return { ...rest, type: 'fill_blank', prompt: `${q.prompt}\n${line}`, options: [], key: { accepted } };
}

function baseQuestions(t: AdvTopic, grade: AdvGrade): ContentQuestion[] {
  const pool = templatesOf(t);
  const ctx: AdvCtx = { grade };
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  TARGET.forEach((lv, slot) => {
    const r = makeRng(grade * 9173 + slot * 104729 + t.slug.length * 31 + 7);
    for (let i = 0; i < 400; i++) {
      const q = r.pick(pool[lv])(r, ctx, lv);
      if (!q || seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push(toContent(q));
      return;
    }
  });
  return out;
}

const topicsOf = (grade: AdvGrade, subject?: SubjectCode) => ADV_TOPICS.filter((t) => t.grades.includes(grade) && (!subject || subjectOf(t) === subject));

function lessonOf(t: AdvTopic, grade: AdvGrade, i: number): ContentLesson {
  return {
    id: advId(grade, t.slug),
    subject: subjectOf(t),
    grade,
    semester: 2,
    book: ADV_BOOK,
    ref: `Chuyên đề ${i + 1}`,
    unit: { code: `NC.${UNIT[subjectOf(t)].letter}${grade}`, title: UNIT[subjectOf(t)].title },
    topicCode: UNIT[subjectOf(t)].topic(grade),
    title: `Chuyên đề ${i + 1}. ${t.name}`,
    description: t.description,
    scope: scopeOf(t, grade),
    questions: baseQuestions(t, grade),
  };
}

const SUBJECTS: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];
/** Bài chuyên đề nâng cao của lớp, cả ba môn (đánh số Chuyên đề 1, 2… riêng từng môn) */
const CACHE = new Map<number, ContentLesson[]>();
export const advancedLessons = (grade: AdvGrade): ContentLesson[] => {
  let list = CACHE.get(grade);
  if (!list) { list = SUBJECTS.flatMap((s) => topicsOf(grade, s).map((t, i) => lessonOf(t, grade, i))); CACHE.set(grade, list); }
  return list;
};

/** Bộ sinh "Luyện tập thêm" cho các chuyên đề của lớp (thứ tự: Toán 900+, Tiếng Việt 930+, Tiếng Anh 960+) */
export const advancedEntries = (grade: AdvGrade): Entry[] =>
  SUBJECTS.flatMap((s, si) => topicsOf(grade, s).map((t, i) =>
    entry(advancedLessons(grade).find((l) => l.id === advId(grade, t.slug)), () => ({ grade }) as AdvCtx, templatesOf(t) as unknown as AnyPool, grade * 1000 + 900 + si * 30 + i)));
