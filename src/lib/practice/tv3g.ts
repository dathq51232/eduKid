// BỘ SINH CÂU — TIẾNG VIỆT 3 (luyện từ và câu, chính tả) theo từng tuần của sách Tiếng Việt 3 (Kết nối tri thức).
// Kho từ, câu mẫu do EduChain Kids tự viết; chỉ bám TÊN nội dung luyện tập trong mục lục sách (vd. "Biện pháp so sánh",
// "Đặt và trả lời câu hỏi Ở đâu?", "Dấu ngoặc kép, dấu gạch ngang", "Phân biệt ch/tr, ăn/ăng").
// Dùng lại các dạng chung của lớp 2 (từ loại, chính tả, dấu câu, từ trái nghĩa…) với mã yêu cầu cần đạt lớp 3 (V3.*).

import type { Level } from '../content/types';
import { Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { TV2G, type TVCtx, type TVFocus, type TVTemplate } from './tv2g';

export type TV3Focus = TVFocus | 'kieucau4' | 'haicham' | 'gachngang' | 'ngoackep' | 'sosanh' | 'trainghia' | 'giongnghia'
  | 'khinao' | 'odau' | 'banggi' | 'delamgi' | 'nuocngoai';
export type TV3Theme = 'muahe' | 'truong' | 'thuvien' | 'nguoithan' | 'dovat' | 'congdong' | 'nghenghiep' | 'thanhthi' | 'tunhien'
  | 'nuirung' | 'giaotiep' | 'datnuoc' | 'lehoi' | 'traidat';
export type TV3Ctx = { week: number; focus: TV3Focus[]; spell: string[]; theme: TV3Theme };
type T3 = (r: Rng, c: TV3Ctx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });

/** Dạng lớp 2 → mã V3 (cùng hậu tố), ngữ cảnh lớp 3 → ngữ cảnh lớp 2 (chỉ các trọng tâm lớp 2 hiểu được) */
const V2_FOCUS: TVFocus[] = ['suvat', 'hoatdong', 'dacdiem', 'gioithieu', 'neuhd', 'neudd', 'daucau', 'dauphay', 'chucai', 'viethoa', 'diali'];
const from2 = (t: TVTemplate): T3 => (r, c, l) => {
  const ctx: TVCtx = { week: c.week, focus: c.focus.filter((f): f is TVFocus => V2_FOCUS.includes(f as TVFocus)), spell: c.spell, theme: 'thiennhien' };
  const q = t(r, ctx, l);
  if (!q) return null;
  return { ...q, outcome: q.outcome.replace(/^V2\./, 'V3.') };
};

