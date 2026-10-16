// BỘ SINH CÂU NGẪU NHIÊN — TIẾNG ANH 1 (Global Success), HỌC KÌ 1: Unit 1–8, Review 1–2.
// Chỉ dùng từ của các unit ĐÃ HỌC và vài từ chức năng đã gặp trong mẫu câu (I, have, a, an, this, is, my, can, see, it).
// Dạng bài: tranh → từ, từ → nghĩa, chữ cái đầu, điền chữ còn thiếu, nối từ – nghĩa – tranh, xếp chữ thành từ,
// hoàn thành mẫu câu, a/an, xếp từ thành câu, câu → nghĩa, chọn tranh đúng với câu.

import type { Level } from '../content/types';
import { GS1_VOCAB, enPlural } from '../content/ta1-hk1';
import type { Figure } from '../figures';
import { Q, type PracticeQuestion } from './kit';
import type { Rng } from './rng';

type EWord = { w: string; vi: string; emoji?: string; unit: number; an?: boolean; thing: boolean };
// Nghĩa tiếng Việt + tranh. thing = danh từ đếm được dùng được trong mẫu câu "I have a …".
const INFO: Record<string, Omit<EWord, 'w' | 'unit'>> = {
  bill: { vi: 'bạn Bill', thing: false },
  ball: { vi: 'quả bóng', emoji: '⚽', thing: true },
  bike: { vi: 'xe đạp', emoji: '🚲', thing: true },
  book: { vi: 'quyển sách', emoji: '📖', thing: true },
  cake: { vi: 'bánh ngọt', emoji: '🎂', thing: true },
  car: { vi: 'ô tô', emoji: '🚗', thing: true },
  cat: { vi: 'con mèo', emoji: '🐱', thing: true },
  cup: { vi: 'cái cốc', emoji: '☕', thing: true },
  apple: { vi: 'quả táo', emoji: '🍎', thing: true, an: true },
  bag: { vi: 'cái cặp', emoji: '🎒', thing: true },
  can: { vi: 'cái lon', emoji: '🥫', thing: true },
  hat: { vi: 'cái mũ', emoji: '🎩', thing: true },
  desk: { vi: 'bàn học', thing: true },
  dog: { vi: 'con chó', emoji: '🐶', thing: true },
  door: { vi: 'cái cửa', emoji: '🚪', thing: true },
  duck: { vi: 'con vịt', emoji: '🦆', thing: true },
  chicken: { vi: 'con gà', emoji: '🐔', thing: true },
  chips: { vi: 'khoai tây chiên', emoji: '🍟', thing: false },
  fish: { vi: 'con cá', emoji: '🐟', thing: true },
  milk: { vi: 'sữa', emoji: '🥛', thing: false },
  bell: { vi: 'cái chuông', emoji: '🔔', thing: true },
  pen: { vi: 'bút mực', emoji: '🖊️', thing: true },
  pencil: { vi: 'bút chì', emoji: '✏️', thing: true },
  red: { vi: 'màu đỏ', emoji: '🔴', thing: false },
  garden: { vi: 'khu vườn', emoji: '🏡', thing: true },
  gate: { vi: 'cái cổng', thing: true },
  girl: { vi: 'bạn gái', emoji: '👧', thing: false },
  goat: { vi: 'con dê', emoji: '🐐', thing: true },
  hair: { vi: 'mái tóc', thing: false },
  hand: { vi: 'bàn tay', emoji: '✋', thing: false },
  head: { vi: 'cái đầu', thing: false },
  horse: { vi: 'con ngựa', emoji: '🐴', thing: true },
  // Học kì 2 (Unit 9–16)
  clock: { vi: 'đồng hồ', emoji: '🕰️', thing: true },
  lock: { vi: 'ổ khóa', emoji: '🔒', thing: true },
  mop: { vi: 'cây lau nhà', thing: true },
  pot: { vi: 'cái nồi', thing: true },
  mango: { vi: 'quả xoài', emoji: '🥭', thing: true },
  monkey: { vi: 'con khỉ', emoji: '🐒', thing: true },
  mother: { vi: 'mẹ', emoji: '👩', thing: false },
  mouse: { vi: 'con chuột', emoji: '🐭', thing: true },
  bus: { vi: 'xe buýt', emoji: '🚌', thing: true },
  run: { vi: 'chạy', emoji: '🏃', thing: false },
  sun: { vi: 'mặt trời', emoji: '☀️', thing: false },
  truck: { vi: 'xe tải', emoji: '🚚', thing: true },
  lake: { vi: 'hồ nước', emoji: '🏞️', thing: false },
  leaf: { vi: 'chiếc lá', emoji: '🍃', thing: true },
  lemon: { vi: 'quả chanh', emoji: '🍋', thing: true },
  banana: { vi: 'quả chuối', emoji: '🍌', thing: true },
  noodles: { vi: 'mì sợi', emoji: '🍜', thing: false },
  nut: { vi: 'hạt lạc', emoji: '🥜', thing: true },
  'teddy bear': { vi: 'gấu bông', emoji: '🧸', thing: true },
  tiger: { vi: 'con hổ', emoji: '🐯', thing: true },
  top: { vi: 'con quay', thing: true },
  turtle: { vi: 'con rùa', emoji: '🐢', thing: true },
  face: { vi: 'khuôn mặt', emoji: '🙂', thing: false },
  father: { vi: 'bố', emoji: '👨', thing: false },
  foot: { vi: 'bàn chân', emoji: '🦶', thing: false },
  football: { vi: 'quả bóng đá', thing: true },
  wash: { vi: 'rửa, giặt', emoji: '🧼', thing: false },
  water: { vi: 'nước', emoji: '💧', thing: false },
  window: { vi: 'cửa sổ', emoji: '🪟', thing: true },
};

