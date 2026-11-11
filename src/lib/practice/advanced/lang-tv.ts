// Chuyên đề nâng cao TIẾNG VIỆT (lớp 1–5) — dạng bài kiểu sân chơi "Trạng Nguyên Tiếng Việt": giải câu đố, quy tắc chính tả
// c/k – g/gh – ng/ngh, sắp xếp từ thành câu, tìm từ khác loại, thành ngữ – tục ngữ, từ trái nghĩa – đồng nghĩa.
// Câu đố, thành ngữ, tục ngữ là kho tàng dân gian; câu văn và nhóm từ do EduChain Kids tự soạn (không chép sách).

import type { Level } from '../../content/types';
import { Q, type Meta, type PracticeQuestion } from '../kit';
import type { AdvCtx } from './engine';
import type { Tpl, TplPool } from './lessons';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const meta = (c: AdvCtx, l: Level, kind: 'tu' | 'ct' | 'cau' | 'doc', f: string, e: string, s?: string, k?: string): Meta => {
  const g = c.grade;
  const o = kind === 'tu' ? (g === 1 ? 'V1.VIET.04' : `V${g}.TU.01`)
    : kind === 'ct' ? (g === 1 ? 'V1.AM.04' : `V${g}.CT.01`)
    : kind === 'cau' ? (g === 1 ? 'V1.DOC.02' : `V${g}.CAU.01`)
    : g === 1 ? 'V1.DOC.04' : `V${g}.DOC.01`;
  return { o, f, l, e, s, k };
};
const withTraps = (q: PracticeQuestion, traps: { v: string; why: string }[]): PracticeQuestion => (traps.length ? { ...q, traps } : q);

