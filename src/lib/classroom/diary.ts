// Sổ lớp hằng ngày: phần tính toán thuần — nhãn ghi chú, tin nhắn phụ huynh soạn sẵn, tổng hợp tháng, cảnh báo.
import { XS, range, type XSheet } from '@/lib/xlsx';

export type Status = 'present' | 'excused' | 'unexcused';
export type Entry = { status: Status; tags: string[]; note: string; copied?: boolean };
export type Student = { id: string; name: string };
export type Pronoun = 'co' | 'thay';

export const PRAISE_TAGS = ['★ Phát biểu tốt', '★ Tiến bộ', '★ Giúp bạn', '★ Viết đẹp', '★ Ngoan, lễ phép'];
export const REMIND_TAGS = ['Quên đồ dùng', 'Chưa làm bài', 'Nói chuyện riêng', 'Đi học muộn'];
export const isPraise = (t: string) => t.startsWith('★');

export const STATUS_LABEL: Record<Status, string> = { present: 'Có mặt', excused: 'Vắng có phép', unexcused: 'Vắng không phép' };

export const emptyEntry = (): Entry => ({ status: 'present', tags: [], note: '' });
/** Em có khác mặc định không (vắng, có nhãn, có ghi chú) — chỉ những em này được lưu */
export const isMarked = (e?: Entry) => !!e && (e.status !== 'present' || e.tags.length > 0 || e.note.trim() !== '');

/** Tên gọi trong tin nhắn: 2 chữ cuối ("Minh An") */
export const callName = (name: string) => name.trim().split(/\s+/).slice(-2).join(' ');

export function ddmm(day: string) {
  const [, m, d] = day.split('-');
  return `${Number(d)}/${Number(m)}`;
}
const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export function dayLabel(day: string) {
  const d = new Date(`${day}T00:00:00`);
  const [y, m, dd] = day.split('-');
  return `${WEEKDAY[d.getDay()]}, ${dd}/${m}/${y}`;
}
export function todayIso(now = new Date()) {
  const d = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}
export function shiftDay(day: string, n: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + n);
  return todayIso(d);
}

const PRAISE_TEXT: Record<string, string> = {
  '★ Phát biểu tốt': 'hăng hái phát biểu',
  '★ Tiến bộ': 'có tiến bộ',
  '★ Giúp bạn': 'biết giúp đỡ bạn',
  '★ Viết đẹp': 'viết chữ đẹp',
  '★ Ngoan, lễ phép': 'ngoan, lễ phép',
};
const REMIND_TEXT: Record<string, string> = {
  'Quên đồ dùng': 'quên mang đồ dùng học tập',
  'Chưa làm bài': 'chưa làm bài tập về nhà',
  'Nói chuyện riêng': 'còn nói chuyện riêng trong giờ học',
  'Đi học muộn': 'đi học muộn',
};
const REMIND_ASK: Record<string, string> = {
  'Quên đồ dùng': 'nhắc con chuẩn bị đủ sách vở, đồ dùng tối nay',
  'Chưa làm bài': 'nhắc con hoàn thành bài tập tối nay',
  'Nói chuyện riêng': 'nhắc nhở con tập trung nghe giảng',
  'Đi học muộn': 'giúp con đến lớp đúng giờ',
};
const joinVi = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} và ${xs[xs.length - 1]}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Tin nhắn soạn sẵn cho phụ huynh một em; null nếu em không có gì để báo. Không chứa điểm số. */
export function messageFor(st: Student, e: Entry | undefined, day: string, pronoun: Pronoun = 'co'): string | null {
  if (!isMarked(e)) return null;
  const me = pronoun === 'thay' ? 'thầy' : 'cô';
  const name = callName(st.name);
  const head = `Kính gửi phụ huynh em ${name},`;
  const parts: string[] = [];
  if (e!.status === 'unexcused') parts.push(`hôm nay (${ddmm(day)}) con nghỉ học chưa có xin phép. Nhờ phụ huynh báo ${me} lý do và cho con đi học lại đầy đủ ạ.`);
  if (e!.status === 'excused') parts.push(`${me} đã nhận tin con nghỉ học có phép hôm nay (${ddmm(day)}). Nhờ phụ huynh cho con xem lại bài hôm nay để theo kịp các bạn ạ.`);
  const praise = e!.tags.filter(isPraise).map((t) => PRAISE_TEXT[t] ?? t.replace(/^★\s*/, '').toLowerCase());
  const remind = e!.tags.filter((t) => !isPraise(t));
  const note = e!.note.trim().replace(/[.!\s]+$/, '');
  if (e!.status === 'present') {
    if (praise.length) parts.push(`hôm nay con ${joinVi(praise)}.${note ? ` ${cap(note)}.` : ''} ${cap(me)} khen con, nhờ gia đình động viên con thêm ạ.`);
    if (remind.length) {
      const what = joinVi(remind.map((t) => REMIND_TEXT[t] ?? t.toLowerCase()));
      const ask = joinVi(remind.map((t) => REMIND_ASK[t]).filter(Boolean) as string[]);
      parts.push(`${praise.length ? 'Tuy nhiên' : 'hôm nay'} con ${what}. Nhờ phụ huynh ${ask || 'nhắc nhở con'} ạ.${note && !praise.length ? ` (${cap(note)}.)` : ''}`);
    }
    if (!praise.length && !remind.length && note) parts.push(`${note.charAt(0).toLowerCase()}${note.slice(1)}. ${cap(me)} báo để gia đình nắm ạ.`);
  } else if (note) {
    parts.push(`Ghi chú: ${note}.`);
  }
  // câu đầu viết thường ngay sau dấu phẩy của lời chào
  return `${head} ${parts.join(' ').replace(/^([A-ZĐ])/, (c) => c.toLowerCase())}`.replace(/\s+/g, ' ').trim();
}

