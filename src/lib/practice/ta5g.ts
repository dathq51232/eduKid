// BỘ SINH CÂU NGẪU NHIÊN — TIẾNG ANH 5 (Global Success), Unit 1–20 + Review 1–4.
// Chỉ dùng từ vựng và mẫu câu của các unit ĐÃ HỌC (Tiếng Anh 1–4 + Tiếng Anh 5 đến unit hiện tại — kiểm bằng gs5Learned).
// Câu mẫu do EduChain Kids tự đặt theo khung mẫu câu ở Book map (content/ta5-vocab.ts), không chép bài tập của sách.
// Các dạng bài giống Tiếng Anh 2 (practice/ta2g.ts): tranh → từ, từ ↔ nghĩa, chữ trọng tâm, điền chữ, nối, xếp chữ,
// hoàn thành câu, xếp từ thành câu, câu → nghĩa, chọn câu trả lời, nối hỏi – đáp, số 11–20 (từ Unit 11).

import type { Level } from '../content/types';
import { GS2_UNITS } from '../content/ta2-vocab';
import { GS3_UNITS } from '../content/ta3-vocab';
import { GS4_UNITS } from '../content/ta4-vocab';
import { GS5_UNITS } from '../content/ta5-vocab';
import type { Figure } from '../figures';
import { Q, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { taContext } from './ta1';

export type W5 = { w: string; vi: string; emoji?: string; unit: number; gs1?: boolean };
type Frame = { unit: number; q?: string; a: string; vi: string; key: string; emoji?: string };
export type TA5Ctx = { unit: number; learned: W5[]; fresh: W5[]; all: W5[]; frames: Frame[]; sounds: number[] };
export type TA5Template = (r: Rng, c: TA5Ctx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, l: Level, e: string, s?: string) => ({ o, f, l, e, s: s ?? (l >= 3 ? e : undefined) });
const one = (w: { emoji?: string }): Figure => ({ kind: 'objects', groups: [{ icon: w.emoji as string, count: 1 }], alt: 'Tranh một sự vật' });
const blankLast = (s: string, word: string) => {
  const i = s.lastIndexOf(word);
  return i < 0 ? s : s.slice(0, i) + '___' + s.slice(i + word.length);
};
const TEENS = ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

const FRAMES: Frame[] = Object.entries(GS5_UNITS).flatMap(([u, v]) => v.frames.map(([q, a, vi, key, emoji]) => ({ unit: Number(u), q, a, vi, key, emoji })));
const SOUND: Record<number, { label: string; test: (w: string) => boolean }> = Object.fromEntries(
  Object.entries(GS5_UNITS).map(([u, v]) => [Number(u), { label: v.sound, test: (w: string) => w.includes(v.sound) }]),
);

const pickFresh = (r: Rng, c: TA5Ctx, pool: W5[]) => {
  const f = pool.filter((w) => c.fresh.includes(w));
  if (f.length && r.chance(0.6)) return r.pick(f);
  return pool.length ? r.pick(pool) : undefined;
};
const others = (r: Rng, pool: W5[], not: W5, n: number, key: (w: W5) => string) => r.sample(pool.filter((w) => key(w) !== key(not) && w.w !== not.w), n);
const isNum = (w: W5) => TEENS.includes(w.w);

// ---------------------------------------------------------------- L1
const picToWord: TA5Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned.filter((x) => x.emoji));
  if (!w) return null;
  const o = others(r, c.all.filter((x) => x.emoji), w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc('Tranh vẽ gì? Chọn từ tiếng Anh đúng.', r.shuffle([w.w, ...o.map((x) => x.w)]), w.w, M('A5.TU.01', 'TA.TUVUNG', l, `${w.w} = ${w.vi}.`), { figure: one(w) });
};
const wordToMeaning: TA5Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned);
  if (!w) return null;
  const o = others(r, c.all, w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc(`"${w.w}" nghĩa là gì?`, r.shuffle([w.vi, ...o.map((x) => x.vi)]), w.vi, M('A5.TU.01', 'TA.NOINGHIA', l, `${w.w} nghĩa là ${w.vi}.`));
};
const soundPick: TA5Template = (r, c, l) => {
  if (!c.sounds.length) return null;
  const u = r.pick(c.sounds);
  const s = SOUND[u];
  const good = c.learned.filter((w) => w.unit === u && !w.gs1 && s.test(w.w));
  const bad = c.all.filter((w) => !s.test(w.w));
  if (!good.length || bad.length < 2) return null;
  const right = r.pick(good);
  return Q.sc(`Từ nào có chữ "${s.label}"?`, r.shuffle([right.w, ...r.sample(bad, 2).map((x) => x.w)]), right.w,
    M('A5.AM.01', 'TA.AM', l, `"${right.w}" có chữ "${s.label}" (âm học ở Unit ${u}).`));
};