export type ECtx = { unit: number; words: EWord[]; fresh: EWord[]; letters: string[] };
export type ETemplate = (r: Rng, c: ECtx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string) => ({ o, f, k, l, e, s });
/** Thay từ cuối cùng khớp `word` bằng ___ (tránh thay nhầm, vd. "can" trong "I can see a can."). */
const blankLast = (s: string, word: string) => {
  const i = s.lastIndexOf(word);
  return i < 0 ? s : s.slice(0, i) + '___' + s.slice(i + word.length);
};
const one = (w: EWord): Figure => ({ kind: 'objects', groups: [{ icon: w.emoji as string, count: 1 }], alt: 'Tranh một sự vật' });
const art = (w: EWord) => (w.an ? 'an' : 'a');
const ANIMALS = ['dog', 'duck', 'cat', 'fish', 'chicken', 'goat', 'horse', 'monkey', 'mouse', 'tiger', 'turtle'];
const BODY = ['hair', 'hand', 'head', 'face', 'foot'];
const OUTCOME = (w: EWord) =>
  ANIMALS.includes(w.w) ? 'A1.ANIMAL.01'
    : ['book', 'bag', 'pen', 'pencil', 'desk'].includes(w.w) ? 'A1.SCHOOL.01'
      : BODY.includes(w.w) ? 'A1.EXTRA.03'
        : ['mother', 'father', 'girl'].includes(w.w) ? 'A1.FAMILY.01'
          : ['ball', 'bike', 'car', 'teddy bear', 'top', 'football'].includes(w.w) ? 'A1.EXTRA.01'
            : 'A1.EXTRA.02';

function pickFresh(r: Rng, c: ECtx, pool: EWord[]): EWord | undefined {
  const f = pool.filter((w) => c.fresh.includes(w));
  if (f.length && r.chance(0.6)) return r.pick(f);
  return pool.length ? r.pick(pool) : undefined;
}
const others = (r: Rng, pool: EWord[], not: EWord, n: number, key: (w: EWord) => string) =>
  r.sample(pool.filter((w) => key(w) !== key(not)), n);