// =========================================================================================
// 1. GIẢI CÂU ĐỐ
// =========================================================================================
type Riddle = { q: string; a: string; w: string[]; g: number };
const RIDDLES: Riddle[] = [
  { g: 1, q: 'Con gì tai dài, mắt hồng, thích ăn cà rốt, chạy nhảy tung tăng?', a: 'con thỏ', w: ['con mèo', 'con chó', 'con gà'] },
  { g: 1, q: 'Con gì sáng sớm gáy vang “ò ó o” gọi cả nhà thức dậy?', a: 'con gà trống', w: ['con vịt', 'con chim sẻ', 'con mèo'] },
  { g: 1, q: 'Con gì có cái vòi rất dài, đôi tai to như cái quạt?', a: 'con voi', w: ['con trâu', 'con ngựa', 'con hươu'] },
  { g: 1, q: 'Con gì kêu “meo meo”, rất giỏi bắt chuột?', a: 'con mèo', w: ['con chó', 'con lợn', 'con dê'] },
  { g: 1, q: 'Con gì bơi dưới nước, có vây, có đuôi, thở bằng mang?', a: 'con cá', w: ['con vịt', 'con ếch', 'con ngỗng'] },
  { g: 1, q: 'Con gì chăm chỉ hút mật hoa về làm mật ngọt?', a: 'con ong', w: ['con bướm', 'con kiến', 'con ruồi'] },
  { g: 1, q: 'Quả gì vỏ xanh, ruột đỏ, hạt đen, mùa hè ăn mát lịm?', a: 'quả dưa hấu', w: ['quả cam', 'quả chuối', 'quả xoài'] },
  { g: 1, q: 'Quả gì vỏ vàng, hình cong cong, bóc vỏ ăn thơm ngọt?', a: 'quả chuối', w: ['quả táo', 'quả nho', 'quả bưởi'] },
  { g: 1, q: 'Cái gì có bốn chân mà không biết đi, em ngồi lên để học bài?', a: 'cái ghế', w: ['cái giường', 'cái tủ', 'cái bảng'] },
  { g: 1, q: 'Cái gì càng gọt càng ngắn, giúp em viết và vẽ?', a: 'bút chì', w: ['viên phấn', 'quyển vở', 'cái thước'] },
  { g: 1, q: 'Cái gì dùng để viết lên bảng đen, viết xong lau đi được?', a: 'viên phấn', w: ['bút chì', 'cục tẩy', 'cái kéo'] },
  { g: 1, q: 'Cái gì mở ra như cái nấm, che mưa che nắng, gấp lại cầm tay?', a: 'cái ô', w: ['cái nón', 'cái mũ', 'cái quạt'] },
  { g: 1, q: 'Cái gì ban ngày tỏa nắng, sưởi ấm muôn nơi, tối đến thì lặn?', a: 'mặt trời', w: ['mặt trăng', 'ngôi sao', 'đám mây'] },
  { g: 1, q: 'Cái gì ban đêm mới sáng, lúc tròn lúc khuyết?', a: 'mặt trăng', w: ['mặt trời', 'cầu vồng', 'đám mây'] },
  { g: 2, q: 'Cái gì có kim mà không biết khâu, chạy suốt ngày đêm vẫn ở nguyên chỗ?', a: 'cái đồng hồ', w: ['cái máy khâu', 'cái quạt', 'chiếc xe đạp'] },
  { g: 2, q: 'Cái gì có răng mà không biết cắn, ngày ngày giúp em chải tóc?', a: 'cái lược', w: ['cái kéo', 'cái cưa', 'bàn chải'] },
  { g: 2, q: 'Cái gì có bảy màu, hiện trên trời sau cơn mưa?', a: 'cầu vồng', w: ['đám mây', 'tia chớp', 'ông mặt trời'] },
  { g: 2, q: 'Con gì mang nhà trên lưng, đi đâu cũng chậm rãi từng bước?', a: 'con rùa', w: ['con cua', 'con cá', 'con ếch'] },
  { g: 2, q: 'Con gì nhỏ xíu, đi thành hàng dài, khiêng mồi về tổ?', a: 'con kiến', w: ['con ong', 'con bướm', 'con muỗi'] },
  { g: 3, q: 'Cái gì không có chân mà đi khắp nơi, mang thư từ, tin tức đến mọi nhà qua mạng?', a: 'thư điện tử', w: ['con tem', 'phong bì', 'cái loa'] },
  { g: 3, q: 'Cái gì càng lấy đi nhiều thì càng to ra?', a: 'cái hố', w: ['quả bóng', 'đống cát', 'cái túi'] },
];
// Đố chữ: đổi dấu thanh
type WordRiddle = { q: string; a: string; w: string[]; g: number };
const WORD_RIDDLES: WordRiddle[] = [
  { g: 2, q: 'Để nguyên lấp lánh trên trời. Thêm dấu huyền vào thành cây dài để chống thuyền. Đó là tiếng gì?', a: 'sao – sào', w: ['sao – sáo', 'mây – mấy', 'trăng – trắng'] },
  { g: 2, q: 'Có dấu sắc thì bơi dưới nước. Đổi sang dấu huyền thành quả để nấu canh. Đó là tiếng gì?', a: 'cá – cà', w: ['cá – cả', 'cò – cỏ', 'gà – gá'] },
  { g: 2, q: 'Có dấu huyền thì ăn cỏ ngoài đồng. Đổi sang dấu sắc thành một … hoa tặng mẹ. Đó là tiếng gì?', a: 'bò – bó', w: ['bò – bỏ', 'bê – bế', 'dê – dế'] },
  { g: 2, q: 'Có dấu sắc thì mọc ở trên cây. Đổi sang dấu huyền thì dùng để … phẳng quần áo. Đó là tiếng gì?', a: 'lá – là', w: ['lá – lả', 'hoa – hòa', 'cành – cánh'] },
  { g: 3, q: 'Có dấu hỏi thì mọc xanh ngoài đồng cho trâu ăn. Đổi sang dấu huyền thì là con chim chân dài hay lội ruộng. Đó là tiếng gì?', a: 'cỏ – cò', w: ['cỏ – có', 'cá – cà', 'lúa – lụa'] },
];
const riddle: Tpl = (r, c, l) => {
  const list = RIDDLES.filter((x) => x.g <= c.grade && (l <= 2 ? x.g === 1 || x.g === c.grade : true));
  const x = r.pick(list);
  return Q.sc(`Giải câu đố: ${x.q}`, r.shuffle([x.a, ...x.w]), x.a, meta(c, l, 'doc', 'TV.DOCHIEU', `Đáp án: ${x.a}.`, `Đọc kĩ từng gợi ý trong câu đố rồi loại dần: chỉ ${x.a} đúng với tất cả các gợi ý.`, 'cau_do'));
};
const wordRiddle: Tpl = (r, c, l) => {
  const list = WORD_RIDDLES.filter((x) => x.g <= c.grade);
  if (!list.length) return null;
  const x = r.pick(list);
  return Q.sc(`Đố chữ: ${x.q}`, r.shuffle([x.a, ...x.w]), x.a, meta(c, l, 'doc', 'TV.DAUTHANH', `Đáp án: ${x.a}.`, 'Giữ nguyên âm và vần, chỉ đổi dấu thanh; thử từng tiếng xem có khớp cả hai gợi ý không.', 'do_chu'));
};
/** Lớp 1: câu đố + chọn vật được tả (tranh chữ) */
const riddleWhich: Tpl = (r, c, l) => {
  const pool = RIDDLES.filter((x) => x.g <= c.grade);
  const [x, y, z] = r.sample(pool, 3);
  if (new Set([x.a, y.a, z.a]).size < 3) return null;
  return Q.sc(`Câu đố nào có lời giải là “${x.a}”?`, r.shuffle([x.q, y.q, z.q]), x.q, meta(c, l, 'doc', 'TV.DOCHIEU', `Câu đố về ${x.a}: ${x.q}`, `Đọc từng câu đố, tìm câu có các gợi ý khớp với ${x.a}.\nCâu đúng: ${x.q}`, 'cau_do_nguoc'));
};
export const TV_CAU_DO: TplPool = {
  1: [riddle], 2: [riddle], 3: [riddle, riddleWhich],
  4: [(r, c, l) => (c.grade === 1 ? riddleWhich(r, c, l) : wordRiddle(r, c, l)), riddleWhich],
  5: [(r, c, l) => (c.grade === 1 ? riddleWhich(r, c, l) : wordRiddle(r, c, l)), riddle],
};

