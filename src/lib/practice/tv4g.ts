// BỘ SINH CÂU — TIẾNG VIỆT 4 (luyện từ và câu) theo từng tuần của sách Tiếng Việt 4 (Kết nối tri thức).
// Kho từ, câu mẫu do EduChain Kids tự viết; chỉ bám TÊN nội dung luyện tập trong mục lục sách (vd. "Danh từ chung,
// danh từ riêng", "Biện pháp nhân hoá", "Hai thành phần chính của câu", "Trạng ngữ chỉ nguyên nhân, mục đích").

import type { Level } from '../content/types';
import { Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';

export type TV4Focus = 'danhtu' | 'dtrieng' | 'dongtu' | 'tinhtu' | 'tuloai' | 'nhanhoa' | 'tudien' | 'coquan' | 'gachngang' | 'ngoackep' | 'ngoacdon'
  | 'cau' | 'chungu' | 'vingu' | 'trangngu' | 'tn_tg' | 'tn_nc' | 'tn_nn' | 'tn_md' | 'tn_pt' | 'luachon' | 'daucau';
export type TV4Theme = 'moinguoi' | 'trainghiem' | 'sangtao' | 'uocmo' | 'yeuthuong' | 'nguon' | 'quehuong' | 'binhyen';
export type TV4Ctx = { week: number; focus: TV4Focus[]; theme: TV4Theme };
type T4 = (r: Rng, c: TV4Ctx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });

