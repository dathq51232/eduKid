// Chuyển đổi giữa form soạn câu hỏi, dòng dữ liệu trong DB và câu hỏi hiển thị cho học sinh.

import { normalizeAnswer } from '@/lib/grading';
import { defaultTimeLimit, type Level } from '@/lib/levels';
import { shuffle } from '@/lib/shuffle';
import type { AnswerKey, Question, DbQuestionType } from '@/lib/types';
import type { AdminQuestionRow, QuestionDraft } from './types';

export function emptyDraft(type: DbQuestionType = 'single_choice'): QuestionDraft {
  return {
    type,
    prompt: '',
    options: type === 'single_choice' || type === 'multiple_choice' ? ['', '', '', ''] : [],
    correct: type === 'true_false' ? 'Đúng' : '',
    correctMany: [],
    accepted: [''],
    order: ['', '', ''],
    pairs: [
      { left: '', right: '' },
      { left: '', right: '' },
      { left: '', right: '' },
    ],
    explanation: '',
    solution: '',
    skillCode: '',
    difficulty: 1,
    timeLimit: null,
    formId: null,
    outcomeId: null,
  };
}

// Đổi loại câu nhưng giữ lại đề, giải thích, mã kỹ năng, độ khó đã nhập.
export function switchType(draft: QuestionDraft, type: DbQuestionType): QuestionDraft {
  const fresh = emptyDraft(type);
  const keepOptions = (type === 'single_choice' || type === 'multiple_choice') && draft.options.length >= 2;
  return {
    ...fresh,
    id: draft.id,
    prompt: draft.prompt,
    explanation: draft.explanation,
    solution: draft.solution,
    skillCode: draft.skillCode,
    difficulty: draft.difficulty,
    timeLimit: draft.timeLimit,
    formId: draft.formId,
    outcomeId: draft.outcomeId,
    options: keepOptions ? draft.options : fresh.options,
  };
}

function keyOf(row: AdminQuestionRow) {
  const k = Array.isArray(row.question_keys) ? row.question_keys[0] : row.question_keys;
  return {
    answerKey: (k?.answer_key ?? {}) as Record<string, unknown>,
    explanation: k?.explanation?.text ?? '',
    solution: k?.solution?.text ?? '',
  };
}

export function draftFromRow(row: AdminQuestionRow): QuestionDraft {
  const { answerKey, explanation, solution } = keyOf(row);
  const d = emptyDraft(row.question_type);
  const strings = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  d.id = row.id;
  d.prompt = row.prompt?.text ?? '';
  d.explanation = explanation;
  d.solution = solution;
  d.formId = row.form_id ?? null;
  d.outcomeId = row.outcome_id ?? null;
  d.skillCode = row.skill_code ?? '';
  d.difficulty = ([1, 2, 3, 4, 5].includes(row.difficulty) ? row.difficulty : 1) as Level;
  // Thời gian trùng với giá trị tự tính thì để trống (đổi cấp độ sẽ tự tính lại)
  const auto = defaultTimeLimit(row.question_type, d.difficulty, d.prompt);
  d.timeLimit = row.time_limit_sec && row.time_limit_sec !== auto ? row.time_limit_sec : null;

  switch (row.question_type) {
    case 'single_choice':
      d.options = strings(row.options);
      d.correct = String(answerKey.correct ?? '');
      break;
    case 'true_false':
      d.correct = String(answerKey.correct ?? 'Đúng');
      break;
    case 'fill_blank':
      d.accepted = strings(answerKey.accepted);
      break;
    case 'multiple_choice':
      d.options = strings(row.options);
      d.correctMany = strings(answerKey.correct);
      break;
    case 'ordering':
      d.order = strings(answerKey.order);
      break;
    case 'matching': {
      const pairs = (answerKey.pairs ?? {}) as Record<string, string>;
      d.pairs = Object.entries(pairs).map(([left, right]) => ({ left, right: String(right) }));
      break;
    }
  }
  return d;
}

const clean = (list: string[]) => list.map((x) => x.trim()).filter(Boolean);

export function answerKeyOf(d: QuestionDraft): AnswerKey {
  switch (d.type) {
    case 'single_choice':
    case 'true_false':
      return { correct: d.correct.trim() };
    case 'fill_blank':
      return { accepted: clean(d.accepted) };
    case 'multiple_choice':
      return { correct: clean(d.correctMany) };
    case 'ordering':
      return { order: clean(d.order) };
    case 'matching': {
      const pairs: Record<string, string> = {};
      for (const p of d.pairs) if (p.left.trim() && p.right.trim()) pairs[p.left.trim()] = p.right.trim();
      return { pairs };
    }
  }
}