// --------------------------------------------------------------------------- L1
const picToWord: ETemplate = (r, c, l) => {
  const pics = c.words.filter((w) => w.emoji);
  const w = pickFresh(r, c, pics);
  if (!w) return null;
  const o = others(r, pics, w, 2, (x) => x.w);
  if (o.length < 2) return null;
  return Q.sc('Tranh vẽ gì? Chọn từ tiếng Anh đúng.', r.shuffle([w.w, ...o.map((x) => x.w)]), w.w,
    M(OUTCOME(w), 'TA.TUVUNG', 'tu_vung', l, `${w.w} = ${w.vi}.`), { figure: one(w) });
};
const wordToMeaning: ETemplate = (r, c, l) => {
  const w = pickFresh(r, c, c.words.filter((x) => x.w !== 'bill'));
  if (!w) return null;
  const o = others(r, c.words.filter((x) => x.w !== 'bill'), w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc(`"${w.w}" nghĩa là gì?`, r.shuffle([w.vi, ...o.map((x) => x.vi)]), w.vi,
    M(OUTCOME(w), 'TA.NOINGHIA', 'tu_vung', l, `${w.w} nghĩa là ${w.vi}.`));
};

// --------------------------------------------------------------------------- L2
const startLetter: ETemplate = (r, c, l) => {
  if (c.letters.length < 2) return null;
  const letter = r.pick(c.letters);
  const good = c.words.filter((w) => w.w[0] === letter && w.w !== 'bill');
  const bad = c.words.filter((w) => w.w[0] !== letter);
  if (!good.length || bad.length < 2) return null;
  const right = r.pick(good);
  return Q.sc(`Từ nào bắt đầu bằng chữ ${letter}?`, r.shuffle([right.w, ...r.sample(bad, 2).map((x) => x.w)]), right.w,
    M('A1.ABC.02', 'TA.CHUCAI', 'chu_cai', l, `"${right.w}" bắt đầu bằng chữ ${letter}.`));
};
const missingLetter: ETemplate = (r, c, l) => {
  const w = pickFresh(r, c, c.words.filter((x) => x.w.length >= 3 && x.w.length <= 6 && x.w !== 'bill'));
  if (!w) return null;
  const i = r.int(0, w.w.length - 1);
  const ch = w.w[i];
  const pool = [...new Set(c.words.flatMap((x) => x.w.split('')))].filter((x) => x !== ch);
  if (pool.length < 2) return null;
  const masked = w.w.slice(0, i) + '_' + w.w.slice(i + 1);
  return Q.sc(`Điền chữ cái còn thiếu: ${masked} (${w.vi})`, r.shuffle([ch, ...r.sample(pool, 2)]), ch,
    M('A1.ABC.01', 'TA.CHUCAI', 'chu_cai', l, `Từ đúng: ${w.w}.`));
};
const meaningToWord: ETemplate = (r, c, l) => {
  const w = pickFresh(r, c, c.words.filter((x) => x.w !== 'bill'));
  if (!w) return null;
  const o = others(r, c.words.filter((x) => x.w !== 'bill'), w, 2, (x) => x.w);
  if (o.length < 2) return null;
  return Q.sc(`"${w.vi}" tiếng Anh là gì?`, r.shuffle([w.w, ...o.map((x) => x.w)]), w.w,
    M(OUTCOME(w), 'TA.TUVUNG', 'tu_vung', l, `${w.vi} = ${w.w}.`));
};

// --------------------------------------------------------------------------- L3
const matchMeaning: ETemplate = (r, c, l) => {
  const ws = r.sample(c.words.filter((x) => x.w !== 'bill'), 3);
  if (ws.length < 3 || new Set(ws.map((w) => w.vi)).size < 3) return null;
  return Q.mt('Nối từ tiếng Anh với nghĩa.', ws.map((w) => [w.w, w.vi]),
    M('A1.EXTRA.02', 'TA.NOINGHIA', 'tu_vung', l, ws.map((w) => `${w.w} = ${w.vi}`).join('; ') + '.',
      'Đọc từng từ, nhớ lại nghĩa đã học: ' + ws.map((w) => `${w.w} – ${w.vi}`).join('; ') + '.'));
};
const matchPicture: ETemplate = (r, c, l) => {
  const ws = r.sample(c.words.filter((x) => x.emoji), 3);
  if (ws.length < 3) return null;
  return Q.mt('Nối tranh với từ tiếng Anh.', ws.map((w) => [w.emoji as string, w.w]),
    M('A1.EXTRA.02', 'TA.NOINGHIA', 'tu_vung', l, ws.map((w) => `${w.emoji} = ${w.w}`).join('; ') + '.',
      'Nhìn từng tranh, nói tên tiếng Anh rồi nối: ' + ws.map((w) => `${w.emoji} – ${w.w} (${w.vi})`).join('; ') + '.'));
};
const allWithLetter: ETemplate = (r, c, l) => {
  if (c.letters.length < 2) return null;
  const letter = r.pick(c.letters);
  const good = c.words.filter((w) => w.w[0] === letter && w.w !== 'bill');
  const bad = c.words.filter((w) => w.w[0] !== letter && w.w !== 'bill');
  if (good.length < 2 || bad.length < 2) return null;
  const g = r.sample(good, Math.min(3, good.length));
  const b = r.sample(bad, Math.min(5 - g.length, bad.length));
  return Q.mc(`Chọn TẤT CẢ các từ bắt đầu bằng chữ ${letter}.`, r.shuffle([...g, ...b].map((w) => w.w)), g.map((w) => w.w),
    M('A1.ABC.02', 'TA.NHOMTU', 'chu_cai', l, `Các từ bắt đầu bằng ${letter}: ${g.map((w) => w.w).join(', ')}.`,
      `Nhìn chữ cái đầu tiên của từng từ. Các từ bắt đầu bằng ${letter}: ${g.map((w) => w.w).join(', ')}.`));
};
const spell: ETemplate = (r, c, l) => {
  const cands = c.words.filter((w) => w.w.length >= 3 && w.w.length <= 5 && new Set(w.w).size === w.w.length && w.w !== 'bill');
  const w = pickFresh(r, c, cands);
  if (!w) return null;
  return Q.ord(`Xếp các chữ cái thành từ có nghĩa là "${w.vi}".`, w.w.split(''),
    M('A1.ABC.01', 'TA.CHUCAI', 'chu_cai', l, `Từ đúng: ${w.w}.`, `"${w.vi}" tiếng Anh là ${w.w}: ${w.w.split('').join(' – ')}.`));
};

// --------------------------------------------------------------------------- L4
const FRAMES = [
  { en: (w: EWord) => `I have ${art(w)} ${w.w}.`, vi: (w: EWord) => `Em có một ${w.vi}.` },
  { en: (w: EWord) => `This is my ${w.w}.`, vi: (w: EWord) => `Đây là ${w.vi} của em.` },
  { en: (w: EWord) => `I can see ${art(w)} ${w.w}.`, vi: (w: EWord) => `Em nhìn thấy một ${w.vi}.` },
];
// Mẫu câu dùng từ unit nào (theo bộ câu soạn sẵn): I have a … (Unit 3), This is my … (Review 1 / Unit 4), I can see a … (Unit 7)
const frameUnit = (i: number) => (i === 0 ? 3 : i === 1 ? 4 : 7);

const completeFrame: ETemplate = (r, c, l) => {
  const fs = FRAMES.map((f, i) => ({ f, i })).filter(({ i }) => frameUnit(i) <= c.unit);
  if (!fs.length) return null;
  const { f } = r.pick(fs);
  const things = c.words.filter((w) => w.thing && w.emoji);
  const w = pickFresh(r, c, things);
  if (!w) return null;
  const o = others(r, things, w, 2, (x) => x.w);
  if (o.length < 2) return null;
  const sentence = blankLast(f.en(w), w.w);
  return Q.sc(`Nhìn tranh, chọn từ điền vào chỗ trống: "${sentence}"`, r.shuffle([w.w, ...o.map((x) => x.w)]), w.w,
    M('A1.SCHOOL.01', 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} = ${f.vi(w)}`, `Tranh vẽ ${w.vi} (${w.w}). Câu đúng: ${f.en(w)}`), { figure: one(w) });
};
const orderWords: ETemplate = (r, c, l) => {
  const fs = FRAMES.map((f, i) => ({ f, i })).filter(({ i }) => frameUnit(i) <= c.unit);
  if (!fs.length) return null;
  const { f } = r.pick(fs);
  const w = pickFresh(r, c, c.words.filter((x) => x.thing));
  if (!w) return null;
  const ws = f.en(w).split(' ');
  if (new Set(ws.map((x) => x.toLowerCase())).size !== ws.length) return null;
  return Q.ord('Sắp xếp các từ thành câu đúng.', ws,
    M('A1.SCHOOL.01', 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} = ${f.vi(w)}`,
      `Mẫu câu đã học: ${ws.join(' – ')}. Từ viết hoa (I hoặc This) đứng đầu, từ có dấu chấm đứng cuối.`));
};
const wordTable: ETemplate = (r, c, l) => {
  const ws = r.sample(c.words.filter((x) => x.w !== 'bill'), 4);
  if (ws.length < 4) return null;
  const rows: [string, boolean][] = ws.map((w) => {
    const truthy = r.chance(0.5);
    const shown = truthy ? w : r.pick(c.words.filter((x) => x.vi !== w.vi && x.w !== 'bill'));
    return [`"${w.w}" nghĩa là ${shown.vi}.`, shown.vi === w.vi];
  });
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', rows,
    M('A1.EXTRA.02', 'TA.NOINGHIA', 'tu_vung', l, ws.map((w) => `${w.w} = ${w.vi}`).join('; ') + '.',
      'Nhớ lại nghĩa của từng từ: ' + ws.map((w) => `${w.w} – ${w.vi}`).join('; ') + '. Đối chiếu với từng dòng.'));
};

