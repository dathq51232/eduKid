// Kiểm tra bộ sinh bài luyện tập ngẫu nhiên (src/lib/practice): sinh nhiều đề cho mỗi bài và kiểm tra
//  - đủ 10 câu, 2 câu mỗi cấp độ L1→L5, không trùng câu trong một đề;
//  - đáp án tự chấm đúng, đáp án sai bị chấm sai; lựa chọn không trùng, có chứa đáp án;
//  - không vượt trước: mọi số ≤ phạm vi của bài, trước Bài 10 không có dấu + / −, Bài 10 chưa có dấu −;
//    học kì 2: chỉ dùng loại phép cộng/trừ hai chữ số đã học, luôn không nhớ;
//  - thời gian mỗi câu 30–120 giây.
// Chạy: npm run check:practice   (thêm số đề mỗi bài: npm run check:practice -- 2000)

import { gradeLocal } from '../src/lib/grading';
import { generatePractice, practiceLessons, practiceScope, signature, type GeneratedQuestion } from '../src/lib/practice';
import { normNums, opsProblems, scopeProblems, twoDigitProblems } from '../src/lib/content/scope';
import type { AnswerKey, AnswerValue } from '../src/lib/types';

const SEEDS = Number(process.argv[2] ?? 500);
const ONLY = process.argv[3]; // tuỳ chọn: chỉ kiểm các bài có mã chứa chuỗi này (vd. toan5)
const errors: string[] = [];
const seenKinds = new Map<string, number>();
const err = (where: string, msg: string) => {
  // Mỗi loại lỗi (bài + nội dung lỗi, bỏ số cụ thể) chỉ in tối đa 3 lần để thấy đủ các loại lỗi khác nhau
  const kind = where.replace(/ seed \d+.*/, '') + '|' + msg.replace(/\d+/g, '#').slice(0, 60);
  const n = (seenKinds.get(kind) ?? 0) + 1;
  seenKinds.set(kind, n);
  if (n > 3) return;
  if (errors.length < 120) errors.push(`${where}: ${msg}`);
  else if (errors.length === 120) errors.push('… (còn nữa)');
};

function rightAnswer(q: GeneratedQuestion): AnswerValue {
  const k = q.key as Record<string, unknown>;
  switch (q.type) {
    case 'single_choice': case 'true_false': return k.correct as string;
    case 'multiple_choice': return k.correct as string[];
    case 'ordering': return k.order as string[];
    case 'fill_blanks': return (k.answers as string[][])[0];
    case 'true_false_table': return k.truth as string[];
    case 'fill_blank': return (k.accepted as string[])[0];
    case 'matching': return k.pairs as Record<string, string>;
    default: return null;
  }
}
function wrongAnswer(q: GeneratedQuestion): AnswerValue {
  const k = q.key as Record<string, unknown>;
  switch (q.type) {
    case 'single_choice': return q.options.find((o) => o !== k.correct) ?? null;
    case 'multiple_choice': return (k.correct as string[]).slice(1).length ? (k.correct as string[]).slice(1) : q.options.filter((o) => !(k.correct as string[]).includes(o)).slice(0, 1);
    case 'ordering': return [...(k.order as string[])].reverse();
    case 'fill_blanks': { const a = [...(k.answers as string[][])[0]]; a[a.length - 1] = String(Number(a[a.length - 1]) + 1); return a; }
    case 'true_false_table': { const t = [...(k.truth as string[])]; t[0] = t[0] === 'Đúng' ? 'Sai' : 'Đúng'; return t; }
    case 'matching': { const e = Object.entries(k.pairs as Record<string, string>); const [a, b] = [e[0][1], e[1][1]]; e[0][1] = b; e[1][1] = a; return Object.fromEntries(e); }
    default: return null;
  }
}

const texts = (q: GeneratedQuestion) => [q.prompt, ...q.options, ...(q.blanks ?? []), ...(q.statements ?? []), q.explanation, q.solution ?? '', ...Object.keys(q.optionFigures ?? {})];
const answerNums = (q: GeneratedQuestion) => (q.type === 'fill_blanks' ? ((q.key as { answers: string[][] }).answers.flat()) : []);

const stats: { lesson: string; distinct: number; perLevel: number[]; types: Record<string, number> }[] = [];

