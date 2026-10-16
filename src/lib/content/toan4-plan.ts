// TOÁN 4 (Kết nối tri thức với cuộc sống) — khung 73 bài theo mục lục sách (tên chủ đề, tên bài, thứ tự bài).
// Không chép bài tập của sách: câu hỏi do bộ sinh câu EduChain Kids tạo (src/lib/practice/toan4.ts).

import type { Scope } from './types';

export type T4Topic =
  | 'num100k' | 'ops100k' | 'evenOdd' | 'letterExpr' | 'threeStep'
  | 'angleMeasure' | 'angleKind'
  | 'num1m' | 'placeClass' | 'numMillion' | 'roundBig' | 'cmpBig' | 'naturalSeq'
  | 'mass' | 'areaUnit' | 'timeUnit'
  | 'addBig' | 'subBig' | 'addProps' | 'sumDiff'
  | 'perpendicular' | 'parallel' | 'parallelogram'
  | 'mul1' | 'div1' | 'mulProps' | 'mulPow10' | 'distributive' | 'mul2' | 'div2' | 'estimate' | 'average' | 'unitRate'
  | 'dataSeq' | 'barChart' | 'eventCount'
  | 'fracConcept' | 'fracDivision' | 'fracProperty' | 'fracReduce' | 'fracCommon' | 'fracCompare'
  | 'fracAdd' | 'fracSub' | 'fracMul' | 'fracDiv' | 'fracOf';

export type T4Lesson = { no: number; chapter: number; title: string; description: string; topics: T4Topic[]; scope: Extract<Scope, { kind: 'math2' }>; topicCode: string };

export const T4_CHAPTERS: Record<number, string> = {
  1: 'Chủ đề 1. Ôn tập và bổ sung',
  2: 'Chủ đề 2. Góc và đơn vị đo góc',
  3: 'Chủ đề 3. Số có nhiều chữ số',
  4: 'Chủ đề 4. Một số đơn vị đo đại lượng',
  5: 'Chủ đề 5. Phép cộng và phép trừ',
  6: 'Chủ đề 6. Đường thẳng vuông góc. Đường thẳng song song',
  7: 'Chủ đề 7. Ôn tập học kì 1',
  8: 'Chủ đề 8. Phép nhân và phép chia',
  9: 'Chủ đề 9. Làm quen với yếu tố thống kê, xác suất',
  10: 'Chủ đề 10. Phân số',
  11: 'Chủ đề 11. Phép cộng, phép trừ phân số',
  12: 'Chủ đề 12. Phép nhân, phép chia phân số',
  13: 'Chủ đề 13. Ôn tập cuối năm',
};

const ALL4 = ['+', '-', '×', ':'] as const;
const T9 = [2, 3, 4, 5, 6, 7, 8, 9];
/** Phạm vi: số đến 100 000 (Bài 1–9) → 1 000 000 (Bài 10–11) → lớp triệu; nhân/chia với 10, 100, 1000 từ Bài 41, với số có hai chữ số từ Bài 43 */
function scopeOf(no: number): T4Lesson['scope'] {
  const maxNumber = no <= 9 ? 100000 : no <= 11 ? 1000000 : 999999999;
  return { kind: 'math2', maxNumber, ops: ALL4, carry: true, carryMax: maxNumber, tables: T9, bigMul: true, remainder: true, mulMax: no >= 43 && no <= 73 && no !== 71 ? 99 : 10, pow10: no >= 41 };
}
const L = (no: number, chapter: number, title: string, description: string, topicCode: string, topics: T4Topic[]): T4Lesson =>
  ({ no, chapter, title, description, topics, scope: scopeOf(no), topicCode });

