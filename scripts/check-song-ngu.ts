// Kiểm tra Toán song ngữ trên toàn bộ đề Toán lớp 1–5 (câu gốc + bộ sinh câu mọi mức):
//   1. Độ phủ: bao nhiêu đề được dịch trọn vẹn (đề chưa có quy tắc thì app chỉ hiện phép tính + từ vựng).
//   2. Ngữ pháp / an toàn: bản dịch không còn chữ Việt (trừ tên người), không còn chỗ trống {…},
//      viết hoa đầu câu, có dấu kết câu, "a/an" đúng, số ít / số nhiều đúng với số 1.
// Chạy: npm run check:song-ngu   (thêm "--chua" để in các mẫu câu chưa có quy tắc)
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) } };
import { CONTENT } from '../src/lib/content';
import { getQuestionSet } from '../src/lib/data';
import '../src/lib/practice';
import { MUC_LIST } from '../src/lib/sets';
import { NAME_SET, splitSentences, translateMathPrompt, translateSentenceForCheck } from '../src/lib/math-translate';

const SETS = Number(process.env.SONG_NGU_SETS ?? (process.argv.includes('nhanh') ? 1 : 4));
const prompts = new Map<string, number>(); // đề → lớp
for (const l of CONTENT) {
  if (l.subject !== 'toan') continue;
  const sets = [getQuestionSet(l.id).questions];
  for (const muc of MUC_LIST) for (let i = 0; i < SETS; i++) { store.clear(); sets.push(getQuestionSet(l.id, 1000 + i * 7919 + muc, muc, 'goc').questions); }
  for (const qs of sets) for (const q of qs) if (!prompts.has(q.prompt)) prompts.set(q.prompt, l.grade);
}

const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const problems: string[] = [];
const byGrade = new Map<number, { all: number; ok: number }>();
const missing = new Map<string, number>();
const LOP = process.argv.includes('--lop') ? Number(process.argv[process.argv.indexOf('--lop') + 1]) : 0;
for (const [p, g] of prompts) {
  if (LOP && g !== LOP) continue;
  const s = byGrade.get(g) ?? { all: 0, ok: 0 }; s.all++; byGrade.set(g, s);
  const en = translateMathPrompt(p);
  if (en !== null) {
    s.ok++;
    const words = en.replace(/'s\b/g, '').replace(/[^\p{L}\s'-]/gu, ' ').split(/\s+/).filter(Boolean);
    const viWord = words.find((w) => VI.test(w) && !NAME_SET.has(w) && w !== 'Đ'); // Đ / S là ký hiệu đáp án Đúng / Sai
    if (viWord) problems.push(`còn chữ Việt "${viWord}": ${p} → ${en}`);
    if (/[{}]/.test(en)) problems.push(`còn chỗ trống: ${p} → ${en}`);
    if (/\s{2,}/.test(en)) problems.push(`thừa dấu cách: ${en}`);
    // "a" viết thường đứng trước nguyên âm (bỏ qua "a one-…", "a uni…", biến a trong biểu thức "a = …")
    if (/(^|[\s(])a [aeiou]/.test(en.replace(/\ba (one|uni|use|is\b|=)/g, ''))) problems.push(`sai a/an: ${en}`);
    if (/\b1 (?!of\b)[a-z]+s\b/.test(en.replace(/\b(team|class|number|page|Path|Pen) 1 /g, '').replace(/\b1 (cm|mm|dm|km|kg|ml|ha|times|m²|cm²|cm³|dm³|m³|fish|l|g|m)\b/g, ''))) problems.push(`số ít / số nhiều: ${p} → ${en}`);
    if (/^[a-z]/.test(en)) problems.push(`chưa viết hoa đầu câu: ${en}`);
  } else {
    for (const sen of splitSentences(p)) if (translateSentenceForCheck(sen) === null) {
      const k = sen.replace(/\d+([ .,/]\d+)*/g, '#'); missing.set(k, (missing.get(k) ?? 0) + 1);
    }
  }
}
let all = 0, ok = 0;
for (const [g, s] of [...byGrade].sort((a, b) => a[0] - b[0])) { all += s.all; ok += s.ok; console.log(`Lớp ${g}: dịch trọn ${s.ok}/${s.all} đề (${(s.ok / s.all * 100).toFixed(1)}%)`); }
console.log(`Tổng: ${ok}/${all} đề (${(ok / all * 100).toFixed(1)}%)`);
if (process.argv.includes('--chua')) console.log([...missing].sort((a, b) => b[1] - a[1]).slice(0, Number(process.argv[process.argv.indexOf('--chua') + 1]) || 80).map(([k, n]) => `${n}\t${k}`).join('\n'));
if (problems.length) { console.log(`\n${problems.length} lỗi bản dịch:`); console.log(problems.slice(0, 40).join('\n')); process.exit(1); }
console.log('Bản dịch: không có lỗi ngữ pháp / chữ Việt sót.');
