// BỘ SINH CÂU NGẪU NHIÊN — TIẾNG VIỆT 1, HỌC KÌ 1 (bám trình tự 83 bài của sách Kết nối tri thức, 17 tuần).
//
// Dạng bài tham khảo vở bài tập Tiếng Việt 1 (học liệu NXB Giáo dục): tô/chọn tiếng theo âm đầu, nối tiếng với vần,
// tìm dấu thanh, ghép âm – vần – thanh, nối tranh với từ, điền c/k – g/gh – ng/ngh, đọc câu trả lời câu hỏi,
// sắp xếp từ thành câu, đếm tiếng có vần/dấu trong câu. Từ ngữ, câu do EduChain Kids soạn (viet-words.ts).
//
// KHÔNG VƯỢT TRƯỚC: mỗi tuần chỉ dùng từ và câu mà mọi tiếng đều đã học (âm đầu, vần, dấu thanh) đến hết tuần đó.
// Kiểm tra tự động: npm run check:practice

import type { Level } from '../content/types';
import { ONSETS, RIMES, TONES, parseSyllable, type Syllable, type ToneName } from '../content/viet-inventory';
import type { Figure } from '../figures';
import { Q, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { VSENTENCES, VWORDS, type VWord } from './viet-words';

export type VCtx = {
  week: number;
  to: number; // đã học đến hết bài số `to`
  from: number;
  tieng: { w: string; s: Syllable }[]; // các tiếng (từ 1 tiếng) dùng được
  pics: VWord[]; // từ có tranh
  sentences: { s: string; who: string; q: string }[];
  onsets: string[]; // âm đầu đã học
  newOnsets: string[]; // âm đầu mới của tuần
  rimes: string[];
  newRimes: string[];
  tones: ToneName[]; // dấu thanh đã học (không gồm thanh ngang)
};
export type VTemplate = (r: Rng, c: VCtx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string) => ({ o, f, k, l, e, s });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const TONE_TEXT: Record<ToneName, string> = { ngang: 'không có dấu', huyền: 'dấu huyền', sắc: 'dấu sắc', hỏi: 'dấu hỏi', nặng: 'dấu nặng', ngã: 'dấu ngã' };
const lessonOfText = (t: string) => {
  let m = 0;
  for (const w of t.toLowerCase().split(/[\s.,!?]+/).filter(Boolean)) {
    const p = parseSyllable(w);
    if (!p) return 999;
    m = Math.max(m, p.lesson);
  }
  return m;
};
const syllablesOf = (sentence: string) => sentence.split(/\s+/).map((w) => w.replace(/[.,!?]/g, '')).filter(Boolean);

/** Ưu tiên phần tử "mới" của tuần (khoảng 60%) */
function pickFocus<T>(r: Rng, all: T[], fresh: T[]): T | undefined {
  if (fresh.length && r.chance(0.6)) return r.pick(fresh);
  return all.length ? r.pick(all) : undefined;
}

// ===========================================================================
// L1
// ===========================================================================
const onsetPick: VTemplate = (r, c, l) => {
  const x = pickFocus(r, c.onsets, c.newOnsets);
  if (!x) return null;
  const good = c.tieng.filter((t) => t.s.onset === x);
  const bad = c.tieng.filter((t) => t.s.onset !== x);
  if (!good.length || bad.length < 2) return null;
  const right = r.pick(good).w;
  const opts = r.shuffle([right, ...r.sample([...new Set(bad.map((t) => t.w))], 2)]);
  return Q.sc(`Tiếng nào bắt đầu bằng chữ ${x}?`, opts, right,
    M('V1.AM.01', 'TV.AMCHU', 'am_dau', l, `Tiếng '${right}' bắt đầu bằng chữ ${x}.`));
};

const tonePick: VTemplate = (r, c, l) => {
  if (!c.tones.length) return null;
  const tone = r.pick(c.tones);
  const good = c.tieng.filter((t) => t.s.tone === tone);
  const bad = c.tieng.filter((t) => t.s.tone !== tone);
  if (!good.length || bad.length < 2) return null;
  const right = r.pick(good).w;
  const opts = r.shuffle([right, ...r.sample([...new Set(bad.map((t) => t.w))], 2)]);
  return Q.sc(`Tiếng nào có ${TONE_TEXT[tone]}?`, opts, right,
    M('V1.AM.02', 'TV.DAUTHANH', 'dau_thanh', l, `Tiếng '${right}' có ${TONE_TEXT[tone]}.`));
};

const picture: VTemplate = (r, c, l) => {
  if (c.pics.length < 3) return null;
  const right = r.pick(c.pics);
  const others = r.sample(c.pics.filter((p) => p.w !== right.w && p.emoji !== right.emoji), 2);
  if (others.length < 2) return null;
  const fig: Figure = { kind: 'objects', groups: [{ icon: right.emoji as string, count: 1 }], alt: 'Tranh một sự vật' };
  return Q.sc('Tranh vẽ gì? Chọn từ đúng.', r.shuffle([right.w, ...others.map((o) => o.w)]), right.w,
    M('V1.DOC.05', 'TV.NOITU', 'tu_tranh', l, `Tranh vẽ '${right.w}'.`), { figure: fig });
};

// ===========================================================================
// L2
// ===========================================================================
const onsetOf: VTemplate = (r, c, l) => {
  const cands = c.tieng.filter((t) => t.s.onset);
  if (!cands.length || c.onsets.length < 3) return null;
  const t = r.pick(cands);
  const opts = r.shuffle([t.s.onset, ...r.sample(c.onsets.filter((o) => o !== t.s.onset && o[0] !== t.s.onset[0]), 2)]);
  if (opts.length < 3) return null;
  return Q.sc(`Tiếng '${t.w}' có âm đầu là gì?`, opts, t.s.onset,
    M('V1.AM.01', 'TV.AMCHU', 'am_dau', l, `'${t.w}' gồm âm ${t.s.onset} và vần ${t.s.rime}${t.s.tone === 'ngang' ? '' : `, ${TONE_TEXT[t.s.tone]}`}.`));
};

const rimeOf: VTemplate = (r, c, l) => {
  if (c.rimes.length < 3) return null;
  const pool = c.tieng.filter((t) => c.newRimes.includes(t.s.rime));
  const t = pool.length && r.chance(0.6) ? r.pick(pool) : r.pick(c.tieng);
  if (!t) return null;
  const opts = r.shuffle([t.s.rime, ...r.sample(c.rimes.filter((x) => x !== t.s.rime), 2)]);
  return Q.sc(`Tiếng '${t.w}' có vần gì?`, opts, t.s.rime,
    M('V1.AM.03', 'TV.GHEPVAN', 'van', l, `'${t.w}' = ${t.s.onset ? `${t.s.onset} + ` : ''}${t.s.rime}${t.s.tone === 'ngang' ? '' : ` + ${TONE_TEXT[t.s.tone]}`}. Vần là ${t.s.rime}.`));
};

const toneOf: VTemplate = (r, c, l) => {
  if (c.tones.length < 2) return null;
  const t = r.pick(c.tieng);
  if (!t) return null;
  const all: ToneName[] = ['ngang', ...c.tones];
  const opts = r.shuffle([t.s.tone, ...r.sample(all.filter((x) => x !== t.s.tone), 2)]).map((x) => cap(TONE_TEXT[x]));
  return Q.sc(`Tiếng '${t.w}' có dấu thanh gì?`, opts, cap(TONE_TEXT[t.s.tone]),
    M('V1.AM.02', 'TV.DAUTHANH', 'dau_thanh', l, `Tiếng '${t.w}' ${TONE_TEXT[t.s.tone]}.`));
};

const assemble: VTemplate = (r, c, l) => {
  const cands = c.tieng.filter((t) => t.s.onset);
  if (cands.length < 4) return null;
  const t = r.pick(cands);
  const near = c.tieng.filter((x) => x.w !== t.w && (x.s.onset === t.s.onset || x.s.rime === t.s.rime));
  const pool = near.length >= 2 ? near : c.tieng.filter((x) => x.w !== t.w);
  const opts = r.shuffle([t.w, ...r.sample([...new Set(pool.map((x) => x.w))], 2)]);
  if (new Set(opts).size < 3) return null;
  const parts = `${t.s.onset} + ${t.s.rime}${t.s.tone === 'ngang' ? '' : ` + ${TONE_TEXT[t.s.tone]}`}`;
  return Q.sc(`Ghép ${parts}, được tiếng nào?`, opts, t.w,
    M('V1.DOC.01', 'TV.GHEPVAN', 'ghep_tieng', l, `${parts} = ${t.w}.`));
};

// ===========================================================================
// L3
// ===========================================================================
const allWithOnset: VTemplate = (r, c, l) => {
  const x = pickFocus(r, c.onsets, c.newOnsets);
  if (!x) return null;
  const good = [...new Set(c.tieng.filter((t) => t.s.onset === x).map((t) => t.w))];
  const bad = [...new Set(c.tieng.filter((t) => t.s.onset !== x).map((t) => t.w))];
  if (good.length < 2 || bad.length < 2) return null;
  const g = r.sample(good, Math.min(good.length, r.int(2, 3)));
  const b = r.sample(bad, 5 - g.length);
  if (b.length < 5 - g.length) return null;
  return Q.mc(`Chọn TẤT CẢ các tiếng bắt đầu bằng chữ ${x}.`, r.shuffle([...g, ...b]), g,
    M('V1.AM.01', 'TV.AMCHU', 'am_dau', l, `Các tiếng có chữ ${x}: ${g.join(', ')}.`,
      `Đọc từng tiếng, nhìn chữ đứng đầu. Tiếng nào bắt đầu bằng ${x} thì chọn: ${g.join(', ')}.`));
};

const matchRime: VTemplate = (r, c, l) => {
  const byRime = new Map<string, string[]>();
  for (const t of c.tieng) byRime.set(t.s.rime, [...(byRime.get(t.s.rime) ?? []), t.w]);
  const rimes = [...byRime.keys()];
  if (rimes.length < 3) return null;
  const chosen = r.sample(rimes.filter((x) => c.newRimes.includes(x)).concat(r.shuffle(rimes)), 6).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
  if (chosen.length < 3) return null;
  const pairs: [string, string][] = chosen.map((rm) => [r.pick(byRime.get(rm) as string[]), rm]);
  return Q.mt('Nối mỗi tiếng với vần của tiếng đó.', pairs,
    M('V1.AM.03', 'TV.GHEPVAN', 'van', l, pairs.map(([w, v]) => `${w} – vần ${v}`).join('; ') + '.',
      'Đọc từng tiếng, bỏ âm đầu và dấu thanh ra, phần còn lại là vần: ' + pairs.map(([w, v]) => `${w} → ${v}`).join('; ') + '.'));
};

const matchPicture: VTemplate = (r, c, l) => {
  const uniq = c.pics.filter((p, i, a) => a.findIndex((q) => q.emoji === p.emoji) === i);
  if (uniq.length < 3) return null;
  const chosen = r.sample(uniq, 3);
  const pairs: [string, string][] = chosen.map((p) => [p.emoji as string, p.w]);
  return Q.mt('Nối tranh với từ phù hợp.', pairs,
    M('V1.DOC.05', 'TV.NOITU', 'tu_tranh', l, chosen.map((p) => p.w).join(', ') + '.',
      'Nhìn từng tranh, đọc tên sự vật trong tranh rồi tìm từ có cùng tên: ' + chosen.map((p) => `${p.emoji} – ${p.w}`).join('; ') + '.'));
};

const SPELL: { pair: [string, string]; rule: string }[] = [
  { pair: ['c', 'k'], rule: 'k đứng trước e, ê, i; c đứng trước các âm còn lại' },
  { pair: ['g', 'gh'], rule: 'gh đứng trước e, ê, i; g đứng trước các âm còn lại' },
  { pair: ['ng', 'ngh'], rule: 'ngh đứng trước e, ê, i; ng đứng trước các âm còn lại' },
];
const spelling: VTemplate = (r, c, l) => {
  const rules = SPELL.filter((x) => x.pair.every((o) => ONSETS[o] <= c.to));
  if (!rules.length) return null;
  const rule = r.pick(rules);
  const cands = c.tieng.filter((t) => rule.pair.includes(t.s.onset));
  if (!cands.length) return null;
  const t = r.pick(cands);
  const rest = t.w.slice(t.s.onset.length);
  return Q.sc(`Điền ${rule.pair[0]} hay ${rule.pair[1]} vào chỗ trống: '_${rest}'`, [...rule.pair], t.s.onset,
    M('V1.AM.04', 'TV.CHINHTA', 'chinh_ta', l, `Viết là '${t.w}'.`, `Quy tắc chính tả: ${rule.rule}. Vì vậy viết '${t.w}'.`));
};

// ===========================================================================
// L4
// ===========================================================================
const facts: VTemplate = (r, c, l) => {
  const ts = r.sample(c.tieng, 4);
  if (ts.length < 4) return null;
  const rows: [string, boolean][] = ts.map((t) => {
    const kind = r.pick(['onset', 'rime', 'tone'] as const);
    const truthy = r.chance(0.5);
    if (kind === 'onset' && t.s.onset) {
      const shown = truthy ? t.s.onset : r.pick(c.onsets.filter((o) => o !== t.s.onset)) ?? t.s.onset;
      return [`Tiếng '${t.w}' có âm đầu ${shown}.`, shown === t.s.onset];
    }
    if (kind === 'rime' || !c.tones.length) {
      const shown = truthy ? t.s.rime : r.pick(c.rimes.filter((x) => x !== t.s.rime)) ?? t.s.rime;
      return [`Tiếng '${t.w}' có vần ${shown}.`, shown === t.s.rime];
    }
    const all: ToneName[] = ['ngang', ...c.tones];
    const shown = truthy ? t.s.tone : r.pick(all.filter((x) => x !== t.s.tone));
    return [`Tiếng '${t.w}' ${shown === 'ngang' ? 'không có dấu thanh' : `có ${TONE_TEXT[shown]}`}.`, shown === t.s.tone];
  });
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1]) || new Set(rows.map((x) => x[0])).size < 4) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', rows,
    M('V1.DOC.01', 'TV.GHEPVAN', 'phan_tich_tieng', l, 'Tách từng tiếng thành âm đầu, vần và dấu thanh rồi đối chiếu.',
      ts.map((t) => `${t.w} = ${t.s.onset ? `${t.s.onset} + ` : ''}${t.s.rime}${t.s.tone === 'ngang' ? '' : ` + ${TONE_TEXT[t.s.tone]}`}`).join('; ') + '.'));
};

