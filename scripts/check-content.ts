// Kiểm tra tự động bộ bài tập soạn sẵn (src/lib/content).
// Chạy: npx tsx scripts/check-content.ts   — thoát với mã 1 nếu có lỗi.
import { CONTENT } from '../src/lib/content';
import { math5Problems, normNums, opsProblems, scopeProblems, twoDigitProblems } from '../src/lib/content/scope';
import { KNOWLEDGE } from '../src/lib/content/knowledge';
import { findOutcomeAny, formsOf } from '../src/lib/curriculum';
import { gradeLocal, normalizeAnswer } from '../src/lib/grading';
import { defaultTimeLimit } from '../src/lib/levels';
import { BANK, deOf } from '../src/lib/content/ngan-hang-lop1';
import type { ContentLesson, ContentQuestion } from '../src/lib/content/types';

const errors: string[] = [];
const warns: string[] = [];
const err = (where: string, msg: string) => errors.push(`✗ ${where}: ${msg}`);

function correctAnswerOf(q: ContentQuestion) {
  const k = q.key as Record<string, unknown>;
  if (q.type === 'fill_blank') return (k.accepted as string[])[0];
  if (q.type === 'ordering') return k.order as string[];
  if (q.type === 'matching') return k.pairs as Record<string, string>;
  return k.correct as string | string[];
}

function checkQuestion(lesson: ContentLesson, q: ContentQuestion, i: number) {
  const at = `${lesson.id} #${i + 1}`;
  const k = q.key as Record<string, unknown>;
  const norm = (xs: string[]) => new Set(xs.map(normalizeAnswer)).size === xs.length;

  if (!q.prompt.trim() || q.prompt.length > 1000) err(at, 'đề trống hoặc quá dài');
  if (!q.explanation.trim()) err(at, 'thiếu nhận xét');
  if ((q.solution ?? '').length > 2000) err(at, 'lời giải quá dài');
  if (q.options.length > 8 || q.options.some((o) => !o.trim() || o.length > 200)) err(at, 'lựa chọn không hợp lệ');
  if (q.skill && !/^[a-z0-9_]{2,60}$/.test(q.skill)) err(at, `mã kỹ năng sai "${q.skill}"`);
  if (![1, 2, 3, 4, 5].includes(q.level)) err(at, `cấp độ phải từ 1 đến 5 (đang là ${q.level})`);
  if (q.level >= 3 && !q.solution) warns.push(`! ${at}: câu L${q.level} chưa có lời giải`);
  if (q.timeLimit !== undefined && (q.timeLimit < 10 || q.timeLimit > 300)) err(at, 'thời gian phải từ 10 đến 300 giây');

  switch (q.type) {
    case 'single_choice':
      if (q.options.length < 2 || !norm(q.options)) err(at, 'cần ≥2 lựa chọn khác nhau');
      if (!q.options.some((o) => normalizeAnswer(o) === normalizeAnswer(String(k.correct)))) err(at, 'đáp án không nằm trong lựa chọn');
      break;
    case 'multiple_choice':
      if (q.options.length < 2 || !norm(q.options)) err(at, 'cần ≥2 lựa chọn khác nhau');
      if (!(k.correct as string[]).every((c) => q.options.some((o) => normalizeAnswer(o) === normalizeAnswer(c)))) err(at, 'đáp án không nằm trong lựa chọn');
      if ((k.correct as string[]).length === q.options.length) err(at, 'tất cả lựa chọn đều đúng');
      break;
    case 'ordering':
      if ((k.order as string[]).length < 2 || !norm(k.order as string[])) err(at, 'sắp xếp cần ≥2 mục khác nhau');
      break;
    case 'matching': {
      const p = k.pairs as Record<string, string>;
      if (Object.keys(p).length < 2 || !norm(Object.values(p)) || !norm(Object.keys(p))) err(at, 'ghép cặp cần ≥2 cặp, không trùng');
      break;
    }
    case 'fill_blank':
      if (!(k.accepted as string[]).length) err(at, 'thiếu đáp án điền');
      break;
    case 'true_false':
      if (k.correct !== 'Đúng' && k.correct !== 'Sai') err(at, 'đúng/sai phải là "Đúng" hoặc "Sai"');
  }
  if (!gradeLocal(q.type, correctAnswerOf(q), q.key)) err(at, 'đáp án đúng KHÔNG được chấm đúng');

  // Danh mục
  const o = findOutcomeAny(lesson.subject, q.outcome);
  if (!o) err(at, `YCCĐ không có trong danh mục: ${q.outcome}`);
  if (!formsOf(lesson.subject).some((f) => f.code === q.form)) err(at, `dạng bài không thuộc môn: ${q.form}`);

  // Không vượt trước
  for (const p of scopeProblems(q, lesson.scope)) err(at, p);
}

