// Kiểm CHÍNH TẢ & TRÌNH BÀY tiếng Việt trên toàn bộ nội dung: bài soạn sẵn (đủ 3 môn — Toán, Tiếng Anh cũng có đề, nhận xét
// bằng tiếng Việt), kiến thức cần nhớ, ngân hàng lớp 1, bộ sinh câu luyện tập (mẫu ngẫu nhiên), kho từ phiếu chính tả.
// Luật nằm ở src/lib/content/verify-viet.ts (mã chữ NFC, âm tiết hợp lệ, c/k g/gh ng/ngh, vị trí dấu thanh, lỗi hay gặp, trình bày).
// Cố ý nêu cách viết sai để dạy (câu có chữ "sai", "nhầm", "không phải"…, lựa chọn SAI của câu chọn) thì không kiểm.
// Chạy: npm run check:tieng-viet            (thêm số đề sinh mỗi bài: npm run check:tieng-viet -- 20)
//       npm run check:tieng-viet -- --tat-ca (in hết lỗi, mặc định in 150 lỗi đầu)

import { CONTENT } from '../src/lib/content';
import { KNOWLEDGE } from '../src/lib/content/knowledge';
import { BANK } from '../src/lib/content/ngan-hang-lop1';
import { generatePractice, practiceLessons } from '../src/lib/practice';
import { PAIRS } from '../src/lib/spelling/bank';
import { vietIssues, vietSelfTestErrors } from '../src/lib/content/verify-viet';

const SEEDS = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 5);
const ALL = process.argv.includes('--tat-ca');
const errors: string[] = [];
const seen = new Set<string>();
let texts = 0;

// câu cố ý nêu cách viết sai (để dạy / để học sinh tìm lỗi) — bỏ qua cả câu
const TEACHES_WRONG = /\bsai\b|nhầm|không phải|chưa đúng|viết đúng|viết sai|phải viết|chính tả|lỗi/i;
const sentences = (s: string) => s.split(/(?<=[.!?…])\s+|\n+/);

function check(where: string, text: string | undefined | null, prose = true) {
  if (!text || typeof text !== 'string') return;
  texts++;
  const parts = prose ? sentences(text).filter((x) => !TEACHES_WRONG.test(x)) : [text];
  for (const p of parts) for (const i of vietIssues(p, prose)) {
    const k = where.replace(/ seed \d+/, '') + '|' + i.msg;
    if (seen.has(k)) continue;
    seen.add(k);
    errors.push(`${where} [${i.kind}] ${i.msg}`);
  }
}

type Q = { type: string; prompt: string; options?: string[]; left?: string[]; key?: unknown; explanation?: string; solution?: string; blanks?: string[]; statements?: string[] };
/** Kiểm một câu hỏi: đề, nhận xét, lời giải; với câu chọn chỉ kiểm lựa chọn ĐÚNG (lựa chọn sai có thể cố ý viết sai chính tả). */
function checkQ(where: string, q: Q) {
  const spellingQ = TEACHES_WRONG.test(q.prompt);
  if (!spellingQ) check(`${where} đề`, q.prompt);
  check(`${where} nhận xét`, q.explanation);
  check(`${where} lời giải`, q.solution);
  const k = (q.key ?? {}) as Record<string, unknown>;
  const answers: string[] = [];
  if (spellingQ) { /* câu hỏi chính tả: đáp án có thể chính là từ viết sai — không kiểm */ }
  else if (q.type === 'single_choice' || q.type === 'multiple_choice') answers.push(...[k.correct].flat().filter((x): x is string => typeof x === 'string'));
  else if (q.type === 'fill_blank') answers.push(...((k.accepted as string[]) ?? []).slice(0, 1));
  else answers.push(...(q.options ?? []), ...(q.left ?? []), ...(q.statements ?? []));
  for (const a of answers) check(`${where} đáp án`, a, false);
  if (!spellingQ) for (const b of q.blanks ?? []) check(`${where} ô điền`, b.replace(/\{\}/g, ' '), false);
}

// 0) Tự kiểm bộ luật
errors.push(...vietSelfTestErrors());
// 1) Bài soạn sẵn
for (const l of CONTENT) {
  check(`${l.id} tên bài`, l.title, false);
  check(`${l.id} mô tả`, l.description);
  l.questions.forEach((q, i) => checkQ(`${l.id} #${i + 1}`, q as Q));
}
// 2) Kiến thức cần nhớ
for (const [id, kn] of Object.entries(KNOWLEDGE)) {
  kn.points.forEach((p, i) => check(`${id} kiến thức ý ${i + 1}`, p));
  check(`${id} kiến thức ví dụ`, kn.example, false);
  check(`${id} kiến thức ghi chú`, kn.note);
}
// 3) Ngân hàng lớp 1
for (const b of BANK) checkQ(b.id, b.q as Q);
// 4) Bộ sinh câu luyện tập (mẫu ngẫu nhiên)
for (const l of practiceLessons()) for (let s = 1; s <= SEEDS; s++) for (const q of generatePractice(l.id, s)) checkQ(`${l.id} seed ${s}`, q as Q);
// 5) Kho từ phiếu chính tả: từ mẫu phải viết đúng
for (const p of PAIRS) for (const w of [...p.pics.map((x) => x.w), ...p.words]) check(`chính tả ${p.id}`, w, false);

console.log(`Đã kiểm ${texts} đoạn chữ (bài soạn sẵn, kiến thức, ngân hàng, ${SEEDS} đề sinh mỗi bài, kho từ chính tả).`);
if (errors.length) {
  (ALL ? errors : errors.slice(0, 150)).forEach((e) => console.log('✗ ' + e));
  console.log(`\n${errors.length} lỗi tiếng Việt${ALL || errors.length <= 150 ? '' : ' (in 150 lỗi đầu, thêm --tat-ca để in hết)'}`);
  process.exit(1);
}
console.log('✓ Chính tả và trình bày tiếng Việt đạt.');