// ---------------------------------------------------------------- L2
const meaningToWord: TA5Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned);
  if (!w) return null;
  const o = others(r, c.all, w, 2, (x) => x.w);
  if (o.length < 2) return null;
  return Q.sc(`"${w.vi}" tiếng Anh là gì?`, r.shuffle([w.w, ...o.map((x) => x.w)]), w.w, M('A5.TU.01', 'TA.TUVUNG', l, `${w.vi} = ${w.w}.`));
};
const missingLetter: TA5Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned.filter((x) => /^[a-z]{3,8}$/.test(x.w)));
  if (!w) return null;
  const i = r.int(0, w.w.length - 1);
  const ch = w.w[i];
  const pool = [...new Set(c.all.flatMap((x) => x.w.replace(/[^a-z]/g, '').split('')))].filter((x) => x !== ch);
  // tránh trường hợp chữ khác cũng tạo thành một từ đã học
  const bad = (x: string) => c.all.some((y) => y.w === w.w.slice(0, i) + x + w.w.slice(i + 1));
  const opts = r.sample(pool.filter((x) => !bad(x)), 2);
  if (opts.length < 2) return null;
  const masked = w.w.slice(0, i) + '_' + w.w.slice(i + 1);
  return Q.sc(`Điền chữ cái còn thiếu: ${masked} (${w.vi})`, r.shuffle([ch, ...opts]), ch, M('A5.AM.01', 'TA.CHUCAI', l, `Từ đúng: ${w.w}.`));
};
const completeSentence: TA5Template = (r, c, l) => {
  const fs = c.frames.filter((f) => f.emoji && f.a.includes(f.key));
  if (!fs.length) return null;
  const f = r.chance(0.6) && fs.some((x) => x.unit === c.unit) ? r.pick(fs.filter((x) => x.unit === c.unit)) : r.pick(fs);
  const pool = [...new Set(c.all.filter((w) => w.w !== f.key && !isNum(w) && w.emoji).map((w) => w.w))];
  if (pool.length < 2) return null;
  return Q.sc(`Nhìn tranh, chọn từ điền vào chỗ trống: "${blankLast(f.a, f.key)}"`, r.shuffle([f.key, ...r.sample(pool, 2)]), f.key,
    M('A5.CAU.01', 'TA.MAUCAU', l, `${f.a} = ${f.vi}`), { figure: one(f) });
};

// ---------------------------------------------------------------- L3
const matchMeaning: TA5Template = (r, c, l) => {
  const base = r.sample(c.learned.filter((w) => !w.gs1), 3);
  const ws = base.length >= 3 ? base : [...base, ...r.sample(c.learned.filter((w) => w.gs1), 3 - base.length)];
  if (ws.length < 3 || ws.length > 8 || new Set(ws.map((w) => w.vi)).size < 3) return null;
  return Q.mt('Nối từ tiếng Anh với nghĩa.', ws.map((w) => [w.w, w.vi]),
    M('A5.TU.01', 'TA.NOINGHIA', l, ws.map((w) => `${w.w} = ${w.vi}`).join('; ') + '.', 'Đọc từng từ, nhớ lại nghĩa: ' + ws.map((w) => `${w.w} – ${w.vi}`).join('; ') + '.'));
};
const matchPicture: TA5Template = (r, c, l) => {
  const pics = c.learned.filter((x) => x.emoji);
  const fresh = r.sample(pics.filter((x) => !x.gs1), 3);
  const ws = fresh.length >= 3 ? fresh : [...fresh, ...r.sample(pics.filter((x) => x.gs1), 3 - fresh.length)];
  if (ws.length < 3 || ws.length > 8 || new Set(ws.map((w) => w.emoji)).size < 3) return null;
  return Q.mt('Nối tranh với từ tiếng Anh.', ws.map((w) => [w.emoji as string, w.w]),
    M('A5.TU.01', 'TA.NOINGHIA', l, ws.map((w) => `${w.emoji} = ${w.w}`).join('; ') + '.', 'Nhìn từng tranh, nói tên tiếng Anh rồi nối: ' + ws.map((w) => `${w.emoji} – ${w.w} (${w.vi})`).join('; ') + '.'));
};
const allWithSound: TA5Template = (r, c, l) => {
  if (!c.sounds.length) return null;
  const u = r.pick(c.sounds);
  const s = SOUND[u];
  const good = c.learned.filter((w) => !w.gs1 && w.unit === u && s.test(w.w));
  const bad = c.all.filter((w) => !s.test(w.w));
  if (good.length < 2 || bad.length < 2) return null;
  const g = r.sample(good, Math.min(3, good.length));
  const b = r.sample(bad, 5 - g.length);
  return Q.mc(`Chọn TẤT CẢ các từ có chữ "${s.label}".`, r.shuffle([...g, ...b].map((w) => w.w)), g.map((w) => w.w),
    M('A5.AM.01', 'TA.AM', l, `Các từ có chữ "${s.label}": ${g.map((w) => w.w).join(', ')}.`, `Nhìn kĩ từng từ, tìm chữ "${s.label}". Đúng: ${g.map((w) => w.w).join(', ')}.`));
};
const spell: TA5Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned.filter((x) => /^[a-z]{3,6}$/.test(x.w) && new Set(x.w).size === x.w.length));
  if (!w) return null;
  return Q.ord(`Xếp các chữ cái thành từ có nghĩa là "${w.vi}".`, w.w.split(''),
    M('A5.AM.01', 'TA.CHUCAI', l, `Từ đúng: ${w.w}.`, `"${w.vi}" tiếng Anh là ${w.w}: ${w.w.split('').join(' – ')}.`));
};