const oddRime: VTemplate = (r, c, l) => {
  const byRime = new Map<string, string[]>();
  for (const t of c.tieng) byRime.set(t.s.rime, [...new Set([...(byRime.get(t.s.rime) ?? []), t.w])]);
  const big = [...byRime.entries()].filter(([, ws]) => ws.length >= 3);
  if (!big.length || byRime.size < 2) return null;
  const [rime, ws] = r.pick(big);
  const same = r.sample(ws, 3);
  const odd = r.pick(c.tieng.filter((t) => t.s.rime !== rime)).w;
  return Q.sc('Tiếng nào có vần KHÁC các tiếng còn lại?', r.shuffle([...same, odd]), odd,
    M('V1.AM.03', 'TV.GHEPVAN', 'van', l, `${same.join(', ')} đều có vần ${rime}; '${odd}' có vần khác.`,
      `Tìm vần của từng tiếng: ${same.map((w) => `${w} – ${rime}`).join(', ')}, còn '${odd}' có vần ${parseSyllable(odd)?.rime}. Vậy chọn '${odd}'.`));
};

/** Ưu tiên câu mới học gần đây (nửa sau danh sách đã sắp theo bài học) */
const recent = <T,>(r: Rng, xs: T[]) => (xs.length > 4 && r.chance(0.7) ? r.pick(xs.slice(Math.floor(xs.length / 2))) : r.pick(xs));

