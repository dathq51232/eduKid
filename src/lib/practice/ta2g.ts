// BỘ SINH CÂU NGẪU NHIÊN — TIẾNG ANH 2 (Global Success), Unit 1–16 + Fun time + Review.
// Chỉ dùng từ vựng và mẫu câu của các unit ĐÃ HỌC (Tiếng Anh 1 + Tiếng Anh 2 đến unit hiện tại — kiểm bằng gs2Learned).
// Câu mẫu do EduChain Kids tự đặt theo khung mẫu câu ở Book map, không chép hội thoại/bài tập của sách.
// Dạng bài: tranh → từ, từ ↔ nghĩa, âm/chữ trọng tâm, điền chữ, nối từ – nghĩa – tranh, xếp chữ thành từ,
// hoàn thành câu, xếp từ thành câu, câu → nghĩa, chọn câu trả lời, nối hỏi – đáp, số 11–20.

import type { Level } from '../content/types';
import { GS2_UNITS } from '../content/ta2-vocab';
import type { Figure } from '../figures';
import { Q, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { taContext } from './ta1';

export type W2 = { w: string; vi: string; emoji?: string; unit: number; gs1?: boolean };
type Frame = { unit: number; q?: string; a: string; vi: string; key: string; emoji?: string };
export type TA2Ctx = { unit: number; learned: W2[]; fresh: W2[]; all: W2[]; frames: Frame[]; sounds: number[] };
export type TA2Template = (r: Rng, c: TA2Ctx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, l: Level, e: string, s?: string) => ({ o, f, l, e, s: s ?? (l >= 3 ? e : undefined) });
const one = (w: { emoji?: string }): Figure => ({ kind: 'objects', groups: [{ icon: w.emoji as string, count: 1 }], alt: 'Tranh một sự vật' });
const blankLast = (s: string, word: string) => {
  const i = s.lastIndexOf(word);
  return i < 0 ? s : s.slice(0, i) + '___' + s.slice(i + word.length);
};

// ---------------------------------------------------------------- Mẫu câu theo unit (tự đặt theo khung Book map)
const TEENS = ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const vw = (u: number, w: string) => GS2_UNITS[u].words.find((x) => x.w === w)!;
function allFrames(): Frame[] {
  const f: Frame[] = [];
  const add = (unit: number, a: string, vi: string, key: string, q?: string, emoji?: string) => f.push({ unit, q, a, vi, key, emoji });
  for (const w of ['pasta', 'popcorn', 'pizza']) add(1, `I like ${w}.`, `Tớ thích ${vw(1, w).vi}.`, w, undefined, vw(1, w).emoji);
  add(2, 'Yes, she is.', 'Bạn ấy đang thả diều phải không? – Đúng vậy.', 'kite', 'Is she flying a kite?', '🪁');
  add(2, 'Yes, he is.', 'Bạn ấy đang đạp xe phải không? – Đúng vậy.', 'bike', 'Is he riding a bike?', '🚲');
  for (const w of ['sea', 'sand', 'sail']) add(3, `Let's look at the ${w}!`, `Chúng mình cùng ngắm ${vw(3, w).vi} nhé!`, w, undefined, vw(3, w).emoji);
  for (const w of ['rainbow', 'river', 'road']) add(4, `I can see a ${w}.`, `Bạn nhìn thấy gì? – Tớ nhìn thấy ${vw(4, w).vi}.`, w, 'What can you see?', vw(4, w).emoji);
  add(5, "He's doing a quiz.", 'Bạn ấy đang làm gì? – Bạn ấy đang giải câu đố.', 'quiz', "What's he doing?", '🧩');
  add(5, "She's drawing a square.", 'Bạn ấy đang làm gì? – Bạn ấy đang vẽ hình vuông.', 'square', "What's she doing?", '🟥');
  add(6, 'Yes, there is.', 'Có con cáo không? – Có.', 'fox', 'Is there a fox?', '🦊');
  add(6, 'Yes, there is.', 'Có cái hộp không? – Có.', 'box', 'Is there a box?', '📦');
  add(6, "No, there isn't.", 'Có con bò đực không? – Không có.', 'ox', 'Is there an ox?', '🐂');
  for (const w of ['juice', 'jelly', 'jam']) add(7, 'Here you are.', `Làm ơn đưa tớ ${vw(7, w).vi}. – Của bạn đây.`, w, `Pass me the ${w}, please.`, vw(7, w).emoji);
  add(8, 'Yes, I can.', 'Bạn vẽ được xe tải nhỏ không? – Tớ vẽ được.', 'van', 'Can you draw a van?', '🚐');
  add(8, "No, I can't.", 'Bạn chơi được bóng chuyền không? – Tớ không chơi được.', 'volleyball', 'Can you play volleyball?', '🏐');
  for (const w of ['yogurt', 'yams', 'yo-yos']) add(9, `I want some ${w}.`, `Bạn muốn gì? – Tớ muốn ${vw(9, w).vi}.`, w, 'What do you want?', vw(9, w).emoji);
  add(10, 'Yes, I do.', 'Bạn có thích vườn thú không? – Tớ thích.', 'zoo', 'Do you like the zoo?', '🦁');
  add(10, "No, I don't.", 'Bạn có thích con bò u không? – Tớ không thích.', 'zebu', 'Do you like the zebu?', '🐃');
  add(10, 'Yes, I do.', 'Bạn có thích con ngựa vằn không? – Tớ thích.', 'zebra', 'Do you like the zebra?', '🦓');
  add(11, "They're driving cars.", 'Các bạn ấy đang lái xe ô tô.', 'driving', undefined, '🚗');
  add(11, "They're riding bikes.", 'Các bạn ấy đang đạp xe.', 'riding', undefined, '🚴');
  add(12, 'The cake is on the table.', 'Cái bánh ngọt ở trên bàn.', 'cake', undefined, '🎂');
  add(12, 'The grapes are on the table.', 'Chùm nho ở trên bàn.', 'grapes', undefined, '🍇');
  for (let n = 11; n <= 15; n++) add(13, `It's ${TEENS[n - 11]}.`, `Đó là số mấy? – Đó là số ${n}.`, TEENS[n - 11], 'What number is it?');
  for (let n = 16; n <= 20; n++) {
    const bro = n % 2 === 0;
    add(14, `${bro ? "He's" : "She's"} ${TEENS[n - 11]}.`, `${bro ? 'Anh trai' : 'Chị gái'} bạn bao nhiêu tuổi? – ${bro ? 'Anh ấy' : 'Chị ấy'} ${n} tuổi.`, TEENS[n - 11], `How old is your ${bro ? 'brother' : 'sister'}?`);
  }
  for (const w of ['shirts', 'shoes', 'shorts']) add(15, 'Over there.', `${vw(15, w).vi[0].toUpperCase() + vw(15, w).vi.slice(1)} ở đâu? – Ở đằng kia.`, w, `Where are the ${w}?`, vw(15, w).emoji);
  add(16, "No, it isn't.", 'Cái chăn có ở gần cái lều không? – Không.', 'blanket', 'Is the blanket near the tent?', '🛏️');
  add(16, 'Yes, it is.', 'Ấm trà có ở trong lều không? – Có.', 'teapot', 'Is the teapot in the tent?', '🫖');
  return f;
}
const FRAMES = allFrames();

// ---------------------------------------------------------------- Âm / chữ trọng tâm
const SOUND: Record<number, { label: string; test: (w: string) => boolean }> = Object.fromEntries(
  Object.entries(GS2_UNITS).map(([u, v]) => {
    const s = v.sound;
    const test = s === 'a_e' ? (w: string) => /a[^aeiou]e/.test(w) : (w: string) => w.includes(s);
    return [Number(u), { label: s === 'a_e' ? 'a…e' : s, test }];
  }),
);

const pickFresh = (r: Rng, c: TA2Ctx, pool: W2[]) => {
  const f = pool.filter((w) => c.fresh.includes(w));
  if (f.length && r.chance(0.6)) return r.pick(f);
  return pool.length ? r.pick(pool) : undefined;
};
const others = (r: Rng, pool: W2[], not: W2, n: number, key: (w: W2) => string) => r.sample(pool.filter((w) => key(w) !== key(not) && w.w !== not.w), n);
const isNum = (w: W2) => TEENS.includes(w.w);

// ---------------------------------------------------------------- L1
const picToWord: TA2Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned.filter((x) => x.emoji));
  if (!w) return null;
  const o = others(r, c.all.filter((x) => x.emoji), w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc('Tranh vẽ gì? Chọn từ tiếng Anh đúng.', r.shuffle([w.w, ...o.map((x) => x.w)]), w.w, M('A2.TU.01', 'TA.TUVUNG', l, `${w.w} = ${w.vi}.`), { figure: one(w) });
};
const wordToMeaning: TA2Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned);
  if (!w) return null;
  const o = others(r, c.all, w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc(`"${w.w}" nghĩa là gì?`, r.shuffle([w.vi, ...o.map((x) => x.vi)]), w.vi, M('A2.TU.01', 'TA.NOINGHIA', l, `${w.w} nghĩa là ${w.vi}.`));
};
const soundPick: TA2Template = (r, c, l) => {
  const u = r.pick(c.sounds);
  const s = SOUND[u];
  const good = c.learned.filter((w) => w.unit === u && !w.gs1 && s.test(w.w));
  const bad = c.all.filter((w) => !s.test(w.w));
  if (!good.length || bad.length < 2) return null;
  const right = r.pick(good);
  return Q.sc(`Từ nào có chữ "${s.label}"?`, r.shuffle([right.w, ...r.sample(bad, 2).map((x) => x.w)]), right.w,
    M('A2.AM.01', 'TA.AM', l, `"${right.w}" có chữ "${s.label}" (âm học ở Unit ${u}).`));
};