// ------------------------------------------------------------------------------------------- TỪ LOẠI
const NOUN = ['học sinh', 'cô giáo', 'quyển sách', 'dòng sông', 'ngọn núi', 'cơn mưa', 'tình bạn', 'niềm vui', 'con mèo', 'cánh đồng', 'buổi sáng', 'chiếc xe', 'ngôi trường', 'ước mơ', 'bác sĩ', 'mặt trời'];
const VERB = ['chạy', 'đọc', 'viết', 'hát', 'suy nghĩ', 'leo trèo', 'xây dựng', 'yêu thương', 'học tập', 'chăm sóc', 'khám phá', 'trò chuyện', 'vẽ', 'nhảy múa', 'giúp đỡ', 'lắng nghe'];
const ADJ = ['xanh biếc', 'cao vút', 'chăm chỉ', 'dũng cảm', 'thông minh', 'rực rỡ', 'mênh mông', 'hiền lành', 'nhanh nhẹn', 'thơm ngát', 'tròn trịa', 'vui vẻ', 'trong veo', 'khéo léo', 'ồn ào', 'yên tĩnh'];
type POS = 'danh' | 'dong' | 'tinh';
const POS_W: Record<POS, string[]> = { danh: NOUN, dong: VERB, tinh: ADJ };
const POS_N: Record<POS, string> = { danh: 'danh từ', dong: 'động từ', tinh: 'tính từ' };
const POS_O: Record<POS, string> = { danh: 'V4.TU.01', dong: 'V4.TU.02', tinh: 'V4.TU.03' };
const POS_WHY: Record<POS, string> = { danh: 'Danh từ chỉ người, vật, hiện tượng, khái niệm.', dong: 'Động từ chỉ hoạt động, trạng thái.', tinh: 'Tính từ chỉ đặc điểm, tính chất.' };
const posOf = (c: TV4Ctx): POS[] => {
  const p: POS[] = [];
  if (c.focus.includes('danhtu') || c.focus.includes('dtrieng')) p.push('danh');
  if (c.focus.includes('dongtu')) p.push('dong');
  if (c.focus.includes('tinhtu')) p.push('tinh');
  return p.length && !c.focus.includes('tuloai') ? p : ['danh', 'dong', 'tinh'];
};
const posPick: T4 = (r, c, l) => {
  const p = r.pick(posOf(c));
  const right = r.pick(POS_W[p]);
  const others = (['danh', 'dong', 'tinh'] as POS[]).filter((x) => x !== p).map((x) => r.pick(POS_W[x]));
  return Q.sc(`Từ nào là ${POS_N[p]}?`, r.shuffle([right, ...others]), right, M(POS_O[p], 'TV.TULOAI', `chon_${p}`, l, `${POS_WHY[p]} "${right}" là ${POS_N[p]}.`));
};
const posGroup: T4 = (r, c, l) => {
  const p = r.pick(posOf(c));
  const right = r.sample(POS_W[p], 3);
  const wrong = r.sample((['danh', 'dong', 'tinh'] as POS[]).filter((x) => x !== p).flatMap((x) => POS_W[x]), 3);
  return Q.mc(`Chọn tất cả ${POS_N[p]}.`, r.shuffle([...right, ...wrong]), right, M(POS_O[p], 'TV.TULOAI', `nhom_${p}`, l, `${POS_WHY[p]} Đó là: ${right.join(', ')}.`));
};
const posMatch: T4 = (r, c, l) => {
  const pairs: [string, string][] = (r.shuffle(['danh', 'dong', 'tinh']) as POS[]).map((p) => [r.pick(POS_W[p]), POS_N[p]]);
  return Q.mt('Nối mỗi từ với từ loại của nó.', pairs, M('V4.TU.01', 'TV.TULOAI', 'noi_tu_loai', l, pairs.map(([w, n]) => `"${w}": ${n}`).join('; ') + '.'));
};
// câu có đánh dấu sẵn từ loại
const POS_SENT: [string, Record<POS, string[]>][] = [
  ['Chú chim nhỏ hót líu lo trên cành cây.', { danh: ['chim', 'cành cây'], dong: ['hót'], tinh: ['nhỏ', 'líu lo'] }],
  ['Các bạn học sinh chăm chỉ quét sân trường.', { danh: ['học sinh', 'sân trường'], dong: ['quét'], tinh: ['chăm chỉ'] }],
  ['Dòng sông xanh biếc uốn quanh làng.', { danh: ['dòng sông', 'làng'], dong: ['uốn'], tinh: ['xanh biếc'] }],
  ['Mẹ em nấu những món ăn thơm ngon.', { danh: ['mẹ', 'món ăn'], dong: ['nấu'], tinh: ['thơm ngon'] }],
  ['Bầy ong cần cù hút mật trong vườn hoa.', { danh: ['bầy ong', 'mật', 'vườn hoa'], dong: ['hút'], tinh: ['cần cù'] }],
];
const posInSentence: T4 = (r, c, l) => {
  const p = r.pick(posOf(c));
  const [s, tags] = r.pick(POS_SENT);
  const all = [...tags.danh, ...tags.dong, ...tags.tinh];
  return Q.mc(`Chọn tất cả ${POS_N[p]} trong câu: "${s}"`, r.shuffle(all), tags[p], M(POS_O[p], 'TV.TULOAI', `tim_${p}_trong_cau`, l, `${POS_WHY[p]} ${POS_N[p][0].toUpperCase() + POS_N[p].slice(1)} trong câu: ${tags[p].join(', ')}.`));
};
// danh từ chung / riêng
const PROPER = ['Hà Nội', 'Nguyễn Trãi', 'sông Hồng', 'Phú Quốc', 'Lê Văn Tám', 'Trường Sơn'];
const COMMON = ['thành phố', 'nhà thơ', 'dòng sông', 'hòn đảo', 'anh hùng', 'dãy núi'];
const properPick: T4 = (r, c, l) => {
  const right = r.sample(PROPER, 2);
  const wrong = r.sample(COMMON, 3);
  return Q.mc('Chọn tất cả danh từ riêng.', r.shuffle([...right, ...wrong]), right, M('V4.TU.01', 'TV.TULOAI', 'danh_tu_rieng', l, 'Danh từ riêng là tên riêng của người, sự vật, địa danh; luôn viết hoa.'));
};
const properMatch: T4 = (r, c, l) => {
  const i = r.int(0, PROPER.length - 1);
  const ids = r.sample([...PROPER.keys()], 3);
  if (!ids.includes(i)) ids[0] = i;
  return Q.mt('Nối danh từ riêng với danh từ chung phù hợp.', ids.map((k) => [PROPER[k], COMMON[k]]), M('V4.TU.01', 'TV.TULOAI', 'chung_rieng', l, ids.map((k) => `${PROPER[k]} là tên một ${COMMON[k]}`).join('; ') + '.'));
};

