// Phiếu báo tiến bộ gửi phụ huynh: tóm tắt bài luyện trên app của từng em trong một khoảng thời gian
// (tuần / tháng / tự chọn), so với khoảng liền trước; nêu điểm mạnh, dạng còn sai, gợi ý luyện ở nhà.
// Lời văn viết theo mẫu câu (không dùng AI). Giáo viên đọc, sửa, duyệt rồi sao chép / in / tải về.
// File này chạy được ở trình duyệt: không phụ thuộc ngân hàng câu hỏi (máy chủ đã đổi mã câu → tên dạng bài).

import type { SubjectCode } from '../types';

/** Một lần làm bài đã rút gọn: s = chỉ số học sinh, t = thời điểm (ms), a = [tên dạng bài, đúng?] */
export type CompactResult = { s: number; l: string; c: string; sub: SubjectCode | null; t: number; a: [string, boolean][] };

export type FormStat = { form: string; lesson: string; lessonCode: string; subject: SubjectCode | null; n: number; ok: number };
export type StudentReport = {
  lessons: number; attempts: number; n: number; ok: number; rate: number | null;
  prevRate: number | null; activeDays: number;
  bySubject: { subject: SubjectCode; n: number; ok: number }[];
  strong: FormStat[]; weak: FormStat[];
  /** bài nên luyện lại (bài có dạng còn sai nhiều nhất) */
  practice: { title: string; code: string; subject: SubjectCode | null } | null;
};

export const SUBJECT_VI: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };

const VN = 7 * 3600_000;
const vnDay = (ms: number) => { const d = new Date(ms + VN); return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`; };

export type Range = { key: string; label: string; from: number; to: number };

/** Các khoảng thời gian chọn nhanh, theo giờ Việt Nam */
export function reportRanges(now = Date.now()): Range[] {
  const vn = new Date(now + VN);
  const y = vn.getUTCFullYear(), m = vn.getUTCMonth(), d = vn.getUTCDate();
  const at = (yy: number, mm: number, dd: number) => Date.UTC(yy, mm, dd) - VN;
  const dow = (vn.getUTCDay() + 6) % 7;
  const mon = at(y, m, d - dow);
  const fmt = (ms: number) => { const x = new Date(ms + VN); return `${x.getUTCDate()}/${x.getUTCMonth() + 1}`; };
  const W = 7 * 86400_000;
  const r = (key: string, name: string, from: number, to: number): Range => ({ key, label: `${name} (${fmt(from)}–${fmt(to - 1)})`, from, to });
  return [
    r('tuan-nay', 'Tuần này', mon, mon + W),
    r('tuan-truoc', 'Tuần trước', mon - W, mon),
    r('thang-nay', `Tháng ${m + 1}`, at(y, m, 1), at(y, m + 1, 1)),
    r('thang-truoc', `Tháng ${((m + 11) % 12) + 1}`, at(y, m - 1, 1), at(y, m, 1)),
    r('4-tuan', '4 tuần gần đây', mon - 3 * W, mon + W),
  ];
}

function aggregate(rows: CompactResult[], from: number, to: number) {
  const lessons = new Set<string>(), days = new Set<string>();
  let attempts = 0, n = 0, ok = 0;
  const subj = new Map<SubjectCode, { n: number; ok: number }>();
  const forms = new Map<string, FormStat>();
  for (const r of rows) {
    if (r.t < from || r.t >= to) continue;
    attempts++;
    lessons.add(r.c);
    days.add(vnDay(r.t));
    for (const [form, good] of r.a) {
      n++; if (good) ok++;
      if (r.sub) { const v = subj.get(r.sub) ?? { n: 0, ok: 0 }; v.n++; if (good) v.ok++; subj.set(r.sub, v); }
      const k = `${r.c}|${form}`;
      const f = forms.get(k) ?? { form, lesson: r.l, lessonCode: r.c, subject: r.sub, n: 0, ok: 0 };
      f.n++; if (good) f.ok++;
      forms.set(k, f);
    }
  }
  return { lessons, days, attempts, n, ok, subj, forms: [...forms.values()] };
}

export function buildReport(rows: CompactResult[], range: Range): StudentReport {
  const cur = aggregate(rows, range.from, range.to);
  const len = range.to - range.from;
  const prev = aggregate(rows, range.from - len, range.from);
  const strong = cur.forms.filter((f) => f.n >= 4 && f.ok / f.n >= 0.85).sort((a, b) => b.ok / b.n - a.ok / a.n || b.n - a.n).slice(0, 2);
  const weak = cur.forms.filter((f) => f.n >= 3 && f.ok / f.n < 0.65).sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n).slice(0, 2);
  const w = weak[0];
  return {
    lessons: cur.lessons.size, attempts: cur.attempts, n: cur.n, ok: cur.ok, rate: cur.n ? cur.ok / cur.n : null,
    prevRate: prev.n >= 5 ? prev.ok / prev.n : null, activeDays: cur.days.size,
    bySubject: [...cur.subj.entries()].map(([subject, v]) => ({ subject, ...v })),
    strong, weak,
    practice: w ? { title: w.lesson, code: w.lessonCode, subject: w.subject } : null,
  };
}

const TIP: Record<SubjectCode, string> = {
  toan: 'cùng em đếm, so sánh, tính nhẩm với đồ vật trong nhà',
  'tieng-viet': 'nghe em đọc to một đoạn ngắn mỗi tối và hỏi em về nội dung',
  'tieng-anh': 'nghe em nhắc lại từ vựng, hát cùng em một bài hát tiếng Anh ngắn',
};

/** Lời nhắn gửi phụ huynh (giáo viên sửa lại trước khi gửi) */
export function reportText(name: string, className: string, rangeLabel: string, r: StudentReport, teacher: string): string {
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const lines: string[] = [`Kính gửi phụ huynh em ${name} (lớp ${className}),`];
  const period = rangeLabel.replace(/\s*\(.*\)$/, '').toLowerCase();
  if (!r.attempts) {
    lines.push(`Trong ${period}, em chưa luyện bài nào trên EduChain Kids. Gia đình nhắc em dành 10–15 phút mỗi ngày để ôn lại bài trên lớp nhé.`);
  } else {
    let trend = '';
    if (r.rate != null && r.prevRate != null) {
      const d = r.rate - r.prevRate;
      trend = d >= 0.05 ? `, tiến bộ hơn kỳ trước (${pct(r.prevRate)})` : d <= -0.08 ? `, thấp hơn kỳ trước (${pct(r.prevRate)}) một chút` : ', giữ vững như kỳ trước';
    }
    lines.push(`Trong ${period}, em đã luyện ${r.lessons} bài (${r.attempts} lượt, ${r.activeDays} ngày) trên EduChain Kids, làm đúng ${r.ok}/${r.n} câu (${pct(r.rate ?? 0)})${trend}.`);
    if (r.strong.length) lines.push(`Điểm mạnh: em làm tốt dạng ${r.strong.map((f) => `“${f.form}” (${f.lesson})`).join(' và ')}.`);
    else if ((r.rate ?? 0) >= 0.8) lines.push('Điểm mạnh: em làm bài cẩn thận, đúng phần lớn các câu.');
    if (r.weak.length) lines.push(`Cần cố gắng: dạng ${r.weak.map((f) => `“${f.form}” (${f.lesson})`).join(' và ')} em còn sai nhiều.`);
    const tips: string[] = [];
    if (r.practice) tips.push(`nhắc em luyện lại bài “${r.practice.title}” trên app khoảng 10–15 phút mỗi ngày`);
    const sub = r.practice?.subject ?? [...r.bySubject].sort((a, b) => a.ok / a.n - b.ok / b.n)[0]?.subject;
    if (sub) tips.push(TIP[sub]);
    if (!tips.length) tips.push('duy trì thói quen luyện 10–15 phút mỗi ngày');
    lines.push(`Gợi ý ở nhà: gia đình ${tips.join('; ')}.`);
  }
  lines.push(`Cảm ơn gia đình đã đồng hành cùng em.${teacher.trim() ? ` GVCN ${teacher.trim()}.` : ''}`);
  return lines.join('\n');
}