// =========================================================================================
// 2. QUY TẮC CHÍNH TẢ c/k, g/gh, ng/ngh
// =========================================================================================
// [cách viết đúng, chữ đầu đúng, chữ đầu sai, nghĩa gợi ý]
type Spell = [word: string, head: string, wrongHead: string, hint: string];
const SPELL: Spell[] = [
  ['kem', 'k', 'c', 'que kem mát lạnh'], ['kéo', 'k', 'c', 'cái kéo cắt giấy'], ['kiến', 'k', 'c', 'con kiến'], ['kẻ', 'k', 'c', 'thước kẻ'],
  ['kính', 'k', 'c', 'đeo kính'], ['kể', 'k', 'c', 'kể chuyện'], ['cá', 'c', 'k', 'con cá'], ['cua', 'c', 'k', 'con cua'],
  ['cô', 'c', 'k', 'cô giáo'], ['cỏ', 'c', 'k', 'bãi cỏ'], ['cam', 'c', 'k', 'quả cam'], ['cốc', 'c', 'k', 'cái cốc'],
  ['ghế', 'gh', 'g', 'cái ghế'], ['ghi', 'gh', 'g', 'ghi bài'], ['ghé', 'gh', 'g', 'ghé thăm'], ['ghẹ', 'gh', 'g', 'con ghẹ'],
  ['gà', 'g', 'gh', 'con gà'], ['gỗ', 'g', 'gh', 'bàn gỗ'], ['gấu', 'g', 'gh', 'con gấu'], ['gói', 'g', 'gh', 'gói quà'],
  ['nghé', 'ngh', 'ng', 'con nghé'], ['nghỉ', 'ngh', 'ng', 'nghỉ ngơi'], ['nghe', 'ngh', 'ng', 'nghe nhạc'], ['nghĩ', 'ngh', 'ng', 'suy nghĩ'],
  ['ngủ', 'ng', 'ngh', 'đi ngủ'], ['ngô', 'ng', 'ngh', 'bắp ngô'], ['ngựa', 'ng', 'ngh', 'con ngựa'], ['ngõ', 'ng', 'ngh', 'ngõ nhỏ'],
];
const wrongOf = (s: Spell) => s[2] + s[0].slice(s[1].length);
const RULE = 'k, gh, ngh chỉ đứng trước i, e, ê; c, g, ng đứng trước các âm còn lại (a, o, ô, ơ, u, ư…)';
const ruleWhy = (s: Spell) => (/^(k|gh|ngh)$/.test(s[1]) ? `trước ${s[0].slice(s[1].length)[0]} phải viết ${s[1]}` : `${s[2]} chỉ đứng trước i, e, ê`);
/** Chọn cách viết đúng */
const spellPick: Tpl = (r, c, l) => {
  const s = r.pick(SPELL);
  const bad = wrongOf(s);
  return withTraps(Q.sc(`Chọn cách viết đúng (${s[3]}):`, r.shuffle([s[0], bad]), s[0], meta(c, l, 'ct', 'TV.CHINHTA', `Viết đúng là “${s[0]}”: ${ruleWhy(s)}.`, `Quy tắc: ${RULE}.`, 'chinh_ta_ckg')), [{ v: bad, why: `quên quy tắc: ${ruleWhy(s)}` }]);
};
/** Điền chữ đầu */
const spellHead: Tpl = (r, c, l) => {
  const s = r.pick(SPELL);
  const rest = s[0].slice(s[1].length);
  const opts = [s[1], s[2]].sort((a, b) => a.length - b.length || a.localeCompare(b));
  return withTraps(Q.sc(`Điền chữ thích hợp vào chỗ chấm: …${rest} (${s[3]})`, opts, s[1], meta(c, l, 'ct', 'TV.CHINHTA', `Viết “${s[0]}”: ${ruleWhy(s)}.`, `Nhìn chữ cái đứng ngay sau chỗ chấm: nếu là i, e, ê thì dùng k / gh / ngh, còn lại dùng c / g / ng.`, 'chinh_ta_ckg')), [{ v: s[2], why: `quên quy tắc: ${ruleWhy(s)}` }]);
};
/** Tìm từ viết sai trong 4 từ */
const spellFindWrong: Tpl = (r, c, l) => {
  const [bad, ...ok] = r.sample(SPELL, 4);
  const w = wrongOf(bad);
  const opts = r.shuffle([w, ...ok.map((x) => x[0])]);
  return Q.sc(`Từ nào viết SAI chính tả: ${opts.join(', ')}?`, opts, w, meta(c, l, 'ct', 'TV.CHINHTA', `“${w}” viết sai, phải viết “${bad[0]}” (${ruleWhy(bad)}).`, `Quy tắc: ${RULE}.`, 'chinh_ta_ckg'));
};
/** Chọn tất cả từ viết đúng */
const spellAllRight: Tpl = (r, c, l) => {
  const picks = r.sample(SPELL, 5);
  const nBad = r.int(2, 3);
  const items = picks.map((s, i) => (i < nBad ? { t: wrongOf(s), ok: false } : { t: s[0], ok: true }));
  const opts = r.shuffle(items.map((x) => x.t));
  return Q.mc(`Chọn TẤT CẢ các từ viết đúng chính tả: ${opts.join(', ')}`, opts, items.filter((x) => x.ok).map((x) => x.t), meta(c, l, 'ct', 'TV.CHINHTA', `Các từ viết đúng: ${items.filter((x) => x.ok).map((x) => x.t).join(', ')}.`, `Quy tắc: ${RULE}.`, 'chinh_ta_ckg'));
};
export const TV_CHINH_TA: TplPool = {
  1: [spellPick, spellHead], 2: [spellHead, spellPick], 3: [spellFindWrong, spellHead], 4: [spellFindWrong, spellAllRight], 5: [spellAllRight],
};

