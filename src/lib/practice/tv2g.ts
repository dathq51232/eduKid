// BỘ SINH CÂU — TIẾNG VIỆT 2 (luyện từ và câu, chính tả, viết đoạn) theo từng tuần của sách Tiếng Việt 2
// (Kết nối tri thức). Kho từ, câu mẫu, đoạn văn ngắn do EduChain Kids tự viết; chỉ bám TÊN nội dung luyện tập trong
// mục lục sách (vd. "Từ ngữ chỉ đặc điểm; câu nêu đặc điểm", "Phân biệt g/gh, s/x").
// Mức L4–L5 có dạng nâng cao: từ trái nghĩa / cùng nghĩa, tìm từ khác nhóm, sắp xếp câu thành đoạn, dấu phẩy, viết hoa.

import type { Level } from '../content/types';
import { Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';

export type TVFocus = 'suvat' | 'hoatdong' | 'dacdiem' | 'gioithieu' | 'neuhd' | 'neudd' | 'daucau' | 'dauphay' | 'chucai' | 'viethoa' | 'diali';
export type TVTheme = 'banthan' | 'thethao' | 'truonghoc' | 'dodunghoctap' | 'sach' | 'banbe' | 'dochoi' | 'giadinh' | 'mua' | 'tet' | 'caycoi' | 'thiennhien'
  | 'muongthu' | 'vatnuoi' | 'moitruong' | 'convat' | 'giaotiep' | 'nghenghiep' | 'bacho' | 'sanpham' | 'bien';
export type TVCtx = { week: number; focus: TVFocus[]; spell: string[]; theme: TVTheme };
export type TVTemplate = (r: Rng, c: TVCtx, l: Level) => PracticeQuestion | null;
export type TVPool = Record<Level, TVTemplate[]>;

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });

// ------------------------------------------------------------------------------------------- KHO TỪ
const SU_VAT = ['cái bàn', 'cặp sách', 'bút chì', 'thước kẻ', 'quyển vở', 'cô giáo', 'học sinh', 'bác nông dân', 'con mèo', 'chim sẻ', 'cây bàng', 'hoa hồng', 'quả cam', 'trống trường', 'bảng lớp', 'ông nội', 'bà ngoại', 'em bé', 'cánh diều', 'búp bê', 'dòng sông', 'ngọn núi', 'cánh đồng', 'lũy tre', 'con trâu', 'chiếc lá', 'mặt trời', 'ngôi nhà'];
const HOAT_DONG = ['đọc sách', 'viết bài', 'chạy', 'nhảy dây', 'hát', 'múa', 'vẽ tranh', 'quét nhà', 'tưới cây', 'đá bóng', 'bơi', 'nấu cơm', 'học bài', 'thả diều', 'kể chuyện', 'rửa bát', 'gấp quần áo', 'trồng cây', 'chăm sóc', 'lau bàn', 'chơi cờ', 'giặt khăn'];
const DAC_DIEM = ['xanh biếc', 'đỏ thắm', 'vàng óng', 'cao lớn', 'thấp bé', 'tròn xoe', 'dài', 'ngắn', 'chăm chỉ', 'ngoan ngoãn', 'hiền lành', 'dũng cảm', 'nhanh nhẹn', 'thơm ngát', 'ngọt lịm', 'mềm mại', 'rộng rãi', 'sạch sẽ', 'vui vẻ', 'xinh xắn', 'trắng tinh', 'thật thà'];
const KIND_WORDS = { suvat: SU_VAT, hoatdong: HOAT_DONG, dacdiem: DAC_DIEM } as const;
type Kind = keyof typeof KIND_WORDS;
const KIND_NAME: Record<Kind, string> = { suvat: 'sự vật', hoatdong: 'hoạt động', dacdiem: 'đặc điểm' };
const KIND_OUT: Record<Kind, string> = { suvat: 'V2.TU.01', hoatdong: 'V2.TU.02', dacdiem: 'V2.TU.03' };

