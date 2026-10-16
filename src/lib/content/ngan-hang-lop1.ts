// NGÂN HÀNG CÂU HỎI LỚP 1 — phân theo môn và cấp độ L1–L5 (thang nội bộ EduChain Kids).
//
// - EC1-001 … EC1-045: bộ mẫu ban đầu (file EduChain_Kids_Ngan_hang_cau_hoi_mau_Lop_1.xlsx). Một số câu được điều chỉnh
//   cấp độ cho đúng độ khó thực tế (ghi ở levelBefore). Câu trả lời mở (Trả lời ngắn, Nói/ghi âm) có thêm bản chấm tự động
//   để dùng trong app; bản gốc vẫn giữ trong Excel để giáo viên chấm theo rubric.
// - EC1-046 … EC1-120: câu EduChain Kids soạn thêm, chờ giáo viên duyệt.
// - Mỗi môn 40 câu = 8 câu × 5 cấp độ, chia thành 4 đề ôn (mỗi đề 10 câu, đi từ L1 đến L5).
//
// Phạm vi: Toán trong phạm vi 10 (cộng, trừ); Tiếng Việt dùng âm, vần của Tập 1; Tiếng Anh dùng từ vựng
// Global Success 1 (Unit 1–8) và một số từ thông dụng có trong bộ mẫu (danh sách EN_BANK_EXTRA — giáo viên xác nhận trường đã dạy).
//
// Sửa file này rồi chạy:  npm run check:content  ·  npm run gen:sql  ·  npm run export:bank (cập nhật file Excel)

import type { SubjectCode } from '../types';
import type { ContentLesson, ContentQuestion, Level } from './types';
import { fb, mc, mt, ord, sc, tf } from './types';

export type BankItem = {
  id: string;
  subject: SubjectCode;
  origin: 'mau' | 'moi'; // bộ mẫu ban đầu / soạn thêm
  levelBefore?: Level; // cấp độ trong bộ mẫu, nếu đã điều chỉnh
  levelReason?: string;
  // Thông tin mô tả (câu mới; câu mẫu lấy từ file Excel gốc)
  stage?: string;
  topic?: string;
  prerequisite?: string;
  basis?: string;
  review?: string; // ghi chú kiểm duyệt
  appNote?: string; // bản trong app khác bản gốc thế nào
  q: ContentQuestion; // bản dùng trong app — chấm tự động
};

// Từ tiếng Anh ngoài Global Success 1 (Unit 1–8) xuất hiện trong bộ mẫu.
export const EN_BANK_EXTRA = [
  'thank', "you're", 'welcome', 'good', 'morning', 'night', 'blue', 'yellow', 'purple', 'one', 'two', 'three',
  'which', 'number', 'word', 'means', 'ripe', 'banana', 'usually', 'listen', 'point', 'to', 'the', 'like', 'name',
  "it's", 'dogs', 'cats', 'cakes', 'doors',
];

type Info = Pick<BankItem, 'stage' | 'topic' | 'prerequisite' | 'basis' | 'review' | 'appNote' | 'levelBefore' | 'levelReason'>;
const mau = (id: string, subject: SubjectCode, q: ContentQuestion, info: Info = {}): BankItem => ({ id, subject, origin: 'mau', q, ...info });
const moi = (id: string, subject: SubjectCode, q: ContentQuestion, info: Info): BankItem => ({ id, subject, origin: 'moi', q, ...info });

const CT = 'Chương trình GDPT 2018 – Toán 1; đối chiếu SGK Kết nối tri thức.';
const CV = 'Chương trình GDPT 2018 – Tiếng Việt 1; đối chiếu SGK Kết nối tri thức (Tập 1).';
const CA = 'Làm quen tiếng Anh lớp 1; từ vựng Global Success 1 (Unit 1–8).';