// =========================================================================================
// 3. SẮP XẾP TỪ THÀNH CÂU (mỗi phần là một nhóm từ; không lặp nhóm trong câu)
// =========================================================================================
const SENT: { g: number; parts: string[] }[] = [
  { g: 1, parts: ['Bé', 'đi học', 'đúng giờ.'] },
  { g: 1, parts: ['Chú mèo', 'nằm', 'sưởi nắng.'] },
  { g: 1, parts: ['Đàn gà', 'ăn thóc', 'ngoài sân.'] },
  { g: 1, parts: ['Em', 'tưới cây', 'trong vườn.'] },
  { g: 1, parts: ['Chim', 'hót líu lo', 'trên cành.'] },
  { g: 1, parts: ['Mẹ', 'mua cho bé', 'quả bóng.'] },
  { g: 1, parts: ['Bạn Lan', 'vẽ', 'một bông hoa.'] },
  { g: 1, parts: ['Ông', 'kể chuyện', 'cho cháu', 'nghe.'] },
  { g: 1, parts: ['Cả nhà', 'đi chơi', 'công viên', 'vào chủ nhật.'] },
  { g: 1, parts: ['Bố', 'dạy em', 'đi xe đạp.'] },
  { g: 2, parts: ['Mỗi sáng,', 'em', 'dậy sớm', 'tập thể dục.'] },
  { g: 2, parts: ['Những chú chim sẻ', 'ríu rít', 'gọi nhau', 'trên mái nhà.'] },
  { g: 2, parts: ['Lớp em', 'trồng', 'một hàng cây xanh', 'bên cổng trường.'] },
  { g: 2, parts: ['Bà', 'nấu', 'nồi canh cua', 'thật ngon.'] },
  { g: 2, parts: ['Ngày mai,', 'cả lớp', 'đi tham quan', 'bảo tàng.'] },
  { g: 3, parts: ['Dòng sông quê em', 'uốn quanh', 'cánh đồng lúa', 'xanh mướt.'] },
  { g: 3, parts: ['Mùa xuân về,', 'cây cối', 'đâm chồi', 'nảy lộc.'] },
  { g: 3, parts: ['Các chú bộ đội', 'ngày đêm', 'canh giữ', 'biển trời quê hương.'] },
  { g: 3, parts: ['Sau cơn mưa,', 'bầu trời', 'trong xanh', 'như vừa được rửa.'] },
];
const sentence = (long: boolean): Tpl => (r, c, l) => {
  const list = SENT.filter((x) => x.g <= c.grade && (long ? x.parts.length >= 4 || x.g >= 2 : x.parts.length <= 4));
  if (!list.length) return null;
  const x = r.pick(list);
  const full = x.parts.join(' ');
  return Q.ord(`Sắp xếp các nhóm từ thành câu đúng: ${r.shuffle(x.parts).join(' / ')}`, x.parts, meta(c, l, 'cau', 'TV.XEPCAU', `Câu đúng: ${full}`, `Tìm phần chỉ ai (con gì, cái gì) đứng đầu câu, viết hoa chữ đầu; phần có dấu chấm đứng cuối câu.\nCâu đúng: ${full}`, 'sap_xep_cau'));
};
export const TV_SAP_XEP: TplPool = { 1: [sentence(false)], 2: [sentence(false)], 3: [sentence(false), sentence(true)], 4: [sentence(true)], 5: [sentence(true)] };