// ------------------------------------------------------------------------------------------- MỞ RỘNG VỐN TỪ
const THEME3: Record<TV3Theme, { name: string; words: string[] }> = {
  muahe: { name: 'mùa hè', words: ['nắng vàng', 'hoa phượng', 'tiếng ve', 'đi biển', 'nghỉ hè', 'thả diều', 'oi bức'] },
  truong: { name: 'nhà trường', words: ['lớp học', 'thầy cô', 'bạn bè', 'sân trường', 'giờ ra chơi', 'bảng đen', 'lễ khai giảng'] },
  thuvien: { name: 'thư viện', words: ['thủ thư', 'giá sách', 'mượn sách', 'trả sách', 'phiếu mượn', 'truyện tranh', 'đọc sách'] },
  nguoithan: { name: 'người thân', words: ['ông bà', 'cha mẹ', 'anh chị', 'cô chú', 'cháu', 'yêu thương', 'quan tâm'] },
  dovat: { name: 'đồ vật trong nhà', words: ['cái bàn', 'cái tủ', 'đồng hồ', 'cái quạt', 'chiếc gối', 'cái chổi', 'bình hoa'] },
  congdong: { name: 'cộng đồng', words: ['hàng xóm', 'làng xóm', 'giúp đỡ', 'đoàn kết', 'chia sẻ', 'sẻ chia', 'gắn bó'] },
  nghenghiep: { name: 'nghề nghiệp', words: ['bác sĩ', 'giáo viên', 'nông dân', 'thợ may', 'kĩ sư', 'phi công', 'đầu bếp'] },
  thanhthi: { name: 'thành thị và nông thôn', words: ['phố phường', 'nhà cao tầng', 'đèn đường', 'cánh đồng', 'luỹ tre', 'đường làng', 'con đò'] },
  tunhien: { name: 'các hiện tượng tự nhiên', words: ['mưa', 'gió', 'sấm', 'chớp', 'cầu vồng', 'sương mù', 'nắng'] },
  nuirung: { name: 'núi rừng', words: ['đồi núi', 'thác nước', 'suối', 'rừng cây', 'vách đá', 'đỉnh núi', 'con voi'] },
  giaotiep: { name: 'giao tiếp', words: ['chào hỏi', 'cảm ơn', 'xin lỗi', 'lắng nghe', 'gọi điện', 'nhắn tin', 'trò chuyện'] },
  datnuoc: { name: 'đất nước', words: ['quê hương', 'Tổ quốc', 'non sông', 'đất nước', 'giang sơn', 'biển đảo', 'núi sông'] },
  lehoi: { name: 'lễ hội', words: ['rước kiệu', 'đánh trống', 'múa lân', 'kéo co', 'đua thuyền', 'thả đèn', 'hát quan họ'] },
  traidat: { name: 'Trái Đất', words: ['bầu trời', 'đại dương', 'cây xanh', 'không khí', 'môi trường', 'muôn loài', 'trồng cây'] },
};
const OTHER3 = ['bút chì', 'chạy nhảy', 'xinh xắn', 'cái kéo', 'ăn cơm', 'quả cam', 'đôi giày', 'ngủ trưa'];
const themeGroup3: T3 = (r, c, l) => {
  const t = THEME3[c.theme];
  const right = r.sample(t.words, 3);
  const wrong = r.sample(OTHER3.filter((w) => !t.words.includes(w)), 2);
  return Q.mc(`Chọn tất cả từ ngữ về ${t.name}.`, r.shuffle([...right, ...wrong]), right, M('V3.TU.04', 'TV.TUNGU', 'mo_rong_von_tu', l, `Từ ngữ về ${t.name}: ${right.join(', ')}.`));
};
const themeOdd3: T3 = (r, c, l) => {
  const t = THEME3[c.theme];
  const same = r.sample(t.words, 3);
  const odd = r.pick(OTHER3.filter((w) => !t.words.includes(w)));
  return Q.sc('Từ nào KHÔNG cùng nhóm với các từ còn lại?', r.shuffle([...same, odd]), odd, M('V3.TU.04', 'TV.TUNGU', 'tu_khac_nhom', l, `${same.join(', ')} đều là từ ngữ về ${t.name}; "${odd}" thì không.`));
};