export const T4_LESSONS: T4Lesson[] = [
  L(1, 1, 'Ôn tập các số đến 100 000', 'Đọc, viết, cấu tạo, so sánh, làm tròn các số đến 100 000.', 'T4.SO', ['num100k']),
  L(2, 1, 'Ôn tập các phép tính trong phạm vi 100 000', 'Cộng, trừ, nhân, chia với số có một chữ số.', 'T4.PT', ['ops100k']),
  L(3, 1, 'Số chẵn, số lẻ', 'Số chẵn có chữ số tận cùng 0, 2, 4, 6, 8.', 'T4.SO', ['evenOdd']),
  L(4, 1, 'Biểu thức chứa chữ', 'Tính giá trị biểu thức chứa một, hai, ba chữ.', 'T4.PT', ['letterExpr']),
  L(5, 1, 'Giải bài toán có ba bước tính', 'Giải bài toán có ba phép tính.', 'T4.PT', ['threeStep']),
  L(6, 1, 'Luyện tập chung', 'Số chẵn lẻ, biểu thức chứa chữ, bài toán ba bước.', 'T4.PT', ['ops100k', 'evenOdd', 'letterExpr', 'threeStep']),
  L(7, 2, 'Đo góc, đơn vị đo góc', 'Độ (°); góc vuông 90°.', 'T4.HH', ['angleMeasure']),
  L(8, 2, 'Góc nhọn, góc tù, góc bẹt', 'So sánh góc với góc vuông.', 'T4.HH', ['angleKind']),
  L(9, 2, 'Luyện tập chung', 'Đo góc, các loại góc.', 'T4.HH', ['angleMeasure', 'angleKind']),
  L(10, 3, 'Số có sáu chữ số. Số 1 000 000', 'Đọc, viết số có sáu chữ số.', 'T4.SO', ['num1m']),
  L(11, 3, 'Hàng và lớp', 'Lớp đơn vị, lớp nghìn; giá trị chữ số.', 'T4.SO', ['placeClass', 'num1m']),
  L(12, 3, 'Các số trong phạm vi lớp triệu', 'Đọc, viết các số đến lớp triệu.', 'T4.SO', ['numMillion']),
  L(13, 3, 'Làm tròn số đến hàng trăm nghìn', 'Làm tròn số có nhiều chữ số.', 'T4.SO', ['roundBig']),
  L(14, 3, 'So sánh các số có nhiều chữ số', 'So sánh, xếp thứ tự số có nhiều chữ số.', 'T4.SO', ['cmpBig']),
  L(15, 3, 'Làm quen với dãy số tự nhiên', 'Dãy số tự nhiên; số liền trước, liền sau.', 'T4.SO', ['naturalSeq']),
  L(16, 3, 'Luyện tập chung', 'Số có nhiều chữ số.', 'T4.SO', ['numMillion', 'placeClass', 'roundBig', 'cmpBig', 'naturalSeq']),
  L(17, 4, 'Yến, tạ, tấn', '1 yến = 10 kg; 1 tạ = 100 kg; 1 tấn = 1000 kg.', 'T4.DL', ['mass']),
  L(18, 4, 'Đề-xi-mét vuông, mét vuông, mi-li-mét vuông', '1 dm² = 100 cm²; 1 m² = 100 dm²; 1 cm² = 100 mm².', 'T4.DL', ['areaUnit']),
  L(19, 4, 'Giây, thế kỉ', '1 phút = 60 giây; 1 thế kỉ = 100 năm.', 'T4.DL', ['timeUnit']),
  L(20, 4, 'Thực hành và trải nghiệm sử dụng một số đơn vị đo đại lượng', 'Ước lượng, đổi đơn vị.', 'T4.DL', ['mass', 'areaUnit', 'timeUnit']),
  L(21, 4, 'Luyện tập chung', 'Yến, tạ, tấn; dm², m², mm²; giây, thế kỉ.', 'T4.DL', ['mass', 'areaUnit', 'timeUnit']),
  L(22, 5, 'Phép cộng các số có nhiều chữ số', 'Đặt tính và cộng.', 'T4.PT', ['addBig']),
  L(23, 5, 'Phép trừ các số có nhiều chữ số', 'Đặt tính và trừ.', 'T4.PT', ['subBig']),
  L(24, 5, 'Tính chất giao hoán và kết hợp của phép cộng', 'Tính thuận tiện.', 'T4.PT', ['addProps']),
  L(25, 5, 'Tìm hai số biết tổng và hiệu của hai số đó', 'Số lớn = (Tổng + Hiệu) : 2.', 'T4.PT', ['sumDiff']),
  L(26, 5, 'Luyện tập chung', 'Cộng, trừ; tính chất; tổng – hiệu.', 'T4.PT', ['addBig', 'subBig', 'addProps', 'sumDiff']),
  L(27, 6, 'Hai đường thẳng vuông góc', 'Hai đường thẳng cắt nhau tạo bốn góc vuông.', 'T4.HH', ['perpendicular']),
  L(28, 6, 'Thực hành và trải nghiệm vẽ hai đường thẳng vuông góc', 'Vẽ bằng ê ke.', 'T4.HH', ['perpendicular']),
  L(29, 6, 'Hai đường thẳng song song', 'Hai đường thẳng không bao giờ cắt nhau.', 'T4.HH', ['parallel']),
  L(30, 6, 'Thực hành và trải nghiệm vẽ hai đường thẳng song song', 'Vẽ bằng thước và ê ke.', 'T4.HH', ['parallel', 'perpendicular']),
  L(31, 6, 'Hình bình hành, hình thoi', 'Đặc điểm hình bình hành, hình thoi.', 'T4.HH', ['parallelogram']),
  L(32, 6, 'Luyện tập chung', 'Vuông góc, song song, hình bình hành, hình thoi.', 'T4.HH', ['perpendicular', 'parallel', 'parallelogram']),
  L(33, 7, 'Ôn tập các số đến lớp triệu', 'Đọc, viết, so sánh, làm tròn số.', 'T4.SO', ['numMillion', 'cmpBig', 'roundBig']),
  L(34, 7, 'Ôn tập phép cộng, phép trừ', 'Cộng, trừ; tính chất; tổng – hiệu.', 'T4.PT', ['addBig', 'subBig', 'addProps', 'sumDiff']),
  L(35, 7, 'Ôn tập hình học', 'Góc, vuông góc, song song, hình bình hành, hình thoi.', 'T4.HH', ['angleKind', 'perpendicular', 'parallel', 'parallelogram']),
  L(36, 7, 'Ôn tập đo lường', 'Khối lượng, diện tích, thời gian.', 'T4.DL', ['mass', 'areaUnit', 'timeUnit']),
  L(37, 7, 'Ôn tập chung', 'Ôn tập học kì 1.', 'T4.PT', ['numMillion', 'addBig', 'subBig', 'sumDiff', 'letterExpr', 'mass']),
  L(38, 8, 'Nhân với số có một chữ số', 'Đặt tính và nhân số có nhiều chữ số.', 'T4.NC', ['mul1']),
  L(39, 8, 'Chia cho số có một chữ số', 'Đặt tính và chia; chia có dư.', 'T4.NC', ['div1']),
  L(40, 8, 'Tính chất giao hoán và kết hợp của phép nhân', 'Tính thuận tiện.', 'T4.NC', ['mulProps']),
  L(41, 8, 'Nhân, chia với 10, 100, 1 000,...', 'Thêm hoặc bớt chữ số 0.', 'T4.NC', ['mulPow10']),
  L(42, 8, 'Tính chất phân phối của phép nhân đối với phép cộng', 'a × (b + c) = a × b + a × c.', 'T4.NC', ['distributive']),
  L(43, 8, 'Nhân với số có hai chữ số', 'Đặt tính, tích riêng.', 'T4.NC', ['mul2']),
  L(44, 8, 'Chia cho số có hai chữ số', 'Đặt tính, ước lượng thương.', 'T4.NC', ['div2']),
  L(45, 8, 'Thực hành và trải nghiệm ước lượng trong tính toán', 'Làm tròn để ước lượng kết quả.', 'T4.NC', ['estimate']),
  L(46, 8, 'Tìm số trung bình cộng', 'Tổng các số chia cho số các số hạng.', 'T4.NC', ['average']),
  L(47, 8, 'Bài toán liên quan đến rút về đơn vị', 'Tìm giá trị một phần rồi tìm nhiều phần.', 'T4.NC', ['unitRate']),
  L(48, 8, 'Luyện tập chung', 'Nhân, chia; trung bình cộng; rút về đơn vị.', 'T4.NC', ['mul2', 'div2', 'average', 'unitRate']),
  L(49, 9, 'Dãy số liệu thống kê', 'Đọc, sắp xếp dãy số liệu.', 'T4.TK', ['dataSeq']),
  L(50, 9, 'Biểu đồ cột', 'Đọc và so sánh trên biểu đồ cột.', 'T4.TK', ['barChart']),
  L(51, 9, 'Số lần xuất hiện của một sự kiện', 'Kiểm đếm số lần xuất hiện.', 'T4.TK', ['eventCount']),
  L(52, 9, 'Luyện tập chung', 'Dãy số liệu, biểu đồ cột, số lần xuất hiện.', 'T4.TK', ['dataSeq', 'barChart', 'eventCount']),
  L(53, 10, 'Khái niệm phân số', 'Tử số, mẫu số; đọc, viết phân số.', 'T4.PS', ['fracConcept']),
  L(54, 10, 'Phân số và phép chia số tự nhiên', 'Thương của phép chia viết thành phân số.', 'T4.PS', ['fracDivision']),
  L(55, 10, 'Tính chất cơ bản của phân số', 'Nhân, chia cả tử và mẫu với cùng một số.', 'T4.PS', ['fracProperty']),
  L(56, 10, 'Rút gọn phân số', 'Phân số tối giản.', 'T4.PS', ['fracReduce']),
  L(57, 10, 'Quy đồng mẫu số các phân số', 'Đưa về cùng mẫu số.', 'T4.PS', ['fracCommon']),
  L(58, 10, 'So sánh phân số', 'Cùng mẫu, khác mẫu, so sánh với 1.', 'T4.PS', ['fracCompare']),
  L(59, 10, 'Luyện tập chung', 'Phân số: khái niệm, rút gọn, quy đồng, so sánh.', 'T4.PS', ['fracConcept', 'fracReduce', 'fracCommon', 'fracCompare']),
  L(60, 11, 'Phép cộng phân số', 'Cùng mẫu, khác mẫu.', 'T4.PS', ['fracAdd']),
  L(61, 11, 'Phép trừ phân số', 'Cùng mẫu, khác mẫu.', 'T4.PS', ['fracSub']),
  L(62, 11, 'Luyện tập chung', 'Cộng, trừ phân số.', 'T4.PS', ['fracAdd', 'fracSub']),
  L(63, 12, 'Phép nhân phân số', 'Tử nhân tử, mẫu nhân mẫu.', 'T4.PS', ['fracMul']),
  L(64, 12, 'Phép chia phân số', 'Nhân với phân số đảo ngược.', 'T4.PS', ['fracDiv']),
  L(65, 12, 'Tìm phân số của một số', 'Lấy số đó nhân với phân số.', 'T4.PS', ['fracOf']),
  L(66, 12, 'Luyện tập chung', 'Nhân, chia phân số; phân số của một số.', 'T4.PS', ['fracMul', 'fracDiv', 'fracOf']),
  L(67, 13, 'Ôn tập số tự nhiên', 'Đọc, viết, so sánh, làm tròn số tự nhiên.', 'T4.SO', ['numMillion', 'cmpBig', 'roundBig', 'evenOdd']),
  L(68, 13, 'Ôn tập phép tính với số tự nhiên', 'Bốn phép tính; tính chất; trung bình cộng.', 'T4.NC', ['addBig', 'subBig', 'mul2', 'div2', 'average']),
  L(69, 13, 'Ôn tập phân số', 'Rút gọn, quy đồng, so sánh phân số.', 'T4.PS', ['fracReduce', 'fracCommon', 'fracCompare']),
  L(70, 13, 'Ôn tập phép tính với phân số', 'Cộng, trừ, nhân, chia phân số.', 'T4.PS', ['fracAdd', 'fracSub', 'fracMul', 'fracDiv', 'fracOf']),
  L(71, 13, 'Ôn tập hình học và đo lường', 'Góc, song song, vuông góc; đơn vị đo.', 'T4.HH', ['angleKind', 'parallelogram', 'mass', 'areaUnit', 'timeUnit']),
  L(72, 13, 'Ôn tập một số yếu tố thống kê và xác suất', 'Dãy số liệu, biểu đồ cột, số lần xuất hiện.', 'T4.TK', ['dataSeq', 'barChart', 'eventCount']),
  L(73, 13, 'Ôn tập chung', 'Ôn tập cuối năm.', 'T4.NC', ['sumDiff', 'average', 'unitRate', 'fracOf', 'fracAdd', 'mul2']),
];

export const t4Id = (no: number) => `toan4-kntt-b${String(no).padStart(2, '0')}`;