// =========================================================================================
// 4. TÌM TỪ KHÁC LOẠI
// =========================================================================================
type Group = { name: string; words: string[] };
const G_THINGS: Group[] = [
  { name: 'con vật', words: ['con mèo', 'con chó', 'con gà', 'con vịt', 'con thỏ', 'con voi', 'con hổ', 'con ong'] },
  { name: 'quả', words: ['quả chuối', 'quả táo', 'quả xoài', 'quả nho', 'quả ổi', 'quả mít', 'quả bưởi'] },
  { name: 'đồ dùng học tập', words: ['bút chì', 'thước kẻ', 'quyển vở', 'cục tẩy', 'cặp sách', 'hộp bút'] },
  { name: 'màu sắc', words: ['màu đỏ', 'màu xanh', 'màu vàng', 'màu tím', 'màu trắng', 'màu hồng'] },
  { name: 'người trong gia đình', words: ['ông', 'bà', 'bố', 'mẹ', 'anh trai', 'chị gái'] },
];
const G_KINDS: Group[] = [
  { name: 'chỉ sự vật', words: ['cái bàn', 'quyển sách', 'cây bàng', 'đám mây', 'dòng sông', 'ngôi nhà', 'chiếc xe đạp'] },
  { name: 'chỉ hoạt động', words: ['chạy', 'nhảy', 'đọc', 'viết', 'hát', 'múa', 'bơi', 'nấu cơm'] },
  { name: 'chỉ đặc điểm', words: ['cao', 'thấp', 'xinh xắn', 'ngoan ngoãn', 'chăm chỉ', 'đỏ tươi', 'tròn xoe'] },
];
const G_POS: Group[] = [
  { name: 'danh từ', words: ['học sinh', 'dòng sông', 'quyển sách', 'bầu trời', 'cánh đồng', 'ngôi trường', 'cơn mưa'] },
  { name: 'động từ', words: ['chạy nhảy', 'suy nghĩ', 'trò chuyện', 'xây dựng', 'leo trèo', 'reo hò', 'tập luyện'] },
  { name: 'tính từ', words: ['xanh biếc', 'cao vút', 'thông minh', 'rực rỡ', 'hiền hậu', 'mềm mại', 'siêng năng'] },
];
const groupsOf = (c: AdvCtx) => (c.grade === 1 ? G_THINGS : c.grade <= 3 ? G_KINDS : G_POS);
const oddOne = (n: number): Tpl => (r, c, l) => {
  const gs = groupsOf(c);
  const [main, other] = r.sample(gs, 2);
  const same = r.sample(main.words, n - 1);
  const odd = r.pick(other.words);
  const label = c.grade >= 4 ? `là ${main.name}` : `${main.name.startsWith('chỉ') ? '' : 'chỉ '}${main.name}`;
  const opts = r.shuffle([...same, odd]);
  return Q.sc(`Từ nào KHÁC LOẠI với các từ còn lại: ${opts.join(', ')}?`, opts, odd,
    meta(c, l, 'tu', 'TV.TULOAI', `“${odd}” ${c.grade >= 4 ? 'là' : 'chỉ'} ${other.name.replace(/^chỉ /, '')}; các từ còn lại đều ${label}.`, `Xếp từng từ vào nhóm: ${same.join(', ')} cùng ${label}; riêng “${odd}” thuộc nhóm ${other.name}.`, 'tu_khac_loai'));
};
const pickAll: Tpl = (r, c, l) => {
  const gs = groupsOf(c);
  const [main, ...rest] = r.sample(gs, Math.min(3, gs.length));
  const yes = r.sample(main.words, 3);
  const no = rest.flatMap((g) => r.sample(g.words, 3)).slice(0, 3);
  const what = main.name.startsWith('chỉ') ? `từ ${main.name}` : c.grade >= 4 ? `${main.name}` : `từ chỉ ${main.name}`;
  const opts = r.shuffle([...yes, ...no]);
  return Q.mc(`Chọn TẤT CẢ các ${what} trong các từ: ${opts.join(', ')}`, opts, yes, meta(c, l, 'tu', 'TV.TULOAI', `Các ${what}: ${yes.join(', ')}.`, `Xét từng từ xem có phải ${what.replace(/^từ /, 'từ ')} không.\nĐúng: ${yes.join(', ')}.\nKhông phải: ${no.join(', ')}.`, 'tu_loai'));
};
export const TV_KHAC_LOAI: TplPool = { 1: [oddOne(4)], 2: [oddOne(4)], 3: [oddOne(4), oddOne(5)], 4: [oddOne(5), pickAll], 5: [pickAll, oddOne(5)] };