// ------------------------------------------------------------------------------------------- KIỂU CÂU (kể, hỏi, cảm, khiến)
type Kind4 = 'ke' | 'hoi' | 'cam' | 'khien';
const SENT4: Record<Kind4, string[]> = {
  ke: ['Sáng nay, lớp em trồng cây ở vườn trường.', 'Bà em thường kể chuyện cổ tích.', 'Con mèo nằm sưởi nắng bên hiên.', 'Thư viện trường em có rất nhiều sách.', 'Chiều qua, trời đổ mưa to.'],
  hoi: ['Bạn đã làm xong bài tập chưa?', 'Vì sao lá cây có màu xanh?', 'Khi nào lớp mình đi tham quan?', 'Bạn thích đọc truyện gì nhất?', 'Ai đã tưới cây sáng nay?'],
  cam: ['Ôi, bông hoa này đẹp quá!', 'Chao ôi, biển rộng mênh mông!', 'Trời ơi, con diều bay cao quá!', 'A, mẹ đã về!', 'Bức tranh của bạn thật là đẹp!'],
  khien: ['Các em hãy giữ trật tự!', 'Con nhớ đội mũ khi ra nắng nhé!', 'Bạn đừng vẽ lên sách nhé!', 'Cả lớp hãy mở sách trang 12.', 'Hãy tắt điện khi ra khỏi phòng!'],
};
const K4_NAME: Record<Kind4, string> = { ke: 'câu kể', hoi: 'câu hỏi', cam: 'câu cảm', khien: 'câu khiến' };
const K4_WHY: Record<Kind4, string> = {
  ke: 'Câu kể dùng để kể, tả, giới thiệu; cuối câu thường có dấu chấm.',
  hoi: 'Câu hỏi dùng để hỏi; cuối câu có dấu chấm hỏi.',
  cam: 'Câu cảm bộc lộ cảm xúc (ôi, chao ôi, quá, thật là…); cuối câu thường có dấu chấm than.',
  khien: 'Câu khiến dùng để yêu cầu, đề nghị, khuyên bảo (hãy, đừng, nhé…).',
};
const kinds4 = (c: TV3Ctx): Kind4[] => {
  const out: Kind4[] = [];
  if (c.focus.includes('kieucau4')) out.push('ke', 'hoi', 'cam', 'khien');
  return out.length ? out : ['ke', 'hoi', 'cam', 'khien'];
};
const sentKind4: T3 = (r, c, l) => {
  const k = r.pick(kinds4(c));
  const s = r.pick(SENT4[k]);
  return Q.sc(`Câu "${s}" là kiểu câu nào?`, ['câu kể', 'câu hỏi', 'câu cảm', 'câu khiến'], K4_NAME[k], M('V3.CAU.05', 'TV.KIEUCAU', 'kieu_cau_4', l, K4_WHY[k]));
};
const pickSentKind4: T3 = (r, c, l) => {
  const k = r.pick(kinds4(c));
  const right = r.pick(SENT4[k]);
  const others = (Object.keys(SENT4) as Kind4[]).filter((x) => x !== k).map((x) => r.pick(SENT4[x]));
  return Q.sc(`Câu nào là ${K4_NAME[k]}?`, r.shuffle([right, ...others]), right, M('V3.CAU.05', 'TV.KIEUCAU', 'chon_kieu_cau_4', l, `${K4_WHY[k]} Câu đúng: "${right}"`));
};
const groupSentKind4: T3 = (r, c, l) => {
  const k = r.pick(['cam', 'khien'] as Kind4[]);
  const right = r.sample(SENT4[k], 2);
  const wrong = r.sample((Object.keys(SENT4) as Kind4[]).filter((x) => x !== k).flatMap((x) => SENT4[x]), 2);
  return Q.mc(`Chọn tất cả ${K4_NAME[k]}.`, r.shuffle([...right, ...wrong]), right, M('V3.CAU.05', 'TV.KIEUCAU', 'nhom_kieu_cau', l, `${K4_WHY[k]} Đó là: ${right.map((x) => `"${x}"`).join(', ')}.`));
};
const matchSentKind4: T3 = (r, c, l) => {
  const ks = r.sample(['ke', 'hoi', 'cam', 'khien'] as Kind4[], 3);
  const pairs: [string, string][] = ks.map((k) => [r.pick(SENT4[k]), K4_NAME[k]]);
  return Q.mt('Nối mỗi câu với kiểu câu của nó.', pairs, M('V3.CAU.05', 'TV.KIEUCAU', 'noi_kieu_cau', l, pairs.map(([s, n]) => `"${s}": ${n}`).join('; ')));
};

