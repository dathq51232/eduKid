// Kiểm chứng bộ sinh "Chuyên đề nâng cao" (src/lib/practice/advanced):
//  - mọi dạng ở mọi cấp độ đều sinh được đề (tỉ lệ trả null không quá cao);
//  - đáp án theo công thức TRÙNG lời giải vét cạn / mô phỏng (brute) và nghiệm là duy nhất;
//  - đáp án là số tự nhiên dương hoặc phân số tối giản; đáp án nhiễu khác đáp án đúng;
//  - đề không quá dài (học sinh tiểu học đọc được).
// Chạy: npx tsx scripts/check-advanced.ts [số lần mỗi dạng, mặc định 400]

import { makeRng } from '../src/lib/practice/rng';
import { show, gcd, type AdvCtx } from '../src/lib/practice/advanced/engine';
import { ADV_TOPICS } from '../src/lib/practice/advanced/lessons';
import type { Level } from '../src/lib/content/types';

const RUNS = Number(process.argv[2] ?? 400);
const errors: string[] = [];
const seen = new Set<string>();
const err = (k: string, m: string) => { const key = k + m.replace(/\d+/g, '#'); if (seen.has(key)) return; seen.add(key); errors.push(`${k}: ${m}`); };
let made = 0, nulls = 0;

for (const t of ADV_TOPICS) {
  for (const grade of t.grades) {
    const c: AdvCtx = { grade };
    for (const lv of [1, 2, 3, 4, 5] as Level[]) {
      t.pool[lv].forEach((gen, gi) => {
        const where = `${t.slug} lớp ${grade} L${lv} dạng ${gi + 1}`;
        let ok = 0;
        for (let i = 0; i < RUNS; i++) {
          const p = gen(makeRng(i * 2654435761 + gi * 97 + lv), c, lv);
          if (!p) { nulls++; continue; }
          ok++; made++;
          const ans = show(p.answer);
          const b = p.brute();
          if (b === null) err(where, `vét cạn không ra nghiệm duy nhất — ${p.prompt.slice(0, 90)}`);
          else if (show(b) !== ans) err(where, `đáp án ${ans} ≠ vét cạn ${show(b)} — ${p.prompt.slice(0, 90)}`);
          if (typeof p.answer === 'number' && (!Number.isInteger(p.answer) || p.answer <= 0)) err(where, `đáp án không phải số tự nhiên dương: ${p.answer}`);
          const m = /^(\d+)\/(\d+)$/.exec(ans);
          if (m && gcd(Number(m[1]), Number(m[2])) !== 1) err(where, `phân số chưa tối giản: ${ans}`);
          // đáp án nhiễu tình cờ bằng đáp án đúng thì bộ dựng lựa chọn tự bỏ; chỉ cần còn ít nhất một bẫy khác đáp án
          const okTraps = p.traps.filter((tr) => (typeof tr.value === 'string' || (Number.isInteger(tr.value) && tr.value > 0)) && show(tr.value) !== ans);
          if (!okTraps.length) err(where, 'không còn đáp án nhiễu nào khác đáp án đúng');
          if (!p.steps.length) err(where, 'thiếu lời giải');
          if (p.prompt.length > 420) err(where, `đề quá dài (${p.prompt.length} ký tự)`);
          if (/NaN|undefined|Infinity/.test(p.prompt + p.steps.join(' '))) err(where, `đề hoặc lời giải lỗi: ${p.prompt.slice(0, 80)}`);
        }
        if (ok < RUNS * 0.3) err(where, `chỉ sinh được ${ok}/${RUNS} đề`);
      });
    }
  }
}

console.log(`Chuyên đề nâng cao: ${ADV_TOPICS.length} chuyên đề, ${made} đề đã kiểm (${nulls} lần thử bị bỏ do không đạt ràng buộc).`);
if (errors.length) { console.log(errors.slice(0, 60).join('\n')); console.log(`✗ ${errors.length} lỗi`); process.exit(1); }
console.log('✓ Đáp án khớp vét cạn, nghiệm duy nhất, đáp án nhiễu khác đáp án đúng.');