const THEME: Record<TVTheme, { name: string; words: string[] }> = {
  banthan: { name: 'bản thân em', words: ['lớn lên', 'tự tin', 'sở thích', 'ước mơ', 'chăm ngoan', 'tự giác'] },
  thethao: { name: 'hoạt động thể thao, vui chơi', words: ['đá bóng', 'bơi lội', 'nhảy dây', 'đá cầu', 'cầu lông', 'kéo co', 'chạy thi'] },
  truonghoc: { name: 'trường học', words: ['lớp học', 'thầy cô', 'bạn học', 'sân trường', 'trống trường', 'giờ ra chơi', 'thời khoá biểu'] },
  dodunghoctap: { name: 'đồ dùng học tập', words: ['bút chì', 'thước kẻ', 'tẩy', 'cặp sách', 'quyển vở', 'hộp bút', 'bút màu'] },
  sach: { name: 'sách vở', words: ['trang sách', 'bìa sách', 'mục lục', 'truyện tranh', 'thư viện', 'đọc sách'] },
  banbe: { name: 'tình cảm bạn bè', words: ['thân thiết', 'giúp đỡ', 'chia sẻ', 'đoàn kết', 'nhường nhịn', 'quý mến'] },
  dochoi: { name: 'đồ chơi', words: ['búp bê', 'ô tô đồ chơi', 'chong chóng', 'quả bóng', 'đèn ông sao', 'con quay', 'đồ chơi lắp ghép'] },
  giadinh: { name: 'gia đình', words: ['ông bà', 'bố mẹ', 'anh chị', 'yêu thương', 'chăm sóc', 'kính trọng', 'sum họp'] },
  mua: { name: 'các mùa trong năm', words: ['mùa xuân', 'mùa hạ', 'mùa thu', 'mùa đông', 'ấm áp', 'nóng bức', 'mát mẻ', 'giá lạnh'] },
  tet: { name: 'ngày Tết', words: ['bánh chưng', 'hoa đào', 'hoa mai', 'lì xì', 'chúc Tết', 'mâm ngũ quả', 'pháo hoa'] },
  caycoi: { name: 'cây cối', words: ['rễ cây', 'thân cây', 'cành lá', 'hoa', 'quả', 'tưới cây', 'bóng mát'] },
  thiennhien: { name: 'thiên nhiên', words: ['bầu trời', 'dòng sông', 'ngọn núi', 'cánh đồng', 'rừng cây', 'lũy tre', 'đám mây'] },
  muongthu: { name: 'muông thú', words: ['hổ', 'sư tử', 'voi', 'hươu cao cổ', 'khỉ', 'gấu', 'ngựa vằn'] },
  vatnuoi: { name: 'vật nuôi', words: ['chó', 'mèo', 'gà', 'vịt', 'trâu', 'bò', 'lợn'] },
  moitruong: { name: 'bảo vệ môi trường', words: ['trồng cây', 'nhặt rác', 'tiết kiệm nước', 'giữ vệ sinh', 'phân loại rác', 'tắt điện'] },
  convat: { name: 'các loài vật nhỏ bé', words: ['kiến', 'ong', 'bướm', 'chuồn chuồn', 'cánh cam', 'dế mèn', 'ốc sên'] },
  giaotiep: { name: 'giao tiếp, kết nối', words: ['chào hỏi', 'cảm ơn', 'xin lỗi', 'gọi điện', 'viết thư', 'nhắn tin', 'lắng nghe'] },
  nghenghiep: { name: 'nghề nghiệp', words: ['bác sĩ', 'giáo viên', 'nông dân', 'công nhân', 'kĩ sư', 'bộ đội', 'đầu bếp'] },
  bacho: { name: 'Bác Hồ và nhân dân', words: ['kính yêu', 'biết ơn', 'giản dị', 'yêu nước', 'thương dân', 'nhân dân'] },
  sanpham: { name: 'sản phẩm truyền thống', words: ['nón lá', 'gốm', 'lụa', 'tranh Đông Hồ', 'rổ tre', 'chiếu cói'] },
  bien: { name: 'loài vật dưới biển', words: ['cá heo', 'sao biển', 'san hô', 'rùa biển', 'mực', 'cua', 'tôm'] },
};
const OTHER_WORDS = ['ăn cơm', 'cái ghế', 'mặt trời', 'chạy nhảy', 'đỏ tươi', 'ngủ trưa', 'xe máy', 'đôi dép'];

