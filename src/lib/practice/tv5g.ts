// BỘ SINH CÂU — TIẾNG VIỆT 5 (luyện từ và câu) theo từng tuần của sách Tiếng Việt 5 (Kết nối tri thức).
// Kho từ, câu mẫu, đoạn thơ do EduChain Kids tự viết; chỉ bám TÊN nội dung luyện tập trong mục lục sách
// (vd. "Đại từ", "Từ đồng nghĩa", "Từ đa nghĩa", "Kết từ", "Câu đơn và câu ghép", "Liên kết câu bằng từ ngữ thay thế").
// Phần ôn danh từ – động từ – tính từ, từ điển, dấu gạch ngang dùng lại dạng câu của lớp 4 (practice/tv4g.ts).

import type { Level } from '../content/types';
import { Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { tv4FocusPool, type TV4Focus } from './tv4g';

export type TV5Focus = 'tuloai' | 'daitu' | 'dongnghia' | 'danghia' | 'tudien' | 'gachngang' | 'diepngu' | 'kettu'
  | 'caughep' | 'noicaughep' | 'lk_lap' | 'lk_noi' | 'lk_thay' | 'lienket' | 'viethoa' | 'tennn' | 'daucau';
export type TV5Theme = 'tuoitho' | 'thiennhien' | 'hoctap' | 'nghethuat' | 'cuocsong' | 'tramien' | 'chaong' | 'thegioi';
export type TV5Ctx = { week: number; focus: TV5Focus[]; theme: TV5Theme };
type T5 = (r: Rng, c: TV5Ctx, l: Level) => PracticeQuestion | null;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });

// ------------------------------------------------------------------------------------------- ĐẠI TỪ
const DT_XH = ['tôi', 'chúng tôi', 'chúng ta', 'tớ', 'cậu', 'bạn', 'nó', 'họ', 'chúng mình', 'mình'];
const DT_NV = ['ai', 'gì', 'đâu', 'nào', 'bao nhiêu', 'mấy'];
const DT_TT = ['vậy', 'thế', 'đó', 'này', 'ấy'];
const NOT_DT = ['quyển sách', 'chạy nhảy', 'xinh đẹp', 'dòng sông', 'học tập', 'chăm chỉ', 'ngôi nhà', 'cây bút'];
// [câu, đại từ trong câu, loại]
const DT_SENT: [string, string, 'xưng hô' | 'nghi vấn' | 'thay thế'][] = [
  ['Chiều nay, chúng mình sẽ cùng nhau ra thư viện.', 'chúng mình', 'xưng hô'],
  ['Ai là người tưới cây trong lớp hôm nay?', 'Ai', 'nghi vấn'],
  ['Nam rất thích vẽ, em gái Nam cũng vậy.', 'vậy', 'thay thế'],
  ['Họ đang dựng lều ở bìa rừng.', 'Họ', 'xưng hô'],
  ['Cậu để quyển truyện ở đâu?', 'đâu', 'nghi vấn'],
  ['Lan học giỏi môn Toán, Hoa cũng thế.', 'thế', 'thay thế'],
  ['Con mèo nhà em lười lắm, suốt ngày nó chỉ nằm sưởi nắng.', 'nó', 'xưng hô'],
  ['Năm nay lớp mình trồng được bao nhiêu cây?', 'bao nhiêu', 'nghi vấn'],
  ['Tớ sẽ kể cho cậu nghe một câu chuyện thú vị.', 'Tớ', 'xưng hô'],
  ['Bạn thích mùa nào nhất trong năm?', 'nào', 'nghi vấn'],
];
const dtPick: T5 = (r, c, l) => {
  const kind = r.pick(['xưng hô', 'nghi vấn', 'thay thế'] as const);
  const right = r.pick(kind === 'xưng hô' ? DT_XH : kind === 'nghi vấn' ? DT_NV : DT_TT);
  const opts = r.shuffle([right, ...r.sample(NOT_DT, 3)]);
  return Q.sc(`Từ nào dưới đây là đại từ ${kind}?`, opts, right, M('V5.TU.01', 'TV.TULOAI', 'dai_tu_chon', l, `Đại từ ${kind}: ${kind === 'xưng hô' ? 'dùng để tự xưng hoặc gọi người khác' : kind === 'nghi vấn' ? 'dùng để hỏi' : 'dùng để thay thế cho từ ngữ đã nói trước đó'}. "${right}" là đại từ ${kind}.`));
};
const dtFind: T5 = (r, c, l) => {
  const [s, w] = r.pick(DT_SENT);
  const DT_ALL = new Set([...DT_XH, ...DT_NV, ...DT_TT, 'em', 'cậu', 'mình', 'chúng', 'ta'].map((x) => x.toLowerCase()));
  const words = s.replace(/[.,?!]/g, '').split(' ').filter((x) => !DT_ALL.has(x.toLowerCase()) && !w.toLowerCase().split(' ').includes(x.toLowerCase()) && x.length > 1);
  const opts = r.shuffle([w, ...r.sample([...new Set(words)], 3)]);
  if (opts.length < 3) return null;
  return Q.sc(`Từ nào là đại từ trong câu sau?\n${s}`, opts, w, M('V5.TU.01', 'TV.TULOAI', 'dai_tu_tim', l, `"${w}" là đại từ trong câu.`));
};
const dtType: T5 = (r, c, l) => {
  const [s, w, kind] = r.pick(DT_SENT);
  return Q.sc(`Đại từ "${w}" trong câu sau thuộc loại nào?\n${s}`, ['đại từ xưng hô', 'đại từ nghi vấn', 'đại từ thay thế'], `đại từ ${kind}`,
    M('V5.TU.01', 'TV.TULOAI', 'dai_tu_loai', l, `"${w}" là đại từ ${kind}.`));
};
// [câu, đại từ thay thế, cụm từ được thay thế]
const DT_REPL: [string, string, string, string[]][] = [
  ['Bố em làm nghề trồng hoa. Ông nội em trước đây cũng vậy.', 'vậy', 'làm nghề trồng hoa', ['Bố em', 'Ông nội em', 'trước đây']],
  ['Minh tự giác dọn góc học tập. Việc đó khiến mẹ rất vui.', 'đó', 'tự giác dọn góc học tập', ['Minh', 'mẹ', 'rất vui']],
  ['Chị Hà hát rất hay. Bạn Mai cũng thế.', 'thế', 'hát rất hay', ['Chị Hà', 'Bạn Mai', 'cũng']],
  ['Cô giáo tặng em một cuốn sổ. Cuốn sổ ấy có bìa màu xanh.', 'ấy', 'một cuốn sổ (cô giáo tặng)', ['Cô giáo', 'bìa', 'màu xanh']],
];
const dtReplace: T5 = (r, c, l) => {
  const [s, w, target, wrong] = r.pick(DT_REPL);
  return Q.sc(`Trong đoạn sau, đại từ "${w}" thay thế cho từ ngữ nào?\n${s}`, r.shuffle([target, ...wrong]), target,
    M('V5.TU.01', 'TV.TULOAI', 'dai_tu_thay_the', l, `"${w}" thay thế cho "${target}", giúp tránh lặp từ.`));
};
const dtMc: T5 = (r, c, l) => {
  const sents: [string, string[], string[]][] = [
    ['Tớ hỏi cậu: "Ai đã giúp chúng mình tưới cây?"', ['Tớ', 'cậu', 'Ai', 'chúng mình'], ['hỏi', 'giúp', 'tưới cây']],
    ['Họ hỏi: "Nhà bạn ở đâu?"', ['Họ', 'bạn', 'đâu'], ['hỏi', 'Nhà']],
    ['Bạn có biết nó đi đâu không?', ['Bạn', 'nó', 'đâu'], ['biết', 'đi', 'không']],
  ];
  const [s, rights, wrongs] = r.pick(sents);
  return Q.mc(`Chọn tất cả các đại từ trong câu sau:\n${s}`, r.shuffle([...rights, ...wrongs]), rights,
    M('V5.TU.01', 'TV.TULOAI', 'dai_tu_nhieu', l, `Các đại từ: ${rights.join(', ')}.`));
};

