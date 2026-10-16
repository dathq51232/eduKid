// TOÁN 1 — HỌC KỲ 2 — bám trình tự sách Toán 1 tập hai (Kết nối tri thức với cuộc sống), Bài 21–41.
// Câu hỏi tự soạn theo mục tiêu từng bài trong sách giáo viên; không chép bài tập, tranh hay số liệu của sách.
// Phạm vi số và loại phép tính của từng bài được kiểm tra tự động (scripts/check-content.ts):
//   Bài 21–22 số đến 99, từ Bài 23 số đến 100; trước Bài 29 chỉ có phép tính trong phạm vi 10;
//   Bài 29 cộng số có hai chữ số với số có một chữ số; Bài 30 cộng hai số có hai chữ số;
//   Bài 31 trừ cho số có một chữ số; từ Bài 32 cộng, trừ trong phạm vi 100 — luôn KHÔNG NHỚ.

import { fb, mc, mt, ord, rep, sc, tf, type ContentLesson } from './types';

const BOOK = 'Kết nối tri thức';
const C6 = { code: 'KNTT.T1.CD6', title: 'Chủ đề 6. Các số đến 100' };
const C7 = { code: 'KNTT.T1.CD7', title: 'Chủ đề 7. Độ dài và đo độ dài' };
const C8 = { code: 'KNTT.T1.CD8', title: 'Chủ đề 8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100' };
const C9 = { code: 'KNTT.T1.CD9', title: 'Chủ đề 9. Thời gian, giờ và lịch' };
const C10 = { code: 'KNTT.T1.CD10', title: 'Chủ đề 10. Ôn tập cuối năm' };

const L = (
  no: number,
  unit: { code: string; title: string },
  title: string,
  description: string,
  topicCode: string,
  scope: ContentLesson['scope'],
  questions: ContentLesson['questions'],
): ContentLesson => ({
  id: `toan1-kntt-b${String(no).padStart(2, '0')}`,
  subject: 'toan',
  grade: 1,
  semester: 2,
  book: BOOK,
  ref: `Bài ${no}`,
  unit,
  topicCode,
  title: `Bài ${no}. ${title}`,
  description,
  scope,
  questions,
});

const N99 = { kind: 'math', maxNumber: 99, ops: ['+', '-'], pt2: 'none' } as const;
const N100 = { kind: 'math', maxNumber: 100, ops: ['+', '-'], pt2: 'none' } as const;
const ADD1 = { kind: 'math', maxNumber: 100, ops: ['+', '-'], pt2: 'add1' } as const;
const ADD2 = { kind: 'math', maxNumber: 100, ops: ['+', '-'], pt2: 'add' } as const;
const SUB1 = { kind: 'math', maxNumber: 100, ops: ['+', '-'], pt2: 'sub1' } as const;
const ALL = { kind: 'math', maxNumber: 100, ops: ['+', '-'], pt2: 'all' } as const;
const N10 = { kind: 'math', maxNumber: 10, ops: ['+', '-'] } as const;

const BO = '🎋'; // một bó que tính (1 chục)
const QT = '❘'; // một que tính lẻ