// ===========================================================================
// TOÁN
// ===========================================================================
const TOAN: BankItem[] = [
  // ---- L1 Làm quen
  mau('EC1-001', 'toan', sc('Có 3 quả táo. Số quả táo là số nào?', ['2', '3', '4'], '3', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, e: 'Đếm lần lượt 1, 2, 3 quả; có 3 quả.' })),
  mau('EC1-002', 'toan', sc('Số nào bé hơn 4?', ['5', '3', '6'], '3', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 1, e: '3 bé hơn 4.' })),
  mau('EC1-003', 'toan', sc('Vật nào thường có dạng hình tròn?', ['Quả bóng', 'Quyển sách', 'Hộp vuông'], 'Quả bóng', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, e: 'Quả bóng được minh họa bằng dạng tròn.' })),
  moi('EC1-046', 'toan', sc('Đếm số ngôi sao: ⭐⭐⭐⭐⭐', ['4', '5', '6'], '5', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, e: 'Đếm lần lượt 1, 2, 3, 4, 5: có 5 ngôi sao.' }), {
    stage: 'Sau khi học các số 0–5', topic: 'Đếm số lượng', prerequisite: 'Đã học đếm và nhận biết số đến 5.', basis: CT,
  }),
  moi('EC1-047', 'toan', tf('Số 7 lớn hơn số 5.', 'Đúng', { o: 'T1.SO.02', f: 'TOAN.DUNGSAI', l: 1, e: 'Đếm 5, 6, 7: số 7 đứng sau số 5 nên 7 lớn hơn 5.' }), {
    stage: 'Sau khi học so sánh số', topic: 'So sánh số', prerequisite: 'Đã học so sánh các số trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-048', 'toan', sc('Hình nào có 3 cạnh?', ['Hình tam giác', 'Hình vuông', 'Hình tròn'], 'Hình tam giác', { o: 'T1.HH.02', f: 'TOAN.HINH', l: 1, e: 'Hình tam giác có 3 cạnh.' }), {
    stage: 'Sau khi học hình phẳng', topic: 'Hình dạng', prerequisite: 'Đã học hình vuông, hình tròn, hình tam giác.', basis: CT,
  }),
  moi('EC1-049', 'toan', fb('Đếm tiếp: 4, 5, 6, ... Số tiếp theo là số mấy?', ['7', 'bảy'], { o: 'T1.SO.01', f: 'TOAN.SOTHIEU', l: 1, e: 'Đếm tiếp sau 6 là 7.' }), {
    stage: 'Sau khi học các số 0–10', topic: 'Thứ tự số', prerequisite: 'Đã học đếm đến 10.', basis: CT,
  }),
  moi('EC1-050', 'toan', sc('Trong đĩa không có quả nào. Số quả trong đĩa là số mấy?', ['0', '1', '2'], '0', { o: 'T1.SO.01', f: 'TOAN.DEM', l: 1, e: 'Không có quả nào thì viết số 0.' }), {
    stage: 'Sau khi học số 0', topic: 'Số 0', prerequisite: 'Đã học số 0.', basis: CT,
  }),

  // ---- L2 Cơ bản
  mau('EC1-004', 'toan', fb('2 + 1 = ?', ['3', 'ba'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, e: 'Có 2 đồ vật, thêm 1 thì có 3.' })),
  mau('EC1-005', 'toan', sc('Nhóm 5 con cá và nhóm 3 con cá. Nhóm nào nhiều hơn?', ['Nhóm 5 con', 'Nhóm 3 con', 'Bằng nhau'], 'Nhóm 5 con', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, e: '5 nhiều hơn 3.' })),
  mau('EC1-006', 'toan', fb('4 − 1 = ?', ['3', 'ba'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, e: 'Bớt 1 từ 4 còn 3.' })),
  moi('EC1-051', 'toan', fb('3 + 4 = ?', ['7', 'bảy'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, e: '3 thêm 4 là 7.' }), {
    stage: 'Sau khi học phép cộng trong phạm vi 10', topic: 'Phép cộng', prerequisite: 'Đã học cộng trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-052', 'toan', fb('9 − 5 = ?', ['4', 'bốn'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, e: '9 bớt 5 còn 4.' }), {
    stage: 'Sau khi học phép trừ trong phạm vi 10', topic: 'Phép trừ', prerequisite: 'Đã học trừ trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-053', 'toan', sc('Chọn dấu đúng: 6 ... 8', ['>', '<', '='], '<', { o: 'T1.SO.02', f: 'TOAN.SOSANH', l: 2, e: '6 bé hơn 8 nên điền dấu <.' }), {
    stage: 'Sau khi học dấu >, <, =', topic: 'So sánh số', prerequisite: 'Đã học các dấu >, <, =.', basis: CT,
  }),
  moi('EC1-054', 'toan', ord('Xếp các số theo thứ tự từ bé đến lớn.', ['2', '5', '7', '9'], { o: 'T1.SO.02', f: 'TOAN.SAPXEP', l: 2, e: 'Từ bé đến lớn: 2, 5, 7, 9.' }), {
    stage: 'Sau khi học so sánh, xếp thứ tự số', topic: 'Xếp thứ tự số', prerequisite: 'Đã học so sánh số trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-055', 'toan', sc('Phép tính nào có kết quả bằng 5?', ['2 + 3', '4 + 2', '6 − 2'], '2 + 3', { o: 'T1.PT.02', f: 'TOAN.TINH', l: 2, e: '2 + 3 = 5; 4 + 2 = 6; 6 − 2 = 4.' }), {
    stage: 'Sau khi học cộng, trừ trong phạm vi 10', topic: 'Tính nhẩm', prerequisite: 'Đã học cộng, trừ trong phạm vi 10.', basis: CT,
  }),

  // ---- L3 Vận dụng
  mau('EC1-007', 'toan', fb('Mai có 2 bút chì, được tặng thêm 2. Mai có tất cả bao nhiêu bút chì?', ['4', 'bốn'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: 'Thêm vào nên tính 2 + 2 = 4.', s: 'Được tặng thêm là gộp lại, ta làm phép cộng: 2 + 2 = 4. Mai có 4 bút chì.' })),
  mau('EC1-008', 'toan', fb('Có 5 con chim, 2 con bay đi. Còn lại bao nhiêu con?', ['3', 'ba'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: 'Bớt đi nên tính 5 − 2 = 3.', s: 'Bay đi là bớt đi, ta làm phép trừ: 5 − 2 = 3. Còn lại 3 con chim.' })),
  mau('EC1-009', 'toan', fb('Có 5 khối gỗ, 2 khối đỏ, còn lại xanh. Có mấy khối xanh?', ['3', 'ba'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: '5 − 2 = 3.', s: 'Lấy tất cả trừ đi số khối đỏ: 5 − 2 = 3. Có 3 khối xanh.' })),
  mau('EC1-012', 'toan', fb('Có 2 con vịt, 3 con đi tới. Có tất cả bao nhiêu con?', ['5', 'năm'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: 'Có thêm vịt: 2 + 3 = 5.', s: 'Đi tới là thêm vào: 2 + 3 = 5. Có tất cả 5 con vịt.' }), {
    levelBefore: 4, levelReason: 'Cùng dạng "thêm vào" với EC1-007 (một phép tính), nên xếp L3.',
  }),
  mau('EC1-015', 'toan', sc('Có 6 chiếc lá, 2 chiếc rơi xuống. Còn lại bao nhiêu?', ['8', '4', '3'], '4', { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: '6 − 2 = 4.', s: 'Rơi xuống là bớt đi: 6 − 2 = 4. Còn lại 4 chiếc lá.' }), {
    levelBefore: 5, levelReason: 'Chỉ cần một phép trừ quen thuộc, chưa phải tình huống mở rộng; xếp L3.',
  }),
  moi('EC1-056', 'toan', fb('Trong vườn có 6 cây cam và 3 cây bưởi. Vườn có tất cả bao nhiêu cây?', ['9', 'chín'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: '6 + 3 = 9.', s: 'Gộp cây cam và cây bưởi: 6 + 3 = 9. Vườn có 9 cây.' }), {
    stage: 'Sau khi học phép cộng trong phạm vi 10', topic: 'Toán có lời văn', prerequisite: 'Đã học cộng trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-057', 'toan', fb('Bình có 8 cái kẹo, Bình cho em 3 cái. Bình còn lại mấy cái kẹo?', ['5', 'năm'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 3, e: '8 − 3 = 5.', s: 'Cho em là bớt đi: 8 − 3 = 5. Bình còn 5 cái kẹo.' }), {
    stage: 'Sau khi học phép trừ trong phạm vi 10', topic: 'Toán có lời văn', prerequisite: 'Đã học trừ trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-058', 'toan', mc('Chọn TẤT CẢ phép tính có kết quả bằng 6.', ['3 + 3', '4 + 2', '9 − 2', '10 − 4'], ['3 + 3', '4 + 2', '10 − 4'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 3, e: '3 + 3 = 6; 4 + 2 = 6; 10 − 4 = 6; còn 9 − 2 = 7.', s: 'Tính từng phép: 3 + 3 = 6, 4 + 2 = 6, 9 − 2 = 7, 10 − 4 = 6. Chọn 3 phép có kết quả 6.' }), {
    stage: 'Sau khi học cộng, trừ trong phạm vi 10', topic: 'Tính nhẩm', prerequisite: 'Đã học cộng, trừ trong phạm vi 10.', basis: CT,
  }),

  // ---- L4 Thử thách
  mau('EC1-010', 'toan', sc('An có 3 viên bi, Bình có 2 viên. Cả hai có bao nhiêu viên?', ['3 − 2 = 1', '3 + 2 = 5', '3 = 2'], '3 + 2 = 5', { o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 4, e: 'Gộp số bi: 3 + 2 = 5.', s: '"Cả hai" là gộp lại, ta chọn phép cộng: 3 + 2 = 5.' })),
  mau('EC1-011', 'toan', sc('Dãy 1, 2, 1, 2, __. Số tiếp theo là gì?', ['1', '3', '4'], '1', { o: 'T1.SO.01', f: 'TOAN.SOTHIEU', l: 4, e: 'Dãy lặp lại 1 rồi 2.', s: 'Các số lặp lại theo nhóm "1, 2". Sau 2 lại là 1.' })),
  moi('EC1-059', 'toan', sc('Có 7 bạn đang chơi, 2 bạn về nhà. Phép tính nào đúng?', ['7 + 2 = 9', '7 − 2 = 5', '5 − 2 = 3'], '7 − 2 = 5', { o: 'T1.PT.07', f: 'TOAN.LOIVAN', l: 4, e: 'Về nhà là bớt đi: 7 − 2 = 5.', s: 'Lúc đầu có 7 bạn, 2 bạn về nhà nên bớt đi 2: 7 − 2 = 5.' }), {
    stage: 'Sau khi học phép trừ trong phạm vi 10', topic: 'Chọn phép tính', prerequisite: 'Đã học trừ và bài toán có lời văn đơn giản.', basis: CT,
  }),
  moi('EC1-060', 'toan', fb('Điền số còn thiếu: 3 + ... = 8', ['5', 'năm'], { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 4, e: '3 + 5 = 8.', s: 'Đếm thêm từ 3 đến 8: 4, 5, 6, 7, 8 là 5 bước. Vậy 3 + 5 = 8.' }), {
    stage: 'Sau khi học phép cộng trong phạm vi 10', topic: 'Tìm số còn thiếu', prerequisite: 'Đã học cộng trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-061', 'toan', fb('Dãy số: 2, 4, 6, ... Số tiếp theo là số mấy?', ['8', 'tám'], { o: 'T1.SO.01', f: 'TOAN.SOTHIEU', l: 4, e: 'Mỗi lần thêm 2: 6 + 2 = 8.', s: '2 lên 4 thêm 2, 4 lên 6 thêm 2. Vậy sau 6 là 6 + 2 = 8.' }), {
    stage: 'Sau khi học các số 0–10', topic: 'Quy luật dãy số', prerequisite: 'Đã học đếm, cộng trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-062', 'toan', tf('4 + 3 = 9 − 2', 'Đúng', { o: 'T1.PT.02', f: 'TOAN.DUNGSAI', l: 4, e: '4 + 3 = 7 và 9 − 2 = 7, hai bên bằng nhau.', s: 'Tính bên trái: 4 + 3 = 7. Tính bên phải: 9 − 2 = 7. Hai bên đều bằng 7 nên đúng.' }), {
    stage: 'Sau khi học cộng, trừ trong phạm vi 10', topic: 'So sánh kết quả phép tính', prerequisite: 'Đã học cộng, trừ trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-063', 'toan', fb('Có 10 quả táo. Mẹ biếu bà 3 quả, cho bé 2 quả. Còn lại mấy quả?', ['5', 'năm'], { o: 'T1.PT.06', f: 'TOAN.LOIVAN', l: 4, e: '10 − 3 − 2 = 5.', s: 'Biếu bà 3 quả: 10 − 3 = 7. Cho bé 2 quả: 7 − 2 = 5. Còn lại 5 quả.' }), {
    stage: 'Sau khi học tính có hai dấu phép tính', topic: 'Toán có lời văn hai bước', prerequisite: 'Đã làm quen phép tính có hai dấu.', basis: CT,
  }),
  moi('EC1-064', 'toan', sc('Dùng 3 số 2, 5, 7 lập phép tính đúng.', ['2 + 5 = 7', '5 + 7 = 2', '2 + 7 = 5'], '2 + 5 = 7', { o: 'T1.PT.02', f: 'TOAN.TINH', l: 4, e: '2 + 5 = 7 là phép tính đúng.', s: 'Thử từng phép: 2 + 5 = 7 đúng; 5 + 7 không bằng 2; 2 + 7 không bằng 5.' }), {
    stage: 'Sau khi học phép cộng trong phạm vi 10', topic: 'Lập phép tính', prerequisite: 'Đã học cộng trong phạm vi 10.', basis: CT,
  }),

  // ---- L5 Mở rộng
  mau('EC1-013', 'toan', mc('Có 5 khối, chia thành 2 nhóm (mỗi nhóm ít nhất 1 khối). Chọn TẤT CẢ cách chia đúng.', ['1 và 4', '2 và 3', '2 và 2', '3 và 3'], ['1 và 4', '2 và 3'], { o: 'T1.PT.01', f: 'TOAN.TINH', l: 5, e: '1 + 4 = 5 và 2 + 3 = 5.', s: 'Hai nhóm gộp lại phải bằng 5: 1 + 4 = 5, 2 + 3 = 5. Còn 2 + 2 = 4 và 3 + 3 = 6 không đúng.' }), {
    appNote: 'Bản app chuyển câu trả lời mở thành "chọn tất cả cách chia đúng" để chấm tự động.',
  }),
  mau('EC1-014', 'toan', fb('Có 4 chiếc cốc và 3 bông hoa. Còn thiếu mấy bông để mỗi cốc có một bông?', ['1', 'một'], { o: 'T1.PT.03', f: 'TOAN.LOIVAN', l: 5, e: '4 − 3 = 1; còn thiếu 1 bông.', s: 'Cắm mỗi cốc một bông: 3 bông cắm được 3 cốc, còn 1 cốc chưa có hoa. 4 − 3 = 1.' }), {
    appNote: 'Bản app chấm theo dạng điền số (chấp nhận "1" hoặc "một").',
  }),
  moi('EC1-065', 'toan', mc('Chọn TẤT CẢ cặp số cộng lại bằng 7.', ['1 và 6', '2 và 5', '3 và 3', '4 và 3'], ['1 và 6', '2 và 5', '4 và 3'], { o: 'T1.PT.02', f: 'TOAN.TINH', l: 5, e: '1 + 6 = 7; 2 + 5 = 7; 4 + 3 = 7; còn 3 + 3 = 6.', s: 'Cộng từng cặp: 1 + 6 = 7, 2 + 5 = 7, 3 + 3 = 6, 4 + 3 = 7.' }), {
    stage: 'Sau khi học tách, gộp số', topic: 'Tách – gộp số', prerequisite: 'Đã học cộng trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-066', 'toan', fb('Nam nghĩ một số. Lấy số đó cộng 3 thì được 9. Nam nghĩ số mấy?', ['6', 'sáu'], { o: 'T1.PT.02', f: 'TOAN.SOTHIEU', l: 5, e: '6 + 3 = 9.', s: 'Ta cần số ... + 3 = 9. Lấy 9 − 3 = 6. Thử lại: 6 + 3 = 9.' }), {
    stage: 'Sau khi học cộng, trừ trong phạm vi 10', topic: 'Lập luận số', prerequisite: 'Đã học quan hệ cộng – trừ.', basis: CT,
  }),
  moi('EC1-067', 'toan', sc('Có 6 bạn xếp hàng. Mai đứng thứ 2 tính từ đầu hàng. Sau Mai có mấy bạn?', ['3', '4', '5'], '4', { o: 'T1.HH.01', f: 'TOAN.LOIVAN', l: 5, e: 'Trước Mai có 1 bạn, Mai là 1 bạn: 6 − 2 = 4.', s: 'Tính từ đầu hàng có bạn thứ nhất và Mai là 2 bạn. Còn lại 6 − 2 = 4 bạn đứng sau Mai.' }), {
    stage: 'Sau khi học vị trí trước – sau', topic: 'Vị trí, thứ tự', prerequisite: 'Đã học trước – sau và trừ trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-068', 'toan', fb('Điền số: 10 − ... = 4 + 2', ['4', 'bốn'], { o: 'T1.PT.06', f: 'TOAN.SOTHIEU', l: 5, e: '4 + 2 = 6 và 10 − 4 = 6.', s: 'Tính bên phải: 4 + 2 = 6. Cần 10 − ... = 6. Lấy 10 − 6 = 4.' }), {
    stage: 'Sau khi học cộng, trừ trong phạm vi 10', topic: 'Tìm số còn thiếu', prerequisite: 'Đã học cộng, trừ trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-069', 'toan', ord('Xếp các phép tính theo kết quả từ bé đến lớn.', ['5 − 4', '1 + 2', '3 + 2', '9 − 1'], { o: 'T1.SO.02', f: 'TOAN.SAPXEP', l: 5, e: 'Kết quả lần lượt 1, 3, 5, 8.', s: 'Tính trước: 5 − 4 = 1; 1 + 2 = 3; 3 + 2 = 5; 9 − 1 = 8. Xếp 1, 3, 5, 8.' }), {
    stage: 'Sau khi học cộng, trừ và so sánh số', topic: 'Tính rồi so sánh', prerequisite: 'Đã học cộng, trừ, so sánh trong phạm vi 10.', basis: CT,
  }),
  moi('EC1-070', 'toan', tf('Một con gà có 2 chân. 3 con gà có tất cả 6 chân.', 'Đúng', { o: 'T1.PT.03', f: 'TOAN.DUNGSAI', l: 5, e: '2 + 2 + 2 = 6.', s: 'Mỗi con 2 chân, 3 con: 2 + 2 + 2 = 6 chân. Câu đúng.' }), {
    stage: 'Sau khi học tính có hai dấu phép tính', topic: 'Giải quyết vấn đề', prerequisite: 'Đã làm quen phép tính có hai dấu.', basis: CT,
  }),
];

// ===========================================================================
// TIẾNG VIỆT
// ===========================================================================
const TV: BankItem[] = [
  // ---- L1
  mau('EC1-016', 'tieng-viet', sc('Chọn chữ a.', ['a', 'o', 'e'], 'a', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: 'Chữ cần tìm là a.' })),
  mau('EC1-017', 'tieng-viet', sc('Từ nào bắt đầu bằng chữ b?', ['bò', 'cá', 'gà'], 'bò', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: '"Bò" bắt đầu bằng chữ b.' })),
  mau('EC1-018', 'tieng-viet', sc('Chọn tiếng có dấu sắc.', ['bé', 'ba', 'bà'], 'bé', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: '"Bé" mang dấu sắc.' })),
  moi('EC1-071', 'tieng-viet', sc('Chọn chữ m.', ['m', 'n', 'h'], 'm', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: 'Chữ cần tìm là m.' }), {
    stage: 'Sau khi học chữ m', topic: 'Nhận diện chữ', prerequisite: 'Đã học chữ m, n, h.', basis: CV,
  }),
  moi('EC1-072', 'tieng-viet', sc('Tiếng "cá" bắt đầu bằng chữ nào?', ['c', 'a', 'k'], 'c', { o: 'V1.AM.01', f: 'TV.AMCHU', l: 1, e: '"Cá" gồm c và a, dấu sắc.' }), {
    stage: 'Sau khi học chữ c', topic: 'Chữ đầu tiếng', prerequisite: 'Đã học c, a và dấu sắc.', basis: CV,
  }),
  moi('EC1-073', 'tieng-viet', sc('Chọn tiếng có dấu huyền.', ['bà', 'bá', 'bạ'], 'bà', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: '"Bà" mang dấu huyền.' }), {
    stage: 'Sau khi học dấu huyền', topic: 'Thanh điệu', prerequisite: 'Đã học dấu huyền, sắc, nặng.', basis: CV,
  }),
  moi('EC1-074', 'tieng-viet', tf('Tiếng "mẹ" có dấu nặng.', 'Đúng', { o: 'V1.AM.02', f: 'TV.DAUTHANH', l: 1, e: 'Dấu nặng đặt dưới chữ e trong "mẹ".' }), {
    stage: 'Sau khi học dấu nặng', topic: 'Thanh điệu', prerequisite: 'Đã học m, e và dấu nặng.', basis: CV,
  }),
  moi('EC1-075', 'tieng-viet', sc('Tiếng "mèo" có vần gì?', ['eo', 'ao', 'au'], 'eo', { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 1, e: '"Mèo" = m + eo + dấu huyền.' }), {
    stage: 'Sau khi học vần eo', topic: 'Nhận diện vần', prerequisite: 'Đã học vần ao, eo, au.', basis: CV,
  }),

  // ---- L2
  mau('EC1-019', 'tieng-viet', sc('Chọn tiếng ghép được từ b và a.', ['ba', 'ca', 'ma'], 'ba', { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'b ghép với a tạo thành "ba".' })),
  mau('EC1-020', 'tieng-viet', sc('Từ nào chỉ một con vật?', ['mèo', 'bàn', 'bút'], 'mèo', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Mèo là tên một con vật.' })),
  mau('EC1-021', 'tieng-viet', sc('Câu "Bé đá bóng." nói về việc gì?', ['Bé đá bóng', 'Bé ngủ', 'Bé ăn cơm'], 'Bé đá bóng', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 2, e: 'Câu nêu việc bé đá bóng.' })),
  mau('EC1-024', 'tieng-viet', sc('Chọn từ chỉ màu sắc.', ['đỏ', 'chạy', 'ngủ'], 'đỏ', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: '"Đỏ" chỉ màu sắc.' }), {
    levelBefore: 3, levelReason: 'Chỉ nhận biết nghĩa một từ quen thuộc, xếp L2.',
  }),
  moi('EC1-076', 'tieng-viet', fb('Điền c hoặc k: cái ...ẹo', ['k'], { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 2, e: 'Viết k trước e, ê, i: cái kẹo.' }), {
    stage: 'Sau khi học quy tắc c/k', topic: 'Chính tả c/k', prerequisite: 'Đã học c, k và quy tắc viết k trước e, ê, i.', basis: CV,
  }),
  moi('EC1-077', 'tieng-viet', mt('Nối tranh với tiếng.', [['🐟', 'cá'], ['🐔', 'gà'], ['🐄', 'bò']], { o: 'V1.DOC.05', f: 'TV.NOITU', l: 2, e: '🐟 cá, 🐔 gà, 🐄 bò.' }), {
    stage: 'Sau khi học các chữ c, g, b', topic: 'Đọc tiếng – nối tranh', prerequisite: 'Đã đọc được cá, gà, bò.', basis: CV,
  }),
  moi('EC1-078', 'tieng-viet', sc('Từ nào chỉ đồ dùng học tập?', ['bút chì', 'con cò', 'quả na'], 'bút chì', { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 2, e: 'Bút chì là đồ dùng học tập.' }), {
    stage: 'Sau khi học vần ut, i', topic: 'Từ ngữ', prerequisite: 'Đã đọc được bút chì, con cò, quả na.', basis: CV,
  }),
  moi('EC1-079', 'tieng-viet', fb('g ghép với a, thêm dấu huyền, được tiếng gì?', ['gà'], { o: 'V1.DOC.01', f: 'TV.GHEPVAN', l: 2, e: 'g + a + dấu huyền = gà.' }), {
    stage: 'Sau khi học chữ g', topic: 'Ghép tiếng', prerequisite: 'Đã học g, a, dấu huyền.', basis: CV,
  }),

  // ---- L3
  mau('EC1-022', 'tieng-viet', ord('Sắp xếp thành câu: "đọc / Lan / sách".', ['Lan', 'đọc', 'sách'], { o: 'V1.VIET.03', f: 'TV.XEPCAU', l: 3, e: 'Sắp xếp thành câu có nghĩa: Lan đọc sách.', s: 'Câu cho biết ai (Lan) làm gì (đọc sách). Chữ đầu câu viết hoa: Lan đọc sách.' })),
  mau('EC1-023', 'tieng-viet', sc('Đọc: "Nam tưới cây." Ai tưới cây?', ['Nam', 'Cây', 'Không rõ'], 'Nam', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Câu cho biết Nam là người tưới cây.', s: 'Hỏi "Ai?" là hỏi người làm việc. Trong câu, người tưới cây là Nam.' })),
  mau('EC1-027', 'tieng-viet', sc('Hoàn thành câu: "Bé ___ nước."', ['uống', 'xanh', 'bàn'], 'uống', { o: 'V1.VIET.06', f: 'TV.DOCHIEU', l: 3, e: '"Uống" phù hợp với "nước".', s: 'Nước là thứ để uống: "Bé uống nước." Hai từ còn lại không tạo thành câu có nghĩa.' }), {
    levelBefore: 4, levelReason: 'Chọn một từ hợp nghĩa trong câu ngắn, xếp L3.',
  }),
  moi('EC1-080', 'tieng-viet', ord('Xếp thành câu: "bé / Mẹ / ru".', ['Mẹ', 'ru', 'bé'], { o: 'V1.VIET.03', f: 'TV.XEPCAU', l: 3, e: 'Mẹ ru bé.', s: 'Ai? – Mẹ. Làm gì? – ru bé. Chữ đầu câu viết hoa: Mẹ ru bé.' }), {
    stage: 'Sau khi học các tiếng trong câu', topic: 'Sắp xếp tiếng', prerequisite: 'Đã đọc được mẹ, ru, bé.', basis: CV,
  }),
  moi('EC1-081', 'tieng-viet', sc('Đọc: "Bố đi làm. Mẹ đi chợ." Ai đi chợ?', ['Mẹ', 'Bố', 'Bé'], 'Mẹ', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 3, e: 'Câu thứ hai: Mẹ đi chợ.', s: 'Đoạn có hai câu: Bố đi làm; Mẹ đi chợ. Người đi chợ là Mẹ.' }), {
    stage: 'Sau khi học câu ngắn', topic: 'Đọc hiểu', prerequisite: 'Đã đọc được câu ngắn có các tiếng này.', basis: CV,
  }),
  moi('EC1-082', 'tieng-viet', mc('Chọn TẤT CẢ từ chỉ con vật.', ['con gà', 'cái ghế', 'con thỏ', 'quả cam'], ['con gà', 'con thỏ'], { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 3, e: 'Gà và thỏ là con vật.', s: 'Con gà, con thỏ là con vật. Cái ghế là đồ vật, quả cam là quả.' }), {
    stage: 'Sau khi học vần ong, am', topic: 'Từ ngữ', prerequisite: 'Đã đọc được các từ trong lựa chọn.', basis: CV,
  }),
  moi('EC1-083', 'tieng-viet', fb('Điền g hoặc gh: cái ...ế', ['gh'], { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 3, e: 'Viết gh trước e, ê, i: cái ghế.', s: 'Sau chữ cần điền là ê. Trước e, ê, i ta viết gh: cái ghế.' }), {
    stage: 'Sau khi học quy tắc g/gh', topic: 'Chính tả g/gh', prerequisite: 'Đã học g, gh và quy tắc chính tả.', basis: CV,
  }),
  moi('EC1-084', 'tieng-viet', sc('Chọn từ viết đúng chính tả.', ['nghỉ hè', 'ngỉ hè'], 'nghỉ hè', { o: 'V1.AM.04', f: 'TV.CHINHTA', l: 3, e: 'Trước i viết ngh: nghỉ hè.', s: 'Trước e, ê, i ta viết ngh. Vì vậy "nghỉ" viết ngh.' }), {
    stage: 'Sau khi học quy tắc ng/ngh', topic: 'Chính tả ng/ngh', prerequisite: 'Đã học ng, ngh và quy tắc chính tả.', basis: CV,
  }),

  // ---- L4
  mau('EC1-025', 'tieng-viet', sc('Chọn dấu cuối câu kể: "Em yêu trường em__"', ['.', '?', ','], '.', { o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 4, e: 'Câu kể thông thường kết thúc bằng dấu chấm.', s: 'Câu này kể lại điều em nghĩ, không phải câu hỏi, nên cuối câu dùng dấu chấm.' }), {
    review: 'Bản gốc có lựa chọn "? " thừa dấu cách — đã sửa thành "?".',
  }),
  mau('EC1-026', 'tieng-viet', sc('Đọc: "Trời mưa. Hà mở ô." Vì sao Hà mở ô?', ['Vì trời mưa', 'Vì trời nắng', 'Vì Hà đi ngủ'], 'Vì trời mưa', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 4, e: 'Hai câu gợi lý do Hà mở ô.', s: 'Câu đầu cho biết trời mưa, câu sau Hà mở ô. Hà mở ô để che mưa.' })),
  mau('EC1-028', 'tieng-viet', sc('Đọc: "Minh có một cây bút. Minh cho bạn mượn bút." Minh đã làm gì?', ['Cho bạn mượn bút', 'Làm mất bút', 'Mua bút mới'], 'Cho bạn mượn bút', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 4, e: 'Thông tin được nêu trực tiếp ở câu thứ hai.', s: 'Câu thứ hai nói rõ: "Minh cho bạn mượn bút."' }), {
    levelBefore: 5, levelReason: 'Thông tin nằm sẵn trong câu (tường minh), xếp L4.',
    appNote: 'Bản app chuyển câu trả lời ngắn thành chọn đáp án.',
  }),
  moi('EC1-085', 'tieng-viet', sc('Đọc: "Gà mẹ dẫn đàn con đi kiếm mồi." Gà mẹ dẫn ai đi?', ['Đàn gà con', 'Chó con', 'Bé Na'], 'Đàn gà con', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 4, e: 'Gà mẹ dẫn đàn con – đàn gà con.', s: 'Câu viết "dẫn đàn con": đàn con của gà mẹ là đàn gà con.' }), {
    stage: 'Sau khi học vần an, iêm, ôi', topic: 'Đọc hiểu', prerequisite: 'Đã đọc được câu có vần an, iêm, ôi.', basis: CV,
  }),
  moi('EC1-086', 'tieng-viet', sc('Chọn dấu câu cho chỗ trống: "Bạn tên là gì__"', ['?', '.'], '?', { o: 'V1.VIET.05', f: 'TV.DAUCAU', l: 4, e: 'Câu hỏi kết thúc bằng dấu chấm hỏi.', s: 'Câu có "gì" để hỏi tên bạn, nên cuối câu dùng dấu chấm hỏi.' }), {
    stage: 'Sau khi học dấu chấm hỏi', topic: 'Dấu câu', prerequisite: 'Đã học dấu chấm, dấu chấm hỏi.', basis: CV,
  }),
  moi('EC1-087', 'tieng-viet', ord('Xếp thành câu: "chăm / học / Hà / bài".', ['Hà', 'chăm', 'học', 'bài'], { o: 'V1.VIET.03', f: 'TV.XEPCAU', l: 4, e: 'Hà chăm học bài.', s: 'Ai? – Hà. Thế nào? – chăm học bài. Câu: Hà chăm học bài.' }), {
    stage: 'Sau khi học vần ăm, ai', topic: 'Sắp xếp tiếng', prerequisite: 'Đã đọc được chăm, học, bài.', basis: CV,
  }),
  moi('EC1-088', 'tieng-viet', mc('Chọn TẤT CẢ từ chỉ hoạt động.', ['chạy', 'nhảy', 'cái bàn', 'xanh'], ['chạy', 'nhảy'], { o: 'V1.VIET.04', f: 'TV.TUNGU', l: 4, e: 'Chạy, nhảy là hoạt động.', s: 'Chạy, nhảy là việc mình làm (hoạt động). Cái bàn là đồ vật; xanh là màu sắc.' }), {
    stage: 'Sau khi học vần ay, an, anh', topic: 'Từ chỉ hoạt động', prerequisite: 'Đã đọc được các từ trong lựa chọn.', basis: CV,
  }),
  moi('EC1-089', 'tieng-viet', tf('Đọc: "Sáng nay, bé dậy sớm tập thể dục." Bé dậy muộn, đúng hay sai?', 'Sai', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 4, e: 'Bé dậy sớm, không phải dậy muộn.', s: 'Câu viết "bé dậy sớm". "Muộn" ngược nghĩa với "sớm" nên nhận xét này sai.' }), {
    stage: 'Sau khi học vần ây, ơm, ục', topic: 'Đọc hiểu', prerequisite: 'Đã đọc được câu ngắn có dấu phẩy.', basis: CV,
  }),

  // ---- L5
  mau('EC1-029', 'tieng-viet', sc('Đọc: "Trời lạnh. Bình mặc áo khoác." Vì sao Bình mặc áo khoác?', ['Vì trời lạnh', 'Vì trời nắng', 'Vì Bình đi ngủ'], 'Vì trời lạnh', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 5, e: 'Suy ra lý do từ hai câu.', s: 'Câu đầu cho biết trời lạnh. Mặc áo khoác để giữ ấm, nên Bình mặc áo vì trời lạnh.' }), {
    appNote: 'Bản app chuyển câu trả lời ngắn thành chọn đáp án.',
  }),
  mau('EC1-030', 'tieng-viet', ord('Xếp thành câu có từ "mẹ": "yêu / em / Mẹ".', ['Mẹ', 'yêu', 'em'], { o: 'V1.VIET.03', f: 'TV.XEPCAU', l: 5, e: 'Ví dụ: Mẹ yêu em.', s: 'Ai? – Mẹ. Làm gì? – yêu em. Câu: Mẹ yêu em. (Khi viết câu tự do, giáo viên chấm theo rubric.)' }), {
    appNote: 'Bản gốc là viết câu tự do (giáo viên chấm theo rubric); bản app là xếp từ thành câu.',
  }),
  moi('EC1-090', 'tieng-viet', sc('Đọc: "Mèo nằm sưởi nắng bên thềm. Thấy chuột, mèo vùng dậy." Vì sao mèo vùng dậy?', ['Vì thấy chuột', 'Vì trời mưa', 'Vì bé gọi'], 'Vì thấy chuột', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 5, e: 'Câu thứ hai: thấy chuột, mèo vùng dậy.', s: 'Mèo đang nằm sưởi nắng. "Thấy chuột, mèo vùng dậy" cho biết lý do là mèo thấy chuột.' }), {
    stage: 'Sau khi học vần ươi, ung, uôt', topic: 'Suy luận đơn giản', prerequisite: 'Đã đọc được đoạn hai câu.', basis: CV,
  }),
  moi('EC1-091', 'tieng-viet', ord('Xếp các câu theo đúng thứ tự việc làm buổi sáng.', ['Bé thức dậy.', 'Bé đánh răng.', 'Bé ăn sáng.', 'Bé đi học.'], { o: 'V1.DOC.06', f: 'TV.XEPCAU', l: 5, e: 'Thức dậy → đánh răng → ăn sáng → đi học.', s: 'Việc đầu tiên là thức dậy, rồi đánh răng, ăn sáng, sau cùng mới đi học.' }), {
    stage: 'Sau khi học vần ưc, anh, ăng', topic: 'Trình tự sự việc', prerequisite: 'Đã đọc được câu ngắn.', basis: CV,
  }),
  moi('EC1-092', 'tieng-viet', mc('Chọn TẤT CẢ tiếng có vần "an".', ['bàn', 'cân', 'lan', 'sàn'], ['bàn', 'lan', 'sàn'], { o: 'V1.AM.03', f: 'TV.GHEPVAN', l: 5, e: 'bàn, lan, sàn có vần an; cân có vần ân.', s: 'Tách vần: b–an, c–ân, l–an, s–an. "Cân" là vần ân nên không chọn.' }), {
    stage: 'Sau khi học vần an, ăn, ân', topic: 'Phân biệt vần', prerequisite: 'Đã học vần an, ăn, ân.', basis: CV,
  }),
  moi('EC1-093', 'tieng-viet', sc('Đọc: "Hà tưới cây mỗi ngày. Cây lớn nhanh và ra hoa đỏ." Vì sao cây lớn nhanh?', ['Vì Hà tưới cây mỗi ngày', 'Vì cây ở trong nhà', 'Vì hoa màu đỏ'], 'Vì Hà tưới cây mỗi ngày', { o: 'V1.DOC.04', f: 'TV.DOCHIEU', l: 5, e: 'Cây được tưới mỗi ngày nên lớn nhanh.', s: 'Câu đầu cho biết Hà tưới cây mỗi ngày. Cây được chăm tưới nên lớn nhanh.' }), {
    stage: 'Sau khi học vần ươi, ây, anh', topic: 'Suy luận đơn giản', prerequisite: 'Đã đọc được đoạn hai câu.', basis: CV,
  }),
  moi('EC1-094', 'tieng-viet', fb('Điền tiếng còn thiếu: "Ăn quả nhớ kẻ trồng ..."', ['cây'], { o: 'V1.VIET.06', f: 'TV.GHEPVAN', l: 5, e: 'Ăn quả nhớ kẻ trồng cây.', s: 'Quả mọc trên cây, người trồng cây cho ta quả ăn: "Ăn quả nhớ kẻ trồng cây."' }), {
    stage: 'Cuối học kì 1 (mở rộng)', topic: 'Câu tục ngữ quen thuộc', prerequisite: 'Đã đọc được các tiếng trong câu.', basis: CV,
  }),
  moi('EC1-095', 'tieng-viet', mt('Nối từ với từ có nghĩa ngược lại.', [['to', 'nhỏ'], ['cao', 'thấp'], ['dài', 'ngắn']], { o: 'V1.VIET.04', f: 'TV.NOITU', l: 5, e: 'to – nhỏ, cao – thấp, dài – ngắn.', s: 'Cái to ngược với cái nhỏ; cao ngược với thấp; dài ngược với ngắn.' }), {
    stage: 'Cuối học kì 1 (mở rộng)', topic: 'Từ ngữ chỉ đặc điểm', prerequisite: 'Đã đọc được các từ trong bài.', basis: CV,
  }),
];