// ------------------------------------------------------------------------------------------- CHÍNH TẢ
// [đúng, sai] — sai chỉ khác đúng ở đúng cặp âm/vần/dấu cần phân biệt
const SPELL: Record<string, [string, string][]> = {
  'c/k': [['cái kéo', 'cái céo'], ['kể chuyện', 'cể chuyện'], ['con kiến', 'con ciến'], ['cây cầu', 'cây kầu'], ['kì cọ', 'cì cọ']],
  'ch/tr': [['cây tre', 'cây che'], ['chăm chỉ', 'trăm chỉ'], ['trang sách', 'chang sách'], ['che chở', 'tre chở'], ['trống trường', 'chống trường']],
  'v/d': [['vui vẻ', 'dui dẻ'], ['quả dưa', 'quả vưa'], ['dòng sông', 'vòng sông'], ['về nhà', 'dề nhà']],
  'g/gh': [['gồ ghề', 'gồ gề'], ['ghi nhớ', 'gi nhớ'], ['con gà', 'con ghà'], ['cái ghế', 'cái gế'], ['gọn gàng', 'ghọn gàng']],
  's/x': [['sân trường', 'xân trường'], ['xinh xắn', 'sinh sắn'], ['sạch sẽ', 'xạch xẽ'], ['xe đạp', 'se đạp'], ['quả su su', 'quả xu xu']],
  'hỏi/ngã': [['nghỉ ngơi', 'nghĩ ngơi'], ['sạch sẽ', 'sạch sẻ'], ['vẽ tranh', 'vẻ tranh'], ['nhảy dây', 'nhãy dây'], ['gỗ quý', 'gổ quý']],
  'ng/ngh': [['nghe nhạc', 'nge nhạc'], ['ngôi nhà', 'nghôi nhà'], ['nghĩ ngợi', 'ngĩ ngợi'], ['ngày mai', 'nghày mai'], ['nghiêng ngả', 'ngiêng ngả']],
  'r/d/gi': [['rổ rá', 'dổ rá'], ['giữ gìn', 'dữ dìn'], ['da dẻ', 'gia gẻ'], ['rung rinh', 'dung dinh'], ['gió thổi', 'dó thổi']],
  'an/ang': [['cây bàng', 'cây bàn'], ['bàn tay', 'bàng tay'], ['sáng sớm', 'sán sớm'], ['ngan ngát', 'ngang ngát']],
  'l/n': [['nước non', 'lước lon'], ['lo lắng', 'no nắng'], ['nắng nóng', 'lắng lóng'], ['lá cây', 'ná cây'], ['nấu cơm', 'lấu cơm']],
  'ăn/ăng': [['khăn mặt', 'khăng mặt'], ['măng tre', 'măn tre'], ['chăn ấm', 'chăng ấm'], ['trăng sáng', 'trăn sáng']],
  'iêu/ươu': [['con hươu', 'con hiêu'], ['hạt tiêu', 'hạt tươu'], ['chim khướu', 'chim khiếu'], ['chiều chiều', 'chườu chườu']],
  'en/eng': [['cái xẻng', 'cái xẻn'], ['đèn bàn', 'đèng bàn'], ['leng keng', 'len ken'], ['hoa sen', 'hoa seng']],
  'iu/ưu': [['cái rìu', 'cái rừu'], ['cứu giúp', 'cíu giúp'], ['bưu điện', 'biu điện'], ['nũng nịu', 'nũng nựu']],
  'iên/iêng': [['tiếng chim', 'tiến chim'], ['cô tiên', 'cô tiêng'], ['siêng năng', 'siên năng'], ['bờ biển', 'bờ biểng']],
  'uôn/uông': [['chuông gió', 'chuôn gió'], ['buồn bã', 'buồng bã'], ['muốn ăn', 'muống ăn'], ['ruộng lúa', 'ruộn lúa']],
  'ươn/ương': [['vườn rau', 'vường rau'], ['con đường', 'con đườn'], ['mượn sách', 'mượng sách'], ['thương yêu', 'thươn yêu']],
  'iên/yên/uyên': [['yên lặng', 'iên lặng'], ['bóng chuyền', 'bóng chiền'], ['cô tiên', 'cô tyên'], ['khuyên bảo', 'khiên bảo']],
  'ai/ay': [['bàn tay', 'bàn tai'], ['con nai', 'con nay'], ['máy bay', 'mái bai'], ['tai thỏ', 'tay thỏ']],
  'ao/au': [['quả cau', 'quả cao'], ['ngôi sao', 'ngôi sau'], ['rau cải', 'rao cải'], ['chào hỏi', 'chàu hỏi']],
  'ân/âng': [['tầng lầu', 'tần lầu'], ['nâng niu', 'nân niu'], ['cái cân', 'cái câng'], ['sân nhà', 'sâng nhà'], ['vầng trăng', 'vần trăng']],
  'ac/at': [['bãi cát', 'bãi các'], ['bản nhạc', 'bản nhạt'], ['ca hát', 'ca hác'], ['vác củi', 'vát củi']],
  'ăc/ăt': [['mặc áo', 'mặt áo'], ['rửa mặt', 'rửa mặc'], ['thắc mắc', 'thắt mắt'], ['cắt giấy', 'cắc giấy']],
  'ôc/ôt': [['con ốc', 'con ốt'], ['cột cờ', 'cộc cờ'], ['tốc độ', 'tốt độ'], ['gốc cây', 'gốt cây']],
  'uc/ut': [['bút chì', 'búc chì'], ['hoa cúc', 'hoa cút'], ['chúc mừng', 'chút mừng'], ['phút giây', 'phúc giây']],
  'ưc/ưt': [['mực nước', 'mựt nước'], ['nứt nẻ', 'nức nẻ'], ['bức tranh', 'bứt tranh'], ['sức khỏe', 'sứt khỏe']],
  'uynh/uych': [['phụ huynh', 'phụ huych'], ['ngã huỵch', 'ngã huỳnh'], ['khuỳnh tay', 'khuỵch tay']],
  'iêt/iêc': [['viết bài', 'viếc bài'], ['xanh biếc', 'xanh biết'], ['tiếc nuối', 'tiết nuối'], ['chiếc lá', 'chiết lá']],
  'uya/uyu': [['khuya khoắt', 'khuyu khoắt'], ['khúc khuỷu', 'khúc khuỷa'], ['đêm khuya', 'đêm khuyu']],
  'uôt/uôc': [['chuột nhắt', 'chuộc nhắt'], ['buộc dây', 'buột dây'], ['tuốt lúa', 'tuốc lúa'], ['thuộc bài', 'thuột bài']],
  'ươc/ươt': [['lướt sóng', 'lước sóng'], ['bước chân', 'bướt chân'], ['thước kẻ', 'thướt kẻ'], ['trượt chân', 'trược chân']],
  'êt/êch': [['con ếch', 'con ết'], ['mệt mỏi', 'mệch mỏi'], ['lệch lạc', 'lệt lạc'], ['Tết đến', 'Tếch đến']],
  'oanh/oach': [['doanh trại', 'doach trại'], ['kế hoạch', 'kế hoanh'], ['loanh quanh', 'loach quanh'], ['thu hoạch', 'thu hoanh']],
  'eo/oe': [['chú mèo', 'chú mòe'], ['khỏe mạnh', 'khẻo mạnh'], ['nhoẻn cười', 'nhẻon cười'], ['leo trèo', 'loe tròe']],
  'ên/ênh': [['bập bênh', 'bập bên'], ['lên xuống', 'lênh xuống'], ['mênh mông', 'mên mông'], ['nhện con', 'nhệnh con']],
  'ip/iêp': [['kịp thời', 'kiệp thời'], ['tiếp sức', 'típ sức'], ['nhịp nhàng', 'nhiệp nhàng'], ['tấm thiếp', 'tấm thíp']],
  'im/iêm': [['chim sẻ', 'chiêm sẻ'], ['quả hồng xiêm', 'quả hồng xim'], ['tìm kiếm', 'tiềm kiếm'], ['lúa chiêm', 'lúa chim']],
  'it/uyt': [['xe buýt', 'xe bít'], ['mít ướt', 'muýt ướt'], ['huýt sáo', 'hít sáo'], ['ít ỏi', 'uýt ỏi']],
  'ươu/iêu': [['con hươu', 'con hiêu'], ['diều sáo', 'dườu sáo'], ['bướu lạc đà', 'biếu lạc đà'], ['yêu quý', 'ươu quý']],
  'in/inh': [['xin lỗi', 'xinh lỗi'], ['xinh đẹp', 'xin đẹp'], ['tin tức', 'tinh tức'], ['bình minh', 'bìn min']],
  'iu/iêu': [['cái rìu', 'cái riều'], ['nhiều', 'nhìu'], ['líu lo', 'liếu lo'], ['hiểu bài', 'hỉu bài']],
};