// ------------------------------------------------------------------------------------------- NHÂN HOÁ
const NH: [string, string, string][] = [
  ['Ông mặt trời thức dậy, mỉm cười với muôn loài.', 'mặt trời', 'ông, thức dậy, mỉm cười'],
  ['Chị gió nhẹ nhàng ru những ngọn lúa ngủ say.', 'gió', 'chị, ru'],
  ['Cây bàng già đứng trầm ngâm bên cổng trường.', 'cây bàng', 'đứng trầm ngâm'],
  ['Những giọt mưa nhảy múa trên mái nhà.', 'giọt mưa', 'nhảy múa'],
  ['Bác kim đồng hồ chăm chỉ làm việc suốt ngày đêm.', 'kim đồng hồ', 'bác, chăm chỉ làm việc'],
  ['Dòng sông hiền hoà kể chuyện ngày xưa cho làng nghe.', 'dòng sông', 'hiền hoà, kể chuyện'],
];
const NOT_NH = ['Mặt trời mọc ở đằng đông.', 'Gió thổi mạnh làm cây nghiêng ngả.', 'Cây bàng ở giữa sân trường.', 'Mưa rơi suốt cả buổi chiều.'];
const nhPick: T4 = (r, c, l) => {
  const [s] = r.pick(NH);
  return Q.sc('Câu nào có sử dụng biện pháp nhân hoá?', r.shuffle([s, ...r.sample(NOT_NH, 2)]), s, M('V4.TU.06', 'TV.SOSANH', 'nhan_hoa', l, `Câu "${s}" gọi hoặc tả sự vật bằng từ ngữ dùng cho người.`));
};
const nhWhat: T4 = (r, c, l) => {
  const [s, obj] = r.pick(NH);
  const others = r.sample(NH.filter((x) => x[1] !== obj).map((x) => x[1]), 2);
  return Q.sc(`Trong câu "${s}", sự vật nào được nhân hoá?`, r.shuffle([obj, ...others]), obj, M('V4.TU.06', 'TV.SOSANH', 'su_vat_nhan_hoa', l, `${obj[0].toUpperCase() + obj.slice(1)} được tả như con người.`));
};
const nhHow: T4 = (r, c, l) => {
  const [s, obj, how] = r.pick(NH);
  const wrong = r.sample(NH.filter((x) => x[2] !== how).map((x) => x[2]), 2);
  return Q.sc(`Trong câu "${s}", những từ ngữ nào giúp nhân hoá ${obj}?`, r.shuffle([how, ...wrong]), how, M('V4.TU.06', 'TV.SOSANH', 'tu_nhan_hoa', l, `Các từ ngữ "${how}" vốn dùng cho người, nay dùng cho ${obj}.`));
};

