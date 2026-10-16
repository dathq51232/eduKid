// Kiểm tra "Đổi bộ câu hỏi": bộ mới không lặp lại câu nào của bộ đang có (và bộ trước nữa).
// Chạy: npm run check:sets
// Giả lập localStorage của trình duyệt để dùng đúng đường đi của trang làm bài.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
};

import { CONTENT } from '../src/lib/content';
import { getQuestionSet } from '../src/lib/data';
import { DEMO_QUESTIONS } from '../src/lib/demo-data';
import { isPracticeId, questionById, signature } from '../src/lib/practice';
import { coreSig, MUC_LIST } from '../src/lib/sets';

/** Lõi câu (đề + hình + đáp án): cùng lõi = cùng một câu với học sinh dù lựa chọn nhiễu khác */
const coreOf = (q: { id: string; prompt: string }) => {
  const g = isPracticeId(q.id) ? questionById(q.id) : null;
  return coreSig(g ?? { prompt: q.prompt, key: DEMO_QUESTIONS.find((d) => d.id === q.id)?.answerKey });
};

const CHAIN = Number(process.argv[2] ?? 6);
let sets = 0;
const problems: string[] = [];
const notes = new Map<string, number>();
const keyOf = (q: { id: string; prompt: string }) => q.id;

for (const lesson of CONTENT) {
  for (const muc of MUC_LIST) {
    store.clear();
    let prev: string = 'goc';
    let prevSets: { ids: Set<string>; sigs: Set<string>; prompts: Set<string>; cores: Set<string> }[] = [];
    // Bộ gốc của bài
    const goc = getQuestionSet(lesson.id).questions;
    prevSets.push({ ids: new Set(goc.map(keyOf)), sigs: new Set(goc.map((q) => signature(q))), prompts: new Set(goc.map((q) => q.prompt)), cores: new Set(goc.map(coreOf)) });
    for (let i = 0; i < CHAIN; i++) {
      const seed = 1000 + i * 7919 + muc;
      const { questions, note } = getQuestionSet(lesson.id, seed, muc, prev);
      sets++;
      if (questions.length !== 10) problems.push(`${lesson.id} mức ${muc} bộ ${i + 1}: ${questions.length} câu`);
      const ids = new Set(questions.map(keyOf));
      if (ids.size !== questions.length || new Set(questions.map(coreOf)).size !== questions.length) problems.push(`${lesson.id} mức ${muc} bộ ${i + 1}: trùng câu trong bộ`);
      const last = prevSets[prevSets.length - 1];
      const overlap = questions.filter((q) => last.ids.has(q.id) || last.sigs.has(signature(q)) || last.cores.has(coreOf(q)) || (!q.id.startsWith('lt-') && last.prompts.has(q.prompt)));
      if (overlap.length) {
        if (note) notes.set(lesson.id, (notes.get(lesson.id) ?? 0) + 1);
        else problems.push(`${lesson.id} mức ${muc} bộ ${i + 1}: lặp ${overlap.length} câu của bộ trước mà không báo`);
      }
      // Tải lại trang: ra đúng bộ cũ
      const again = getQuestionSet(lesson.id, seed, muc, prev).questions.map((q) => q.id).join();
      if (again !== questions.map((q) => q.id).join()) problems.push(`${lesson.id} mức ${muc} bộ ${i + 1}: tải lại ra bộ khác`);
      prevSets.push({ ids, sigs: new Set(questions.map((q) => signature(q))), prompts: new Set(questions.map((q) => q.prompt)), cores: new Set(questions.map(coreOf)) });
      prev = String(seed);
    }
    prevSets = [];
  }
}
console.log(`Đã thử ${sets} lần "Đổi bộ câu hỏi" (${CONTENT.length} bài × 3 mức × ${CHAIN} lần đổi liên tiếp).`);
if (notes.size) console.log(`Bài còn ít câu, có lặp (đã ghi chú cho học sinh): ${[...notes.entries()].map(([k, v]) => `${k} (${v})`).join(', ')}`);
if (problems.length) {
  console.log(`\nLỖI (${problems.length}):\n` + problems.slice(0, 40).join('\n'));
  process.exit(1);
}
console.log('Không có lỗi: mỗi bộ mới không trùng câu nào với bộ ngay trước.');