// ------------------------------------------------------------------------------------------- DẤU CÂU (hai chấm, gạch ngang, ngoặc kép)
type Mark = 'haicham' | 'gachngang' | 'ngoackep';
const MARKS: Record<Mark, [string, string, string][]> = {
  haicham: [
    ['Trong vườn có nhiều loài hoa[ ] hoa hồng, hoa cúc, hoa mai.', 'dấu hai chấm', 'Dấu hai chấm báo hiệu phần liệt kê phía sau.'],
    ['Mẹ dặn em[ ] "Con nhớ học bài nhé!"', 'dấu hai chấm', 'Dấu hai chấm báo hiệu lời nói của nhân vật.'],
    ['Cặp sách của em có[ ] sách, vở, bút, thước.', 'dấu hai chấm', 'Dấu hai chấm báo hiệu phần liệt kê.'],
    ['Bạn Nam hỏi[ ] "Cậu đi đâu đấy?"', 'dấu hai chấm', 'Dấu hai chấm báo hiệu lời nói trực tiếp.'],
  ],
  gachngang: [
    ['Cô giáo hỏi:\n[ ] Ai trực nhật hôm nay?', 'dấu gạch ngang', 'Dấu gạch ngang đặt đầu dòng để đánh dấu lời nói của nhân vật trong đối thoại.'],
    ['Lan đáp:\n[ ] Thưa cô, em ạ!', 'dấu gạch ngang', 'Dấu gạch ngang đánh dấu lời đối thoại.'],
    ['Mấy việc cần làm:\n[ ] Quét nhà.\n[ ] Tưới cây.', 'dấu gạch ngang', 'Dấu gạch ngang đánh dấu các ý được liệt kê.'],
  ],
  ngoackep: [
    ['Bố bảo: [ ]Con hãy giúp mẹ dọn nhà nhé![ ]', 'dấu ngoặc kép', 'Dấu ngoặc kép đánh dấu lời nói trực tiếp của nhân vật.'],
    ['Em rất thích bài hát [ ]Em yêu trường em[ ].', 'dấu ngoặc kép', 'Dấu ngoặc kép đánh dấu tên bài hát, tên tác phẩm.'],
    ['Bạn Minh được các bạn gọi là [ ]nhà thông thái[ ] của lớp.', 'dấu ngoặc kép', 'Dấu ngoặc kép đánh dấu từ ngữ được dùng với nghĩa đặc biệt.'],
    ['Cuốn truyện [ ]Dế Mèn phiêu lưu kí[ ] rất hay.', 'dấu ngoặc kép', 'Dấu ngoặc kép đánh dấu tên sách, tên truyện.'],
  ],
};
const marksOf = (c: TV3Ctx): Mark[] => {
  const m = (['haicham', 'gachngang', 'ngoackep'] as Mark[]).filter((x) => c.focus.includes(x));
  return m.length ? m : ['haicham', 'gachngang', 'ngoackep'];
};
const markPick: T3 = (r, c, l) => {
  const mk = r.pick(marksOf(c));
  const [s, ans, why] = r.pick(MARKS[mk]);
  return Q.sc(`Dấu câu nào thích hợp đặt vào chỗ [ ]?\n${s}`, ['dấu hai chấm', 'dấu gạch ngang', 'dấu ngoặc kép'], ans, M('V3.CAU.06', 'TV.DAUCAU', 'dau_cau_3', l, why));
};
const markUse: T3 = (r, c, l) => {
  const items: [string, string][] = [['báo hiệu phần liệt kê hoặc lời nói phía sau', 'dấu hai chấm'], ['đánh dấu lời nói của nhân vật khi đối thoại (đặt đầu dòng)', 'dấu gạch ngang'], ['đánh dấu tên bài hát, tên truyện hoặc lời nói trực tiếp', 'dấu ngoặc kép']];
  const pairs = r.shuffle(items).map(([u, m]) => [m, u] as [string, string]);
  return Q.mt('Nối mỗi dấu câu với tác dụng của nó.', pairs, M('V3.CAU.06', 'TV.DAUCAU', 'tac_dung_dau', l, pairs.map(([m, u]) => `${m}: ${u}`).join('; ') + '.'));
};

// ------------------------------------------------------------------------------------------- SO SÁNH
const SOSANH: [string, string, string][] = [
  ['Mặt trăng tròn như cái đĩa bạc.', 'mặt trăng', 'cái đĩa bạc'], ['Tán bàng xoè ra như chiếc ô khổng lồ.', 'tán bàng', 'chiếc ô khổng lồ'],
  ['Những giọt sương long lanh như hạt ngọc.', 'những giọt sương', 'hạt ngọc'], ['Tiếng suối trong như tiếng hát xa.', 'tiếng suối', 'tiếng hát xa'],
  ['Mái tóc của bà bạc như mây.', 'mái tóc của bà', 'mây'], ['Đôi mắt em bé sáng như sao.', 'đôi mắt em bé', 'sao'],
  ['Cánh đồng lúa chín vàng như tấm thảm.', 'cánh đồng lúa chín', 'tấm thảm'], ['Ông mặt trời đỏ như quả cầu lửa.', 'ông mặt trời', 'quả cầu lửa'],
];
const NOT_SOSANH = ['Em đi học lúc sáu giờ sáng.', 'Bà em trồng một cây cam.', 'Chú mèo đang ngủ trên ghế.', 'Lớp em có ba mươi bạn.', 'Mẹ mua cho em chiếc cặp mới.'];
const sosanhPick: T3 = (r, c, l) => {
  const [s] = r.pick(SOSANH);
  return Q.sc('Câu nào có hình ảnh so sánh?', r.shuffle([s, ...r.sample(NOT_SOSANH, 2)]), s, M('V3.TU.06', 'TV.SOSANH', 'cau_so_sanh', l, `Câu "${s}" so sánh hai sự vật bằng từ "như".`));
};
const sosanhWhat: T3 = (r, c, l) => {
  const [s, a, b] = r.pick(SOSANH);
  const others = r.sample(SOSANH.filter((x) => x[2] !== b), 2).map((x) => x[2]);
  return Q.sc(`Trong câu "${s}", ${a} được so sánh với gì?`, r.shuffle([b, ...others]), b, M('V3.TU.06', 'TV.SOSANH', 'su_vat_so_sanh', l, `${a[0].toUpperCase() + a.slice(1)} được so sánh với ${b} (từ so sánh: "như").`));
};
const sosanhMatch: T3 = (r, c, l) => {
  const items = r.sample(SOSANH, 3);
  return Q.mt('Nối để tạo thành câu có hình ảnh so sánh.', items.map(([, a, b]) => [a[0].toUpperCase() + a.slice(1), `như ${b}`]),
    M('V3.TU.06', 'TV.SOSANH', 'noi_so_sanh', l, items.map(([s]) => s).join(' ')));
};

