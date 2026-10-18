// Chấm đề giao làm trên app (máy chủ). Câu đúng hoàn toàn mới được điểm của câu đó (như bài làm trên app).
import { gradeLocal } from '../grading';
import type { AnswerValue } from '../types';
import type { ExamItem } from './assignments';

const MAX_TEXT = 300;
const MAX_LIST = 20;

/** Chỉ nhận câu trả lời đúng khuôn (chuỗi ngắn, mảng chuỗi, cặp chuỗi); còn lại coi như bỏ trống */
export function cleanAnswer(v: unknown): AnswerValue {
  if (typeof v === 'string') return v.slice(0, MAX_TEXT);
  if (Array.isArray(v)) return v.length <= MAX_LIST && v.every((x) => typeof x === 'string') ? (v as string[]).map((x) => x.slice(0, MAX_TEXT)) : null;
  if (v && typeof v === 'object') {
    const e = Object.entries(v as Record<string, unknown>);
    if (e.length > MAX_LIST || !e.every(([k, x]) => typeof x === 'string' && k.length <= MAX_TEXT)) return null;
    return Object.fromEntries(e.map(([k, x]) => [k, (x as string).slice(0, MAX_TEXT)]));
  }
  return null;
}

const isEmpty = (v: AnswerValue) => v === null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export type GradedExam = { score: number; max: number; correct: number; total: number; rows: { i: number; a: AnswerValue; ok: boolean }[] };

export function gradeExam(items: ExamItem[], submitted: unknown): GradedExam | { error: string } {
  if (!Array.isArray(items) || items.length === 0 || items.length > 40) return { error: 'invalid_exam' };
  if (!Array.isArray(submitted) || submitted.length > items.length) return { error: 'invalid_answers' };
  let score = 0, max = 0, correct = 0;
  const rows = items.map((q, i) => {
    const a = cleanAnswer(submitted[i]);
    const pts = Number.isFinite(q.pts) && q.pts > 0 ? q.pts : 1;
    const ok = !isEmpty(a) && Boolean(q.answer) && gradeLocal(q.type, a, q.answer!);
    max += pts;
    if (ok) { score += pts; correct++; }
    return { i, a: isEmpty(a) ? null : a, ok };
  });
  return { score: round2(score), max: round2(max), correct, total: items.length, rows };
}