// ---------------------------------------------------------------- L4
const tokens = (s: string) => s.split(' ');
const orderSentence: TA5Template = (r, c, l) => {
  const f = r.chance(0.6) && c.frames.some((x) => x.unit === c.unit) ? r.pick(c.frames.filter((x) => x.unit === c.unit)) : r.pick(c.frames);
  const s = f.q && r.chance(0.5) ? f.q : f.a;
  const ws = tokens(s);
  if (ws.length < 3 || ws.length > 8 || new Set(ws.map((x) => x.toLowerCase().replace(/[.,!?]/g, ''))).size !== ws.length) return null;
  return Q.ord('Sắp xếp các từ thành câu đúng.', ws,
    M('A5.CAU.01', 'TA.XEPCAU', l, `${s}`, `Câu đúng: ${s} Từ viết hoa đứng đầu câu, từ có dấu câu (. ! ?) đứng cuối.`));
};
const sentenceMeaning: TA5Template = (r, c, l) => {
  const f = r.pick(c.frames);
  const o = r.sample(c.frames.filter((x) => x.vi !== f.vi), 2);
  if (o.length < 2) return null;
  const s = f.q ? `${f.q} – ${f.a}` : f.a;
  return Q.sc(`Câu sau nghĩa là gì? "${s}"`, r.shuffle([f.vi, ...o.map((x) => x.vi)]), f.vi, M('A5.CAU.01', 'TA.NOINGHIA', l, `${s} = ${f.vi}`));
};
const teenWord: TA5Template = (r, c, l) => {
    const max = 20;
  const n = r.int(11, max);
  const pool = TEENS.slice(0, max - 10);
  if (r.chance(0.5)) {
    return Q.sc(`Số ${n} tiếng Anh là gì?`, r.shuffle([TEENS[n - 11], ...r.sample(pool.filter((x) => x !== TEENS[n - 11]), 2)]), TEENS[n - 11],
      M('A5.TU.01', 'TA.TUVUNG', l, `${n} = ${TEENS[n - 11]}.`));
  }
  const opts = r.sample([...Array(max - 10).keys()].map((i) => String(i + 11)).filter((x) => x !== String(n)), 2);
  return Q.sc(`"${TEENS[n - 11]}" là số mấy?`, r.shuffle([String(n), ...opts]), String(n), M('A5.TU.01', 'TA.TUVUNG', l, `${TEENS[n - 11]} = ${n}.`));
};