// ------------------------------------------------------------------------------------------- TỪ CÙNG NGHĨA / TRÁI NGHĨA (vốn từ lớp 3)
const SYN3: string[][] = [['chăm chỉ', 'siêng năng', 'cần cù'], ['to lớn', 'khổng lồ', 'vĩ đại'], ['xinh đẹp', 'xinh xắn', 'đẹp đẽ'], ['thông minh', 'sáng dạ', 'nhanh trí'], ['vui vẻ', 'vui tươi', 'hớn hở'], ['đất nước', 'Tổ quốc', 'non sông'], ['bé nhỏ', 'nhỏ bé', 'tí hon']];
const ANT3: [string, string][] = [['siêng năng', 'lười biếng'], ['dũng cảm', 'hèn nhát'], ['ồn ào', 'yên tĩnh'], ['sáng sủa', 'tối tăm'], ['trung thực', 'gian dối'], ['rộng rãi', 'chật hẹp'], ['giàu', 'nghèo'], ['đông đúc', 'vắng vẻ'], ['khen', 'chê'], ['xuất hiện', 'biến mất']];
const synPick: T3 = (r, c, l) => {
  const g = r.pick(SYN3);
  const [a, b] = r.sample(g, 2);
  const wrong = r.sample(ANT3.flat().filter((x) => !g.includes(x)), 2);
  return Q.sc(`Từ nào có nghĩa giống với từ "${a}"?`, r.shuffle([b, ...wrong]), b, M('V3.TU.05', 'TV.NGHIATU', 'giong_nghia', l, `"${a}" và "${b}" có nghĩa giống nhau.`));
};
const synGroup: T3 = (r, c, l) => {
  const g = r.pick(SYN3);
  const wrong = r.sample(SYN3.filter((x) => x !== g).flat(), 2);
  return Q.mc(`Chọn tất cả từ có nghĩa giống nhau trong nhóm "${g[0]}".`, r.shuffle([...g, ...wrong]), g, M('V3.TU.05', 'TV.NGHIATU', 'nhom_giong_nghia', l, `Các từ cùng nghĩa: ${g.join(', ')}.`));
};
const antPick: T3 = (r, c, l) => {
  const [a, b] = r.pick(ANT3);
  const wrong = r.sample(ANT3.filter((x) => x[0] !== a).map((x) => x[r.int(0, 1)]), 2);
  return Q.sc(`Từ nào có nghĩa trái ngược với "${a}"?`, r.shuffle([b, ...wrong]), b, M('V3.TU.05', 'TV.NGHIATU', 'trai_nghia', l, `"${a}" trái nghĩa với "${b}".`));
};
const antMatch: T3 = (r, c, l) => {
  const ps = r.sample(ANT3, 3);
  return Q.mt('Nối mỗi từ với từ có nghĩa trái ngược.', ps, M('V3.TU.05', 'TV.NGHIATU', 'noi_trai_nghia', l, ps.map(([a, b]) => `${a} – ${b}`).join('; ') + '.'));
};