// ------------------------------------------------------------------------------------------- TỪ ĐỒNG NGHĨA
const SYN: string[][] = [
  ['siêng năng', 'chăm chỉ', 'cần cù'], ['to lớn', 'khổng lồ', 'vĩ đại'], ['xinh đẹp', 'xinh xắn', 'đẹp đẽ'],
  ['nhanh nhẹn', 'nhanh nhảu', 'lanh lợi'], ['đất nước', 'tổ quốc', 'non sông'], ['dũng cảm', 'gan dạ', 'can đảm'],
  ['vui vẻ', 'vui tươi', 'phấn khởi'], ['im lặng', 'lặng im', 'yên lặng'], ['bao la', 'mênh mông', 'bát ngát'],
  ['chết', 'mất', 'qua đời'], ['ăn', 'xơi', 'dùng bữa'], ['trông', 'nhìn', 'ngắm'],
];
const synPick: T5 = (r, c, l) => {
  const g = r.pick(SYN);
  const [w, right] = r.sample(g, 2);
  const wrong = r.sample(SYN.filter((x) => x !== g).map((x) => r.pick(x)), 3);
  return Q.sc(`Từ nào đồng nghĩa với từ "${w}"?`, r.shuffle([right, ...wrong]), right, M('V5.TU.02', 'TV.NGHIATU', 'dong_nghia_chon', l, `"${w}" và "${right}" là từ đồng nghĩa (nghĩa giống hoặc gần giống nhau).`));
};
const synOdd: T5 = (r, c, l) => {
  const g = r.pick(SYN);
  const odd = r.pick(r.pick(SYN.filter((x) => x !== g)));
  return Q.sc(`Từ nào KHÔNG cùng nhóm với các từ còn lại?`, r.shuffle([...g, odd]), odd, M('V5.TU.02', 'TV.NGHIATU', 'dong_nghia_khac', l, `${g.join(', ')} là các từ đồng nghĩa; "${odd}" không cùng nghĩa.`));
};
// [câu có chỗ trống, đáp án, các từ đồng nghĩa nhưng không hợp]
const SYN_CTX: [string, string, string[]][] = [
  ['Ông mặt trời ___ đỏ rực sau rặng tre.', 'nhô lên', ['mọc ra', 'trồi lên']],
  ['Cánh đồng lúa chín vàng ___ đến tận chân trời.', 'trải dài', ['kéo dài', 'dài ra']],
  ['Bà nội em đã ___ được hai năm, cả nhà vẫn luôn nhớ bà.', 'qua đời', ['chết', 'mất đi']],
  ['Mời bác ___ bữa cơm cùng gia đình cháu ạ.', 'dùng', ['ăn', 'xơi xơi']],
  ['Chú bộ đội ___ canh giữ biển đảo quê hương.', 'kiên cường', ['cứng cỏi', 'cứng rắn']],
  ['Bé ___ chạy đến ôm chầm lấy mẹ.', 'tíu tít', ['líu ríu', 'ríu rít']],
];
const synContext: T5 = (r, c, l) => {
  const [s, right, wrong] = r.pick(SYN_CTX);
  return Q.sc(`Chọn từ thích hợp nhất điền vào chỗ trống:\n${s}`, r.shuffle([right, ...wrong]), right, M('V5.TU.02', 'TV.NGHIATU', 'dong_nghia_ngu_canh', l, `Các từ đồng nghĩa có sắc thái khác nhau; "${right}" hợp với câu nhất.`));
};
const synMatch: T5 = (r, c, l) => {
  const gs = r.sample(SYN, 3);
  return Q.mt('Nối mỗi từ với từ đồng nghĩa của nó.', gs.map((g) => [g[0], g[1]] as [string, string]), M('V5.TU.02', 'TV.NGHIATU', 'dong_nghia_noi', l, gs.map((g) => `${g[0]} – ${g[1]}`).join('; ') + '.'));
};

