// Kiểm tra bố cục slide tự sinh trên TOÀN BỘ ngân hàng bài: chữ tràn khung, chữ chồng nhau, chữ quá nhỏ, vật ra ngoài trang.
// Chạy: npm run check:deck-all  (thêm --verbose để in ví dụ từng lỗi)
import { CONTENT } from '../src/lib/content';
import { knowledgeFor } from '../src/lib/content/knowledge';
import { MASCOTS, PHASES, buildPlan, planSlides } from '../src/lib/deck/fromLesson';
import { THEME_SETS, makeSet } from '../src/lib/deck/theme-sets';
import { SLIDE_TEMPLATES } from '../src/lib/deck/templates';
import { fits, quizSizes } from '../src/lib/deck/fit';
import { pickScene } from '../src/lib/deck/scenes';
import { LAYOUTS, relayout, relayoutBlocker } from '../src/lib/deck/relayout';
import { SW, SH, quizText, quizImage, type El, type Slide } from '../src/lib/deck/types';

const verbose = process.argv.includes('--verbose');
type Issue = { kind: string; where: string; detail: string };
const errors: Issue[] = [], warns: Issue[] = [];
const MIN_ERR = 20, MIN_WARN = 28;

const box = (e: El) => ({ x: e.x, y: e.y, r: e.x + e.w, b: e.y + e.h });
const hit = (a: El, b: El) => { const p = box(a), q = box(b); return p.x < q.r - 4 && p.r > q.x + 4 && p.y < q.b - 4 && p.b > q.y + 4; };
const isRead = (e: El) => (e.kind === 'text' && !!e.text.trim()) || e.kind === 'quiz' || e.kind === 'sort' || e.kind === 'drop';

function checkSlide(s: Slide, where: string) {
  const els = s.els.filter((e) => !e.hide);
  for (const e of els) {
    if (isRead(e) && (e.x < -2 || e.y < -2 || e.x + e.w > SW + 2 || e.y + e.h > SH + 2)) errors.push({ kind: 'ra ngoài trang', where, detail: `${e.kind} @${e.x},${e.y} ${e.w}×${e.h}` });
    if (e.kind === 'text' && e.text.trim()) {
      const pad = e.bg ? { w: Math.min(52, e.w * 0.3), h: Math.min(24, e.h * 0.3) } : { w: 0, h: 0 }; // ô nhỏ (huy hiệu số): đệm co lại
      // ước lượng sát chữ Baloo/Quicksand thật (0,5 em/ký tự), chỉ báo khi tràn rõ (> 15%)
      if (!fits(e.text, e.w - pad.w, (e.h - pad.h) * 1.15, e.size, 1.15, 0.5)) errors.push({ kind: 'chữ tràn khung', where, detail: `"${e.text.slice(0, 50)}" cỡ ${e.size} trong ${e.w}×${e.h}` });
      if (e.size < MIN_ERR) errors.push({ kind: `chữ < ${MIN_ERR}px`, where, detail: `"${e.text.slice(0, 40)}" cỡ ${e.size}` });
      else if (e.size < MIN_WARN) warns.push({ kind: `chữ < ${MIN_WARN}px`, where, detail: `"${e.text.slice(0, 40)}" cỡ ${e.size}` });
    }
    if (e.kind === 'shape' && e.text?.trim() && !e.drag && e.shape !== 'mystery') {
      const sz = e.size ?? 40;
      if (sz < MIN_ERR) errors.push({ kind: `chữ < ${MIN_ERR}px`, where, detail: `[thẻ] "${e.text.slice(0, 40)}" cỡ ${sz}` });
      else if (sz < MIN_WARN) warns.push({ kind: `chữ trong thẻ < ${MIN_WARN}px`, where, detail: `"${e.text.slice(0, 40)}" cỡ ${sz}` });
    }
    if (e.kind === 'quiz') {
      const z = quizSizes({ w: e.w, h: e.h, q: e.q, opts: e.opts.map(quizText), cols: e.cols, img: e.opts.some((o) => !!quizImage(o)) });
      if (!z.ok) errors.push({ kind: 'trắc nghiệm tràn khung', where, detail: `"${e.q.slice(0, 50)}" (${e.opts.length} lựa chọn)` });
      else if (z.qs < 34) warns.push({ kind: 'trắc nghiệm chữ nhỏ', where, detail: `"${e.q.slice(0, 40)}" câu hỏi ${z.qs}px` });
    }
  }
  // chữ chồng chữ (bỏ qua vật kéo thả và miếng che — cố ý đè lên)
  const texts = els.filter((e) => isRead(e) && !e.drag);
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    if (hit(texts[i], texts[j])) errors.push({ kind: 'chữ chồng nhau', where, detail: `${label(texts[i])} ↔ ${label(texts[j])}` });
  }
}
const label = (e: El) => (e.kind === 'text' ? `"${e.text.slice(0, 24)}"` : e.kind === 'quiz' ? `[trắc nghiệm]` : `[${e.kind}]`);