// ------------------------------------------------------------------------------------------- CÂU: CHỦ NGỮ, VỊ NGỮ, TRẠNG NGỮ
const CNVN: [string, string, string][] = [
  ['Đàn cò trắng bay lượn trên cánh đồng.', 'Đàn cò trắng', 'bay lượn trên cánh đồng'],
  ['Bạn Lan là lớp trưởng lớp em.', 'Bạn Lan', 'là lớp trưởng lớp em'],
  ['Những bông hoa phượng đỏ rực cả góc sân.', 'Những bông hoa phượng', 'đỏ rực cả góc sân'],
  ['Ông em thường đọc báo vào buổi sáng.', 'Ông em', 'thường đọc báo vào buổi sáng'],
  ['Chiếc cặp mới của em rất đẹp.', 'Chiếc cặp mới của em', 'rất đẹp'],
  ['Các chú công nhân đang xây cây cầu mới.', 'Các chú công nhân', 'đang xây cây cầu mới'],
];
const cnPick: T4 = (r, c, l) => {
  const [s, cn, vn] = r.pick(CNVN);
  const words = s.replace('.', '').split(' ');
  const decoy = words.slice(0, Math.max(1, cn.split(' ').length - 1)).join(' ');
  const opts = [...new Set([cn, vn, decoy])];
  if (opts.length < 3) return null;
  return Q.sc(`Chủ ngữ của câu "${s}" là:`, r.shuffle(opts), cn, M('V4.CAU.01', 'TV.THANHPHAN', 'chu_ngu', l, `Chủ ngữ trả lời câu hỏi "Ai/Cái gì/Con gì?": "${cn}".`));
};
const vnPick: T4 = (r, c, l) => {
  const [s, cn, vn] = r.pick(CNVN);
  const half = vn.split(' ').slice(0, 2).join(' ');
  const opts = [...new Set([vn, cn, half])];
  if (opts.length < 3) return null;
  return Q.sc(`Vị ngữ của câu "${s}" là:`, r.shuffle(opts), vn, M('V4.CAU.01', 'TV.THANHPHAN', 'vi_ngu', l, `Vị ngữ trả lời câu hỏi "Làm gì/Là gì/Thế nào?": "${vn}".`));
};
const cnvnMatch: T4 = (r, c, l) => {
  const ps = r.sample(CNVN, 3);
  return Q.mt('Nối chủ ngữ với vị ngữ để tạo thành câu.', ps.map(([, a, b]) => [a, b]), M('V4.CAU.01', 'TV.THANHPHAN', 'ghep_cn_vn', l, ps.map(([s]) => s).join(' ')));
};
const sentWhole: T4 = (r, c, l) => {
  const right = r.pick(CNVN)[0];
  const frags = ['Trên cành cây cao.', 'Những bạn học sinh lớp bốn.', 'Vì trời mưa to.', 'Rất xanh và mát.'];
  return Q.sc('Dòng nào là một câu hoàn chỉnh (có đủ chủ ngữ và vị ngữ)?', r.shuffle([right, ...r.sample(frags, 2)]), right, M('V4.CAU.01', 'TV.THANHPHAN', 'cau_hoan_chinh', l, `"${right}" có đủ chủ ngữ và vị ngữ, diễn đạt một ý trọn vẹn.`));
};
type TN = 'tg' | 'nc' | 'nn' | 'md' | 'pt';
const TN_N: Record<TN, string> = { tg: 'thời gian', nc: 'nơi chốn', nn: 'nguyên nhân', md: 'mục đích', pt: 'phương tiện' };
const TN_S: Record<TN, [string, string][]> = {
  tg: [['Sáng sớm, sương còn đọng trên lá.', 'Sáng sớm'], ['Mùa hè năm ngoái, em được về quê.', 'Mùa hè năm ngoái'], ['Tối qua, cả nhà em xem phim.', 'Tối qua']],
  nc: [['Trên cành cây, chim hót líu lo.', 'Trên cành cây'], ['Ở sân trường, các bạn đang chơi đá cầu.', 'Ở sân trường'], ['Dưới gốc đa, các cụ ngồi trò chuyện.', 'Dưới gốc đa']],
  nn: [['Vì trời mưa to, trận đấu bị hoãn.', 'Vì trời mưa to'], ['Nhờ chăm chỉ, Nam đạt điểm cao.', 'Nhờ chăm chỉ'], ['Tại mải chơi, Tí quên làm bài.', 'Tại mải chơi']],
  md: [['Để có sức khoẻ tốt, em tập thể dục mỗi ngày.', 'Để có sức khoẻ tốt'], ['Vì môi trường xanh, chúng em trồng cây.', 'Vì môi trường xanh'], ['Để kịp giờ học, em dậy sớm.', 'Để kịp giờ học']],
  pt: [['Bằng đôi bàn tay khéo léo, bà đan chiếc khăn len.', 'Bằng đôi bàn tay khéo léo'], ['Với chiếc xe đạp cũ, bố đi làm mỗi ngày.', 'Với chiếc xe đạp cũ'], ['Bằng giọng nói ấm áp, cô kể chuyện cho cả lớp.', 'Bằng giọng nói ấm áp']],
};
const tnOf = (c: TV4Ctx): TN[] => {
  const m: [TV4Focus, TN][] = [['tn_tg', 'tg'], ['tn_nc', 'nc'], ['tn_nn', 'nn'], ['tn_md', 'md'], ['tn_pt', 'pt']];
  const t = m.filter(([f]) => c.focus.includes(f)).map(([, k]) => k);
  if (t.length) return t;
  return c.focus.includes('trangngu') ? ['tg', 'nc', 'nn', 'md', 'pt'] : ['tg', 'nc'];
};
const tnFind: T4 = (r, c, l) => {
  const k = r.pick(tnOf(c));
  const [s, tn] = r.pick(TN_S[k]);
  const rest = s.slice(tn.length + 2).replace('.', '');
  const opts = [...new Set([tn, rest, rest.split(' ').slice(0, 2).join(' ')])];
  if (opts.length < 3) return null;
  return Q.sc(`Trạng ngữ trong câu "${s}" là:`, r.shuffle(opts), tn, M('V4.CAU.02', 'TV.THANHPHAN', 'tim_trang_ngu', l, `Trạng ngữ là bộ phận phụ, thường đứng đầu câu và ngăn cách bằng dấu phẩy: "${tn}".`));
};
const tnType: T4 = (r, c, l) => {
  const ks = tnOf(c);
  const k = r.pick(ks);
  const [s, tn] = r.pick(TN_S[k]);
  const opts = [...new Set([TN_N[k], ...r.sample((Object.keys(TN_N) as TN[]).filter((x) => x !== k), 2).map((x) => TN_N[x])])];
  return Q.sc(`Trạng ngữ "${tn}" trong câu "${s}" chỉ gì?`, r.shuffle(opts), TN_N[k], M('V4.CAU.02', 'TV.THANHPHAN', 'loai_trang_ngu', l, `"${tn}" cho biết ${TN_N[k]} của sự việc.`));
};
const tnMatch: T4 = (r, c, l) => {
  const ks = r.sample(Object.keys(TN_N) as TN[], 3);
  const pairs: [string, string][] = ks.map((k) => [r.pick(TN_S[k])[1], TN_N[k]]);
  return Q.mt('Nối mỗi trạng ngữ với ý nghĩa của nó.', pairs, M('V4.CAU.02', 'TV.THANHPHAN', 'noi_trang_ngu', l, pairs.map(([t, n]) => `"${t}": chỉ ${n}`).join('; ') + '.'));
};