// ------------------------------------------------------------------------------------------- TỪ ĐA NGHĨA
// [từ, câu nghĩa gốc, các câu nghĩa chuyển]
const POLY: [string, string, string[]][] = [
  ['chân', 'Bạn Nam bị đau chân sau trận bóng.', ['Ngôi nhà nằm dưới chân núi.', 'Chân bàn bị gãy một bên.', 'Mây trắng lơ lửng ngang chân trời.']],
  ['mắt', 'Em bé có đôi mắt tròn xoe.', ['Quả na đã mở mắt.', 'Mắt lưới của chiếc vó rất nhỏ.', 'Cây tre có nhiều mắt.']],
  ['đầu', 'Bạn Lan đội mũ lên đầu.', ['Nhà em ở đầu làng.', 'Đầu bút bị gãy rồi.', 'Bạn ấy luôn đứng đầu lớp.']],
  ['ăn', 'Cả nhà quây quần ăn cơm tối.', ['Tàu đang ăn hàng ở cảng.', 'Da bạn ấy rất ăn nắng.', 'Nước sơn này ăn màu lắm.']],
  ['mũi', 'Chú chó dùng mũi đánh hơi rất giỏi.', ['Mũi thuyền rẽ sóng lao đi.', 'Mũi kéo này rất nhọn.', 'Mũi đất nhô ra biển.']],
  ['lưng', 'Bố cõng em trên lưng.', ['Ngôi chùa nằm lưng chừng núi.', 'Lưng ghế được bọc vải.', 'Bát cơm mới lưng lưng.']],
  ['chạy', 'Các bạn chạy thi trên sân trường.', ['Đồng hồ chạy rất đúng giờ.', 'Con đường chạy dọc bờ sông.', 'Máy giặt đang chạy.']],
];
const polyGoc: T5 = (r, c, l) => {
  const [w, goc, chuyen] = r.pick(POLY);
  return Q.sc(`Trong câu nào, từ "${w}" mang nghĩa gốc?`, r.shuffle([goc, ...r.sample(chuyen, 3)]), goc, M('V5.TU.03', 'TV.NGHIATU', 'nghia_goc', l, `Nghĩa gốc là nghĩa đầu tiên, nghĩa chính của từ: "${goc}"`));
};
const polyChuyen: T5 = (r, c, l) => {
  const [w, goc, chuyen] = r.pick(POLY);
  const right = r.pick(chuyen);
  return Q.sc(`Trong câu nào, từ "${w}" được dùng với nghĩa chuyển?`, r.shuffle([right, goc]), right, M('V5.TU.03', 'TV.NGHIATU', 'nghia_chuyen', l, `Nghĩa chuyển được suy ra từ nghĩa gốc: "${right}"`, `Ở câu "${goc}", từ "${w}" mang nghĩa gốc; câu còn lại dùng nghĩa chuyển.`));
};
const polyMc: T5 = (r, c, l) => {
  const [w, goc, chuyen] = r.pick(POLY);
  const rights = r.sample(chuyen, 2);
  return Q.mc(`Chọn tất cả các câu có từ "${w}" mang nghĩa chuyển.`, r.shuffle([...rights, goc]), rights, M('V5.TU.03', 'TV.NGHIATU', 'nghia_chuyen_nhieu', l, `Câu "${goc}" dùng nghĩa gốc; các câu còn lại dùng nghĩa chuyển.`));
};
const polyVsHomo: T5 = (r, c, l) => {
  const rows: [string, boolean][] = r.sample<[string, boolean]>([
    ['Từ "chân" trong "chân núi" và "chân bàn" là từ đa nghĩa.', true],
    ['Nghĩa gốc của từ "mắt" là bộ phận để nhìn của người, động vật.', true],
    ['Từ đa nghĩa chỉ có một nghĩa duy nhất.', false],
    ['Từ "đầu" trong "đầu làng" mang nghĩa gốc.', false],
    ['Nghĩa chuyển được hình thành từ nghĩa gốc.', true],
    ['Từ "chạy" trong "đồng hồ chạy" mang nghĩa gốc.', false],
  ], 4);
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', rows, M('V5.TU.03', 'TV.NGHIATU', 'da_nghia_ds', l, 'Từ đa nghĩa có một nghĩa gốc và một hay nhiều nghĩa chuyển; các nghĩa có liên quan với nhau.'));
};