export type MessageKind = 'absent' | 'praise' | 'remind';
export function kindsOf(e?: Entry): MessageKind[] {
  if (!e) return [];
  const k: MessageKind[] = [];
  if (e.status !== 'present') k.push('absent');
  if (e.tags.some(isPraise) || (e.status === 'present' && !e.tags.length && e.note.trim())) k.push('praise');
  if (e.tags.some((t) => !isPraise(t))) k.push('remind');
  return k;
}

/* ------------------------------------------------------------ tổng hợp tháng */
export type RangeData = { days: { day: string; announcement?: string | null }[]; entries: { student_id: string; day: string; status: Status; tags: string[] }[] };
export type MonthRow = { student: Student; present: number; excused: number; unexcused: number; praise: number; remind: number; byDay: Record<string, Status>; absentDays: string[]; remindTags: Record<string, number> };

export function summarize(students: Student[], data: RangeData): { days: string[]; rows: MonthRow[] } {
  const days = data.days.map((d) => d.day).sort();
  const rows = students.map((st) => {
    const mine = data.entries.filter((e) => e.student_id === st.id && days.includes(e.day));
    const byDay: Record<string, Status> = {};
    const remindTags: Record<string, number> = {};
    let praise = 0, remind = 0;
    for (const e of mine) {
      byDay[e.day] = e.status;
      for (const t of e.tags) {
        if (isPraise(t)) praise++;
        else { remind++; remindTags[t] = (remindTags[t] ?? 0) + 1; }
      }
    }
    const excused = Object.values(byDay).filter((s) => s === 'excused').length;
    const unexcused = Object.values(byDay).filter((s) => s === 'unexcused').length;
    const absentDays = days.filter((d) => byDay[d] === 'unexcused');
    return { student: st, present: days.length - excused - unexcused, excused, unexcused, praise, remind, byDay, absentDays, remindTags };
  });
  return { days, rows };
}

export type Alert = { tone: 'warn' | 'good'; studentId: string; text: string; strong: string };
export function alertsOf(rows: MonthRow[]): Alert[] {
  const out: Alert[] = [];
  for (const r of rows) {
    if (r.unexcused >= 2) out.push({ tone: 'warn', studentId: r.student.id, strong: r.student.name, text: `vắng ${r.unexcused} buổi không phép (${r.absentDays.map(ddmm).join(', ')}).` });
    for (const [t, n] of Object.entries(r.remindTags)) if (n >= 3) out.push({ tone: 'warn', studentId: r.student.id, strong: r.student.name, text: `${n} lần "${t.toLowerCase()}".` });
    if (r.praise >= 5) out.push({ tone: 'good', studentId: r.student.id, strong: r.student.name, text: `được khen ${r.praise} lần — gợi ý viết Thư khen.` });
  }
  return out.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'warn' ? -1 : 1));
}

/** Em vắng không phép liên tiếp (2 buổi học gần nhất trở lên) — để nhắc ở "Việc hôm nay" */
export function absentStreaks(rows: MonthRow[], days: string[], min = 2): { name: string; n: number }[] {
  const out: { name: string; n: number }[] = [];
  for (const r of rows) {
    let n = 0;
    for (let i = days.length - 1; i >= 0 && r.byDay[days[i]] && r.byDay[days[i]] !== 'present'; i--) n++;
    if (n >= min) out.push({ name: r.student.name, n });
  }
  return out;
}

export function monthSheet(className: string, monthLabel: string, days: string[], rows: MonthRow[]): XSheet {
  const head = ['STT', 'Họ và tên', ...days.map(ddmm), 'Có mặt', 'Có phép', 'Không phép', 'Khen', 'Cần nhắc'];
  const mark = (s?: Status) => (s === 'excused' ? 'P' : s === 'unexcused' ? 'K' : '');
  return {
    name: 'Chuyên cần',
    landscape: true,
    cols: [5, 26, ...days.map(() => 5), 8, 8, 10, 7, 9],
    freeze: { rows: 4, cols: 2 },
    rows: [
      [{ v: `SỔ THEO DÕI CHUYÊN CẦN — LỚP ${className} — ${monthLabel.toUpperCase()}`, s: XS.title }],
      [{ v: `${days.length} buổi học. P: vắng có phép · K: vắng không phép · ô trống: có mặt`, s: XS.note }],
      [],
      head.map((v) => ({ v, s: XS.header })),
      ...rows.map((r, i) => [
        { v: i + 1, s: XS.center }, { v: r.student.name, s: XS.text },
        ...days.map((d) => ({ v: mark(r.byDay[d]), s: r.byDay[d] === 'unexcused' ? XS.red : XS.center })),
        { v: r.present, s: XS.center }, { v: r.excused || '', s: XS.center }, { v: r.unexcused || '', s: XS.center },
        { v: r.praise || '', s: XS.center }, { v: r.remind || '', s: XS.center },
      ]),
    ],
    merges: [range(0, 0, 0, head.length - 1), range(1, 0, 1, head.length - 1)],
  };
}