const reading: VTemplate = (r, c, l) => {
  if (!c.sentences.length) return null;
  const st = recent(r, c.sentences);
  const isWho = st.q.startsWith('Ai');
  const others = [...new Set(c.sentences.filter((x) => x.q.startsWith('Ai') === isWho && x.who !== st.who).map((x) => x.who))];
  const fill = isWho ? ['Bà', 'Bé', 'Mẹ', 'Bố', 'Cô', 'Chị'] : ['Bò', 'Dê', 'Gà', 'Cá', 'Thỏ', 'Khỉ'];
  const pool = [...others, ...fill.filter((x) => x !== st.who && lessonOfText(x) <= c.to && !others.includes(x))];
  if (pool.length < 2) return null;
  const opts = r.shuffle([st.who, ...r.sample(pool, 2)]);
  return Q.sc(`Đọc câu: '${st.s}' ${st.q}`, opts, st.who,
    M('V1.DOC.04', 'TV.DOCHIEU', 'doc_hieu', l, `Câu '${st.s}' cho biết: ${st.who}.`,
      `Đọc kĩ câu '${st.s}'. Câu hỏi "${st.q}" — tìm trong câu: ${st.who}.`));
};

// ===========================================================================
// L5
// ===========================================================================
type Feature = { label: string; test: (s: Syllable) => boolean };
function featureFor(r: Rng, c: VCtx, pool: Syllable[]): Feature | null {
  const opts: Feature[] = [];
  for (const t of c.tones) opts.push({ label: TONE_TEXT[t], test: (s) => s.tone === t });
  for (const o of [...new Set(pool.map((s) => s.onset))].filter(Boolean)) opts.push({ label: `âm đầu ${o}`, test: (s) => s.onset === o });
  for (const v of [...new Set(pool.map((s) => s.rime))]) opts.push({ label: `vần ${v}`, test: (s) => s.rime === v });
  const usable = opts.filter((f) => pool.some(f.test) && !pool.every(f.test));
  return usable.length ? r.pick(usable) : null;
}

