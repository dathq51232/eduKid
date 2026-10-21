import 'server-only';
import { DEMO_QUESTIONS } from '@/lib/demo-data';
import { getLesson } from '@/lib/data';
import { gradeLocal } from '@/lib/grading';
import { lessonBonus, questionPoints } from '@/lib/levels';
import { isPracticeId, questionById } from '@/lib/practice';
import { eligiblePool, generatorFor } from '@/lib/sets';
import type { AnswerValue } from '@/lib/types';

// Chấm lại bài làm ở MÁY CHỦ. Trình duyệt chỉ gửi mã câu + câu trả lời + thời gian;
// đúng/sai và điểm được tính lại từ đáp án gốc (câu soạn sẵn) hoặc sinh lại đúng câu từ seed (câu sinh ngẫu nhiên).
export type SubmittedAnswer = { questionId: string; answer: AnswerValue; spentMs: number };
export type GradedLesson = {
  lessonCode: string;
  lessonTitle: string;
  subjectCode: string;
  grade: number;
  score: number;
  total: number;
  points: number;
  durationMs: number;
  answers: { q: string; ok: boolean; ms: number }[];
};

const MIN_MS = 1500; // nhanh hơn mức này coi như bấm bừa: vẫn tính đúng/sai nhưng không có thưởng nhanh
const MAX_QUESTIONS = 30;

function allowedFor(lessonId: string, questionId: string): boolean {
  if (isPracticeId(questionId)) {
    const gen = generatorFor(lessonId);
    return Boolean(gen && questionId.startsWith(`${gen}~`));
  }
  const q = DEMO_QUESTIONS.find((d) => d.id === questionId);
  if (!q) return false;
  return q.lessonId === lessonId || eligiblePool(lessonId).some((e) => e.id === questionId);
}

export function gradeLessonSubmission(lessonId: string, submitted: SubmittedAnswer[]): GradedLesson | { error: string } {
  const lesson = getLesson(lessonId);
  if (!lesson) return { error: 'unknown_lesson' };
  if (!Array.isArray(submitted) || submitted.length === 0 || submitted.length > MAX_QUESTIONS) return { error: 'invalid_answers' };
  const ids = new Set<string>();
  const rows: GradedLesson['answers'] = [];
  let score = 0;
  let qPoints = 0;
  let duration = 0;

  for (const a of submitted) {
    if (!a || typeof a.questionId !== 'string' || ids.has(a.questionId)) return { error: 'invalid_answers' };
    ids.add(a.questionId);
    if (!allowedFor(lessonId, a.questionId)) return { error: 'question_not_in_lesson' };

    let type, key, level, limit;
    if (isPracticeId(a.questionId)) {
      const g = questionById(a.questionId);
      if (!g) return { error: 'invalid_answers' };
      ({ type, key, level } = g);
      limit = g.timeLimit;
    } else {
      const d = DEMO_QUESTIONS.find((x) => x.id === a.questionId)!;
      type = d.type; key = d.answerKey; level = d.level; limit = d.timeLimit;
    }
    const spent = Math.min(Math.max(Number.isFinite(a.spentMs) ? Math.round(a.spentMs) : 0, 0), limit * 1000);
    const ok = a.answer !== null && a.answer !== undefined && gradeLocal(type, a.answer, key);
    const p = questionPoints(level, ok, spent < MIN_MS ? limit * 1000 : spent, limit);
    if (ok) score += 1;
    qPoints += p.base + p.speed;
    duration += spent;
    rows.push({ q: a.questionId, ok, ms: spent });
  }

  const total = submitted.length;
  return {
    lessonCode: lessonId,
    lessonTitle: lesson.title,
    subjectCode: lesson.subject,
    grade: lesson.grade,
    score,
    total,
    points: qPoints + lessonBonus(score, total),
    durationMs: duration,
    answers: rows,
  };
}

// Kết quả game: kiểm tra trong giới hạn hợp lý (game chạy ở trình duyệt nên đây là kết quả "luyện tập").
const GAME_LIMITS: Record<string, { maxScore: number }> = { pattern: { maxScore: 50 }, memory: { maxScore: 50 }, maze: { maxScore: 1 }, sudoku: { maxScore: 30 }, balance: { maxScore: 10 } };
export function checkGameResult(input: { gameId?: unknown; level?: unknown; score?: unknown; maxScore?: unknown; details?: unknown }) {
  const gameId = typeof input.gameId === 'string' ? input.gameId : '';
  const lim = GAME_LIMITS[gameId];
  const level = Number(input.level), score = Number(input.score), maxScore = Number(input.maxScore);
  if (!lim || !Number.isInteger(level) || level < 1 || level > 5) return null;
  if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > lim.maxScore) return null;
  if (!Number.isInteger(score) || score < 0 || score > maxScore) return null;
  // Chi tiết chỉ nhận vài số nguyên nhỏ (số bước, số lượt…), bỏ mọi thứ khác
  const details: Record<string, number> = {};
  if (input.details && typeof input.details === 'object') {
    for (const [k, v] of Object.entries(input.details as Record<string, unknown>).slice(0, 5)) {
      if (/^[a-z]{1,20}$/.test(k) && Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100000) details[k] = v as number;
    }
  }
  return { gameId, level, score, maxScore, details };
}