// =========================================================================================
// 5. THÀNH NGỮ, TỤC NGỮ
// =========================================================================================
// [vế đầu, từ đúng, các từ sai (không dùng từ cũng đúng trong dân gian), lớp tối thiểu]
const SIMILE: [string, string, string[], number][] = [
  ['Nhanh như', 'cắt', ['rùa', 'sên', 'voi'], 2], ['Chậm như', 'rùa', ['sóc', 'cắt', 'thỏ'], 2], ['Khỏe như', 'voi', ['mèo', 'sên', 'kiến'], 2],
  ['Hiền như', 'bụt', ['lửa', 'gió bão', 'cọp'], 2], ['Nhát như', 'thỏ', ['cọp', 'voi', 'sư tử'], 2], ['Đen như', 'than', ['tuyết', 'sữa', 'mây'], 2],
  ['Trắng như', 'tuyết', ['than', 'mực', 'quạ'], 2], ['Đỏ như', 'son', ['than', 'mực', 'lá'], 3], ['Cao như', 'sếu', ['kiến', 'nấm', 'chuột'], 3],
  ['Đẹp như', 'tiên', ['than', 'sên', 'bùn'], 3], ['Lạnh như', 'băng', ['lửa', 'nắng hè', 'than hồng'], 3], ['Chua như', 'giấm', ['đường', 'mật', 'sữa'], 3],
  ['Thẳng như', 'ruột ngựa', ['lưỡi câu', 'sừng trâu', 'vòng tròn'], 4], ['Vững như', 'bàn thạch', ['lá cây', 'bông gòn', 'sợi chỉ'], 4],
];
const PROVERBS: [string, string, string[], number][] = [
  ['Uống nước nhớ nguồn', 'Biết ơn những người đã làm ra điều tốt cho mình', ['Uống nước phải đun sôi', 'Nhớ đường đến con suối', 'Nước nguồn là nước sạch nhất'], 3],
  ['Ăn quả nhớ kẻ trồng cây', 'Biết ơn người đã vất vả làm ra thành quả cho mình', ['Ăn quả xong phải trồng cây', 'Chỉ nên ăn quả chín', 'Trồng cây thì sẽ có quả'], 3],
  ['Có công mài sắt, có ngày nên kim', 'Kiên trì, chăm chỉ thì việc khó mấy cũng thành công', ['Muốn có kim phải mua sắt', 'Mài sắt là việc rất dễ', 'Làm thợ rèn thì giàu có'], 4],
  ['Lá lành đùm lá rách', 'Người có điều kiện giúp đỡ người gặp khó khăn', ['Lá rách thì phải bỏ đi', 'Chỉ dùng lá lành để gói bánh', 'Cây nào cũng có lá rách'], 4],
  ['Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao', 'Đoàn kết thì tạo nên sức mạnh lớn', ['Trồng ba cây thì thành núi', 'Núi cao chỉ có ba cây', 'Một cây thì không sống được'], 4],
  ['Tốt gỗ hơn tốt nước sơn', 'Phẩm chất bên trong quý hơn vẻ đẹp bên ngoài', ['Gỗ tốt không cần sơn', 'Nên sơn đồ gỗ cho đẹp', 'Nước sơn làm gỗ bền hơn'], 5],
  ['Gần mực thì đen, gần đèn thì sáng', 'Bạn bè, môi trường xung quanh ảnh hưởng nhiều đến mỗi người', ['Ngồi gần đèn để đọc sách', 'Mực làm bẩn tay', 'Đèn sáng hơn mực'], 5],
  ['Thua keo này, bày keo khác', 'Thất bại thì không nản, tìm cách khác để làm lại', ['Đã thua thì nên bỏ cuộc', 'Chơi keo thì phải thắng', 'Đổi keo dán khác cho chắc'], 5],
];
const simile: Tpl = (r, c, l) => {
  const list = SIMILE.filter((x) => x[3] <= c.grade && (l <= 2 ? x[3] <= 2 : true));
  const [head, a, w] = r.pick(list);
  return Q.sc(`Điền từ thích hợp để được thành ngữ: “${head} …”`, r.shuffle([a, ...w]), a, meta(c, l, 'tu', 'TV.SOSANH', `Thành ngữ: ${head} ${a}.`, `Thành ngữ so sánh lấy hình ảnh quen thuộc có đặc điểm nổi bật nhất: ${head.toLowerCase()} ${a}.`, 'thanh_ngu'));
};
const simileMatch: Tpl = (r, c, l) => {
  const list = SIMILE.filter((x) => x[3] <= c.grade);
  const picks = r.sample(list, 4);
  return Q.mt(`Nối để được thành ngữ đúng: ${picks.map((x) => `${x[0]} …`).join('; ')}`, picks.map((x) => [`${x[0]} …`, x[1]] as [string, string]), meta(c, l, 'tu', 'TV.SOSANH', picks.map((x) => `${x[0]} ${x[1]}`).join('; ') + '.', `Mỗi thành ngữ so sánh với hình ảnh có đặc điểm đó nổi bật nhất:\n${picks.map((x) => `${x[0]} ${x[1]}`).join('\n')}`, 'thanh_ngu'));
};
const proverb: Tpl = (r, c, l) => {
  const list = PROVERBS.filter((x) => x[3] <= c.grade);
  if (!list.length) return simileMatch(r, c, l);
  const [p, a, w] = r.pick(list);
  return Q.sc(`Câu tục ngữ “${p}” khuyên em điều gì?`, r.shuffle([a, ...w]), a, meta(c, l, 'tu', 'TV.NGHIATU', `${cap(a)}.`, `Tục ngữ thường mượn hình ảnh quen thuộc để nói về cách sống: hiểu nghĩa bóng, không hiểu theo nghĩa đen.`, 'tuc_ngu'));
};
export const TV_THANH_NGU: TplPool = { 1: [simile], 2: [simile], 3: [simile, simileMatch], 4: [simileMatch, proverb], 5: [proverb, simileMatch] };

