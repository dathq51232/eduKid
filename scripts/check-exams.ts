// Kiểm tra ma trận và đề kiểm tra: 4 mã đề (khác câu / trộn), lọc theo yêu cầu cần đạt, file Word.
// Chạy: npm run check:exams
import { available, bookLessons, buildPaper, defaultMatrix, outcomesIn, shufflePaper, totals, type Paper } from '../src/lib/exams/matrix';
import { examDocument } from '../src/lib/exams/word';
import type { SubjectCode } from '../src/lib/types';

let fail = 0, checks = 0;
const ok = (c: boolean, m: string) => { checks++; if (!c) { fail++; console.log('✗', m); } };
const SUBJECTS: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];
const keyOf = (p: Paper) => p.slots.map((s) => s.q.key).sort().join('\n');
const answerOk = (p: Paper) => p.slots.every(({ q }) => {
  const k = q.answer as Record<string, unknown>;
  if (q.type === 'single_choice') return q.options.includes(k.correct as string);
  if (q.type === 'multiple_choice') return (k.correct as string[]).every((c) => q.options.includes(c));
  return true;
});

for (const subject of SUBJECTS) for (const grade of [1, 2, 3, 4, 5]) {
  const lessons = bookLessons(subject, grade).filter((l) => l.semester === 1);
  if (!lessons.length) continue;
  const m = defaultMatrix(lessons, 10);
  const t = totals(m);
  ok(t.questions === 10, `${subject} ${grade}: ma trận 10 câu (${t.questions})`);
  // 4 đề khác câu
  const avoid = new Set<string>();
  const papers: Paper[] = [];
  for (const code of 'ABCD') { const p = buildPaper(m, 1000 + code.charCodeAt(0), code, avoid); p.slots.forEach((s) => avoid.add(s.q.key)); papers.push(p); }
  const keys = papers.flatMap((p) => p.slots.map((s) => s.q.key));
  ok(new Set(keys).size === keys.length, `${subject} ${grade}: 4 đề khác câu không trùng câu`);
  ok(papers.every(answerOk), `${subject} ${grade}: đáp án nằm trong phương án (khác câu)`);
  // 4 đề trộn từ A
  const a = buildPaper(m, 77, 'A');
  const mixed = [a, ...'BCD'.split('').map((c, i) => shufflePaper(a, 300 + i, c))];
  ok(mixed.every((p) => keyOf(p) === keyOf(a)), `${subject} ${grade}: đề trộn cùng bộ câu với đề A`);
  ok(mixed.every(answerOk), `${subject} ${grade}: đáp án đúng sau khi trộn phương án`);
  ok(mixed.slice(1).some((p) => p.slots.map((s) => s.q.key).join('|') !== a.slots.map((s) => s.q.key).join('|')), `${subject} ${grade}: đề trộn có đổi thứ tự câu`);
  ok(mixed.every((p) => p.slots.every((s, i, arr) => i === 0 || !(['single_choice', 'multiple_choice', 'true_false', 'true_false_table'].includes(s.q.type) && !['single_choice', 'multiple_choice', 'true_false', 'true_false_table'].includes(arr[i - 1].q.type)))), `${subject} ${grade}: đề trộn giữ trắc nghiệm trước tự luận`);
  // Lọc YCCĐ: bỏ YCCĐ nhiều câu nhất → không còn câu nào của YCCĐ đó trong đề
  const outs = outcomesIn(m.rows.flatMap((r) => r.lessonIds)).sort((x, y) => y.n - x.n);
  if (outs.length > 1) {
    const ex = outs[0].code;
    const before = m.rows.reduce((n, r) => n + Object.values(available(r.lessonIds)).reduce((a2, b) => a2 + b, 0), 0);
    const after = m.rows.reduce((n, r) => n + Object.values(available(r.lessonIds, [ex])).reduce((a2, b) => a2 + b, 0), 0);
    ok(after === before - outs[0].n, `${subject} ${grade}: lọc YCCĐ trừ đúng ${outs[0].n} câu`);
    const p = buildPaper({ ...m, exclude: [ex] }, 5, 'A');
    ok(p.slots.every((s) => s.q.outcome !== ex), `${subject} ${grade}: đề không còn câu của YCCĐ đã bỏ`);
  }
  const html = examDocument({ school: 'Trường Demo', title: 'Bài kiểm tra cuối học kì I', subjectName: subject, grade, className: `${grade}A`, yearLabel: '2026–2027', minutes: 40, outcomes: { [outs[0]?.code ?? 'x']: 'YCCĐ mẫu' } },
    m, mixed, new Map(lessons.map((l) => [l.id, l.title])), { matrix: true, papers: true, keys: true });
  ok(html.includes('Yêu cầu cần đạt') && html.includes('Thông tư 27/2020') && (html.match(/ĐỀ D/g) ?? []).length >= 2, `${subject} ${grade}: file Word có cột YCCĐ, chú thích mức, đủ đề D + đáp án D`);
}
console.log(`${checks - fail}/${checks} đạt`);
if (fail) process.exit(1);