/** Thời gian (giây) của câu: giá trị nhập tay hoặc tự tính. */
export function timeLimitOf(d: QuestionDraft): number {
  return d.timeLimit ?? defaultTimeLimit(d.type, d.difficulty, d.prompt.trim());
}

// Tham số cho rpc('save_question').
export function payloadOf(lessonId: string, d: QuestionDraft) {
  return {
    p_lesson: lessonId,
    p_question: d.id ?? null,
    p_type: d.type,
    p_prompt: d.prompt.trim(),
    p_options: d.type === 'single_choice' || d.type === 'multiple_choice' ? clean(d.options) : [],
    p_answer_key: answerKeyOf(d),
    p_explanation: d.explanation.trim(),
    p_skill_code: d.skillCode.trim() || null,
    p_difficulty: d.difficulty,
    p_time_limit: timeLimitOf(d),
    p_form: d.formId,
    p_outcome: d.outcomeId,
    p_solution: d.solution.trim() || null,
  };
}

function hasDuplicates(list: string[]) {
  const seen = new Set(list.map(normalizeAnswer));
  return seen.size !== list.length;
}

// Kiểm tra trước khi gửi (server kiểm tra lại lần nữa).
export function validateDraft(d: QuestionDraft): string[] {
  const errors: string[] = [];
  if (!d.prompt.trim()) errors.push('Chưa nhập đề bài.');
  if (d.prompt.length > 1000) errors.push('Đề bài dài quá 1000 ký tự.');
  if (d.explanation.length > 1000) errors.push('Nhận xét dài quá 1000 ký tự.');
  if (d.solution.length > 2000) errors.push('Lời giải dài quá 2000 ký tự.');
  if (d.timeLimit !== null && (!Number.isInteger(d.timeLimit) || d.timeLimit < 10 || d.timeLimit > 300))
    errors.push('Thời gian mỗi câu phải từ 10 đến 300 giây.');
  if (d.skillCode.trim() && !/^[a-z0-9_]{2,60}$/.test(d.skillCode.trim()))
    errors.push('Mã kỹ năng chỉ gồm chữ thường không dấu, số, dấu gạch dưới (ví dụ cong_10).');

  const opts = clean(d.options);
  switch (d.type) {
    case 'single_choice':
      if (opts.length < 2) errors.push('Cần ít nhất 2 lựa chọn.');
      if (opts.length > 8) errors.push('Tối đa 8 lựa chọn.');
      if (hasDuplicates(opts)) errors.push('Có hai lựa chọn giống nhau.');
      if (!d.correct.trim() || !opts.some((o) => normalizeAnswer(o) === normalizeAnswer(d.correct))) errors.push('Chưa đánh dấu đáp án đúng.');
      break;
    case 'multiple_choice':
      if (opts.length < 2) errors.push('Cần ít nhất 2 lựa chọn.');
      if (opts.length > 8) errors.push('Tối đa 8 lựa chọn.');
      if (hasDuplicates(opts)) errors.push('Có hai lựa chọn giống nhau.');
      if (clean(d.correctMany).length === 0) errors.push('Chưa đánh dấu đáp án đúng nào.');
      if (clean(d.correctMany).some((c) => !opts.some((o) => normalizeAnswer(o) === normalizeAnswer(c)))) errors.push('Đáp án đúng phải nằm trong các lựa chọn.');
      break;
    case 'true_false':
      if (d.correct !== 'Đúng' && d.correct !== 'Sai') errors.push('Chọn Đúng hoặc Sai.');
      break;
    case 'fill_blank':
      if (clean(d.accepted).length === 0) errors.push('Cần ít nhất 1 đáp án được chấp nhận.');
      break;
    case 'ordering': {
      const items = clean(d.order);
      if (items.length < 2) errors.push('Cần ít nhất 2 mục để sắp xếp.');
      if (items.length > 8) errors.push('Tối đa 8 mục.');
      if (hasDuplicates(items)) errors.push('Có hai mục giống nhau.');
      break;
    }
    case 'matching': {
      const full = d.pairs.filter((p) => p.left.trim() && p.right.trim());
      if (full.length < 2) errors.push('Cần ít nhất 2 cặp đầy đủ hai vế.');
      if (full.length > 8) errors.push('Tối đa 8 cặp.');
      if (d.pairs.some((p) => Boolean(p.left.trim()) !== Boolean(p.right.trim()))) errors.push('Có cặp mới nhập một vế.');
      if (hasDuplicates(full.map((p) => p.left.trim()))) errors.push('Vế trái bị trùng.');
      if (hasDuplicates(full.map((p) => p.right.trim()))) errors.push('Vế phải bị trùng.');
      break;
    }
  }
  return errors;
}

