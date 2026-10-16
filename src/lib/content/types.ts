// Kiểu dữ liệu và hàm dựng câu hỏi cho bộ bài tập soạn sẵn.
// Câu hỏi do EduChain Kids tự soạn, bám TRÌNH TỰ bài trong sách (tên bài, phạm vi kiến thức),
// không chép nội dung, hình ảnh hay bài tập của sách giáo khoa.

import type { Level } from '../levels';
import type { AnswerKey, QuestionType, SubjectCode } from '../types';

export type { Level } from '../levels'; // L1 Làm quen … L5 Mở rộng (src/lib/levels.ts)

export type ContentQuestion = {
  type: QuestionType;
  prompt: string;
  options: string[]; // chọn 1/chọn nhiều: lựa chọn; sắp xếp: các mục (sẽ đảo); ghép cặp: vế phải
  left?: string[]; // ghép cặp: vế trái
  key: AnswerKey;
  explanation: string; // nhận xét ngắn
  solution?: string; // lời giải chi tiết
  level: Level;
  timeLimit?: number; // giây; bỏ trống = tính tự động theo cấp độ và dạng câu (defaultTimeLimit)
  outcome: string; // mã YCCĐ (src/lib/curriculum/grade1.ts)
  form: string; // mã dạng bài
  skill?: string;
};

// Phạm vi kiến thức của bài — dùng để kiểm tra tự động "không vượt trước".
export type Scope =
  // pt2: phép tính với số có hai chữ số đã học (Học kì 2): none → chưa học; add1 → cộng với số có một chữ số;
  //      add → cộng hai số có hai chữ số; sub1 → thêm trừ số có một chữ số; all → cộng, trừ (không nhớ) trong phạm vi 100
  | { kind: 'math'; maxNumber: number; ops: readonly ('+' | '-')[]; pt2?: 'none' | 'add1' | 'add' | 'sub1' | 'all' }
  | { kind: 'viet'; lessonNo: number } // đã học đến hết bài số lessonNo của sách Tiếng Việt 1
  | { kind: 'english'; unit: number; extra?: string[]; book?: 'gs2' | 'gs3' | 'gs4' | 'gs5' } // đã học đến hết unit này (+ từ bổ sung trường đã dạy); book: sách lớp mấy (mặc định lớp 1)
  // Lớp 2 trở lên. ops: phép tính đã học; carry: đã học cộng/trừ CÓ NHỚ; tables: bảng nhân/chia đã học (vd. [2, 5])
  // carryMax: chỉ cho phép có nhớ khi tổng / số bị trừ không vượt số này (vd. 20: mới học cộng, trừ qua 10 trong phạm vi 20)
  // lớp 3: bigMul = nhân/chia số nhiều chữ số với số có một chữ số; remainder = phép chia có dư
  | { kind: 'math2'; maxNumber: number; ops: readonly ('+' | '-' | '×' | ':')[]; carry: boolean; carryMax?: number; tables?: readonly number[]; bigMul?: boolean; remainder?: boolean; mulMax?: number; pow10?: boolean }
  // Tiếng Việt lớp 2 trở lên: không còn kiểm âm vần (đã học đủ), chỉ ghi lớp để tham chiếu
  | { kind: 'viet2'; grade: number }
  // Lớp 5: số tự nhiên, phân số, số thập phân với đủ bốn phép tính; decimal = đã học số thập phân (từ Bài 10)
  | { kind: 'math5'; maxNumber: number; ops: readonly ('+' | '-' | '×' | ':')[]; decimal: boolean };

export type ContentLesson = {
  id: string;
  subject: SubjectCode;
  grade: 1 | 2 | 3 | 4 | 5;
  semester: 1 | 2;
  book: string; // bộ sách
  ref: string; // vị trí trong sách: "Bài 4", "Tuần 3 (Bài 11–15)", "Unit 2"
  unit: { code: string; title: string }; // chủ đề/unit của sách (để nhóm bài trên trang học sinh)
  topicCode: string; // chủ đề trong danh mục chương trình
  title: string;
  description: string;
  scope: Scope;
  kind?: 'book' | 'review'; // bài theo sách (mặc định) hoặc đề ôn tập theo cấp độ
  questions: ContentQuestion[];
};

export type Meta = { o: string; f: string; l: Level; e: string; s?: string; k?: string; t?: number };
const base = (m: Meta) => ({ explanation: m.e, solution: m.s, level: m.l, timeLimit: m.t, outcome: m.o, form: m.f, skill: m.k });

/** Chọn 1 đáp án */
export const sc = (prompt: string, options: string[], correct: string, m: Meta): ContentQuestion => ({
  type: 'single_choice', prompt, options, key: { correct }, ...base(m),
});
/** Đúng / Sai */
export const tf = (prompt: string, correct: 'Đúng' | 'Sai', m: Meta): ContentQuestion => ({
  type: 'true_false', prompt, options: [], key: { correct }, ...base(m),
});
/** Điền đáp án (nhiều cách viết được chấp nhận) */
export const fb = (prompt: string, accepted: string[], m: Meta): ContentQuestion => ({
  type: 'fill_blank', prompt, options: [], key: { accepted }, ...base(m),
});
/** Chọn nhiều đáp án */
export const mc = (prompt: string, options: string[], correct: string[], m: Meta): ContentQuestion => ({
  type: 'multiple_choice', prompt, options, key: { correct }, ...base(m),
});
/** Sắp xếp: truyền thứ tự ĐÚNG, hiển thị sẽ được đảo */
export const ord = (prompt: string, order: string[], m: Meta): ContentQuestion => ({
  type: 'ordering', prompt, options: [...order], key: { order }, ...base(m),
});
/** Ghép cặp: [trái, phải][] */
export const mt = (prompt: string, pairs: [string, string][], m: Meta): ContentQuestion => ({
  type: 'matching', prompt, left: pairs.map((p) => p[0]), options: pairs.map((p) => p[1]),
  key: { pairs: Object.fromEntries(pairs) }, ...base(m),
});

/** Lặp hình để đếm: rep('🍎', 3) -> '🍎🍎🍎' */
export const rep = (icon: string, n: number) => Array.from({ length: n }, () => icon).join('');