// ---------------------------------------------------------------- L2
const meaningToWord: TA2Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned);
  if (!w) return null;
  const o = others(r, c.all, w, 2, (x) => x.w);
  if (o.length < 2) return null;
  return Q.sc(`"${w.vi}" tiếng Anh là gì?`, r.shuffle([w.w, ...o.map((x) => x.w)]), w.w, M('A2.TU.01', 'TA.TUVUNG', l, `${w.vi} = ${w.w}.`));
};
const missingLetter: TA2Template = (r, c, l) => {
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
  return Q.sc(`Điền chữ cái còn thiếu: ${masked} (${w.vi})`, r.shuffle([ch, ...opts]), ch, M('A2.AM.01', 'TA.CHUCAI', l, `Từ đúng: ${w.w}.`));
};
const completeSentence: TA2Template = (r, c, l) => {
  const fs = c.frames.filter((f) => f.emoji && f.a.includes(f.key));
  if (!fs.length) return null;
  const f = r.chance(0.6) && fs.some((x) => x.unit === c.unit) ? r.pick(fs.filter((x) => x.unit === c.unit)) : r.pick(fs);
  const pool = [...new Set(c.all.filter((w) => w.w !== f.key && !isNum(w) && w.emoji).map((w) => w.w))];
  if (pool.length < 2) return null;
  return Q.sc(`Nhìn tranh, chọn từ điền vào chỗ trống: "${blankLast(f.a, f.key)}"`, r.shuffle([f.key, ...r.sample(pool, 2)]), f.key,
    M('A2.CAU.01', 'TA.MAUCAU', l, `${f.a} = ${f.vi}`), { figure: one(f) });
};

