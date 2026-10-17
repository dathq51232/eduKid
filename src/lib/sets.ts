// "Đổi bộ câu hỏi" và "Chọn mức độ" cho MỌI bài học.
//
// - Không có seed: dùng bộ câu gốc của bài.
// - Có seed: tạo một bộ 10 câu mới theo mức độ em chọn; cùng (bài, seed, mức) luôn ra cùng một bộ, nên tải lại trang
//   hay bấm "Làm lại" vẫn đúng bộ đó, còn "Đổi bộ câu hỏi" là seed mới.
//
// Nguồn câu:
//   - Toán (bài theo sách): sinh mới bằng bộ sinh ngẫu nhiên của chính bài (src/lib/practice) — đủ cả L1 → L5.
//   - Các bài khác: câu của bài đó + câu của các bài HỌC TRƯỚC cùng môn + câu ngân hàng (đề ôn) nằm trong phạm vi
//     kiến thức của bài (kiểm bằng scopeProblems — không vượt trước). Đề ôn tập lấy từ toàn bộ học kì của môn.

import { CONTENT } from './content';
import { scopeProblems } from './content/scope';
import type { ContentLesson, Level } from './content/types';
import { generateOne, isPracticeId, practiceIdFor, signature, type GeneratedQuestion } from './practice';
import { makeRng, type Rng } from './practice/rng';

import { MUC, type Muc } from './basics';
export { MUC, MUC_LIST, parseMuc, type Muc } from './basics';
export const SET_SIZE = 10;

export type SetPick = { kind: 'demo'; id: string } | { kind: 'gen'; q: GeneratedQuestion };
export type BuiltSet = { picks: SetPick[]; note?: string };
/** Câu cần tránh (câu của bộ trước): mã câu soạn sẵn, đề câu, chữ ký câu sinh ngẫu nhiên */
export type Avoid = { ids: Set<string>; prompts: Set<string>; sigs: Set<string>; cores: Set<string> };
const NO_AVOID: Avoid = { ids: new Set(), prompts: new Set(), sigs: new Set(), cores: new Set() };
/**
 * "Lõi" của câu: đề + hình + đáp án (bỏ qua thứ tự/lựa chọn nhiễu). Hai câu cùng lõi là CÙNG một câu với học sinh
 * (vd. "\"bag\" nghĩa là gì?" chỉ khác lựa chọn sai) nên không được lặp. Câu cùng đề chung ("Tranh vẽ gì?")
 * nhưng khác tranh/đáp án thì khác lõi.
 */
export const coreSig = (q: { prompt: string; figure?: unknown; key?: unknown }) => JSON.stringify([q.prompt, q.figure ?? null, q.key ?? null]);

const LEVELS: Level[] = [1, 2, 3, 4, 5];
const demoId = (lessonId: string, index: number) => `${lessonId}-q${index + 1}`; // trùng cách đặt mã ở demo-data.ts

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Câu được phép dùng cho từng bài (tính một lần rồi nhớ)
// ---------------------------------------------------------------------------
type Entry = { id: string; level: Level; own: boolean; prompt: string; core: string };
const poolCache = new Map<string, Entry[]>();

export function eligiblePool(lessonId: string): Entry[] {
  const hit = poolCache.get(lessonId);
  if (hit) return hit;
  const target = CONTENT.find((l) => l.id === lessonId);
  if (!target) return [];
  const isReview = (l: ContentLesson) => l.kind === 'review';
  // Chỉ trong cùng học kì: đề ôn học kì 1 không lấy câu của học kì 2 (chưa học)
  const same = CONTENT.filter((l) => l.subject === target.subject && l.grade === target.grade && l.semester === target.semester);
  const bookOrder = same.filter((l) => !isReview(l));
  const posOf = (l: ContentLesson) => bookOrder.indexOf(l);
  const out: Entry[] = [];
  const seenPrompt = new Set<string>();
  for (const l of same) {
    l.questions.forEach((q, i) => {
      let ok: boolean;
      if (isReview(target)) ok = true; // đề ôn: cả học kì
      else if (!isReview(l)) ok = posOf(l) <= posOf(target); // bài này hoặc bài học trước
      else ok = scopeProblems(q, target.scope).length === 0; // câu ngân hàng: phải nằm trong phạm vi bài
      if (!ok || seenPrompt.has(q.prompt)) return;
      seenPrompt.add(q.prompt);
      out.push({ id: demoId(l.id, i), level: q.level, own: l.id === target.id, prompt: q.prompt, core: coreSig(q) });
    });
  }
  poolCache.set(lessonId, out);
  return out;
}

