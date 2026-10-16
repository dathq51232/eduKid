// TOÁN 2 (Kết nối tri thức với cuộc sống) — khung 75 bài theo mục lục sách (tên chủ đề, tên bài, thứ tự bài).
// Không chép bài tập của sách: câu hỏi do bộ sinh câu EduChain Kids tạo (src/lib/practice/toan2.ts).
// Mỗi bài có: phạm vi kiến thức (scope, kiểm tra "không vượt trước") và các mảng kiến thức (topics) để chọn dạng câu.

import type { Scope } from './types';

export type T2Topic =
  | 'num100' | 'ray' | 'parts' | 'diff' | 'add100nc'
  | 'add20' | 'sub20' | 'table20' | 'word20' | 'more20'
  | 'kg' | 'litre'
  | 'add21' | 'add22' | 'sub21' | 'sub22' | 'word100'
  | 'geo' | 'polyline' | 'quad' | 'time' | 'date'
  | 'mulMeaning' | 'mulParts' | 'mul2' | 'mul5' | 'divMeaning' | 'divParts' | 'div2' | 'div5' | 'mulWord' | 'solid'
  | 'place' | 'round' | 'roundCmp' | 'num1000' | 'expand' | 'cmp1000' | 'length' | 'money'
  | 'add3nc' | 'add3c' | 'sub3nc' | 'sub3c' | 'word1000' | 'tally' | 'picto' | 'chance';

export type T2Lesson = { no: number; chapter: number; title: string; description: string; topics: T2Topic[]; scope: Extract<Scope, { kind: 'math2' }>; topicCode: string };

export const T2_CHAPTERS: Record<number, string> = {
  1: 'Chủ đề 1. Ôn tập và bổ sung',
  2: 'Chủ đề 2. Phép cộng, phép trừ trong phạm vi 20',
  3: 'Chủ đề 3. Làm quen với khối lượng, dung tích',
  4: 'Chủ đề 4. Phép cộng, phép trừ (có nhớ) trong phạm vi 100',
  5: 'Chủ đề 5. Làm quen với hình phẳng',
  6: 'Chủ đề 6. Ngày – giờ, giờ – phút, ngày – tháng',
  7: 'Chủ đề 7. Ôn tập học kì 1',
  8: 'Chủ đề 8. Phép nhân, phép chia',
  9: 'Chủ đề 9. Làm quen với hình khối',
  10: 'Chủ đề 10. Các số trong phạm vi 1000',
  11: 'Chủ đề 11. Độ dài và đơn vị đo độ dài. Tiền Việt Nam',
  12: 'Chủ đề 12. Phép cộng, phép trừ trong phạm vi 1000',
  13: 'Chủ đề 13. Làm quen với yếu tố thống kê, xác suất',
  14: 'Chủ đề 14. Ôn tập cuối năm',
};

const PM = ['+', '-'] as const;
const S1 = { kind: 'math2', maxNumber: 100, ops: PM, carry: false } as const; // ôn tập: cộng, trừ không nhớ
const S2 = { kind: 'math2', maxNumber: 100, ops: PM, carry: true, carryMax: 20 } as const; // qua 10 trong phạm vi 20
const S3 = { kind: 'math2', maxNumber: 100, ops: PM, carry: true, carryMax: 100 } as const; // có nhớ trong phạm vi 100
const S4M = { kind: 'math2', maxNumber: 100, ops: ['+', '-', '×'], carry: true, carryMax: 100, tables: [2, 5] } as const;
const S4 = { kind: 'math2', maxNumber: 100, ops: ['+', '-', '×', ':'], carry: true, carryMax: 100, tables: [2, 5] } as const;
const S5 = { kind: 'math2', maxNumber: 1000, ops: ['+', '-', '×', ':'], carry: true, carryMax: 100, tables: [2, 5] } as const;
const S6 = { kind: 'math2', maxNumber: 1000, ops: ['+', '-', '×', ':'], carry: true, carryMax: 1000, tables: [2, 5] } as const;

const L = (no: number, chapter: number, title: string, description: string, topicCode: string, scope: T2Lesson['scope'], topics: T2Topic[]): T2Lesson =>
  ({ no, chapter, title, description, topics, scope, topicCode });

const HK1_ALL: T2Topic[] = ['num100', 'diff', 'add20', 'sub20', 'add22', 'sub22', 'word100', 'kg', 'litre', 'polyline', 'time', 'date'];

