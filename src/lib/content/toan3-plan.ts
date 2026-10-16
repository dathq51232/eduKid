// TOÁN 3 (Kết nối tri thức với cuộc sống) — khung 81 bài theo mục lục sách (tên chủ đề, tên bài, thứ tự bài).
// Không chép bài tập của sách: câu hỏi do bộ sinh câu EduChain Kids tạo (src/lib/practice/toan3.ts).
// Mỗi bài có: phạm vi kiến thức (scope — kiểm tra "không vượt trước") và các mảng kiến thức (topics) để chọn dạng câu.

import type { Scope } from './types';

export type T3Topic =
  | 'num1000' | 'addsub1000' | 'findAddSub' | 'table' | 'findMulDiv' | 'fraction' | 'geoReview'
  | 'midpoint' | 'circle' | 'angle' | 'shapes' | 'solids'
  | 'mul2d' | 'times' | 'remainder' | 'div2d' | 'reduce' | 'twoStep'
  | 'mm' | 'gram' | 'ml' | 'temp'
  | 'mul3d' | 'div3d' | 'expr' | 'ratio'
  | 'num10k' | 'cmp10k' | 'roman' | 'round' | 'perimeter' | 'areaIntro' | 'area'
  | 'add10k' | 'sub10k' | 'mul4d' | 'div4d'
  | 'num100k' | 'cmp100k' | 'round100k' | 'add100k' | 'sub100k'
  | 'clock' | 'month' | 'money' | 'mul5d' | 'div5d' | 'dataTable' | 'chance';

export type T3Lesson = {
  no: number; chapter: number; title: string; description: string; topics: T3Topic[];
  scope: Extract<Scope, { kind: 'math2' }>; topicCode: string; tables: number[];
};

export const T3_CHAPTERS: Record<number, string> = {
  1: 'Chủ đề 1. Ôn tập và bổ sung',
  2: 'Chủ đề 2. Bảng nhân, bảng chia',
  3: 'Chủ đề 3. Làm quen với hình phẳng, hình khối',
  4: 'Chủ đề 4. Phép nhân, phép chia trong phạm vi 100',
  5: 'Chủ đề 5. Một số đơn vị đo độ dài, khối lượng, dung tích, nhiệt độ',
  6: 'Chủ đề 6. Phép nhân, phép chia trong phạm vi 1000',
  7: 'Chủ đề 7. Ôn tập học kì 1',
  8: 'Chủ đề 8. Các số đến 10 000',
  9: 'Chủ đề 9. Chu vi, diện tích một số hình phẳng',
  10: 'Chủ đề 10. Cộng, trừ, nhân, chia trong phạm vi 10 000',
  11: 'Chủ đề 11. Các số đến 100 000',
  12: 'Chủ đề 12. Cộng, trừ trong phạm vi 100 000',
  13: 'Chủ đề 13. Xem đồng hồ. Tháng – năm. Tiền Việt Nam',
  14: 'Chủ đề 14. Nhân, chia trong phạm vi 100 000',
  15: 'Chủ đề 15. Làm quen với yếu tố thống kê, xác suất',
  16: 'Chủ đề 16. Ôn tập cuối năm',
};

const ALL4 = ['+', '-', '×', ':'] as const;
const T25 = [2, 5], T235 = [2, 3, 5], T2345 = [2, 3, 4, 5], T6 = [2, 3, 4, 5, 6], T7 = [2, 3, 4, 5, 6, 7], T8 = [2, 3, 4, 5, 6, 7, 8];
const T9 = [2, 3, 4, 5, 6, 7, 8, 9];

/** Phạm vi theo bài: số lớn nhất, bảng nhân chia đã học, nhân/chia số nhiều chữ số (từ Bài 23), chia có dư (từ Bài 25) */
function scopeOf(no: number, tables: number[]): T3Lesson['scope'] {
  const maxNumber = no <= 44 ? 1000 : no <= 58 ? 10000 : 100000;
  return { kind: 'math2', maxNumber, ops: ALL4, carry: true, carryMax: maxNumber, tables, bigMul: no >= 23, remainder: no >= 25 };
}
const tablesOf = (no: number) => (no <= 4 ? T25 : no === 5 ? T235 : no <= 8 ? T2345 : no === 9 ? T6 : no === 10 ? T7 : no === 11 ? T8 : T9);

