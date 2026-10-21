// Kiểm tra bài "đếm hình" nâng cao lớp 2–5: npm run check:count-shapes
// 1) Bộ đếm từ hình vẽ (src/lib/geometry-count.ts) khớp công thức của từng họ hình ở mọi kích cỡ.
// 2) Mỗi bài hình học lớp 2–5 có câu đếm hình ở mức 4–5, đáp án đúng bằng số đếm được từ hình vẽ.
import { analyze, anglesAt, shapesOf } from '../src/lib/geometry-count';
import { countOf, fan, grid, midTriangle, paraGrid, rays, rectTwoDiag, squareDiag, squareDiagMid, strip, type Built } from '../src/lib/practice/count-shapes';
import { makeRng } from '../src/lib/practice/rng';
import { generateOne, questionById } from '../src/lib/practice';
import { T2_LESSONS, t2Id } from '../src/lib/content/toan2-plan';
import { T3_LESSONS, t3Id } from '../src/lib/content/toan3-plan';
import { T4_LESSONS, t4Id } from '../src/lib/content/toan4-plan';
import { T5_LESSONS, t5Id } from '../src/lib/content/toan5-plan';

let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) pass++; else { fail++; console.log('✗', m); } };
const same = (b: Built, m: string) => ok(countOf(b) === b.formula, `${m}: đếm ${countOf(b)} ≠ công thức ${b.formula}`);

// 1) họ hình × kích cỡ
for (let k = 0; k <= 5; k++) {
  same(fan(k), `tam giác chung đỉnh, ${k} đoạn`);
  same(fan(k, 0, 'segment', true), `đoạn thẳng, ${k} điểm giữa`);
  for (let h = 1; h <= 3; h++) { same(fan(k, h), `tam giác, ${k} đoạn, ${h} đường ngang`); same(fan(k, h, 'trapezoid'), `hình thang, ${k} đoạn, ${h} đường ngang`); }
  if (k >= 1) { same(strip(k, 'quad'), `tứ giác trong hình chữ nhật ${k} vạch`); same(strip(k, 'rectangle'), `hình chữ nhật ${k} vạch`); }
}
for (let a = 1; a <= 4; a++) for (let b = 1; b <= 5; b++) { same(grid(a, b, 'square'), `hình vuông lưới ${a}×${b}`); same(grid(a, b, 'rectangle'), `hình chữ nhật lưới ${a}×${b}`); same(paraGrid(a, b), `hình bình hành ${a}×${b}`); }
for (let n = 2; n <= 7; n++) for (let s = 1; s <= 20; s++) same(rays(n, makeRng(s)), `${n} tia chung gốc (seed ${s})`);
same(squareDiag(), 'hình vuông 2 đường chéo'); same(squareDiagMid(), 'hình vuông chéo + trung bình (tam giác)'); same(squareDiagMid('rectangle'), 'hình vuông chéo + trung bình (hình chữ nhật)');
same(midTriangle(), 'tam giác nối trung điểm'); same(rectTwoDiag(), 'hai hình vuông có đường chéo');
// các con số kinh điển
ok(shapesOf(analyze(squareDiagMid().segs), 'triangle').length === 16, 'hình vuông kẻ 2 chéo + 2 đường trung bình: 16 tam giác');
ok(shapesOf(analyze(grid(3, 3, 'square').segs), 'square').length === 14, 'lưới 3×3: 14 hình vuông');
ok(shapesOf(analyze(grid(2, 2, 'rectangle').segs), 'rectangle').length === 9, 'lưới 2×2: 9 hình chữ nhật');
ok(anglesAt(analyze(rays(5, makeRng(1)).segs), 150, 190) === 10, '5 tia chung gốc: 10 góc');

// 2) bài hình học có câu đếm hình
const LESSONS: [number, string, { no: number; topics: string[] }[], (n: number) => string, string[]][] = [
  [2, 'toan', T2_LESSONS, t2Id, ['geo', 'polyline', 'quad']],
  [3, 'toan', T3_LESSONS, t3Id, ['geoReview', 'angle', 'shapes', 'perimeter', 'area']],
  [4, 'toan', T4_LESSONS, t4Id, ['angleMeasure', 'angleKind', 'perpendicular', 'parallel', 'parallelogram']],
  [5, 'toan', T5_LESSONS, t5Id, ['triangle', 'trapezoid', 'geoRev']],
];
let total = 0;
for (const [g, , list, id, topics] of LESSONS) {
  const geo = list.filter((l) => l.topics.some((t) => topics.includes(t)));
  ok(geo.length >= 3, `lớp ${g}: có bài hình học (${geo.length})`);
  for (const l of geo) {
    const pid = `lt-${id(l.no)}`;
    let found = 0;
    for (const lv of [4, 5] as const) for (let s = 1; s <= 120; s++) {
      const q = generateOne(pid, s, lv);
      if (!q || !q.skill?.startsWith('dem_hinh_')) continue;
      found++; total++;
      const f = q.figure;
      ok(f?.kind === 'lines' && f.segs.length >= 3, `${pid}: có hình vẽ`);
      if (f?.kind !== 'lines') continue;
      const ask = q.skill.replace('dem_hinh_', '');
      const a = analyze(f.segs);
      const n = ask === 'segment' ? a.segments : ask === 'angle' ? anglesAt(a, 150, 190) : shapesOf(a, ask as Parameters<typeof shapesOf>[1]).length;
      const key = q.type === 'single_choice' ? (q.key as { correct: string }).correct : (q.key as { answers: string[][] }).answers[0][0];
      ok(String(n) === key, `${pid} seed ${s} mức ${lv}: đáp án ${key}, đếm lại được ${n}`);
      ok(q.explanation?.includes(String(n)), `${pid}: lời giải có kết quả ${n}`);
      if (q.type === 'single_choice') ok(new Set(q.options).size === q.options.length && q.options.includes(key), `${pid}: lựa chọn hợp lệ`);
    }
    ok(found >= 10, `lớp ${g} bài ${l.no}: có câu đếm hình ở mức 4–5 (${found}/240)`);
  }
}
ok(questionById('lt-' + t5Id(26) + '~7~x5') !== null, 'chấm lại theo mã câu');
console.log(`  (${total} câu đếm hình đã kiểm)`);
console.log(`check:count-shapes ${pass}/${pass + fail}`);
if (fail) process.exit(1);