const countInList: VTemplate = (r, c, l) => {
  const list = [...new Set(r.sample(c.tieng, 7).map((t) => t.w))].slice(0, 6);
  if (list.length < 5) return null;
  const syl = list.map((w) => parseSyllable(w) as Syllable);
  const f = featureFor(r, c, syl);
  if (!f) return null;
  const hits = list.filter((_, i) => f.test(syl[i]));
  return Q.blanks(`Đọc các tiếng: '${list.join(', ')}'. Có mấy tiếng có ${f.label}?`, ['Có {} tiếng.'], [[hits.length]],
    M('V1.DOC.01', 'TV.GHEPVAN', 'phan_tich_tieng', l, `Các tiếng có ${f.label}: ${hits.join(', ')}.`,
      `Đọc lần lượt từng tiếng và kiểm tra ${f.label}. Có ${hits.length} tiếng: ${hits.join(', ')}.`));
};

const countInSentence: VTemplate = (r, c, l) => {
  if (!c.sentences.length) return null;
  const st = recent(r, c.sentences);
  const words = syllablesOf(st.s);
  const syl = words.map((w) => parseSyllable(w));
  if (syl.some((s) => !s)) return null;
  const f = featureFor(r, c, syl as Syllable[]);
  if (!f) return null;
  const hits = words.filter((_, i) => f.test(syl[i] as Syllable));
  return Q.blanks(`Đọc câu: '${st.s}' Trong câu có mấy tiếng có ${f.label}?`, ['Có {} tiếng.'], [[hits.length]],
    M('V1.DOC.02', 'TV.DOCHIEU', 'doc_cau', l, `Các tiếng có ${f.label}: ${hits.join(', ')}.`,
      `Đọc từng tiếng trong câu: ${words.join(' – ')}. Tiếng có ${f.label}: ${hits.join(', ')}. Vậy có ${hits.length} tiếng.`));
};

