// Tổng kết bài làm: số câu đúng, thời gian, điểm, nhận xét theo cấp độ.
// Quy tắc điểm ở src/lib/levels.ts (trùng với hàm finish_quiz_attempt trong migration 0006).

import { LEVELS, LEVEL_LIST, formatDuration, lessonBonus, type Level } from './levels';
import type { AnswerRecord, AttemptSummary } from './types';

export type LevelStat = { level: Level; total: number; correct: number };

export function levelStats(answers: AnswerRecord[]): LevelStat[] {
  return LEVEL_LIST.map((level) => {
    const xs = answers.filter((a) => a.level === level);
    return { level, total: xs.length, correct: xs.filter((a) => a.isCorrect).length };
  }).filter((s) => s.total > 0);
}

export function totals(answers: AnswerRecord[]) {
  const score = answers.filter((a) => a.isCorrect).length;
  const questionPoints = answers.reduce((s, a) => s + a.points, 0);
  const bonus = lessonBonus(score, answers.length);
  const durationMs = answers.reduce((s, a) => s + a.spentMs, 0);
  return { score, questionPoints, lessonBonus: bonus, points: questionPoints + bonus, durationMs };
}

export type Comment = { headline: string; lines: string[] };

/** Nhận xét ngắn, dễ hiểu cho học sinh lớp 1 (và phụ huynh đọc cùng). */
export function buildComment(a: AttemptSummary): Comment {
  const total = a.total || 1;
  const ratio = a.score / total;
  const answers = a.answers;
  const stats = levelStats(answers);
  const timeouts = answers.filter((x) => x.status === 'timeout').length;
  const unanswered = answers.filter((x) => x.status === 'unanswered').length;
  const fast = answers.filter((x) => x.speedBonus > 0).length;
  const answered = answers.filter((x) => x.status === 'correct' || x.status === 'wrong');
  const usedRatio = answered.length
    ? answered.reduce((s, x) => s + x.spentMs / (x.timeLimit * 1000), 0) / answered.length
    : 1;

  const headline =
    ratio === 1 ? 'Xuất sắc! Em làm đúng tất cả các câu!'
    : ratio >= 0.8 ? 'Giỏi lắm! Em làm đúng gần hết bài.'
    : ratio >= 0.6 ? 'Khá lắm! Em đã nắm được phần lớn bài học.'
    : ratio >= 0.4 ? 'Em đã cố gắng! Mình cùng ôn thêm một chút nhé.'
    : 'Không sao đâu! Em xem lại lời giải rồi thử lại nhé.';

  const lines: string[] = [];

  // Điểm mạnh: cấp độ cao nhất làm đúng hết
  const strong = [...stats].reverse().find((s) => s.correct === s.total);
  if (strong) lines.push(`Em làm đúng hết các câu ${LEVELS[strong.level].code} · ${LEVELS[strong.level].name}.`);

  // Cần luyện thêm: cấp độ thấp nhất còn sai từ một nửa trở lên
  const weak = stats.find((s) => s.correct / s.total < 0.5);
  if (weak) lines.push(`Em nên luyện thêm các câu ${LEVELS[weak.level].code} · ${LEVELS[weak.level].name} (đúng ${weak.correct}/${weak.total}).`);
  else {
    const notPerfect = stats.find((s) => s.correct < s.total);
    if (notPerfect) lines.push(`Còn ${notPerfect.total - notPerfect.correct} câu ${LEVELS[notPerfect.level].code} chưa đúng — xem lại lời giải bên dưới nhé.`);
  }

  // Tốc độ
  if (timeouts > 0) lines.push(`Có ${timeouts} câu hết giờ. Lần sau em đọc đề rồi làm nhanh hơn một chút nhé.`);
  else if (fast >= Math.ceil(total / 2) && ratio >= 0.6) lines.push(`Em làm rất nhanh: ${fast} câu được thưởng điểm làm nhanh.`);
  else if (usedRatio > 0.8) lines.push('Em làm cẩn thận nhưng hơi chậm; luyện thêm để làm nhanh hơn nhé.');

  if (unanswered > 0) lines.push(`Còn ${unanswered} câu em chưa làm.`);
  lines.push(`Thời gian làm bài: ${formatDuration(a.durationMs)}.`);
  return { headline, lines };
}