// ------------------------------------------------------------------------------------------- KẾT TỪ
const KT = ['và', 'với', 'hay', 'hoặc', 'nhưng', 'mà', 'thì', 'của', 'ở', 'tại', 'bằng', 'như', 'để', 'vì', 'nên', 'do'];
const NOT_KT = ['bàn ghế', 'chạy', 'xanh', 'quyển vở', 'hát', 'rất', 'đã', 'cây'];
const ktPick: T5 = (r, c, l) => {
  const right = r.pick(KT);
  return Q.sc('Từ nào dưới đây là kết từ?', r.shuffle([right, ...r.sample(NOT_KT, 3)]), right, M('V5.TU.04', 'TV.TULOAI', 'ket_tu_chon', l, `Kết từ dùng để nối các từ ngữ hoặc các câu, cho biết mối quan hệ giữa chúng. "${right}" là kết từ.`));
};
const KT_FILL: [string, string, string[]][] = [
  ['Em học bài ___ chị nấu cơm.', 'còn', ['của', 'bằng']],
  ['Chiếc áo ___ mẹ may rất vừa với em.', 'mà', ['nhưng', 'hay']],
  ['Bạn thích đọc truyện ___ xem phim hoạt hình?', 'hay', ['của', 'bằng']],
  ['Ngôi nhà được làm ___ gỗ lim.', 'bằng', ['và', 'nhưng']],
  ['Trời mưa to ___ trận đấu vẫn diễn ra.', 'nhưng', ['của', 'bằng']],
  ['Quyển vở ___ Lan có bìa màu hồng.', 'của', ['và', 'nhưng']],
  ['Em dậy sớm ___ kịp chuyến xe đầu tiên.', 'để', ['của', 'hay']],
  ['Mẹ ___ em cùng đi chợ hoa ngày Tết.', 'và', ['của', 'bằng']],
];
const ktFill: T5 = (r, c, l) => {
  const [s, right, wrong] = r.pick(KT_FILL);
  return Q.sc(`Chọn kết từ thích hợp điền vào chỗ trống:\n${s}`, r.shuffle([right, ...wrong]), right, M('V5.TU.04', 'TV.TULOAI', 'ket_tu_dien', l, `Điền "${right}": ${s.replace('___', right)}`));
};
const KT_SENT: [string, string[], string[]][] = [
  ['Mẹ và em đi chợ bằng xe đạp.', ['và', 'bằng'], ['Mẹ', 'đi chợ', 'xe đạp']],
  ['Vì trời mưa nên chúng em nghỉ tập thể dục.', ['Vì', 'nên'], ['trời mưa', 'nghỉ', 'tập thể dục']],
  ['Quyển sách của Nam để ở trên bàn.', ['của', 'ở'], ['Quyển sách', 'để', 'bàn']],
  ['Bạn Hoa hát hay nhưng hơi nhút nhát.', ['nhưng'], ['hát', 'hay', 'nhút nhát']],
];
const ktMc: T5 = (r, c, l) => {
  const [s, rights, wrongs] = r.pick(KT_SENT);
  return Q.mc(`Chọn tất cả các kết từ trong câu sau:\n${s}`, r.shuffle([...rights, ...wrongs]), rights, M('V5.TU.04', 'TV.TULOAI', 'ket_tu_tim', l, `Kết từ trong câu: ${rights.join(', ')}.`));
};

// ------------------------------------------------------------------------------------------- ĐIỆP TỪ, ĐIỆP NGỮ
// đoạn thơ/văn tự viết, [đoạn, từ ngữ được lặp lại]
const DIEP: [string, string][] = [
  ['Nhớ sao tiếng mẹ ru hời,\nNhớ sao bếp lửa sáng ngời đêm đông.', 'Nhớ sao'],
  ['Em yêu dòng sông quê,\nEm yêu cánh diều đầu hè,\nEm yêu tiếng sáo trưa hè.', 'Em yêu'],
  ['Học, học nữa, học mãi để mai sau xây dựng quê hương.', 'học'],
  ['Mùa xuân về trên cánh đồng, mùa xuân về trên mái nhà, mùa xuân về trong mắt em.', 'mùa xuân về'],
  ['Cứ thế, từng giọt, từng giọt mưa rơi tí tách trên tàu lá chuối.', 'từng giọt'],
  ['Ở đâu có bàn tay chăm chút, ở đâu có nụ cười, ở đó có mùa xuân.', 'ở đâu có'],
];
const diepFind: T5 = (r, c, l) => {
  const [s, w] = r.pick(DIEP);
  const wrong = r.sample(DIEP.filter((x) => x[1] !== w).map((x) => x[1]), 2);
  return Q.sc(`Từ ngữ nào được lặp lại (điệp từ, điệp ngữ) trong đoạn sau?\n${s}`, r.shuffle([w, ...wrong]), w, M('V5.TU.05', 'TV.TUNGU', 'diep_tim', l, `"${w}" được lặp lại nhiều lần.`));
};
const diepEffect: T5 = (r, c, l) => {
  const [s, w] = r.pick(DIEP);
  const right = 'Nhấn mạnh ý, gây ấn tượng và tăng sức biểu cảm';
  return Q.sc(`Việc lặp lại "${w}" trong đoạn sau có tác dụng gì?\n${s}`, r.shuffle([right, 'Làm câu văn ngắn gọn hơn', 'Giải thích nghĩa của từ', 'Nối các câu bằng từ ngữ thay thế']), right,
    M('V5.TU.05', 'TV.TUNGU', 'diep_tac_dung', l, 'Điệp từ, điệp ngữ là lặp lại một từ ngữ để nhấn mạnh ý, tạo nhịp điệu và gây cảm xúc mạnh.'));
};
const diepPick: T5 = (r, c, l) => {
  const [s] = r.pick(DIEP);
  const wrongs = ['Chiều nay, gió thổi mát rượi trên cánh đồng.', 'Cây bàng trước sân đã ra lá non.', 'Mẹ em là giáo viên dạy Toán.'];
  return Q.sc('Câu (đoạn) nào có dùng biện pháp điệp từ, điệp ngữ?', r.shuffle([s, ...r.sample(wrongs, 2)]), s, M('V5.TU.05', 'TV.TUNGU', 'diep_chon', l, 'Đoạn có từ ngữ được lặp lại có chủ ý để nhấn mạnh.'));
};

