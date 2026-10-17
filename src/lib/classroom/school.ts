// Kết quả học tập TRÊN TRƯỜNG do giáo viên nhập (migration 0014): điểm kiểm tra định kỳ, khen thưởng.
// Môn có bài kiểm tra định kỳ theo cách tổ chức đánh giá học sinh tiểu học hiện hành:
//   Tiếng Việt, Toán (mọi lớp); Ngoại ngữ 1 (Tiếng Anh), Tin học và Công nghệ (lớp 3–5); Khoa học, Lịch sử và Địa lí (lớp 4–5).
//   Giữa học kỳ chỉ áp dụng Tiếng Việt, Toán ở lớp 4–5. Nhà trường điều chỉnh thì giáo viên để trống ô không dùng.

export type ScoreSubject = 'tieng-viet' | 'toan' | 'tieng-anh' | 'khoa-hoc' | 'lich-su-dia-li' | 'tin-hoc-cong-nghe';
export type ExamCode = 'gk1' | 'ck1' | 'gk2' | 'ck2';

export const SCORE_SUBJECT_NAME: Record<ScoreSubject, string> = {
  'tieng-viet': 'Tiếng Việt', toan: 'Toán', 'tieng-anh': 'Tiếng Anh', 'khoa-hoc': 'Khoa học',
  'lich-su-dia-li': 'Lịch sử và Địa lí', 'tin-hoc-cong-nghe': 'Tin học và Công nghệ',
};
export const EXAM_NAME: Record<ExamCode, string> = { gk1: 'Giữa học kỳ I', ck1: 'Cuối học kỳ I', gk2: 'Giữa học kỳ II', ck2: 'Cuối năm học' };

export function examsFor(grade: number): ExamCode[] {
  return grade >= 4 ? ['gk1', 'ck1', 'gk2', 'ck2'] : ['ck1', 'ck2'];
}

export function subjectsFor(grade: number, exam: ExamCode): ScoreSubject[] {
  if (exam === 'gk1' || exam === 'gk2') return ['tieng-viet', 'toan'];
  const list: ScoreSubject[] = ['tieng-viet', 'toan'];
  if (grade >= 3) list.push('tieng-anh', 'tin-hoc-cong-nghe');
  if (grade >= 4) list.push('khoa-hoc', 'lich-su-dia-li');
  return list;
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

export type AwardScope = 'lop' | 'truong' | 'huyen' | 'tinh' | 'quoc-gia' | 'khac';
export const AWARD_SCOPE_NAME: Record<AwardScope, string> = { lop: 'Cấp lớp', truong: 'Cấp trường', huyen: 'Cấp huyện', tinh: 'Cấp tỉnh', 'quoc-gia': 'Cấp quốc gia', khac: 'Khác' };
export type Award = { id: string; student_id: string; title: string; scope: AwardScope; awarded_on: string; note: string };
export const awardLabel = (a: Pick<Award, 'title' | 'scope'>) => (a.scope === 'lop' || a.scope === 'khac' ? a.title : `${a.title} (${AWARD_SCOPE_NAME[a.scope].toLowerCase()})`);
