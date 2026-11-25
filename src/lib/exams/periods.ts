// Số tiết đã dạy của từng chủ đề — lấy từ Phân phối chương trình (PPCT) tổ trưởng đã nạp ở Lịch báo giảng,
// để ma trận đề chia số câu / điểm theo thời lượng (chủ đề dạy nhiều tiết thì nhiều câu hơn).
// Ghép bài của app với dòng PPCT:
//   - "Unit N" (Tiếng Anh)           → dòng PPCT có "Unit N"
//   - "Tuần N · Bài a–b" (Tiếng Việt) → mọi dòng PPCT môn đó trong tuần N (đọc, viết, nói và nghe…)
//   - "Bài N" (Toán…)                 → dòng PPCT có "Bài N"
// Chủ đề không ghép được bài nào → không điền (thầy cô tự gõ).
import type { SubjectCode } from '../types';
import { subjectKey, type PpctItem } from '../plans/lbg';
import { fold } from '../plans/schedule';
import type { BookLesson } from './matrix';

const SUBJECT_LABEL: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };

/** Cách ghép một bài của app với PPCT */
type Match = { week: number } | { unit: number } | { bai: number[] };
export function matchOf(ref: string | undefined, title: string): Match | null {
  const r = fold(`${ref ?? ''} ${ref ? '' : title}`);
  const week = /tuan\s*(\d+)/.exec(r);
  if (week) return { week: Number(week[1]) };
  const unit = /unit\s*(\d+)/.exec(r);
  if (unit) return { unit: Number(unit[1]) };
  const bai = /bai\s*(\d+)(?:\s*[-–]\s*(\d+))?/.exec(r);
  if (bai) {
    const a = Number(bai[1]);
    const b = bai[2] ? Number(bai[2]) : a;
    return { bai: Array.from({ length: Math.max(0, b - a) + 1 }, (_, i) => a + i) };
  }
  return null;
}

/** Số "Bài N" / "Unit N" đứng đầu tên bài trong PPCT ("Bài 5: Bảng nhân 3 (tiết 2)" → 5) */
const leadNum = (t: string, word: 'bai' | 'unit') => {
  const m = new RegExp(`(?:^|[^a-z])${word}\\s*(\\d+)\\b`).exec(fold(t));
  return m ? Number(m[1]) : null;
};

/**
 * Số tiết theo chủ đề (unitCode → số tiết) cho các bài đã chọn, từ PPCT của khối.
 * Chủ đề chỉ có số khi MỌI bài của chủ đề ghép được với PPCT (tránh số thiếu làm lệch tỉ lệ).
 */
export function periodsFromPpct(lessons: BookLesson[], subject: SubjectCode, ppct: PpctItem[]): Record<string, number> {
  const key = subjectKey(SUBJECT_LABEL[subject]);
  const items = ppct.filter((x) => subjectKey(x.s) === key);
  if (!items.length) return {};
  const byUnit = new Map<string, { n: number; ok: boolean }>();
  for (const l of lessons) {
    const m = matchOf(l.ref, l.title);
    let n = 0;
    if (m && 'week' in m) n = items.filter((x) => x.w === m.week).length;
    else if (m && 'unit' in m) n = items.filter((x) => leadNum(x.t, 'unit') === m.unit).length;
    else if (m) n = items.filter((x) => { const b = leadNum(x.t, 'bai'); return b !== null && m.bai.includes(b); }).length;
    const u = byUnit.get(l.unit.code) ?? { n: 0, ok: true };
    byUnit.set(l.unit.code, { n: u.n + n, ok: u.ok && n > 0 });
  }
  const out: Record<string, number> = {};
  for (const [code, u] of byUnit) if (u.ok && u.n > 0) out[code] = u.n;
  return out;
}