/** Bộ sinh câu ngẫu nhiên dùng cho bài (đề ôn tập dùng bộ sinh của bài cuối học kì cùng môn) */
const REVIEW_GENERATOR: Record<string, string> = {
  toan: 'lt-toan1-kntt-b20',
  'tieng-viet': 'lt-tv1-kntt-t17',
  'tieng-anh': 'lt-ta1-gs-review2',
};
export function generatorFor(lessonId: string): string | null {
  if (isPracticeId(lessonId)) return lessonId;
  const direct = practiceIdFor(lessonId);
  if (direct) return direct;
  const l = CONTENT.find((x) => x.id === lessonId);
  return l?.kind === 'review' ? REVIEW_GENERATOR[l.subject] ?? null : null;
}
/** Toán (bài theo sách): chỉ dùng câu sinh mới; các bài khác: trộn câu soạn sẵn với câu sinh mới */
const generatorOnly = (lessonId: string) => isPracticeId(lessonId) || /^toan\d-kntt-/.test(lessonId);

// ---------------------------------------------------------------------------
// Tạo bộ câu
// ---------------------------------------------------------------------------
export function buildSet(lessonId: string, seed: number, muc: Muc, avoid: Avoid = NO_AVOID): BuiltSet {
  const r = makeRng((seed ^ hash(`${lessonId}|${muc}`)) >>> 0);
  const quota = MUC[muc].quota;
  const gen = generatorFor(lessonId);
  if (gen && generatorOnly(lessonId)) return generatedSet(r, gen, quota, avoid);
  return mixedSet(r, lessonId, muc, gen, avoid);
}

const REPEAT_NOTE = 'Bài này còn ít dạng câu nên có vài câu giống bộ trước.';

function generatedSet(r: Rng, gen: string, quota: Partial<Record<Level, number>>, avoid: Avoid): BuiltSet {
  const picks: SetPick[] = [];
  const seen = new Set<string>();
  let repeated = 0;
  for (const lv of LEVELS) {
    const need = quota[lv] ?? 0;
    let got = 0;
    // Lượt 1: tránh câu của bộ trước; lượt 2 (hiếm, bài ít dạng câu): cho phép lặp để đủ câu
    for (const allowRepeat of [false, true]) {
      for (let tries = 0; got < need && tries < 60; tries++) {
        const q = generateOne(gen, r.int(1, 2147483646), lv);
        if (!q) continue;
        const sig = signature(q);
        const core = coreSig(q);
        if (seen.has(sig) || seen.has(core)) continue;
        const old = avoid.sigs.has(sig) || avoid.cores.has(core);
        if (old && !allowRepeat) continue;
        seen.add(sig);
        seen.add(core);
        picks.push({ kind: 'gen', q });
        if (old) repeated++;
        got++;
      }
    }
  }
  return { picks, note: repeated ? REPEAT_NOTE : undefined };
}

/**
 * Trộn: mỗi cấp độ lấy khoảng một nửa từ kho câu soạn sẵn (ưu tiên câu của chính bài), còn lại sinh mới.
 * Kho soạn sẵn thiếu câu khó (thường gặp ở tuần/unit đầu) thì bộ sinh bù đủ, nên mức Khá/Giỏi luôn đúng cấp độ.
 */
