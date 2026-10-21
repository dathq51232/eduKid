// Phiếu chính tả bám chương trình Tiếng Việt 1 (Kết nối tri thức): lớp học đến tuần nào thì phiếu chỉ dùng
// âm, vần, dấu thanh đã học đến hết tuần đó (cùng bảng âm/vần theo bài với ngân hàng câu hỏi: content/viet-inventory.ts).

import { checkSyllable, ONSETS, RIMES } from '../content/viet-inventory';
import type { Pair } from './bank';

/** học kì 2: đã học đủ âm, vần → không giới hạn */
export const NO_LIMIT = 999;
export const HK2_WEEK = 19;

export type Week = { week: number; from: number; to: number; learned: string };
/** khớp từng tuần của src/lib/content/tv1-hk1.ts (scripts/check-spelling.ts kiểm tra) */
export const WEEKS: Week[] = [
  { week: 1, from: 1, to: 5, learned: 'a, b, c, e, ê' },
  { week: 2, from: 6, to: 10, learned: 'o, ô, ơ, d, đ' },
  { week: 3, from: 11, to: 15, learned: 'i, k, h, l, u, ư, ch, kh' },
  { week: 4, from: 16, to: 20, learned: 'm, n, g, gi, gh, nh, ng, ngh' },
  { week: 5, from: 21, to: 25, learned: 'r, s, t, tr, th, ia, ua, ưa' },
  { week: 6, from: 26, to: 30, learned: 'ph, qu, v, x, y' },
  { week: 7, from: 31, to: 35, learned: 'an, ăn, ân, on, ôn, ơn, en, ên, in, un, am, ăm, âm' },
  { week: 8, from: 36, to: 40, learned: 'om, ôm, ơm, em, êm, im, um, ai, ay, ây, oi, ôi, ơi' },
  { week: 9, from: 41, to: 45, learned: 'ui, ưi, ao, eo, au, âu, êu, iu, ưu' },
  { week: 10, from: 46, to: 50, learned: 'ac, ăc, âc, oc, ôc, uc, ưc, at, ăt, ât, ot, ôt, ơt' },
  { week: 11, from: 51, to: 55, learned: 'et, êt, it, ut, ưt, ap, ăp, âp, op, ôp, ơp' },
  { week: 12, from: 56, to: 60, learned: 'ep, êp, ip, up, anh, ênh, inh, ach, êch, ich, ang, ăng, âng' },
  { week: 13, from: 61, to: 65, learned: 'ong, ông, ung, ưng, iêc, iên, iêp, iêng, iêm, yên, iêt, iêu, yêu' },
  { week: 14, from: 66, to: 70, learned: 'uôi, uôm, uôc, uôt, uôn, uông, ươi, ươu' },
  { week: 15, from: 71, to: 75, learned: 'ươc, ươt, ươm, ươp, ươn, ương, oa, oe' },
  { week: 16, from: 76, to: 80, learned: 'oan, oăn, oat, oăt, oai, uê, uy, uân, uât, uyên, uyêt' },
  { week: 17, from: 81, to: 83, learned: 'Ôn tập cuối học kì 1' },
];

/** bài cuối đã học khi lớp học xong tuần `week` (tuần 18 trở đi: học kì 2, không giới hạn) */
export const lessonForWeek = (week: number) => (week >= 18 ? NO_LIMIT : WEEKS[Math.max(0, week - 1)]?.to ?? NO_LIMIT);
export const weekLabel = (week: number) => {
  if (week >= 18) return 'Học kì 2 (đã học đủ âm, vần)';
  const w = WEEKS[week - 1];
  return w ? `Tuần ${w.week} · Bài ${w.from}–${w.to}: ${w.learned}` : `Tuần ${week}`;
};

/** câu/cụm từ chỉ gồm các tiếng đã học đến bài `lesson` */
export function fitsLesson(text: string, lesson: number): boolean {
  if (lesson >= NO_LIMIT) return true;
  return text.replace(/[[\].,!?;:"“”]/g, '').split(/[\s-]+/).filter(Boolean).every((w) => !checkSyllable(w.toLowerCase(), lesson));
}

/** bài đầu tiên học đủ các âm (hoặc vần) của một cặp */
export function pairLesson(p: Pick<Pair, 'options' | 'kind'>): number {
  return Math.max(...p.options.map((o) => (p.kind === 'van' ? RIMES[o] : ONSETS[o]) ?? NO_LIMIT));
}
/** tuần học xong cặp này */
export function pairWeek(p: Pick<Pair, 'options' | 'kind'>): number {
  const l = pairLesson(p);
  return WEEKS.find((w) => l <= w.to)?.week ?? HK2_WEEK;
}

/**
 * Tuần học hiện tại theo lịch năm học (bắt đầu thứ Hai đầu tiên từ 5/9; học kì 1 có 18 tuần,
 * nghỉ Tết làm lệch vài tuần nên chỉ dùng làm gợi ý — giáo viên chọn lại được).
 */
export function currentWeek(now = new Date()): number {
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(y, 8, 5);
  start.setDate(start.getDate() + ((8 - start.getDay()) % 7));
  const w = Math.floor((now.getTime() - start.getTime()) / (7 * 86400000)) + 1;
  return Math.min(Math.max(w, 1), HK2_WEEK);
}