// ------------------------------------------------------------------------------------------- CÂU ĐƠN, CÂU GHÉP
const SIMPLE = ['Đàn cò trắng bay lượn trên cánh đồng.', 'Sáng nay, lớp em đi tham quan bảo tàng.', 'Những bông hoa phượng đỏ rực cả góc sân.', 'Bà em kể chuyện cổ tích rất hay.', 'Chú mèo mướp nằm sưởi nắng bên hiên.'];
// [câu ghép, số vế, cách nối, quan hệ]
type CG = [string, number, 'kết từ' | 'cặp kết từ' | 'dấu câu', string];
const COMPOUND: CG[] = [
  ['Trời nắng gắt, cây cối héo rũ.', 2, 'dấu câu', 'nguyên nhân – kết quả'],
  ['Vì trời mưa to nên đường làng ngập nước.', 2, 'cặp kết từ', 'nguyên nhân – kết quả'],
  ['Nếu em chăm chỉ luyện tập thì em sẽ bơi giỏi.', 2, 'cặp kết từ', 'điều kiện – kết quả'],
  ['Tuy nhà xa trường nhưng bạn Hà chưa bao giờ đi học muộn.', 2, 'cặp kết từ', 'tương phản'],
  ['Mẹ đi làm, bố đi chợ, còn em ở nhà trông em bé.', 3, 'kết từ', 'liệt kê (đồng thời)'],
  ['Gió thổi mạnh và mây đen kéo đến.', 2, 'kết từ', 'liệt kê (nối tiếp)'],
  ['Không những Nam học giỏi mà Nam còn rất chăm làm.', 2, 'cặp kết từ', 'tăng tiến'],
  ['Mặt trời lặn; bầu trời chuyển sang màu tím nhạt.', 2, 'dấu câu', 'nối tiếp'],
];
const cgPick: T5 = (r, c, l) => {
  const g = r.pick(COMPOUND)[0];
  return Q.sc('Câu nào dưới đây là câu ghép?', r.shuffle([g, ...r.sample(SIMPLE, 2)]), g, M('V5.CAU.01', 'TV.CAUGHEP', 'cau_ghep_chon', l, 'Câu ghép do nhiều vế câu ghép lại, mỗi vế có cấu tạo giống một câu đơn (có chủ ngữ, vị ngữ).', `"${g}" là câu ghép.`));
};
const cgCount: T5 = (r, c, l) => {
  const [s, n] = r.pick(COMPOUND);
  return Q.sc(`Câu ghép sau có mấy vế câu?\n${s}`, ['2 vế', '3 vế', '4 vế'], `${n} vế`, M('V5.CAU.01', 'TV.CAUGHEP', 'cau_ghep_so_ve', l, `Mỗi vế có một cụm chủ ngữ – vị ngữ; câu có ${n} vế.`));
};
const cgTable: T5 = (r, c, l) => {
  const rows: [string, boolean][] = r.shuffle([...r.sample(COMPOUND, 2).map((x) => [`${x[0]} – câu ghép`, true] as [string, boolean]), ...r.sample(SIMPLE, 2).map((x) => [`${x} – câu ghép`, false] as [string, boolean])]);
  return Q.table('Câu nào là câu ghép? Đúng ghi Đ, sai ghi S.', rows, M('V5.CAU.01', 'TV.CAUGHEP', 'cau_don_ghep_ds', l, 'Câu ghép có từ hai cụm chủ ngữ – vị ngữ trở lên; câu đơn chỉ có một.'));
};
const noiWay: T5 = (r, c, l) => {
  const [s, , way] = r.pick(COMPOUND);
  return Q.sc(`Các vế trong câu ghép sau được nối với nhau bằng cách nào?\n${s}`, ['bằng kết từ', 'bằng cặp kết từ', 'bằng dấu câu'], `bằng ${way}`, M('V5.CAU.02', 'TV.CAUGHEP', 'noi_ve_cach', l, `Các vế được nối ${`bằng ${way}`}.`));
};
const PAIR_FILL: [string, string, string[]][] = [
  ['___ trời rét đậm ___ học sinh được nghỉ học.', 'Vì … nên …', ['Tuy … nhưng …', 'Không những … mà còn …']],
  ['___ em đạt điểm cao ___ bố sẽ thưởng cho em một chuyến du lịch.', 'Nếu … thì …', ['Tuy … nhưng …', 'Vì … nên …']],
  ['___ bạn ấy bị ốm ___ bạn ấy vẫn cố gắng đến lớp.', 'Tuy … nhưng …', ['Nếu … thì …', 'Vì … nên …']],
  ['___ Lan hát hay ___ Lan còn múa đẹp.', 'Không những … mà …', ['Vì … nên …', 'Nếu … thì …']],
  ['Trời ___ tối, đường ___ khó đi.', 'càng … càng …', ['vì … nên …', 'nếu … thì …']],
];
const noiFill: T5 = (r, c, l) => {
  const [s, right, wrong] = r.pick(PAIR_FILL);
  return Q.sc(`Chọn cặp kết từ thích hợp để nối các vế câu ghép:\n${s}`, r.shuffle([right, ...wrong]), right, M('V5.CAU.02', 'TV.CAUGHEP', 'cap_ket_tu', l, `Dùng "${right}" thể hiện đúng quan hệ giữa hai vế.`));
};
const noiRel: T5 = (r, c, l) => {
  const pool = COMPOUND.filter((x) => x[2] === 'cặp kết từ');
  const [s, , , rel] = r.pick(pool);
  const all = ['nguyên nhân – kết quả', 'điều kiện – kết quả', 'tương phản', 'tăng tiến'];
  return Q.sc(`Hai vế của câu ghép sau có quan hệ gì?\n${s}`, all, rel, M('V5.CAU.02', 'TV.CAUGHEP', 'quan_he_ve', l, `Cặp kết từ trong câu cho biết quan hệ ${rel}.`));
};

