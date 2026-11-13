// Ô tổng quan đầu trang lớp (giáo viên, kiểu bento): gom số liệu từ kết quả làm bài, bài đã giao, hộp thư phụ huynh.
// Hàm thuần (không gọi mạng) để dễ kiểm thử; trang lớp truyền dữ liệu đã đọc vào.
import type { LessonResult } from './progress';
import type { AssignmentRow } from './assignments';
import type { Inbox } from './messages';
import { senderLabel } from './messages';

const DAY = 86400_000;
const VN = 7 * 3600_000;
const vnDay = (t: number) => new Date(t + VN).toISOString().slice(0, 10);

export type BentoKid = { id: string; name: string; note: string; tone: 'done' | 'todo'; lift: boolean };
export type BentoTask = { id: string; title: string; subject: string | null; exam: boolean; done: number; assigned: number; due: string; overdue: boolean; open: boolean };
export type BentoSubject = { code: string; label: string; rate: number | null; n: number };
export type BentoData = {
  kids: BentoKid[];
  activeToday: number;
  total: number;
  tasks: BentoTask[];
  rate: number | null;
  delta: number | null;
  subjects: BentoSubject[];
  gap: { lesson: string; title: string; count: number } | null;
  tags: { title: string; rate: number }[];
  weekAttempts: number;
  inbox: { unread: number; leave: number; latest: string | null } | null;
};

const SUBJECTS: { code: string; label: string }[] = [
  { code: 'toan', label: 'Toán' },
  { code: 'tieng-viet', label: 'T.Việt' },
  { code: 'tieng-anh', label: 'T.Anh' },
];

/** "Bài 27. Phép cộng…" → "Phép cộng…" (bỏ số thứ tự để nhãn gọn) */
export const shortTitle = (t: string | null, code: string) => (t ?? code).replace(/^(?:Bài|Tuần|Unit|Review)\s+\d+[.:]\s*/i, '').trim() || code;

const fmtDue = (iso: string) => {
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const g = (k: string) => p.find((x) => x.type === k)?.value ?? '';
  return `${g('weekday')} ${g('day')}/${g('month')}, ${g('hour')}:${g('minute')}`;
};

const ratio = (rs: LessonResult[]) => {
  const t = rs.reduce((a, r) => a + r.total, 0);
  return t ? rs.reduce((a, r) => a + r.score, 0) / t : null;
};

export function buildBento(input: {
  students: { id: string; name: string }[];
  results: LessonResult[];
  assignments: AssignmentRow[] | null;
  inbox: Inbox | null;
  now?: number;
}): BentoData {
  const now = input.now ?? Date.now();
  const today = vnDay(now);
  const ts = (r: LessonResult) => Date.parse(r.created_at);
  const week = input.results.filter((r) => now - ts(r) < 7 * DAY);
  const prevWeek = input.results.filter((r) => now - ts(r) >= 7 * DAY && now - ts(r) < 14 * DAY);

  // Dải học sinh: em làm bài gần nhất hôm nay lên đầu, em chưa học hôm nay theo sau
  const todayBy = new Map<string, LessonResult[]>();
  for (const r of input.results) if (vnDay(ts(r)) === today) todayBy.set(r.student_id, [...(todayBy.get(r.student_id) ?? []), r]);
  const lastAt = (id: string) => Math.max(0, ...(todayBy.get(id) ?? []).map(ts));
  const kids = [...input.students]
    .sort((a, b) => lastAt(b.id) - lastAt(a.id) || a.name.localeCompare(b.name, 'vi'))
    .slice(0, 12)
    .map((s, i): BentoKid => {
      const rs = todayBy.get(s.id) ?? [];
      const latest = rs.reduce<LessonResult | null>((m, r) => (!m || ts(r) > ts(m) ? r : m), null);
      if (!latest) return { id: s.id, name: s.name, note: 'Chưa học hôm nay', tone: 'todo', lift: false };
      return {
        id: s.id, name: s.name, tone: 'done', lift: i === 0,
        note: i === 0 ? `Vừa nộp ${latest.score}/${latest.total}` : `Hôm nay ${rs.length} bài`,
      };
    });

  // Bài đã giao: đang mở (gần hạn trước), rồi bài vừa đóng
  const tasks = (input.assignments ?? [])
    .slice()
    .sort((a, b) => (a.status === b.status ? (a.status === 'open' ? a.due_at.localeCompare(b.due_at) : b.due_at.localeCompare(a.due_at)) : a.status === 'open' ? -1 : 1))
    .slice(0, 4)
    .map((a): BentoTask => ({
      id: a.id, title: a.title, subject: a.subject, exam: a.kind === 'exam', done: a.done, assigned: a.assigned,
      due: fmtDue(a.due_at), overdue: Date.parse(a.due_at) < now, open: a.status === 'open',
    }));

  const subjects = SUBJECTS.map((s) => {
    const rs = week.filter((r) => r.subject_code === s.code);
    return { ...s, rate: ratio(rs), n: rs.length };
  });

  // Lỗ hổng: bài trong 14 ngày có nhiều em nhất làm đúng dưới 70% (lấy lần tốt nhất của mỗi em)
  const recent = input.results.filter((r) => now - ts(r) < 14 * DAY);
  const best = new Map<string, Map<string, number>>();
  const titles = new Map<string, string>();
  for (const r of recent) {
    if (!r.total) continue;
    titles.set(r.lesson_code, shortTitle(r.lesson_title, r.lesson_code));
    const m = best.get(r.lesson_code) ?? new Map<string, number>();
    m.set(r.student_id, Math.max(m.get(r.student_id) ?? 0, r.score / r.total));
    best.set(r.lesson_code, m);
  }
  let gap: BentoData['gap'] = null;
  for (const [lesson, m] of best) {
    const count = [...m.values()].filter((v) => v < 0.7).length;
    if (count >= 2 && (!gap || count > gap.count)) gap = { lesson, title: titles.get(lesson) ?? lesson, count };
  }

  // Bài lớp hay sai trong tuần: tỉ lệ đúng trung bình thấp nhất (ít nhất 2 lượt làm)
  const byLesson = new Map<string, LessonResult[]>();
  for (const r of week) byLesson.set(r.lesson_code, [...(byLesson.get(r.lesson_code) ?? []), r]);
  const tags = [...byLesson.entries()]
    .filter(([, rs]) => rs.length >= 2)
    .map(([code, rs]) => ({ title: shortTitle(rs[0].lesson_title, code), rate: ratio(rs) ?? 1 }))
    .filter((t) => t.rate < 0.85)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 8);

  const rate = ratio(week);
  const prev = ratio(prevWeek);
  const inbox = input.inbox
    ? { unread: input.inbox.unread, leave: input.inbox.pending_leave, latest: input.inbox.items[0] ? `${senderLabel(input.inbox.items[0])} (bé ${input.inbox.items[0].student_name})` : null }
    : null;

  return {
    kids, activeToday: todayBy.size, total: input.students.length, tasks, rate,
    delta: rate !== null && prev !== null ? rate - prev : null,
    subjects, gap, tags, weekAttempts: week.length, inbox,
  };
}
