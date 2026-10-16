// Thang cấp độ nội bộ EduChain Kids (L1–L5), thời gian làm mỗi câu và cách tính điểm.
// Một nguồn duy nhất cho: trang làm bài, trang kết quả, trang quản trị, file seed SQL và file Excel ngân hàng câu hỏi.
// Hàm SQL tương ứng: public.default_time_limit / public.level_points (migration 0006) — sửa ở đây thì sửa cả ở đó.
//
// L1–L5 là thang phân tầng nội bộ, KHÔNG phải cấp độ chính thức của Bộ GD&ĐT.
// Câu L1–L3 tương ứng 3 mức quen thuộc: Nhận biết – Thông hiểu – Vận dụng.

import type { QuestionType } from './types';

export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVEL_LIST: Level[] = [1, 2, 3, 4, 5];

export type LevelInfo = {
  code: string; // L1..L5
  name: string; // tên ngắn
  old?: string; // tên mức cũ (Nhận biết/Thông hiểu/Vận dụng)
  describe: string;
  seconds: number; // thời gian gốc cho 1 câu
  points: number; // điểm khi trả lời đúng
};

export const LEVELS: Record<Level, LevelInfo> = {
  1: { code: 'L1', name: 'Làm quen', old: 'Nhận biết', describe: 'Nhận biết, chỉ ra, ghép trực tiếp', seconds: 30, points: 10 },
  2: { code: 'L2', name: 'Cơ bản', old: 'Thông hiểu', describe: 'Thực hiện dạng bài quen thuộc', seconds: 40, points: 15 },
  3: { code: 'L3', name: 'Vận dụng', old: 'Vận dụng', describe: 'Áp dụng vào tình huống quen thuộc', seconds: 50, points: 20 },
  4: { code: 'L4', name: 'Thử thách', describe: 'Kết hợp vài kỹ năng đã học', seconds: 60, points: 25 },
  5: { code: 'L5', name: 'Mở rộng', describe: 'Tình huống mới, suy luận trên kiến thức đã học', seconds: 75, points: 30 },
};

export const levelLabel = (l: number) => {
  const info = LEVELS[(l >= 1 && l <= 5 ? l : 1) as Level];
  return `${info.code} · ${info.name}`;
};

// Cộng thêm giây theo dạng câu hỏi (thao tác nhiều hơn thì cần thêm thời gian)
export const TYPE_EXTRA_SECONDS: Record<QuestionType, number> = {
  single_choice: 0,
  true_false: 0,
  fill_blank: 10,
  multiple_choice: 10,
  ordering: 15,
  matching: 15,
  fill_blanks: 15,
  true_false_table: 20,
};
export const LONG_PROMPT_CHARS = 60; // đề dài hơn thì cộng thêm thời gian đọc
export const LONG_PROMPT_EXTRA = 10;
export const MIN_SECONDS = 30;
export const MAX_SECONDS = 120;

/** Thời gian (giây) mặc định cho một câu. Kết quả luôn là bội số của 5, trong khoảng 30–120 giây. */
export function defaultTimeLimit(type: QuestionType, level: number, prompt: string): number {
  const lv = (level >= 1 && level <= 5 ? level : 1) as Level;
  // Đếm theo ký tự Unicode (giống char_length trong Postgres), không theo UTF-16
  const raw = LEVELS[lv].seconds + TYPE_EXTRA_SECONDS[type] + ([...prompt].length > LONG_PROMPT_CHARS ? LONG_PROMPT_EXTRA : 0);
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(raw / 5) * 5));
}

// ---------------------------------------------------------------------------
// Điểm
// ---------------------------------------------------------------------------
export const SPEED_BONUS = 5; // đúng và dùng không quá một nửa thời gian
export const SPEED_RATIO = 0.5;
export const PERFECT_BONUS = 20; // đúng tất cả
export const GOOD_BONUS = 10; // đúng từ 80%
export const GOOD_RATIO = 0.8;

export function questionPoints(level: number, correct: boolean, spentMs: number, limitSec: number): { base: number; speed: number } {
  if (!correct) return { base: 0, speed: 0 };
  const lv = (level >= 1 && level <= 5 ? level : 1) as Level;
  const fast = spentMs <= limitSec * 1000 * SPEED_RATIO;
  return { base: LEVELS[lv].points, speed: fast ? SPEED_BONUS : 0 };
}

export function lessonBonus(correct: number, total: number): number {
  if (total <= 0) return 0;
  if (correct === total) return PERFECT_BONUS;
  if (correct / total >= GOOD_RATIO) return GOOD_BONUS;
  return 0;
}

// Danh hiệu theo tổng điểm tích luỹ
export const RANKS = [
  { min: 0, name: 'Hạt mầm', icon: '🌱' },
  { min: 150, name: 'Chồi non', icon: '🌿' },
  { min: 400, name: 'Lá xanh', icon: '🍀' },
  { min: 800, name: 'Cây nhỏ', icon: '🌳' },
  { min: 1500, name: 'Cây lớn', icon: '🌲' },
  { min: 3000, name: 'Cây cổ thụ', icon: '🏆' },
] as const;

export function rankFor(total: number) {
  let i = 0;
  while (i + 1 < RANKS.length && total >= RANKS[i + 1].min) i++;
  const next = RANKS[i + 1];
  return { ...RANKS[i], index: i, next: next ? { ...next, need: next.min - total } : null };
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m} phút ${String(r).padStart(2, '0')} giây` : `${r} giây`;
}