// ------------------------------------------------------------------------------------------- DẤU CÂU
type Mark = 'gachngang' | 'ngoackep' | 'ngoacdon';
const MARK_N: Record<Mark, string> = { gachngang: 'dấu gạch ngang', ngoackep: 'dấu ngoặc kép', ngoacdon: 'dấu ngoặc đơn' };
const MARKS: Record<Mark, [string, string][]> = {
  gachngang: [['Mẹ hỏi:\n[ ] Con đã làm bài chưa?', 'đánh dấu lời nói của nhân vật'], ['Chuyến tàu Hà Nội [ ] Huế khởi hành lúc 7 giờ.', 'nối các từ chỉ địa điểm (liên danh)'], ['Em cần chuẩn bị:\n[ ] sách vở;\n[ ] bút thước.', 'đánh dấu các ý liệt kê']],
  ngoackep: [['Bài hát [ ]Quê hương[ ] rất hay.', 'đánh dấu tên tác phẩm'], ['Thầy dặn: [ ]Các em phải luôn trung thực.[ ]', 'đánh dấu lời nói trực tiếp'], ['Bạn ấy được gọi là [ ]cây toán[ ] của lớp.', 'đánh dấu từ ngữ dùng với nghĩa đặc biệt']],
  ngoacdon: [['Bạn Lan [ ]lớp trưởng lớp em[ ] hát rất hay.', 'đánh dấu phần chú thích'], ['Em thích ăn bánh chưng [ ]một món ăn ngày Tết[ ].', 'đánh dấu phần giải thích'], ['Lớp em có ba mươi bạn [ ]mười lăm bạn nữ[ ].', 'đánh dấu phần chú thích']],
};
const marksOf = (c: TV4Ctx): Mark[] => {
  const m = (['gachngang', 'ngoackep', 'ngoacdon'] as Mark[]).filter((x) => c.focus.includes(x));
  return m.length ? m : ['gachngang', 'ngoackep', 'ngoacdon'];
};
const markPick: T4 = (r, c, l) => {
  const mk = r.pick(marksOf(c));
  const [s, use] = r.pick(MARKS[mk]);
  return Q.sc(`Dấu câu nào thích hợp đặt vào chỗ [ ]?\n${s}`, ['dấu gạch ngang', 'dấu ngoặc kép', 'dấu ngoặc đơn'], MARK_N[mk], M('V4.CAU.03', 'TV.DAUCAU', 'dau_cau_4', l, `Dùng ${MARK_N[mk]} để ${use}.`));
};
const markUse: T4 = (r, c, l) => {
  const mk = r.pick(marksOf(c));
  const [s, use] = r.pick(MARKS[mk]);
  const wrong = r.sample((Object.keys(MARKS) as Mark[]).filter((x) => x !== mk).flatMap((x) => MARKS[x].map((y) => y[1])).filter((u, i, arr) => u !== use && arr.indexOf(u) === i), 2);
  return Q.sc(`Trong câu sau, ${MARK_N[mk]} (đặt ở chỗ [ ]) dùng để làm gì?\n${s}`, r.shuffle([use, ...wrong]), use, M('V4.CAU.03', 'TV.DAUCAU', 'cong_dung_dau', l, `${MARK_N[mk][0].toUpperCase() + MARK_N[mk].slice(1)} ở đây dùng để ${use}.`));
};