// ===========================================================================
// TIẾNG ANH
// ===========================================================================
const TA: BankItem[] = [
  // ---- L1
  mau('EC1-031', 'tieng-anh', sc('Nghe "Hello". Chọn lời chào phù hợp.', ['Hello', 'Goodbye', 'Thank you'], 'Hello', { o: 'A1.HELLO.01', f: 'TA.TUVUNG', l: 1, e: 'Hello là lời chào.' })),
  mau('EC1-032', 'tieng-anh', sc('Nghe "red". Chọn màu phù hợp.', ['Đỏ', 'Xanh dương', 'Vàng'], 'Đỏ', { o: 'A1.COLOUR.01', f: 'TA.TUVUNG', l: 1, e: 'Red nghĩa là màu đỏ.' })),
  mau('EC1-033', 'tieng-anh', sc('Which number is "two"?', ['1', '2', '3'], '2', { o: 'A1.NUM.01', f: 'TA.SODEM', l: 1, e: 'Two là số 2.' }), {
    review: 'Số đếm không có trong Global Success 1 Unit 1–8; dùng khi trường có dạy số đếm.',
  }),
  moi('EC1-096', 'tieng-anh', sc('Từ "cat" là con gì?', ['Con mèo', 'Con chó', 'Con vịt'], 'Con mèo', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 1, e: 'Cat là con mèo.' }), {
    stage: 'Sau Unit 2', topic: 'Animals', prerequisite: 'Đã học cat (Unit 2).', basis: CA,
  }),
  moi('EC1-097', 'tieng-anh', sc('Chọn từ có nghĩa là "quả táo".', ['apple', 'ball', 'cup'], 'apple', { o: 'A1.EXTRA.02', f: 'TA.TUVUNG', l: 1, e: 'Apple là quả táo.' }), {
    stage: 'Sau Unit 3', topic: 'Food', prerequisite: 'Đã học apple (Unit 3).', basis: CA,
  }),
  moi('EC1-098', 'tieng-anh', sc('Nghe "ball". Chọn hình đúng.', ['⚽', '🚗', '🎂'], '⚽', { o: 'A1.EXTRA.01', f: 'TA.TUVUNG', l: 1, e: 'Ball là quả bóng ⚽.' }), {
    stage: 'Sau Unit 1', topic: 'Toys', prerequisite: 'Đã học ball (Unit 1).', basis: CA,
  }),
  moi('EC1-099', 'tieng-anh', fb('Điền chữ cái còn thiếu: _ook (quyển sách)', ['b'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: 'book – quyển sách, bắt đầu bằng b.' }), {
    stage: 'Sau Unit 1', topic: 'Letter b', prerequisite: 'Đã học chữ b và từ book (Unit 1).', basis: CA,
  }),
  moi('EC1-100', 'tieng-anh', sc('Từ "dog" bắt đầu bằng chữ cái nào?', ['d', 'b', 'g'], 'd', { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 1, e: 'dog bắt đầu bằng d.' }), {
    stage: 'Sau Unit 4', topic: 'Letter d', prerequisite: 'Đã học chữ d và từ dog (Unit 4).', basis: CA,
  }),

  // ---- L2
  mau('EC1-034', 'tieng-anh', sc('Chọn câu trả lời phù hợp cho "Hello!"', ['Hello!', 'Red!', 'Three!'], 'Hello!', { o: 'A1.HELLO.01', f: 'TA.MAUCAU', l: 2, e: 'Có thể đáp lại lời chào bằng Hello.' })),
  mau('EC1-035', 'tieng-anh', sc('Nghe "book". Chọn đồ vật phù hợp.', ['Quyển sách', 'Quả táo', 'Quả bóng'], 'Quyển sách', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 2, e: 'Book nghĩa là quyển sách.' })),
  mau('EC1-036', 'tieng-anh', sc('Which word means "mèo"?', ['cat', 'dog', 'fish'], 'cat', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 2, e: 'Cat nghĩa là mèo.' })),
  mau('EC1-044', 'tieng-anh', sc('Gặp bạn vào buổi sáng, chọn lời chào phù hợp.', ['Good morning.', 'Goodbye.', 'Thank you.'], 'Good morning.', { o: 'A1.HELLO.01', f: 'TA.MAUCAU', l: 2, e: 'Good morning là lời chào buổi sáng.' }), {
    levelBefore: 5, levelReason: 'Chọn lời chào quen thuộc, xếp L2.',
    review: '"Good morning" không có trong Global Success 1 Unit 1–8; dùng khi trường có dạy.',
  }),
  moi('EC1-101', 'tieng-anh', mt('Nối từ với nghĩa.', [['car', 'ô tô'], ['cake', 'bánh ngọt'], ['cup', 'cái cốc']], { o: 'A1.EXTRA.01', f: 'TA.NOINGHIA', l: 2, e: 'car – ô tô, cake – bánh ngọt, cup – cái cốc.' }), {
    stage: 'Sau Unit 2', topic: 'Letter c words', prerequisite: 'Đã học car, cake, cup (Unit 2).', basis: CA,
  }),
  moi('EC1-102', 'tieng-anh', sc('Từ nào có nghĩa là "cái bút mực"?', ['pen', 'pencil', 'bell'], 'pen', { o: 'A1.SCHOOL.01', f: 'TA.TUVUNG', l: 2, e: 'pen – bút mực; pencil – bút chì; bell – cái chuông.' }), {
    stage: 'Sau Unit 6', topic: 'School things', prerequisite: 'Đã học pen, pencil, bell (Unit 6).', basis: CA,
  }),
  moi('EC1-103', 'tieng-anh', tf('"Fish" nghĩa là con cá.', 'Đúng', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 2, e: 'Fish là con cá.' }), {
    stage: 'Sau Unit 5', topic: 'Animals', prerequisite: 'Đã học fish (Unit 5).', basis: CA,
  }),
  moi('EC1-104', 'tieng-anh', fb('Điền chữ cái còn thiếu: _at (cái mũ)', ['h'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 2, e: 'hat – cái mũ.' }), {
    stage: 'Sau Unit 3', topic: 'Spelling', prerequisite: 'Đã học hat (Unit 3) và chữ h (Unit 8).', basis: CA,
  }),

  // ---- L3
  mau('EC1-037', 'tieng-anh', sc('A ripe banana is usually ___.', ['yellow', 'blue', 'purple'], 'yellow', { o: 'A1.COLOUR.01', f: 'TA.MAUCAU', l: 3, e: 'Quả chuối chín thường có màu vàng.', s: 'Ripe banana = quả chuối chín. Chuối chín có màu vàng: yellow.' }), {
    review: 'Câu dùng nhiều từ ngoài vốn từ lớp 1 (ripe, banana, usually). Đề xuất giáo viên đọc cho học sinh nghe hoặc thay bằng câu đơn giản hơn.',
  }),
  mau('EC1-038', 'tieng-anh', sc('Giáo viên nói "Listen". Em nên làm gì?', ['Lắng nghe', 'Chạy ra ngoài', 'Ngủ'], 'Lắng nghe', { o: 'A1.HELLO.02', f: 'TA.TUVUNG', l: 3, e: 'Listen là yêu cầu lắng nghe.', s: 'Listen nghĩa là "Hãy lắng nghe". Em ngồi yên và nghe cô nói.' })),
  mau('EC1-039', 'tieng-anh', sc('Chọn câu dùng để nói tên mình.', ['My name is Lan.', 'It is blue.', 'Good night.'], 'My name is Lan.', { o: 'A1.HELLO.03', f: 'TA.MAUCAU', l: 3, e: 'My name is Lan dùng để giới thiệu tên.', s: '"My name is …" nghĩa là "Tên mình là …".' })),
  moi('EC1-105', 'tieng-anh', mc('Chọn TẤT CẢ từ chỉ con vật.', ['duck', 'goat', 'desk', 'horse'], ['duck', 'goat', 'horse'], { o: 'A1.ANIMAL.01', f: 'TA.NHOMTU', l: 3, e: 'duck, goat, horse là con vật; desk là cái bàn.', s: 'duck – con vịt, goat – con dê, horse – con ngựa. Desk là cái bàn học.' }), {
    stage: 'Sau Unit 8', topic: 'Animals', prerequisite: 'Đã học duck, desk (Unit 4), goat (Unit 7), horse (Unit 8).', basis: CA,
  }),
  moi('EC1-106', 'tieng-anh', sc('Hoàn thành câu: "This is my ___." (cái túi)', ['bag', 'bell', 'bike'], 'bag', { o: 'A1.SCHOOL.01', f: 'TA.MAUCAU', l: 3, e: 'bag – cái túi.', s: '"This is my bag." nghĩa là "Đây là cái túi của mình."' }), {
    stage: 'Sau Unit 6', topic: 'This is my …', prerequisite: 'Đã học bag (Unit 3), bell (Unit 6), bike (Unit 1).', basis: CA,
  }),
  moi('EC1-107', 'tieng-anh', fb('Điền từ: "I have a ___." (quả bóng)', ['ball'], { o: 'A1.EXTRA.01', f: 'TA.MAUCAU', l: 3, e: 'ball – quả bóng.', s: '"I have a ball." nghĩa là "Mình có một quả bóng."' }), {
    stage: 'Sau Unit 3', topic: 'I have …', prerequisite: 'Đã học ball và mẫu câu I have a … .', basis: CA,
  }),
  moi('EC1-108', 'tieng-anh', sc('Nghe "I can see a goat." Bạn nhìn thấy con gì?', ['Con dê', 'Con ngựa', 'Con vịt'], 'Con dê', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 3, e: 'goat – con dê.', s: '"I can see a goat." nghĩa là "Mình nhìn thấy một con dê."' }), {
    stage: 'Sau Unit 7', topic: 'I can see …', prerequisite: 'Đã học goat và mẫu câu I can see … .', basis: CA,
  }),
  moi('EC1-109', 'tieng-anh', mt('Nối từ với bộ phận cơ thể.', [['hand', 'bàn tay'], ['head', 'cái đầu'], ['hair', 'mái tóc']], { o: 'A1.EXTRA.03', f: 'TA.NOINGHIA', l: 3, e: 'hand – bàn tay, head – cái đầu, hair – mái tóc.', s: 'Ba từ đều bắt đầu bằng h. Hand là bàn tay, head là cái đầu, hair là mái tóc.' }), {
    stage: 'Sau Unit 8', topic: 'Body parts', prerequisite: 'Đã học hand, head, hair (Unit 8).', basis: CA,
  }),

  // ---- L4
  mau('EC1-040', 'tieng-anh', sc('Nghe "Point to the red book." Chọn hình đúng.', ['Sách đỏ', 'Sách xanh', 'Táo đỏ'], 'Sách đỏ', { o: 'A1.COLOUR.01', f: 'TA.TUVUNG', l: 4, e: 'Chọn quyển sách màu đỏ.', s: 'red book = quyển sách màu đỏ. Phải đúng cả màu (red) và đồ vật (book).' })),
  mau('EC1-041', 'tieng-anh', sc('Nếu bạn nói "Thank you", câu đáp nào phù hợp?', ["You're welcome.", 'Good morning.', "It's a pen."], "You're welcome.", { o: 'A1.HELLO.01', f: 'TA.MAUCAU', l: 4, e: "You're welcome là một cách đáp lời cảm ơn.", s: "Thank you là lời cảm ơn; đáp lại bằng You're welcome (Không có gì)." }), {
    review: '"Thank you / You\'re welcome" không có trong Global Success 1 Unit 1–8; dùng khi trường có dạy.',
  }),
  mau('EC1-042', 'tieng-anh', sc('Nghe "I see a dog." Chọn hình đúng.', ['Con chó', 'Con mèo', 'Con cá'], 'Con chó', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 4, e: 'Câu nói đến dog.', s: '"I see a dog." nghĩa là "Mình thấy một con chó." Dog là con chó.' })),
  moi('EC1-110', 'tieng-anh', sc('Nghe "a red pen". Chọn hình đúng.', ['🖊️ bút mực màu đỏ', '🖊️ bút mực màu xanh', '✏️ bút chì màu đỏ'], '🖊️ bút mực màu đỏ', { o: 'A1.COLOUR.01', f: 'TA.TUVUNG', l: 4, e: 'red pen – bút mực màu đỏ.', s: 'Phải đúng cả hai: màu red (đỏ) và đồ vật pen (bút mực).' }), {
    stage: 'Sau Unit 6', topic: 'Colours + objects', prerequisite: 'Đã học red, pen, pencil (Unit 6).', basis: CA,
  }),
  moi('EC1-111', 'tieng-anh', ord('Xếp các từ thành câu: "a / I / duck / see / can"', ['I', 'can', 'see', 'a', 'duck'], { o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 4, e: 'I can see a duck.', s: 'Mẫu câu "I can see a …" (Mình nhìn thấy một …). Câu đúng: I can see a duck.' }), {
    stage: 'Sau Unit 4', topic: 'I can see …', prerequisite: 'Đã học duck và mẫu câu I can see … .', basis: CA,
  }),
  moi('EC1-112', 'tieng-anh', tf('"I can see a horse." nghĩa là "Mình nhìn thấy một con ngựa."', 'Đúng', { o: 'A1.ANIMAL.01', f: 'TA.TUVUNG', l: 4, e: 'horse – con ngựa; I can see – mình nhìn thấy.', s: 'I can see = mình nhìn thấy; a horse = một con ngựa. Câu dịch đúng.' }), {
    stage: 'Sau Unit 8', topic: 'I can see …', prerequisite: 'Đã học horse (Unit 8).', basis: CA,
  }),
  moi('EC1-113', 'tieng-anh', mc('Chọn TẤT CẢ từ bắt đầu bằng chữ "g".', ['girl', 'gate', 'goat', 'duck'], ['girl', 'gate', 'goat'], { o: 'A1.ABC.02', f: 'TA.NHOMTU', l: 4, e: 'girl, gate, goat bắt đầu bằng g.', s: 'Nhìn chữ cái đầu: girl, gate, goat bắt đầu bằng g; duck bắt đầu bằng d.' }), {
    stage: 'Sau Unit 7', topic: 'Letter g', prerequisite: 'Đã học chữ g và các từ của Unit 7.', basis: CA,
  }),
  moi('EC1-114', 'tieng-anh', fb('Điền 2 chữ cái còn thiếu: d _ _ k (con vịt)', ['uc', 'u c'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 4, e: 'duck: d – u – c – k.', s: 'Con vịt là duck, đánh vần d – u – c – k. Hai chữ còn thiếu là u, c.' }), {
    stage: 'Sau Unit 4', topic: 'Spelling', prerequisite: 'Đã học duck (Unit 4).', basis: CA,
  }),

  // ---- L5
  mau('EC1-043', 'tieng-anh', sc('Hoàn thành câu "I like ___." bằng một từ chỉ con vật.', ['dogs', 'cakes', 'doors'], 'dogs', { o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 5, e: 'Ví dụ: I like dogs.', s: 'dogs là con chó; cakes là bánh, doors là cửa. Từ chỉ con vật là dogs.' }), {
    appNote: 'Bản gốc là nói/ghi âm (giáo viên chấm rubric); bản app là chọn từ chỉ con vật.',
    review: 'Mẫu câu "I like …" chỉ dùng khi trường đã dạy.',
  }),
  mau('EC1-045', 'tieng-anh', mt('Nối đồ vật với từ tiếng Anh.', [['📕', 'book'], ['🖊️', 'pen'], ['🎒', 'bag']], { o: 'A1.SCHOOL.01', f: 'TA.NOINGHIA', l: 5, e: 'Ví dụ: book / pen / bag.', s: '📕 là book (quyển sách), 🖊️ là pen (bút mực), 🎒 là bag (cái cặp, túi).' }), {
    appNote: 'Bản gốc là nói tên đồ vật trong tranh; bản app là nối tranh với từ.',
  }),
  moi('EC1-115', 'tieng-anh', sc('Chọn từ KHÁC nhóm.', ['cat', 'dog', 'duck', 'desk'], 'desk', { o: 'A1.ANIMAL.01', f: 'TA.NHOMTU', l: 5, e: 'desk là đồ vật; các từ còn lại là con vật.', s: 'cat – mèo, dog – chó, duck – vịt đều là con vật. desk – cái bàn là đồ vật.' }), {
    stage: 'Sau Unit 4', topic: 'Odd one out', prerequisite: 'Đã học cat (Unit 2), dog, duck, desk (Unit 4).', basis: CA,
  }),
  moi('EC1-116', 'tieng-anh', ord('Xếp các chữ cái thành từ "con cá": i / f / h / s', ['f', 'i', 's', 'h'], { o: 'A1.ABC.02', f: 'TA.CHUCAI', l: 5, e: 'fish: f – i – s – h.', s: 'Con cá là fish, đánh vần f – i – s – h.' }), {
    stage: 'Sau Unit 5', topic: 'Spelling', prerequisite: 'Đã học fish (Unit 5).', basis: CA,
  }),
  moi('EC1-117', 'tieng-anh', mt('Nối chữ cái với từ bắt đầu bằng chữ đó.', [['b', 'book'], ['c', 'cup'], ['h', 'horse']], { o: 'A1.ABC.02', f: 'TA.NOINGHIA', l: 5, e: 'b – book, c – cup, h – horse.', s: 'book bắt đầu bằng b, cup bắt đầu bằng c, horse bắt đầu bằng h.' }), {
    stage: 'Sau Unit 8', topic: 'Letters', prerequisite: 'Đã học chữ b, c, h và các từ.', basis: CA,
  }),
  moi('EC1-118', 'tieng-anh', sc('Bill nói: "This is my bike." Bill đang giới thiệu gì?', ['Xe đạp của Bill', 'Quả bóng của Bill', 'Con mèo của Bill'], 'Xe đạp của Bill', { o: 'A1.EXTRA.01', f: 'TA.MAUCAU', l: 5, e: 'bike – xe đạp; This is my … – Đây là … của mình.', s: '"This is my bike." nghĩa là "Đây là xe đạp của mình."' }), {
    stage: 'Sau Unit 1', topic: 'This is my …', prerequisite: 'Đã học bike và mẫu câu This is my … .', basis: CA,
  }),
  moi('EC1-119', 'tieng-anh', fb('Hoàn thành câu: "I can see a ___." (🐴)', ['horse'], { o: 'A1.ANIMAL.01', f: 'TA.MAUCAU', l: 5, e: '🐴 là horse.', s: 'Con ngựa là horse: "I can see a horse."' }), {
    stage: 'Sau Unit 8', topic: 'I can see …', prerequisite: 'Đã học horse (Unit 8).', basis: CA,
  }),
  moi('EC1-120', 'tieng-anh', mc('Chọn TẤT CẢ từ chỉ đồ ăn, đồ uống.', ['cake', 'chips', 'milk', 'door'], ['cake', 'chips', 'milk'], { o: 'A1.EXTRA.02', f: 'TA.NHOMTU', l: 5, e: 'cake, chips, milk ăn/uống được; door là cái cửa.', s: 'cake – bánh ngọt, chips – khoai tây chiên, milk – sữa. Door là cái cửa.' }), {
    stage: 'Sau Unit 5', topic: 'Food and drinks', prerequisite: 'Đã học cake (Unit 2), chips, milk (Unit 5), door (Unit 4).', basis: CA,
  }),
];

