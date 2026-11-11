// Chuyên đề nâng cao TIẾNG ANH (lớp 1–5) — dạng bài kiểu sân chơi IOE: Odd one out (chọn từ khác loại), Spelling (điền chữ cái,
// chọn cách đánh vần đúng, sắp xếp chữ cái), Reorder (sắp xếp từ thành câu). Chỉ dùng từ ĐÃ HỌC của lớp (lọc theo vốn từ
// Tiếng Anh 1–5 trong src/lib/content/ta*-vocab.ts); câu để sắp xếp lấy từ khung mẫu câu của từng unit.

import type { Level } from '../../content/types';
import { gs1Learned } from '../../content/ta1-hk1';
import { GS2_UNITS, gs2Learned } from '../../content/ta2-vocab';
import { GS3_UNITS, gs3Learned } from '../../content/ta3-vocab';
import { GS4_UNITS, gs4Learned } from '../../content/ta4-vocab';
import { GS5_UNITS, gs5Learned } from '../../content/ta5-vocab';
import { Q, type Meta } from '../kit';
import type { Rng } from '../rng';
import type { AdvCtx, AdvGrade } from './engine';
import type { Tpl, TplPool } from './lessons';

// ------------------------------------------------------------------ vốn từ theo nhóm (từ:nghĩa)
const BANK: { vi: string; words: string }[] = [
  { vi: 'con vật', words: 'cat:con mèo dog:con chó duck:con vịt goat:con dê horse:con ngựa monkey:con khỉ mouse:con chuột tiger:con hổ turtle:con rùa bird:con chim elephant:con voi lion:con sư tử rabbit:con thỏ zebra:ngựa vằn giraffe:con hươu cổ dài bear:con gấu parrot:con vẹt crocodile:cá sấu peacock:con công' },
  { vi: 'đồ ăn, đồ uống', words: 'cake:bánh ngọt apple:quả táo chips:khoai tây chiên milk:sữa mango:quả xoài banana:quả chuối noodles:mì sợi nut:hạt lemon:quả chanh bread:bánh mì rice:cơm pizza:bánh pizza popcorn:bỏng ngô juice:nước ép egg:quả trứng grapes:quả nho' },
  { vi: 'màu sắc', words: 'red:màu đỏ blue:màu xanh dương green:màu xanh lá yellow:màu vàng pink:màu hồng black:màu đen white:màu trắng brown:màu nâu' },
  { vi: 'người trong gia đình', words: 'mother:mẹ father:bố sister:chị, em gái brother:anh, em trai grandmother:bà grandfather:ông' },
  { vi: 'bộ phận cơ thể', words: 'hair:tóc hand:bàn tay head:cái đầu face:khuôn mặt foot:bàn chân ear:cái tai eye:con mắt nose:cái mũi mouth:cái miệng' },
  { vi: 'phương tiện đi lại', words: 'car:ô tô bike:xe đạp bus:xe buýt truck:xe tải train:tàu hỏa plane:máy bay boat:con thuyền taxi:xe taxi' },
  { vi: 'đồ dùng học tập', words: 'book:quyển sách desk:bàn học pen:bút mực pencil:bút chì bag:cái cặp ruler:thước kẻ eraser:cục tẩy notebook:quyển vở crayon:bút sáp' },
  { vi: 'nghề nghiệp', words: 'teacher:giáo viên doctor:bác sĩ nurse:y tá farmer:nông dân driver:tài xế worker:công nhân singer:ca sĩ' },
  { vi: 'môn vận động', words: 'football:bóng đá badminton:cầu lông basketball:bóng rổ volleyball:bóng chuyền chess:cờ vua' },
  { vi: 'thời tiết', words: 'sunny:nắng rainy:mưa cloudy:nhiều mây windy:nhiều gió' },
  { vi: 'quần áo', words: 'shoes:đôi giày shorts:quần soóc jacket:áo khoác hat:cái mũ' },
  { vi: 'các ngày trong tuần', words: 'monday:thứ Hai tuesday:thứ Ba wednesday:thứ Tư thursday:thứ Năm friday:thứ Sáu saturday:thứ Bảy sunday:Chủ nhật' },
  { vi: 'các tháng', words: 'january:tháng Một february:tháng Hai march:tháng Ba april:tháng Tư june:tháng Sáu july:tháng Bảy august:tháng Tám september:tháng Chín october:tháng Mười november:tháng Mười một december:tháng Mười hai' },
  { vi: 'số đếm', words: 'one:một two:hai three:ba four:bốn five:năm six:sáu seven:bảy eight:tám nine:chín ten:mười' },
];
type Word = { w: string; vi: string };
type Cat = { vi: string; words: Word[] };
const CAPS = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december)$/;
const show = (w: string) => (CAPS.test(w) ? w[0].toUpperCase() + w.slice(1) : w);
const LEARNED: Record<AdvGrade, () => Set<string>> = { 1: () => gs1Learned(16), 2: () => gs2Learned(16), 3: () => gs3Learned(20), 4: () => gs4Learned(20), 5: () => gs5Learned(20) };
const catCache = new Map<number, Cat[]>();
/** Các nhóm có ít nhất 3 từ đã học của lớp */
function catsOf(g: AdvGrade): Cat[] {
  let v = catCache.get(g);
  if (!v) {
    const L = LEARNED[g]();
    v = BANK.map((b) => ({ vi: b.vi, words: b.words.split(/\s+(?=[a-z]+:)/).map((p) => { const [w, vi] = p.split(':'); return { w, vi }; }).filter((x) => L.has(x.w)) }))
      .filter((c) => c.words.length >= 3);
    catCache.set(g, v);
  }
  return v;
}
const allWords = (g: AdvGrade) => catsOf(g).flatMap((c) => c.words);
const meta = (c: AdvCtx, l: Level, kind: 'tu' | 'am' | 'cau', f: string, e: string, s?: string, k?: string): Meta => {
  const g = c.grade;
  const o = g === 1 ? (kind === 'am' ? 'A1.ABC.01' : kind === 'cau' ? 'A1.HELLO.03' : 'A1.ANIMAL.01') : `A${g}.${kind === 'tu' ? 'TU' : kind === 'am' ? 'AM' : 'CAU'}.01`;
  return { o, f, l, e, s, k };
};

