// TOÁN 5 (Kết nối tri thức với cuộc sống) — khung 75 bài theo mục lục sách (tên chủ đề, tên bài, thứ tự bài).
// Không chép bài tập của sách: câu hỏi do bộ sinh câu EduChain Kids tạo (src/lib/practice/toan5.ts).

import type { Scope } from './types';

export type T5Topic =
  | 'natRev' | 'natOps' | 'fracRev' | 'decFrac' | 'fracOps' | 'fracAddDiff' | 'mixed' | 'geoRev'
  | 'decConcept' | 'decCompare' | 'decMeasure' | 'decRound'
  | 'kmHa' | 'areaUnits'
  | 'decAdd' | 'decSub' | 'decMul' | 'decDiv' | 'decPow10'
  | 'triangle' | 'trapezoid' | 'circle'
  | 'ratio' | 'mapScale' | 'sumRatio' | 'diffRatio' | 'pctOf' | 'pctValue'
  | 'volume' | 'volUnits'
  | 'net' | 'boxArea' | 'cubeArea' | 'boxVol' | 'cubeVol'
  | 'timeUnits' | 'timeAddSub' | 'timeMulDiv' | 'speed' | 'distTime'
  | 'dataSort' | 'pieChart' | 'eventRatio';

export type T5Lesson = { no: number; chapter: number; title: string; description: string; topics: T5Topic[]; scope: Extract<Scope, { kind: 'math5' }>; topicCode: string };

export const T5_CHAPTERS: Record<number, string> = {
  1: 'Chủ đề 1. Ôn tập và bổ sung',
  2: 'Chủ đề 2. Số thập phân',
  3: 'Chủ đề 3. Một số đơn vị đo diện tích',
  4: 'Chủ đề 4. Các phép tính với số thập phân',
  5: 'Chủ đề 5. Một số hình phẳng. Chu vi và diện tích',
  6: 'Chủ đề 6. Ôn tập học kì 1',
  7: 'Chủ đề 7. Tỉ số và các bài toán liên quan',
  8: 'Chủ đề 8. Thể tích. Đơn vị đo thể tích',
  9: 'Chủ đề 9. Diện tích và thể tích của một số hình khối',
  10: 'Chủ đề 10. Số đo thời gian. Vận tốc. Các bài toán liên quan đến chuyển động đều',
  11: 'Chủ đề 11. Một số yếu tố thống kê và xác suất',
  12: 'Chủ đề 12. Ôn tập cuối năm',
};

const ALL = ['+', '-', '×', ':'] as const;
/** Phạm vi: số tự nhiên đến lớp tỉ; số thập phân từ Bài 10 */
const scopeOf = (no: number): T5Lesson['scope'] => ({ kind: 'math5', maxNumber: 999999999, ops: ALL, decimal: no >= 10 });
const L = (no: number, chapter: number, title: string, description: string, topicCode: string, topics: T5Topic[]): T5Lesson =>
  ({ no, chapter, title, description, topics, scope: scopeOf(no), topicCode });