// --------------------------------------------------------------------------- L5
const aOrAn: ETemplate = (r, c, l) => {
  if (c.unit < 3) return null; // apple học ở Unit 3
  const fs = FRAMES.filter((_, i) => i !== 1 && frameUnit(i) <= c.unit);
  if (!fs.length) return null;
  const f = r.pick(fs);
  const things = c.words.filter((w) => w.thing);
  const w = r.chance(0.4) ? things.find((x) => x.an) : r.pick(things);
  if (!w) return null;
  const sentence = f.en(w).replace(` ${art(w)} `, ' ___ ');
  return Q.sc(`Chọn a hay an: "${sentence}"`, ['a', 'an'], art(w),
    M('A1.SCHOOL.01', 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)}`,
      `"an" đứng trước từ bắt đầu bằng nguyên âm (a, e, i, o, u) như apple; các từ khác dùng "a". "${w.w}" bắt đầu bằng chữ ${w.w[0]} nên dùng "${art(w)}".`));
};
const sentenceMeaning: ETemplate = (r, c, l) => {
  const fs = FRAMES.map((f, i) => ({ f, i })).filter(({ i }) => frameUnit(i) <= c.unit);
  if (!fs.length) return null;
  const { f } = r.pick(fs);
  const things = c.words.filter((w) => w.thing);
  const w = pickFresh(r, c, things);
  if (!w) return null;
  const o = others(r, things, w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc(`"${f.en(w)}" nghĩa là gì?`, r.shuffle([f.vi(w), ...o.map((x) => f.vi(x))]), f.vi(w),
    M('A1.SCHOOL.01', 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} = ${f.vi(w)}`, `Từ quan trọng trong câu là "${w.w}" = ${w.vi}. Vậy câu nghĩa là: ${f.vi(w)}`));
};
const pictureForSentence: ETemplate = (r, c, l) => {
  const fs = FRAMES.map((f, i) => ({ f, i })).filter(({ i }) => frameUnit(i) <= c.unit);
  if (!fs.length) return null;
  const { f } = r.pick(fs);
  const things = c.words.filter((w) => w.thing && w.emoji);
  const w = pickFresh(r, c, things);
  if (!w) return null;
  const o = others(r, things, w, 2, (x) => x.w);
  if (o.length < 2) return null;
  const all = r.shuffle([w, ...o]);
  const labels = ['Tranh A', 'Tranh B', 'Tranh C'];
  const figs: Record<string, Figure> = {};
  all.forEach((x, i) => (figs[labels[i]] = one(x)));
  const right = labels[all.indexOf(w)];
  return Q.sc(`Chọn tranh đúng với câu: "${f.en(w)}"`, labels, right,
    M('A1.SCHOOL.01', 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} — ${w.vi}.`, `"${w.w}" nghĩa là ${w.vi}, nên chọn tranh có ${w.vi} (${right}).`), { optionFigures: figs });
};

const oddLetter: ETemplate = (r, c, l) => {
  const byLetter = new Map<string, EWord[]>();
  for (const w of c.words) if (w.w !== 'bill') byLetter.set(w.w[0], [...(byLetter.get(w.w[0]) ?? []), w]);
  const big = [...byLetter.entries()].filter(([, ws]) => ws.length >= 3);
  if (!big.length || byLetter.size < 2) return null;
  const [letter, ws] = r.pick(big);
  const same = r.sample(ws, 3);
  const odd = r.pick(c.words.filter((w) => w.w[0] !== letter && w.w !== 'bill'));
  return Q.sc('Từ nào KHÔNG cùng chữ cái đầu với các từ còn lại?', r.shuffle([...same, odd].map((w) => w.w)), odd.w,
    M('A1.ABC.02', 'TA.NHOMTU', 'chu_cai', l, `${same.map((w) => w.w).join(', ')} bắt đầu bằng ${letter}; "${odd.w}" bắt đầu bằng ${odd.w[0]}.`,
      `Nhìn chữ cái đầu của từng từ: ${[...same, odd].map((w) => `${w.w} – ${w.w[0]}`).join(', ')}. Chỉ "${odd.w}" khác.`));
};
const matchFour: ETemplate = (r, c, l) => {
  const ws = r.sample(c.words.filter((x) => x.emoji), 4);
  if (ws.length < 4) return null;
  return Q.mt('Nối 4 tranh với 4 từ tiếng Anh.', ws.map((w) => [w.emoji as string, w.w]),
    M('A1.EXTRA.02', 'TA.NOINGHIA', 'tu_vung', l, ws.map((w) => `${w.emoji} = ${w.w}`).join('; ') + '.',
      'Nhìn từng tranh, nói tên tiếng Anh rồi nối: ' + ws.map((w) => `${w.emoji} – ${w.w} (${w.vi})`).join('; ') + '.'));
};

// Chào hỏi (Unit 1): dùng được cho mọi unit
const greetTable: ETemplate = (r, c, l) => {
  const facts: [string, boolean][] = r.shuffle<[string, boolean]>([
    ['"Hello" là lời chào khi gặp nhau.', true],
    ['"Goodbye" là lời chào khi gặp nhau.', false],
    ['"Goodbye" là lời chào khi chia tay.', true],
    ['"Hello" là lời chào khi chia tay.', false],
    ['"I\'m Bill." nghĩa là "Mình là Bill."', true],
  ]).slice(0, 2);
  const ws = r.sample(c.words.filter((x) => x.w !== 'bill'), 2);
  const rows: [string, boolean][] = [...facts, ...ws.map((w): [string, boolean] => {
    const truthy = r.chance(0.5);
    const shown = truthy ? w : r.pick(c.words.filter((x) => x.vi !== w.vi && x.w !== 'bill'));
    return [`"${w.w}" nghĩa là ${shown.vi}.`, shown.vi === w.vi];
  })];
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', r.shuffle(rows),
    M('A1.HELLO.01', 'TA.TUVUNG', 'chao_hoi', l, 'Hello: chào khi gặp; Goodbye: chào khi chia tay.',
      'Nhớ lại: "Hello" chào khi gặp nhau, "Goodbye" chào khi chia tay, "I\'m …" để nói tên mình. ' + ws.map((w) => `${w.w} – ${w.vi}`).join('; ') + '.'));
};
const introduce: ETemplate = (r, c, l) => {
  const things = c.words.filter((w) => w.thing);
  if (things.length < 2) return null;
  const wrong = r.sample(things, 2).map((w) => `Hello, I'm ${w.w}.`);
  return Q.sc('Bạn Bill muốn giới thiệu tên mình. Bạn ấy nói câu nào?', r.shuffle(["Hello, I'm Bill.", ...wrong]), "Hello, I'm Bill.",
    M('A1.HELLO.03', 'TA.MAUCAU', 'chao_hoi', l, '"I\'m Bill." = "Mình là Bill."',
      `"I'm …" dùng để nói tên mình. Bill là tên bạn ấy; ${wrong.map((x) => x.replace("Hello, I'm ", '').replace('.', '')).join(', ')} là đồ vật, không phải tên.`));
};
const orderGreeting: ETemplate = (r, c, l) => {
  const name = 'Bill.';
  const ws = r.pick([['Hello,', "I'm", name], ['Hi,', "I'm", name], ['Goodbye,', name]]);
  return Q.ord('Sắp xếp các từ thành câu đúng.', ws,
    M('A1.HELLO.03', 'TA.MAUCAU', 'chao_hoi', l, ws.join(' '), `Lời chào đứng đầu (có dấu phẩy), tên có dấu chấm đứng cuối: ${ws.join(' ')}`));
};

export type EPool = Record<Level, ETemplate[]>;
export const TA1_POOL: EPool = {
  1: [picToWord, wordToMeaning],
  2: [startLetter, missingLetter, meaningToWord],
  3: [matchMeaning, matchPicture, allWithLetter, spell],
  4: [completeFrame, orderWords, wordTable, oddLetter, greetTable],
  5: [aOrAn, sentenceMeaning, pictureForSentence, matchFour, introduce, orderGreeting],
};

export function taContext(unit: number): ECtx {
  const words: EWord[] = [];
  for (let u = 1; u <= Math.min(unit, 16); u++) for (const w of GS1_VOCAB[u].words) words.push({ w, unit: u, ...INFO[w] });
  return {
    unit,
    words,
    fresh: words.filter((w) => w.unit === unit),
    letters: Object.entries(GS1_VOCAB).filter(([u]) => Number(u) <= unit).map(([, v]) => v.letter),
  };
}

// =========================================================================== HỌC KÌ 2 (Unit 9–16)
// Mẫu câu: How many …? (U9, số 1–5; U16 số 6–10) · That's a … (U10) · She's/He's running (U11)
// Look at the … (U12) · She's having … (U13) · I can see a … (U14) · Point to your … (U15).

const NUM = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const NUM_VI = ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
const maxNum = (c: ECtx) => (c.unit >= 16 ? 10 : 5);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const many = (w: EWord, n: number): Figure => ({ kind: 'objects', groups: [{ icon: w.emoji as string, count: n }], alt: `Tranh ${n} sự vật` });

const howMany: ETemplate = (r, c, l) => {
  if (c.unit < 9) return null;
  const w = pickFresh(r, c, c.words.filter((x) => x.thing && x.emoji && !['garden', 'door'].includes(x.w)));
  if (!w) return null;
  const n = r.int(2, maxNum(c));
  const opts = r.sample(NUM.slice(0, maxNum(c)).filter((x) => x !== NUM[n - 1]), 2);
  return Q.sc(`How many ${enPlural(w.w)}? (Có mấy ${w.vi}?)`, r.shuffle([cap(NUM[n - 1]), ...opts.map(cap)]), cap(NUM[n - 1]),
    M('A1.NUM.02', 'TA.MAUCAU', 'so_dem', l, `Có ${n} ${w.vi}: ${NUM[n - 1]}.`, `Đếm từng ${w.vi} trong tranh: được ${n}. Số ${n} tiếng Anh là "${NUM[n - 1]}".`),
    { figure: many(w, n) });
};
const numberWord: ETemplate = (r, c, l) => {
  if (c.unit < 9) return null;
  const n = r.int(1, maxNum(c));
  if (r.chance(0.5)) {
    const opts = r.sample(NUM.slice(0, maxNum(c)).filter((x) => x !== NUM[n - 1]), 2);
    return Q.sc(`Số ${n} tiếng Anh là gì?`, r.shuffle([NUM[n - 1], ...opts]), NUM[n - 1],
      M('A1.NUM.01', 'TA.TUVUNG', 'so_dem', l, `${n} = ${NUM[n - 1]}.`));
  }
  const opts = r.sample([...Array(maxNum(c)).keys()].map((i) => String(i + 1)).filter((x) => x !== String(n)), 2);
  return Q.sc(`"${NUM[n - 1]}" là số mấy?`, r.shuffle([String(n), ...opts]), String(n),
    M('A1.NUM.01', 'TA.TUVUNG', 'so_dem', l, `${NUM[n - 1]} = ${n} (${NUM_VI[n - 1]}).`));
};
const orderNumbers: ETemplate = (r, c, l) => {
  if (c.unit < 9) return null;
  const start = r.int(0, maxNum(c) - 4);
  const ws = NUM.slice(start, start + 4);
  return Q.ord('Sắp xếp các số từ bé đến lớn.', ws,
    M('A1.NUM.01', 'TA.TUVUNG', 'so_dem', l, ws.join(', ') + '.', ws.map((w, i) => `${w} = ${start + i + 1}`).join('; ') + '.'));
};

type Frame2 = { unit: number; ok: (w: EWord) => boolean; en: (w: EWord) => string; vi: (w: EWord) => string; key: (w: EWord) => string; outcome: string };
const FOOD: Record<string, string> = { noodles: 'noodles', banana: 'a banana', nut: 'nuts', apple: 'an apple', mango: 'a mango', milk: 'milk', chips: 'chips', chicken: 'chicken', fish: 'fish', cake: 'cake', lemon: 'a lemon' };
const FRAMES2: Frame2[] = [
  { unit: 10, ok: (w) => w.thing, en: (w) => `That's ${art(w)} ${w.w}.`, vi: (w) => `Đó là một ${w.vi}.`, key: (w) => w.w, outcome: 'A1.ANIMAL.01' },
  { unit: 12, ok: (w) => w.thing, en: (w) => `Look at the ${enPlural(w.w)}.`, vi: (w) => `Hãy nhìn những ${w.vi} kìa.`, key: (w) => enPlural(w.w), outcome: 'A1.EXTRA.02' },
  { unit: 13, ok: (w) => w.w in FOOD, en: (w) => `She's having ${FOOD[w.w]}.`, vi: (w) => `Bạn ấy đang ăn ${w.vi}.`, key: (w) => FOOD[w.w].replace(/^an? /, ''), outcome: 'A1.EXTRA.02' },
  { unit: 15, ok: (w) => BODY.includes(w.w), en: (w) => `Point to your ${w.w}.`, vi: (w) => `Hãy chỉ vào ${w.vi} của em.`, key: (w) => w.w, outcome: 'A1.EXTRA.03' },
];
const frames2 = (c: ECtx) => FRAMES2.filter((f) => f.unit <= c.unit);

const frame2Complete: ETemplate = (r, c, l) => {
  const fs = frames2(c);
  if (!fs.length) return null;
  const f = r.pick(fs);
  const pool = c.words.filter((w) => f.ok(w) && w.emoji);
  const w = pickFresh(r, c, pool);
  if (!w) return null;
  const o = others(r, pool, w, 2, (x) => f.key(x));
  if (o.length < 2) return null;
  const en = f.en(w);
  const k = f.key(w);
  return Q.sc(`Nhìn tranh, chọn từ điền vào chỗ trống: "${blankLast(en, k)}"`, r.shuffle([k, ...o.map((x) => f.key(x))]), k,
    M(f.outcome, 'TA.MAUCAU', 'mau_cau', l, `${en} = ${f.vi(w)}`, `Tranh vẽ ${w.vi} (${w.w}). Câu đúng: ${en}`), { figure: one(w) });
};
const frame2Meaning: ETemplate = (r, c, l) => {
  const fs = frames2(c);
  if (!fs.length) return null;
  const f = r.pick(fs);
  const pool = c.words.filter((w) => f.ok(w));
  const w = pickFresh(r, c, pool);
  if (!w) return null;
  const o = others(r, pool, w, 2, (x) => x.vi);
  if (o.length < 2) return null;
  return Q.sc(`"${f.en(w)}" nghĩa là gì?`, r.shuffle([f.vi(w), ...o.map((x) => f.vi(x))]), f.vi(w),
    M(f.outcome, 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} = ${f.vi(w)}`, `Từ quan trọng là "${f.key(w)}" (${w.vi}). Vậy câu nghĩa là: ${f.vi(w)}`));
};
const frame2Order: ETemplate = (r, c, l) => {
  const fs = frames2(c);
  if (!fs.length) return null;
  const f = r.pick(fs);
  const w = pickFresh(r, c, c.words.filter((x) => f.ok(x)));
  if (!w) return null;
  const ws = f.en(w).split(' ');
  if (ws.length < 3 || new Set(ws.map((x) => x.toLowerCase())).size !== ws.length) return null;
  return Q.ord('Sắp xếp các từ thành câu đúng.', ws,
    M(f.outcome, 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} = ${f.vi(w)}`, `Câu đúng: ${ws.join(' – ')}. Từ viết hoa đứng đầu, từ có dấu chấm đứng cuối.`));
};
const frame2Picture: ETemplate = (r, c, l) => {
  const fs = frames2(c);
  if (!fs.length) return null;
  const f = r.pick(fs);
  const pool = c.words.filter((w) => f.ok(w) && w.emoji);
  const w = pickFresh(r, c, pool);
  if (!w) return null;
  const o = others(r, pool, w, 2, (x) => x.w);
  if (o.length < 2) return null;
  const all = r.shuffle([w, ...o]);
  const labels = ['Tranh A', 'Tranh B', 'Tranh C'];
  const figs: Record<string, Figure> = {};
  all.forEach((x, i) => (figs[labels[i]] = one(x)));
  const right = labels[all.indexOf(w)];
  return Q.sc(`Chọn tranh đúng với câu: "${f.en(w)}"`, labels, right,
    M(f.outcome, 'TA.MAUCAU', 'mau_cau', l, `${f.en(w)} — ${f.vi(w)}`, `"${w.w}" nghĩa là ${w.vi}, nên chọn tranh có ${w.vi} (${right}).`), { optionFigures: figs });
};
const heShe: ETemplate = (r, c, l) => {
  if (c.unit < 11) return null;
  const boy = r.chance(0.5);
  const right = boy ? "He's running." : "She's running.";
  return Q.sc(`${boy ? '👦 Bạn trai' : '👧 Bạn gái'} đang chạy. Em nói câu nào?`, ["He's running.", "She's running."], right,
    M('A1.HELLO.02', 'TA.MAUCAU', 'mau_cau', l, `${right}`, `"He" dùng cho bạn trai, "She" dùng cho bạn gái. "running" = đang chạy. Câu đúng: ${right}`));
};
const family: ETemplate = (r, c, l) => {
  if (c.unit < 15) return null;
  const who = r.pick([{ w: 'father', vi: 'bố', e: '👨' }, { w: 'mother', vi: 'mẹ', e: '👩' }]);
  return Q.sc(`${who.e} Em giới thiệu ${who.vi} của mình. Em nói:`, r.shuffle([`This is my ${who.w}.`, `This is my ${who.w === 'father' ? 'mother' : 'father'}.`, 'This is my monkey.']), `This is my ${who.w}.`,
    M('A1.FAMILY.02', 'TA.MAUCAU', 'mau_cau', l, `${who.vi} = ${who.w}.`, `"This is my …" = "Đây là … của em". ${cap(who.vi)} là "${who.w}", nên nói: This is my ${who.w}.`));
};

const mergePool = (a: EPool, b: Partial<EPool>): EPool =>
  Object.fromEntries(([1, 2, 3, 4, 5] as Level[]).map((lv) => [lv, [...a[lv], ...(b[lv] ?? [])]])) as EPool;
export const TA2_POOL: EPool = mergePool(TA1_POOL, {
  1: [numberWord],
  2: [howMany],
  3: [orderNumbers, heShe],
  4: [frame2Complete, frame2Order, howMany],
  5: [frame2Meaning, frame2Picture, family],
});
