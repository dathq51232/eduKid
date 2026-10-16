// Dữ liệu cho trang học sinh khi chưa nối Supabase.
// Lấy từ bộ bài tập soạn sẵn (src/lib/content): Lớp 1, Học kì 1 — Toán, Tiếng Việt (Kết nối tri thức),
// Tiếng Anh (Global Success). Đáp án nằm ở đây chỉ để chấm thử trên trình duyệt; với dữ liệu thật,
// đáp án và lời giải nằm ở bảng question_keys và được chấm bằng submit_quiz_answer trên server.

import { CONTENT } from './content';
import { defaultTimeLimit } from './levels';
import { shuffle } from './shuffle';
import type { AnswerKey, Lesson, Question, Subject } from './types';

export const SUBJECTS: Subject[] = [
  { code: 'toan', name: 'Toán', short: 'Toán', mark: '+ −', tone: 'math' },
  { code: 'tieng-viet', name: 'Tiếng Việt', short: 'Tiếng Việt', mark: 'Aa', tone: 'viet' },
  { code: 'tieng-anh', name: 'Tiếng Anh', short: 'Tiếng Anh', mark: 'ABC', tone: 'english' },
];

export const GRADES = [1, 2, 3, 4, 5];

export const DEMO_LESSONS: Lesson[] = CONTENT.map((l, i) => ({
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

type DemoQuestion = Question & {
  answerKey: AnswerKey;
  explanation: string;
  solution?: string;
};

export const DEMO_QUESTIONS: DemoQuestion[] = CONTENT.flatMap((l) =>
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