// ------------------------------------------------------------------------------------------- LIÊN KẾT CÂU
// [đoạn, từ ngữ dùng để liên kết, cách]
const LK: [string, string, 'lặp từ ngữ' | 'từ ngữ nối' | 'từ ngữ thay thế'][] = [
  ['Ngôi trường em nằm bên dòng sông nhỏ. Ngôi trường có hàng phượng vĩ rợp bóng.', 'Ngôi trường', 'lặp từ ngữ'],
  ['Chú Tư là thợ mộc giỏi nhất làng. Ông ấy làm được cả những chiếc tủ chạm khắc rất đẹp.', 'Ông ấy', 'từ ngữ thay thế'],
  ['Cả nhóm đã chuẩn bị rất kĩ. Vì thế, buổi thuyết trình diễn ra suôn sẻ.', 'Vì thế', 'từ ngữ nối'],
  ['Trời đã khuya. Tuy vậy, mẹ vẫn ngồi khâu áo cho em.', 'Tuy vậy', 'từ ngữ nối'],
  ['Hôm qua, lớp em trồng thêm hai cây bàng. Hai cây bàng được đặt ở góc sân.', 'Hai cây bàng', 'lặp từ ngữ'],
  ['Bạn Mai rất mê đọc sách. Cô bé dành hết tiền tiết kiệm để mua truyện.', 'Cô bé', 'từ ngữ thay thế'],
  ['Em giúp mẹ nhặt rau. Sau đó, em quét nhà và lau bàn.', 'Sau đó', 'từ ngữ nối'],
  ['Con mèo nhà em tên là Mướp. Nó rất thích nằm cuộn tròn bên bếp.', 'Nó', 'từ ngữ thay thế'],
];
const lkOf = (c: TV5Ctx) => {
  const ways: string[] = [];
  if (c.focus.includes('lk_lap')) ways.push('lặp từ ngữ');
  if (c.focus.includes('lk_noi')) ways.push('từ ngữ nối');
  if (c.focus.includes('lk_thay')) ways.push('từ ngữ thay thế');
  return LK.filter((x) => !ways.length || ways.includes(x[2]));
};
const lkFind: T5 = (r, c, l) => {
  const [s, w, way] = r.pick(lkOf(c));
  const words = s.replace(/[.,]/g, '').split(' ').filter((x) => !w.includes(x));
  const opts = r.shuffle([...new Set([w, ...r.sample(words, 3)])]);
  return Q.sc(`Từ ngữ nào giúp liên kết hai câu trong đoạn sau?\n${s}`, opts, w, M('V5.CAU.03', 'TV.LIENKET', 'lien_ket_tim', l, `"${w}" liên kết hai câu bằng cách dùng ${way}.`));
};
const lkWay: T5 = (r, c, l) => {
  const [s, w, way] = r.pick(LK);
  return Q.sc(`Hai câu trong đoạn sau được liên kết bằng cách nào?\n${s}`, ['lặp từ ngữ', 'dùng từ ngữ nối', 'dùng từ ngữ thay thế'], way === 'lặp từ ngữ' ? way : `dùng ${way}`,
    M('V5.CAU.03', 'TV.LIENKET', 'lien_ket_cach', l, `"${w}" cho thấy hai câu liên kết bằng cách ${way === 'lặp từ ngữ' ? 'lặp từ ngữ' : 'dùng ' + way}.`));
};
const NOI_FILL: [string, string, string[]][] = [
  ['Bạn Nam rất chăm học. ___, bạn còn tích cực giúp đỡ các bạn trong lớp.', 'Ngoài ra', ['Tuy vậy', 'Vì thế']],
  ['Đêm qua trời mưa to. ___, sáng nay đường làng lầy lội.', 'Vì vậy', ['Tuy nhiên', 'Ngoài ra']],
  ['Bài toán rất khó. ___, Hà vẫn kiên trì tìm ra cách giải.', 'Tuy nhiên', ['Vì vậy', 'Sau đó']],
  ['Đầu tiên, em rửa tay sạch sẽ. ___, em bày bát đũa ra mâm.', 'Sau đó', ['Tuy vậy', 'Vì thế']],
];
const lkNoiFill: T5 = (r, c, l) => {
  const [s, right, wrong] = r.pick(NOI_FILL);
  return Q.sc(`Chọn từ ngữ nối thích hợp điền vào chỗ trống:\n${s}`, r.shuffle([right, ...wrong]), right, M('V5.CAU.03', 'TV.LIENKET', 'tu_noi_dien', l, `"${right}" thể hiện đúng quan hệ giữa hai câu.`));
};

