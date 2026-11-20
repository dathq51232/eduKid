// QUY TẮC CẬP NHẬT KIẾN THỨC (cơ bản / nâng cao) — dùng chung cho trang Quản trị và các script kiểm tra.
// Tài liệu: docs/QUY-TAC-CAP-NHAT-KIEN-THUC.md. Bảng dữ liệu: lessons.level, lesson_knowledge (migration 0070).
// errors = chặn (không cho chuyển sang Chờ duyệt); warnings = nhắc người soạn xem lại.
import type { Level } from '@/lib/levels';
import { falseStatements } from './verify-math';

export type KnowledgeLevel = 'co_ban' | 'nang_cao';
export const LEVEL_LABEL: Record<KnowledgeLevel, string> = { co_ban: 'Cơ bản', nang_cao: 'Nâng cao' };

/** Quy định theo cấp: mức câu hỏi được dùng, số câu tối thiểu của một bài */
export const LEVEL_RULES: Record<KnowledgeLevel, {
  levels: Level[]; mustHave: Level[]; minQuestions: number; minHard: number; solutionRequired: boolean; prerequisiteRequired: boolean; hint: string;
}> = {
  co_ban: {
    levels: [1, 2, 3], mustHave: [1, 2, 3], minQuestions: 6, minHard: 0, solutionRequired: false, prerequisiteRequired: false,
    hint: 'Theo sách giáo khoa, câu mức L1–L3, đủ cả ba mức; ít nhất 6 câu.',
  },
  nang_cao: {
    levels: [3, 4, 5], mustHave: [], minQuestions: 4, minHard: 2, solutionRequired: true, prerequisiteRequired: true,
    hint: 'Chuyên đề mở rộng, câu mức L3–L5 (ít nhất 2 câu L4–L5); câu nào cũng có lời giải từng bước; ghi bài cơ bản cần học trước.',
  },
};

// ---------- Bản sắc (docs/BAN-SAC-EDUCHAINKIDS.md) ----------
const FORBIDDEN: { re: RegExp; why: string }[] = [
  { re: /\bthi\s+(hương|hội|đình)\b/iu, why: 'tên khoa cử' },
  { re: /\b(trạng\s+nguyên|bảng\s+nhãn|thám\s+hoa|sơ\s+khảo)\b/iu, why: 'tên khoa cử' },
  { re: /\b(mèo\s+con|chuột\s+vàng|trâu\s+vàng|khỉ\s+con|ngựa\s+con|hổ\s+con)\b(?=[^.\n]{0,20}\b(dạng|bài|vòng|cấp)\b)|\b(dạng|bài|vòng|cấp)\s+(mèo\s+con|chuột\s+vàng|trâu\s+vàng|khỉ\s+con|ngựa\s+con|hổ\s+con)\b/iu, why: 'tên dạng bài theo con giáp' },
];
/** Chữ vi phạm bản sắc sản phẩm (tên khoa cử, tên dạng bài theo con giáp) */
export function identityIssues(text: string | undefined): string[] {
  if (!text) return [];
  return FORBIDDEN.flatMap(({ re, why }) => { const m = re.exec(text); return m ? [`Không dùng ${why} “${m[0]}” (xem Bản sắc EduChain Kids).`] : []; });
}

// ---------- Kiến thức cần nhớ ----------
export type KnowledgeDraft = { points: string[]; example: string; note: string };
export type Verdict = { errors: string[]; warnings: string[] };

export function validateKnowledge(k: KnowledgeDraft, level: KnowledgeLevel): Verdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const points = k.points.map((p) => p.trim()).filter(Boolean);
  if (points.length === 0) errors.push('Chưa có ý nào trong “Kiến thức cần nhớ”.');
  if (points.length > 6) errors.push('Tối đa 6 ý — tách bớt sang bài khác.');
  else if (points.length === 1 || points.length > 4) warnings.push('Nên có 2–4 ý ngắn để học sinh dễ nhớ.');
  points.forEach((p, i) => {
    if (p.length > 200) errors.push(`Ý ${i + 1} dài quá 200 ký tự — viết thành câu ngắn.`);
    falseStatements(p).forEach((m) => errors.push(`Ý ${i + 1}: phép tính sai ${m}`));
    identityIssues(p).forEach((m) => errors.push(`Ý ${i + 1}: ${m}`));
  });
  if (k.example.length > 600) errors.push('Ví dụ dài quá 600 ký tự.');
  if (k.note.length > 600) errors.push('Ghi chú dài quá 600 ký tự.');
  if (!k.example.trim()) (level === 'nang_cao' ? errors : warnings).push('Chưa có ví dụ mẫu' + (level === 'nang_cao' ? ' — bài nâng cao bắt buộc có ví dụ giải mẫu.' : '.'));
  falseStatements(k.example).forEach((m) => errors.push(`Ví dụ: phép tính sai ${m}`));
  falseStatements(k.note).forEach((m) => errors.push(`Ghi chú: phép tính sai ${m}`));
  [...identityIssues(k.example), ...identityIssues(k.note)].forEach((m) => errors.push(m));
  return { errors, warnings };
}

