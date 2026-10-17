// Gợi ý NHẬN XÉT học sinh từ dữ liệu luyện tập trong EduChain Kids (không dùng AI, không gửi dữ liệu ra ngoài).
// Mức đạt theo cách ghi của nhà trường tiểu học: T = Hoàn thành tốt, H = Hoàn thành, C = Chưa hoàn thành.
// Đây chỉ là GỢI Ý dựa trên bài luyện trong app — giáo viên đọc, sửa rồi mới lưu/xuất.

export type Level = 'T' | 'H' | 'C';
export type CommentSubject = 'chung' | 'toan' | 'tieng-viet' | 'tieng-anh';
export const COMMENT_SUBJECTS: CommentSubject[] = ['toan', 'tieng-viet', 'tieng-anh', 'chung'];
export const SUBJECT_NAME: Record<CommentSubject, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh', chung: 'Nhận xét chung' };
export const LEVEL_NAME: Record<Level, string> = { T: 'Hoàn thành tốt', H: 'Hoàn thành', C: 'Chưa hoàn thành' };

export type PeriodKind = 'week' | 'term' | 'year';

/** Số liệu một em, một môn trong kỳ (hàm class_period_stats, migration 0013) */
export type SubjectStats = {
  student_id: string; display_name: string; subject_code: string;
  lessons: number; attempts: number; avg_percent: number; perfect: number; active_days: number;
  weak_lessons: string[] | null; strong_lessons: string[] | null;
};

export type Suggestion = { level: Level | null; comment: string };

/** Số bài tối thiểu để xếp mức "Hoàn thành tốt" theo độ dài kỳ */
const MIN_LESSONS: Record<PeriodKind, number> = { week: 2, term: 8, year: 15 };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/** Chọn câu theo mã học sinh để các em không bị giống hệt nhau, nhưng tạo lại vẫn ra cùng câu */
const pick = <T,>(arr: T[], seed: string): T => arr[hash(seed) % arr.length];
const quote = (titles: string[] | null | undefined, n = 2) =>
  (titles ?? []).slice(0, n).map((t) => `“${t.replace(/^Bài\s*\d+[.:]\s*/i, '').trim()}”`).join(', ');

export function levelFor(s: SubjectStats | undefined, kind: PeriodKind): Level | null {
  if (!s || s.lessons === 0) return null;
  if (s.avg_percent >= 85 && s.lessons >= MIN_LESSONS[kind]) return 'T';
  if (s.avg_percent >= 50) return 'H';
  return 'C';
}

const SKILL: Record<Exclude<CommentSubject, 'chung'>, { good: string[]; work: string[] }> = {
  toan: {
    good: ['tính toán nhanh, chính xác', 'nắm chắc kiến thức và vận dụng tốt vào bài toán', 'làm toán cẩn thận, ít sai sót'],
    work: ['cần cẩn thận hơn khi tính toán', 'cần luyện thêm các bài toán có lời văn', 'cần đọc kĩ đề trước khi làm bài'],
  },
  'tieng-viet': {
    good: ['đọc hiểu tốt, dùng từ chính xác', 'nắm vững kiến thức từ và câu', 'trả lời câu hỏi đọc hiểu rõ ràng'],
    work: ['cần đọc kĩ bài và câu hỏi hơn', 'cần luyện thêm về từ và câu', 'cần chú ý chính tả và cách dùng từ'],
  },
  'tieng-anh': {
    good: ['nhớ từ vựng tốt, dùng đúng mẫu câu', 'nghe hiểu và nhận biết từ mới nhanh', 'vận dụng mẫu câu linh hoạt'],
    work: ['cần ôn thêm từ vựng của các bài đã học', 'cần luyện thêm các mẫu câu', 'cần luyện đọc và nhớ từ mới hằng ngày'],
  },
};

/** Mức theo điểm kiểm tra định kỳ (thang 10) */
export function levelFromScore(score: number): Level { return score >= 9 ? 'T' : score >= 5 ? 'H' : 'C'; }
const fmtScore = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '').replace('.', ','));

/**
 * Gợi ý một môn. Có điểm kiểm tra định kỳ trên trường (schoolScore) thì mức ưu tiên theo điểm đó;
 * dữ liệu luyện tập trong app bổ sung bài làm tốt / cần luyện thêm / tiến bộ.
 */
export function suggestSubject(subject: Exclude<CommentSubject, 'chung'>, s: SubjectStats | undefined, kind: PeriodKind, prev?: SubjectStats, schoolScore?: number | null, sid = s?.student_id ?? ''): Suggestion {
  const appLevel = levelFor(s, kind);
  const hasScore = typeof schoolScore === 'number';
  const level: Level | null = hasScore ? levelFromScore(schoolScore) : appLevel;
  if (!level) return { level: null, comment: '' };
  const seed = `${sid}:${subject}:${kind}`;
  const sk = SKILL[subject];
  const parts: string[] = [];
  if (level === 'T') parts.push(`Em ${pick(sk.good, seed)}.`);
  else if (level === 'H') parts.push(pick([`Em hoàn thành các yêu cầu của môn học, ${pick(sk.good, seed + 'g')} ở nhiều bài.`, `Em nắm được kiến thức cơ bản của môn học.`], seed));
  else parts.push(pick([`Em ${pick(sk.work, seed)}.`, `Em còn gặp khó khăn ở một số nội dung, ${pick(sk.work, seed + 'w')}.`], seed));

  if (hasScore) parts.push(`Bài kiểm tra định kỳ đạt ${fmtScore(schoolScore)} điểm.`);
  if (s && s.lessons > 0) {
    const strong = quote(s.strong_lessons);
    const weak = quote(s.weak_lessons);
    if (strong && level !== 'C') parts.push(`Làm tốt: ${strong}.`);
    if (weak) parts.push(`Cần luyện thêm: ${weak}.`);
    if (prev && prev.lessons > 0) {
      const d = s.avg_percent - prev.avg_percent;
      if (d >= 10) parts.push(pick(['Có tiến bộ rõ so với kỳ trước.', 'Kết quả tiến bộ hơn kỳ trước.'], seed + 'p'));
      else if (d <= -10) parts.push('Kết quả giảm so với kỳ trước, cần cố gắng hơn.');
    }
  }
  if (level === 'T') parts.push(pick(['Tiếp tục phát huy nhé!', 'Thầy cô khen em!', 'Rất đáng khen!'], seed + 'e'));
  else if (level === 'C') parts.push(pick(['Thầy cô tin em sẽ tiến bộ!', 'Em cố gắng luyện tập thêm nhé!'], seed + 'e'));
  return { level, comment: parts.join(' ') };
}

