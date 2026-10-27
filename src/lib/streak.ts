// Chuỗi ngày học và tuần học của học sinh, tính theo giờ Việt Nam từ thời điểm làm bài / chơi game.
const VN_OFFSET = 7 * 3600_000;
/** Ngày (YYYY-MM-DD) theo giờ Việt Nam */
export const vnDay = (d: string | number | Date) => new Date(new Date(d).getTime() + VN_OFFSET).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);

export type WeekDot = { day: string; label: string; done: boolean; today: boolean; future: boolean };

export function learningStreak(times: string[], now = Date.now()) {
  const days = new Set(times.map(vnDay));
  const today = vnDay(now);
  // chuỗi tính đến hôm nay; hôm nay chưa học thì vẫn giữ chuỗi đến hôm qua
  let cur = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cur)) { streak += 1; cur = addDays(cur, -1); }
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = thứ Hai
  const monday = addDays(today, -dow);
  const week: WeekDot[] = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((label, i) => {
    const day = addDays(monday, i);
    return { day, label, done: days.has(day), today: day === today, future: day > today };
  });
  return { streak, studiedToday: days.has(today), week, weekDays: week.filter((w) => w.done).length, today };
}