// ---------------------------------------------------------------- L3
const matchMeaning: TA2Template = (r, c, l) => {
  const base = r.sample(c.learned.filter((w) => !w.gs1), 3);
  const ws = base.length >= 3 ? base : [...base, ...r.sample(c.learned.filter((w) => w.gs1), 3 - base.length)];
  if (ws.length < 3 || new Set(ws.map((w) => w.vi)).size < 3) return null;
  return Q.mt('Nối từ tiếng Anh với nghĩa.', ws.map((w) => [w.w, w.vi]),
    M('A2.TU.01', 'TA.NOINGHIA', l, ws.map((w) => `${w.w} = ${w.vi}`).join('; ') + '.', 'Đọc từng từ, nhớ lại nghĩa: ' + ws.map((w) => `${w.w} – ${w.vi}`).join('; ') + '.'));
};
const matchPicture: TA2Template = (r, c, l) => {
  const pics = c.learned.filter((x) => x.emoji);
  const fresh = r.sample(pics.filter((x) => !x.gs1), 3);
  const ws = fresh.length >= 3 ? fresh : [...fresh, ...r.sample(pics.filter((x) => x.gs1), 3 - fresh.length)];
  if (ws.length < 3 || new Set(ws.map((w) => w.emoji)).size < 3) return null;
  return Q.mt('Nối tranh với từ tiếng Anh.', ws.map((w) => [w.emoji as string, w.w]),
    M('A2.TU.01', 'TA.NOINGHIA', l, ws.map((w) => `${w.emoji} = ${w.w}`).join('; ') + '.', 'Nhìn từng tranh, nói tên tiếng Anh rồi nối: ' + ws.map((w) => `${w.emoji} – ${w.w} (${w.vi})`).join('; ') + '.'));
};
const allWithSound: TA2Template = (r, c, l) => {
  const u = r.pick(c.sounds);
  const s = SOUND[u];
  const good = c.learned.filter((w) => !w.gs1 && w.unit === u && s.test(w.w));
  const bad = c.all.filter((w) => !s.test(w.w));
  if (good.length < 2 || bad.length < 2) return null;
  const g = r.sample(good, Math.min(3, good.length));
  const b = r.sample(bad, 5 - g.length);
  return Q.mc(`Chọn TẤT CẢ các từ có chữ "${s.label}".`, r.shuffle([...g, ...b].map((w) => w.w)), g.map((w) => w.w),
    M('A2.AM.01', 'TA.AM', l, `Các từ có chữ "${s.label}": ${g.map((w) => w.w).join(', ')}.`, `Nhìn kĩ từng từ, tìm chữ "${s.label}". Đúng: ${g.map((w) => w.w).join(', ')}.`));
};
const spell: TA2Template = (r, c, l) => {
  const w = pickFresh(r, c, c.learned.filter((x) => /^[a-z]{3,6}$/.test(x.w) && new Set(x.w).size === x.w.length));
  if (!w) return null;
  return Q.ord(`Xếp các chữ cái thành từ có nghĩa là "${w.vi}".`, w.w.split(''),
    M('A2.AM.01', 'TA.CHUCAI', l, `Từ đúng: ${w.w}.`, `"${w.vi}" tiếng Anh là ${w.w}: ${w.w.split('').join(' – ')}.`));
};