// ------------------------------------------------------------------------------------------- CÂU MẪU
const SENT: Record<'gioithieu' | 'neuhd' | 'neudd', string[]> = {
  gioithieu: ['Em là học sinh trường Tiểu học Hoà Bình.', 'Đây là cô giáo chủ nhiệm của lớp em.', 'Bố em là bác sĩ.', 'Bạn Lan là lớp trưởng.', 'Con mèo này là quà sinh nhật của em.', 'Hà Nội là thủ đô của nước ta.', 'Chú Tư là thợ mộc giỏi nhất xóm.'],
  neuhd: ['Bạn Nam đang tưới cây.', 'Mẹ em nấu cơm.', 'Các bạn nhảy dây ở sân trường.', 'Chú chim sẻ mổ thóc.', 'Em quét nhà giúp bà.', 'Bé Na tập viết chữ hoa.', 'Ông em đọc báo buổi sáng.'],
  neudd: ['Bông hoa hồng rất thơm.', 'Bầu trời hôm nay trong xanh.', 'Chú mèo con lông trắng muốt.', 'Bạn Minh rất chăm chỉ.', 'Dòng sông quê em hiền hoà.', 'Chiếc cặp mới của em rất đẹp.', 'Quả cam chín vàng óng.'],
};
const TYPE_NAME = { gioithieu: 'câu giới thiệu', neuhd: 'câu nêu hoạt động', neudd: 'câu nêu đặc điểm' } as const;
const TYPE_OUT = { gioithieu: 'V2.CAU.01', neuhd: 'V2.CAU.02', neudd: 'V2.CAU.03' } as const;
const TYPE_WHY = { gioithieu: 'Câu trả lời câu hỏi "Ai (cái gì) là gì?".', neuhd: 'Câu trả lời câu hỏi "Ai (con gì) làm gì?".', neudd: 'Câu trả lời câu hỏi "Ai (cái gì) thế nào?".' } as const;