const L = (no: number, chapter: number, title: string, description: string, topicCode: string, topics: T3Topic[]): T3Lesson =>
  ({ no, chapter, title, description, topics, scope: scopeOf(no, tablesOf(no)), topicCode, tables: tablesOf(no) });

const HK1_REVIEW: T3Topic[] = ['addsub1000', 'table', 'findMulDiv', 'fraction', 'mul3d', 'div3d', 'expr', 'twoStep', 'times', 'reduce'];

export const T3_LESSONS: T3Lesson[] = [
  L(1, 1, 'Ôn tập các số đến 1 000', 'Đọc, viết, cấu tạo, so sánh, xếp thứ tự các số đến 1000.', 'T3.SO', ['num1000']),
  L(2, 1, 'Ôn tập phép cộng, phép trừ trong phạm vi 1 000', 'Cộng, trừ có nhớ trong phạm vi 1000; tính nhẩm.', 'T3.PT', ['addsub1000']),
  L(3, 1, 'Tìm thành phần trong phép cộng, phép trừ', 'Tìm số hạng, số bị trừ, số trừ chưa biết.', 'T3.PT', ['findAddSub']),
  L(4, 1, 'Ôn tập bảng nhân 2; 5, bảng chia 2; 5', 'Thuộc bảng nhân, bảng chia 2 và 5.', 'T3.NC', ['table']),
  L(5, 1, 'Bảng nhân 3, bảng chia 3', 'Lập và thuộc bảng nhân 3, bảng chia 3.', 'T3.NC', ['table']),
  L(6, 1, 'Bảng nhân 4, bảng chia 4', 'Lập và thuộc bảng nhân 4, bảng chia 4.', 'T3.NC', ['table']),
  L(7, 1, 'Ôn tập hình học và đo lường', 'Đường gấp khúc, độ dài, ki-lô-gam, lít.', 'T3.HH', ['geoReview']),
  L(8, 1, 'Luyện tập chung', 'Ôn cộng, trừ, tìm thành phần, bảng nhân chia 2–5.', 'T3.PT', ['addsub1000', 'findAddSub', 'table']),
  L(9, 2, 'Bảng nhân 6, bảng chia 6', 'Lập và thuộc bảng nhân 6, bảng chia 6.', 'T3.NC', ['table']),
  L(10, 2, 'Bảng nhân 7, bảng chia 7', 'Lập và thuộc bảng nhân 7, bảng chia 7.', 'T3.NC', ['table']),
  L(11, 2, 'Bảng nhân 8, bảng chia 8', 'Lập và thuộc bảng nhân 8, bảng chia 8.', 'T3.NC', ['table']),
  L(12, 2, 'Bảng nhân 9, bảng chia 9', 'Lập và thuộc bảng nhân 9, bảng chia 9.', 'T3.NC', ['table']),
  L(13, 2, 'Tìm thành phần trong phép nhân, phép chia', 'Tìm thừa số, số bị chia, số chia chưa biết.', 'T3.NC', ['findMulDiv']),
  L(14, 2, 'Một phần mấy', 'Nhận biết một phần hai, ba, … chín của một số, một hình.', 'T3.NC', ['fraction']),
  L(15, 2, 'Luyện tập chung', 'Bảng nhân chia 2–9, tìm thành phần, một phần mấy.', 'T3.NC', ['table', 'findMulDiv', 'fraction']),
  L(16, 3, 'Điểm ở giữa, trung điểm của đoạn thẳng', 'Nhận biết điểm ở giữa, trung điểm; tính độ dài nửa đoạn thẳng.', 'T3.HH', ['midpoint']),
  L(17, 3, 'Hình tròn. Tâm, bán kính, đường kính của hình tròn', 'Đường kính dài gấp 2 lần bán kính.', 'T3.HH', ['circle']),
  L(18, 3, 'Góc, góc vuông, góc không vuông', 'Nhận biết góc, đỉnh, cạnh; góc vuông, góc không vuông.', 'T3.HH', ['angle']),
  L(19, 3, 'Hình tam giác, hình tứ giác. Hình chữ nhật, hình vuông', 'Đỉnh, cạnh, góc của hình; đặc điểm hình chữ nhật, hình vuông.', 'T3.HH', ['shapes']),
  L(20, 3, 'Thực hành vẽ góc vuông, vẽ đường tròn, hình vuông, hình chữ nhật và vẽ trang trí', 'Vẽ hình bằng ê ke, com-pa, thước.', 'T3.HH', ['angle', 'circle', 'shapes']),
  L(21, 3, 'Khối lập phương, khối hộp chữ nhật', 'Đỉnh, cạnh, mặt của khối lập phương, khối hộp chữ nhật.', 'T3.HH', ['solids']),
  L(22, 3, 'Luyện tập chung', 'Trung điểm, hình tròn, góc, các hình và khối.', 'T3.HH', ['midpoint', 'circle', 'angle', 'shapes', 'solids']),
  L(23, 4, 'Nhân số có hai chữ số với số có một chữ số', 'Đặt tính và nhân có nhớ, không nhớ.', 'T3.NC', ['mul2d']),
  L(24, 4, 'Gấp một số lên một số lần', 'Gấp lên nhiều lần là nhân.', 'T3.NC', ['times']),
  L(25, 4, 'Phép chia hết, phép chia có dư', 'Số dư bé hơn số chia.', 'T3.NC', ['remainder']),
  L(26, 4, 'Chia số có hai chữ số cho số có một chữ số', 'Đặt tính và chia; chia hết và chia có dư.', 'T3.NC', ['div2d']),
  L(27, 4, 'Giảm một số đi một số lần', 'Giảm đi nhiều lần là chia.', 'T3.NC', ['reduce']),
  L(28, 4, 'Bài toán giải bằng hai bước tính', 'Giải bài toán có hai phép tính.', 'T3.BT', ['twoStep']),
  L(29, 4, 'Luyện tập chung', 'Nhân, chia trong phạm vi 100; gấp, giảm; bài toán hai bước.', 'T3.NC', ['mul2d', 'div2d', 'times', 'reduce', 'twoStep']),
  L(30, 5, 'Mi-li-mét', '1 cm = 10 mm; 1 m = 1000 mm.', 'T3.DL', ['mm']),
  L(31, 5, 'Gam', '1 kg = 1000 g; cân, tính với đơn vị gam.', 'T3.DL', ['gram']),
  L(32, 5, 'Mi-li-lít', '1 l = 1000 ml; tính với đơn vị mi-li-lít.', 'T3.DL', ['ml']),
  L(33, 5, 'Nhiệt độ. Đơn vị đo nhiệt độ', 'Đọc nhiệt kế, độ C.', 'T3.DL', ['temp']),
  L(34, 5, 'Thực hành và trải nghiệm với các đơn vị mi-li-mét, gam, mi-li-lít, độ C', 'Ước lượng và đo.', 'T3.DL', ['mm', 'gram', 'ml', 'temp']),
  L(35, 5, 'Luyện tập chung', 'Đổi và tính với mm, g, ml, °C.', 'T3.DL', ['mm', 'gram', 'ml', 'temp']),
  L(36, 6, 'Nhân số có ba chữ số với số có một chữ số', 'Đặt tính và nhân.', 'T3.NC', ['mul3d']),
  L(37, 6, 'Chia số có ba chữ số cho số có một chữ số', 'Đặt tính và chia; chia có dư.', 'T3.NC', ['div3d']),
  L(38, 6, 'Biểu thức số. Tính giá trị của biểu thức số', 'Thứ tự thực hiện phép tính; biểu thức có dấu ngoặc.', 'T3.BT', ['expr']),
  L(39, 6, 'So sánh số lớn gấp mấy lần số bé', 'Lấy số lớn chia cho số bé.', 'T3.NC', ['ratio']),
  L(40, 6, 'Luyện tập chung', 'Nhân, chia số có ba chữ số; biểu thức; gấp mấy lần.', 'T3.NC', ['mul3d', 'div3d', 'expr', 'ratio']),
  L(41, 7, 'Ôn tập phép nhân, phép chia trong phạm vi 100, 1 000', 'Ôn bảng nhân chia, nhân chia số có hai, ba chữ số.', 'T3.NC', ['table', 'mul2d', 'div2d', 'mul3d', 'div3d']),
  L(42, 7, 'Ôn tập biểu thức số', 'Tính giá trị biểu thức.', 'T3.BT', ['expr', 'twoStep']),
  L(43, 7, 'Ôn tập hình học và đo lường', 'Hình phẳng, hình khối; mm, g, ml, °C.', 'T3.HH', ['midpoint', 'circle', 'angle', 'shapes', 'mm', 'gram', 'ml']),
  L(44, 7, 'Ôn tập chung', 'Ôn tập học kì 1.', 'T3.NC', HK1_REVIEW),
  L(45, 8, 'Các số có bốn chữ số. Số 10 000', 'Đọc, viết, cấu tạo số có bốn chữ số.', 'T3.SO', ['num10k']),
  L(46, 8, 'So sánh các số trong phạm vi 10 000', 'So sánh, xếp thứ tự các số có bốn chữ số.', 'T3.SO', ['cmp10k']),
  L(47, 8, 'Làm quen với chữ số La Mã', 'Đọc, viết số La Mã từ I đến XX.', 'T3.SO', ['roman']),
  L(48, 8, 'Làm tròn số đến hàng chục, hàng trăm', 'Làm tròn số trong phạm vi 10 000.', 'T3.SO', ['round']),
  L(49, 8, 'Luyện tập chung', 'Số có bốn chữ số, so sánh, La Mã, làm tròn.', 'T3.SO', ['num10k', 'cmp10k', 'roman', 'round']),
  L(50, 9, 'Chu vi hình tam giác, hình tứ giác, hình chữ nhật, hình vuông', 'Chu vi là tổng độ dài các cạnh.', 'T3.HH', ['perimeter']),
  L(51, 9, 'Diện tích của một hình. Xăng-ti-mét vuông', 'Đơn vị đo diện tích cm².', 'T3.HH', ['areaIntro']),
  L(52, 9, 'Diện tích hình chữ nhật, diện tích hình vuông', 'Dài × rộng; cạnh × cạnh.', 'T3.HH', ['area']),
  L(53, 9, 'Luyện tập chung', 'Chu vi, diện tích hình chữ nhật, hình vuông.', 'T3.HH', ['perimeter', 'area']),
  L(54, 10, 'Phép cộng trong phạm vi 10 000', 'Đặt tính và cộng có nhớ.', 'T3.PT', ['add10k']),
  L(55, 10, 'Phép trừ trong phạm vi 10 000', 'Đặt tính và trừ có nhớ.', 'T3.PT', ['sub10k']),
  L(56, 10, 'Nhân số có bốn chữ số với số có một chữ số', 'Đặt tính và nhân.', 'T3.NC', ['mul4d']),
  L(57, 10, 'Chia số có bốn chữ số cho số có một chữ số', 'Đặt tính và chia.', 'T3.NC', ['div4d']),
  L(58, 10, 'Luyện tập chung', 'Cộng, trừ, nhân, chia trong phạm vi 10 000.', 'T3.PT', ['add10k', 'sub10k', 'mul4d', 'div4d']),
  L(59, 11, 'Các số có năm chữ số. Số 100 000', 'Đọc, viết, cấu tạo số có năm chữ số.', 'T3.SO', ['num100k']),
  L(60, 11, 'So sánh các số trong phạm vi 100 000', 'So sánh, xếp thứ tự các số có năm chữ số.', 'T3.SO', ['cmp100k']),
  L(61, 11, 'Làm tròn số đến hàng nghìn, hàng chục nghìn', 'Làm tròn số trong phạm vi 100 000.', 'T3.SO', ['round100k']),
  L(62, 11, 'Luyện tập chung', 'Số có năm chữ số, so sánh, làm tròn.', 'T3.SO', ['num100k', 'cmp100k', 'round100k']),
  L(63, 12, 'Phép cộng trong phạm vi 100 000', 'Đặt tính và cộng.', 'T3.PT', ['add100k']),
  L(64, 12, 'Phép trừ trong phạm vi 100 000', 'Đặt tính và trừ.', 'T3.PT', ['sub100k']),
  L(65, 12, 'Luyện tập chung', 'Cộng, trừ trong phạm vi 100 000.', 'T3.PT', ['add100k', 'sub100k']),
  L(66, 13, 'Xem đồng hồ. Tháng – năm', 'Xem giờ chính xác đến phút; các tháng trong năm.', 'T3.DL', ['clock', 'month']),
  L(67, 13, 'Thực hành xem đồng hồ, xem lịch', 'Tính khoảng thời gian; xem lịch.', 'T3.DL', ['clock', 'month']),
  L(68, 13, 'Tiền Việt Nam', 'Các tờ tiền đến 100 000 đồng; tính tiền.', 'T3.DL', ['money']),
  L(69, 13, 'Luyện tập chung', 'Đồng hồ, lịch, tiền Việt Nam.', 'T3.DL', ['clock', 'month', 'money']),
  L(70, 14, 'Nhân số có năm chữ số với số có một chữ số', 'Đặt tính và nhân.', 'T3.NC', ['mul5d']),
  L(71, 14, 'Chia số có năm chữ số cho số có một chữ số', 'Đặt tính và chia.', 'T3.NC', ['div5d']),
  L(72, 14, 'Luyện tập chung', 'Nhân, chia trong phạm vi 100 000.', 'T3.NC', ['mul5d', 'div5d', 'expr']),
  L(73, 15, 'Thu thập, phân loại, ghi chép số liệu. Bảng số liệu', 'Đọc và lập bảng số liệu.', 'T3.TK', ['dataTable']),
  L(74, 15, 'Khả năng xảy ra của một sự kiện', 'Chắc chắn, có thể, không thể.', 'T3.TK', ['chance']),
  L(75, 15, 'Thực hành và trải nghiệm thu thập, phân loại, ghi chép số liệu, đọc bảng số liệu', 'Đọc bảng số liệu, so sánh.', 'T3.TK', ['dataTable']),
  L(76, 16, 'Ôn tập các số trong phạm vi 10 000, 100 000', 'Đọc, viết, so sánh, làm tròn số.', 'T3.SO', ['num100k', 'cmp100k', 'round100k', 'roman']),
  L(77, 16, 'Ôn tập phép cộng, phép trừ trong phạm vi 100 000', 'Cộng, trừ; tìm thành phần.', 'T3.PT', ['add100k', 'sub100k', 'findAddSub']),
  L(78, 16, 'Ôn tập phép nhân, phép chia trong phạm vi 100 000', 'Nhân, chia; biểu thức.', 'T3.NC', ['mul5d', 'div5d', 'expr']),
  L(79, 16, 'Ôn tập hình học và đo lường', 'Chu vi, diện tích; đơn vị đo; đồng hồ; tiền.', 'T3.HH', ['perimeter', 'area', 'mm', 'gram', 'ml', 'clock', 'money']),
  L(80, 16, 'Ôn tập bảng số liệu, khả năng xảy ra của một sự kiện', 'Bảng số liệu; chắc chắn, có thể, không thể.', 'T3.TK', ['dataTable', 'chance']),
  L(81, 16, 'Ôn tập chung', 'Ôn tập cuối năm.', 'T3.NC', ['add100k', 'sub100k', 'mul5d', 'div5d', 'expr', 'perimeter', 'area', 'twoStep']),
];

export const t3Id = (no: number) => `toan3-kntt-b${String(no).padStart(2, '0')}`;
