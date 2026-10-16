import type { Level } from '@/lib/levels';
import type { DbQuestionType } from '@/lib/types';

export type LessonStatus = 'draft' | 'review' | 'published' | 'archived';

export const STATUS_LABEL: Record<LessonStatus, string> = {
  draft: 'Nháp',
  review: 'Chờ duyệt',
  published: 'Đã xuất bản',
  archived: 'Lưu trữ',
};

export const TYPE_LABEL: Record<DbQuestionType, string> = {
  single_choice: 'Chọn 1 đáp án',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền đáp án',
  multiple_choice: 'Chọn nhiều đáp án',
  matching: 'Ghép cặp',
  ordering: 'Sắp xếp',
};

export const BOOK_SERIES = ['Kết nối tri thức', 'Chân trời sáng tạo', 'Cánh Diều', 'Global Success', 'Ngân hàng câu hỏi EduChain Kids'];

export type AdminLesson = {
  id: string;
  title: string;
  status: LessonStatus;
  book_series: string | null;
  semester: number | null;
  sort_order: number;
  created_by: string;
  updated_at: string;
  published_at: string | null;
  subjects: { id?: string; code: string; name: string; grade: number } | null;
  topic_id?: string | null;
  curriculum_topics?: { code: string; title: string } | null;
  questions?: { count: number }[];
};

export type CatalogOutcome = { id: string; code: string; description: string; stage: number; is_core: boolean; status: string; topic_id: string };
export type CatalogTopic = { id: string; code: string; title: string; description: string; is_core: boolean; status: string; sort_order: number; learning_outcomes: CatalogOutcome[] };
export type CatalogForm = { id: string; subject_family: string; code: string; name: string; description: string; default_question_type: DbQuestionType; status: string; sort_order: number };

// Một dòng câu hỏi đọc từ DB (kèm đáp án — chỉ người soạn/admin đọc được question_keys).
export type AdminQuestionRow = {
  id: string;
  question_type: DbQuestionType;
  prompt: { text?: string; left?: string[] } | null;
  options: string[] | null;
  skill_code: string | null;
  difficulty: number;
  time_limit_sec?: number | null;
  sort_order: number;
  status: LessonStatus;
  form_id: string | null;
  outcome_id: string | null;
  question_keys: QuestionKeyRow | QuestionKeyRow[] | null;
};

type QuestionKeyRow = { answer_key: Record<string, unknown>; explanation: { text?: string } | null; solution?: { text?: string } | null };

// Dữ liệu của form soạn câu hỏi. Mỗi loại chỉ dùng một phần các trường.
export type QuestionDraft = {
  id?: string;
  type: DbQuestionType;
  prompt: string;
  options: string[]; // single_choice, multiple_choice
  correct: string; // single_choice, true_false
  correctMany: string[]; // multiple_choice
  accepted: string[]; // fill_blank
  order: string[]; // ordering (thứ tự đúng)
  pairs: { left: string; right: string }[]; // matching
  explanation: string; // nhận xét ngắn hiện ngay khi trả lời
  solution: string; // lời giải chi tiết (bấm "Xem lời giải")
  skillCode: string;
  difficulty: Level; // cấp độ L1 Làm quen … L5 Mở rộng (src/lib/levels.ts)
  timeLimit: number | null; // giây; null = tự tính theo cấp độ và dạng câu
  formId: string | null; // dạng bài
  outcomeId: string | null; // yêu cầu cần đạt
};