/** Nhận xét chung: chuyên cần, thói quen tự học (không xếp mức) */
export function suggestGeneral(all: SubjectStats[], kind: PeriodKind, seedId: string, awards: string[] = []): Suggestion {
  const lessons = all.reduce((a, s) => a + s.lessons, 0);
  const award = awards.length ? ` Thành tích: ${awards.slice(0, 3).join('; ')}.` : '';
  if (lessons === 0) return { level: null, comment: (award ? award.trim() + ' ' : '') + 'Chưa có dữ liệu luyện tập trên EduChain Kids trong kỳ này.' };
  const days = Math.max(...all.map((s) => s.active_days));
  const attempts = all.reduce((a, s) => a + s.attempts, 0);
  const retried = attempts > lessons;
  const seed = `${seedId}:chung:${kind}`;
  const steady = kind === 'week' ? days >= 3 : kind === 'term' ? days >= 20 : days >= 40;
  const parts = [
    steady
      ? pick(['Em chăm chỉ, tự giác luyện tập đều đặn.', 'Em có ý thức tự học tốt, luyện tập thường xuyên.'], seed)
      : pick(['Em đã tham gia luyện tập.', 'Em có tham gia luyện tập trên lớp học trực tuyến.'], seed),
    `Đã làm ${lessons} bài trong ${days} ngày.`,
  ];
  if (retried) parts.push(pick(['Em biết làm lại bài để sửa lỗi sai.', 'Em kiên trì làm lại những bài chưa tốt.'], seed + 'r'));
  if (!steady) parts.push('Em nên luyện tập đều đặn hơn mỗi tuần.');
  return { level: null, comment: parts.join(' ') + award };
}

// ------------------------------------------------------------------ Kỳ nhận xét
export type Period = { key: string; label: string; kind: PeriodKind; from: Date; to: Date; prevFrom?: Date; prevTo?: Date };

const VN_OFFSET = 7 * 3600_000;
/** 0h ngày y-m-d giờ Việt Nam */
const vnDate = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d) - VN_OFFSET);

/** Năm học chứa ngày `now` (năm học bắt đầu 1/9) */
export function schoolYearOf(now = new Date()): number {
  const vn = new Date(now.getTime() + VN_OFFSET);
  return vn.getUTCMonth() + 1 >= 8 ? vn.getUTCFullYear() : vn.getUTCFullYear() - 1;
}

export function periodsFor(now = new Date()): Period[] {
  const vn = new Date(now.getTime() + VN_OFFSET);
  const dow = (vn.getUTCDay() + 6) % 7; // 0 = thứ Hai
  const monday = vnDate(vn.getUTCFullYear(), vn.getUTCMonth() + 1, vn.getUTCDate() - dow);
  const week = 7 * 86400_000;
  const prevMonday = new Date(monday.getTime() - week);
  const y = schoolYearOf(now);
  const hk1From = vnDate(y, 9, 1), hk1To = vnDate(y + 1, 1, 16);
  const hk2From = hk1To, hk2To = vnDate(y + 1, 6, 1);
  const fmt = (d: Date) => { const x = new Date(d.getTime() + VN_OFFSET); return `${x.getUTCDate()}/${x.getUTCMonth() + 1}`; };
  const wk = (d: Date) => { const x = new Date(d.getTime() + VN_OFFSET); return `${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, '0')}${String(x.getUTCDate()).padStart(2, '0')}`; };
  return [
    { key: `tuan-${wk(monday)}`, label: `Tuần này (${fmt(monday)}–${fmt(new Date(monday.getTime() + week - 1))})`, kind: 'week', from: monday, to: new Date(monday.getTime() + week), prevFrom: prevMonday, prevTo: monday },
    { key: `tuan-${wk(prevMonday)}`, label: `Tuần trước (${fmt(prevMonday)}–${fmt(new Date(monday.getTime() - 1))})`, kind: 'week', from: prevMonday, to: monday, prevFrom: new Date(prevMonday.getTime() - week), prevTo: prevMonday },
    { key: `hk1-${y}`, label: `Học kỳ I (${y}–${y + 1})`, kind: 'term', from: hk1From, to: hk1To },
    { key: `hk2-${y}`, label: `Học kỳ II (${y}–${y + 1})`, kind: 'term', from: hk2From, to: hk2To, prevFrom: hk1From, prevTo: hk1To },
    { key: `cn-${y}`, label: `Cả năm (${y}–${y + 1})`, kind: 'year', from: hk1From, to: hk2To },
  ];
}
