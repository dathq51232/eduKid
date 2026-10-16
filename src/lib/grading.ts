// Chấm điểm phía trình duyệt — CHỈ dùng cho dữ liệu minh họa và nút "Xem thử" của trang quản trị.
// Bài thật được chấm bằng public.grade_answer trên server (migration 0003); hai bên dùng cùng quy tắc.

import type { AnswerKey, AnswerValue, QuestionType } from './types';

export function normalizeAnswer(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function gradeLocal(type: QuestionType, given: AnswerValue, key: AnswerKey): boolean {
  if (given === null || given === undefined) return false;
  const k = key as Record<string, unknown>;

  switch (type) {
    case 'single_choice':
    case 'true_false':
      return typeof given === 'string' && typeof k.correct === 'string' && normalizeAnswer(given) === normalizeAnswer(k.correct);
    case 'fill_blank':
      return typeof given === 'string' && Array.isArray(k.accepted) && (k.accepted as string[]).some((a) => normalizeAnswer(a) === normalizeAnswer(given));
    case 'multiple_choice': {
      if (!Array.isArray(given) || !Array.isArray(k.correct)) return false;
      const a = Array.from(new Set(given.map(normalizeAnswer))).sort();
      const b = Array.from(new Set((k.correct as string[]).map(normalizeAnswer))).sort();
      return a.length === b.length && a.every((x, i) => x === b[i]);
    }
    case 'ordering': {
      if (!Array.isArray(given) || !Array.isArray(k.order)) return false;
      const order = k.order as string[];
      return given.length === order.length && given.every((x, i) => normalizeAnswer(x) === normalizeAnswer(order[i]));
    }
    case 'matching': {
      if (typeof given !== 'object' || Array.isArray(given) || !k.pairs || typeof k.pairs !== 'object') return false;
      const pairs = k.pairs as Record<string, string>;
      const keys = Object.keys(pairs);
      return Object.keys(given).length === keys.length && keys.every((left) => typeof given[left] === 'string' && normalizeAnswer(given[left]) === normalizeAnswer(pairs[left]));
    }
    case 'fill_blanks': {
      if (!Array.isArray(given) || !Array.isArray(k.answers)) return false;
      return (k.answers as string[][]).some((set) => set.length === given.length && set.every((x, i) => normalizeAnswer(x) === normalizeAnswer(given[i] ?? '')));
    }
    case 'true_false_table': {
      if (!Array.isArray(given) || !Array.isArray(k.truth)) return false;
      const truth = k.truth as string[];
      return given.length === truth.length && truth.every((x, i) => normalizeAnswer(x) === normalizeAnswer(given[i] ?? ''));
    }
    default:
      return false;
  }
}

export function isAnswered(value: AnswerValue): boolean {
  if (value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  // Mảng: đủ các ô (ô trống là chuỗi rỗng — dùng cho điền nhiều ô và bảng Đúng/Sai)
  if (Array.isArray(value)) return value.length > 0 && value.every((x) => typeof x === 'string' && x.trim() !== '');
  return Object.keys(value).length > 0;
}