export const T5_LESSONS: T5Lesson[] = [
  L(1, 1, 'Ôn tập số tự nhiên', 'Đọc, viết, so sánh số tự nhiên; giá trị của chữ số.', 'T5.SO', ['natRev']),
  L(2, 1, 'Ôn tập các phép tính với số tự nhiên', 'Bốn phép tính; tính chất; tính giá trị biểu thức.', 'T5.SO', ['natOps']),
  L(3, 1, 'Ôn tập phân số', 'Rút gọn, quy đồng, so sánh phân số.', 'T5.SO', ['fracRev']),
  L(4, 1, 'Phân số thập phân', 'Phân số có mẫu số 10, 100, 1000…', 'T5.SO', ['decFrac']),
  L(5, 1, 'Ôn tập các phép tính với phân số', 'Cộng, trừ, nhân, chia phân số.', 'T5.SO', ['fracOps']),
  L(6, 1, 'Cộng, trừ hai phân số khác mẫu số', 'Quy đồng mẫu số rồi cộng, trừ.', 'T5.SO', ['fracAddDiff']),
  L(7, 1, 'Hỗn số', 'Đọc, viết hỗn số; chuyển hỗn số thành phân số.', 'T5.SO', ['mixed']),
  L(8, 1, 'Ôn tập hình học và đo lường', 'Chu vi, diện tích hình chữ nhật, hình vuông; đổi đơn vị đo.', 'T5.HH', ['geoRev']),
  L(9, 1, 'Luyện tập chung', 'Phân số, hỗn số, phân số thập phân.', 'T5.SO', ['fracRev', 'fracAddDiff', 'mixed', 'decFrac']),
  L(10, 2, 'Khái niệm số thập phân', 'Phần nguyên, phần thập phân; hàng của số thập phân.', 'T5.STP', ['decConcept']),
  L(11, 2, 'So sánh các số thập phân', 'So sánh, xếp thứ tự số thập phân.', 'T5.STP', ['decCompare']),
  L(12, 2, 'Viết số đo đại lượng dưới dạng số thập phân', 'Độ dài, khối lượng viết dưới dạng số thập phân.', 'T5.STP', ['decMeasure']),
  L(13, 2, 'Làm tròn số thập phân', 'Làm tròn đến số tự nhiên gần nhất, hàng phần mười, phần trăm.', 'T5.STP', ['decRound']),
  L(14, 2, 'Luyện tập chung', 'Đọc, viết, so sánh, làm tròn số thập phân.', 'T5.STP', ['decConcept', 'decCompare', 'decMeasure', 'decRound']),
  L(15, 3, 'Ki-lô-mét vuông. Héc-ta', '1 km² = 1 000 000 m²; 1 ha = 10 000 m².', 'T5.DL', ['kmHa']),
  L(16, 3, 'Các đơn vị đo diện tích', 'Hai đơn vị liền nhau gấp, kém nhau 100 lần.', 'T5.DL', ['areaUnits']),
  L(17, 3, 'Thực hành và trải nghiệm với một số đơn vị đo đại lượng', 'Ước lượng, đổi đơn vị đo diện tích.', 'T5.DL', ['kmHa', 'areaUnits']),
  L(18, 3, 'Luyện tập chung', 'Đổi đơn vị đo diện tích; so sánh diện tích.', 'T5.DL', ['kmHa', 'areaUnits', 'decMeasure']),
  L(19, 4, 'Phép cộng số thập phân', 'Đặt tính thẳng hàng, dấu phẩy thẳng cột.', 'T5.STP', ['decAdd']),
  L(20, 4, 'Phép trừ số thập phân', 'Trừ hai số thập phân; tìm thành phần chưa biết.', 'T5.STP', ['decSub']),
  L(21, 4, 'Phép nhân số thập phân', 'Nhân số thập phân với số tự nhiên, với số thập phân.', 'T5.STP', ['decMul']),
  L(22, 4, 'Phép chia số thập phân', 'Chia số thập phân cho số tự nhiên, cho số thập phân.', 'T5.STP', ['decDiv']),
  L(23, 4, 'Nhân, chia số thập phân với 10; 100; 1000;... hoặc với 0,1; 0,01; 0,001;...', 'Dời dấu phẩy sang phải, sang trái.', 'T5.STP', ['decPow10']),
  L(24, 4, 'Luyện tập chung', 'Bốn phép tính với số thập phân; bài toán có lời văn.', 'T5.STP', ['decAdd', 'decSub', 'decMul', 'decDiv', 'decPow10']),
  L(25, 5, 'Hình tam giác. Diện tích hình tam giác', 'S = a × h : 2.', 'T5.HH', ['triangle']),
  L(26, 5, 'Hình thang. Diện tích hình thang', 'S = (a + b) × h : 2.', 'T5.HH', ['trapezoid']),
  L(27, 5, 'Đường tròn. Chu vi và diện tích hình tròn', 'C = d × 3,14; S = r × r × 3,14.', 'T5.HH', ['circle']),
  L(28, 5, 'Thực hành và trải nghiệm đo, vẽ, lắp ghép, tạo hình', 'Tính diện tích hình ghép.', 'T5.HH', ['triangle', 'trapezoid', 'circle']),
  L(29, 5, 'Luyện tập chung', 'Diện tích tam giác, hình thang, hình tròn.', 'T5.HH', ['triangle', 'trapezoid', 'circle']),
  L(30, 6, 'Ôn tập số thập phân', 'Đọc, viết, so sánh, làm tròn số thập phân.', 'T5.STP', ['decConcept', 'decCompare', 'decRound']),
  L(31, 6, 'Ôn tập các phép tính với số thập phân', 'Cộng, trừ, nhân, chia số thập phân.', 'T5.STP', ['decAdd', 'decSub', 'decMul', 'decDiv']),
  L(32, 6, 'Ôn tập một số hình phẳng', 'Tam giác, hình thang, hình tròn.', 'T5.HH', ['triangle', 'trapezoid', 'circle']),
  L(33, 6, 'Ôn tập diện tích, chu vi một số hình phẳng', 'Chu vi, diện tích các hình đã học.', 'T5.HH', ['triangle', 'trapezoid', 'circle', 'geoRev']),
  L(34, 6, 'Ôn tập đo lường', 'Đơn vị đo độ dài, khối lượng, diện tích.', 'T5.DL', ['decMeasure', 'areaUnits', 'kmHa']),
  L(35, 6, 'Ôn tập chung', 'Ôn tập học kì 1.', 'T5.STP', ['decAdd', 'decMul', 'decDiv', 'triangle', 'circle', 'areaUnits']),
  L(36, 7, 'Tỉ số. Tỉ số phần trăm', 'Tỉ số a : b; tỉ số phần trăm.', 'T5.TS', ['ratio']),
  L(37, 7, 'Tỉ lệ bản đồ và ứng dụng', 'Tính độ dài thật từ bản đồ và ngược lại.', 'T5.TS', ['mapScale']),
  L(38, 7, 'Tìm hai số khi biết tổng và tỉ số của hai số đó', 'Sơ đồ đoạn thẳng; tổng số phần.', 'T5.TS', ['sumRatio']),
  L(39, 7, 'Tìm hai số khi biết hiệu và tỉ số của hai số đó', 'Sơ đồ đoạn thẳng; hiệu số phần.', 'T5.TS', ['diffRatio']),
  L(40, 7, 'Tìm tỉ số phần trăm của hai số', 'a : b × 100 %.', 'T5.TS', ['pctOf']),
  L(41, 7, 'Tìm giá trị phần trăm của một số', 'Tìm a % của một số.', 'T5.TS', ['pctValue']),
  L(42, 7, 'Máy tính cầm tay', 'Dùng máy tính để tính, tính tỉ số phần trăm.', 'T5.TS', ['pctOf', 'pctValue']),
  L(43, 7, 'Thực hành và trải nghiệm sử dụng máy tính cầm tay', 'Tính toán tình huống thực tế.', 'T5.TS', ['pctOf', 'pctValue', 'ratio']),
  L(44, 7, 'Luyện tập chung', 'Tỉ số, tổng – tỉ, hiệu – tỉ, tỉ số phần trăm.', 'T5.TS', ['ratio', 'sumRatio', 'diffRatio', 'pctOf', 'pctValue']),
  L(45, 8, 'Thể tích của một hình', 'So sánh thể tích bằng số hình lập phương nhỏ.', 'T5.HH', ['volume']),
  L(46, 8, 'Xăng-ti-mét khối. Đề-xi-mét khối', '1 dm³ = 1000 cm³.', 'T5.DL', ['volUnits']),
  L(47, 8, 'Mét khối', '1 m³ = 1000 dm³.', 'T5.DL', ['volUnits']),
  L(48, 8, 'Luyện tập chung', 'Thể tích; đổi đơn vị đo thể tích.', 'T5.DL', ['volume', 'volUnits']),
  L(49, 9, 'Hình khai triển của hình lập phương, hình hộp chữ nhật và hình trụ', 'Nhận biết hình khai triển.', 'T5.HH', ['net']),
  L(50, 9, 'Diện tích xung quanh và diện tích toàn phần của hình hộp chữ nhật', 'Sxq = chu vi đáy × chiều cao.', 'T5.HH', ['boxArea']),
  L(51, 9, 'Diện tích xung quanh và diện tích toàn phần của hình lập phương', 'Sxq = a × a × 4; Stp = a × a × 6.', 'T5.HH', ['cubeArea']),
  L(52, 9, 'Thể tích của hình hộp chữ nhật', 'V = a × b × c.', 'T5.HH', ['boxVol']),
  L(53, 9, 'Thể tích của hình lập phương', 'V = a × a × a.', 'T5.HH', ['cubeVol']),
  L(54, 9, 'Thực hành tính toán và ước lượng thể tích một số hình khối', 'Thể tích bể nước, hộp quà…', 'T5.HH', ['boxVol', 'cubeVol', 'volUnits']),
  L(55, 9, 'Luyện tập chung', 'Diện tích, thể tích hình hộp chữ nhật, hình lập phương.', 'T5.HH', ['boxArea', 'cubeArea', 'boxVol', 'cubeVol']),
  L(56, 10, 'Các đơn vị đo thời gian', 'Thế kỉ, năm, tháng, ngày, giờ, phút, giây.', 'T5.DL', ['timeUnits']),
  L(57, 10, 'Cộng, trừ số đo thời gian', 'Cộng, trừ theo từng loại đơn vị.', 'T5.DL', ['timeAddSub']),
  L(58, 10, 'Nhân, chia số đo thời gian với một số', 'Nhân, chia từng loại đơn vị.', 'T5.DL', ['timeMulDiv']),
  L(59, 10, 'Vận tốc của một chuyển động đều', 'v = s : t.', 'T5.DL', ['speed']),
  L(60, 10, 'Quãng đường, thời gian của một chuyển động đều', 's = v × t; t = s : v.', 'T5.DL', ['distTime']),
  L(61, 10, 'Thực hành tính toán và ước lượng về vận tốc, quãng đường, thời gian trong chuyển động đều', 'Tình huống chuyển động thực tế.', 'T5.DL', ['speed', 'distTime']),
  L(62, 10, 'Luyện tập chung', 'Số đo thời gian; vận tốc, quãng đường, thời gian.', 'T5.DL', ['timeAddSub', 'timeMulDiv', 'speed', 'distTime']),
  L(63, 11, 'Thu thập, phân loại, sắp xếp các số liệu', 'Bảng số liệu; số lớn nhất, bé nhất, trung bình.', 'T5.TK', ['dataSort']),
  L(64, 11, 'Biểu đồ hình quạt tròn', 'Đọc tỉ số phần trăm trên biểu đồ hình quạt.', 'T5.TK', ['pieChart']),
  L(65, 11, 'Tỉ số của số lần lặp lại một sự kiện so với tổng số lần thực hiện', 'Viết tỉ số dưới dạng phân số, phần trăm.', 'T5.TK', ['eventRatio']),
  L(66, 11, 'Thực hành và trải nghiệm thu thập, phân tích, biểu diễn các số liệu thống kê', 'Phân tích số liệu thực tế.', 'T5.TK', ['dataSort', 'pieChart']),
  L(67, 11, 'Luyện tập chung', 'Số liệu, biểu đồ hình quạt, tỉ số số lần lặp lại.', 'T5.TK', ['dataSort', 'pieChart', 'eventRatio']),
  L(68, 12, 'Ôn tập số tự nhiên, phân số, số thập phân', 'Đọc, viết, so sánh các loại số.', 'T5.SO', ['natRev', 'fracRev', 'decCompare', 'mixed']),
  L(69, 12, 'Ôn tập các phép tính với số tự nhiên, phân số, số thập phân', 'Bốn phép tính.', 'T5.STP', ['natOps', 'fracOps', 'decAdd', 'decMul', 'decDiv']),
  L(70, 12, 'Ôn tập tỉ số, tỉ số phần trăm', 'Tổng – tỉ, hiệu – tỉ; phần trăm.', 'T5.TS', ['ratio', 'sumRatio', 'diffRatio', 'pctOf', 'pctValue']),
  L(71, 12, 'Ôn tập hình học', 'Hình phẳng và hình khối.', 'T5.HH', ['triangle', 'trapezoid', 'circle', 'boxArea', 'boxVol', 'cubeVol']),
  L(72, 12, 'Ôn tập đo lường', 'Đơn vị đo diện tích, thể tích, thời gian.', 'T5.DL', ['areaUnits', 'volUnits', 'timeUnits', 'decMeasure']),
  L(73, 12, 'Ôn tập toán chuyển động đều', 'Vận tốc, quãng đường, thời gian.', 'T5.DL', ['speed', 'distTime', 'timeAddSub']),
  L(74, 12, 'Ôn tập một số yếu tố thống kê và xác suất', 'Số liệu, biểu đồ, tỉ số sự kiện.', 'T5.TK', ['dataSort', 'pieChart', 'eventRatio']),
  L(75, 12, 'Ôn tập chung', 'Ôn tập cuối năm.', 'T5.TD', ['decMul', 'pctValue', 'sumRatio', 'boxVol', 'distTime', 'circle']),
];

export const t5Id = (no: number) => `toan5-kntt-b${String(no).padStart(2, '0')}`;