const ENDINGS: [string, string, string][] = [
  ['Bạn tên là gì', '?', 'Câu hỏi thì cuối câu đặt dấu chấm hỏi.'], ['Hôm nay em được điểm mười', '.', 'Câu kể thì cuối câu đặt dấu chấm.'],
  ['Ôi, bông hoa đẹp quá', '!', 'Câu bộc lộ cảm xúc (ôi, quá) thì đặt dấu chấm than.'], ['Nhà bạn ở đâu', '?', 'Câu hỏi thì cuối câu đặt dấu chấm hỏi.'],
  ['Em thích đọc truyện cổ tích', '.', 'Câu kể thì cuối câu đặt dấu chấm.'], ['A, mẹ về rồi', '!', 'Câu bộc lộ cảm xúc vui mừng thì đặt dấu chấm than.'],
  ['Mấy giờ lớp mình ra chơi', '?', 'Câu hỏi thì cuối câu đặt dấu chấm hỏi.'], ['Chúng em trồng cây ở vườn trường', '.', 'Câu kể thì cuối câu đặt dấu chấm.'],
  ['Trời ơi, con diều bay cao quá', '!', 'Câu bộc lộ cảm xúc thì đặt dấu chấm than.'], ['Bạn có thích chơi cờ không', '?', 'Câu hỏi thì cuối câu đặt dấu chấm hỏi.'],
];
const COMMAS: [string, string[]][] = [
  ['Trong vườn có hoa hồng, hoa cúc, hoa mai.', ['Trong vườn, có hoa hồng hoa cúc, hoa mai.', 'Trong vườn có hoa hồng hoa cúc hoa mai.']],
  ['Bạn Hà, bạn Lan và bạn Minh cùng đi học.', ['Bạn Hà bạn Lan, và bạn Minh cùng đi học.', 'Bạn Hà bạn Lan và bạn Minh, cùng đi học.']],
  ['Em giúp mẹ quét nhà, rửa bát, gấp quần áo.', ['Em giúp mẹ, quét nhà rửa bát gấp quần áo.', 'Em giúp mẹ quét nhà rửa bát, gấp, quần áo.']],
  ['Cặp sách của em có bút, thước, vở.', ['Cặp sách, của em có bút thước vở.', 'Cặp sách của em có bút thước, vở, .']],
  ['Ông bà, bố mẹ đều yêu thương em.', ['Ông, bà bố mẹ đều yêu thương em.', 'Ông bà bố mẹ, đều yêu thương em.']],
];
const NAMES: [string, string[]][] = [
  ['Nguyễn Văn An', ['nguyễn văn an', 'Nguyễn văn An', 'Nguyễn Văn an']], ['Trần Thị Mai', ['trần thị Mai', 'Trần thị Mai', 'Trần Thị mai']],
  ['Lê Minh Khoa', ['lê minh khoa', 'Lê minh Khoa', 'Lê Minh khoa']], ['Phạm Ngọc Hà', ['Phạm ngọc Hà', 'phạm Ngọc Hà', 'Phạm Ngọc hà']],
];
const PLACES: [string, string[]][] = [
  ['Hà Nội', ['hà nội', 'Hà nội', 'hà Nội']], ['Đà Nẵng', ['Đà nẵng', 'đà Nẵng', 'đà nẵng']], ['Hải Phòng', ['Hải phòng', 'hải Phòng', 'hải phòng']],
  ['Cần Thơ', ['Cần thơ', 'cần Thơ', 'cần thơ']], ['Phú Quốc', ['Phú quốc', 'phú Quốc', 'phú quốc']], ['Sa Pa', ['Sa pa', 'sa Pa', 'sa pa']],
];
const ANTONYM: [string, string][] = [['cao', 'thấp'], ['dài', 'ngắn'], ['nóng', 'lạnh'], ['vui', 'buồn'], ['chăm chỉ', 'lười biếng'], ['nhanh', 'chậm'], ['sạch', 'bẩn'], ['mới', 'cũ'], ['khỏe', 'yếu'], ['ngày', 'đêm'], ['to', 'nhỏ'], ['đầy', 'vơi']];
const SYNONYM: [string, string][] = [['chăm chỉ', 'siêng năng'], ['to', 'lớn'], ['xinh', 'đẹp'], ['bé', 'nhỏ'], ['vui', 'mừng'], ['thật thà', 'trung thực'], ['nhanh', 'mau'], ['ba', 'bố']];
const PARAS: string[][] = [
  ['Sáng nay, em dậy sớm.', 'Em đánh răng, rửa mặt.', 'Sau đó, em ăn sáng cùng cả nhà.', 'Cuối cùng, bố đưa em đến trường.'],
  ['Mẹ mua cho em một chú gấu bông.', 'Chú gấu có bộ lông màu nâu rất mềm.', 'Tối nào em cũng ôm gấu đi ngủ.'],
  ['Bạn Lan đến lớp sớm.', 'Lan lau bảng và xếp lại bàn ghế.', 'Cô giáo khen Lan rất chăm chỉ.'],
  ['Em gieo hạt đỗ vào chậu đất.', 'Mấy hôm sau, hạt đỗ nảy mầm.', 'Em tưới nước cho cây mỗi ngày.', 'Cây đỗ lớn lên và ra những chiếc lá xanh.'],
  ['Hôm qua, lớp em đi thăm vườn bách thú.', 'Chúng em được ngắm hươu, voi và khỉ.', 'Ai cũng thích chú khỉ nghịch ngợm.', 'Buổi chiều, cả lớp vui vẻ ra về.'],
  ['Chiều nay, bố dẫn em đi thả diều.', 'Gió thổi mạnh, cánh diều bay lên cao.', 'Em reo lên thích thú.'],
];
const ALPHABET = 'a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y'.split(' ');
const KIDNAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khánh', 'Lan', 'Minh', 'Nga', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Vy', 'Xuân', 'Yến'];