// ---------- Cả bài: đủ câu, đúng mức, lời giải ----------
export type BankQuestion = { difficulty: Level; solution: string };

/** Điều kiện để bài chuyển sang "Chờ duyệt": có kiến thức đạt, đủ câu theo cấp, câu đúng mức. */
export function validateLessonBank(opts: {
  level: KnowledgeLevel; knowledge: KnowledgeDraft | null; questions: BankQuestion[]; prerequisiteId: string | null;
}): Verdict {
  const r = LEVEL_RULES[opts.level];
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!opts.knowledge) errors.push('Bài chưa có “Kiến thức cần nhớ”.');
  else { const v = validateKnowledge(opts.knowledge, opts.level); errors.push(...v.errors); warnings.push(...v.warnings); }
  const qs = opts.questions;
  if (qs.length < r.minQuestions) errors.push(`Bài ${LEVEL_LABEL[opts.level].toLowerCase()} cần ít nhất ${r.minQuestions} câu (đang có ${qs.length}).`);
  const off = qs.filter((q) => !r.levels.includes(q.difficulty));
  if (off.length) errors.push(`${off.length} câu ở mức ngoài L${r.levels[0]}–L${r.levels[r.levels.length - 1]} của bài ${LEVEL_LABEL[opts.level].toLowerCase()}.`);
  const missing = r.mustHave.filter((l) => !qs.some((q) => q.difficulty === l));
  if (missing.length && qs.length) errors.push(`Chưa có câu mức ${missing.map((l) => `L${l}`).join(', ')}.`);
  const hard = qs.filter((q) => q.difficulty >= 4).length;
  if (hard < r.minHard) errors.push(`Cần ít nhất ${r.minHard} câu mức L4–L5 (đang có ${hard}).`);
  if (r.solutionRequired) {
    const noSol = qs.filter((q) => !q.solution.trim()).length;
    if (noSol) errors.push(`${noSol} câu chưa có lời giải từng bước (bắt buộc với bài nâng cao).`);
  } else if (qs.some((q) => !q.solution.trim())) warnings.push('Có câu chưa có lời giải chi tiết — nên bổ sung.');
  if (r.prerequisiteRequired && !opts.prerequisiteId) errors.push('Bài nâng cao phải ghi bài cơ bản cần học trước.');
  return { errors, warnings };
}

/** Tự kiểm của bộ quy tắc (chạy trong check:knowledge) */
export function rulesSelfTestErrors(): string[] {
  const errs: string[] = [];
  if (!identityIssues('Vòng thi Hương lớp 3').length) errs.push('[quy tắc] không chặn tên khoa cử "thi Hương"');
  if (!identityIssues('Dạng Mèo con tìm số').length) errs.push('[quy tắc] không chặn tên dạng bài theo con giáp');
  if (identityIssues('Bạn mèo con đang chơi với bóng.').length) errs.push('[quy tắc] chặn nhầm câu chuyện có "mèo con"');
  if (!validateKnowledge({ points: ['7 + 5 = 13'], example: '', note: '' }, 'co_ban').errors.length) errs.push('[quy tắc] không bắt phép tính sai trong kiến thức');
  if (validateKnowledge({ points: ['Cộng hai số: 7 + 5 = 12.', 'Đổi chỗ các số hạng thì tổng không đổi.'], example: '5 + 7 = 12', note: '' }, 'co_ban').errors.length) errs.push('[quy tắc] báo nhầm kiến thức đúng');
  const v = validateLessonBank({ level: 'nang_cao', knowledge: { points: ['a', 'b'], example: 'x', note: '' }, questions: [{ difficulty: 1, solution: '' }], prerequisiteId: null });
  if (v.errors.length < 4) errs.push('[quy tắc] bài nâng cao thiếu điều kiện mà không bị chặn');
  return errs;
}