// Câu hỏi đúng như học sinh sẽ thấy (dùng cho nút Xem thử).
export function learnerQuestionOf(d: QuestionDraft, id = 'preview'): Question {
  const base = { id, lessonId: 'preview', type: d.type, prompt: d.prompt.trim() || '(Chưa có đề bài)', level: d.difficulty, timeLimit: timeLimitOf(d) };
  switch (d.type) {
    case 'true_false':
      return { ...base, options: ['Đúng', 'Sai'] };
    case 'fill_blank':
      return { ...base, options: [] };
    case 'ordering':
      return { ...base, options: clean(d.order) };
    case 'matching': {
      const full = d.pairs.filter((p) => p.left.trim() && p.right.trim());
      return {
        ...base,
        leftItems: shuffle(full.map((p) => p.left.trim()), `${id}-l`),
        options: full.map((p) => p.right.trim()),
      };
    }
    default:
      return { ...base, options: clean(d.options) };
  }
}

// Mô tả ngắn đáp án đúng để hiển thị trong danh sách câu hỏi.
export function describeAnswer(d: QuestionDraft): string {
  switch (d.type) {
    case 'single_choice':
    case 'true_false':
      return d.correct;
    case 'fill_blank':
      return clean(d.accepted).join(' | ');
    case 'multiple_choice':
      return clean(d.correctMany).join(', ');
    case 'ordering':
      return clean(d.order).join(' → ');
    case 'matching':
      return d.pairs.filter((p) => p.left && p.right).map((p) => `${p.left} = ${p.right}`).join('; ');
  }
}

const ERRORS: Record<string, string> = {
  not_allowed: 'Bạn không có quyền thực hiện thao tác này.',
  lesson_locked: 'Bài đã xuất bản hoặc lưu trữ. Hãy chuyển về nháp trước khi sửa.',
  invalid_type: 'Loại câu hỏi không hợp lệ.',
  invalid_prompt: 'Đề bài trống hoặc quá dài.',
  explanation_too_long: 'Giải thích quá dài.',
  invalid_skill_code: 'Mã kỹ năng không hợp lệ.',
  invalid_difficulty: 'Cấp độ phải từ L1 đến L5.',
  invalid_time_limit: 'Thời gian mỗi câu phải từ 10 đến 300 giây.',
  invalid_options: 'Lựa chọn không hợp lệ (trống, quá dài hoặc quá nhiều).',
  duplicate_options: 'Có hai lựa chọn giống nhau.',
  need_two_options: 'Cần ít nhất 2 lựa chọn.',
  answer_not_in_options: 'Đáp án đúng phải nằm trong các lựa chọn.',
  invalid_answer_key: 'Đáp án chưa đúng định dạng cho loại câu này.',
  question_not_found: 'Không tìm thấy câu hỏi (có thể đã bị xóa).',
  no_questions: 'Bài chưa có câu hỏi nào.',
  missing_or_invalid_answer_key: 'Có câu hỏi thiếu đáp án hoặc đáp án sai định dạng.',
  invalid_lesson: 'Bài không ở trạng thái có thể xuất bản.',
  only_draft: 'Chỉ xóa được bài ở trạng thái nháp.',
  lesson_has_attempts: 'Bài đã có học sinh làm. Hãy lưu trữ thay vì xóa.',
  use_publish_lesson: 'Dùng nút Xuất bản để xuất bản bài.',
  solution_too_long: 'Lời giải quá dài (tối đa 2000 ký tự).',
  form_wrong_subject: 'Dạng bài không thuộc môn của bài học.',
  outcome_wrong_subject: 'Yêu cầu cần đạt không thuộc môn/lớp của bài học.',
  outcome_not_in_lesson: 'Yêu cầu cần đạt này chưa được gắn cho bài. Gắn YCCĐ cho bài trước, hoặc chọn YCCĐ khác.',
  topic_wrong_subject: 'Chủ đề không thuộc môn/lớp của bài học.',
  school_required: 'Vai trò này cần chọn trường.',
  cannot_revoke_self: 'Bạn không thể tự gỡ quyền admin của chính mình.',
};

export function errorText(error: { message?: string } | null | undefined): string {
  const msg = error?.message ?? '';
  // Ưu tiên mã dài trước (missing_or_invalid_answer_key chứa invalid_answer_key)
  const code = Object.keys(ERRORS)
    .sort((a, b) => b.length - a.length)
    .find((c) => msg.includes(c));
  return code ? ERRORS[code] : msg || 'Có lỗi xảy ra, vui lòng thử lại.';
}