// ------------------------------------------------------------------------------------------- VIẾT HOA, TÊN NƯỚC NGOÀI
// [câu (từ cần viết hoa đang viết thường), từ cần viết hoa, các từ khác trong câu]
const RESPECT: [string, string, string[]][] = [
  ['Bác Hồ rất yêu thiếu nhi. người thường gửi thư khuyên các cháu chăm học.', 'người', ['thiếu nhi', 'thư', 'các cháu']],
  ['Chủ tịch Hồ Chí Minh là vị lãnh tụ kính yêu. người đã dành trọn cuộc đời cho đất nước.', 'người', ['lãnh tụ', 'cuộc đời', 'đất nước']],
  ['Thiếu nhi Việt Nam ghi nhớ năm điều bác Hồ dạy.', 'bác', ['thiếu nhi', 'năm điều', 'dạy']],
];
const respectPick: T5 = (r, c, l) => {
  const [s2, right, others] = r.pick(RESPECT);
  return Q.sc(`Trong câu sau, từ nào cần viết hoa để thể hiện sự tôn trọng đặc biệt?\n${s2}`, r.shuffle([right, ...others]), right, M('V5.CT.01', 'TV.VIETHOA', 'viet_hoa_ton_trong', l, `"${right}" dùng để chỉ Bác Hồ nên cần viết hoa ("${right[0].toUpperCase() + right.slice(1)}") để thể hiện sự tôn kính.`));
};
const respectWhy: T5 = (r, c, l) => {
  const right = 'Để thể hiện sự tôn trọng đặc biệt';
  return Q.sc('Trong câu "Bác Hồ rất yêu thiếu nhi. Người thường gửi thư cho các cháu.", từ "Người" được viết hoa vì sao?', r.shuffle([right, 'Vì đứng sau dấu phẩy', 'Vì là tên một địa danh', 'Vì là từ chỉ hoạt động']), right,
    M('V5.CT.01', 'TV.VIETHOA', 'vi_sao_viet_hoa', l, '"Người" là danh từ chung dùng để chỉ Bác Hồ, được viết hoa để thể hiện sự tôn kính.'));
};
// [đúng, sai...]
// [cách viết đúng, các cách viết sai — khác nhau ở dấu gạch nối, khoảng cách (không chỉ khác chữ hoa)]
const FOREIGN: [string, string[]][] = [
  ['Lê-ô-nác-đô đa Vin-xi', ['Lê ô nác đô đa Vin xi', 'Lê-ô-nác-đô-đa-Vin-xi']],
  ['Mác-xim Go-rơ-ki', ['Mác Xim Go Rơ Ki', 'Mác-xim-Go-rơ-ki']],
  ['Pa-ri', ['Pa Ri', 'Pari']],
  ['Ma-ri Quy-ri', ['Ma Ri Quy Ri', 'Ma-ri-Quy-ri']],
  ['Cô-pen-ha-ghen', ['Cô Pen Ha Ghen', 'Cô-pen ha-ghen']],
  ['Nê-pan', ['Nê Pan', 'Nêpan']],
];
const foreignPick: T5 = (r, c, l) => {
  const [right, wrong] = r.pick(FOREIGN);
  return Q.sc('Tên riêng nước ngoài nào được viết đúng?', r.shuffle([right, ...wrong]), right, M('V5.CT.02', 'TV.VIETHOA', 'ten_nuoc_ngoai', l, 'Viết hoa chữ cái đầu của mỗi bộ phận tạo thành tên; các tiếng trong một bộ phận nối với nhau bằng dấu gạch nối.', `Viết đúng: ${right}.`));
};
const foreignHan: T5 = (r, c, l) => {
  const right = r.pick(['Trung Quốc', 'Bắc Kinh', 'Ấn Độ', 'Nhật Bản', 'Hàn Quốc', 'Pháp']);
  const wrongs = r.sample(['Pa-ri', 'Mát-xcơ-va', 'Cô-pen-ha-ghen', 'Nê-pan', 'Lu-i Brai'], 3);
  return Q.sc('Tên nào dưới đây là tên nước ngoài phiên âm theo âm Hán Việt (viết như tên riêng Việt Nam)?', r.shuffle([right, ...wrongs]), right, M('V5.CT.02', 'TV.VIETHOA', 'ten_han_viet', l, 'Tên phiên âm Hán Việt viết hoa chữ cái đầu mỗi tiếng, không dùng gạch nối; tên phiên âm trực tiếp dùng dấu gạch nối.', `"${right}" là tên phiên âm Hán Việt.`));
};

// ------------------------------------------------------------------------------------------- VỐN TỪ THEO CHỦ ĐIỂM
const THEME5: Record<TV5Theme, string[]> = {
  tuoitho: ['hồn nhiên', 'vui chơi', 'thả diều', 'kỉ niệm', 'ngây thơ', 'trò chơi'],
  thiennhien: ['núi non', 'rừng xanh', 'thác nước', 'hang động', 'vịnh biển', 'sa mạc'],
  hoctap: ['tự học', 'chăm chỉ', 'kiến thức', 'sách vở', 'sáng tạo', 'khổ luyện'],
  nghethuat: ['hội hoạ', 'âm nhạc', 'múa', 'điêu khắc', 'phim hoạt hình', 'dân ca'],
  cuocsong: ['hạt gạo', 'mùa màng', 'lao động', 'yêu thương', 'gia đình', 'quê nhà'],
  tramien: ['lễ hội', 'thổ cẩm', 'cồng chiêng', 'xuồng ba lá', 'cốm làng Vòng', 'đồi chè'],
  chaong: ['truyền thống', 'văn hiến', 'tổ tiên', 'anh hùng', 'biết ơn', 'giữ nước'],
  thegioi: ['hoà bình', 'Trái Đất', 'môi trường', 'hữu nghị', 'công nghệ', 'tiết kiệm'],
};
const THEME_NAME: Record<TV5Theme, string> = { tuoitho: 'Thế giới tuổi thơ', thiennhien: 'Thiên nhiên kì thú', hoctap: 'Trên con đường học tập', nghethuat: 'Nghệ thuật muôn màu', cuocsong: 'Vẻ đẹp cuộc sống', tramien: 'Hương sắc trăm miền', chaong: 'Tiếp bước cha ông', thegioi: 'Thế giới của chúng ta' };
const themeOdd5: T5 = (r, c, l) => {
  const words = r.sample(THEME5[c.theme], 3);
  const other = r.pick((Object.keys(THEME5) as TV5Theme[]).filter((t) => t !== c.theme));
  const odd = r.pick(THEME5[other].filter((w) => !THEME5[c.theme].includes(w)));
  return Q.sc(`Từ nào KHÔNG thuộc chủ điểm "${THEME_NAME[c.theme]}"?`, r.shuffle([...words, odd]), odd, M('V5.TU.06', 'TV.TUNGU', 'von_tu_chu_diem', l, `${words.join(', ')} thuộc chủ điểm "${THEME_NAME[c.theme]}"; "${odd}" thuộc chủ điểm khác.`));
};
const themeGroup5: T5 = (r, c, l) => {
  const rights = r.sample(THEME5[c.theme], 2);
  const others = r.sample((Object.keys(THEME5) as TV5Theme[]).filter((t) => t !== c.theme).map((t) => r.pick(THEME5[t])).filter((w) => !THEME5[c.theme].includes(w)), 2);
  return Q.mc(`Chọn tất cả các từ thuộc chủ điểm "${THEME_NAME[c.theme]}".`, r.shuffle([...rights, ...others]), rights, M('V5.TU.06', 'TV.TUNGU', 'von_tu_nhom', l, `Các từ thuộc chủ điểm: ${rights.join(', ')}.`));
};