for (const lesson of practiceLessons().filter((x) => !ONLY || x.id.includes(ONLY))) {
  const scope = practiceScope(lesson.id)!;
  const isMath = scope.kind === 'math' || scope.kind === 'math2' || scope.kind === 'math5';
  const max = isMath ? scope.maxNumber : scope.kind === 'english' && scope.book ? 20 : 99;
  const ops: readonly string[] = isMath ? scope.ops : ['+', '-'];
  let shortSets = 0;
  const distinct = new Set<string>();
  const perLevel = [new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>()];
  const types: Record<string, number> = {};
  for (let seed = 1; seed <= SEEDS; seed++) {
    const qs = generatePractice(lesson.id, seed);
    const where0 = `${lesson.id} seed ${seed}`;
    const levels = qs.map((q) => q.level).join('');
    if (isMath) {
      if (qs.length !== 10) err(where0, `có ${qs.length} câu (cần 10)`);
      if (levels !== '1122334455') err(where0, `cấp độ ${levels}`);
    } else if (levels !== '1122334455') shortSets++; // tuần/unit đầu còn ít vốn từ: ghi nhận, không tính lỗi
    const sigs = qs.map(signature);
    if (new Set(sigs).size !== sigs.length) err(where0, 'có câu trùng trong đề');
    // cùng seed ra cùng đề
    if (seed <= 20 && JSON.stringify(generatePractice(lesson.id, seed)) !== JSON.stringify(qs)) err(where0, 'cùng seed nhưng đề khác');
    qs.forEach((q, i) => {
      const where = `${where0} câu ${i + 1} (${q.type})`;
      distinct.add(sigs[i]);
      perLevel[q.level - 1].add(sigs[i]);
      types[q.type] = (types[q.type] ?? 0) + 1;
      const right = rightAnswer(q);
      if (!gradeLocal(q.type, right, q.key as AnswerKey)) err(where, `đáp án đúng bị chấm sai: ${q.prompt}`);
      const wrong = wrongAnswer(q);
      if (wrong !== null && JSON.stringify(wrong) !== JSON.stringify(right) && gradeLocal(q.type, wrong, q.key as AnswerKey)) err(where, `đáp án sai lại được chấm đúng: ${q.prompt} | ${JSON.stringify(wrong)}`);
      if (['single_choice', 'multiple_choice'].includes(q.type)) {
        if (new Set(q.options).size !== q.options.length) err(where, `lựa chọn trùng: ${q.options.join(' | ')}`);
        if (q.options.length < 2) err(where, 'ít hơn 2 lựa chọn');
        const need = q.type === 'single_choice' ? [(q.key as { correct: string }).correct] : (q.key as { correct: string[] }).correct;
        if (!need.every((x) => q.options.includes(x))) err(where, 'đáp án không nằm trong lựa chọn');
        if (q.optionFigures && !q.options.every((o) => q.optionFigures![o])) err(where, 'thiếu hình cho lựa chọn');
      }
      if (q.type === 'fill_blanks') {
        const n = (q.blanks ?? []).join('\n').split('{}').length - 1;
        for (const set of (q.key as { answers: string[][] }).answers) {
          if (set.length !== n) err(where, `số ô ${n} khác số đáp án ${set.length}`);
          if (!set.every((x) => /^\d{1,9}(,\d{1,4})?$/.test(x))) err(where, `đáp án không phải số: ${set.join(',')}`);
        }
      }
      if (q.type === 'true_false_table') {
        const t = (q.key as { truth: string[] }).truth;
        if ((q.statements ?? []).length !== t.length || t.length < 3) err(where, 'bảng Đ/S sai số dòng');
        if (!t.includes('Đúng') || !t.includes('Sai')) err(where, 'bảng Đ/S cần có cả Đ và S');
      }
      // Không vượt trước: phạm vi số
      for (const t of [...texts(q), ...answerNums(q)]) {
        for (const m of normNums(t).matchAll(/\d+/g)) if (Number(m[0]) > max) err(where, `số ${m[0]} vượt phạm vi ${max}: "${t}"`);
        const hasPlus = /\d\s*\+\s*\d|\+\s*\{\}|\{\}\s*\+/.test(t) || t.includes('dấu +');
        const hasMinus = /\d\s*[−-]\s*\d|[−]\s*\{\}|\{\}\s*[−]/.test(t) || t.includes('dấu −');
        if (hasPlus && !ops.includes('+')) err(where, `dùng phép cộng khi chưa học: "${t}"`);
        if (hasMinus && !ops.includes('-')) err(where, `dùng phép trừ khi chưa học: "${t}"`);
      }
      // Đếm đồ vật trong tranh không quá phạm vi
      if (q.figure?.kind === 'objects' && q.figure.groups.some((g) => g.count > max)) err(where, 'tranh có quá nhiều đồ vật');
      // Không vượt trước theo đúng quy tắc của bài sách (âm/vần/dấu thanh, từ vựng unit, phạm vi số)
      for (const p of scopeProblems(q, scope)) err(where, `${p}: "${q.prompt}"`);
      // Học kì 2: chỉ dùng loại phép tính đã học, luôn không nhớ (kiểm cả ô điền, bảng Đ/S, lời giải)
      if (scope.kind === 'math' && scope.pt2) for (const t of texts(q)) for (const p of twoDigitProblems(t, scope.pt2)) err(where, `${p}: "${t}"`);
      // Lớp 2+: phép tính đã học, có nhớ đúng lúc, bảng nhân/chia đã học (kiểm cả ô điền, bảng Đ/S, lời giải)
      if (scope.kind === 'math2') for (const t of texts(q)) for (const p of opsProblems(t, scope)) err(where, `${p}: "${t}"`);
      if (q.timeLimit < 30 || q.timeLimit > 120) err(where, `thời gian ${q.timeLimit} giây`);
      if (q.level >= 3 && !q.solution) err(where, 'câu L3+ chưa có lời giải chi tiết');
      if (!q.explanation) err(where, 'thiếu nhận xét');
    });
  }
  stats.push({ lesson: lesson.id + (shortSets ? ` (thiếu mức: ${shortSets} đề)` : ''), distinct: distinct.size, perLevel: perLevel.map((s) => s.size), types });
}

console.log(`Đã sinh ${SEEDS} đề cho mỗi bài (${stats.length} bài).\n`);
console.log('Bài                     | câu khác nhau | L1 / L2 / L3 / L4 / L5          | dạng câu');
for (const s of stats) {
  console.log(`${s.lesson.padEnd(40)} | ${String(s.distinct).padStart(13)} | ${s.perLevel.map((x) => String(x).padStart(5)).join(' /')} | ${Object.entries(s.types).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}
if (errors.length) {
  console.log(`\nLỖI (${errors.length}):\n` + errors.join('\n'));
  process.exit(1);
}
console.log('\nKhông có lỗi.');
