// Kiểu dữ liệu dùng chung cho các trang học.
// Tên loại câu hỏi khớp với cột questions.question_type trong Supabase (migration 0003).

import type { Level } from './levels';
import type { Figure } from './figures';

export type SubjectCode = 'toan' | 'tieng-viet' | 'tieng-anh';

export const QUESTION_TYPES = ['single_choice', 'true_false', 'fill_blank', 'multiple_choice', 'matching', 'ordering'] as const;
/** Các dạng câu lưu được trong database / soạn ở trang quản trị. */
export type DbQuestionType = (typeof QUESTION_TYPES)[number];

export type QuestionType =
  | 'single_choice' // chọn 1 đáp án
  | 'true_false' // đúng / sai
  | 'fill_blank' // điền đáp án
  | 'multiple_choice' // chọn nhiều đáp án
  | 'matching' // ghép cặp
  | 'ordering' // sắp xếp
  // Hai dạng dưới chỉ dùng cho bài luyện tập sinh ngẫu nhiên (src/lib/practice), chấm trên trình duyệt:
  | 'fill_blanks' // điền nhiều ô trong câu (ví dụ "Có [ ] hình tròn")
  | 'true_false_table'; // bảng Đúng/Sai nhiều nhận định

export type Subject = {
  code: SubjectCode;
  name: string;
  short: string;
  mark: string;
  tone: 'math' | 'viet' | 'english';
};

export type Lesson = {
  id: string;
  subject: SubjectCode;
  grade: number;
  title: string;
  description?: string;
  topicCode?: string; // mã chủ đề trong danh mục (src/lib/curriculum)
  unit?: { code: string; title: string }; // chủ đề/unit của bộ sách (nhóm bài trên trang chọn bài)
  book?: string; // bộ sách
  kind?: 'book' | 'review'; // bài theo sách / đề ôn tập theo cấp độ
  sortOrder: number;
};

// Câu hỏi phía học sinh: KHÔNG chứa đáp án. Đáp án nằm ở question_keys trên server.
export type Question = {
  id: string;
  lessonId: string;
  type: QuestionType;
  prompt: string;
  options: string[]; // single/multiple_choice: lựa chọn; ordering: các mục; matching: các vế phải
  leftItems?: string[]; // matching: các vế trái
  skillCode?: string;
  level: Level; // L1–L5 (questions.difficulty)
  timeLimit: number; // giây (questions.time_limit_sec)
  figure?: Figure; // hình minh hoạ vẽ bằng SVG (src/components/Figure.tsx)
  optionFigures?: Record<string, Figure>; // hình cho từng lựa chọn (lựa chọn là tranh)
  blanks?: string[]; // fill_blanks: mỗi dòng một câu, "{}" là ô trống
  statements?: string[]; // true_false_table: các nhận định
};

// Câu trả lời học sinh gửi đi: chuỗi (chọn 1, đúng/sai, điền), mảng (chọn nhiều, sắp xếp)
// hoặc object trái -> phải (ghép cặp).
export type AnswerValue = string | string[] | Record<string, string> | null;

// Đáp án theo định dạng bảng question_keys (xem migration 0003).
export type AnswerKey =
  | { correct: string }
  | { correct: string[] }
  | { accepted: string[] }
  | { order: string[] }
  | { pairs: Record<string, string> }
  | { answers: string[][] } // fill_blanks: các bộ đáp án được chấp nhận (mỗi bộ đủ các ô, theo thứ tự)
  | { truth: string[] }; // true_false_table: 'Đúng'/'Sai' cho từng nhận định

export type GradeResult = {
  correct: boolean;
  explanation?: string;
  solution?: string; // lời giải chi tiết, chỉ nhận sau khi đã trả lời
};

export type AnswerStatus = 'correct' | 'wrong' | 'timeout' | 'unanswered';

export type AnswerRecord = {
  questionId: string;
  prompt: string;
  level: Level;
  timeLimit: number; // giây
  spentMs: number; // thời gian em đã dùng cho câu này
  status: AnswerStatus;
  userAnswer: AnswerValue;
  isCorrect: boolean;
  points: number; // điểm của câu (gồm thưởng làm nhanh)
  speedBonus: number;
  explanation?: string;
  solution?: string;
};

export type AttemptSummary = {
  lessonId: string;
  lessonTitle: string;
  subject: SubjectCode;
  grade: number;
  score: number; // số câu đúng
  total: number;
  durationMs: number; // tổng thời gian làm bài (cộng thời gian từng câu)
  points: number; // tổng điểm bài này = điểm các câu + thưởng hoàn thành
  questionPoints: number;
  lessonBonus: number;
  newPoints: number; // điểm được cộng thêm vào điểm tích luỹ (chỉ tính phần vượt kỷ lục cũ của bài)
  totalPoints: number; // điểm tích luỹ sau bài này
  previousTotal: number;
  finishedAt: string;
  seed?: number; // bộ câu đã làm (không có = bộ câu gốc)
  muc?: 1 | 2 | 3; // mức độ: 1 Cơ bản, 2 Khá, 3 Giỏi
  answers: AnswerRecord[];
};