// ------------------------------------------------------------------------------------------- VIẾT HOA TÊN CƠ QUAN, TỔ CHỨC; TỪ ĐIỂN
const ORGS: [string, string[]][] = [
  ['Trường Tiểu học Kim Đồng', ['trường', 'tiểu', 'kim', 'đồng']], ['Bộ Giáo dục và Đào tạo', ['bộ', 'giáo', 'đào']],
  ['Thư viện Quốc gia Việt Nam', ['thư', 'quốc', 'việt', 'nam']], ['Đội Thiếu niên Tiền phong Hồ Chí Minh', ['đội', 'thiếu', 'tiền', 'hồ', 'chí', 'minh']],
  ['Nhà văn hoá Thiếu nhi', ['nhà', 'thiếu']], ['Bệnh viện Nhi Trung ương', ['bệnh', 'nhi', 'trung']],
];
const capOrg: T4 = (r, c, l) => {
  const [name, caps] = r.pick(ORGS);
  const words = name.toLocaleLowerCase('vi').split(' ');
  return Q.mc(`Tên tổ chức sau viết chưa đúng: "${words.join(' ')}". Chọn tất cả các chữ cần viết hoa.`, [...new Set(words)], caps,
    M('V4.CT.01', 'TV.VIETHOA', 'ten_co_quan', l, `Viết đúng: ${name}. Viết hoa chữ cái đầu của mỗi bộ phận tạo thành tên.`));
};
const DICT = ['ánh sáng', 'bàn tay', 'cánh đồng', 'dòng sông', 'em bé', 'gió mùa', 'hoa hồng', 'khu vườn', 'lá cây', 'mặt trời', 'nụ cười', 'ông bà', 'quê hương', 'sân trường', 'thư viện', 'ước mơ', 'vầng trăng'];
const dictOrder: T4 = (r, c, l) => {
  const ws = r.sample(DICT, 4);
  const order = [...ws].sort((a, b) => DICT.indexOf(a) - DICT.indexOf(b));
  return Q.ord('Sắp xếp các từ theo thứ tự xuất hiện trong từ điển (theo bảng chữ cái).', order, M('V4.CT.02', 'TV.CHUCAI', 'thu_tu_tu_dien', l, `Xét chữ cái đầu theo bảng chữ cái: ${order.join(', ')}.`));
};
const dictUse: T4 = (r, c, l) => {
  const items: [string, string][] = [['Muốn tìm nghĩa của từ "kiên trì" trong từ điển, em tìm ở phần chữ cái nào?', 'K'], ['Muốn tìm từ "ước mơ" trong từ điển, em tìm ở phần chữ cái nào?', 'Ư'], ['Muốn tìm từ "giản dị", em tìm ở phần chữ cái nào?', 'G']];
  const [q, a] = r.pick(items);
  const opts = [...new Set([a, ...r.sample(['A', 'B', 'D', 'G', 'K', 'U', 'Ư', 'T'].filter((x) => x !== a), 2)])];
  return Q.sc(q, r.shuffle(opts), a, M('V4.CT.02', 'TV.CHUCAI', 'dung_tu_dien', l, `Từ điển xếp theo chữ cái đầu: tìm ở phần chữ ${a}.`));
};

