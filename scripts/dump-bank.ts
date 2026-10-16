// Xuất ngân hàng câu hỏi + bài theo sách ra JSON (dùng cho scripts/export_bank_xlsx.py).
// Chạy: npm run export:bank
import { BANK, deOf } from '../src/lib/content/ngan-hang-lop1';
import { CONTENT } from '../src/lib/content';
import { defaultTimeLimit, LEVELS } from '../src/lib/levels';
import type { ContentQuestion } from '../src/lib/content/types';

const q2 = (q: ContentQuestion) => ({
  type: q.type,
  prompt: q.prompt,
  options: q.options,
  left: q.left ?? null,
  key: q.key,
  explanation: q.explanation,
  solution: q.solution ?? null,
  level: q.level,
  levelCode: LEVELS[q.level].code,
  levelName: LEVELS[q.level].name,
  timeLimit: q.timeLimit ?? defaultTimeLimit(q.type, q.level, q.prompt),
  points: LEVELS[q.level].points,
  outcome: q.outcome,
  form: q.form,
  skill: q.skill ?? null,
});

const bank = (Number(process.argv[2] ?? 1) === 1 ? BANK : []).map((b) => ({ ...b, q: q2(b.q), de: deOf(b) }));
// Lớp cần xuất: mặc định 1 (file Excel Lớp 1); `npx tsx scripts/dump-bank.ts 2` → bài tập theo sách Lớp 2
const GRADE = Number(process.argv[2] ?? 1);
const book = CONTENT.filter((l) => l.kind !== 'review' && l.grade === GRADE).flatMap((l) =>
  l.questions.map((q, i) => ({
    id: `${l.id}-q${i + 1}`,
    subject: l.subject,
    grade: l.grade,
    book: l.book,
    ref: l.ref,
    unit: l.unit,
    lessonId: l.id,
    lessonTitle: l.title,
    q: q2(q),
  })),
);
const levels = Object.entries(LEVELS).map(([k, v]) => ({ level: Number(k), ...v }));
process.stdout.write(JSON.stringify({ bank, book, levels }, null, 1));
