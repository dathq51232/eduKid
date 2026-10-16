// BỘ SINH CÂU NGẪU NHIÊN — TIẾNG VIỆT 1, HỌC KÌ 2 (tập hai, 8 chủ đề đọc của sách Kết nối tri thức).
//
// Dạng bài tham khảo sách và vở bài tập Tiếng Việt 1 tập hai: đọc đoạn văn trả lời câu hỏi, chọn từ ngữ hoàn
// thiện câu, tìm từ chỉ sự vật / hoạt động / đặc điểm, chọn dấu chấm hay dấu chấm hỏi, viết hoa tên riêng,
// sắp xếp từ thành câu, chính tả (c/k, g/gh, ng/ngh, s/x, ch/tr, l/n). Đoạn văn, câu, từ do EduChain Kids viết
// (src/lib/practice/viet-hk2.ts) — không chép bài đọc của sách. Học kì 2 đã học đủ âm, vần của tập một.

import type { Level } from '../content/types';
import { Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { TV1_POOL, tvContext, type VCtx, type VTemplate } from './tv1';
import { FILL_WORDS, KIND_NAME, ORDER_SENTENCES, PASSAGES, PUNCT_SENTENCES, SPELL_PAIRS, TV2_THEMES, WORD_KINDS, type Passage, type ThemeNo } from './viet-hk2';

export type TV2Ctx = { themes: ThemeNo[]; base: VCtx };
export type TV2Template = (r: Rng, c: TV2Ctx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });
const passagesOf = (c: TV2Ctx) => PASSAGES.filter((p) => c.themes.includes(p.theme));
const show = (p: Passage) => `"${p.text}"`;

// --- Đọc hiểu ---------------------------------------------------------------
const readOne: TV2Template = (r, c, l) => {
  const p = r.pick(passagesOf(c));
  const [q, ans, wrong] = r.pick(p.qa);
  return Q.sc(`Đọc đoạn văn "${p.title}":\n${show(p)}\n${q}`, r.shuffle([ans, ...wrong]), ans,
    M('V1.DOC.04', 'TV.DOCHIEU', 'doc_hieu', l, `Trong đoạn văn: ${ans}.`, `Đọc lại đoạn văn, tìm câu nói về điều được hỏi ("${q}"). Câu trả lời: ${ans}.`));
};

const readTrueFalse: TV2Template = (r, c, l) => {
  const p = r.pick(passagesOf(c));
  const rows: [string, boolean][] = p.qa.map(([q, ans, wrong]) => {
    const ok = r.chance(0.5);
    return [`${q} → ${ok ? ans : wrong[0]}`, ok];
  });
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table(`Đọc đoạn văn "${p.title}":\n${show(p)}\nĐúng chọn Đ, sai chọn S.`, r.shuffle(rows),
    M('V1.DOC.04', 'TV.DOCHIEU', 'doc_hieu', l, p.qa.map(([q, a]) => `${q} ${a}.`).join(' '),
      `Đối chiếu từng dòng với đoạn văn: ${p.qa.map(([q, a]) => `${q} — ${a}`).join('; ')}.`));
};

const readMatch: TV2Template = (r, c, l) => {
  const p = r.pick(passagesOf(c));
  return Q.mt(`Đọc đoạn văn "${p.title}":\n${show(p)}\nGhép câu hỏi với câu trả lời đúng.`, p.qa.map(([q, a]) => [q, a] as [string, string]),
    M('V1.DOC.04', 'TV.DOCHIEU', 'doc_hieu', l, p.qa.map(([q, a]) => `${q} ${a}.`).join(' '),
      'Đọc từng câu hỏi, tìm trong đoạn văn câu có thông tin trả lời rồi nối cho đúng.'));
};