const ids = new Set<string>();
type Stat = { lessons: number; q: number; l1: number; l2: number; l3: number; l4: number; l5: number; sol: number; phut: number };
const stats: Record<string, Stat> = {};
for (const lesson of CONTENT) {
  if (ids.has(lesson.id)) err(lesson.id, 'trùng id bài');
  ids.add(lesson.id);
  if (lesson.questions.length < 5) warns.push(`! ${lesson.id}: chỉ có ${lesson.questions.length} câu`);
  const prompts = new Set<string>();
  lesson.questions.forEach((q, i) => {
    if (prompts.has(q.prompt)) err(`${lesson.id} #${i + 1}`, 'trùng đề trong cùng bài');
    prompts.add(q.prompt);
    checkQuestion(lesson, q, i);
  });
  const levels = new Set(lesson.questions.map((q) => q.level));
  if (!levels.has(1) || !levels.has(3)) warns.push(`! ${lesson.id}: thiếu mức ${!levels.has(1) ? 'L1' : 'L3'}`);
  // Câu phải đi từ dễ đến khó (trang làm bài cũng tự sắp lại, đây chỉ là nhắc người soạn)
  if (lesson.kind === 'review' && lesson.questions.some((q, i) => i > 0 && q.level < lesson.questions[i - 1].level)) err(lesson.id, 'đề ôn chưa sắp từ dễ đến khó');
  const key = `${lesson.subject} L${lesson.grade}${lesson.kind === 'review' ? ' (ôn tập)' : ''}`;
  const s = (stats[key] ??= { lessons: 0, q: 0, l1: 0, l2: 0, l3: 0, l4: 0, l5: 0, sol: 0, phut: 0 });
  s.lessons++;
  for (const q of lesson.questions) {
    s.q++;
    s[`l${q.level}` as 'l1']++;
    if (q.solution) s.sol++;
    s.phut += (q.timeLimit ?? defaultTimeLimit(q.type, q.level, q.prompt)) / 60;
  }
}

// Kiến thức cần nhớ: mỗi bài Toán theo sách đều có; ví dụ trong kiến thức cũng không vượt trước
for (const lesson of CONTENT.filter((l) => l.subject === 'toan' && l.kind !== 'review')) {
  const k = KNOWLEDGE[lesson.id];
  if (!k || !k.points.length) { err(lesson.id, 'thiếu "Kiến thức cần nhớ"'); continue; }
  const text = [...k.points, k.example ?? '', k.note ?? ''].join(' ');
  if (lesson.scope.kind === 'math') {
    for (const n of text.match(/\d+/g) ?? []) if (Number(n) > Math.max(lesson.scope.maxNumber, 10)) err(lesson.id, `kiến thức dùng số ${n} vượt phạm vi`);
    if (lesson.scope.pt2) for (const p of twoDigitProblems(text, lesson.scope.pt2)) err(lesson.id, `kiến thức: ${p}`);
  }
  if (lesson.scope.kind === 'math5') for (const p of math5Problems(text, lesson.scope)) err(lesson.id, `kiến thức: ${p}`);
  if (lesson.scope.kind === 'math2') {
    for (const n of normNums(text).match(/\d+/g) ?? []) if (Number(n) > lesson.scope.maxNumber) err(lesson.id, `kiến thức dùng số ${n} vượt phạm vi`);
    for (const p of opsProblems(text, lesson.scope)) err(lesson.id, `kiến thức: ${p}`);
  }
}
for (const id of Object.keys(KNOWLEDGE)) if (!CONTENT.some((l) => l.id === id)) err(id, 'kiến thức của bài không tồn tại');

// Ngân hàng: mã không trùng, mỗi môn đủ 8 câu mỗi cấp độ
const bankIds = new Set<string>();
for (const b of BANK) {
  if (!/^EC1-\d{3}$/.test(b.id) || bankIds.has(b.id)) err(b.id, 'mã câu trong ngân hàng sai hoặc trùng');
  bankIds.add(b.id);
  if (b.origin === 'moi' && (!b.stage || !b.topic || !b.prerequisite || !b.basis)) err(b.id, 'câu mới thiếu giai đoạn/chủ đề/điều kiện/căn cứ');
  if (deOf(b).de > 4) err(b.id, 'cấp độ này đã đủ 8 câu — thừa câu');
}
for (const subj of ['toan', 'tieng-viet', 'tieng-anh'])
  for (const lv of [1, 2, 3, 4, 5]) {
    const n = BANK.filter((b) => b.subject === subj && b.q.level === lv).length;
    if (n !== 8) err(`ngân hàng ${subj} L${lv}`, `có ${n} câu, cần 8`);
  }

for (const s of Object.values(stats)) s.phut = Math.round(s.phut);
console.table(stats); // phut = tổng thời gian tối đa (phút) nếu làm hết các bài
warns.forEach((w) => console.log(w));
if (errors.length) {
  errors.forEach((e) => console.log(e));
  console.log(`\n${errors.length} lỗi`);
  process.exit(1);
}
console.log('\nKhông có lỗi.');