// ---------------------------------------------------------------- L4
const tokens = (s: string) => s.split(' ');
const orderSentence: TA2Template = (r, c, l) => {
  const f = r.chance(0.6) && c.frames.some((x) => x.unit === c.unit) ? r.pick(c.frames.filter((x) => x.unit === c.unit)) : r.pick(c.frames);
  const s = f.q && r.chance(0.5) ? f.q : f.a;
  const ws = tokens(s);
  if (ws.length < 3 || new Set(ws.map((x) => x.toLowerCase().replace(/[.,!?]/g, ''))).size !== ws.length) return null;
  return Q.ord('Sắp xếp các từ thành câu đúng.', ws,
    M('A2.CAU.01', 'TA.XEPCAU', l, `${s}`, `Câu đúng: ${s} Từ viết hoa đứng đầu câu, từ có dấu câu (. ! ?) đứng cuối.`));
};
const sentenceMeaning: TA2Template = (r, c, l) => {
  const f = r.pick(c.frames);
  const o = r.sample(c.frames.filter((x) => x.vi !== f.vi), 2);
  if (o.length < 2) return null;
  const s = f.q ? `${f.q} – ${f.a}` : f.a;
  return Q.sc(`Câu sau nghĩa là gì? "${s}"`, r.shuffle([f.vi, ...o.map((x) => x.vi)]), f.vi, M('A2.CAU.01', 'TA.NOINGHIA', l, `${s} = ${f.vi}`));
};
const teenWord: TA2Template = (r, c, l) => {
  if (c.unit < 13) return null;
  const max = c.unit >= 14 ? 20 : 15;
  const n = r.int(11, max);
  const pool = TEENS.slice(0, max - 10);
  if (r.chance(0.5)) {
    return Q.sc(`Số ${n} tiếng Anh là gì?`, r.shuffle([TEENS[n - 11], ...r.sample(pool.filter((x) => x !== TEENS[n - 11]), 2)]), TEENS[n - 11],
      M('A2.SO.01', 'TA.TUVUNG', l, `${n} = ${TEENS[n - 11]}.`));
  }
  const opts = r.sample([...Array(max - 10).keys()].map((i) => String(i + 11)).filter((x) => x !== String(n)), 2);
  return Q.sc(`"${TEENS[n - 11]}" là số mấy?`, r.shuffle([String(n), ...opts]), String(n), M('A2.SO.01', 'TA.TUVUNG', l, `${TEENS[n - 11]} = ${n}.`));
};

