// Dữ liệu cho trang học sinh khi chưa nối Supabase.
// Lấy từ bộ bài tập soạn sẵn (src/lib/content): Lớp 1, Học kì 1 — Toán, Tiếng Việt (Kết nối tri thức),
// Tiếng Anh (Global Success). Đáp án nằm ở đây chỉ để chấm thử trên trình duyệt; với dữ liệu thật,
// đáp án và lời giải nằm ở bảng question_keys và được chấm bằng submit_quiz_answer trên server.

import { CONTENT_LIVE, contentVersion } from './content/store';
import { defaultTimeLimit } from './levels';
import { shuffle } from './shuffle';
import type { AnswerKey, Lesson, Question, Subject } from './types';

export const SUBJECTS: Subject[] = [
  { code: 'toan', name: 'Toán', short: 'Toán', mark: '+ −', tone: 'math' },
  { code: 'tieng-viet', name: 'Tiếng Việt', short: 'Tiếng Việt', mark: 'Aa', tone: 'viet' },
  { code: 'tieng-anh', name: 'Tiếng Anh', short: 'Tiếng Anh', mark: 'ABC', tone: 'english' },
];

export const GRADES = [1, 2, 3, 4, 5];

function toLessons(): Lesson[] {
  return CONTENT_LIVE.map((l, i) => ({
  id: l.id,
  subject: l.subject,
  grade: l.grade,
  title: l.title,
  description: l.description,
  topicCode: l.topicCode,
  unit: l.unit,
  book: l.book,
  kind: l.kind ?? 'book',
  sortOrder: i + 1,
}));
}

type DemoQuestion = Question & {
  answerKey: AnswerKey;
  explanation: string;
  solution?: string;
};

function toQuestions(): DemoQuestion[] {
  return CONTENT_LIVE.flatMap((l) =>
  l.questions.map((q, i) => {
    const id = `${l.id}-q${i + 1}`;
    return {
      id,
      lessonId: l.id,
      type: q.type,
      prompt: q.prompt,
      // Sắp xếp: hiển thị theo thứ tự đã đảo (không lộ đáp án); ghép cặp: vế trái cũng được đảo
      options: q.type === 'ordering' ? shuffle(q.options, id) : q.options,
      leftItems: q.left ? shuffle(q.left, `${id}-l`) : undefined,
      skillCode: q.skill,
      level: q.level,
      timeLimit: q.timeLimit ?? defaultTimeLimit(q.type, q.level, q.prompt),
      answerKey: q.key,
      explanation: q.explanation,
      solution: q.solution,
    };
  }),
);
}

// Danh sách bài / câu soạn sẵn của các khối ĐÃ NẠP (trang học của học sinh nạp từng khối; máy chủ nạp đủ 5 khối).
// Tính lại khi có khối mới được nạp.
let ver = -1;
let lessonsCache: Lesson[] = [];
let questionsCache: DemoQuestion[] = [];
function sync() {
  const v = contentVersion();
  if (v === ver) return;
  ver = v;
  lessonsCache = toLessons();
  questionsCache = toQuestions();
}
export function demoLessons(): Lesson[] { sync(); return lessonsCache; }
export function demoQuestions(): DemoQuestion[] { sync(); return questionsCache; }