const kindsOf = (c: TVCtx): Kind[] => {
  const k = (['suvat', 'hoatdong', 'dacdiem'] as Kind[]).filter((x) => c.focus.includes(x));
  return k.length ? k : ['suvat', 'hoatdong', 'dacdiem'];
};
const typesOf = (c: TVCtx): ('gioithieu' | 'neuhd' | 'neudd')[] => {
  const t = (['gioithieu', 'neuhd', 'neudd'] as const).filter((x) => c.focus.includes(x));
  return t.length ? [...t] : ['neuhd', 'neudd'];
};

// ------------------------------------------------------------------------------------------- MẪU CÂU
const wordKindPick: TVTemplate = (r, c, l) => {
  const kind = r.pick(kindsOf(c));
  const right = r.pick(KIND_WORDS[kind]);
  const others = (Object.keys(KIND_WORDS) as Kind[]).filter((k) => k !== kind).map((k) => r.pick(KIND_WORDS[k]));
  return Q.sc(`Từ nào là từ chỉ ${KIND_NAME[kind]}?`, r.shuffle([right, ...others]), right, M(KIND_OUT[kind], 'TV.TUNGU', `tu_${kind}`, l, `"${right}" là từ chỉ ${KIND_NAME[kind]}.`));
};
const wordKindGroup: TVTemplate = (r, c, l) => {
  const kind = r.pick(kindsOf(c));
  const right = r.sample(KIND_WORDS[kind], r.int(2, 3));
  const wrong = r.sample((Object.keys(KIND_WORDS) as Kind[]).filter((k) => k !== kind).flatMap((k) => KIND_WORDS[k]), 3);
  return Q.mc(`Chọn tất cả từ chỉ ${KIND_NAME[kind]}.`, r.shuffle([...right, ...wrong]), right, M(KIND_OUT[kind], 'TV.TUNGU', `nhom_${kind}`, l, `Từ chỉ ${KIND_NAME[kind]}: ${right.join(', ')}.`));
};
const themeGroup: TVTemplate = (r, c, l) => {
  const t = THEME[c.theme];
  const right = r.sample(t.words, 3);
  const wrong = r.sample(OTHER_WORDS.filter((w) => !t.words.includes(w)), 2);
  return Q.mc(`Chọn tất cả từ ngữ về ${t.name}.`, r.shuffle([...right, ...wrong]), right, M('V2.TU.04', 'TV.TUNGU', 'mo_rong_von_tu', l, `Từ ngữ về ${t.name}: ${right.join(', ')}.`));
};
const themeOdd: TVTemplate = (r, c, l) => {
  const t = THEME[c.theme];
  const same = r.sample(t.words, 3);
  const odd = r.pick(OTHER_WORDS.filter((w) => !t.words.includes(w)));
  return Q.sc(`Từ nào KHÔNG cùng nhóm với các từ còn lại?`, r.shuffle([...same, odd]), odd, M('V2.TU.04', 'TV.TUNGU', 'tu_khac_nhom', l, `${same.join(', ')} đều là từ ngữ về ${t.name}; "${odd}" thì không.`));
};
const spellPick: TVTemplate = (r, c, l) => {
  const pair = r.pick(c.spell.length ? c.spell : ['c/k', 'g/gh', 'ng/ngh']);
  const [right, wrong] = r.pick(SPELL[pair]);
  return Q.sc(`Từ nào viết đúng chính tả? (phân biệt ${pair})`, r.shuffle([right, wrong]), right, M('V2.CT.02', 'TV.CHINHTA', 'chinh_ta', l, `Viết đúng là "${right}".`));
};
const spellGroup: TVTemplate = (r, c, l) => {
  const pair = r.pick(c.spell.length ? c.spell : ['s/x', 'ch/tr']);
  const items = r.sample(SPELL[pair], Math.min(4, SPELL[pair].length));
  const shown = items.map(([ok, bad]) => (r.chance(0.5) ? { w: ok, ok: true } : { w: bad, ok: false }));
  if (shown.every((x) => x.ok) || shown.every((x) => !x.ok)) return null;
  return Q.mc(`Chọn tất cả từ viết đúng chính tả (${pair}).`, shown.map((x) => x.w), shown.filter((x) => x.ok).map((x) => x.w),
    M('V2.CT.02', 'TV.CHINHTA', 'chinh_ta_nhom', l, `Các từ viết đúng: ${shown.filter((x) => x.ok).map((x) => x.w).join(', ')}.`));
};
const endPunct: TVTemplate = (r, c, l) => {
  const [s, p, why] = r.pick(ENDINGS);
  return Q.sc(`Chọn dấu câu đặt cuối câu: "${s} …"`, ['.', '?', '!'], p, M('V2.CAU.04', 'TV.DAUCAU', 'dau_ket_cau', l, why));
};
const sentType: TVTemplate = (r, c, l) => {
  const t = r.pick(typesOf(c));
  const s = r.pick(SENT[t]);
  return Q.sc(`Câu "${s}" là kiểu câu nào?`, ['câu giới thiệu', 'câu nêu hoạt động', 'câu nêu đặc điểm'], TYPE_NAME[t], M(TYPE_OUT[t], 'TV.KIEUCAU', 'kieu_cau', l, TYPE_WHY[t]));
};
const pickSentType: TVTemplate = (r, c, l) => {
  const t = r.pick(typesOf(c));
  const others = (['gioithieu', 'neuhd', 'neudd'] as const).filter((x) => x !== t).map((x) => r.pick(SENT[x]));
  const right = r.pick(SENT[t]);
  return Q.sc(`Câu nào là ${TYPE_NAME[t]}?`, r.shuffle([right, ...others]), right, M(TYPE_OUT[t], 'TV.KIEUCAU', 'chon_kieu_cau', l, `${TYPE_WHY[t]} Câu đúng: "${right}"`));
};
const orderWords: TVTemplate = (r, c, l) => {
  const s = r.pick(SENT[r.pick(typesOf(c))]).replace(/\.$/, '');
  const words = s.split(' ');
  if (words.length < 4 || words.length > 7 || new Set(words.map((w) => w.toLowerCase())).size !== words.length) return null;
  // ghép từ hai tiếng cho dễ xếp: giữ nguyên từng tiếng nhưng tối đa 6 mảnh
  return Q.ord('Sắp xếp các từ thành câu.', words, M('V2.CAU.02', 'TV.XEPCAU', 'xep_cau', l, `Câu đúng: "${s}."`));
};
const alphaNext: TVTemplate = (r, c, l) => {
  const i = r.int(0, ALPHABET.length - 2);
  const right = ALPHABET[i + 1];
  const opts = [...new Set([right, ALPHABET[Math.max(0, i - 1)], ALPHABET[Math.min(ALPHABET.length - 1, i + 2)], ALPHABET[i]])];
  if (opts.length < 3) return null;
  return Q.sc(`Trong bảng chữ cái, chữ cái nào đứng ngay sau chữ "${ALPHABET[i]}"?`, r.shuffle(opts), right, M('V2.CT.01', 'TV.CHUCAI', 'bang_chu_cai', l, `Thứ tự: … ${ALPHABET.slice(Math.max(0, i - 1), i + 3).join(', ')} …`));
};
const alphaOrder: TVTemplate = (r, c, l) => {
  const names = r.sample(KIDNAMES, 4);
  const key = (n: string) => ALPHABET.indexOf(n.charAt(0).toLowerCase());
  if (new Set(names.map(key)).size < 4) return null;
  const sorted = [...names].sort((a, b) => key(a) - key(b));
  return Q.ord('Xếp tên các bạn theo thứ tự bảng chữ cái.', sorted, M('V2.CT.01', 'TV.CHUCAI', 'xep_ten', l, `Xét chữ cái đầu theo bảng chữ cái: ${sorted.join(', ')}.`));
};
// Bộ chấm không phân biệt hoa/thường → hỏi "chữ nào cần viết hoa" thay vì so các cách viết
const capName: TVTemplate = (r, c, l) => {
  const place = c.focus.includes('diali') && r.chance(0.6);
  const name = r.pick(NAMES)[0];
  const where = r.pick(PLACES)[0];
  const words = place ? ['nhà', 'bạn', ...name.split(' ').slice(-1), 'ở', ...where.split(' ')] : ['bạn', ...name.split(' '), 'học', 'lớp', 'hai'];
  const caps = place ? [name.split(' ').slice(-1)[0], ...where.split(' ')] : name.split(' ');
  const low = (w: string) => w.toLocaleLowerCase('vi');
  const sentence = words.map(low).join(' ') + '.';
  const opts = [...new Set(words.map(low))];
  const right = [...new Set(caps.map(low))];
  return Q.mc(`Câu sau viết chưa đúng chính tả: "${sentence}"\nChọn tất cả các chữ cần viết hoa (không kể chữ đầu câu).`, opts, right,
    M('V2.CT.03', 'TV.VIETHOA', place ? 'viet_hoa_dia_li' : 'viet_hoa_ten', l, `Viết đúng: "${words.map((w, k) => (k === 0 ? w[0].toLocaleUpperCase('vi') + w.slice(1) : w)).join(' ')}." ${place ? 'Tên người và tên riêng địa lí' : 'Tên người'} viết hoa chữ cái đầu mỗi tiếng.`));
};
const antonym: TVTemplate = (r, c, l) => {
  const syn = r.chance(0.4);
  const [a, b] = r.pick(syn ? SYNONYM : ANTONYM);
  const pool = (syn ? ANTONYM : SYNONYM).flat().filter((w) => w !== a && w !== b);
  return Q.sc(`Từ nào ${syn ? 'có nghĩa giống' : 'trái nghĩa với'} từ "${a}"?`, r.shuffle([b, ...r.sample(pool, 2)]), b,
    M('V2.TU.05', 'TV.NGHIATU', syn ? 'cung_nghia' : 'trai_nghia', l, `"${a}" và "${b}" là cặp từ ${syn ? 'có nghĩa giống nhau' : 'trái nghĩa'}.`));
};
const antonymMatch: TVTemplate = (r, c, l) => {
  const pairs = r.sample(ANTONYM, 3);
  return Q.mt('Nối mỗi từ với từ trái nghĩa.', pairs, M('V2.TU.05', 'TV.NGHIATU', 'noi_trai_nghia', l, pairs.map(([a, b]) => `${a} – ${b}`).join('; ') + '.'));
};
const commaPick: TVTemplate = (r, c, l) => {
  const [right, wrongs] = r.pick(COMMAS);
  return Q.sc('Câu nào đặt dấu phẩy đúng?', r.shuffle([right, ...wrongs]), right, M('V2.CAU.04', 'TV.DAUCAU', 'dau_phay', l, 'Dấu phẩy ngăn cách các từ cùng loại đứng liền nhau.'));
};
const orderPara: TVTemplate = (r, c, l) => {
  const p = r.pick(PARAS);
  return Q.ord('Sắp xếp các câu thành đoạn văn hợp lí.', p, M('V2.VIET.01', 'TV.DOANVAN', 'xep_doan', l, `Thứ tự hợp lí theo trình tự việc xảy ra: ${p.map((_, i) => i + 1).join(' → ')}.`));
};
const kindMatch: TVTemplate = (r, c, l) => {
  const ks = r.shuffle(['suvat', 'hoatdong', 'dacdiem'] as Kind[]);
  const pairs: [string, string][] = ks.map((k) => [r.pick(KIND_WORDS[k]), `từ chỉ ${KIND_NAME[k]}`]);
  return Q.mt('Nối mỗi từ với nhóm của nó.', pairs, M('V2.TU.01', 'TV.TUNGU', 'phan_loai_tu', l, pairs.map(([w, n]) => `"${w}": ${n}`).join('; ') + '.'));
};

export const TV2G_POOL: TVPool = {
  1: [wordKindPick, spellPick, endPunct, alphaNext],
  2: [wordKindGroup, themeGroup, spellPick, sentType],
  3: [pickSentType, spellGroup, kindMatch, alphaOrder],
  4: [orderWords, capName, antonym, themeOdd],
  5: [orderPara, commaPick, antonymMatch, themeOdd],
};

// Dùng lại cho Tiếng Việt 3 (practice/tv3g.ts)
export const TV2G = { wordKindPick, wordKindGroup, spellPick, spellGroup, endPunct, sentType, pickSentType, orderWords, capName, antonym, antonymMatch, commaPick, orderPara, kindMatch, alphaOrder };
export const SPELL_KEYS = Object.keys(SPELL);
