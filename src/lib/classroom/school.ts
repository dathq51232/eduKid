// Kết quả học tập TRÊN TRƯỜNG do giáo viên nhập (migration 0014, 0016).
// Danh mục môn theo chương trình tiểu học hiện hành:
//   Lớp 1–2: Tiếng Việt, Toán, Đạo đức, Tự nhiên và Xã hội, Giáo dục thể chất, Âm nhạc, Mĩ thuật, Hoạt động trải nghiệm
//            (+ Tiếng Anh tự chọn).
//   Lớp 3:   thêm Tiếng Anh, Tin học và Công nghệ.
//   Lớp 4–5: Khoa học, Lịch sử và Địa lí thay cho Tự nhiên và Xã hội.
// Mọi môn có MỨC ĐẠT (T = Hoàn thành tốt, H = Hoàn thành, C = Chưa hoàn thành).
// Môn có bài kiểm tra định kỳ (điểm thang 10): cuối học kỳ I và cuối năm — Tiếng Việt, Toán, Tiếng Anh (lớp 3–5),
//   Tin học và Công nghệ (lớp 3–5), Khoa học và Lịch sử và Địa lí (lớp 4–5); giữa học kỳ (lớp 4–5) — Tiếng Việt, Toán.
// Phẩm chất, năng lực: mức Tốt / Đạt / Cần cố gắng (T / D / C).
// Nhà trường hướng dẫn khác thì giáo viên để trống ô không dùng.

export type SchoolSubject =
  | 'tieng-viet' | 'toan' | 'tieng-anh' | 'dao-duc' | 'tnxh' | 'khoa-hoc' | 'lich-su-dia-li'
  | 'tin-hoc-cong-nghe' | 'gdtc' | 'am-nhac' | 'mi-thuat' | 'hdtn';
/** @deprecated giữ tên cũ cho mã đã viết */
export type ScoreSubject = SchoolSubject;
export type ExamCode = 'gk1' | 'ck1' | 'gk2' | 'ck2';

export const SCHOOL_SUBJECT_NAME: Record<SchoolSubject, string> = {
  'tieng-viet': 'Tiếng Việt', toan: 'Toán', 'tieng-anh': 'Tiếng Anh', 'dao-duc': 'Đạo đức', tnxh: 'Tự nhiên và Xã hội',
  'khoa-hoc': 'Khoa học', 'lich-su-dia-li': 'Lịch sử và Địa lí', 'tin-hoc-cong-nghe': 'Tin học và Công nghệ',
  gdtc: 'Giáo dục thể chất', 'am-nhac': 'Âm nhạc', 'mi-thuat': 'Mĩ thuật', hdtn: 'Hoạt động trải nghiệm',
};
export const SCORE_SUBJECT_NAME = SCHOOL_SUBJECT_NAME;
export const SUBJECT_SHORT: Record<SchoolSubject, string> = {
  'tieng-viet': 'TV', toan: 'Toán', 'tieng-anh': 'TA', 'dao-duc': 'ĐĐ', tnxh: 'TN&XH', 'khoa-hoc': 'KH',
  'lich-su-dia-li': 'LS&ĐL', 'tin-hoc-cong-nghe': 'Tin–CN', gdtc: 'GDTC', 'am-nhac': 'Âm nhạc', 'mi-thuat': 'Mĩ thuật', hdtn: 'HĐTN',
};
export const EXAM_NAME: Record<ExamCode, string> = { gk1: 'Giữa học kỳ I', ck1: 'Cuối học kỳ I', gk2: 'Giữa học kỳ II', ck2: 'Cuối năm học' };
export const EXAMS: ExamCode[] = ['gk1', 'ck1', 'gk2', 'ck2'];

/** Các môn của khối lớp (thứ tự như sổ theo dõi) */
export function schoolSubjects(grade: number): SchoolSubject[] {
  const list: SchoolSubject[] = ['tieng-viet', 'toan'];
  list.push('tieng-anh'); // lớp 1–2: tự chọn
  list.push('dao-duc');
  if (grade <= 3) list.push('tnxh');
  else list.push('khoa-hoc', 'lich-su-dia-li');
  if (grade >= 3) list.push('tin-hoc-cong-nghe');
  list.push('gdtc', 'am-nhac', 'mi-thuat', 'hdtn');
  return list;
}

/** Môn có điểm bài kiểm tra định kỳ ở kỳ này */
export function isScored(grade: number, exam: ExamCode, s: SchoolSubject): boolean {
  if (exam === 'gk1' || exam === 'gk2') return grade >= 4 && (s === 'tieng-viet' || s === 'toan');
  if (s === 'tieng-viet' || s === 'toan') return true;
  if (s === 'tieng-anh' || s === 'tin-hoc-cong-nghe') return grade >= 3;
  if (s === 'khoa-hoc' || s === 'lich-su-dia-li') return grade >= 4;
  return false;
}

/** Danh sách kỳ kiểm tra có ĐIỂM (để trang đề kiểm tra dùng) */
export function examsFor(grade: number): ExamCode[] {
  return grade >= 4 ? ['gk1', 'ck1', 'gk2', 'ck2'] : ['ck1', 'ck2'];
}
/** Môn có điểm ở kỳ (giữ cho mã cũ) */
export function subjectsFor(grade: number, exam: ExamCode): SchoolSubject[] {
  return schoolSubjects(grade).filter((s) => isScored(grade, exam, s));
}