const countSentences: TV2Template = (r, c, l) => {
  const p = r.pick(passagesOf(c));
  const n = (p.text.match(/[.!?](?=\s|$|")/g) ?? []).length;
  if (n < 3 || n > 8) return null;
  return Q.blanks(`Đọc đoạn văn "${p.title}":\n${show(p)}\nĐoạn văn có mấy câu?`, ['Có {} câu.'], [[n]],
    M('V1.DOC.03', 'TV.DOCHIEU', 'dem_cau', l, `Đoạn văn có ${n} câu.`, 'Mỗi câu kết thúc bằng dấu chấm (.), dấu chấm hỏi (?) hoặc dấu chấm than (!). Đếm các dấu đó sẽ biết số câu.'));
};

// --- Từ ngữ, câu -----------------------------------------------------------------
const fillWord: TV2Template = (r, c, l) => {
  const cands = FILL_WORDS.filter((f) => c.themes.includes(f[3]));
  const [s, ans, wrong] = r.pick(cands.length ? cands : FILL_WORDS);
  return Q.sc(`Chọn từ ngữ điền vào chỗ trống: "${s}"`, r.shuffle([ans, ...wrong]), ans,
    M('V1.VIET.04', 'TV.TUNGU', 'chon_tu', l, `Câu đúng: ${s.replace('…', ans)}`));
};

type Kind = keyof typeof WORD_KINDS;
const KINDS: Kind[] = ['su_vat', 'hoat_dong', 'dac_diem'];
const wordKindOne: TV2Template = (r, _c, l) => {
  const k = r.pick(KINDS);
  const ans = r.pick(WORD_KINDS[k]);
  const others = KINDS.filter((x) => x !== k).map((x) => r.pick(WORD_KINDS[x]));
  return Q.sc(`Từ nào chỉ ${KIND_NAME[k]}?`, r.shuffle([ans, ...others]), ans,
    M('V1.VIET.04', 'TV.TUNGU', 'tu_loai', l, `"${ans}" là từ chỉ ${KIND_NAME[k]}.`,
      'Từ chỉ sự vật: tên người, con vật, đồ vật, cây cối. Từ chỉ hoạt động: việc làm (chạy, đọc…). Từ chỉ đặc điểm: màu sắc, hình dáng, tính nết (đỏ, cao, ngoan…).'));
};

const wordKindMany: TV2Template = (r, _c, l) => {
  const k = r.pick(KINDS);
  const right = r.sample(WORD_KINDS[k], 2);
  const wrong = KINDS.filter((x) => x !== k).flatMap((x) => r.sample(WORD_KINDS[x], 2)).slice(0, 3);
  return Q.mc(`Chọn tất cả các từ chỉ ${KIND_NAME[k]}.`, r.shuffle([...right, ...wrong]), right,
    M('V1.VIET.04', 'TV.TUNGU', 'tu_loai', l, `Từ chỉ ${KIND_NAME[k]}: ${right.join(', ')}.`,
      'Từ chỉ sự vật: tên người, con vật, đồ vật, cây cối. Từ chỉ hoạt động: việc làm. Từ chỉ đặc điểm: màu sắc, hình dáng, tính nết.'));
};

const punctuation: TV2Template = (r, _c, l) => {
  const [s, mark] = r.pick(PUNCT_SENTENCES);
  return Q.sc(`Chọn dấu câu đặt cuối câu: "${s} …"`, ['.', '?'], mark,
    M('V1.VIET.05', 'TV.DAUCAU', 'dau_cau', l, mark === '?' ? 'Câu dùng để hỏi nên cuối câu đặt dấu chấm hỏi (?).' : 'Câu kể lại sự việc nên cuối câu đặt dấu chấm (.).'));
};

const punctTable: TV2Template = (r, _c, l) => {
  const picks = r.sample(PUNCT_SENTENCES, 4);
  const rows: [string, boolean][] = picks.map(([s, mark]) => {
    const ok = r.chance(0.5);
    const shown = ok ? mark : mark === '?' ? '.' : '?';
    return [`${s}${shown}`, ok];
  });
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table('Câu nào đặt đúng dấu câu? Đúng chọn Đ, sai chọn S.', rows,
    M('V1.VIET.05', 'TV.DAUCAU', 'dau_cau', l, 'Câu hỏi cuối câu có dấu chấm hỏi (?); câu kể có dấu chấm (.).',
      `Xem câu nào dùng để hỏi (có các từ như gì, ai, đâu, mấy, không) thì phải có dấu chấm hỏi. ${picks.map(([s, m]) => `${s}${m}`).join(' ')}`));
};

// Viết hoa: chữ đầu câu và mỗi tiếng của tên riêng. Câu viết thường, em chọn những chữ phải viết hoa.
const CAP_SENTENCES: [string, string[]][] = [
  ['bạn lan sống ở hà nội', ['bạn', 'lan', 'hà', 'nội']],
  ['em được đi chơi ở huế', ['em', 'huế']],
  ['bố đưa em ra biển hạ long', ['bố', 'hạ', 'long']],
  ['cô giáo của em tên là mai', ['cô', 'mai']],
  ['nhà bạn minh ở đà nẵng', ['nhà', 'minh', 'đà', 'nẵng']],
  ['em yêu đất nước việt nam', ['em', 'việt', 'nam']],
  ['anh nam học lớp bốn', ['anh', 'nam']],
  ['ông em quê ở cần thơ', ['ông', 'cần', 'thơ']],
];
const capitalName: TV2Template = (r, _c, l) => {
  const [s, caps] = r.pick(CAP_SENTENCES);
  const words = s.split(' ');
  if (new Set(words).size !== words.length) return null;
  const fixed = words.map((w) => (caps.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
  return Q.mc(`Câu "${s}" cần viết hoa những chữ nào? Chọn tất cả.`, words, caps,
    M('V1.VIET.03', 'TV.CHINHTA', 'viet_hoa', l, `Câu đúng: ${fixed}.`, `Viết hoa chữ đầu câu và chữ cái đầu mỗi tiếng của tên riêng (tên người, tên địa danh). Câu đúng: ${fixed}.`));
};

const orderWords: TV2Template = (r, c, l) => {
  const cands = ORDER_SENTENCES.filter((x) => c.themes.includes(x[1]));
  const [s] = r.pick(cands.length ? cands : ORDER_SENTENCES);
  const parts = s.split(' | ');
  return Q.ord('Sắp xếp các từ ngữ thành câu đúng.', parts,
    M('V1.DOC.02', 'TV.XEPCAU', 'xep_cau', l, `Câu đúng: ${parts.join(' ')}.`, `Từ viết hoa đứng đầu câu. Đọc thử cho thành câu có nghĩa: ${parts.join(' ')}.`));
};

const spelling2: TV2Template = (r, _c, l) => {
  const [w, ans, other] = r.pick(SPELL_PAIRS);
  return Q.sc(`Điền ${[ans, other].sort().join(' hay ')} vào chỗ trống: "${w}"`, [ans, other].sort(), ans,
    M('V1.AM.04', 'TV.CHINHTA', 'chinh_ta', l, `Viết đúng: "${w.replace('_', ans)}".`));
};

const spellTable: TV2Template = (r, _c, l) => {
  const picks = r.sample(SPELL_PAIRS, 4);
  const rows: [string, boolean][] = picks.map(([w, ans, other]) => {
    const ok = r.chance(0.5);
    return [w.replace('_', ok ? ans : other), ok];
  });
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table('Từ nào viết đúng chính tả? Đúng chọn Đ, sai chọn S.', rows,
    M('V1.AM.04', 'TV.CHINHTA', 'chinh_ta', l, `Viết đúng: ${picks.map(([w, a]) => w.replace('_', a)).join(', ')}.`,
      `Đọc to từng từ, nhớ cách viết đúng: ${picks.map(([w, a]) => w.replace('_', a)).join(', ')}.`));
};

// Dạng bài học kì 1 (âm, vần, dấu thanh, đọc câu) vẫn ôn đều ở học kì 2, với vốn từ đủ cả tập một
const base = (t: VTemplate): TV2Template => (r, c, l) => t(r, c.base, l);

export type TV2Pool = Record<Level, TV2Template[]>;
export const TV2_POOL: TV2Pool = {
  1: [fillWord, wordKindOne, punctuation, ...TV1_POOL[1].map(base)],
  2: [readOne, spelling2, capitalName, wordKindOne, ...TV1_POOL[2].map(base)],
  3: [readOne, fillWord, wordKindMany, spelling2, ...TV1_POOL[3].map(base)],
  4: [readTrueFalse, punctTable, spellTable, orderWords, ...TV1_POOL[4].map(base)],
  5: [readMatch, countSentences, orderWords, ...TV1_POOL[5].map(base)],
};

export function tv2Context(themes: ThemeNo[]): TV2Ctx {
  return { themes, base: tvContext(17) };
}
export { TV2_THEMES };
