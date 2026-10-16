// TOÁN 1 — HỌC KỲ 1 — bám trình tự sách Toán 1 (Kết nối tri thức với cuộc sống), Bài 1–20.
// Câu hỏi tự soạn. Phạm vi số và phép tính của từng bài được kiểm tra tự động (scripts/check-content.ts).

import { fb, mc, mt, ord, rep, sc, tf, type ContentLesson } from './types';

const BOOK = 'Kết nối tri thức';
const C1 = { code: 'KNTT.T1.CD1', title: 'Chủ đề 1. Các số từ 0 đến 10' };
const C2 = { code: 'KNTT.T1.CD2', title: 'Chủ đề 2. Làm quen với một số hình phẳng' };
const C3 = { code: 'KNTT.T1.CD3', title: 'Chủ đề 3. Phép cộng, phép trừ trong phạm vi 10' };
const C4 = { code: 'KNTT.T1.CD4', title: 'Chủ đề 4. Làm quen với một số hình khối' };
const C5 = { code: 'KNTT.T1.CD5', title: 'Chủ đề 5. Ôn tập học kì 1' };

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
  semester: 1,
  book: BOOK,
  ref: `Bài ${no}`,
  unit,
  topicCode,
  title: `Bài ${no}. ${title}`,
  description,
  scope,
  questions,
});

const N5 = { kind: 'math', maxNumber: 5, ops: [] } as const;
const N10 = { kind: 'math', maxNumber: 10, ops: [] } as const;
const ADD = { kind: 'math', maxNumber: 10, ops: ['+'] } as const;
const ADDSUB = { kind: 'math', maxNumber: 10, ops: ['+', '-'] } as const;