// ------------------------------------------------------------------------------------------- TRẢ LỜI CÂU HỎI Khi nào? Ở đâu? Bằng gì? Để làm gì?
type Ask = 'khinao' | 'odau' | 'banggi' | 'delamgi';
const ASK_Q: Record<Ask, string> = { khinao: 'Khi nào?', odau: 'Ở đâu?', banggi: 'Bằng gì?', delamgi: 'Để làm gì?' };
const PARTS: Record<Ask, [string, string][]> = {
  khinao: [['Sáng sớm, ông em tập thể dục ngoài sân.', 'Sáng sớm'], ['Mùa thu, lá bàng chuyển sang màu đỏ.', 'Mùa thu'], ['Tối qua, cả nhà em xem phim hoạt hình.', 'Tối qua'], ['Chúng em đi tham quan vào cuối tuần.', 'vào cuối tuần']],
  odau: [['Đàn chim hót líu lo trên cành cây.', 'trên cành cây'], ['Các bạn chơi đá cầu ở sân trường.', 'ở sân trường'], ['Bà em trồng rau trong vườn.', 'trong vườn'], ['Ngoài cánh đồng, bác nông dân đang gặt lúa.', 'Ngoài cánh đồng']],
  banggi: [['Em vẽ bức tranh bằng bút màu.', 'bằng bút màu'], ['Ngôi nhà được làm bằng gỗ.', 'bằng gỗ'], ['Bố đi làm bằng xe máy.', 'bằng xe máy'], ['Chiếc rổ được đan bằng tre.', 'bằng tre']],
  delamgi: [['Em tiết kiệm tiền để mua sách.', 'để mua sách'], ['Chúng em trồng cây để bảo vệ môi trường.', 'để bảo vệ môi trường'], ['Mẹ dậy sớm để nấu bữa sáng.', 'để nấu bữa sáng'], ['Lớp em quyên góp sách để tặng các bạn vùng cao.', 'để tặng các bạn vùng cao']],
};
const asksOf = (c: TV3Ctx): Ask[] => {
  const a = (['khinao', 'odau', 'banggi', 'delamgi'] as Ask[]).filter((x) => c.focus.includes(x));
  return a.length ? a : ['khinao', 'odau'];
};
const askPart: T3 = (r, c, l) => {
  const a = r.pick(asksOf(c));
  const [s, part] = r.pick(PARTS[a]);
  const opts = r.shuffle([...new Set([ASK_Q[a], ...r.sample(Object.values(ASK_Q).filter((x) => x !== ASK_Q[a]), 2)])]);
  return Q.sc(`Trong câu "${s}", bộ phận "${part}" trả lời cho câu hỏi nào?`, opts, ASK_Q[a], M('V3.CAU.07', 'TV.CAUHOI', 'tra_loi_cau_hoi', l, `"${part}" cho biết ${a === 'khinao' ? 'thời gian' : a === 'odau' ? 'nơi chốn' : a === 'banggi' ? 'phương tiện, chất liệu' : 'mục đích'}: trả lời câu hỏi "${ASK_Q[a]}".`));
};
const askFind: T3 = (r, c, l) => {
  const a = r.pick(asksOf(c));
  const [s, part] = r.pick(PARTS[a]);
  const words = s.replace(/[.,]/g, '').split(' ');
  const decoys = [words.slice(0, 2).join(' '), words.slice(-2).join(' ')].filter((x) => x.toLowerCase() !== part.toLowerCase() && !part.toLowerCase().includes(x.toLowerCase()));
  const opts = [...new Set([part, ...decoys, r.pick(PARTS[r.pick((['khinao', 'odau', 'banggi', 'delamgi'] as Ask[]).filter((x) => x !== a))])[1]])].slice(0, 3);
  if (opts.length < 3) return null;
  return Q.sc(`Bộ phận nào trong câu "${s}" trả lời cho câu hỏi "${ASK_Q[a]}"?`, r.shuffle(opts), part, M('V3.CAU.07', 'TV.CAUHOI', 'tim_bo_phan', l, `Bộ phận trả lời câu hỏi "${ASK_Q[a]}" là "${part}".`));
};

// ------------------------------------------------------------------------------------------- TÊN RIÊNG NƯỚC NGOÀI
const FOREIGN: [string, string[]][] = [
  ['Ê-đi-xơn', ['Ê đi xơn', 'Êđixơn']], ['Lu-i Pa-xtơ', ['Lu i Pa xtơ', 'Lui Paxtơ']], ['Mát-xcơ-va', ['Mát xcơ va', 'Mátxcơva']],
  ['Pa-ri', ['Pa ri', 'Pari ']], ['Ô-lim-pích', ['Ô lim pích', 'Ôlimpích']], ['Lép Tôn-xtôi', ['Lép Tôn xtôi', 'Lép Tônxtôi ']],
  ['An-đéc-xen', ['An đéc xen', 'Anđécxen']], ['Y-éc-xanh', ['Y éc xanh', 'Yécxanh']],
];
const foreignName: T3 = (r, c, l) => {
  const [right, wrong] = r.pick(FOREIGN);
  return Q.sc('Tên riêng nước ngoài nào viết đúng?', r.shuffle([right, ...wrong.map((w) => w.trim())]), right,
    M('V3.CT.04', 'TV.VIETHOA', 'ten_nuoc_ngoai', l, `Tên riêng nước ngoài phiên âm: viết hoa chữ cái đầu mỗi bộ phận, các tiếng trong một bộ phận nối với nhau bằng gạch nối: ${right}.`));
};

