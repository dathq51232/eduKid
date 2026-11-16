// Lưu kết quả và điểm tích luỹ trên trình duyệt (chế độ minh họa).
// Khi nối Supabase: kết quả lấy từ quiz_attempts (finish_quiz_attempt trả points, duration_ms),
// điểm tích luỹ lấy từ rpc('student_points') — cùng quy tắc: mỗi bài chỉ tính lần làm điểm cao nhất.

import type { AttemptSummary } from './types';

const BEST_KEY = 'edukid_best_v1';
const LAST_KEY = 'edukid_last_attempt_v1';
const POINTS_KEY = 'edukid_points_v1';

export type BestMap = Record<string, { score: number; total: number }>;
type PointsStore = { lessons: Record<string, { best: number; title: string; at: string }> };

export function starsFor(score: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = score / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  if (ratio > 0) return 1;
  return 0;
}

export function readBest(): BestMap {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? (JSON.parse(raw) as BestMap) : {};
  } catch {
    return {};
  }
}

function readPointsStore(): PointsStore {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as PointsStore) : null;
    return parsed && typeof parsed.lessons === 'object' ? parsed : { lessons: {} };
  } catch {
    return { lessons: {} };
  }
}

const sumBest = (store: PointsStore) => Object.values(store.lessons).reduce((s, l) => s + (l.best || 0), 0);

/** Tổng điểm tích luỹ: cộng điểm cao nhất của từng bài. */
export function readTotalPoints(): number {
  return sumBest(readPointsStore());
}

/** Điểm cao nhất đã đạt của một bài (0 nếu chưa làm). */
export function readLessonBest(lessonId: string): number {
  return readPointsStore().lessons[lessonId]?.best ?? 0;
}

/**
 * Ghi điểm của lần làm này. Làm lại một bài chỉ được cộng thêm phần điểm VƯỢT kỷ lục cũ của bài đó
 * (tránh làm đi làm lại bài dễ để lấy điểm). Trả về số điểm được cộng thêm và tổng mới.
 */
export function addPoints(lessonId: string, title: string, points: number): { newPoints: number; previousTotal: number; totalPoints: number } {
  const store = readPointsStore();
  const previousTotal = sumBest(store);
  const prev = store.lessons[lessonId]?.best ?? 0;
  const newPoints = Math.max(0, points - prev);
  if (points > prev) store.lessons[lessonId] = { best: points, title, at: new Date().toISOString() };
  try {
    localStorage.setItem(POINTS_KEY, JSON.stringify(store));
  } catch {
    // Trình duyệt chặn bộ nhớ: vẫn hiển thị điểm của lần này
  }
  return { newPoints, previousTotal, totalPoints: previousTotal + newPoints };
}

// ---------------------------------------------------------------------------
// MẮT XÍCH KỸ NĂNG (docs/BAN-SAC-EDUCHAINKIDS.md mục 6): một bài “vững” khi em đạt ngưỡng ở 2 NGÀY KHÁC NHAU
// (mức Cơ bản ≥ 8/10, mức Khá/Giỏi ≥ 7/10) — làm một lần cao điểm chưa đủ, phải nhớ được sang hôm sau.
// ---------------------------------------------------------------------------
const CHAIN_KEY = 'edukid_chain_v1';
/** mã bài -> các ngày (YYYY-MM-DD, giờ máy) em đạt ngưỡng */
export type ChainStore = Record<string, string[]>;
export const CHAIN_DAYS = 2;
export const chainPass = (muc?: 1 | 2 | 3) => (muc && muc > 1 ? 0.7 : 0.8);
export function readChain(): ChainStore {
  try {
    const raw = localStorage.getItem(CHAIN_KEY);
    const v = raw ? (JSON.parse(raw) as ChainStore) : {};
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
/** 0 = chưa đạt lần nào, 1 = đạt 1 ngày, 2 = mắt xích đã vững */
export const chainLevel = (s: ChainStore, lessonId: string): 0 | 1 | 2 => Math.min(CHAIN_DAYS, s[lessonId]?.length ?? 0) as 0 | 1 | 2;
function recordChain(lessonId: string, score: number, total: number, muc?: 1 | 2 | 3) {
  if (total <= 0 || score / total < chainPass(muc)) return;
  const d = new Date();
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const s = readChain();
  const days = s[lessonId] ?? [];
  if (days.includes(day)) return;
  s[lessonId] = [...days, day].slice(-5);
  try { localStorage.setItem(CHAIN_KEY, JSON.stringify(s)); } catch { /* bỏ qua */ }
}

export function saveAttempt(summary: AttemptSummary) {
  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(summary));
  } catch {
    // Trình duyệt chặn bộ nhớ: trang kết quả sẽ báo không tìm thấy bài làm.
  }
  recordChain(summary.lessonId, summary.score, summary.total, summary.muc);
  try {
    const best = readBest();
    const prev = best[summary.lessonId];
    if (!prev || summary.score / summary.total > prev.score / prev.total) {
      best[summary.lessonId] = { score: summary.score, total: summary.total };
      localStorage.setItem(BEST_KEY, JSON.stringify(best));
    }
  } catch {
    // Bỏ qua
  }
}

export function readLastAttempt(): AttemptSummary | null {
  try {
    const raw = sessionStorage.getItem(LAST_KEY);
    const parsed = raw ? (JSON.parse(raw) as AttemptSummary) : null;
    // Kết quả lưu từ phiên bản cũ (chưa có thời gian, điểm) thì bỏ qua
    return parsed && typeof parsed.durationMs === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Mức độ em chọn: một mức chung cho tất cả các bài + mức riêng của từng bài (nếu có)
// ---------------------------------------------------------------------------
const MUC_KEY = 'edukid_muc_v1';
export type MucStore = { all: 1 | 2 | 3; lessons: Record<string, 1 | 2 | 3> };

export function readMucStore(): MucStore {
  try {
    const raw = localStorage.getItem(MUC_KEY);
    const p = raw ? (JSON.parse(raw) as MucStore) : null;
    if (p && [1, 2, 3].includes(p.all) && typeof p.lessons === 'object') return p;
  } catch {
    // bỏ qua
  }
  return { all: 1, lessons: {} };
}

function writeMucStore(s: MucStore) {
  try {
    localStorage.setItem(MUC_KEY, JSON.stringify(s));
  } catch {
    // Trình duyệt chặn bộ nhớ: mức độ chỉ giữ trong lần mở trang này
  }
}

/** Đặt mức chung cho tất cả các bài (xoá các mức riêng để mọi bài theo mức chung) */
export function saveMucAll(m: 1 | 2 | 3): MucStore {
  const s = { all: m, lessons: {} };
  writeMucStore(s);
  return s;
}

/** Đặt mức riêng cho một bài; m = null để bài theo mức chung */
export function saveMucLesson(lessonId: string, m: 1 | 2 | 3 | null): MucStore {
  const s = readMucStore();
  if (m === null || m === s.all) delete s.lessons[lessonId];
  else s.lessons[lessonId] = m;
  writeMucStore(s);
  return s;
}

export const mucFor = (s: MucStore, lessonId: string) => s.lessons[lessonId] ?? s.all;