export const TOAN1_HK1: ContentLesson[] = [
  // ======================= CHỦ ĐỀ 1 =======================
  L(1, C1, 'Các số 0, 1, 2, 3, 4, 5', 'Đếm, đọc, viết các số từ 0 đến 5.', 'T1.SO', N5, [
    sc(`${rep('🍎', 3)}\nCó mấy quả táo?`, ['2', '3', '4', '5'], '3', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_5', e: 'Đếm từng quả: 1, 2, 3. Có 3 quả táo.' }),
    sc(`${rep('🐟', 5)}\nCó mấy con cá?`, ['3', '4', '5', '2'], '5', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_5', e: 'Đếm: 1, 2, 3, 4, 5. Có 5 con cá.' }),
    sc(`${rep('🐥', 4)}\nCó mấy con gà con?`, ['4', '5', '3', '1'], '4', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_5', e: 'Có 4 con gà con.' }),
    fb('Trong đĩa không có quả cam nào. Số quả cam trong đĩa là mấy?', ['0', 'không'], {
      o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 2, k: 'so_0', e: 'Không có quả nào thì viết số 0.',
      s: 'Số 0 dùng khi không có đồ vật nào. Đĩa trống nên số quả cam là 0.',
    }),
    fb('Đếm tiếp: 1, 2, 3, ..., 5. Số còn thiếu là số mấy?', ['4', 'bốn'], { o: 'T1.SO.01', f: 'TOAN.SOTHIEU', l: 2, k: 'thu_tu_so', e: 'Sau 3 là 4, sau 4 là 5.' }),
    sc('Số nào đứng ngay sau số 2?', ['1', '3', '4', '5'], '3', { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 2, k: 'thu_tu_so', e: 'Đếm 1, 2, 3: số đứng ngay sau 2 là 3.' }),
    mt('Ghép nhóm hình với số đúng', [[rep('⭐', 2), '2'], [rep('⭐', 4), '4'], [rep('⭐', 1), '1']], { o: 'T1.SO.01', f: 'TOAN.DEM', l: 2, k: 'dem_5', e: '2 ngôi sao ghép số 2, 4 ngôi sao ghép số 4, 1 ngôi sao ghép số 1.' }),
    ord('Xếp các số theo thứ tự đếm từ bé đến lớn', ['0', '1', '2', '3', '4'], { o: 'T1.SO.01', f: 'TOAN.SAPXEP', l: 2, k: 'thu_tu_so', e: 'Thứ tự đếm: 0, 1, 2, 3, 4.' }),
    tf(`${rep('🌸', 4)}\nCó 5 bông hoa. Đúng hay sai?`, 'Sai', { o: 'T1.SO.01', f: 'TOAN.DUNGSAI', l: 1, k: 'dem_5', e: 'Đếm lại: 1, 2, 3, 4. Chỉ có 4 bông hoa.' }),
    fb('Tổ em có 5 bạn, mỗi bạn cầm 1 lá cờ. Tổ em có tất cả mấy lá cờ?', ['5', 'năm'], {
      o: 'T1.SO.01', f: 'TOAN.DEM', l: 3, k: 'dem_5', e: 'Mỗi bạn 1 lá cờ, 5 bạn thì có 5 lá cờ.',
      s: 'Mỗi bạn cầm đúng 1 lá cờ nên số lá cờ bằng số bạn. Có 5 bạn, vậy có 5 lá cờ.',
    }),
  ]),

  L(2, C1, 'Các số 6, 7, 8, 9, 10', 'Đếm, đọc, viết các số từ 6 đến 10.', 'T1.SO', N10, [
    sc(`${rep('🍊', 7)}\nCó mấy quả cam?`, ['6', '7', '8', '9'], '7', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_10', e: 'Đếm từ 1 đến 7. Có 7 quả cam.' }),
    sc(`${rep('🎈', 10)}\nCó mấy quả bóng bay?`, ['8', '9', '10', '7'], '10', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_10', e: 'Có 10 quả bóng bay.', s: 'Mẹo: đếm theo hàng, mỗi lần chỉ một quả và không đếm lại quả đã đếm. Đếm đến quả cuối cùng là 10.' }),
    sc(`${rep('🐞', 6)}\nCó mấy con bọ rùa?`, ['6', '5', '7', '8'], '6', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_10', e: 'Có 6 con bọ rùa.' }),
    fb('Viết số: tám', ['8'], { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 1, k: 'doc_viet_so', e: 'Số tám viết là 8.' }),
    sc('Số 9 đọc là gì?', ['chín', 'sáu', 'tám', 'mười'], 'chín', { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 1, k: 'doc_viet_so', e: 'Số 9 đọc là "chín".' }),
    fb('6, 7, ..., 9, 10. Số còn thiếu là số mấy?', ['8', 'tám'], { o: 'T1.SO.01', f: 'TOAN.SOTHIEU', l: 2, k: 'thu_tu_so', e: 'Sau 7 là 8, sau 8 là 9.' }),
    mt('Ghép số với cách đọc', [['6', 'sáu'], ['7', 'bảy'], ['10', 'mười']], { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 2, k: 'doc_viet_so', e: '6 – sáu, 7 – bảy, 10 – mười.' }),
    ord('Xếp các số theo thứ tự đếm', ['6', '7', '8', '9', '10'], { o: 'T1.SO.01', f: 'TOAN.SAPXEP', l: 2, k: 'thu_tu_so', e: 'Thứ tự: 6, 7, 8, 9, 10.' }),
    tf('Số 10 được viết bằng hai chữ số: chữ số 1 và chữ số 0. Đúng hay sai?', 'Đúng', { o: 'T1.SO.01', f: 'TOAN.DUNGSAI', l: 2, k: 'doc_viet_so', e: 'Số 10 viết là 1 và 0 đứng cạnh nhau.' }),
    fb('Đếm tất cả ngón tay trên cả hai bàn tay của em. Có mấy ngón tay?', ['10', 'mười'], {
      o: 'T1.SO.01', f: 'TOAN.DEM', l: 3, k: 'dem_10', e: 'Hai bàn tay có 10 ngón tay.',
      s: 'Giơ hai bàn tay ra, đếm lần lượt từng ngón: 1, 2, 3, 4, 5 ở tay này, rồi 6, 7, 8, 9, 10 ở tay kia. Có 10 ngón tay.',
    }),
  ]),

  L(3, C1, 'Nhiều hơn, ít hơn, bằng nhau', 'So sánh số lượng hai nhóm đồ vật.', 'T1.SO', N10, [
    sc(`${rep('🐱', 3)}\n${rep('🐭', 5)}\nSố mèo ... số chuột`, ['nhiều hơn', 'ít hơn', 'bằng'], 'ít hơn', {
      o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'so_sanh_nhom', e: 'Ghép mỗi con mèo với một con chuột thì còn thừa chuột. Số mèo ít hơn số chuột.',
      s: 'Nối mỗi con mèo với một con chuột: được 3 cặp, còn thừa 2 con chuột chưa có mèo. Nhóm còn thừa là nhóm nhiều hơn. Vậy số mèo ít hơn số chuột.',
    }),
    sc(`${rep('🍎', 4)}\n${rep('🍐', 4)}\nSố táo ... số lê`, ['nhiều hơn', 'ít hơn', 'bằng'], 'bằng', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'so_sanh_nhom', e: 'Ghép từng quả táo với từng quả lê thì vừa hết. Hai nhóm bằng nhau.' }),
    sc(`${rep('🐶', 6)}\n${rep('🦴', 4)}\nSố chó ... số khúc xương`, ['nhiều hơn', 'ít hơn', 'bằng'], 'nhiều hơn', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_nhom', e: 'Mỗi chú chó lấy một khúc xương thì còn 2 chú chó chưa có. Số chó nhiều hơn.' }),
    sc('Nhóm nào có nhiều ngôi sao hơn?', [rep('⭐', 5), rep('⭐', 3)], rep('⭐', 5), { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'so_sanh_nhom', e: 'Nhóm 5 ngôi sao nhiều hơn nhóm 3 ngôi sao.' }),
    mc(`Chọn TẤT CẢ các nhóm có số lượng BẰNG nhóm ${rep('🍓', 3)}`, [rep('🍋', 3), rep('🍇', 2), rep('🍉', 3), rep('🍒', 4)], [rep('🍋', 3), rep('🍉', 3)], {
      o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_nhom', e: 'Nhóm 3 quả chanh và nhóm 3 miếng dưa hấu đều có 3, bằng nhóm dâu.',
    }),
    tf(`${rep('🐰', 4)}\n${rep('🥕', 6)}\nSố thỏ nhiều hơn số cà rốt. Đúng hay sai?`, 'Sai', { o: 'T1.SO.02', f: 'TOAN.DUNGSAI', l: 2, k: 'so_sanh_nhom', e: 'Mỗi chú thỏ một củ thì còn thừa cà rốt. Số thỏ ít hơn.' }),
    sc('Có 5 bạn và 5 cái ghế. Mỗi bạn ngồi 1 ghế thì thế nào?', ['Thừa ghế', 'Thiếu ghế', 'Vừa đủ'], 'Vừa đủ', {
      o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 3, k: 'so_sanh_nhom', e: 'Số bạn bằng số ghế nên vừa đủ.',
      s: 'Ghép mỗi bạn với một cái ghế: ghép hết 5 bạn thì cũng vừa hết 5 ghế, không thừa không thiếu. Vậy vừa đủ.',
    }),
    sc('Có 4 con thỏ và 6 củ cà rốt. Mỗi con thỏ ăn 1 củ thì thế nào?', ['Thừa cà rốt', 'Thiếu cà rốt', 'Vừa đủ'], 'Thừa cà rốt', {
      o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 3, k: 'so_sanh_nhom', e: 'Cà rốt nhiều hơn thỏ nên còn thừa cà rốt.',
      s: 'Cho mỗi con thỏ 1 củ: 4 con thỏ lấy 4 củ. Còn lại 2 củ chưa có thỏ ăn. Vậy thừa cà rốt.',
    }),
  ]),

  L(4, C1, 'So sánh số', 'Dùng dấu >, <, = để so sánh các số trong phạm vi 10.', 'T1.SO', N10, [
    sc('Chọn dấu đúng: 5 ... 7', ['>', '<', '='], '<', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'dau_so_sanh', e: '5 bé hơn 7 nên viết 5 < 7.', s: 'Khi đếm, 5 đến trước 7 nên 5 bé hơn 7. Dấu bé hơn là "<", đầu nhọn chỉ vào số bé. Ta viết 5 < 7.' }),
    sc('Chọn dấu đúng: 9 ... 6', ['>', '<', '='], '>', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'dau_so_sanh', e: '9 lớn hơn 6 nên viết 9 > 6.' }),
    sc('Chọn dấu đúng: 4 ... 4', ['>', '<', '='], '=', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'dau_so_sanh', e: 'Hai số giống nhau thì bằng nhau: 4 = 4.' }),
    tf('8 > 10. Đúng hay sai?', 'Sai', { o: 'T1.SO.02', f: 'TOAN.DUNGSAI', l: 2, k: 'dau_so_sanh', e: '8 bé hơn 10, nên phải viết 8 < 10.' }),
    sc('Số lớn nhất trong các số 3, 8, 5, 6 là số nào?', ['3', '8', '5', '6'], '8', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, k: 'so_lon_nhat', e: 'Trong 3, 5, 6, 8 thì 8 đến sau cùng khi đếm, nên 8 lớn nhất.' }),
    fb('Số bé nhất trong các số 7, 2, 9, 4 là số mấy?', ['2', 'hai'], { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, k: 'so_be_nhat', e: '2 đến trước 4, 7, 9 khi đếm nên 2 bé nhất.' }),
    ord('Xếp các số từ LỚN đến BÉ', ['9', '6', '4', '1'], { o: 'T1.SO.02', f: 'TOAN.SAPXEP', l: 2, k: 'thu_tu_so', e: 'Từ lớn đến bé: 9, 6, 4, 1.', s: 'Tìm số lớn nhất trước: 9. Còn lại 6, 4, 1 thì 6 lớn nhất. Tiếp theo là 4, cuối cùng là 1.' }),
    mc('Chọn TẤT CẢ các số lớn hơn 5', ['3', '6', '8', '5', '10'], ['6', '8', '10'], { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, k: 'dau_so_sanh', e: '6, 8, 10 đều lớn hơn 5. Số 5 bằng 5, không lớn hơn.' }),
    sc('Lan có 6 bông hoa, Hà có 8 bông hoa. Bạn nào có nhiều hoa hơn?', ['Lan', 'Hà'], 'Hà', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 3, s: 'So sánh 6 và 8: đếm 6, 7, 8 thì số 8 đến sau nên 8 lớn hơn 6. Hà có 8 bông nên Hà có nhiều hoa hơn.', k: 'so_sanh_thuc_te', e: '8 lớn hơn 6 nên Hà có nhiều hoa hơn.' }),
    fb('Điền số: 7 < ... < 9', ['8'], { o: 'T1.SO.02', f: 'TOAN.SOTHIEU', l: 3, k: 'dau_so_sanh', e: 'Số lớn hơn 7 và bé hơn 9 là 8.', s: 'Cần một số đứng sau 7 và đứng trước 9 khi đếm: 7, 8, 9. Số đó là 8.' }),
  ]),

  L(5, C1, 'Mấy và mấy', 'Tách một số thành hai phần (ví dụ 5 gồm 2 và 3).', 'T1.SO', N10, [
    fb('5 gồm 2 và mấy?', ['3', 'ba'], { o: 'T1.PT.01', f: 'TOAN.SOTHIEU', l: 1, k: 'may_va_may', e: '5 gồm 2 và 3.' }),
    fb('7 gồm 4 và mấy?', ['3', 'ba'], { o: 'T1.PT.01', f: 'TOAN.SOTHIEU', l: 2, k: 'may_va_may', e: '7 gồm 4 và 3.', s: 'Giơ 7 ngón tay, gập lại 4 ngón. Còn 3 ngón đang giơ. Vậy 7 gồm 4 và 3.' }),
    sc('8 gồm 5 và mấy?', ['2', '3', '4'], '3', { o: 'T1.PT.01', f: 'TOAN.SOTHIEU', l: 2, k: 'may_va_may', e: '8 gồm 5 và 3.' }),
    sc(`${rep('🍎', 2)} và ${rep('🍎', 5)}\nGộp lại có mấy quả táo?`, ['6', '7', '8'], '7', { o: 'T1.PT.01', f: 'TOAN.DEM', l: 1, k: 'may_va_may', e: '2 quả và 5 quả, đếm tất cả được 7 quả.' }),
    mt('Ghép hai phần để được số 6', [['1 và', '5'], ['2 và', '4'], ['3 và', '3']], { o: 'T1.PT.01', f: 'TOAN.SOTHIEU', l: 2, k: 'may_va_may', e: '6 gồm 1 và 5, 2 và 4, 3 và 3.' }),
    tf('10 gồm 6 và 4. Đúng hay sai?', 'Đúng', { o: 'T1.PT.01', f: 'TOAN.DUNGSAI', l: 2, k: 'may_va_may', e: 'Đếm 6 rồi đếm thêm 4: 7, 8, 9, 10. Đúng.' }),
    sc('Số nào gồm 3 và 3?', ['5', '6', '7'], '6', { o: 'T1.PT.01', f: 'TOAN.SOTHIEU', l: 2, k: 'may_va_may', e: '3 và 3 gộp lại là 6.' }),
    fb('Có 9 cái bút chia vào 2 hộp. Hộp thứ nhất có 4 cái. Hộp thứ hai có mấy cái?', ['5', 'năm'], {
      o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, k: 'may_va_may', e: '9 gồm 4 và 5, nên hộp thứ hai có 5 cái.',
      s: 'Tất cả có 9 cái bút. Hộp thứ nhất giữ 4 cái. Đếm tiếp từ 4 đến 9: 5, 6, 7, 8, 9 là 5 lần. Vậy hộp thứ hai có 5 cái bút.',
    }),
  ]),

  L(6, C1, 'Luyện tập chung', 'Ôn đếm, đọc, viết, so sánh và tách số trong phạm vi 10.', 'T1.SO', N10, [
    sc(`${rep('🚗', 9)}\nCó mấy chiếc ô tô?`, ['8', '9', '10'], '9', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_10', e: 'Có 9 chiếc ô tô.' }),
    fb('Viết số: sáu', ['6'], { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 1, k: 'doc_viet_so', e: 'Sáu viết là 6.' }),
    sc('Chọn dấu đúng: 10 ... 7', ['>', '<', '='], '>', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'dau_so_sanh', e: '10 lớn hơn 7.' }),
    fb('9 gồm 7 và mấy?', ['2', 'hai'], { o: 'T1.PT.01', f: 'TOAN.SOTHIEU', l: 2, k: 'may_va_may', e: '9 gồm 7 và 2.' }),
    ord('Xếp từ bé đến lớn', ['0', '3', '7', '10'], { o: 'T1.SO.02', f: 'TOAN.SAPXEP', l: 2, k: 'thu_tu_so', e: '0, 3, 7, 10.' }),
    sc('Số liền trước số 10 là số nào?', ['8', '9', '7'], '9', { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 2, k: 'thu_tu_so', e: 'Đếm 8, 9, 10: số đứng ngay trước 10 là 9.' }),
    tf('Trong các số 4, 0, 6 thì 0 là số bé nhất. Đúng hay sai?', 'Đúng', { o: 'T1.SO.02', f: 'TOAN.DUNGSAI', l: 2, k: 'so_be_nhat', e: '0 là số bé nhất trong các số đã học.' }),
    sc('Nam có 7 viên bi. Minh có số bi nhiều hơn Nam nhưng ít hơn 9. Minh có mấy viên bi?', ['6', '8', '9'], '8', {
      o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 3, k: 'so_sanh_thuc_te', e: 'Số lớn hơn 7 và bé hơn 9 là 8.',
      s: 'Minh có nhiều hơn 7 viên nên có thể là 8, 9, 10... Nhưng phải ít hơn 9, nên chỉ còn 8. Minh có 8 viên bi.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 2 =======================
  L(7, C2, 'Hình vuông, hình tròn, hình tam giác, hình chữ nhật', 'Nhận dạng bốn hình phẳng qua đồ vật thật.', 'T1.HH', N10, [
    sc('Hình 🔵 là hình gì?', ['Hình tròn', 'Hình vuông', 'Hình tam giác'], 'Hình tròn', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Hình tròn không có góc, viền cong đều.' }),
    sc('Hình 🔺 là hình gì?', ['Hình tròn', 'Hình vuông', 'Hình tam giác'], 'Hình tam giác', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Hình tam giác có 3 cạnh.' }),
    sc('Hình 🟩 là hình gì?', ['Hình tròn', 'Hình vuông', 'Hình tam giác'], 'Hình vuông', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Hình vuông có 4 cạnh dài bằng nhau.' }),
    sc('Hình nào có 3 cạnh?', ['Hình vuông', 'Hình tròn', 'Hình tam giác', 'Hình chữ nhật'], 'Hình tam giác', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 2, k: 'hinh_phang', e: 'Hình tam giác có 3 cạnh, 3 góc.' }),
    mt('Ghép đồ vật với hình dạng của mặt đồ vật', [['Mặt đồng hồ treo tường', 'Hình tròn'], ['Mặt quyển vở', 'Hình chữ nhật'], ['Chiếc khăn mùi soa', 'Hình vuông']], {
      o: 'T1.HH.02', f: 'TOAN.HINH', l: 2, k: 'hinh_phang', e: 'Đồng hồ tròn, quyển vở hình chữ nhật, khăn mùi soa hình vuông.',
    }),
    fb('🔺🔵🔺🟩🔺🔵\nCó mấy hình tam giác?', ['3', 'ba'], { o: 'T1.HH.02', f: 'TOAN.DEM', l: 2, k: 'dem_hinh', e: 'Đếm các hình 🔺: có 3 hình tam giác.' }),
    tf('Hình vuông có 4 cạnh dài bằng nhau. Đúng hay sai?', 'Đúng', { o: 'T1.HH.02', f: 'TOAN.DUNGSAI', l: 2, k: 'hinh_phang', e: 'Đúng, 4 cạnh của hình vuông dài bằng nhau.' }),
    mc('Chọn TẤT CẢ đồ vật có mặt là hình tròn', ['Đồng xu', 'Quyển sách', 'Cái đĩa', 'Viên gạch'], ['Đồng xu', 'Cái đĩa'], {
      o: 'T1.HH.02', f: 'TOAN.HINH', l: 3, s: 'Hình dung mặt từng đồ vật: đồng xu và cái đĩa tròn, lăn được. Quyển sách và viên gạch có 4 cạnh, 4 góc nên là hình chữ nhật.', k: 'hinh_phang', e: 'Đồng xu và cái đĩa có mặt tròn. Quyển sách, viên gạch có mặt hình chữ nhật.',
    }),
  ]),

  L(8, C2, 'Thực hành lắp ghép, xếp hình', 'Ghép, xếp hình đơn giản từ hình vuông, tam giác, que tính.', 'T1.HH', N10, [
    sc('Dùng que tính xếp 1 hình tam giác cần mấy que?', ['2', '3', '4'], '3', { o: 'T1.HH.04', f: 'TOAN.HINH', l: 1, k: 'xep_hinh', e: 'Hình tam giác có 3 cạnh nên cần 3 que tính.' }),
    fb('Dùng que tính xếp 1 hình vuông cần mấy que?', ['4', 'bốn'], { o: 'T1.HH.04', f: 'TOAN.HINH', l: 1, k: 'xep_hinh', e: 'Hình vuông có 4 cạnh nên cần 4 que tính.' }),
    sc('Ghép 2 hình vuông bằng nhau đặt sát cạnh nhau thì được hình gì?', ['Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], 'Hình chữ nhật', { o: 'T1.HH.04', f: 'TOAN.HINH', l: 2, k: 'ghep_hinh', e: 'Hai hình vuông đặt cạnh nhau tạo thành hình chữ nhật dài.' }),
    sc('Gấp chéo tờ giấy hình vuông rồi cắt theo nếp gấp, mỗi phần là hình gì?', ['Hình tam giác', 'Hình tròn', 'Hình vuông'], 'Hình tam giác', {
      o: 'T1.HH.04', f: 'TOAN.HINH', l: 2, k: 'ghep_hinh', e: 'Cắt hình vuông theo đường chéo được 2 hình tam giác.',
    }),
    sc('Đặt 🔺 lên trên 🟩 thì trông giống cái gì?', ['Ngôi nhà', 'Con cá', 'Bánh xe'], 'Ngôi nhà', { o: 'T1.HH.04', f: 'TOAN.HINH', l: 1, k: 'ghep_hinh', e: 'Hình tam giác làm mái, hình vuông làm thân nhà.' }),
    sc('Xếp 2 hình vuông rời nhau bằng que tính thì cần tất cả mấy que?', ['6', '7', '8'], '8', {
      o: 'T1.HH.04', f: 'TOAN.HINH', l: 3, k: 'xep_hinh', e: 'Mỗi hình vuông cần 4 que, hai hình rời nhau cần 8 que.',
      s: 'Hình vuông thứ nhất dùng 4 que: đếm 1, 2, 3, 4. Hình vuông thứ hai dùng thêm 4 que nữa: đếm tiếp 5, 6, 7, 8. Cần 8 que tính.',
    }),
    tf('Bánh xe đạp có dạng hình tam giác. Đúng hay sai?', 'Sai', { o: 'T1.HH.02', f: 'TOAN.DUNGSAI', l: 1, k: 'hinh_phang', e: 'Bánh xe có dạng hình tròn để lăn được.' }),
  ]),

  L(9, C2, 'Luyện tập chung', 'Ôn nhận dạng và xếp hình phẳng.', 'T1.HH', N10, [
    sc('Lá cờ Tổ quốc có dạng hình gì?', ['Hình chữ nhật', 'Hình tròn', 'Hình tam giác'], 'Hình chữ nhật', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Lá cờ có dạng hình chữ nhật.' }),
    fb('🔵🟩🔵🔵🔺🔵\nCó mấy hình tròn?', ['4', 'bốn'], { o: 'T1.HH.02', f: 'TOAN.DEM', l: 2, k: 'dem_hinh', e: 'Đếm các hình 🔵: 4 hình tròn.' }),
    mc('Chọn TẤT CẢ hình có 4 cạnh', ['Hình vuông', 'Hình tròn', 'Hình chữ nhật', 'Hình tam giác'], ['Hình vuông', 'Hình chữ nhật'], { o: 'T1.HH.02', f: 'TOAN.HINH', l: 2, k: 'hinh_phang', e: 'Hình vuông và hình chữ nhật đều có 4 cạnh.' }),
    sc('Hình nào KHÔNG có góc?', ['Hình tròn', 'Hình vuông', 'Hình tam giác'], 'Hình tròn', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 2, k: 'hinh_phang', e: 'Hình tròn không có cạnh thẳng, không có góc.' }),
    tf('Xếp 1 hình tam giác cần 4 que tính. Đúng hay sai?', 'Sai', { o: 'T1.HH.04', f: 'TOAN.DUNGSAI', l: 2, k: 'xep_hinh', e: 'Hình tam giác chỉ cần 3 que tính.' }),
    sc('🟥🟦🟥🟦🟥 ... Hình tiếp theo là hình nào?', ['🟥', '🟦', '🔺'], '🟦', {
      o: 'T1.HH.04', f: 'TOAN.HINH', l: 3, k: 'quy_luat', e: 'Các hình xếp xen kẽ đỏ, xanh, đỏ, xanh... nên tiếp theo là hình xanh.',
      s: 'Nhìn quy luật: đỏ – xanh – đỏ – xanh – đỏ. Sau hình đỏ luôn là hình xanh, nên hình tiếp theo là 🟦.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 3 =======================
  L(10, C3, 'Phép cộng trong phạm vi 10', 'Ý nghĩa phép cộng (gộp, thêm), tính cộng trong phạm vi 10.', 'T1.PT', ADD, [
    sc(`${rep('🐥', 2)} thêm ${rep('🐥', 3)}\nCó tất cả mấy con gà con?`, ['4', '5', '6'], '5', { o: 'T1.PT.01', f: 'TOAN.TINH', l: 1, k: 'cong_10', e: '2 thêm 3 là 5: 2 + 3 = 5.' }),
    fb('3 + 4 = ...', ['7'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'cong_10', e: '3 + 4 = 7.', s: 'Bắt đầu từ 4 (số lớn hơn), đếm thêm 3: 5, 6, 7. Vậy 3 + 4 = 7.' }),
    fb('5 + 0 = ...', ['5'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'cong_0', e: 'Số nào cộng với 0 cũng bằng chính số đó.' }),
    sc('Phép tính nào có kết quả bằng 6?', ['2 + 4', '3 + 2', '5 + 2'], '2 + 4', { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'cong_10', e: '2 + 4 = 6; 3 + 2 = 5; 5 + 2 = 7.' }),
    tf('1 + 7 = 8. Đúng hay sai?', 'Đúng', { o: 'T1.PT.02', f: 'TOAN.DUNGSAI', l: 1, k: 'cong_10', e: 'Từ 7 đếm thêm 1 được 8.' }),
    fb('4 + ... = 9', ['5'], { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 2, k: 'cong_10', e: '9 gồm 4 và 5, nên 4 + 5 = 9.', s: 'Từ 4 đếm tiếp đến 9: 5, 6, 7, 8, 9 là 5 lần. Số cần điền là 5.' }),
    mt('Ghép phép tính với kết quả', [['2 + 2', '4'], ['6 + 3', '9'], ['1 + 5', '6']], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'cong_10', e: '2 + 2 = 4; 6 + 3 = 9; 1 + 5 = 6.' }),
    tf('4 + 5 = 5 + 4. Đúng hay sai?', 'Đúng', { o: 'T1.PT.02', f: 'TOAN.DUNGSAI', l: 2, k: 'cong_10', e: 'Đổi chỗ hai số trong phép cộng thì kết quả không đổi: đều bằng 9.' }),
    fb('Trong vườn có 6 cây cam, bố trồng thêm 2 cây. Trong vườn có tất cả mấy cây cam?', ['8', 'tám'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'toan_loi_van_cong', e: '6 + 2 = 8 cây cam.',
      s: '"Trồng thêm" nghĩa là nhiều lên, ta làm phép cộng. Phép tính: 6 + 2 = 8. Trả lời: Trong vườn có tất cả 8 cây cam.',
    }),
    sc('Có 3 bạn đang chơi, thêm 4 bạn nữa chạy đến. Phép tính đúng là:', ['3 + 4 = 7', '3 + 5 = 8', '4 + 4 = 8'], '3 + 4 = 7', {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, s: 'Có 3 bạn, thêm 4 bạn nữa nên làm phép cộng 3 + 4. Từ 4 đếm thêm 3: 5, 6, 7. Phép tính đúng là 3 + 4 = 7.', k: 'toan_loi_van_cong', e: '3 bạn thêm 4 bạn: 3 + 4 = 7.',
    }),
  ]),

  L(11, C3, 'Phép trừ trong phạm vi 10', 'Ý nghĩa phép trừ (bớt đi, tách ra), tính trừ trong phạm vi 10.', 'T1.PT', ADDSUB, [
    sc(`${rep('🎈', 5)}\nBay mất 2 quả. Còn lại mấy quả bóng?`, ['2', '3', '4'], '3', { o: 'T1.PT.01', f: 'TOAN.TINH', l: 1, k: 'tru_10', e: '5 bớt 2 còn 3: 5 - 2 = 3.' }),
    fb('8 - 3 = ...', ['5'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'tru_10', e: '8 - 3 = 5.', s: 'Từ 8 đếm lùi 3 bước: 7, 6, 5. Vậy 8 - 3 = 5.' }),
    fb('6 - 6 = ...', ['0'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'tru_10', e: 'Một số trừ đi chính nó thì bằng 0.' }),
    fb('7 - 0 = ...', ['7'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'tru_10', e: 'Trừ đi 0 thì số vẫn giữ nguyên.' }),
    sc('Phép tính nào có kết quả bằng 4?', ['9 - 5', '8 - 3', '6 - 1'], '9 - 5', { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'tru_10', e: '9 - 5 = 4; 8 - 3 = 5; 6 - 1 = 5.' }),
    fb('10 - ... = 6', ['4'], { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 2, k: 'tru_10', e: '10 gồm 6 và 4, nên 10 - 4 = 6.' }),
    mt('Ghép phép tính với kết quả', [['9 - 2', '7'], ['5 - 4', '1'], ['10 - 7', '3']], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'tru_10', e: '9 - 2 = 7; 5 - 4 = 1; 10 - 7 = 3.' }),
    tf('7 - 2 = 4. Đúng hay sai?', 'Sai', { o: 'T1.PT.02', f: 'TOAN.DUNGSAI', l: 1, k: 'tru_10', e: '7 - 2 = 5, không phải 4.' }),
    fb('Mẹ mua 9 quả trứng, đã dùng 4 quả để làm bánh. Còn lại mấy quả trứng?', ['5', 'năm'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'toan_loi_van_tru', e: '9 - 4 = 5 quả trứng.',
      s: '"Đã dùng" nghĩa là bớt đi, ta làm phép trừ. Phép tính: 9 - 4 = 5. Trả lời: Còn lại 5 quả trứng.',
    }),
    sc('Trên cành có 8 con chim, 3 con bay đi. Phép tính đúng là:', ['8 - 3 = 5', '8 - 5 = 3', '8 - 3 = 4'], '8 - 3 = 5', {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, s: 'Bay đi là bớt đi nên làm phép trừ: lấy 8 trừ 3. Đếm lùi từ 8: 7, 6, 5. Vậy 8 - 3 = 5.', k: 'toan_loi_van_tru', e: 'Có 8 con, bay đi 3 con: 8 - 3 = 5.',
    }),
  ]),

  L(12, C3, 'Bảng cộng, bảng trừ trong phạm vi 10', 'Thuộc bảng cộng, bảng trừ; quan hệ giữa phép cộng và phép trừ.', 'T1.PT', ADDSUB, [
    fb('2 + 8 = ...', ['10'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'bang_cong', e: '2 + 8 = 10.' }),
    fb('9 - 4 = ...', ['5'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'bang_tru', e: '9 - 4 = 5.' }),
    sc('Điền số: 3 + ... = 10', ['6', '7', '8'], '7', { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 2, k: 'bang_cong', e: '10 gồm 3 và 7.' }),
    mc('Chọn TẤT CẢ phép tính có kết quả bằng 10', ['4 + 6', '7 + 2', '5 + 5', '8 + 1'], ['4 + 6', '5 + 5'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'bang_cong', e: '4 + 6 = 10; 5 + 5 = 10; 7 + 2 = 9; 8 + 1 = 9.' }),
    sc('Từ phép cộng 3 + 5 = 8, ta có phép trừ nào đúng?', ['8 - 5 = 3', '8 - 3 = 4', '5 - 3 = 8'], '8 - 5 = 3', {
      o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, k: 'cong_tru_lien_he', e: '8 gồm 3 và 5, nên 8 - 5 = 3 và 8 - 3 = 5.',
      s: 'Phép cộng 3 + 5 = 8 cho biết 8 gồm 3 và 5. Lấy 8 bớt đi 5 thì còn lại 3. Vậy 8 - 5 = 3.',
    }),
    fb('10 - 3 - 2 = ...', ['5'], { o: 'T1.PT.06', f: 'TOAN.TINH', l: 3, k: 'hai_dau_tinh', e: 'Tính từ trái sang phải: 10 - 3 = 7, rồi 7 - 2 = 5.', s: 'Làm lần lượt từ trái sang phải. Bước 1: 10 - 3 = 7. Bước 2: 7 - 2 = 5. Kết quả là 5.' }),
    tf('6 + 3 = 10 - 1. Đúng hay sai?', 'Đúng', { o: 'T1.PT.06', f: 'TOAN.DUNGSAI', l: 3, s: 'Tính bên trái: 6 + 3 = 9. Tính bên phải: 10 - 1 = 9. Hai bên đều bằng 9 nên câu này đúng.', k: 'hai_dau_tinh', e: '6 + 3 = 9 và 10 - 1 = 9, hai bên bằng nhau.' }),
    ord('Xếp các phép tính theo kết quả từ bé đến lớn', ['2 + 1', '6 - 0', '5 + 4'], {
      o: 'T1.PT.02', f: 'TOAN.SAPXEP', l: 3, k: 'bang_cong', e: '2 + 1 = 3; 6 - 0 = 6; 5 + 4 = 9.',
      s: 'Tính từng phép: 5 + 4 = 9, 2 + 1 = 3, 6 - 0 = 6. So sánh 3 < 6 < 9, nên thứ tự là 2 + 1, 6 - 0, 5 + 4.',
    }),
  ]),

  L(13, C3, 'Luyện tập chung', 'Ôn cộng, trừ trong phạm vi 10 và bài toán có lời văn.', 'T1.PT', ADDSUB, [
    fb('6 + 4 = ...', ['10'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'bang_cong', e: '6 + 4 = 10.' }),
    fb('10 - 8 = ...', ['2'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'bang_tru', e: '10 - 8 = 2.' }),
    sc('Chọn dấu đúng: 5 + 3 ... 7', ['>', '<', '='], '>', { o: 'T1.PT.06', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_phep_tinh', e: '5 + 3 = 8, mà 8 > 7.' }),
    fb('... - 2 = 6', ['8'], { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 3, k: 'bang_tru', e: '8 - 2 = 6.', s: 'Số nào bớt đi 2 thì còn 6? Ngược lại, 6 thêm 2 là 8. Vậy số cần điền là 8.' }),
    fb('2 + 3 + 4 = ...', ['9'], { o: 'T1.PT.06', f: 'TOAN.TINH', l: 2, k: 'hai_dau_tinh', e: '2 + 3 = 5; 5 + 4 = 9.' }),
    fb('Lớp em có 10 quả bóng, đã cho lớp bạn mượn 3 quả. Lớp em còn lại mấy quả bóng?', ['7', 'bảy'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'toan_loi_van_tru', e: '10 - 3 = 7 quả bóng.',
      s: 'Cho mượn đi là bớt đi: 10 - 3 = 7. Trả lời: Lớp em còn lại 7 quả bóng.',
    }),
    fb('Bình có 4 cái nhãn vở, chị cho thêm 4 cái. Bình có tất cả mấy cái nhãn vở?', ['8', 'tám'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'toan_loi_van_cong', e: '4 + 4 = 8 cái nhãn vở.',
      s: 'Chị cho thêm là nhiều lên: 4 + 4 = 8. Trả lời: Bình có tất cả 8 cái nhãn vở.',
    }),
    mt('Ghép hai phép tính có cùng kết quả', [['3 + 3', '9 - 3'], ['7 + 1', '10 - 2'], ['2 + 2', '5 - 1']], {
      o: 'T1.PT.02', f: 'TOAN.TINH', l: 3, s: 'Tính từng phép trước: 3 + 3 = 6, 7 + 1 = 8, 2 + 2 = 4; 9 - 3 = 6, 10 - 2 = 8, 5 - 1 = 4. Rồi ghép các phép có cùng kết quả.', k: 'cong_tru_lien_he', e: '3 + 3 = 6 = 9 - 3; 7 + 1 = 8 = 10 - 2; 2 + 2 = 4 = 5 - 1.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 4 =======================
  L(14, C4, 'Khối lập phương, khối hộp chữ nhật', 'Nhận dạng khối lập phương, khối hộp chữ nhật qua đồ vật.', 'T1.HH', ADDSUB, [
    sc('Con xúc xắc 🎲 có dạng khối gì?', ['Khối lập phương', 'Khối hộp chữ nhật'], 'Khối lập phương', { o: 'T1.HH.03', f: 'TOAN.HINH', l: 1, k: 'hinh_khoi', e: 'Xúc xắc có các mặt là hình vuông bằng nhau: khối lập phương.' }),
    sc('Hộp sữa giấy có dạng khối gì?', ['Khối lập phương', 'Khối hộp chữ nhật'], 'Khối hộp chữ nhật', { o: 'T1.HH.03', f: 'TOAN.HINH', l: 2, k: 'hinh_khoi', e: 'Hộp sữa dài, có mặt là hình chữ nhật: khối hộp chữ nhật.' }),
    mc('Chọn TẤT CẢ đồ vật có dạng khối hộp chữ nhật', ['Hộp bánh quy', 'Quả bóng', 'Viên gạch', 'Quả cam'], ['Hộp bánh quy', 'Viên gạch'], { o: 'T1.HH.03', f: 'TOAN.HINH', l: 2, k: 'hinh_khoi', e: 'Hộp bánh và viên gạch là khối hộp chữ nhật; quả bóng, quả cam tròn.' }),
    tf('Khối lập phương có các mặt đều là hình vuông. Đúng hay sai?', 'Đúng', { o: 'T1.HH.03', f: 'TOAN.DUNGSAI', l: 2, k: 'hinh_khoi', e: 'Đúng, mọi mặt của khối lập phương là hình vuông.' }),
    mt('Ghép đồ vật với dạng khối', [['Con xúc xắc', 'Khối lập phương'], ['Viên gạch', 'Khối hộp chữ nhật']], { o: 'T1.HH.03', f: 'TOAN.HINH', l: 2, k: 'hinh_khoi', e: 'Xúc xắc là khối lập phương, viên gạch là khối hộp chữ nhật.' }),
    fb('Bạn Hoa xếp 3 khối lập phương ở dưới và 2 khối ở trên. Bạn dùng tất cả mấy khối?', ['5', 'năm'], {
      o: 'T1.HH.03', f: 'TOAN.LOIVAN', l: 3, k: 'hinh_khoi', e: '3 + 2 = 5 khối.',
      s: 'Đếm khối ở dưới: 3. Đếm thêm khối ở trên: 4, 5. Bạn dùng tất cả 5 khối lập phương (3 + 2 = 5).',
    }),
  ]),

  L(15, C4, 'Vị trí, định hướng trong không gian', 'Trên – dưới, phải – trái, trước – sau, ở giữa.', 'T1.HH', ADDSUB, [
    sc('Quả bóng nằm dưới gầm bàn. Quả bóng ở ... cái bàn.', ['trên', 'dưới', 'trước'], 'dưới', { o: 'T1.HH.01', f: 'TOAN.HINH', l: 1, k: 'vi_tri', e: 'Gầm bàn ở phía dưới mặt bàn.' }),
    sc('Ba bạn đứng thành hàng: Nam, Bình, An. Bạn nào đứng ở giữa?', ['Nam', 'Bình', 'An'], 'Bình', { o: 'T1.HH.01', f: 'TOAN.HINH', l: 1, k: 'vi_tri', e: 'Bình đứng giữa Nam và An.' }),
    sc('🍎🍌🍇\nQuả nào ở bên phải quả chuối?', ['Quả táo', 'Quả nho'], 'Quả nho', { o: 'T1.HH.01', f: 'TOAN.HINH', l: 2, k: 'trai_phai', e: 'Nhìn từ trái sang phải: táo, chuối, nho. Bên phải chuối là nho.' }),
    tf('🐱🐶\nCon mèo ở bên trái con chó. Đúng hay sai?', 'Đúng', { o: 'T1.HH.01', f: 'TOAN.DUNGSAI', l: 2, k: 'trai_phai', e: 'Mèo đứng trước, ở phía trái của chó.' }),
    sc('Trong lớp, bảng ở phía trước. Em ngồi bàn đầu, bạn Hà ngồi bàn thứ hai ngay sau em. Bạn Hà ở phía nào của em?', ['phía trước', 'phía sau'], 'phía sau', {
      o: 'T1.HH.01', f: 'TOAN.HINH', l: 3, s: 'Bảng ở phía trước. Em ngồi bàn đầu, gần bảng. Hà ngồi bàn thứ hai, ngay sau lưng em. Vậy Hà ở phía sau em.', k: 'truoc_sau', e: 'Bàn thứ hai ở sau bàn đầu, nên Hà ở phía sau em.',
    }),
    ord('Nhà có 3 tầng. Xếp từ tầng cao nhất xuống tầng thấp nhất', ['Tầng 3', 'Tầng 2', 'Tầng 1'], { o: 'T1.HH.01', f: 'TOAN.SAPXEP', l: 2, k: 'tren_duoi', e: 'Từ trên xuống: tầng 3, tầng 2, tầng 1.' }),
  ]),

  L(16, C4, 'Luyện tập chung', 'Ôn hình khối và vị trí.', 'T1.HH', ADDSUB, [
    sc('Quyển từ điển dày có dạng khối gì?', ['Khối lập phương', 'Khối hộp chữ nhật'], 'Khối hộp chữ nhật', { o: 'T1.HH.03', f: 'TOAN.HINH', l: 2, k: 'hinh_khoi', e: 'Quyển sách dày có dạng khối hộp chữ nhật.' }),
    sc('Con mèo nằm trên mái nhà. Mái nhà ở ... con mèo.', ['trên', 'dưới'], 'dưới', { o: 'T1.HH.01', f: 'TOAN.HINH', l: 2, k: 'tren_duoi', e: 'Mèo ở trên mái nhà, nên mái nhà ở dưới con mèo.' }),
    fb('🎲🎲🎲🎲\nCó mấy khối lập phương?', ['4', 'bốn'], { o: 'T1.HH.03', f: 'TOAN.DEM', l: 1, k: 'hinh_khoi', e: 'Có 4 con xúc xắc, mỗi con là một khối lập phương.' }),
    tf('🚗🚲🚌\nXe đạp ở giữa ô tô và xe buýt. Đúng hay sai?', 'Đúng', { o: 'T1.HH.01', f: 'TOAN.DUNGSAI', l: 2, k: 'vi_tri', e: 'Xe đạp đứng giữa hai xe.' }),
    sc('Trong hàng có 5 bạn. Lan đứng đầu hàng. Có mấy bạn đứng sau Lan?', ['3', '4', '5'], '4', {
      o: 'T1.HH.01', f: 'TOAN.LOIVAN', l: 3, k: 'truoc_sau', e: '5 bạn trừ Lan còn 4 bạn đứng sau: 5 - 1 = 4.',
      s: 'Hàng có 5 bạn, Lan đứng đầu nên mọi bạn khác đều ở sau Lan. Bớt Lan ra: 5 - 1 = 4. Có 4 bạn đứng sau Lan.',
    }),
  ]),

  // ======================= CHỦ ĐỀ 5 =======================
  L(17, C5, 'Ôn tập các số trong phạm vi 10', 'Ôn đếm, đọc, viết, so sánh, sắp xếp số.', 'T1.SO', ADDSUB, [
    sc(`${rep('🐝', 8)}\nCó mấy con ong?`, ['7', '8', '9'], '8', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_10', e: 'Có 8 con ong.' }),
    mt('Ghép cách đọc với số', [['năm', '5'], ['chín', '9'], ['không', '0']], { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 1, k: 'doc_viet_so', e: 'năm – 5, chín – 9, không – 0.' }),
    sc('Chọn dấu đúng: 6 ... 9', ['>', '<', '='], '<', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, k: 'dau_so_sanh', e: '6 < 9.' }),
    ord('Xếp từ bé đến lớn', ['1', '4', '5', '8'], { o: 'T1.SO.02', f: 'TOAN.SAPXEP', l: 2, k: 'thu_tu_so', e: '1, 4, 5, 8.' }),
    fb('Số lớn nhất có một chữ số là số mấy?', ['9', 'chín'], { o: 'T1.SO.01', f: 'TOAN.DOCVIET', l: 3, k: 'doc_viet_so', e: 'Các số có một chữ số là 0 đến 9, lớn nhất là 9.', s: 'Số có một chữ số là các số 0, 1, 2, ..., 9. Số 10 đã có hai chữ số. Vậy số lớn nhất có một chữ số là 9.' }),
    mc('Chọn TẤT CẢ các số bé hơn 4', ['2', '5', '0', '4', '3'], ['2', '0', '3'], { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, k: 'dau_so_sanh', e: '0, 2, 3 bé hơn 4.' }),
  ]),

  L(18, C5, 'Ôn tập phép cộng, phép trừ trong phạm vi 10', 'Ôn bảng cộng, bảng trừ và giải toán có lời văn.', 'T1.PT', ADDSUB, [
    fb('5 + 5 = ...', ['10'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'bang_cong', e: '5 + 5 = 10.' }),
    fb('9 - 7 = ...', ['2'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 1, k: 'bang_tru', e: '9 - 7 = 2.' }),
    fb('... + 3 = 7', ['4'], { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 2, k: 'bang_cong', e: '4 + 3 = 7.' }),
    fb('8 - 4 + 3 = ...', ['7'], { o: 'T1.PT.06', f: 'TOAN.TINH', l: 3, s: 'Tính lần lượt từ trái sang phải. Bước 1: 8 - 4 = 4. Bước 2: 4 + 3 = 7. Kết quả là 7.', k: 'hai_dau_tinh', e: '8 - 4 = 4; 4 + 3 = 7.' }),
    sc('Trong chuồng có 7 con gà, 2 con chạy ra sân. Trong chuồng còn mấy con gà?', ['5', '6', '9'], '5', {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'toan_loi_van_tru', e: '7 - 2 = 5 con gà.',
      s: '"Chạy ra sân" nghĩa là trong chuồng bớt đi 2 con. Phép tính: 7 - 2 = 5. Trong chuồng còn 5 con gà.',
    }),
    tf('3 + 6 = 6 + 3. Đúng hay sai?', 'Đúng', { o: 'T1.PT.02', f: 'TOAN.DUNGSAI', l: 2, k: 'cong_10', e: 'Đổi chỗ các số trong phép cộng, kết quả vẫn là 9.' }),
  ]),

  L(19, C5, 'Ôn tập hình học', 'Ôn hình phẳng, hình khối, vị trí.', 'T1.HH', ADDSUB, [
    sc('Hình có 3 cạnh là hình gì?', ['Hình tam giác', 'Hình vuông', 'Hình tròn'], 'Hình tam giác', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Hình tam giác có 3 cạnh.' }),
    sc('Viên đá lạnh hình vuông, các mặt đều là hình vuông, có dạng khối gì?', ['Khối lập phương', 'Khối hộp chữ nhật'], 'Khối lập phương', { o: 'T1.HH.03', f: 'TOAN.HINH', l: 2, k: 'hinh_khoi', e: 'Các mặt đều là hình vuông: khối lập phương.' }),
    fb('🟩🔺🟩🔵🟩\nCó mấy hình vuông?', ['3', 'ba'], { o: 'T1.HH.02', f: 'TOAN.DEM', l: 2, k: 'dem_hinh', e: 'Có 3 hình vuông 🟩.' }),
    sc('⭐🌙☀️\nHình mặt trăng ở đâu?', ['Ở giữa', 'Bên trái', 'Bên phải'], 'Ở giữa', { o: 'T1.HH.01', f: 'TOAN.HINH', l: 2, k: 'vi_tri', e: 'Mặt trăng ở giữa ngôi sao và mặt trời.' }),
    tf('Quả bóng có dạng khối lập phương. Đúng hay sai?', 'Sai', { o: 'T1.HH.03', f: 'TOAN.DUNGSAI', l: 2, k: 'hinh_khoi', e: 'Quả bóng tròn, lăn được, không phải khối lập phương.' }),
    fb('Bạn Minh xếp một ngôi nhà bằng que tính: thân nhà là 1 hình vuông, mái nhà là 1 hình tam giác dùng chung cạnh trên với hình vuông. Bạn cần tất cả mấy que tính?', ['6', 'sáu'], {
      o: 'T1.HH.04', f: 'TOAN.HINH', l: 3, k: 'xep_hinh', e: 'Hình vuông 4 que, mái thêm 2 que (cạnh dưới mái dùng chung): 4 + 2 = 6.',
      s: 'Thân nhà là hình vuông cần 4 que. Mái là hình tam giác có 3 cạnh, nhưng cạnh dưới trùng với cạnh trên của hình vuông nên chỉ cần thêm 2 que. Tất cả: 4 + 2 = 6 que.',
    }),
  ]),

  L(20, C5, 'Ôn tập chung', 'Ôn tổng hợp học kì 1.', 'T1.PT', ADDSUB, [
    sc(`${rep('🍒', 6)}\nCó mấy quả anh đào?`, ['5', '6', '7'], '6', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, k: 'dem_10', e: 'Có 6 quả.' }),
    fb('4 + 6 - 5 = ...', ['5'], { o: 'T1.PT.06', f: 'TOAN.TINH', l: 2, k: 'hai_dau_tinh', e: '4 + 6 = 10; 10 - 5 = 5.' }),
    sc('Chọn dấu đúng: 9 - 3 ... 6', ['>', '<', '='], '=', { o: 'T1.PT.06', f: 'TOAN.SOSANH', l: 2, k: 'so_sanh_phep_tinh', e: '9 - 3 = 6, bằng 6.' }),
    sc('Hình nào có 4 cạnh bằng nhau?', ['Hình vuông', 'Hình tam giác', 'Hình tròn'], 'Hình vuông', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, k: 'hinh_phang', e: 'Hình vuông có 4 cạnh bằng nhau.' }),
    fb('Một hộp có 10 cái bánh. Em ăn 2 cái, mẹ ăn 3 cái. Trong hộp còn mấy cái bánh?', ['5', 'năm'], {
      o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 3, k: 'toan_loi_van_tru', e: '10 - 2 - 3 = 5 cái bánh.',
      s: 'Bước 1: em ăn 2 cái, còn 10 - 2 = 8 cái. Bước 2: mẹ ăn 3 cái, còn 8 - 3 = 5 cái. Trong hộp còn 5 cái bánh.',
    }),
    ord('Xếp các số từ lớn đến bé', ['10', '7', '3', '0'], { o: 'T1.SO.02', f: 'TOAN.SAPXEP', l: 2, k: 'thu_tu_so', e: '10, 7, 3, 0.' }),
  ]),
];