export const BANK: BankItem[] = [...TOAN, ...TV, ...TA];

// ---------------------------------------------------------------------------
// Đề ôn tập theo cấp độ: mỗi môn 4 đề × 10 câu, mỗi đề 2 câu/cấp độ, sắp từ L1 đến L5.
// ---------------------------------------------------------------------------
export const DE_PER_SUBJECT = 4;
const SUBJECT_META: Record<SubjectCode, { slug: string; name: string; topic: string; scope: ContentLesson['scope'] }> = {
  toan: { slug: 'toan1', name: 'Toán', topic: 'T1.PT', scope: { kind: 'math', maxNumber: 10, ops: ['+', '-'] } },
  'tieng-viet': { slug: 'tv1', name: 'Tiếng Việt', topic: 'V1.DOC', scope: { kind: 'viet', lessonNo: 999 } },
  'tieng-anh': { slug: 'ta1', name: 'Tiếng Anh', topic: 'A1.HELLO', scope: { kind: 'english', unit: 8, extra: EN_BANK_EXTRA } },
};

/** Đề (1..4) và vị trí của câu trong đề, theo thứ tự trong BANK. */
export function deOf(item: BankItem): { de: number; pos: number } {
  const same = BANK.filter((b) => b.subject === item.subject && b.q.level === item.q.level);
  const k = same.indexOf(item); // 0..7
  return { de: Math.floor(k / 2) + 1, pos: (item.q.level - 1) * 2 + (k % 2) + 1 };
}