function mixedSet(r: Rng, lessonId: string, muc: Muc, gen: string | null, avoid: Avoid): BuiltSet {
  // Câu soạn sẵn của bộ trước không dùng lại
  const pool = eligiblePool(lessonId).filter((e) => !avoid.ids.has(e.id) && !avoid.prompts.has(e.prompt) && !avoid.cores.has(e.core));
  const picks: SetPick[] = [];
  const seenPrompt = new Set<string>();
  const seenSig = new Set<string>();
  let deficit = 0;
  const genOne = (lv: Level): GeneratedQuestion | null => {
    if (!gen) return null;
    for (let t = 0; t < 30; t++) {
      const q = generateOne(gen, r.int(1, 2147483646), lv);
      if (!q) return null;
      const sig = signature(q);
      const core = coreSig(q);
      if (seenSig.has(sig) || seenSig.has(core) || avoid.sigs.has(sig) || avoid.cores.has(core) || seenPrompt.has(q.prompt + JSON.stringify(q.left ?? q.options))) continue;
      if (seenPrompt.has(q.prompt) && !q.figure && !q.optionFigures && q.type !== 'ordering') continue; // trùng đề với câu soạn sẵn trong bộ
      seenSig.add(sig);
      seenSig.add(core);
      return q;
    }
    return null;
  };
  for (const lv of LEVELS) {
    const need = MUC[muc].quota[lv] ?? 0;
    if (!need) continue;
    const own = r.shuffle(pool.filter((e) => e.level === lv && e.own));
    const other = r.shuffle(pool.filter((e) => e.level === lv && !e.own));
    const fromBank = gen ? Math.min(need, r.int(Math.floor(need / 2), Math.ceil(need / 2))) : need;
    let got = 0;
    for (const e of [...own, ...other]) {
      if (got >= fromBank) break;
      if (seenPrompt.has(e.prompt) || seenSig.has(e.core)) continue;
      seenPrompt.add(e.prompt);
      seenSig.add(e.core);
      picks.push({ kind: 'demo', id: e.id });
      got++;
    }
    while (got < need) {
      const q = genOne(lv);
      if (!q) break;
      picks.push({ kind: 'gen', q });
      got++;
    }
    // Bộ sinh không ra được câu: lấy tiếp từ kho soạn sẵn
    for (const e of [...own, ...other]) {
      if (got >= need) break;
      if (seenPrompt.has(e.prompt) || seenSig.has(e.core)) continue;
      seenPrompt.add(e.prompt);
      seenSig.add(e.core);
      picks.push({ kind: 'demo', id: e.id });
      got++;
    }
    deficit += need - got;
  }
  if (deficit <= 0) return { picks };
  // Vẫn thiếu: bù bằng câu mức thấp hơn (có ghi chú)
  const min = MUC[muc].minLevel;
  let added = 0;
  for (const lv of [...LEVELS].reverse()) {
    if (deficit <= 0) break;
    if (lv >= min && (MUC[muc].quota[lv] ?? 0) > 0) continue;
    for (const e of r.shuffle(pool.filter((x) => x.level === lv))) {
      if (deficit <= 0) break;
      if (seenPrompt.has(e.prompt) || seenSig.has(e.core)) continue;
      seenPrompt.add(e.prompt);
      seenSig.add(e.core);
      picks.push({ kind: 'demo', id: e.id });
      deficit--;
      added++;
    }
  }
  // Hết câu mới thật sự (bài rất ít câu, không có bộ sinh): đành dùng lại câu của bộ trước để đủ bộ
  let repeated = 0;
  if (deficit > 0) {
    for (const e of r.shuffle(eligiblePool(lessonId))) {
      if (deficit <= 0) break;
      if (seenPrompt.has(e.prompt) || seenSig.has(e.core)) continue;
      seenPrompt.add(e.prompt);
      seenSig.add(e.core);
      picks.push({ kind: 'demo', id: e.id });
      deficit--;
      repeated++;
    }
  }
  const notes = [
    added && min > 1 ? `Bài này chưa có đủ câu khó theo mức ${MUC[muc].name}, nên có thêm ${added} câu mức thấp hơn.` : '',
    repeated ? REPEAT_NOTE : '',
  ].filter(Boolean);
  return { picks, note: notes.join(' ') || undefined };
}