// ------------------------------------------------------------------------------------------- LỰA CHỌN TỪ NGỮ, MỞ RỘNG VỐN TỪ
const CHOICE: [string, string, string[]][] = [
  ['Những tia nắng … chiếu xuống mặt hồ.', 'lấp lánh', ['lầm lì', 'lom khom']],
  ['Bé ngủ … trong vòng tay mẹ.', 'ngon lành', ['ầm ĩ', 'vội vã']],
  ['Chú bộ đội … canh giữ biên giới.', 'ngày đêm', ['thỉnh thoảng', 'hiếm khi']],
  ['Cánh đồng lúa chín vàng …', 'óng ả', ['xám xịt', 'đen kịt']],
  ['Bạn Hoa … giúp đỡ các bạn trong lớp.', 'luôn', ['chẳng bao giờ', 'không']],
  ['Tiếng suối chảy … giữa rừng.', 'róc rách', ['ầm ầm', 'chói tai']],
];
const wordChoice: T4 = (r, c, l) => {
  const [s, a, wrong] = r.pick(CHOICE);
  return Q.sc(`Chọn từ ngữ phù hợp nhất điền vào chỗ trống: "${s}"`, r.shuffle([a, ...wrong]), a, M('V4.TU.05', 'TV.NGHIATU', 'lua_chon_tu', l, `"${s.replace('…', a)}" — từ "${a}" hợp nghĩa và gợi tả nhất.`));
};
const SYN4: string[][] = [['đất nước', 'Tổ quốc', 'giang sơn'], ['dũng cảm', 'gan dạ', 'can đảm'], ['chăm chỉ', 'siêng năng', 'cần cù'], ['hoà bình', 'bình yên', 'thanh bình'], ['nhân hậu', 'nhân từ', 'tốt bụng'], ['ước mơ', 'mơ ước', 'ước vọng']];
const synGroup4: T4 = (r, c, l) => {
  const g = r.pick(SYN4);
  const wrong = r.sample(SYN4.filter((x) => x !== g).flat(), 2);
  return Q.mc(`Chọn tất cả từ cùng nghĩa với "${g[0]}".`, r.shuffle([...g.slice(1), ...wrong]), g.slice(1), M('V4.TU.05', 'TV.NGHIATU', 'cung_nghia', l, `Từ cùng nghĩa với "${g[0]}": ${g.slice(1).join(', ')}.`));
};
const THEME4: Record<TV4Theme, { name: string; words: string[] }> = {
  moinguoi: { name: 'tính cách, đặc điểm con người', words: ['tự tin', 'hoà đồng', 'tốt bụng', 'trung thực', 'khiêm tốn', 'năng nổ'] },
  trainghiem: { name: 'trải nghiệm, khám phá', words: ['khám phá', 'phát minh', 'thí nghiệm', 'tìm tòi', 'quan sát', 'thám hiểm'] },
  sangtao: { name: 'sáng tạo', words: ['sáng tạo', 'nghệ sĩ', 'hội hoạ', 'âm nhạc', 'phát minh', 'tưởng tượng'] },
  uocmo: { name: 'ước mơ', words: ['ước mơ', 'hoài bão', 'khát vọng', 'mong ước', 'tương lai', 'lí tưởng'] },
  yeuthuong: { name: 'yêu thương, sẻ chia', words: ['yêu thương', 'sẻ chia', 'nhân ái', 'quan tâm', 'giúp đỡ', 'đùm bọc'] },
  nguon: { name: 'truyền thống, uống nước nhớ nguồn', words: ['truyền thống', 'biết ơn', 'tổ tiên', 'anh hùng', 'lịch sử', 'tưởng nhớ'] },
  quehuong: { name: 'quê hương', words: ['luỹ tre', 'cây đa', 'bến nước', 'sân đình', 'đồng lúa', 'con đò'] },
  binhyen: { name: 'hoà bình, bảo vệ thiên nhiên', words: ['hoà bình', 'bảo tồn', 'môi trường', 'động vật hoang dã', 'trái đất xanh', 'hữu nghị'] },
};
const OTHER4 = ['bàn ghế', 'chạy nhảy', 'quả cam', 'đôi giày', 'xe máy', 'nồi cơm'];
const themeGroup4: T4 = (r, c, l) => {
  const t = THEME4[c.theme];
  const right = r.sample(t.words, 3);
  return Q.mc(`Chọn tất cả từ ngữ về ${t.name}.`, r.shuffle([...right, ...r.sample(OTHER4, 2)]), right, M('V4.TU.04', 'TV.TUNGU', 'mo_rong_von_tu', l, `Từ ngữ về ${t.name}: ${right.join(', ')}.`));
};
const themeOdd4: T4 = (r, c, l) => {
  const t = THEME4[c.theme];
  const same = r.sample(t.words, 3), odd = r.pick(OTHER4);
  return Q.sc('Từ nào không cùng nhóm với các từ còn lại?', r.shuffle([...same, odd]), odd, M('V4.TU.04', 'TV.TUNGU', 'tu_khac_nhom', l, `${same.join(', ')} là từ ngữ về ${t.name}; "${odd}" thì không.`));
};
const ENDS: [string, string][] = [['Ôi, bức tranh đẹp quá', '!'], ['Bạn đã đọc cuốn sách này chưa', '?'], ['Hôm nay lớp em đi tham quan bảo tàng', '.'], ['Hãy giữ gìn vệ sinh chung', '!'], ['Vì sao bầu trời có màu xanh', '?']];
const endMark: T4 = (r, c, l) => {
  const [s, p] = r.pick(ENDS);
  return Q.sc(`Chọn dấu câu đặt cuối câu: "${s} …"`, ['.', '?', '!'], p, M('V4.CAU.03', 'TV.DAUCAU', 'dau_ket_thuc', l, p === '?' ? 'Câu hỏi: dấu chấm hỏi.' : p === '!' ? 'Câu cảm, câu khiến: dấu chấm than.' : 'Câu kể: dấu chấm.'));
};