export const reviewLessonId = (subject: SubjectCode, de: number) => `${SUBJECT_META[subject].slug}-ontap-de${de}`;

function buildReview(subject: SubjectCode): ContentLesson[] {
  const meta = SUBJECT_META[subject];
  const items = BANK.filter((b) => b.subject === subject);
  return Array.from({ length: DE_PER_SUBJECT }, (_, i) => {
    const de = i + 1;
    const qs = items
      .filter((b) => deOf(b).de === de)
      .sort((a, b) => deOf(a).pos - deOf(b).pos)
      .map((b) => b.q);
    return {
      id: reviewLessonId(subject, de),
      subject,
      grade: 1,
      semester: 1,
      book: 'Ngân hàng câu hỏi EduChain Kids',
      ref: `Đề ôn ${de}`,
      unit: { code: 'ON-TAP-CAP-DO', title: 'Ôn tập theo cấp độ (L1 → L5)' },
      topicCode: meta.topic,
      title: `Đề ôn ${de} · Từ dễ đến khó`,
      description: `${qs.length} câu ${meta.name}: 2 câu mỗi cấp độ, từ Làm quen (L1) đến Mở rộng (L5).`,
      scope: meta.scope,
      kind: 'review',
      questions: qs,
    } satisfies ContentLesson;
  });
}

export const BANK_LESSONS: ContentLesson[] = [...buildReview('toan'), ...buildReview('tieng-viet'), ...buildReview('tieng-anh')];
