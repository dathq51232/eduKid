// TÓM TẮT TIẾN BỘ cho ba mẹ (thẻ học phí ở Góc Phụ huynh): N ngày qua con học gì, vững bài nào, bài nào cần luyện thêm.
// Tính từ danh sách hoạt động đã gộp sẵn (buildActivities). Không so sánh với bạn khác (docs/BAN-SAC-EDUCHAINKIDS.md).
import type { Activity } from './activity';

export type Recap = {
  days: number;
  /** số hoạt động có chấm (luyện bài, bài cô giao, phòng thi) */
  lessons: number;
  /** mọi hoạt động kể cả trò chơi, cờ */
  total: number;
  activeDays: number;
  /** độ đúng trung bình của các bài có chấm */
  avg: number | null;
  /** bài con đã vững (lần tốt nhất ≥ 80%) */
  strong: string[];
  /** bài cần luyện thêm (chưa lần nào ≥ 60%) */
  weak: string[];
};

const LEARN = new Set(['luyen', 'giao', 'thi']);
const vnDay = (iso: string) => new Date(Date.parse(iso) + 7 * 3600_000).toISOString().slice(0, 10);
/** "Bài 10. Phép cộng trong phạm vi 10" → "Phép cộng trong phạm vi 10" */
const short = (t: string) => t.replace(/^\s*Bài\s+\d+[.:]\s*/i, '').trim();

export function progressRecap(acts: Activity[], days = 14, now = Date.now()): Recap {
  const from = now - days * 86_400_000;
  const win = acts.filter((a) => Date.parse(a.at) >= from);
  const learn = win.filter((a) => LEARN.has(a.kind) && a.pct !== null);
  const best = new Map<string, number>();
  for (const a of learn) {
    const k = short(a.title);
    best.set(k, Math.max(best.get(k) ?? 0, a.pct ?? 0));
  }
  const ranked = [...best.entries()];
  return {
    days,
    lessons: learn.length,
    total: win.length,
    activeDays: new Set(win.map((a) => vnDay(a.at))).size,
    avg: learn.length ? Math.round(learn.reduce((t, a) => t + (a.pct ?? 0), 0) / learn.length) : null,
    strong: ranked.filter(([, p]) => p >= 80).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([t]) => t),
    weak: ranked.filter(([, p]) => p < 60).sort((x, y) => x[1] - y[1]).slice(0, 2).map(([t]) => t),
  };
}
