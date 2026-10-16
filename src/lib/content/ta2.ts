// TIẾNG ANH 2 (Global Success) — Unit 1–16, Fun time 1–4 (sau Unit 2, 6, 10, 14) và Review 1–4 (sau Unit 4, 8, 12, 16),
// theo trình tự Book map của sách. Bộ câu gốc mỗi bài (8 câu, L1 → L5) rút từ bộ sinh câu Tiếng Anh 2
// (src/lib/practice/ta2g.ts) với hạt giống cố định — câu tự đặt, không chép bài tập của sách.

import { makeRng } from '../practice/rng';
import { TA2G_POOL, ta2Context, type TA2Ctx } from '../practice/ta2g';
import { GS2_UNITS } from './ta2-vocab';
import type { ContentLesson, ContentQuestion, Level } from './types';

const BOOK = 'Global Success';
const TARGET: Level[] = [1, 1, 2, 2, 3, 3, 4, 5];

export type TA2Spec = { id: string; kind: 'unit' | 'fun' | 'review'; no: number; unit: number; from: number; sortNo: number };
const pad = (n: number) => String(n).padStart(2, '0');

export const TA2_SPECS: TA2Spec[] = (() => {
  const out: TA2Spec[] = [];
  let s = 2200;
  for (let u = 1; u <= 16; u++) {
    out.push({ id: `ta2-gs-u${pad(u)}`, kind: 'unit', no: u, unit: u, from: u, sortNo: ++s });
    const fun = [2, 6, 10, 14].indexOf(u);
    if (fun >= 0) out.push({ id: `ta2-gs-fun${fun + 1}`, kind: 'fun', no: fun + 1, unit: u, from: Math.max(1, u - 3), sortNo: ++s });
    const rev = [4, 8, 12, 16].indexOf(u);
    if (rev >= 0) out.push({ id: `ta2-gs-review${rev + 1}`, kind: 'review', no: rev + 1, unit: u, from: u - 3, sortNo: ++s });
  }
  return out;
})();
export const ta2SpecCtx = (sp: TA2Spec): TA2Ctx => ta2Context(sp.unit, sp.from);

function baseQuestions(sp: TA2Spec): ContentQuestion[] {
  const ctx = ta2SpecCtx(sp);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  TARGET.forEach((lv, slot) => {
    const r = makeRng(sp.sortNo * 7919 + slot * 104729);
    for (let i = 0; i < 300; i++) {
      const g = r.pick(TA2G_POOL[lv])(r, ctx, lv);
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

const HK = (u: number) => (u <= 8 ? 1 : 2);
const lesson = (sp: TA2Spec): ContentLesson => {
  const v = GS2_UNITS[sp.unit];
  const part = { code: `GS2.P${Math.ceil(sp.unit / 4)}`, title: `Học kì ${HK(sp.unit)} · Unit ${Math.ceil(sp.unit / 4) * 4 - 3}–${Math.ceil(sp.unit / 4) * 4}` };
  const common = { subject: 'tieng-anh' as const, grade: 2 as const, semester: HK(sp.unit) as 1 | 2, book: BOOK, unit: part, scope: { kind: 'english' as const, unit: sp.unit, book: 'gs2' as const }, questions: baseQuestions(sp) };
  if (sp.kind === 'unit') {
    const pat = [v.pattern.q, ...v.pattern.a].filter(Boolean).join(' – ');
    return { ...common, id: sp.id, ref: `Unit ${sp.unit}`, topicCode: 'A2.LANG', title: `Unit ${sp.unit}. ${v.title}`,
      description: `${v.vi}. Âm/chữ "${v.sound === 'a_e' ? 'a…e' : v.sound}": ${v.words.map((w) => w.w).join(', ')}. Mẫu câu: ${pat}` };
  }
  const label = sp.kind === 'fun' ? `Fun time ${sp.no}` : `Review ${sp.no}`;
  return { ...common, id: sp.id, ref: label, topicCode: 'A2.LANG', title: `${label}. Ôn tập Unit ${sp.from}–${sp.unit}`,
    description: `${sp.kind === 'fun' ? 'Vui học' : 'Ôn tập'}: từ vựng, âm và mẫu câu Unit ${sp.from}–${sp.unit}.` };
};

export const TA2_HK1: ContentLesson[] = TA2_SPECS.filter((s) => s.unit <= 8).map(lesson);
export const TA2_HK2: ContentLesson[] = TA2_SPECS.filter((s) => s.unit > 8).map(lesson);