// ---------------------------------------------------------------- L5
const answerPick: TA2Template = (r, c, l) => {
  const qs = c.frames.filter((f) => f.q);
  if (!qs.length) return null;
  const f = r.chance(0.6) && qs.some((x) => x.unit === c.unit) ? r.pick(qs.filter((x) => x.unit === c.unit)) : r.pick(qs);
  // đáp án nhiễu: câu trả lời của mẫu câu khác loại (không thể cũng đúng)
  const bad = [...new Set(c.frames.filter((x) => x.unit !== f.unit && x.a !== f.a).map((x) => x.a))];
  if (bad.length < 2) return null;
  return Q.sc(`Chọn câu trả lời đúng: "${f.q}"`, r.shuffle([f.a, ...r.sample(bad, 2)]), f.a,
    M('A2.CAU.01', 'TA.HOIDAP', l, `${f.q} – ${f.a} (${f.vi})`, `Câu hỏi "${f.q}" đi với câu trả lời "${f.a}". Nghĩa: ${f.vi}`));
};
const qaMatch: TA2Template = (r, c, l) => {
  const byUnit = new Map<number, Frame>();
  for (const f of r.shuffle(c.frames.filter((x) => x.q))) if (!byUnit.has(f.unit)) byUnit.set(f.unit, f);
  const fs = r.sample([...byUnit.values()], 3);
  if (fs.length < 3 || new Set(fs.map((f) => f.a)).size < 3) return null;
  return Q.mt('Nối câu hỏi với câu trả lời phù hợp.', fs.map((f) => [f.q as string, f.a]),
    M('A2.CAU.01', 'TA.HOIDAP', l, fs.map((f) => `${f.q} – ${f.a}`).join('; '), fs.map((f) => `"${f.q}" → "${f.a}" (${f.vi})`).join('; ')));
};
const picSentence: TA2Template = (r, c, l) => {
  const fs = c.frames.filter((f) => f.emoji);
  const f = pickFrameFresh(r, c, fs);
  if (!f) return null;
  const say = (x: Frame) => (x.q && x.q.includes(x.key) ? x.q : x.a);
  const bad = [...new Set(fs.filter((x) => x.key !== f.key && x.emoji !== f.emoji).map(say))].filter((x) => x !== say(f));
  if (bad.length < 2) return null;
  return Q.sc('Câu nào đúng với tranh?', r.shuffle([say(f), ...r.sample(bad, 2)]), say(f),
    M('A2.CAU.01', 'TA.MAUCAU', l, `Tranh vẽ ${f.key}: "${say(f)}"`, `Tranh vẽ ${f.key}. Chỉ câu "${say(f)}" nhắc đến ${f.key}.`), { figure: one(f) });
};
const pickFrameFresh = (r: Rng, c: TA2Ctx, fs: Frame[]) => {
  const own = fs.filter((x) => x.unit === c.unit);
  if (own.length && r.chance(0.6)) return r.pick(own);
  return fs.length ? r.pick(fs) : undefined;
};
const orderTeens: TA2Template = (r, c, l) => {
  if (c.unit < 13) return null;
  const max = c.unit >= 14 ? 20 : 15;
  const start = r.int(11, max - 3);
  const ws = TEENS.slice(start - 11, start - 7);
  return Q.ord('Sắp xếp các số từ bé đến lớn.', ws, M('A2.SO.01', 'TA.TUVUNG', l, ws.join(', ') + '.', ws.map((w, i) => `${w} = ${start + i}`).join('; ') + '.'));
};

export type TA2Pool = Record<Level, TA2Template[]>;
export const TA2G_POOL: TA2Pool = {
  1: [picToWord, wordToMeaning, soundPick],
  2: [meaningToWord, missingLetter, completeSentence],
  3: [matchMeaning, matchPicture, allWithSound, spell],
  4: [orderSentence, sentenceMeaning, teenWord],
  5: [answerPick, qaMatch, picSentence, orderTeens],
};

/** Ngữ cảnh: unit hiện tại (bài học) hoặc nhóm unit (Fun time/Review: from–to) */
export function ta2Context(unit: number, from = unit): TA2Ctx {
  const learned: W2[] = [];
  for (let u = 1; u <= unit; u++) for (const w of GS2_UNITS[u].words) learned.push({ ...w, unit: u });
  const gs1 = taContext(16).words.filter((w) => w.emoji && /^[a-z]+$/.test(w.w)).map((w) => ({ w: w.w, vi: w.vi, emoji: w.emoji, unit: 0, gs1: true }));
  const fresh = learned.filter((w) => w.unit >= from);
  const units = [...Array(unit - from + 1).keys()].map((i) => from + i);
  // ôn từ lớp 1 làm nhiễu và làm thêm vốn từ cho các unit đầu
  const review = unit <= 2 ? gs1.filter((_, i) => i % 3 === 0) : [];
  return {
    unit,
    learned: [...learned, ...review],
    fresh,
    all: [...learned, ...gs1.filter((g) => !learned.some((x) => x.w === g.w || x.vi === g.vi))],
    frames: FRAMES.filter((f) => f.unit <= unit && (from === unit ? true : f.unit >= from - 4)),
    sounds: units,
  };
}