// ---------------------------------------------------------------- L5
const answerPick: TA5Template = (r, c, l) => {
  const qs = c.frames.filter((f) => f.q);
  if (!qs.length) return null;
  const f = r.chance(0.6) && qs.some((x) => x.unit === c.unit) ? r.pick(qs.filter((x) => x.unit === c.unit)) : r.pick(qs);
  // đáp án nhiễu: câu trả lời của mẫu câu khác loại (không thể cũng đúng)
  const bad = [...new Set(c.frames.filter((x) => x.unit !== f.unit && x.a !== f.a).map((x) => x.a))];
  if (bad.length < 2) return null;
  return Q.sc(`Chọn câu trả lời đúng: "${f.q}"`, r.shuffle([f.a, ...r.sample(bad, 2)]), f.a,
    M('A5.CAU.01', 'TA.HOIDAP', l, `${f.q} – ${f.a} (${f.vi})`, `Câu hỏi "${f.q}" đi với câu trả lời "${f.a}". Nghĩa: ${f.vi}`));
};
const qaMatch: TA5Template = (r, c, l) => {
  const byUnit = new Map<number, Frame>();
  for (const f of r.shuffle(c.frames.filter((x) => x.q))) if (!byUnit.has(f.unit)) byUnit.set(f.unit, f);
  const fs = r.sample([...byUnit.values()], 3);
  if (fs.length < 3 || new Set(fs.map((f) => f.a)).size < 3) return null;
  return Q.mt('Nối câu hỏi với câu trả lời phù hợp.', fs.map((f) => [f.q as string, f.a]),
    M('A5.CAU.01', 'TA.HOIDAP', l, fs.map((f) => `${f.q} – ${f.a}`).join('; '), fs.map((f) => `"${f.q}" → "${f.a}" (${f.vi})`).join('; ')));
};
const picSentence: TA5Template = (r, c, l) => {
  const fs = c.frames.filter((f) => f.emoji);
  const f = pickFrameFresh(r, c, fs);
  if (!f) return null;
  const say = (x: Frame) => (x.q && x.q.includes(x.key) ? x.q : x.a);
  const bad = [...new Set(fs.filter((x) => x.key !== f.key && x.emoji !== f.emoji).map(say))].filter((x) => x !== say(f));
  if (bad.length < 2) return null;
  return Q.sc('Câu nào đúng với tranh?', r.shuffle([say(f), ...r.sample(bad, 2)]), say(f),
    M('A5.CAU.01', 'TA.MAUCAU', l, `Tranh vẽ ${f.key}: "${say(f)}"`, `Tranh vẽ ${f.key}. Chỉ câu "${say(f)}" nhắc đến ${f.key}.`), { figure: one(f) });
};
const pickFrameFresh = (r: Rng, c: TA5Ctx, fs: Frame[]) => {
  const own = fs.filter((x) => x.unit === c.unit);
  if (own.length && r.chance(0.6)) return r.pick(own);
  return fs.length ? r.pick(fs) : undefined;
};
const orderTeens: TA5Template = (r, c, l) => {
    const max = 20;
  const start = r.int(11, max - 3);
  const ws = TEENS.slice(start - 11, start - 7);
  return Q.ord('Sắp xếp các số từ bé đến lớn.', ws, M('A5.TU.01', 'TA.TUVUNG', l, ws.join(', ') + '.', ws.map((w, i) => `${w} = ${start + i}`).join('; ') + '.'));
};


export type TA5Pool = Record<Level, TA5Template[]>;
export const TA5G_POOL: TA5Pool = {
  1: [picToWord, wordToMeaning, soundPick],
  2: [meaningToWord, missingLetter, completeSentence],
  3: [matchMeaning, matchPicture, allWithSound, spell],
  4: [orderSentence, sentenceMeaning, teenWord, matchPicture],
  5: [answerPick, qaMatch, picSentence, orderTeens, orderSentence, spell],
};

/** Ngữ cảnh: unit hiện tại (bài học) hoặc nhóm unit (Review: from–to). Từ lớp 1, 2 có tranh làm nhiễu. */
export function ta5Context(unit: number, from = unit): TA5Ctx {
  const learned: W5[] = [];
  for (let u = 1; u <= unit; u++) for (const w of GS5_UNITS[u].words) if (!learned.some((x) => x.w === w.w)) learned.push({ ...w, unit: u });
  const older: W5[] = [
    ...taContext(16).words.filter((w) => w.emoji && /^[a-z]+$/.test(w.w)).map((w) => ({ w: w.w, vi: w.vi, emoji: w.emoji, unit: 0, gs1: true })),
    ...Object.values(GS2_UNITS).flatMap((v) => v.words.filter((w) => w.emoji && /^[a-z]+$/.test(w.w)).map((w) => ({ ...w, unit: 0, gs1: true }))),
    ...Object.values(GS3_UNITS).flatMap((v) => v.words.filter((w) => w.emoji && /^[a-z]+$/.test(w.w)).map((w) => ({ ...w, unit: 0, gs1: true }))),
    ...Object.values(GS4_UNITS).flatMap((v) => v.words.filter((w) => w.emoji && /^[a-z]+$/.test(w.w)).map((w) => ({ ...w, unit: 0, gs1: true }))),
  ];
  for (let i = older.length - 1; i >= 0; i--) if (older.findIndex((x) => x.w === older[i].w || x.vi === older[i].vi) !== i) older.splice(i, 1);
  const fresh = learned.filter((w) => w.unit >= from);
  const units = [...Array(unit - from + 1).keys()].map((i) => from + i);
  const review = unit <= 3 ? older.filter((_, i) => i % 4 === 0) : [];
  return {
    unit,
    learned: [...learned, ...review],
    fresh,
    all: [...learned, ...older.filter((g) => !learned.some((x) => x.w === g.w || x.vi === g.vi))],
    frames: FRAMES.filter((f) => f.unit <= unit && (from === unit ? true : f.unit >= from - 4)),
    sounds: units.filter((u) => learned.some((w) => w.unit === u && SOUND[u].test(w.w))),
  };
}
