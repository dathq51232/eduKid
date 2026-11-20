// Kiểm tra ĐÚNG KIẾN THỨC (không chỉ đúng cấu trúc): tìm mọi phép tính / phép so sánh viết bằng số trong
//  - "Kiến thức cần nhớ" (ý chính, ví dụ, ghi chú), nhận xét, lời giải của bài soạn sẵn, ngân hàng, bộ sinh câu;
//  - đáp án đúng của câu chọn / điền (thế đáp án vào chỗ trống ? … ___ {} rồi tính lại);
//  - câu Đúng/Sai và bảng Đúng/Sai: phát biểu chấm "Đúng" thì phép tính trong đó phải đúng, chấm "Sai" mà mọi
//    phép tính đều đúng thì ghi cảnh báo để người soạn xem lại.
// Rồi tính lại bằng số hữu tỉ chính xác. Câu có chữ "sai", "nhầm", "không phải"… (cố ý nêu phép tính sai) được bỏ qua.
// Chạy: npm run check:knowledge   (thêm số đề sinh ngẫu nhiên mỗi bài: npm run check:knowledge -- 60)

import { CONTENT } from '../src/lib/content';
import { KNOWLEDGE } from '../src/lib/content/knowledge';
import { BANK } from '../src/lib/content/ngan-hang-lop1';
import { generatePractice, practiceLessons } from '../src/lib/practice';
import { mathSelfTestErrors, questionMathIssues, falseStatements, type MathQ } from '../src/lib/content/verify-math';
import { rulesSelfTestErrors } from '../src/lib/content/rules';
import { emptyDraft, knowledgeIssues } from '../src/lib/admin/questions';

const SEEDS = Number(process.argv[2] ?? 30);
const errors: string[] = [];
const warns: string[] = [];
const seen = new Set<string>();
const report = (list: string[], where: string, msg: string) => {
  const k = where.replace(/ seed \d+/, '') + '|' + msg;
  if (seen.has(k)) return;
  seen.add(k);
  list.push(`${where}: ${msg}`);
};

// Bộ máy tính lại phép tính nằm ở src/lib/content/verify-math.ts — dùng chung với trang Quản trị (kiểm khi soạn / nhập CSV).
const mustBeTrue = (where: string, text: string | undefined) => falseStatements(text).forEach((m) => report(errors, where, m));
let checked = 0;
function checkQ(where: string, q: MathQ) {
  checked++;
  for (const i of questionMathIssues(q)) report(errors, `${where} [${i.part}]`, i.msg);
}

// 0) Tự kiểm: bộ kiểm tra phải bắt được lỗi cố ý cài vào và không báo nhầm câu đúng
errors.push(...mathSelfTestErrors(), ...rulesSelfTestErrors());
// trang Quản trị dùng cùng bộ máy khi soạn câu / nhập CSV: câu có lời giải sai phải bị chặn, câu đúng thì không
{
  const bad = { ...emptyDraft('single_choice'), prompt: '7 + 5 = ?', options: ['11', '12', '13'], correct: '12', solution: 'Ta có 7 + 5 = 13.' };
  const good = { ...bad, solution: 'Ta có 7 + 5 = 12.' };
  const tf = { ...emptyDraft('true_false'), prompt: 'Đúng hay sai: 9 − 4 = 6', correct: 'Đúng' };
  if (!knowledgeIssues(bad).length) errors.push('[tự kiểm] trang Quản trị không chặn lời giải sai');
  if (knowledgeIssues(good).length) errors.push(`[tự kiểm] trang Quản trị báo nhầm: ${knowledgeIssues(good).join('; ')}`);
  if (!knowledgeIssues(tf).length) errors.push('[tự kiểm] trang Quản trị không chặn câu Đúng/Sai chấm ngược');
}

// 1) Kiến thức cần nhớ
for (const [id, kn] of Object.entries(KNOWLEDGE)) {
  kn.points.forEach((p, i) => mustBeTrue(`${id} [kiến thức ý ${i + 1}]`, p));
  mustBeTrue(`${id} [kiến thức ví dụ]`, kn.example);
  mustBeTrue(`${id} [kiến thức ghi chú]`, kn.note);
}
// 2) Bài soạn sẵn
for (const l of CONTENT) l.questions.forEach((q, i) => checkQ(`${l.id} #${i + 1}`, q as MathQ));
// 3) Ngân hàng lớp 1
for (const b of BANK) checkQ(b.id, b.q as MathQ);
// 4) Bộ sinh câu luyện tập (mẫu ngẫu nhiên)
for (const l of practiceLessons()) for (let s = 1; s <= SEEDS; s++) for (const q of generatePractice(l.id, s)) checkQ(`${l.id} seed ${s}`, q as MathQ);

console.log(`Đã kiểm ${Object.keys(KNOWLEDGE).length} bài kiến thức, ${checked} câu hỏi (soạn sẵn + ngân hàng + ${SEEDS} đề sinh mỗi bài).`);
warns.forEach((w) => console.log('! ' + w));
if (errors.length) {
  errors.slice(0, 200).forEach((e) => console.log('✗ ' + e));
  console.log(`\n${errors.length} lỗi kiến thức`);
  process.exit(1);
}
console.log('✓ Mọi phép tính, phép so sánh trong kiến thức, đáp án, nhận xét, lời giải đều đúng.');