// ------------------------------------------------------------------------------------------- DÙNG LẠI DẠNG CÂU LỚP 4 (đổi mã YCCĐ sang lớp 5)
const O45: Record<string, string> = { 'V4.TU.01': 'V5.TU.06', 'V4.TU.02': 'V5.TU.06', 'V4.TU.03': 'V5.TU.06', 'V4.CT.02': 'V5.TU.06', 'V4.CAU.03': 'V5.CAU.04', 'V4.TU.04': 'V5.TU.06', 'V4.TU.05': 'V5.TU.02' };
const from4 = (f: TV4Focus): Record<Level, T5[]> => {
  const p4 = tv4FocusPool([f]);
  const out: Record<Level, T5[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const lv of [1, 2, 3, 4, 5] as Level[]) out[lv] = p4[lv].map((t) => (r: Rng, c: TV5Ctx, l: Level) => {
    const x = t(r, { week: c.week, focus: [f], theme: 'moinguoi' }, l);
    return x ? { ...x, outcome: O45[x.outcome ?? ''] ?? (x.outcome ?? '').replace('V4.', 'V5.') } : null;
  });
  return out;
};
const R4_TULOAI = from4('tuloai');
const R4_TUDIEN = from4('tudien');
const R4_GACH = from4('gachngang');

// ------------------------------------------------------------------------------------------- GOM THEO TRỌNG TÂM
type LvMap = Partial<Record<Level, T5[]>>;
/** Cách nối vế câu ghép học từ tuần 20 */
const NOI_AFTER: T5 = (r, c, l) => (c.week >= 20 ? noiWay(r, c, l) : null);
const F: Record<TV5Focus, LvMap> = {
  tuloai: R4_TULOAI,
  tudien: R4_TUDIEN,
  gachngang: R4_GACH,
  daucau: { 2: R4_GACH[2], 3: R4_GACH[3], 4: R4_GACH[4] },
  daitu: { 1: [dtPick], 2: [dtFind, dtPick], 3: [dtType, dtFind], 4: [dtReplace, dtType], 5: [dtMc, dtReplace] },
  dongnghia: { 1: [synPick], 2: [synOdd, synPick], 3: [synMatch, synOdd], 4: [synContext], 5: [synContext, synMatch] },
  danghia: { 2: [polyGoc], 3: [polyChuyen, polyGoc], 4: [polyMc, polyChuyen], 5: [polyVsHomo, polyMc] },
  kettu: { 1: [ktPick], 2: [ktFill, ktPick], 3: [ktMc, ktFill], 4: [ktMc], 5: [ktFill, ktMc] },
  diepngu: { 2: [diepFind], 3: [diepPick, diepFind], 4: [diepEffect, diepPick], 5: [diepEffect] },
  caughep: { 1: [cgPick], 2: [cgPick, cgCount], 3: [cgCount, cgTable], 4: [cgTable, NOI_AFTER], 5: [cgTable, NOI_AFTER] },
  noicaughep: { 2: [noiWay], 3: [noiFill, noiWay], 4: [noiRel, noiFill], 5: [noiRel] },
  lk_lap: { 2: [lkFind], 3: [lkFind, lkWay], 4: [lkWay], 5: [lkWay] },
  lk_noi: { 2: [lkFind], 3: [lkNoiFill, lkFind], 4: [lkNoiFill, lkWay], 5: [lkWay] },
  lk_thay: { 2: [lkFind], 3: [lkFind, dtReplace], 4: [lkWay], 5: [lkWay, dtReplace] },
  lienket: { 2: [lkFind], 3: [lkNoiFill, lkFind], 4: [lkWay, lkNoiFill], 5: [lkWay] },
  viethoa: { 2: [respectPick], 3: [respectWhy, respectPick], 4: [respectWhy], 5: [respectPick] },
  tennn: { 2: [foreignPick], 3: [foreignHan, foreignPick], 4: [foreignPick, foreignHan], 5: [foreignHan] },
};
/** Chỉ dùng dạng câu đã học: từ đồng nghĩa từ tuần 5, kết từ từ tuần 16 (theo mục lục sách) */
const after = (week: number, t: T5): T5 => (r, c, l) => (c.week >= week ? t(r, c, l) : null);
const SYN_AFTER = after(5, synPick), SYNCTX_AFTER = after(5, synContext), KT_AFTER = after(16, ktPick);
const BASE: LvMap = { 1: [themeGroup5, ...R4_TULOAI[1]], 2: [themeGroup5, SYN_AFTER, ...R4_TULOAI[2]], 3: [themeOdd5, KT_AFTER, ...R4_TULOAI[3]], 4: [themeOdd5, SYNCTX_AFTER], 5: [themeOdd5, SYNCTX_AFTER, themeGroup5] };

const retry = (t: T5): T5 => (r, c, l) => {
  for (let i = 0; i < 10; i++) {
    const x = t(r, c, l);
    if (x) return x;
  }
  return null;
};
const CACHE = new Map<T5, T5>();
const wrap = (t: T5) => CACHE.get(t) ?? (CACHE.set(t, retry(t)), CACHE.get(t)!);

export function tv5Pool(focus: TV5Focus[]): Record<Level, T5[]> {
  const pool: Record<Level, T5[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const add = (m: LvMap | undefined) => {
    for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const t of m?.[lv] ?? []) if (!pool[lv].includes(wrap(t))) pool[lv].push(wrap(t));
  };
  for (const f of focus) add(F[f]);
  add(BASE);
  return pool;
}