export const TOAN1_HK2: ContentLesson[] = [
  // ======================= CHỦ ĐỀ 6. CÁC SỐ ĐẾN 100 =======================
  L(21, C6, 'Số có hai chữ số', 'Đọc, viết số có hai chữ số; chục và đơn vị; số tròn chục.', 'T1.SO', N99, [
    sc(`${rep(BO, 3)} ${rep(QT, 4)}\nMỗi 🎋 là một bó 1 chục que tính, mỗi ❘ là một que tính lẻ. Có tất cả bao nhiêu que tính?`, ['7', '34', '43', '30'], '34', {
      o: 'T1.SO.05', f: 'TOAN.DEM', l: 1, k: 'chuc_don_vi', e: '3 bó là 3 chục, thêm 4 que lẻ: 34 que tính.',
    }),
    fb('Số gồm 5 chục và 2 đơn vị là số nào?', ['52'], { o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 1, k: 'chuc_don_vi', e: '5 chục và 2 đơn vị viết là 52.' }),
    sc('Số 71 đọc là:', ['bảy mươi một', 'bảy mươi mốt', 'mười bảy'], 'bảy mươi mốt', { o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 2, k: 'doc_so', e: '71 đọc là "bảy mươi mốt" (từ 21 trở đi, 1 đơn vị đọc là "mốt").' }),
    fb('"Sáu mươi lăm" viết là số nào?', ['65'], { o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 2, k: 'doc_so', e: 'Sáu chục và năm đơn vị: 65.' }),
    mc('Chọn tất cả các số tròn chục.', ['40', '44', '70', '17', '90'], ['40', '70', '90'], {
      o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 2, k: 'tron_chuc', e: 'Số tròn chục có 0 đơn vị: 40, 70, 90.',
    }),
    fb('Số 86 gồm mấy chục? (chỉ viết số)', ['8'], {
      o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 3, k: 'chuc_don_vi', e: '86 gồm 8 chục và 6 đơn vị.',
      s: 'Trong số 86, chữ số bên trái (8) chỉ số chục, chữ số bên phải (6) chỉ số đơn vị. Vậy 86 gồm 8 chục.',
    }),
    ord('Xếp các số theo thứ tự đếm (từ bé đến lớn): 29, 27, 30, 28', ['27', '28', '29', '30'], {
      o: 'T1.SO.04', f: 'TOAN.SAPXEP', l: 3, k: 'thu_tu_so', e: 'Đếm: 27, 28, 29, 30.',
      s: 'Đếm thêm 1 từ số bé nhất: 27, 28, 29, rồi đến 30 (đủ 3 chục).',
    }),
    mt('Ghép số với cách đọc.', [['15', 'Mười lăm'], ['51', 'Năm mươi mốt'], ['55', 'Năm mươi lăm']], {
      o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 4, k: 'doc_so', e: '15: mười lăm; 51: năm mươi mốt; 55: năm mươi lăm.',
      s: 'Đọc số chục trước rồi số đơn vị. Chữ số 1 ở hàng đơn vị (từ 21) đọc là "mốt", chữ số 5 ở hàng đơn vị đọc là "lăm".',
    }),
    tf('Số 90 gồm 9 chục và 0 đơn vị. Đúng hay sai?', 'Đúng', { o: 'T1.SO.05', f: 'TOAN.DUNGSAI', l: 3, k: 'tron_chuc', e: '90 là số tròn chục: 9 chục, 0 đơn vị.', s: 'Số tròn chục có chữ số hàng đơn vị là 0. 90 có 9 chục và 0 đơn vị nên câu này đúng.' }),
    mc('Có ba tấm thẻ 4, 0, 6. Ghép hai thẻ (mỗi thẻ dùng một lần) được những số có hai chữ số nào?', ['40', '46', '64', '60', '44', '06'], ['40', '46', '64', '60'], {
      o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 5, k: 'lap_so', e: 'Ghép được 40, 46, 60, 64.',
      s: 'Chữ số hàng chục chỉ có thể là 4 hoặc 6 (thẻ 0 không đứng đầu). Với 4 đứng đầu: 40, 46. Với 6 đứng đầu: 60, 64. Số 44 phải dùng thẻ 4 hai lần nên không được.',
    }),
  ]),

  L(22, C6, 'So sánh số có hai chữ số', 'So sánh, xếp thứ tự các số có hai chữ số.', 'T1.SO', N99, [
    sc('Chọn dấu thích hợp: 38 ... 83', ['>', '<', '='], '<', { o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 1, k: 'so_sanh_100', e: '38 có 3 chục, 83 có 8 chục: 38 < 83.' }),
    sc('Chọn dấu thích hợp: 67 ... 64', ['>', '<', '='], '>', { o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 1, k: 'so_sanh_100', e: 'Cùng 6 chục; 7 đơn vị > 4 đơn vị: 67 > 64.' }),
    sc('Số nào lớn nhất: 45, 54, 49, 51?', ['45', '54', '49', '51'], '54', { o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 2, k: 'lon_nhat_be_nhat', e: '54 và 51 có 5 chục; 54 > 51. Số lớn nhất là 54.' }),
    sc('Số nào bé nhất: 70, 17, 71, 27?', ['70', '17', '71', '27'], '17', { o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 2, k: 'lon_nhat_be_nhat', e: '17 có ít chục nhất (1 chục).' }),
    ord('Xếp các số theo thứ tự từ bé đến lớn: 62, 26, 60, 29', ['26', '29', '60', '62'], {
      o: 'T1.SO.06', f: 'TOAN.SAPXEP', l: 3, k: 'sap_xep_100', e: '26 < 29 < 60 < 62.',
      s: 'So sánh số chục: 26, 29 có 2 chục; 60, 62 có 6 chục. Trong nhóm 2 chục: 26 < 29. Trong nhóm 6 chục: 60 < 62. Thứ tự: 26, 29, 60, 62.',
    }),
    tf('95 > 59. Đúng hay sai?', 'Đúng', { o: 'T1.SO.06', f: 'TOAN.DUNGSAI', l: 2, k: 'so_sanh_100', e: '95 có 9 chục, 59 có 5 chục.' }),
    sc('Lớp 1A có 33 học sinh, lớp 1B có 30 học sinh, lớp 1C có 35 học sinh. Lớp nào có ít học sinh nhất?', ['Lớp 1A', 'Lớp 1B', 'Lớp 1C'], 'Lớp 1B', {
      o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 4, k: 'lon_nhat_be_nhat', e: '30 < 33 < 35: lớp 1B ít nhất.',
      s: 'Ba số cùng 3 chục, so sánh đơn vị: 0 < 3 < 5. Số bé nhất là 30, của lớp 1B.',
    }),
    mc('Chọn tất cả các số lớn hơn 46 và bé hơn 52.', ['45', '47', '50', '52', '53'], ['47', '50'], {
      o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 5, k: 'so_sanh_100', e: 'Các số từ 47 đến 51 thỏa mãn; trong các lựa chọn có 47 và 50.',
      s: 'Số cần chọn phải lớn hơn 46 (bỏ 45) và bé hơn 52 (bỏ 52, 53). Còn lại 47 và 50.',
    }),
  ]),

  L(23, C6, 'Bảng các số từ 1 đến 100', 'Số 100; bảng các số từ 1 đến 100.', 'T1.SO', N100, [
    sc('99 thêm 1 là số nào?', ['98', '100', '90'], '100', { o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 1, k: 'so_100', e: '99 thêm 1 là 100 (một trăm).' }),
    sc('Số 100 gồm mấy chục?', ['1 chục', '10 chục', '100 chục'], '10 chục', { o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 2, k: 'so_100', e: '100 gồm 10 chục.' }),
    fb('Đếm tiếp: 96, 97, 98, ..., 100. Số còn thiếu là số nào?', ['99'], { o: 'T1.SO.04', f: 'TOAN.SOTHIEU', l: 1, k: 'thu_tu_so', e: 'Sau 98 là 99, sau 99 là 100.' }),
    sc('Số lớn nhất có hai chữ số là số nào?', ['90', '99', '100'], '99', {
      o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 3, k: 'so_100', e: '99 là số lớn nhất có hai chữ số; 100 có ba chữ số.',
      s: 'Số có hai chữ số lớn nhất khi cả hai chữ số đều lớn nhất (9 và 9): 99. Số 100 có ba chữ số.',
    }),
    mc('Chọn tất cả các số có hai chữ số giống nhau.', ['11', '12', '44', '40', '77'], ['11', '44', '77'], {
      o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 3, k: 'bang_100', e: '11, 44, 77 có hai chữ số giống nhau.',
      s: 'Xem chữ số hàng chục và hàng đơn vị của từng số: 11 (1 và 1), 44 (4 và 4), 77 (7 và 7) giống nhau; 12 và 40 thì khác nhau.',
    }),
    fb('Trong bảng các số từ 1 đến 100, số ngay bên dưới số 36 là số nào?', ['46'], {
      o: 'T1.SO.04', f: 'TOAN.SOTHIEU', l: 4, k: 'bang_100', e: 'Xuống một hàng là thêm 1 chục: 46.',
      s: 'Mỗi hàng của bảng có 10 số, nên số ngay bên dưới có cùng chữ số đơn vị và nhiều hơn 1 chục. Dưới 36 là 46.',
    }),
    fb('Đếm thêm 2: 2, 4, 6, 8, ... Số tiếp theo là số nào?', ['10'], {
      o: 'T1.SO.04', f: 'TOAN.SOTHIEU', l: 4, k: 'day_so_quy_luat', e: '8 thêm 2 là 10.',
      s: 'Dãy số cách đều 2: mỗi số sau hơn số trước 2 đơn vị. Sau 8 là 10.',
    }),
    fb('Từ 1 đến 100, có bao nhiêu số tròn chục (kể cả 100)?', ['10'], {
      o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 5, k: 'tron_chuc', e: '10, 20, 30, 40, 50, 60, 70, 80, 90, 100: 10 số.',
      s: 'Các số tròn chục nằm ở cột cuối của bảng các số từ 1 đến 100: 10, 20, …, 90, 100. Mỗi hàng có một số, bảng có 10 hàng: 10 số.',
    }),
  ]),

  L(24, C6, 'Luyện tập chung', 'Ôn số có hai chữ số, so sánh, bảng các số đến 100.', 'T1.SO', N100, [
    fb('Số 47 gồm 4 chục và mấy đơn vị?', ['7'], { o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 1, k: 'chuc_don_vi', e: '47 gồm 4 chục và 7 đơn vị.' }),
    sc('"Ba mươi chín" viết là:', ['93', '39', '30'], '39', { o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 1, k: 'doc_so', e: 'Ba chục, chín đơn vị: 39.' }),
    fb('Tìm số còn thiếu: 10, 20, 30, ..., 50', ['40'], { o: 'T1.SO.05', f: 'TOAN.SOTHIEU', l: 2, k: 'tron_chuc', e: 'Đếm theo chục: 10, 20, 30, 40, 50.' }),
    sc('Số nào lớn hơn trong hai số 63 và 36?', ['63', '36'], '63', { o: 'T1.SO.06', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_100', e: '63 có 6 chục, nhiều hơn 3 chục.' }),
    fb('Tìm số còn thiếu: 5, 10, 15, 20, ...', ['25'], {
      o: 'T1.SO.04', f: 'TOAN.SOTHIEU', l: 3, k: 'day_so_quy_luat', e: 'Mỗi lần thêm 5: sau 20 là 25.',
      s: 'Hai số liền nhau trong dãy cách nhau 5 đơn vị (5, 10, 15, 20). Vậy số tiếp theo là 25.',
    }),
    ord('Xếp các số theo thứ tự từ lớn đến bé: 31, 35, 40', ['40', '35', '31'], {
      o: 'T1.SO.06', f: 'TOAN.SAPXEP', l: 3, k: 'sap_xep_100', e: '40 > 35 > 31.',
      s: '40 có 4 chục nên lớn nhất. 35 và 31 cùng 3 chục, 35 > 31. Thứ tự từ lớn đến bé: 40, 35, 31.',
    }),
    tf('Số liền sau của 79 là 80. Đúng hay sai?', 'Đúng', {
      o: 'T1.SO.04', f: 'TOAN.DUNGSAI', l: 4, k: 'thu_tu_so', e: 'Đếm 79 rồi đến 80.',
      s: '79 thêm 1 thì đủ 8 chục, tức là 80. Câu này đúng.',
    }),
    sc('Một số có hai chữ số, chữ số hàng chục là 5, chữ số hàng đơn vị bé hơn 2. Số đó có thể là:', ['52', '51', '15'], '51', {
      o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 5, k: 'chuc_don_vi', e: '51: 5 chục, 1 đơn vị (1 < 2).',
      s: 'Số cần tìm có dạng 5?, với chữ số đơn vị bé hơn 2 (0 hoặc 1): 50 hoặc 51. Trong các lựa chọn chỉ có 51.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 7. ĐỘ DÀI VÀ ĐO ĐỘ DÀI =======================
  L(25, C7, 'Dài hơn, ngắn hơn', 'So sánh dài hơn – ngắn hơn, cao hơn – thấp hơn.', 'T1.HH', N100, [
    sc('Bút mực dài hơn bút chì. Vậy bút chì … bút mực.', ['dài hơn', 'ngắn hơn'], 'ngắn hơn', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 1, k: 'dai_ngan', e: 'Bút mực dài hơn thì bút chì ngắn hơn.' }),
    sc('Con hươu cao cổ và con mèo, con nào cao hơn?', ['Con hươu cao cổ', 'Con mèo'], 'Con hươu cao cổ', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 1, k: 'cao_thap', e: 'Hươu cao cổ cao hơn mèo rất nhiều.' }),
    sc('🟥🟥🟥🟥🟥\n🟦🟦🟦\nHai băng giấy đặt thẳng một đầu. Băng nào dài hơn?', ['Băng đỏ', 'Băng xanh'], 'Băng đỏ', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 2, k: 'dai_ngan', e: 'Băng đỏ có 5 ô, băng xanh có 3 ô; băng đỏ dài hơn.' }),
    sc('🟩🟩🟩🟩\n🟨🟨🟨🟨🟨🟨\n🟪🟪\nBăng giấy nào ngắn nhất?', ['Băng xanh lá', 'Băng vàng', 'Băng tím'], 'Băng tím', {
      o: 'T1.HH.05', f: 'TOAN.DODAI', l: 3, k: 'dai_ngan', e: 'Băng tím chỉ có 2 ô.', s: 'Các băng đặt thẳng một đầu. Đếm ô: xanh lá 4, vàng 6, tím 2. Băng có ít ô nhất ngắn nhất: băng tím.',
    }),
    tf('Bạn An cao hơn bạn Bình, bạn Bình cao hơn bạn Chi. Vậy bạn Chi thấp nhất. Đúng hay sai?', 'Đúng', {
      o: 'T1.HH.05', f: 'TOAN.DUNGSAI', l: 4, k: 'cao_thap', e: 'An > Bình > Chi về chiều cao: Chi thấp nhất.',
      s: 'An cao hơn Bình, mà Bình lại cao hơn Chi, nên Chi thấp hơn cả hai bạn. Câu này đúng.',
    }),
    sc('Sợi dây đỏ dài hơn sợi dây xanh. Sợi dây vàng ngắn hơn sợi dây xanh. Sợi dây nào dài nhất?', ['Sợi dây đỏ', 'Sợi dây xanh', 'Sợi dây vàng'], 'Sợi dây đỏ', {
      o: 'T1.HH.05', f: 'TOAN.DODAI', l: 5, k: 'dai_ngan', e: 'Đỏ dài hơn xanh, xanh dài hơn vàng: đỏ dài nhất.',
      s: 'Xếp từ dài đến ngắn: đỏ (dài hơn xanh), xanh, vàng (ngắn hơn xanh). Dây dài nhất là dây đỏ.',
    }),
  ]),

  L(26, C7, 'Đơn vị đo độ dài', 'Gang tay, sải tay, bước chân; xăng-ti-mét (cm).', 'T1.HH', N100, [
    sc('Xăng-ti-mét viết tắt là:', ['cm', 'xm', 'm'], 'cm', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 1, k: 'do_cm', e: 'Xăng-ti-mét viết tắt là cm.' }),
    sc('Khi đo bằng thước, em đặt một đầu đồ vật thẳng với vạch nào?', ['Vạch 0', 'Vạch 1', 'Vạch 5'], 'Vạch 0', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 1, k: 'do_cm', e: 'Đặt một đầu thẳng vạch 0, đầu kia chỉ số nào thì vật dài bấy nhiêu xăng-ti-mét.' }),
    fb('Một đầu chiếc bút chì ở vạch 0, đầu kia ở vạch 9 của thước. Bút chì dài bao nhiêu xăng-ti-mét? (chỉ viết số)', ['9'], { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 2, k: 'do_cm', e: 'Đầu kia ở vạch 9: bút dài 9 cm.' }),
    sc('Bút A dài 12 cm, bút B dài 9 cm. Bút nào dài hơn?', ['Bút A', 'Bút B'], 'Bút A', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 2, k: 'do_cm', e: '12 > 9 nên bút A dài hơn.' }),
    sc('Em đo cái bàn được 5 gang tay, đo cái ghế được 3 gang tay. Đồ vật nào dài hơn?', ['Cái bàn', 'Cái ghế'], 'Cái bàn', {
      o: 'T1.HH.06', f: 'TOAN.DODAI', l: 3, k: 'don_vi_tu_quy_uoc', e: 'Cùng đo bằng gang tay: 5 > 3, cái bàn dài hơn.',
      s: 'Hai đồ vật được đo bằng cùng một gang tay nên chỉ cần so sánh số đo: 5 gang tay nhiều hơn 3 gang tay. Cái bàn dài hơn.',
    }),
    sc('Dùng cách nào để đo chiều dài lớp học cho nhanh?', ['Đếm bước chân', 'Đếm gang tay', 'Đếm đốt ngón tay'], 'Đếm bước chân', {
      o: 'T1.HH.06', f: 'TOAN.DODAI', l: 4, k: 'don_vi_tu_quy_uoc', e: 'Lớp học dài, đo bằng bước chân nhanh hơn.',
      s: 'Gang tay và đốt ngón tay rất ngắn so với lớp học nên phải đếm rất nhiều lần. Bước chân dài hơn, phù hợp để đo đoạn dài như phòng học.',
    }),
    mc('Chọn tất cả các bút dài hơn 8 cm: bút A dài 7 cm, bút B dài 10 cm, bút C dài 8 cm, bút D dài 11 cm.', ['Bút A', 'Bút B', 'Bút C', 'Bút D'], ['Bút B', 'Bút D'], {
      o: 'T1.HH.06', f: 'TOAN.DODAI', l: 5, k: 'do_cm', e: '10 cm và 11 cm dài hơn 8 cm.',
      s: 'So sánh từng số đo với 8: 7 < 8 (không), 10 > 8 (có), 8 = 8 (không dài hơn), 11 > 8 (có). Chọn bút B và bút D.',
    }),
  ]),

  L(27, C7, 'Thực hành ước lượng và đo độ dài', 'Ước lượng rồi đo độ dài bằng đơn vị tự quy ước và cm.', 'T1.HH', N100, [
    sc('Chiếc bút chì dài khoảng:', ['1 cm', '15 cm', '90 cm'], '15 cm', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 1, k: 'uoc_luong', e: 'Bút chì dài khoảng 15 cm.' }),
    sc('Cục tẩy dài khoảng:', ['4 cm', '40 cm', '80 cm'], '4 cm', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 1, k: 'uoc_luong', e: 'Cục tẩy nhỏ, dài khoảng 4 cm.' }),
    sc('Bảng lớp học dài khoảng:', ['3 cm', '3 gang tay', '3 sải tay'], '3 sải tay', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 2, k: 'uoc_luong', e: 'Bảng lớp dài, khoảng 3 sải tay.' }),
    fb('Em ước lượng hộp bút dài 18 cm. Đo bằng thước thì hộp bút dài 20 cm. Số đo thật là bao nhiêu xăng-ti-mét? (chỉ viết số)', ['20'], {
      o: 'T1.HH.06', f: 'TOAN.DODAI', l: 3, k: 'uoc_luong', e: 'Số đo bằng thước là số đo thật: 20 cm.',
      s: 'Ước lượng là đoán gần đúng; đo bằng thước mới cho số đo chính xác. Hộp bút dài 20 cm.',
    }),
    sc('Gang tay của em dài khoảng:', ['1 cm', '10 cm', '50 cm'], '10 cm', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 2, k: 'uoc_luong', e: 'Gang tay của học sinh lớp 1 dài khoảng 10 cm.' }),
    tf('Băng giấy đỏ dài 6 cm, băng giấy xanh dài 9 cm. Băng giấy đỏ dài hơn. Đúng hay sai?', 'Sai', {
      o: 'T1.HH.06', f: 'TOAN.DUNGSAI', l: 4, k: 'do_cm', e: '6 < 9 nên băng đỏ ngắn hơn.',
      s: 'So sánh số đo: 6 cm và 9 cm. Vì 6 < 9 nên băng đỏ ngắn hơn băng xanh. Câu đã cho sai.',
    }),
    sc('Đường A gồm hai đoạn dài 3 cm và 4 cm. Đường B dài 8 cm. Đường nào ngắn hơn?', ['Đường A', 'Đường B'], 'Đường A', {
      o: 'T1.HH.09', f: 'TOAN.DODAI', l: 5, k: 'do_cm', e: 'Đường A dài 3 + 4 = 7 cm < 8 cm.',
      s: 'Độ dài đường A: 3 + 4 = 7 (cm). So sánh 7 cm với 8 cm: 7 < 8. Đường A ngắn hơn.',
    }),
  ]),

  L(28, C7, 'Luyện tập chung', 'Ôn độ dài: so sánh, đo, ước lượng.', 'T1.HH', N100, [
    sc('Chiếc thước kẻ dài 20 cm, chiếc bút dài 14 cm. Vật nào ngắn hơn?', ['Thước kẻ', 'Chiếc bút'], 'Chiếc bút', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 1, k: 'do_cm', e: '14 < 20: chiếc bút ngắn hơn.' }),
    sc('Nam cao 98 cm, Mai cao 95 cm, Việt cao 99 cm. Ai cao nhất?', ['Nam', 'Mai', 'Việt'], 'Việt', { o: 'T1.HH.05', f: 'TOAN.DODAI', l: 2, k: 'cao_thap', e: '99 là số lớn nhất: Việt cao nhất.' }),
    fb('Que tính dài 5 cm. Hai que tính đặt nối tiếp thẳng hàng dài bao nhiêu xăng-ti-mét? (chỉ viết số)', ['10'], {
      o: 'T1.HH.09', f: 'TOAN.DODAI', l: 3, k: 'do_cm', e: '5 + 5 = 10 cm.', s: 'Hai que đặt nối tiếp thì độ dài cộng lại: 5 + 5 = 10 (cm).',
    }),
    sc('Quyển vở Toán dài khoảng:', ['2 cm', '24 cm', '100 cm'], '24 cm', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 2, k: 'uoc_luong', e: 'Quyển vở dài khoảng 24 cm.' }),
    tf('Khi đo, đặt đầu đồ vật ở vạch 1 và đầu kia ở vạch 7 thì đồ vật dài 7 cm. Đúng hay sai?', 'Sai', {
      o: 'T1.HH.06', f: 'TOAN.DUNGSAI', l: 4, k: 'do_cm', e: 'Phải đặt đầu đồ vật ở vạch 0; đặt ở vạch 1 thì đọc 7 là sai (vật chỉ dài 6 cm).',
      s: 'Đo đúng là đặt một đầu thẳng vạch 0. Nếu đặt ở vạch 1 thì vật dài từ 1 đến 7, tức là 6 cm, không phải 7 cm.',
    }),
    sc('Ba băng giấy: băng A dài 10 cm, băng B dài 8 cm, băng C dài 9 cm. Xếp từ ngắn đến dài thì băng nào đứng giữa?', ['Băng A', 'Băng B', 'Băng C'], 'Băng C', {
      o: 'T1.HH.05', f: 'TOAN.DODAI', l: 5, k: 'dai_ngan', e: '8 cm < 9 cm < 10 cm: B, C, A. Băng C ở giữa.',
      s: 'Xếp các số đo từ bé đến lớn: 8, 9, 10, tức là băng B, băng C, băng A. Băng đứng giữa là băng C.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 8. PHÉP CỘNG, PHÉP TRỪ TRONG PHẠM VI 100 =======================
  L(29, C8, 'Phép cộng số có hai chữ số với số có một chữ số', 'Cộng (không nhớ) số có hai chữ số với số có một chữ số.', 'T1.PT', ADD1, [
    fb('41 + 5 = ...', ['46'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'cong_100', e: '1 cộng 5 bằng 6, viết 6; hạ 4. Được 46.' }),
    fb('20 + 4 = ...', ['24'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'cong_100', e: '2 chục và 4 đơn vị: 24.' }),
    sc('73 + 6 = ?', ['79', '13', '78', '97'], '79', { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'cong_100', e: '3 + 6 = 9, hạ 7: 79.' }),
    fb('Tính: 94 + 4 = ...', ['98'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'dat_tinh', e: 'Đặt tính: 4 + 4 = 8, viết 8; hạ 9. Được 98.' }),
    fb('Bạn Mai gấp được 25 chiếc thuyền giấy, em Mi gấp được 3 chiếc. Hai chị em gấp được bao nhiêu chiếc thuyền?', ['28'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_cong', e: '25 + 3 = 28 chiếc thuyền.',
      s: '"Hai chị em gấp được bao nhiêu" là gộp lại: 25 + 3 = 28. Hai chị em gấp được 28 chiếc thuyền.',
    }),
    tf('62 + 5 = 67. Đúng hay sai?', 'Đúng', { o: 'T1.PT.04', f: 'TOAN.DUNGSAI', l: 3, k: 'cong_100', e: '2 + 5 = 7, hạ 6: 67.', s: 'Đặt tính thẳng cột: đơn vị 2 + 5 = 7, chục hạ 6. Kết quả 67, câu đúng.' }),
    fb('Lá sen chở được 17 chú ếch. Trên lá đang có 14 chú ếch. Còn lên được thêm mấy chú ếch nữa?', ['3'], {
      o: 'T1.PT.07', f: 'TOAN.SOTHIEU', l: 4, k: 'tim_so', e: '14 + 3 = 17: còn lên được 3 chú ếch.',
      s: 'Cần tìm số cộng với 14 để được 17: 14 + ... = 17. Vì 4 + 3 = 7 nên số cần tìm là 3.',
    }),
    fb('Tính: 30 + 5 + 2 = ...', ['37'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '30 + 5 = 35; 35 + 2 = 37.',
      s: 'Tính lần lượt từ trái sang phải: 30 + 5 = 35, rồi 35 + 2 = 37.',
    }),
  ]),

  L(30, C8, 'Phép cộng số có hai chữ số với số có hai chữ số', 'Cộng (không nhớ) hai số có hai chữ số; cộng nhẩm số tròn chục.', 'T1.PT', ADD2, [
    fb('32 + 15 = ...', ['47'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'cong_100', e: '2 + 5 = 7; 3 + 1 = 4. Được 47.' }),
    fb('Tính nhẩm: 30 + 20 = ...', ['50'], { o: 'T1.PT.05', f: 'TOAN.TINH', l: 1, k: 'tron_chuc', e: '3 chục + 2 chục = 5 chục: 50.' }),
    sc('24 + 30 = ?', ['27', '54', '64'], '54', { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'cong_100', e: '4 + 0 = 4; 2 + 3 = 5. Được 54.' }),
    fb('Đặt tính rồi tính: 13 + 21 = ...', ['34'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'dat_tinh', e: '3 + 1 = 4; 1 + 2 = 3. Được 34.' }),
    fb('Trên cây có 15 con chim. Có thêm 24 con chim bay đến. Hỏi trên cây có tất cả bao nhiêu con chim?', ['39'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_cong', e: '15 + 24 = 39 con chim.',
      s: '"Có thêm … bay đến", "có tất cả" là gộp lại: 15 + 24 = 39. Trên cây có 39 con chim.',
    }),
    sc('Phép tính nào có kết quả lớn nhất?', ['2 + 40', '80 + 3', '70 + 10'], '80 + 3', {
      o: 'T1.PT.04', f: 'TOAN.SOSANH', l: 4, k: 'so_sanh_ket_qua', e: '2 + 40 = 42; 80 + 3 = 83; 70 + 10 = 80. Lớn nhất là 83.',
      s: 'Tính từng phép tính: 42, 83, 80. So sánh: 83 lớn nhất, đó là 80 + 3.',
    }),
    fb('Tìm số còn thiếu: 23 + ... = 55', ['32'], {
      o: 'T1.PT.04', f: 'TOAN.SOTHIEU', l: 4, k: 'tim_so', e: '23 + 32 = 55.',
      s: 'Hàng đơn vị: 3 + ? = 5, nên đơn vị là 2. Hàng chục: 2 + ? = 5, nên chục là 3. Số cần tìm là 32.',
    }),
    fb('Tính: 40 + 15 + 2 = ...', ['57'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '40 + 15 = 55; 55 + 2 = 57.',
      s: 'Tính từ trái sang phải: 40 + 15 = 55, rồi 55 + 2 = 57.',
    }),
  ]),

  L(31, C8, 'Phép trừ số có hai chữ số cho số có một chữ số', 'Trừ (không nhớ) số có hai chữ số cho số có một chữ số.', 'T1.PT', SUB1, [
    fb('76 − 5 = ...', ['71'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'tru_100', e: '6 trừ 5 bằng 1, viết 1; hạ 7. Được 71.' }),
    fb('34 − 4 = ...', ['30'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'tru_100', e: '4 trừ 4 bằng 0, viết 0; hạ 3. Được 30.' }),
    sc('99 − 9 = ?', ['90', '9', '99'], '90', { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'tru_100', e: '9 − 9 = 0; hạ 9: 90.' }),
    fb('Đặt tính rồi tính: 46 − 4 = ...', ['42'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'dat_tinh', e: '6 − 4 = 2; hạ 4. Được 42.' }),
    fb('Một xe buýt chở 29 hành khách. Đến bến có 5 hành khách xuống xe. Hỏi trên xe còn lại bao nhiêu hành khách?', ['24'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_tru', e: '29 − 5 = 24 hành khách.',
      s: '"Xuống xe", "còn lại" là bớt đi: 29 − 5 = 24. Trên xe còn 24 hành khách.',
    }),
    tf('88 − 5 = 38. Đúng hay sai?', 'Sai', {
      o: 'T1.PT.04', f: 'TOAN.DUNGSAI', l: 3, k: 'kiem_tra_tinh', e: '88 − 5 = 83.',
      s: 'Đặt tính: đơn vị 8 − 5 = 3, chục hạ 8. Kết quả đúng là 83, không phải 38 (đã trừ nhầm vào hàng chục).',
    }),
    fb('Có 18 bạn rùa và thỏ chơi trốn tìm, trong đó có 8 bạn rùa. Hỏi có bao nhiêu bạn thỏ?', ['10'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 4, k: 'loi_van_tru', e: '18 − 8 = 10 bạn thỏ.',
      s: 'Tất cả 18 bạn gồm rùa và thỏ. Bớt đi số rùa (8) thì còn số thỏ: 18 − 8 = 10.',
    }),
    fb('Tính: 59 − 2 − 4 = ...', ['53'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '59 − 2 = 57; 57 − 4 = 53.',
      s: 'Tính lần lượt từ trái sang phải: 59 − 2 = 57, rồi 57 − 4 = 53.',
    }),
  ]),

  L(32, C8, 'Phép trừ số có hai chữ số cho số có hai chữ số', 'Trừ (không nhớ) hai số có hai chữ số; trừ nhẩm số tròn chục.', 'T1.PT', ALL, [
    fb('76 − 32 = ...', ['44'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'tru_100', e: '6 − 2 = 4; 7 − 3 = 4. Được 44.' }),
    fb('Tính nhẩm: 60 − 20 = ...', ['40'], { o: 'T1.PT.05', f: 'TOAN.TINH', l: 1, k: 'tron_chuc', e: '6 chục − 2 chục = 4 chục: 40.' }),
    sc('52 − 20 = ?', ['32', '50', '72'], '32', { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'tru_100', e: '2 − 0 = 2; 5 − 2 = 3. Được 32.' }),
    fb('Đặt tính rồi tính: 79 − 59 = ...', ['20'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'dat_tinh', e: '9 − 9 = 0; 7 − 5 = 2. Được 20.' }),
    fb('Trong vườn có tất cả 75 cây nhãn và cây vải, trong đó có 25 cây nhãn. Hỏi trong vườn có bao nhiêu cây vải?', ['50'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_tru', e: '75 − 25 = 50 cây vải.',
      s: 'Tất cả 75 cây, bớt đi 25 cây nhãn thì còn số cây vải: 75 − 25 = 50.',
    }),
    sc('Quả dưa nào ghi phép tính có kết quả lớn nhất?', ['70 − 20', '54 − 14', '35 − 10'], '70 − 20', {
      o: 'T1.PT.04', f: 'TOAN.SOSANH', l: 4, k: 'so_sanh_ket_qua', e: '70 − 20 = 50; 54 − 14 = 40; 35 − 10 = 25.',
      s: 'Tính từng phép tính được 50, 40, 25. Kết quả lớn nhất là 50, của 70 − 20.',
    }),
    fb('Một đống gạch có 86 viên. Bạn Rô-bốt lấy đi 50 viên để xây tường. Hỏi đống gạch còn lại bao nhiêu viên?', ['36'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 4, k: 'loi_van_tru', e: '86 − 50 = 36 viên gạch.',
      s: '"Lấy đi", "còn lại" là phép trừ: 86 − 50 = 36. Đống gạch còn 36 viên.',
    }),
    fb('Tính: 85 − 25 − 20 = ...', ['40'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '85 − 25 = 60; 60 − 20 = 40.',
      s: 'Tính lần lượt: 85 − 25 = 60, rồi 60 − 20 = 40.',
    }),
  ]),

  L(33, C8, 'Luyện tập chung', 'Ôn cộng, trừ (không nhớ) trong phạm vi 100.', 'T1.PT', ALL, [
    fb('47 + 20 = ...', ['67'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'cong_100', e: '7 + 0 = 7; 4 + 2 = 6. Được 67.' }),
    fb('97 − 56 = ...', ['41'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'tru_100', e: '7 − 6 = 1; 9 − 5 = 4. Được 41.' }),
    sc('Bạn nào cầm thẻ có kết quả lớn nhất? Nam: 65 − 41; Mai: 89 − 60; Việt: 58 − 30.', ['Nam', 'Mai', 'Việt'], 'Mai', {
      o: 'T1.PT.04', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_ket_qua', e: 'Nam 24, Mai 29, Việt 28: Mai lớn nhất.',
    }),
    fb('Tính nhẩm: 90 − 40 = ...', ['50'], { o: 'T1.PT.05', f: 'TOAN.TINH', l: 2, k: 'tron_chuc', e: '9 chục − 4 chục = 5 chục.' }),
    fb('Trong hai ngày, tráng sĩ uống hết 49 bầu nước. Ngày thứ nhất uống 25 bầu. Hỏi ngày thứ hai uống bao nhiêu bầu nước?', ['24'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_tru', e: '49 − 25 = 24 bầu nước.',
      s: 'Hai ngày uống 49 bầu, bớt đi số bầu ngày thứ nhất (25) thì còn số bầu ngày thứ hai: 49 − 25 = 24.',
    }),
    tf('23 + 64 = 87. Đúng hay sai?', 'Đúng', { o: 'T1.PT.04', f: 'TOAN.DUNGSAI', l: 3, k: 'kiem_tra_tinh', e: '3 + 4 = 7; 2 + 6 = 8: 87.', s: 'Đặt tính: đơn vị 3 + 4 = 7, chục 2 + 6 = 8. Kết quả 87, câu đúng.' }),
    fb('Tìm số còn thiếu: ... − 24 = 35', ['59'], {
      o: 'T1.PT.04', f: 'TOAN.SOTHIEU', l: 4, k: 'tim_so', e: '35 + 24 = 59; thử lại 59 − 24 = 35.',
      s: 'Số bị trừ bằng hiệu cộng với số trừ: 35 + 24 = 59. Thử lại: 59 − 24 = 35.',
    }),
    fb('Tính: 37 + 12 − 23 = ...', ['26'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '37 + 12 = 49; 49 − 23 = 26.',
      s: 'Tính từ trái sang phải: 37 + 12 = 49, rồi 49 − 23 = 26.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 9. THỜI GIAN, GIỜ VÀ LỊCH =======================
  L(34, C9, 'Xem giờ đúng trên đồng hồ', 'Kim giờ, kim phút; đọc giờ đúng; các buổi trong ngày.', 'T1.HH', ALL, [
    sc('Kim ngắn chỉ số 6, kim dài chỉ số 12. Đồng hồ chỉ mấy giờ?', ['12 giờ', '6 giờ', '7 giờ'], '6 giờ', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 1, k: 'xem_gio', e: 'Kim dài chỉ 12, kim ngắn chỉ 6: 6 giờ.' }),
    sc('Trên mặt đồng hồ, kim nào chỉ giờ?', ['Kim ngắn', 'Kim dài'], 'Kim ngắn', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 1, k: 'xem_gio', e: 'Kim ngắn chỉ giờ, kim dài chỉ phút.' }),
    sc('Lúc 9 giờ đúng, kim dài chỉ số mấy?', ['Số 9', 'Số 12', 'Số 3'], 'Số 12', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 2, k: 'xem_gio', e: 'Giờ đúng thì kim dài luôn chỉ số 12.' }),
    sc('Em đi ngủ lúc 9 giờ … Chọn buổi thích hợp.', ['sáng', 'chiều', 'tối'], 'tối', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 2, k: 'buoi_trong_ngay', e: 'Đi ngủ vào buổi tối: 9 giờ tối.' }),
    tf('Bạn nói: "Kim ngắn và kim dài trùng nhau ở số 12 thì đồng hồ chỉ 12 giờ." Đúng hay sai?', 'Đúng', {
      o: 'T1.HH.08', f: 'TOAN.DUNGSAI', l: 3, k: 'xem_gio', e: 'Hai kim cùng chỉ số 12: 12 giờ.',
      s: 'Kim dài chỉ số 12 nên là giờ đúng; kim ngắn cũng chỉ số 12 nên là 12 giờ. Câu đúng.',
    }),
    mt('Ghép việc làm với giờ phù hợp.', [['Thức dậy', '6 giờ sáng'], ['Ăn trưa', '11 giờ trưa'], ['Đi ngủ', '9 giờ tối']], {
      o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 3, k: 'buoi_trong_ngay', e: 'Thức dậy buổi sáng, ăn trưa buổi trưa, đi ngủ buổi tối.',
      s: 'Nghĩ xem mỗi việc thường làm vào buổi nào: thức dậy vào sáng sớm, ăn trưa vào buổi trưa, đi ngủ vào buổi tối.',
    }),
    sc('Bây giờ là 3 giờ. 2 giờ nữa là mấy giờ?', ['1 giờ', '5 giờ', '6 giờ'], '5 giờ', {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 4, k: 'tinh_gio', e: '3 + 2 = 5: 5 giờ.',
      s: 'Kim ngắn đang chỉ số 3, sau 2 giờ nữa tiến thêm 2 số: 3 + 2 = 5. Lúc đó là 5 giờ.',
    }),
    sc('Buổi sáng, Lan bắt đầu đi tham quan lúc 7 giờ và đi trong 3 giờ. Lan về lúc mấy giờ?', ['9 giờ', '10 giờ', '4 giờ'], '10 giờ', {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 5, k: 'tinh_gio', e: '7 + 3 = 10: 10 giờ.',
      s: 'Bắt đầu lúc 7 giờ, thêm 3 giờ: 7 + 3 = 10. Lan về lúc 10 giờ.',
    }),
  ]),

  L(35, C9, 'Các ngày trong tuần', 'Một tuần có 7 ngày; tên, thứ tự các ngày; hôm qua, hôm nay, ngày mai.', 'T1.HH', ALL, [
    sc('Một tuần lễ có mấy ngày?', ['5 ngày', '6 ngày', '7 ngày'], '7 ngày', { o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 1, k: 'ngay_trong_tuan', e: 'Thứ Hai đến Chủ nhật: 7 ngày.' }),
    sc('Ngày đứng ngay sau thứ Tư là ngày nào?', ['Thứ Ba', 'Thứ Năm', 'Thứ Sáu'], 'Thứ Năm', { o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 1, k: 'ngay_trong_tuan', e: 'Thứ Tư rồi đến thứ Năm.' }),
    sc('Hôm nay là thứ Sáu. Ngày mai là ngày nào?', ['Thứ Năm', 'Thứ Bảy', 'Chủ nhật'], 'Thứ Bảy', { o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 2, k: 'hom_qua_ngay_mai', e: 'Ngày mai là ngày ngay sau hôm nay: thứ Bảy.' }),
    sc('Hôm nay là thứ Hai. Hôm qua là ngày nào?', ['Chủ nhật', 'Thứ Ba', 'Thứ Bảy'], 'Chủ nhật', { o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 2, k: 'hom_qua_ngay_mai', e: 'Trước thứ Hai là Chủ nhật (của tuần trước).' }),
    ord('Xếp các ngày theo đúng thứ tự trong tuần.', ['Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'], {
      o: 'T1.HH.07', f: 'TOAN.SAPXEP', l: 3, k: 'ngay_trong_tuan', e: 'Thứ Ba, thứ Tư, thứ Năm, thứ Sáu.',
      s: 'Thứ tự trong tuần: thứ Hai, thứ Ba, thứ Tư, thứ Năm, thứ Sáu, thứ Bảy, Chủ nhật.',
    }),
    fb('Em đi học từ thứ Hai đến thứ Sáu. Mỗi tuần em đi học mấy ngày?', ['5'], {
      o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 3, k: 'ngay_trong_tuan', e: 'Thứ Hai, Ba, Tư, Năm, Sáu: 5 ngày.',
      s: 'Đếm từ thứ Hai đến thứ Sáu: thứ Hai (1), thứ Ba (2), thứ Tư (3), thứ Năm (4), thứ Sáu (5). Có 5 ngày.',
    }),
    sc('Hôm nay là thứ Năm. Hỏi 3 ngày nữa là ngày nào?', ['Thứ Bảy', 'Chủ nhật', 'Thứ Hai'], 'Chủ nhật', {
      o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 4, k: 'hom_qua_ngay_mai', e: 'Đếm tiếp: thứ Sáu, thứ Bảy, Chủ nhật.',
      s: 'Đếm tiếp từ thứ Năm: 1 ngày nữa là thứ Sáu, 2 ngày nữa là thứ Bảy, 3 ngày nữa là Chủ nhật.',
    }),
    sc('Nếu hôm qua là thứ Ba thì ngày mai là ngày nào?', ['Thứ Tư', 'Thứ Năm', 'Thứ Sáu'], 'Thứ Năm', {
      o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 5, k: 'hom_qua_ngay_mai', e: 'Hôm qua thứ Ba → hôm nay thứ Tư → ngày mai thứ Năm.',
      s: 'Hôm qua là thứ Ba thì hôm nay là thứ Tư. Ngày mai là ngày ngay sau hôm nay: thứ Năm.',
    }),
  ]),

  L(36, C9, 'Thực hành xem lịch và giờ', 'Đọc tờ lịch: thứ, ngày, tháng; kết hợp xem giờ.', 'T1.HH', ALL, [
    sc('Tờ lịch ghi: "Tháng 5 — 7 — Thứ Hai". Hôm đó là thứ mấy?', ['Thứ Hai', 'Thứ Bảy', 'Thứ Năm'], 'Thứ Hai', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 1, k: 'xem_lich', e: 'Dòng dưới tờ lịch ghi thứ: thứ Hai.' }),
    sc('Tờ lịch ghi: "Tháng 5 — 7 — Thứ Hai". Hôm đó là ngày bao nhiêu?', ['Ngày 5', 'Ngày 7', 'Ngày 2'], 'Ngày 7', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 1, k: 'xem_lich', e: 'Số to ở giữa tờ lịch là ngày: ngày 7.' }),
    sc('Hôm nay là thứ Hai, ngày 7. Ngày mai là:', ['Thứ Ba, ngày 8', 'Thứ Ba, ngày 6', 'Chủ nhật, ngày 8'], 'Thứ Ba, ngày 8', {
      o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 2, k: 'xem_lich', e: 'Ngày mai: thứ tiếp theo (thứ Ba), ngày thêm 1 (ngày 8).',
    }),
    fb('Trong một tuần, thứ Ba là ngày 22. Hỏi thứ Năm tuần đó là ngày bao nhiêu? (chỉ viết số)', ['24'], {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 3, k: 'xem_lich', e: 'Thứ Tư ngày 23, thứ Năm ngày 24.',
      s: 'Mỗi ngày tiếp theo thì số ngày thêm 1: thứ Ba 22, thứ Tư 23, thứ Năm 24.',
    }),
    sc('Mai xé tờ lịch hôm qua là ngày 16. Hôm nay là ngày bao nhiêu?', ['Ngày 15', 'Ngày 17', 'Ngày 18'], 'Ngày 17', {
      o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 3, k: 'xem_lich', e: 'Hôm qua ngày 16 thì hôm nay ngày 17.',
      s: 'Hôm nay là ngày ngay sau hôm qua nên số ngày thêm 1: 16 + 1 = 17.',
    }),
    sc('Chuyến bay Hà Nội – Đà Nẵng khởi hành lúc 7 giờ. Đồng hồ nào chỉ đúng giờ đó?', ['Kim ngắn chỉ số 7, kim dài chỉ số 12', 'Kim ngắn chỉ số 12, kim dài chỉ số 7', 'Kim ngắn chỉ số 5, kim dài chỉ số 12'], 'Kim ngắn chỉ số 7, kim dài chỉ số 12', {
      o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 4, k: 'xem_gio', e: '7 giờ: kim ngắn chỉ 7, kim dài chỉ 12.',
      s: 'Giờ đúng thì kim dài chỉ số 12; kim ngắn chỉ số giờ. 7 giờ thì kim ngắn chỉ số 7.',
    }),
    sc('Nếu thứ Ba là ngày 11 thì thứ Sáu tuần đó là:', ['Ngày 13', 'Ngày 14', 'Ngày 15'], 'Ngày 14', {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 5, k: 'xem_lich', e: 'Thứ Tư 12, thứ Năm 13, thứ Sáu 14.',
      s: 'Từ thứ Ba đến thứ Sáu là 3 ngày nữa: 11 + 3 = 14. Thứ Sáu là ngày 14.',
    }),
  ]),

  L(37, C9, 'Luyện tập chung', 'Ôn xem giờ đúng, các ngày trong tuần, xem lịch.', 'T1.HH', ALL, [
    sc('Kim ngắn chỉ số 10, kim dài chỉ số 12. Đồng hồ chỉ mấy giờ?', ['10 giờ', '12 giờ', '2 giờ'], '10 giờ', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 1, k: 'xem_gio', e: '10 giờ.' }),
    sc('Ngày đứng ngay trước Chủ nhật là ngày nào?', ['Thứ Sáu', 'Thứ Bảy', 'Thứ Hai'], 'Thứ Bảy', { o: 'T1.HH.07', f: 'TOAN.GIOLICH', l: 1, k: 'ngay_trong_tuan', e: 'Thứ Bảy rồi đến Chủ nhật.' }),
    sc('Việt ăn trưa lúc 11 giờ. Đó là buổi nào?', ['Buổi sáng', 'Buổi trưa', 'Buổi tối'], 'Buổi trưa', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 2, k: 'buoi_trong_ngay', e: 'Ăn trưa vào buổi trưa.' }),
    tf('Hôm nay là thứ Tư thì hôm qua là thứ Năm. Đúng hay sai?', 'Sai', {
      o: 'T1.HH.07', f: 'TOAN.DUNGSAI', l: 3, k: 'hom_qua_ngay_mai', e: 'Hôm qua là thứ Ba; thứ Năm là ngày mai.',
      s: 'Hôm qua là ngày ngay trước hôm nay. Trước thứ Tư là thứ Ba. Câu đã cho sai.',
    }),
    fb('Trong một tuần, thứ Hai là ngày 20. Thứ Tư tuần đó là ngày bao nhiêu? (chỉ viết số)', ['22'], {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 4, k: 'xem_lich', e: 'Thứ Ba 21, thứ Tư 22.',
      s: 'Thứ Tư sau thứ Hai 2 ngày: 20 + 2 = 22.',
    }),
    sc('Rùa và thỏ xuất phát lúc 8 giờ. Rùa về đích sau 2 giờ. Rùa về đích lúc mấy giờ?', ['6 giờ', '10 giờ', '11 giờ'], '10 giờ', {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 5, k: 'tinh_gio', e: '8 + 2 = 10: 10 giờ.',
      s: 'Xuất phát lúc 8 giờ, thêm 2 giờ: 8 + 2 = 10. Rùa về đích lúc 10 giờ.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 10. ÔN TẬP CUỐI NĂM =======================
  L(38, C10, 'Ôn tập các số và phép tính trong phạm vi 10', 'Ôn số, so sánh, cộng, trừ trong phạm vi 10.', 'T1.PT', N10, [
    sc('Phép tính nào có kết quả bằng 8?', ['5 + 2', '9 − 1', '10 − 3'], '9 − 1', { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'cong_tru_10', e: '9 − 1 = 8.' }),
    fb('Tìm số còn thiếu: 0, 1, 2, ..., 4', ['3'], { o: 'T1.SO.01', f: 'TOAN.SOTHIEU', l: 1, k: 'thu_tu_so', e: 'Sau 2 là 3.' }),
    sc('Chọn dấu thích hợp: 4 + 3 ... 6', ['>', '<', '='], '>', { o: 'T1.PT.06', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_phep_tinh', e: '4 + 3 = 7; 7 > 6.' }),
    fb('8 − 6 = ...', ['2'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'cong_tru_10', e: '8 − 6 = 2.' }),
    fb('Điểm số của Mai, Việt và Nam là 9, 10, 10. Biết điểm của Mai cao hơn điểm của Nam. Hỏi Việt được mấy điểm?', ['10'], {
      o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 4, k: 'so_sanh_10', e: 'Mai 10, Nam 9, nên Việt 10.',
      s: 'Chỉ có một điểm 9. Mai cao hơn Nam nên Nam phải được 9 và Mai được 10. Điểm còn lại là 10, đó là điểm của Việt.',
    }),
    tf('5 + 4 = 10 − 1. Đúng hay sai?', 'Đúng', {
      o: 'T1.PT.06', f: 'TOAN.DUNGSAI', l: 3, k: 'so_sanh_phep_tinh', e: '5 + 4 = 9; 10 − 1 = 9.',
      s: 'Tính hai vế: 5 + 4 = 9 và 10 − 1 = 9. Hai kết quả bằng nhau nên câu đúng.',
    }),
    fb('Tính: 10 − 4 + 3 = ...', ['9'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '10 − 4 = 6; 6 + 3 = 9.',
      s: 'Tính từ trái sang phải: 10 − 4 = 6, rồi 6 + 3 = 9.',
    }),
  ]),

  L(39, C10, 'Ôn tập các số và phép tính trong phạm vi 100', 'Ôn số có hai chữ số, cộng, trừ (không nhớ) trong phạm vi 100.', 'T1.PT', ALL, [
    fb('Số gồm 4 chục và 4 đơn vị là số nào?', ['44'], { o: 'T1.SO.05', f: 'TOAN.DOCVIET', l: 1, k: 'chuc_don_vi', e: '44.' }),
    fb('Tính nhẩm: 80 + 10 = ...', ['90'], { o: 'T1.PT.05', f: 'TOAN.TINH', l: 1, k: 'tron_chuc', e: '8 chục + 1 chục = 9 chục.' }),
    fb('69 = ... + 9 (viết số tròn chục)', ['60'], { o: 'T1.SO.05', f: 'TOAN.SOTHIEU', l: 2, k: 'chuc_don_vi', e: '69 gồm 60 và 9.' }),
    sc('Hai phép tính nào có cùng kết quả?', ['35 + 12 và 40 + 7', '35 + 12 và 30 + 50', '60 + 20 và 40 + 19'], '35 + 12 và 40 + 7', {
      o: 'T1.PT.04', f: 'TOAN.TINH', l: 3, k: 'so_sanh_ket_qua', e: '35 + 12 = 47 = 40 + 7.',
      s: 'Tính: 35 + 12 = 47, 40 + 7 = 47, 30 + 50 = 80, 60 + 20 = 80, 40 + 19 = 59. Cặp có cùng kết quả: 35 + 12 và 40 + 7.',
    }),
    fb('Lớp em chăm sóc 75 cây hoa hồng. Sáng nay có 52 cây đã nở hoa. Hỏi còn bao nhiêu cây chưa nở hoa?', ['23'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_tru', e: '75 − 52 = 23 cây.',
      s: 'Tất cả 75 cây, bớt đi 52 cây đã nở hoa: 75 − 52 = 23 cây chưa nở hoa.',
    }),
    fb('Lớp 1A có 32 bạn, lớp 1B có 35 bạn cùng đi cắm trại. Hỏi cả hai lớp có bao nhiêu bạn đi cắm trại?', ['67'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 4, k: 'loi_van_cong', e: '32 + 35 = 67 bạn.',
      s: '"Cả hai lớp" là gộp lại: 32 + 35 = 67. Có 67 bạn đi cắm trại.',
    }),
    fb('Tính: 23 + 41 − 50 = ...', ['14'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '23 + 41 = 64; 64 − 50 = 14.',
      s: 'Tính từ trái sang phải: 23 + 41 = 64, rồi 64 − 50 = 14.',
    }),
  ]),

  L(40, C10, 'Ôn tập hình học và đo lường', 'Ôn hình phẳng, khối hình, độ dài, giờ và lịch.', 'T1.HH', ALL, [
    sc('Hình nào có 3 cạnh?', ['Hình vuông', 'Hình tam giác', 'Hình tròn'], 'Hình tam giác', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Hình tam giác có 3 cạnh.' }),
    sc('Hộp sữa có dạng khối gì?', ['Khối lập phương', 'Khối hộp chữ nhật'], 'Khối hộp chữ nhật', { o: 'T1.HH.03', f: 'TOAN.HINH', l: 1, k: 'hinh_khoi', e: 'Hộp sữa dài, có dạng khối hộp chữ nhật.' }),
    sc('Việt đi học lúc 7 giờ sáng. Đồng hồ lúc đó: kim ngắn chỉ số mấy?', ['Số 7', 'Số 12', 'Số 1'], 'Số 7', { o: 'T1.HH.08', f: 'TOAN.GIOLICH', l: 2, k: 'xem_gio', e: '7 giờ: kim ngắn chỉ số 7, kim dài chỉ số 12.' }),
    sc('Bàn học của em cao khoảng:', ['6 cm', '6 gang tay', '6 sải tay'], '6 gang tay', { o: 'T1.HH.06', f: 'TOAN.DODAI', l: 2, k: 'uoc_luong', e: 'Bàn học cao khoảng 6 gang tay.' }),
    fb('🔶🔺🔵🔶🔺🔵🔶🔺...\nHình tiếp theo là hình gì? (viết: tròn, vuông hoặc tam giác)', ['tròn', 'hình tròn'], {
      o: 'T1.HH.04', f: 'TOAN.HINH', l: 3, k: 'quy_luat_hinh', e: 'Nhóm thoi – tam giác – tròn lặp lại: sau tam giác là hình tròn.',
      s: 'Dãy lặp lại nhóm 3 hình: hình thoi, hình tam giác, hình tròn. Hình cuối đang là tam giác nên hình tiếp theo là hình tròn.',
    }),
    sc('Trong một tuần, nếu ngày 20 là thứ Hai thì ngày 22 là thứ mấy?', ['Thứ Tư', 'Thứ Năm', 'Thứ Sáu'], 'Thứ Tư', {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 4, k: 'xem_lich', e: 'Ngày 21 thứ Ba, ngày 22 thứ Tư.',
      s: 'Ngày 22 sau ngày 20 hai ngày. Sau thứ Hai hai ngày là thứ Tư.',
    }),
    sc('Bút bi đặt thẳng từ vạch 0 đến vạch 15 của thước. Bút bi dài:', ['14 cm', '15 cm', '16 cm'], '15 cm', {
      o: 'T1.HH.06', f: 'TOAN.DODAI', l: 3, k: 'do_cm', e: 'Đầu kia ở vạch 15: bút dài 15 cm.',
      s: 'Một đầu bút ở vạch 0 nên đọc số ở đầu kia: 15. Bút bi dài 15 cm.',
    }),
    fb('Một hình vuông lớn được chia thành 4 hình vuông nhỏ bằng nhau. Hình đó có tất cả bao nhiêu hình vuông? (kể cả hình vuông lớn)', ['5'], {
      o: 'T1.HH.04', f: 'TOAN.HINH', l: 5, k: 'dem_hinh', e: '4 hình vuông nhỏ và 1 hình vuông lớn: 5 hình vuông.',
      s: 'Đếm hình vuông nhỏ: 4. Cả bốn hình nhỏ ghép lại thành 1 hình vuông lớn. Tất cả: 4 + 1 = 5 hình vuông.',
    }),
  ]),

  L(41, C10, 'Ôn tập chung', 'Ôn tập tổng hợp cuối năm học.', 'T1.PT', ALL, [
    sc('"Bảy mươi mốt" viết là:', ['71', '17', '70'], '71', { o: 'T1.SO.04', f: 'TOAN.DOCVIET', l: 1, k: 'doc_so', e: '7 chục, 1 đơn vị: 71.' }),
    ord('Sắp xếp các số 48, 25, 42, 74 theo thứ tự từ bé đến lớn.', ['25', '42', '48', '74'], { o: 'T1.SO.06', f: 'TOAN.SAPXEP', l: 2, k: 'sap_xep_100', e: '25 < 42 < 48 < 74.' }),
    fb('13 + 5 = ...', ['18'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 1, k: 'cong_100', e: '3 + 5 = 8; hạ 1: 18.' }),
    fb('69 − 63 = ...', ['6'], { o: 'T1.PT.04', f: 'TOAN.TINH', l: 2, k: 'tru_100', e: '9 − 3 = 6; 6 − 6 = 0: 6.' }),
    fb('Mai hái được 23 bông hoa, Mi hái được 14 bông hoa. Hỏi cả hai chị em hái được bao nhiêu bông hoa?', ['37'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_cong', e: '23 + 14 = 37 bông hoa.',
      s: '"Cả hai chị em" là gộp lại: 23 + 14 = 37.',
    }),
    fb('Nam có 25 viên bi, Nam cho Việt 10 viên. Hỏi Nam còn lại bao nhiêu viên bi?', ['15'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'loi_van_tru', e: '25 − 10 = 15 viên bi.',
      s: '"Cho bạn", "còn lại" là phép trừ: 25 − 10 = 15.',
    }),
    sc('Nếu thứ Ba là ngày 11 thì thứ Sáu tuần đó là ngày nào?', ['Ngày 13', 'Ngày 14', 'Ngày 15'], 'Ngày 14', {
      o: 'T1.HH.09', f: 'TOAN.GIOLICH', l: 4, k: 'xem_lich', e: '11 + 3 = 14.',
      s: 'Từ thứ Ba đến thứ Sáu là 3 ngày: 11 + 3 = 14.',
    }),
    fb('Tính: 46 + 30 − 6 = ...', ['70'], {
      o: 'T1.PT.06', f: 'TOAN.TINH', l: 5, k: 'hai_dau_tinh', e: '46 + 30 = 76; 76 − 6 = 70.',
      s: 'Tính từ trái sang phải: 46 + 30 = 76, rồi 76 − 6 = 70.',
    }),
  ]),
];