const orderSentence: VTemplate = (r, c, l) => {
  const cands = c.sentences.filter((x) => {
    const ws = x.s.split(/\s+/);
    return ws.length >= 3 && new Set(ws.map((w) => w.toLowerCase())).size === ws.length;
  });
  if (!cands.length) return null;
  const longer = cands.filter((x) => x.s.split(/\s+/).length >= 4);
  const st = recent(r, longer.length >= 2 ? longer : cands);
  const ws = st.s.split(/\s+/);
  return Q.ord('Sắp xếp các từ thành câu đúng.', ws,
    M('V1.DOC.02', 'TV.XEPCAU', 'xep_cau', l, `Câu đúng: ${st.s}`,
      `Chữ viết hoa đứng đầu câu, từ có dấu chấm đứng cuối câu. Đọc thử cho có nghĩa: ${st.s}`));
};

// ===========================================================================
// Các tuần
// ===========================================================================
export type VPool = Record<Level, VTemplate[]>;
const POOL: VPool = {
  1: [onsetPick, tonePick, picture],
  2: [onsetOf, rimeOf, toneOf, assemble],
  3: [allWithOnset, matchRime, matchPicture, spelling],
  4: [facts, oddRime, reading],
  5: [countInList, countInSentence, orderSentence],
};

export const TV_WEEKS: [number, number][] = [
  [1, 5], [6, 10], [11, 15], [16, 20], [21, 25], [26, 30], [31, 35], [36, 40], [41, 45],
  [46, 50], [51, 55], [56, 60], [61, 65], [66, 70], [71, 75], [76, 80], [81, 83],
];