export const examKey = (exam: ExamCode, year: number) => `${exam}-${year}`;

/** Ô điểm hợp lệ: trống, hoặc 0–10 (cho phép dấu phẩy, tối đa 2 chữ số thập phân) */
export function parseScore(raw: string): number | null | 'invalid' {
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(t)) return 'invalid';
  const n = Number(t);
  return n >= 0 && n <= 10 ? n : 'invalid';
}
export const showScore = (n: number | null | undefined) => (n == null ? '' : String(Number(n)).replace('.', ','));

export type SubjectLevel = 'T' | 'H' | 'C';
export const SUBJECT_LEVEL_NAME: Record<SubjectLevel, string> = { T: 'Hoàn thành tốt', H: 'Hoàn thành', C: 'Chưa hoàn thành' };
/** Mức gợi ý theo điểm kiểm tra */
export const levelFromScore = (n: number): SubjectLevel => (n >= 9 ? 'T' : n >= 5 ? 'H' : 'C');

// ------------------------------------------------------------------ Phẩm chất, năng lực
export type QualityLevel = 'T' | 'D' | 'C';
export const QUALITY_LEVEL_NAME: Record<QualityLevel, string> = { T: 'Tốt', D: 'Đạt', C: 'Cần cố gắng' };
export type QualityItem =
  | 'pc-yeu-nuoc' | 'pc-nhan-ai' | 'pc-cham-chi' | 'pc-trung-thuc' | 'pc-trach-nhiem'
  | 'nl-tu-chu' | 'nl-giao-tiep' | 'nl-gqvd'
  | 'nl-ngon-ngu' | 'nl-tinh-toan' | 'nl-khoa-hoc' | 'nl-cong-nghe' | 'nl-tin-hoc' | 'nl-tham-mi' | 'nl-the-chat';
export type QualityGroup = 'pham-chat' | 'nl-chung' | 'nl-dac-thu';
export const QUALITIES: { item: QualityItem; name: string; short: string; group: QualityGroup; minGrade?: number }[] = [
  { item: 'pc-yeu-nuoc', name: 'Yêu nước', short: 'Yêu nước', group: 'pham-chat' },
  { item: 'pc-nhan-ai', name: 'Nhân ái', short: 'Nhân ái', group: 'pham-chat' },
  { item: 'pc-cham-chi', name: 'Chăm chỉ', short: 'Chăm chỉ', group: 'pham-chat' },
  { item: 'pc-trung-thuc', name: 'Trung thực', short: 'Trung thực', group: 'pham-chat' },
  { item: 'pc-trach-nhiem', name: 'Trách nhiệm', short: 'Trách nhiệm', group: 'pham-chat' },
  { item: 'nl-tu-chu', name: 'Tự chủ và tự học', short: 'Tự chủ', group: 'nl-chung' },
  { item: 'nl-giao-tiep', name: 'Giao tiếp và hợp tác', short: 'Giao tiếp', group: 'nl-chung' },
  { item: 'nl-gqvd', name: 'Giải quyết vấn đề và sáng tạo', short: 'GQVĐ', group: 'nl-chung' },
  { item: 'nl-ngon-ngu', name: 'Ngôn ngữ', short: 'Ngôn ngữ', group: 'nl-dac-thu' },
  { item: 'nl-tinh-toan', name: 'Tính toán', short: 'Tính toán', group: 'nl-dac-thu' },
  { item: 'nl-khoa-hoc', name: 'Khoa học', short: 'Khoa học', group: 'nl-dac-thu' },
  { item: 'nl-cong-nghe', name: 'Công nghệ', short: 'Công nghệ', group: 'nl-dac-thu', minGrade: 3 },
  { item: 'nl-tin-hoc', name: 'Tin học', short: 'Tin học', group: 'nl-dac-thu', minGrade: 3 },
  { item: 'nl-tham-mi', name: 'Thẩm mĩ', short: 'Thẩm mĩ', group: 'nl-dac-thu' },
  { item: 'nl-the-chat', name: 'Thể chất', short: 'Thể chất', group: 'nl-dac-thu' },
];
export const QUALITY_GROUP_NAME: Record<QualityGroup, string> = { 'pham-chat': 'Phẩm chất', 'nl-chung': 'Năng lực chung', 'nl-dac-thu': 'Năng lực đặc thù' };
export const qualitiesFor = (grade: number) => QUALITIES.filter((q) => !q.minGrade || grade >= q.minGrade);

// ------------------------------------------------------------------ Khen thưởng
export type AwardScope = 'lop' | 'truong' | 'huyen' | 'tinh' | 'quoc-gia' | 'khac';
export const AWARD_SCOPE_NAME: Record<AwardScope, string> = { lop: 'Cấp lớp', truong: 'Cấp trường', huyen: 'Cấp huyện', tinh: 'Cấp tỉnh', 'quoc-gia': 'Cấp quốc gia', khac: 'Khác' };
export type Award = { id: string; student_id: string; title: string; scope: AwardScope; awarded_on: string; note: string };
export const awardLabel = (a: Pick<Award, 'title' | 'scope'>) => (a.scope === 'lop' || a.scope === 'khac' ? a.title : `${a.title} (${AWARD_SCOPE_NAME[a.scope].toLowerCase()})`);

export const MAX_STUDENTS = 40;