// =========================================================================================
// 6. TỪ TRÁI NGHĨA – ĐỒNG NGHĨA
// =========================================================================================
const ANT: [string, string, number][] = [
  ['cao', 'thấp', 2], ['dài', 'ngắn', 2], ['nóng', 'lạnh', 2], ['nhanh', 'chậm', 2], ['vui', 'buồn', 2], ['sáng', 'tối', 2],
  ['mới', 'cũ', 2], ['khóc', 'cười', 2], ['mở', 'đóng', 2], ['trên', 'dưới', 2], ['ngày', 'đêm', 2], ['béo', 'gầy', 2],
  ['sạch', 'bẩn', 2], ['nặng', 'nhẹ', 2], ['xa', 'gần', 2], ['đầy', 'vơi', 2],
  ['chăm chỉ', 'lười biếng', 3], ['dũng cảm', 'hèn nhát', 3], ['thật thà', 'dối trá', 3], ['ồn ào', 'yên tĩnh', 3], ['rộng rãi', 'chật hẹp', 3], ['đoàn kết', 'chia rẽ', 4],
];
const SYN: [string, string, number][] = [
  ['chăm chỉ', 'siêng năng', 3], ['to lớn', 'khổng lồ', 3], ['đất nước', 'tổ quốc', 3], ['xinh đẹp', 'xinh xắn', 3], ['dũng cảm', 'gan dạ', 3],
  ['thông minh', 'sáng dạ', 4], ['hiền lành', 'hiền hậu', 3], ['bao la', 'mênh mông', 4], ['cố gắng', 'nỗ lực', 4], ['giúp đỡ', 'hỗ trợ', 4],
];
const antonym: Tpl = (r, c, l) => {
  const list = ANT.filter((x) => x[2] <= c.grade);
  const [x, ...others] = r.sample(list, 4);
  const flip = r.chance(0.5);
  const w = flip ? x[1] : x[0], a = flip ? x[0] : x[1];
  const wrong = others.map((o) => (r.chance(0.5) ? o[0] : o[1]));
  return Q.sc(`Từ nào TRÁI NGHĨA với từ “${w}”?`, r.shuffle([a, ...wrong]), a, meta(c, l, 'tu', 'TV.NGHIATU', `“${w}” trái nghĩa với “${a}”.`, `Từ trái nghĩa là từ có nghĩa ngược nhau: ${w} – ${a}.`, 'trai_nghia'));
};
const antonymPair: Tpl = (r, c, l) => {
  const ant = r.pick(ANT.filter((x) => x[2] <= c.grade));
  const syn = SYN.filter((x) => x[2] <= c.grade);
  const mix = r.sample(ANT.filter((x) => x !== ant), 2);
  const wrong = [`${mix[0][0]} – ${mix[1][1]}`, ...(syn.length ? [`${r.pick(syn)[0]} – ${r.pick(syn)[1]}`] : []), `${ant[0]} – ${mix[0][0]}`];
  const right = `${ant[0]} – ${ant[1]}`;
  const opts = [...new Set([right, ...wrong])].slice(0, 4);
  const shown = r.shuffle(opts);
  return Q.sc(`Cặp từ nào là cặp từ TRÁI NGHĨA: ${shown.join('; ')}?`, shown, right, meta(c, l, 'tu', 'TV.NGHIATU', `${right} là cặp từ trái nghĩa.`, `Cặp từ trái nghĩa có nghĩa ngược hẳn nhau.\n${right}: nghĩa ngược nhau.\nCác cặp còn lại không ngược nghĩa (hoặc cùng nghĩa).`, 'trai_nghia'));
};
const synonym: Tpl = (r, c, l) => {
  const list = SYN.filter((x) => x[2] <= c.grade);
  if (list.length < 4) return antonym(r, c, l);
  const [x, ...others] = r.sample(list, 4);
  const ant = ANT.find((a) => a[0] === x[0] || a[1] === x[0]);
  const wrong = [...(ant ? [ant[0] === x[0] ? ant[1] : ant[0]] : []), ...others.map((o) => o[1])].slice(0, 3);
  const q = Q.sc(`Từ nào CÙNG NGHĨA (đồng nghĩa) với từ “${x[0]}”?`, r.shuffle([x[1], ...wrong]), x[1], meta(c, l, 'tu', 'TV.NGHIATU', `“${x[0]}” đồng nghĩa với “${x[1]}”.`, `Từ đồng nghĩa là từ có nghĩa giống hoặc gần giống nhau: ${x[0]} – ${x[1]}.`, 'dong_nghia'));
  return ant ? withTraps(q, [{ v: ant[0] === x[0] ? ant[1] : ant[0], why: 'chọn nhầm từ trái nghĩa' }]) : q;
};
export const TV_TRAI_NGHIA: TplPool = { 1: [antonym], 2: [antonym], 3: [antonymPair, antonym], 4: [synonym, antonymPair], 5: [synonym, antonymPair] };