export function tvContext(week: number): VCtx {
  const [from, to] = TV_WEEKS[week - 1];
  const tieng: VCtx['tieng'] = [];
  for (const w of VWORDS) {
    if (w.w.includes(' ')) continue;
    const s = parseSyllable(w.w);
    if (s && s.lesson <= to && !tieng.some((t) => t.w === w.w)) tieng.push({ w: w.w, s });
  }
  const pics = VWORDS.filter((w) => w.emoji && lessonOfText(w.w) <= to);
  const sentences = VSENTENCES.filter(([s, who]) => lessonOfText(s) <= to && lessonOfText(who) <= to)
    .sort((a, b) => lessonOfText(a[0]) - lessonOfText(b[0]))
    .map(([s, who, q]) => ({ s, who, q }));
  const onsets = Object.keys(ONSETS).filter((o) => ONSETS[o] <= to && tieng.some((t) => t.s.onset === o));
  const rimes = Object.keys(RIMES).filter((x) => RIMES[x] <= to && tieng.some((t) => t.s.rime === x));
  const tones = Object.values(TONES).filter((t) => t.lesson <= to).map((t) => t.name as ToneName);
  return {
    week, to, from, tieng, pics, sentences, onsets, rimes, tones,
    newOnsets: onsets.filter((o) => ONSETS[o] >= from),
    newRimes: rimes.filter((x) => RIMES[x] >= from),
  };
}

export const TV1_POOL = POOL;