// ------------------------------------------------------------------------------------------- GOM THEO TRỌNG TÂM
const W = TV2G;
type LvMap = Partial<Record<Level, T3[]>>;
const F: Partial<Record<TV3Focus, LvMap>> = {
  suvat: { 1: [from2(W.wordKindPick)], 2: [from2(W.wordKindGroup)], 3: [from2(W.kindMatch)] },
  hoatdong: { 1: [from2(W.wordKindPick)], 2: [from2(W.wordKindGroup)], 3: [from2(W.kindMatch)] },
  dacdiem: { 1: [from2(W.wordKindPick)], 2: [from2(W.wordKindGroup)], 3: [from2(W.kindMatch)] },
  gioithieu: { 2: [from2(W.sentType)], 3: [from2(W.pickSentType)], 4: [from2(W.orderWords)] },
  neuhd: { 2: [from2(W.sentType)], 3: [from2(W.pickSentType)], 4: [from2(W.orderWords)] },
  neudd: { 2: [from2(W.sentType)], 3: [from2(W.pickSentType)], 4: [from2(W.orderWords)] },
  daucau: { 1: [from2(W.endPunct)], 4: [from2(W.commaPick)] },
  dauphay: { 3: [from2(W.commaPick)] },
  viethoa: { 4: [from2(W.capName)] },
  diali: { 4: [from2(W.capName)] },
  kieucau4: { 1: [sentKind4], 2: [pickSentKind4], 3: [groupSentKind4], 4: [matchSentKind4] },
  haicham: { 2: [markPick], 3: [markPick], 5: [markUse] },
  gachngang: { 2: [markPick], 3: [markPick], 5: [markUse] },
  ngoackep: { 2: [markPick], 3: [markPick], 5: [markUse] },
  sosanh: { 2: [sosanhPick], 3: [sosanhWhat], 4: [sosanhMatch] },
  trainghia: { 2: [antPick], 4: [antMatch], 5: [antMatch] },
  giongnghia: { 2: [synPick], 4: [synGroup], 5: [synGroup] },
  khinao: { 2: [askPart], 3: [askFind], 4: [askFind] },
  odau: { 2: [askPart], 3: [askFind], 4: [askFind] },
  banggi: { 2: [askPart], 3: [askFind], 4: [askFind] },
  delamgi: { 2: [askPart], 3: [askFind], 4: [askFind] },
  nuocngoai: { 3: [foreignName], 4: [foreignName] },
};
// luôn có: chính tả của tuần, mở rộng vốn từ theo chủ điểm, sắp xếp câu thành đoạn, từ trái nghĩa/cùng nghĩa (nâng cao)
const BASE: LvMap = {
  1: [from2(W.spellPick), themeGroup3],
  2: [from2(W.spellPick), themeGroup3],
  3: [from2(W.spellGroup), themeOdd3],
  4: [themeOdd3, antPick, sosanhWhat],
  5: [from2(W.orderPara), synGroup, antMatch, from2(W.antonymMatch)],
};

const retry = (t: T3): T3 => (r, c, l) => {
  for (let i = 0; i < 10; i++) {
    const q = t(r, c, l);
    if (q) return q;
  }
  return null;
};
const CACHE = new Map<T3, T3>();
const wrap = (t: T3) => CACHE.get(t) ?? (CACHE.set(t, retry(t)), CACHE.get(t)!);

export function tv3Pool(focus: TV3Focus[]): Record<Level, T3[]> {
  const pool: Record<Level, T3[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const add = (m: LvMap | undefined) => {
    for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const t of m?.[lv] ?? []) if (!pool[lv].includes(wrap(t))) pool[lv].push(wrap(t));
  };
  for (const f of focus) add(F[f]);
  add(BASE);
  return pool;
}