export const T2_LESSONS: T2Lesson[] = [
  L(1, 1, 'Ôn tập các số đến 100', 'Đọc, viết, cấu tạo, so sánh các số đến 100.', 'T2.SO', S1, ['num100']),
  L(2, 1, 'Tia số. Số liền trước, số liền sau', 'Đọc tia số; tìm số liền trước, số liền sau.', 'T2.SO', S1, ['ray', 'num100']),
  L(3, 1, 'Các thành phần của phép cộng, phép trừ', 'Số hạng, tổng; số bị trừ, số trừ, hiệu.', 'T2.PT', S1, ['parts', 'add100nc']),
  L(4, 1, 'Hơn, kém nhau bao nhiêu', 'Tìm hai số hơn, kém nhau bao nhiêu đơn vị.', 'T2.PT', S1, ['diff']),
  L(5, 1, 'Ôn tập phép cộng, phép trừ (không nhớ) trong phạm vi 100', 'Đặt tính, tính nhẩm cộng trừ không nhớ.', 'T2.PT', S1, ['add100nc']),
  L(6, 1, 'Luyện tập chung', 'Ôn các số đến 100, thành phần phép tính, hơn kém.', 'T2.PT', S1, ['num100', 'parts', 'diff', 'add100nc']),
  L(7, 2, 'Phép cộng (qua 10) trong phạm vi 20', 'Cộng qua 10 bằng cách tách để làm tròn 10.', 'T2.PT', S2, ['add20']),
  L(8, 2, 'Bảng cộng (qua 10)', 'Thuộc bảng cộng qua 10; tính nhẩm.', 'T2.PT', S2, ['add20', 'table20']),
  L(9, 2, 'Bài toán về thêm, bớt một số đơn vị', 'Giải bài toán thêm, bớt một số đơn vị.', 'T2.PT', S2, ['word20']),
  L(10, 2, 'Luyện tập chung', 'Cộng qua 10, bảng cộng, bài toán thêm bớt.', 'T2.PT', S2, ['add20', 'table20', 'word20']),
  L(11, 2, 'Phép trừ (qua 10) trong phạm vi 20', 'Trừ qua 10 bằng cách tách số.', 'T2.PT', S2, ['sub20']),
  L(12, 2, 'Bảng trừ (qua 10)', 'Thuộc bảng trừ qua 10; tính nhẩm.', 'T2.PT', S2, ['sub20', 'table20']),
  L(13, 2, 'Bài toán về nhiều hơn, ít hơn một số đơn vị', 'Giải bài toán nhiều hơn, ít hơn.', 'T2.PT', S2, ['more20']),
  L(14, 2, 'Luyện tập chung', 'Cộng, trừ qua 10 trong phạm vi 20; bài toán có lời văn.', 'T2.PT', S2, ['add20', 'sub20', 'word20', 'more20']),
  L(15, 3, 'Ki-lô-gam', 'Nặng hơn, nhẹ hơn; đơn vị ki-lô-gam.', 'T2.DL', S2, ['kg']),
  L(16, 3, 'Lít', 'Nhiều hơn, ít hơn; đơn vị lít.', 'T2.DL', S2, ['litre']),
  L(17, 3, 'Thực hành và trải nghiệm với các đơn vị ki-lô-gam, lít', 'Ước lượng, tính với kg và lít.', 'T2.DL', S2, ['kg', 'litre']),
  L(18, 3, 'Luyện tập chung', 'Ki-lô-gam, lít; cộng trừ trong phạm vi 20.', 'T2.DL', S2, ['kg', 'litre', 'add20', 'sub20']),
  L(19, 4, 'Phép cộng (có nhớ) số có hai chữ số với số có một chữ số', 'Đặt tính và tính cộng có nhớ.', 'T2.PT', S3, ['add21']),
  L(20, 4, 'Phép cộng (có nhớ) số có hai chữ số với số có hai chữ số', 'Đặt tính và tính cộng có nhớ hai chữ số.', 'T2.PT', S3, ['add22']),
  L(21, 4, 'Luyện tập chung', 'Cộng có nhớ trong phạm vi 100.', 'T2.PT', S3, ['add21', 'add22']),
  L(22, 4, 'Phép trừ (có nhớ) số có hai chữ số cho số có một chữ số', 'Đặt tính và tính trừ có nhớ.', 'T2.PT', S3, ['sub21']),
  L(23, 4, 'Phép trừ (có nhớ) số có hai chữ số cho số có hai chữ số', 'Đặt tính và tính trừ có nhớ hai chữ số.', 'T2.PT', S3, ['sub22']),
  L(24, 4, 'Luyện tập chung', 'Cộng, trừ có nhớ trong phạm vi 100; bài toán.', 'T2.PT', S3, ['add22', 'sub22', 'word100']),
  L(25, 5, 'Điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng', 'Nhận biết điểm, đoạn thẳng, đường thẳng, đường cong.', 'T2.HH', S3, ['geo']),
  L(26, 5, 'Đường gấp khúc. Hình tứ giác', 'Độ dài đường gấp khúc; hình tứ giác.', 'T2.HH', S3, ['polyline', 'quad']),
  L(27, 5, 'Thực hành gấp, cắt, ghép, xếp hình. Vẽ đoạn thẳng', 'Ghép hình, vẽ đoạn thẳng có độ dài cho trước.', 'T2.HH', S3, ['geo', 'quad']),
  L(28, 5, 'Luyện tập chung', 'Ôn hình phẳng, đường gấp khúc.', 'T2.HH', S3, ['geo', 'polyline', 'quad']),
  L(29, 6, 'Ngày – giờ, giờ – phút', 'Một ngày 24 giờ, một giờ 60 phút; xem đồng hồ.', 'T2.DL', S3, ['time']),
  L(30, 6, 'Ngày – tháng', 'Xem lịch tháng; số ngày trong tháng.', 'T2.DL', S3, ['date']),
  L(31, 6, 'Thực hành và trải nghiệm xem đồng hồ, xem lịch', 'Xem giờ, xem lịch trong đời sống.', 'T2.DL', S3, ['time', 'date']),
  L(32, 6, 'Luyện tập chung', 'Giờ, phút, ngày, tháng; bài toán.', 'T2.DL', S3, ['time', 'date', 'word100']),
  L(33, 7, 'Ôn tập phép cộng, phép trừ trong phạm vi 20, 100', 'Ôn cộng, trừ; bài toán có lời văn.', 'T2.PT', S3, ['add20', 'sub20', 'add22', 'sub22', 'word100']),
  L(34, 7, 'Ôn tập hình phẳng', 'Ôn điểm, đoạn thẳng, đường gấp khúc, hình tứ giác.', 'T2.HH', S3, ['geo', 'polyline', 'quad']),
  L(35, 7, 'Ôn tập đo lường', 'Ôn ki-lô-gam, lít, giờ, lịch.', 'T2.DL', S3, ['kg', 'litre', 'time', 'date']),
  L(36, 7, 'Ôn tập chung', 'Ôn tập học kì 1.', 'T2.PT', S3, HK1_ALL),
  L(37, 8, 'Phép nhân', 'Phép nhân là cộng các số hạng bằng nhau.', 'T2.NC', S4M, ['mulMeaning']),
  L(38, 8, 'Thừa số, tích', 'Thừa số, tích; viết phép nhân từ tổng.', 'T2.NC', S4M, ['mulParts', 'mulMeaning']),
  L(39, 8, 'Bảng nhân 2', 'Thuộc bảng nhân 2; bài toán nhân.', 'T2.NC', S4M, ['mul2']),
  L(40, 8, 'Bảng nhân 5', 'Thuộc bảng nhân 5; bài toán nhân.', 'T2.NC', S4M, ['mul5', 'mul2']),
  L(41, 8, 'Phép chia', 'Chia đều thành các phần bằng nhau.', 'T2.NC', S4, ['divMeaning']),
  L(42, 8, 'Số bị chia, số chia, thương', 'Tên gọi thành phần phép chia.', 'T2.NC', S4, ['divParts']),
  L(43, 8, 'Bảng chia 2', 'Thuộc bảng chia 2; bài toán chia.', 'T2.NC', S4, ['div2']),
  L(44, 8, 'Bảng chia 5', 'Thuộc bảng chia 5; bài toán chia.', 'T2.NC', S4, ['div5', 'div2']),
  L(45, 8, 'Luyện tập chung', 'Nhân, chia trong bảng 2, 5; bài toán.', 'T2.NC', S4, ['mul2', 'mul5', 'div2', 'div5', 'mulWord']),
  L(46, 9, 'Khối trụ, khối cầu', 'Nhận biết khối trụ, khối cầu.', 'T2.HH', S4, ['solid']),
  L(47, 9, 'Luyện tập chung', 'Hình khối; nhân, chia.', 'T2.HH', S4, ['solid', 'mulWord']),
  L(48, 10, 'Đơn vị, chục, trăm, nghìn', '10 đơn vị = 1 chục, 10 chục = 1 trăm, 10 trăm = 1 nghìn.', 'T2.SO', S5, ['place']),
  L(49, 10, 'Các số tròn trăm, tròn chục', 'Đọc, viết số tròn trăm, tròn chục.', 'T2.SO', S5, ['round']),
  L(50, 10, 'So sánh các số tròn trăm, tròn chục', 'So sánh số tròn trăm, tròn chục.', 'T2.SO', S5, ['roundCmp', 'round']),
  L(51, 10, 'Số có ba chữ số', 'Đọc, viết số có ba chữ số.', 'T2.SO', S5, ['num1000']),
  L(52, 10, 'Viết số thành tổng các trăm, chục, đơn vị', 'Viết số thành tổng trăm, chục, đơn vị.', 'T2.SO', S5, ['expand']),
  L(53, 10, 'So sánh các số có ba chữ số', 'So sánh, xếp thứ tự số có ba chữ số.', 'T2.SO', S5, ['cmp1000']),
  L(54, 10, 'Luyện tập chung', 'Số có ba chữ số.', 'T2.SO', S5, ['num1000', 'expand', 'cmp1000']),
  L(55, 11, 'Đề-xi-mét. Mét. Ki-lô-mét', 'Đơn vị đo độ dài và quan hệ giữa các đơn vị.', 'T2.DL', S5, ['length']),
  L(56, 11, 'Giới thiệu tiền Việt Nam', 'Một số tờ tiền; đổi tiền đơn giản.', 'T2.DL', S5, ['money']),
  L(57, 11, 'Thực hành và trải nghiệm đo độ dài', 'Ước lượng, đo độ dài.', 'T2.DL', S5, ['length']),
  L(58, 11, 'Luyện tập chung', 'Độ dài; tiền Việt Nam.', 'T2.DL', S5, ['length', 'money']),
  L(59, 12, 'Phép cộng (không nhớ) trong phạm vi 1000', 'Đặt tính, tính cộng không nhớ số có ba chữ số.', 'T2.PT', S5, ['add3nc']),
  L(60, 12, 'Phép cộng (có nhớ) trong phạm vi 1000', 'Cộng có nhớ số có ba chữ số.', 'T2.PT', S6, ['add3c']),
  L(61, 12, 'Phép trừ (không nhớ) trong phạm vi 1000', 'Trừ không nhớ số có ba chữ số.', 'T2.PT', S6, ['sub3nc']),
  L(62, 12, 'Phép trừ (có nhớ) trong phạm vi 1000', 'Trừ có nhớ số có ba chữ số.', 'T2.PT', S6, ['sub3c']),
  L(63, 12, 'Luyện tập chung', 'Cộng, trừ trong phạm vi 1000; bài toán.', 'T2.PT', S6, ['add3c', 'sub3c', 'word1000']),
  L(64, 13, 'Thu thập, phân loại, kiểm đếm số liệu', 'Kiểm đếm và ghi số liệu.', 'T2.TK', S6, ['tally']),
  L(65, 13, 'Biểu đồ tranh', 'Đọc và nhận xét biểu đồ tranh.', 'T2.TK', S6, ['picto']),
  L(66, 13, 'Chắc chắn, có thể, không thể', 'Khả năng xảy ra của một sự kiện.', 'T2.TK', S6, ['chance']),
  L(67, 13, 'Thực hành và trải nghiệm thu thập, phân loại, kiểm đếm số liệu', 'Kiểm đếm, biểu đồ tranh.', 'T2.TK', S6, ['tally', 'picto']),
  L(68, 14, 'Ôn tập các số trong phạm vi 1000', 'Ôn đọc, viết, so sánh số.', 'T2.SO', S6, ['num1000', 'expand', 'cmp1000']),
  L(69, 14, 'Ôn tập phép cộng, phép trừ trong phạm vi 100', 'Ôn cộng, trừ có nhớ trong phạm vi 100.', 'T2.PT', S6, ['add22', 'sub22', 'word100']),
  L(70, 14, 'Ôn tập phép cộng, phép trừ trong phạm vi 1000', 'Ôn cộng, trừ trong phạm vi 1000.', 'T2.PT', S6, ['add3c', 'sub3c', 'word1000']),
  L(71, 14, 'Ôn tập phép nhân, phép chia', 'Ôn bảng nhân, chia 2 và 5.', 'T2.NC', S6, ['mul2', 'mul5', 'div2', 'div5', 'mulWord']),
  L(72, 14, 'Ôn tập hình học', 'Ôn hình phẳng, hình khối.', 'T2.HH', S6, ['geo', 'polyline', 'quad', 'solid']),
  L(73, 14, 'Ôn tập đo lường', 'Ôn khối lượng, dung tích, độ dài, thời gian, tiền.', 'T2.DL', S6, ['kg', 'litre', 'length', 'money', 'time', 'date']),
  L(74, 14, 'Ôn tập kiểm đếm số liệu và lựa chọn khả năng', 'Ôn kiểm đếm, biểu đồ tranh, khả năng.', 'T2.TK', S6, ['tally', 'picto', 'chance']),
  L(75, 14, 'Ôn tập chung', 'Ôn tập cuối năm.', 'T2.PT', S6, ['cmp1000', 'add3c', 'sub3c', 'mulWord', 'length', 'polyline', 'picto']),
];

export const t2Id = (no: number) => `toan2-kntt-b${String(no).padStart(2, '0')}`;