// =========================================================================================
// 1. ODD ONE OUT
// =========================================================================================
const odd = (n: number): Tpl => (r, c, l) => {
  const cats = catsOf(c.grade);
  if (cats.length < 2) return null;
  const [A, B] = r.sample(cats, 2);
  if (A.words.length < n - 1) return null;
  const same = r.sample(A.words, n - 1);
  const x = r.pick(B.words);
  const opts = r.shuffle([...same, x].map((w) => show(w.w)));
  return Q.sc(`Odd one out — Chọn từ KHÁC LOẠI: ${opts.join(', ')}`, opts, show(x.w),
    meta(c, l, 'tu', 'TA.NHOMTU', `“${show(x.w)}” (${x.vi}) thuộc nhóm ${B.vi}; các từ còn lại thuộc nhóm ${A.vi}.`,
      `Dịch nghĩa từng từ: ${[...same, x].map((w) => `${show(w.w)} – ${w.vi}`).join('; ')}.\nChỉ “${show(x.w)}” không thuộc nhóm ${A.vi}.`, 'odd_one_out'));
};
/** Chọn tất cả các từ thuộc một nhóm */
const pickGroup: Tpl = (r, c, l) => {
  const cats = catsOf(c.grade);
  if (cats.length < 3) return null;
  const [A, B, C] = r.sample(cats, 3);
  const yes = r.sample(A.words, 3);
  const no = [...r.sample(B.words, 2), r.pick(C.words)];
  const opts = r.shuffle([...yes, ...no].map((w) => show(w.w)));
  return Q.mc(`Chọn TẤT CẢ các từ chỉ ${A.vi}: ${opts.join(', ')}`, opts, yes.map((w) => show(w.w)),
    meta(c, l, 'tu', 'TA.NHOMTU', `Các từ chỉ ${A.vi}: ${yes.map((w) => `${show(w.w)} (${w.vi})`).join(', ')}.`, `Dịch nghĩa từng từ:\n${[...yes, ...no].map((w) => `${show(w.w)} – ${w.vi}`).join('\n')}`, 'nhom_tu'));
};
/** Từ này thuộc nhóm nào */
const whichGroup: Tpl = (r, c, l) => {
  const cats = catsOf(c.grade);
  if (cats.length < 3) return null;
  const [A, ...rest] = r.sample(cats, Math.min(4, cats.length));
  const x = r.pick(A.words);
  return Q.sc(`Từ “${show(x.w)}” thuộc nhóm nào?`, r.shuffle([A.vi, ...rest.map((k) => k.vi)]), A.vi,
    meta(c, l, 'tu', 'TA.NHOMTU', `${show(x.w)} nghĩa là “${x.vi}”, thuộc nhóm ${A.vi}.`, `${show(x.w)} nghĩa là “${x.vi}”.\n“${x.vi}” thuộc nhóm ${A.vi}.`, 'nhom_tu'));
};
export const TA_ODD: TplPool = { 1: [odd(4)], 2: [odd(4), whichGroup], 3: [odd(4), whichGroup], 4: [odd(5), pickGroup], 5: [pickGroup, odd(5)] };

