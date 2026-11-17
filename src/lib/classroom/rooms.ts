// Phòng thi lớp (migration 0062) — dùng chung cho trang cô, trang em và máy chủ chấm.
// Thể thức: docs/BAN-SAC-EDUCHAINKIDS.md mục 8.1. Không kéo ngân hàng câu hỏi vào (sinh đề ở rooms-build.ts).
import type { AnswerKey, AnswerValue, SubjectCode } from '../types';
import type { ExamItem } from './assignments';

export type RoomRow = {
  id: string; code: string; title: string; subject: SubjectCode; n_questions: number; minutes: number;
  opens_at: string; closes_at: string; status: 'open' | 'closed'; created_at: string;
  /** ma trận đã dùng (để sinh đề mới khi cho làm lại) */
  matrix: Record<string, unknown>;
  assigned: number; started: number; done: number; flagged: number;
};
export type RoomAnswer = { i: number; a?: AnswerValue; ok: boolean; muc?: number; lesson?: string };
export type RoomDetailRow = {
  student_id: string; display_name: string; has_paper: boolean; started_at: string | null; done: boolean;
  score: number | null; correct: number | null; total: number | null; stars: number | null; max_stars: number | null;
  duration_ms: number | null; leaves: number; flags: string[]; answers: RoomAnswer[]; finished_at: string | null; retakes: number;
};
export type MyRoom = {
  id: string; code: string; title: string; subject: SubjectCode; n_questions: number; minutes: number;
  opens_at: string; closes_at: string; status: 'open' | 'closed'; done: boolean; score: number | null; stars: number | null;
};
/** Câu trong đề của em (máy chủ chỉ gửi answer/explanation khi phòng đã đóng) */
export type RoomItem = ExamItem & { answer?: AnswerKey };

/** Cấu trúc mặc định theo khối: lớp 1–2: 10 câu / 15 phút; lớp 3–5: 20 câu / 25 phút */
export const roomDefaults = (grade: number) => (grade <= 2 ? { n: 10, minutes: 15 } : { n: 20, minutes: 25 });
/** Tỉ lệ mức 1 / 2 (mức 3 = phần còn lại): 40% L1–L2, 30% L3, 30% L4–L5 */
export const ROOM_RATIO: [number, number] = [0.4, 0.3];

/** Sao của một câu = mức câu (Mức 1 = 1 sao, Mức 2 = 2 sao, Mức 3 = 3 sao) */
export const starsOf = (muc: number | undefined) => Math.min(3, Math.max(1, Math.round(muc ?? 1)));
/** Thang 10, làm tròn 0,5 — `got` / `max`: điểm đạt / tổng điểm (hoặc số câu đúng / số câu) */
export const score10 = (got: number, max: number) => (max > 0 ? Math.round((got / max) * 20) / 2 : 0);

export type Owl = { key: 'gold' | 'silver' | 'bronze' | 'try'; name: string; icon: string };
/** Huy hiệu Cú theo mốc điểm (không xếp hạng) */
export function owlOf(score: number): Owl {
  if (score >= 9) return { key: 'gold', name: 'Cú Vàng', icon: '🥇' };
  if (score >= 8) return { key: 'silver', name: 'Cú Bạc', icon: '🥈' };
  if (score >= 7) return { key: 'bronze', name: 'Cú Đồng', icon: '🥉' };
  return { key: 'try', name: 'Cố lên', icon: '🌱' };
}

export const FLAG_LABEL: Record<string, string> = {
  fast: 'Điểm tuyệt đối nhưng làm rất nhanh',
  tab: 'Rời trang làm bài nhiều lần',
};

/** Kỹ năng (theo bài) của một em hoặc cả lớp: đúng / tổng theo tên bài */
export function lessonStats(rows: RoomAnswer[][]): { lesson: string; ok: number; n: number }[] {
  const m = new Map<string, { ok: number; n: number }>();
  for (const answers of rows) for (const a of answers) {
    const k = a.lesson || 'Khác';
    const s = m.get(k) ?? { ok: 0, n: 0 };
    s.n++; if (a.ok) s.ok++;
    m.set(k, s);
  }
  return [...m.entries()].map(([lesson, s]) => ({ lesson, ...s })).sort((a, b) => a.ok / a.n - b.ok / b.n);
}

/** Lời Milo nhận xét theo kỹ năng (giọng Milo: khen cụ thể, gợi chỗ cần luyện, không so sánh) */
export function miloRoomComment(answers: RoomAnswer[]): { strong: string[]; weak: string[] } {
  const st = lessonStats([answers]);
  return {
    strong: st.filter((s) => s.n > 0 && s.ok === s.n).map((s) => s.lesson).slice(0, 3),
    weak: st.filter((s) => s.ok / s.n < 0.6).map((s) => s.lesson).slice(0, 3),
  };
}

export function roomError(msg: string): string {
  if (msg.includes('not_allowed')) return 'Bạn không có quyền với phòng thi này.';
  if (msg.includes('invalid_window')) return 'Giờ mở – đóng chưa hợp lệ (giờ đóng phải sau giờ mở và chưa qua).';
  if (msg.includes('too_many_rooms')) return 'Lớp đang có quá nhiều phòng thi mở, hãy đóng bớt.';
  if (msg.includes('student_not_in_class')) return 'Có em không còn trong lớp, tải lại trang rồi thử lại.';
  if (msg.includes('class_inactive')) return 'Lớp đã lưu trữ.';
  if (msg.includes('room_not_found')) return 'Không có phòng thi với mã này. Em kiểm tra lại mã cô đọc nhé.';
  if (msg.includes('not_in_class')) return 'Phòng thi này không phải của lớp em.';
  if (msg.includes('no_paper')) return 'Em chưa có đề trong phòng này — nhờ cô bấm “Tạo đề cho em”.';
  if (msg.includes('room_closed')) return 'Phòng thi chưa mở hoặc đã đóng.';
  if (msg.includes('wrong_code')) return 'Mã phòng chưa đúng. Em nhập đúng mã cô đọc nhé.';
  if (msg.includes('does not exist') || msg.includes('Could not find')) return 'Máy chủ chưa cập nhật (cần chạy migration 0062).';
  return 'Có lỗi, thử lại sau.';
}

/** Đáp án dạng chữ (xem lại bài sau khi phòng đóng) */
export function keyLabel(k: AnswerKey | undefined): string {
  if (!k) return '';
  if ('correct' in k) return Array.isArray(k.correct) ? k.correct.join(' · ') : k.correct;
  if ('accepted' in k) return k.accepted[0] ?? '';
  if ('order' in k) return k.order.join(' → ');
  if ('pairs' in k) return Object.entries(k.pairs).map(([l, r]) => `${l} – ${r}`).join('; ');
  if ('answers' in k) return (k.answers[0] ?? []).join(' · ');
  if ('truth' in k) return k.truth.map((t, i) => `${i + 1}. ${t}`).join('  ');
  return '';
}

const two = (n: number) => String(n).padStart(2, '0');
/** "T3 21/10 14:00" */
export function whenLabel(iso: string) {
  const d = new Date(iso);
  return `${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]} ${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`;
}
/** Giá trị cho ô datetime-local theo giờ máy */
export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;
}
