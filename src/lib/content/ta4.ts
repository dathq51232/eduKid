// TIẾNG ANH 4 (Global Success) — Unit 1–20 và Review 1–4 (sau Unit 5, 10, 15, 20), theo trình tự Book map của sách.
// Bộ câu gốc mỗi bài (8 câu, L1 → L5) rút từ bộ sinh câu Tiếng Anh 4 (src/lib/practice/ta4g.ts) với hạt giống cố định —
// câu tự đặt, không chép bài tập của sách.

import { makeRng } from '../practice/rng';
import { TA4G_POOL, ta4Context, type TA4Ctx } from '../practice/ta4g';
import { GS4_UNITS } from './ta4-vocab';
import type { ContentLesson, ContentQuestion, Level } from './types';

const BOOK = 'Global Success';
const TARGET: Level[] = [1, 1, 2, 2, 3, 3, 4, 5];

export type TA4Spec = { id: string; kind: 'unit' | 'review'; no: number; unit: number; from: number; sortNo: number };
const pad = (n: number) => String(n).padStart(2, '0');

export const TA4_SPECS: TA4Spec[] = (() => {
  const out: TA4Spec[] = [];
  let s = 4200;
  for (let u = 1; u <= 20; u++) {
    out.push({ id: `ta4-gs-u${pad(u)}`, kind: 'unit', no: u, unit: u, from: u, sortNo: ++s });
    if (u % 5 === 0) out.push({ id: `ta4-gs-review${u / 5}`, kind: 'review', no: u / 5, unit: u, from: u - 4, sortNo: ++s });
  }
  return out;
})();
export const ta4SpecCtx = (sp: TA4Spec): TA4Ctx => ta4Context(sp.unit, sp.from);

function baseQuestions(sp: TA4Spec): ContentQuestion[] {
  const ctx = ta4SpecCtx(sp);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  TARGET.forEach((lv, slot) => {
    const r = makeRng(sp.sortNo * 7919 + 4 + slot * 104729);
    for (let i = 0; i < 300; i++) {
      const g = r.pick(TA4G_POOL[lv])(r, ctx, lv);
      if (!g) continue;
      // câu soạn sẵn không kèm hình: đưa tranh (emoji) lên đầu đề như các bài Tiếng Anh 1
      const { figure } = g;
      const rest: Partial<typeof g> = { ...g };
      delete rest.figure; delete rest.optionFigures; delete rest.blanks; delete rest.statements;
      if (figure && figure.kind !== 'objects') continue;
      const icon = figure?.kind === 'objects' ? figure.groups.map((x) => x.icon.repeat(x.count)).join(' ') + ' ' : '';
      const q = { ...rest, prompt: icon + g.prompt } as ContentQuestion;
      if (seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push(q);
      return;
    }
  });
  return out;
}

const HK = (u: number) => (u <= 10 ? 1 : 2);
const lesson = (sp: TA4Spec): ContentLesson => {
  const v = GS4_UNITS[sp.unit];
  const part = { code: `GS4.P${Math.ceil(sp.unit / 5)}`, title: `Học kì ${HK(sp.unit)} · Unit ${Math.ceil(sp.unit / 5) * 5 - 4}–${Math.ceil(sp.unit / 5) * 5}` };
  const common = { subject: 'tieng-anh' as const, grade: 4 as const, semester: HK(sp.unit) as 1 | 2, book: BOOK, unit: part, scope: { kind: 'english' as const, unit: sp.unit, book: 'gs4' as const }, questions: baseQuestions(sp) };
  if (sp.kind === 'unit') {
    const pat = v.frames.slice(0, 2).map(([q, a]) => (q ? `${q} – ${a}` : a)).join(' / ');
    return { ...common, id: sp.id, ref: `Unit ${sp.unit}`, topicCode: 'A4.LANG', title: `Unit ${sp.unit}. ${v.title}`,
      description: `${v.vi}. Từ vựng: ${v.words.map((w) => w.w).join(', ')}. Mẫu câu: ${pat}` };
  }
  const label = `Review ${sp.no}`;
  return { ...common, id: sp.id, ref: label, topicCode: 'A4.LANG', title: `${label}. Ôn tập Unit ${sp.from}–${sp.unit}`,
    description: `Ôn tập: từ vựng, chữ và mẫu câu Unit ${sp.from}–${sp.unit}.` };
};

export const TA4_HK1: ContentLesson[] = TA4_SPECS.filter((s) => s.unit <= 10).map(lesson);
export const TA4_HK2: ContentLesson[] = TA4_SPECS.filter((s) => s.unit > 10).map(lesson);