// =========================================================================================
// 2. SPELLING
// =========================================================================================
const spelled = (w: string) => w.split('').join('-');
const VOWELS = 'aeiou';
/** Cách viết sai thường gặp: đổi chỗ hai chữ liền nhau, bỏ một chữ, gấp đôi một chữ, đổi nguyên âm */
function misspell(r: Rng, w: string): string[] {
  const out = new Set<string>();
  for (let tries = 0; tries < 40 && out.size < 6; tries++) {
    const i = r.int(0, w.length - 1);
    const k = r.int(0, 3);
    let v = w;
    if (k === 0 && i < w.length - 1) v = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
    else if (k === 1 && w.length > 3) v = w.slice(0, i) + w.slice(i + 1);
    else if (k === 2) v = w.slice(0, i + 1) + w[i] + w.slice(i + 1);
    else if (VOWELS.includes(w[i])) v = w.slice(0, i) + r.pick([...VOWELS].filter((x) => x !== w[i])) + w.slice(i + 1);
    if (v !== w) out.add(v);
  }
  return [...out];
}
const missing: Tpl = (r, c, l) => {
  const words = allWords(c.grade).filter((x) => x.w.length >= 3 && x.w.length <= 6);
  const learned = new Set(allWords(c.grade).map((x) => x.w));
  for (let t = 0; t < 20; t++) {
    const x = r.pick(words);
    const i = r.int(0, x.w.length - 1);
    const letter = x.w[i];
    const pattern = (ch: string) => x.w.slice(0, i) + ch + x.w.slice(i + 1);
    // không có từ đã học nào khác cũng khớp mẫu
    const others = [...'abcdefghijklmnopqrstuvwxyz'].filter((ch) => ch !== letter && learned.has(pattern(ch)));
    if (others.length) continue;
    const wrong = r.sample([...'aeioubcdgklmnprst'].filter((ch) => ch !== letter), 3);
    const shown = x.w.split('').map((ch, j) => (j === i ? '_' : ch)).join(' ');
    return Q.sc(`Điền chữ cái còn thiếu của từ “${x.vi}”: ${shown}`, r.shuffle([letter, ...wrong]), letter,
      meta(c, l, 'am', 'TA.CHUCAI', `Từ đúng là ${spelled(x.w)}.`, `Đọc to từ “${x.vi}” bằng tiếng Anh rồi nghe xem còn thiếu âm nào: ${spelled(x.w)}.`, 'chu_cai_thieu'));
  }
  return null;
};
const rightSpelling: Tpl = (r, c, l) => {
  const learned = new Set(allWords(c.grade).map((x) => x.w));
  const x = r.pick(allWords(c.grade).filter((w) => w.w.length >= 4));
  const bad = misspell(r, x.w).filter((v) => !learned.has(v)).slice(0, 3);
  if (bad.length < 2) return null;
  const traps = bad.map((b) => ({ v: spelled(b), why: 'viết sai thứ tự hoặc thiếu, thừa chữ cái' }));
  const q = Q.sc(`Chọn cách đánh vần ĐÚNG của từ “${x.vi}”:`, r.shuffle([spelled(x.w), ...bad.map(spelled)]), spelled(x.w),
    meta(c, l, 'am', 'TA.CHUCAI', `Đánh vần đúng: ${spelled(x.w)}.`, `So từng chữ cái với từ đã học, chú ý chữ cái đôi và nguyên âm a, e, i, o, u.`, 'danh_van'));
  return { ...q, traps };
};
const uniqueLetters = (w: string) => new Set(w).size === w.length;
const unscramble = (min: number, max: number): Tpl => (r, c, l) => {
  let list = allWords(c.grade).filter((x) => /^[a-z]+$/.test(x.w) && uniqueLetters(x.w) && x.w.length >= min && x.w.length <= max);
  if (!list.length) list = allWords(c.grade).filter((x) => /^[a-z]+$/.test(x.w) && uniqueLetters(x.w) && x.w.length >= 3);
  if (!list.length) return null;
  const x = r.pick(list);
  return Q.ord(`Sắp xếp các chữ cái thành từ có nghĩa “${x.vi}”:`, x.w.split(''),
    meta(c, l, 'am', 'TA.CHUCAI', `Từ đúng: ${spelled(x.w)}.`, `Nghĩ xem “${x.vi}” trong tiếng Anh là từ nào, rồi đánh vần từng chữ: ${spelled(x.w)}.`, 'sap_xep_chu'));
};
export const TA_SPELL: TplPool = {
  1: [missing], 2: [missing, rightSpelling], 3: [unscramble(3, 5), rightSpelling], 4: [unscramble(5, 7), rightSpelling], 5: [unscramble(6, 9), unscramble(5, 7)],
};

