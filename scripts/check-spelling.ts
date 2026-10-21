// Kiểm tra kho từ & bộ sinh phiếu chính tả: npm run check:spelling
import { existsSync } from 'fs';
import { PAIRS, splitWord } from '../src/lib/spelling/bank';
import { makeSheet, sheetHtml } from '../src/lib/spelling/worksheet';
import { htmlToDocx } from '../src/lib/docx-write';

let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) pass++; else { fail++; console.log('✗', m); } };
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// luật: k / gh / ngh trước e, ê, i; c / g / ng trước các âm khác
const RULE: Record<string, (ans: string, next: string) => boolean> = {
  'c-k': (a, n) => (/^[eêi]/.test(n) ? a === 'k' : a === 'c'),
  'g-gh': (a, n) => (/^[eêi]/.test(n) ? a === 'gh' : a === 'g'),
  'ng-ngh': (a, n) => (/^[eêi]/.test(n) ? a === 'ngh' : a === 'ng'),
};
for (const p of PAIRS) {
  for (const w of [...p.pics.map((x) => x.w), ...p.words]) {
    const s = splitWord(w);
    ok(s.ans.length >= 1 && s.ans.every((a) => p.options.includes(a)), `${p.id}: "${w}" đáp án thuộc ${p.options}`);
    if (RULE[p.id]) for (const [i, part] of s.parts.entries()) if (part.ans) {
      const next = norm(s.parts[i + 1]?.text ?? '').charAt(0) === '' ? '' : (s.parts[i + 1]?.text ?? '').toLowerCase().normalize('NFC');
      const base = next.normalize('NFD').replace(/[̣̀́̃̉]/g, '').normalize('NFC');
      ok(RULE[p.id](part.ans, base), `${p.id}: "${w}" sai luật chính tả`);
    }
  }
  for (const x of p.pics) ok(existsSync(`public/emoji/${x.pic}.png`), `${p.id}: thiếu hình ${x.pic}`);
  for (const o of p.options) ok(p.pics.some((x) => splitWord(x.w).ans[0] === o) || o === 'ngh' || o === 'gh', `${p.id}: có tranh cho âm ${o}`);
  ok(new Set(p.words).size === p.words.length, `${p.id}: từ không trùng`);
}
// bộ sinh phiếu
const a = makeSheet({ pairs: ['c-k'], picCount: 12, wordCount: 12, copy: true, seed: 1 });
const b = makeSheet({ pairs: ['c-k'], picCount: 12, wordCount: 12, copy: true, seed: 2 });
const items = (s: typeof a) => s.sections.flatMap((x) => x.items.map((i) => i.full)).join('|');
ok(items(a) !== items(b), 'hai phiếu khác nhau');
ok(items(a) === items(makeSheet({ pairs: ['c-k'], picCount: 12, wordCount: 12, copy: true, seed: 1 })), 'cùng số phiếu ra cùng phiếu');
const pics = a.sections[0].items.map((i) => i.ans[0]);
ok(pics.length === 12 && Math.abs(pics.filter((x) => x === 'c').length - 6) <= 1, `chia đều c/k (${pics.join('')})`);
const many = makeSheet({ pairs: ['s-x', 'g-gh', 'ng-ngh', 'h-th-kh'], picCount: 4, wordCount: 8, copy: true, seed: 9 });
ok(many.sections.length === 9 && many.sections.at(-1)!.kind === 'copy', 'nhiều cặp âm: 2 bài mỗi cặp + tập chép');
const h = sheetHtml(many, { withKey: true, school: 'Trường TH A', className: '1A1', teacher: 'Nguyễn Thị B' });
ok(!/\[|\]/.test(h.replace(/<style[\s\S]*<\/style>/, '').replace(/<[^>]+>/g, '')) && h.includes('ĐÁP ÁN') && h.includes('Trường: <b>Trường TH A</b>') && h.includes('Giáo viên: <b>Nguyễn Thị B</b>'), 'HTML: đề, đáp án, thông tin giáo viên nhập');
ok(sheetHtml(many, {}).includes('Trường: ……'), 'để trống thông tin → dòng chấm');
const docx = htmlToDocx(h, new Map());
ok(docx.length > 3000, 'xuất .docx');
console.log(`check:spelling ${pass}/${pass + fail}`);
if (fail) process.exit(1);