let decks = 0, pages = 0, dividers = 0, relaid = 0, kept = 0, relaidPages = 0;
/** thử cả 4 bố cục của nút "Bố cục khác" trên trang đổi được */
function checkRelayout(s: Slide, where: string) {
  if (relayoutBlocker(s)) { kept++; return; }
  let any = false;
  for (let k = 0; k < LAYOUTS.length; k++) { const r = relayout(s, k); if (r && r.used === k) { any = true; relaid++; checkSlide(r.slide, `${where} · bố cục ${r.layout.label}`); } }
  if (any) relaidPages++; else kept++;
}
const t0 = Date.now();
for (const l of CONTENT) {
  const sc = pickScene(`${l.title} ${l.questions.map((q) => q.prompt).join(' ')}`, 'garden');
  const p = buildPlan(l, knowledgeFor(l.id), { mascot: MASCOTS[0].id, warmup: 'quiz', scene: sc, seed: 1, tiet: 1 });
  const on = new Set(PHASES.flatMap((ph) => p.cands.filter((x) => x.phase === ph.id).slice(0, p.defaults[ph.id]).map((x) => x.key)));
  // kiểm cả các trang không bật mặc định (giáo viên có thể bật)
  for (const c of p.cands) checkSlide(c.slide, `${l.id} · ${c.title.slice(0, 40)}`);
  const slides = planSlides(p, on, {}, { mascot: MASCOTS[0].src, math: l.subject === 'toan' });
  slides.forEach((s, i) => checkRelayout(s, `${l.id} · trang ${i + 1}`));
  decks++; pages += slides.length;
  dividers += slides.filter((s) => s.els.some((e) => e.role === 'divider') && s.els.filter(isRead).length <= 2).length;
}
for (const t of THEME_SETS) makeSet(t.id, { title: 'Phép cộng có nhớ trong phạm vi 100', sub: 'Toán 2 · Tiết 1' }).forEach((s, i) => checkSlide(s, `bộ ${t.name} · trang ${i + 1}`));
for (const t of SLIDE_TEMPLATES) t.make().forEach((s, i) => { checkSlide(s, `mẫu ${t.title} · trang ${i + 1}`); checkRelayout(s, `mẫu ${t.title}`); });

const group = (xs: Issue[]) => Object.entries(xs.reduce<Record<string, Issue[]>>((m, x) => ((m[x.kind] ??= []).push(x), m), {}));
console.log(`Bố cục khác: ${relaidPages} trang có ít nhất một bố cục khác đạt (${relaid} bố cục đã kiểm); ${kept} trang giữ nguyên (kéo thả hoặc đã chật)`);
console.log(`Đã sinh ${decks} bài (${pages} trang, TB ${(pages / decks).toFixed(1)} trang/bài, trang chia ${dividers}) trong ${((Date.now() - t0) / 1000).toFixed(1)} s`);
for (const [k, xs] of group(errors)) { console.log(`✗ ${k}: ${xs.length}`); xs.slice(0, verbose ? 8 : 2).forEach((x) => console.log(`    ${x.where} — ${x.detail}`)); }
for (const [k, xs] of group(warns)) {
  console.log(`⚠ ${k}: ${xs.length}`);
  if (!verbose) continue;
  // gom theo nguồn (đầu câu chữ) để biết sửa chỗ nào trong bộ sinh
  const by = new Map<string, number>();
  for (const x of xs) { const key = x.detail.slice(0, 34); by.set(key, (by.get(key) ?? 0) + 1); }
  [...by].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([t, n]) => console.log(`    ${n} × ${t}`));
}
console.log(errors.length ? `\n✗ ${errors.length} lỗi bố cục` : '\n✓ Không có lỗi bố cục');
process.exit(errors.length ? 1 : 0);