// ------------------------------------------------------------------------------------------- GOM THEO TRỌNG TÂM
type LvMap = Partial<Record<Level, T4[]>>;
const F: Partial<Record<TV4Focus, LvMap>> = {
  danhtu: { 1: [posPick], 2: [posGroup], 3: [posInSentence], 4: [posMatch] },
  dtrieng: { 2: [properPick], 3: [properMatch], 4: [properPick] },
  dongtu: { 1: [posPick], 2: [posGroup], 3: [posInSentence], 4: [posMatch] },
  tinhtu: { 1: [posPick], 2: [posGroup], 3: [posInSentence], 4: [posMatch] },
  tuloai: { 1: [posPick], 2: [posGroup], 3: [posInSentence], 4: [posMatch], 5: [posInSentence] },
  nhanhoa: { 2: [nhPick], 3: [nhWhat], 4: [nhHow], 5: [nhHow] },
  tudien: { 2: [dictUse], 3: [dictOrder], 4: [dictOrder] },
  coquan: { 3: [capOrg], 4: [capOrg], 5: [capOrg] },
  gachngang: { 2: [markPick], 3: [markPick], 4: [markUse], 5: [markUse] },
  ngoackep: { 2: [markPick], 3: [markPick], 4: [markUse], 5: [markUse] },
  ngoacdon: { 2: [markPick], 3: [markPick], 4: [markUse], 5: [markUse] },
  daucau: { 1: [endMark], 2: [markPick], 4: [markUse] },
  cau: { 1: [sentWhole], 2: [sentWhole], 3: [cnPick] },
  chungu: { 2: [cnPick], 3: [cnPick], 4: [cnvnMatch], 5: [cnvnMatch] },
  vingu: { 2: [vnPick], 3: [vnPick], 4: [cnvnMatch], 5: [cnvnMatch] },
  trangngu: { 2: [tnFind], 3: [tnType], 4: [tnMatch], 5: [tnMatch] },
  tn_tg: { 2: [tnFind], 3: [tnType], 4: [tnType] }, tn_nc: { 2: [tnFind], 3: [tnType], 4: [tnType] },
  tn_nn: { 2: [tnFind], 3: [tnType], 4: [tnMatch] }, tn_md: { 2: [tnFind], 3: [tnType], 4: [tnMatch] },
  tn_pt: { 2: [tnFind], 3: [tnType], 4: [tnMatch] },
  luachon: { 2: [wordChoice], 3: [wordChoice, synGroup4], 4: [wordChoice], 5: [synGroup4] },
};
const BASE: LvMap = { 1: [themeGroup4, posPick], 2: [themeGroup4, endMark], 3: [themeOdd4, posGroup], 4: [themeOdd4, wordChoice], 5: [synGroup4, wordChoice, posMatch] };

const retry = (t: T4): T4 => (r, c, l) => {
  for (let i = 0; i < 10; i++) {
    const q = t(r, c, l);
    if (q) return q;
  }
  return null;
};
const CACHE = new Map<T4, T4>();
const wrap = (t: T4) => CACHE.get(t) ?? (CACHE.set(t, retry(t)), CACHE.get(t)!);

export function tv4Pool(focus: TV4Focus[]): Record<Level, T4[]> {
  const pool: Record<Level, T4[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const add = (m: LvMap | undefined) => {
    for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const t of m?.[lv] ?? []) if (!pool[lv].includes(wrap(t))) pool[lv].push(wrap(t));
  };
  for (const f of focus) add(F[f]);
  add(BASE);
  return pool;
}

/** Dạng câu theo trọng tâm (không kèm nhóm dạng chung) — Tiếng Việt 5 dùng lại cho phần ôn từ loại, từ điển, dấu câu */
export function tv4FocusPool(focus: TV4Focus[]): Record<Level, T4[]> {
  const pool: Record<Level, T4[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const f of focus) for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const t of F[f]?.[lv] ?? []) if (!pool[lv].includes(wrap(t))) pool[lv].push(wrap(t));
  return pool;
}