// =========================================================================================
// 3. REORDER — câu lấy từ khung mẫu câu của các unit đã học
// =========================================================================================
const sentCache = new Map<number, string[]>();
function sentencesOf(g: AdvGrade): string[] {
  let v = sentCache.get(g);
  if (!v) {
    const raw: string[] = [];
    if (g >= 2) for (const u of Object.values(GS2_UNITS)) raw.push(...(u.pattern.q ? [u.pattern.q] : []), ...u.pattern.a);
    const frames = [...(g >= 3 ? Object.values(GS3_UNITS) : []), ...(g >= 4 ? Object.values(GS4_UNITS) : []), ...(g >= 5 ? Object.values(GS5_UNITS) : [])];
    for (const u of frames) for (const f of u.frames) raw.push(...(f[0] ? [f[0]] : []), f[1]);
    const L = LEARNED[g]();
    v = [...new Set(raw.map((s) => s.replace(/’/g, "'")))].filter((s) => {
      const t = s.split(' ');
      // chỉ một câu (một dấu kết thúc ở cuối), không lặp từ, mọi từ đều đã học
      const known = s.split(/[^A-Za-z']+/).filter(Boolean).every((w) => w.length === 1 || L.has(w.toLowerCase()) || ['a', 'an', 'the', 'is', 'are'].includes(w.toLowerCase()));
      return known && !/[.?!]\s/.test(s) && t.length >= 3 && t.length <= 8 && new Set(t.map((x) => x.toLowerCase().replace(/[.,?!]/g, ''))).size === t.length;
    });
    sentCache.set(g, v);
  }
  return v;
}
const reorder = (min: number, max: number): Tpl => (r, c, l) => {
  let list = sentencesOf(c.grade).filter((s) => { const n = s.split(' ').length; return n >= min && n <= max; });
  if (!list.length) list = sentencesOf(c.grade);
  if (!list.length) return null;
  const s = r.pick(list);
  return Q.ord(`Reorder — Sắp xếp các từ thành câu đúng: ${r.shuffle(s.split(' ')).join(' / ')}`, s.split(' '),
    meta(c, l, 'cau', 'TA.XEPCAU', `Câu đúng: ${s}`, `Từ viết hoa đứng đầu câu, từ có dấu chấm (.) hoặc dấu hỏi (?) đứng cuối câu.\nCâu đúng: ${s}`, 'xep_cau'));
};
export const TA_REORDER: TplPool = { 1: [reorder(3, 4)], 2: [reorder(3, 4)], 3: [reorder(4, 5)], 4: [reorder(5, 6)], 5: [reorder(6, 8)] };
