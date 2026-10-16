// DANH MỤC CHƯƠNG TRÌNH LỚP 4 — Toán, Tiếng Việt (Chương trình GDPT 2018), Tiếng Anh 4 (Global Success).
// YCCĐ diễn đạt ngắn gọn để dùng trong phần mềm; khi cần trích dẫn chính thức hãy đối chiếu văn bản gốc.
// stage: 1 = đầu HK1, 2 = cuối HK1, 3 = HK2. Mục "Tư duy, nâng cao" (isCore: false) dành cho câu mức L4–L5.

import type { ExerciseForm, Topic } from './grade1';
import type { SubjectCode } from '../types';

export const TOPICS4: Record<SubjectCode, Topic[]> = {
  toan: [
    { code: 'T4.SO', title: 'Số tự nhiên', description: 'Số có nhiều chữ số, hàng và lớp, làm tròn, so sánh, số chẵn – lẻ.', outcomes: [
      { code: 'T4.SO.01', text: 'Nhận biết số chẵn, số lẻ.', stage: 1 },
      { code: 'T4.SO.02', text: 'Đọc, viết, phân tích cấu tạo số có nhiều chữ số (đến lớp triệu); hàng và lớp.', stage: 1 },
      { code: 'T4.SO.03', text: 'So sánh, xếp thứ tự số có nhiều chữ số; dãy số tự nhiên.', stage: 1 },
      { code: 'T4.SO.04', text: 'Làm tròn số đến hàng trăm nghìn.', stage: 1 },
    ] },
    { code: 'T4.PT', title: 'Cộng, trừ; biểu thức', description: 'Cộng, trừ số có nhiều chữ số; tính chất; tổng – hiệu; biểu thức chứa chữ; bài toán ba bước.', outcomes: [
      { code: 'T4.PT.01', text: 'Cộng, trừ các số có nhiều chữ số; tìm thành phần chưa biết.', stage: 2 },
      { code: 'T4.PT.02', text: 'Vận dụng tính chất giao hoán, kết hợp của phép cộng để tính thuận tiện.', stage: 2 },
      { code: 'T4.PT.03', text: 'Tìm hai số biết tổng và hiệu.', stage: 2 },
      { code: 'T4.PT.04', text: 'Tính giá trị biểu thức chứa một, hai, ba chữ.', stage: 1 },
      { code: 'T4.PT.05', text: 'Giải bài toán có ba bước tính.', stage: 1 },
    ] },
    { code: 'T4.NC', title: 'Nhân, chia', description: 'Nhân, chia với số có một, hai chữ số; tính chất; trung bình cộng; rút về đơn vị.', outcomes: [
      { code: 'T4.NC.01', text: 'Nhân, chia với số có một, hai chữ số.', stage: 3 },
      { code: 'T4.NC.02', text: 'Vận dụng tính chất giao hoán, kết hợp, phân phối; nhân, chia với 10, 100, 1000.', stage: 3 },
      { code: 'T4.NC.03', text: 'Ước lượng kết quả tính toán.', stage: 3 },
      { code: 'T4.NC.04', text: 'Tìm số trung bình cộng.', stage: 3 },
      { code: 'T4.NC.05', text: 'Giải bài toán liên quan đến rút về đơn vị.', stage: 3 },
    ] },
    { code: 'T4.PS', title: 'Phân số', description: 'Khái niệm, tính chất, rút gọn, quy đồng, so sánh, bốn phép tính, phân số của một số.', outcomes: [
      { code: 'T4.PS.01', text: 'Đọc, viết phân số; phân số và phép chia số tự nhiên.', stage: 3 },
      { code: 'T4.PS.02', text: 'Tính chất cơ bản của phân số; rút gọn phân số.', stage: 3 },
      { code: 'T4.PS.03', text: 'Quy đồng mẫu số; so sánh phân số.', stage: 3 },
      { code: 'T4.PS.04', text: 'Cộng, trừ phân số.', stage: 3 },
      { code: 'T4.PS.05', text: 'Nhân, chia phân số.', stage: 3 },
      { code: 'T4.PS.06', text: 'Tìm phân số của một số.', stage: 3 },
    ] },
    { code: 'T4.HH', title: 'Hình học', description: 'Góc, đo góc; vuông góc, song song; hình bình hành, hình thoi.', outcomes: [
      { code: 'T4.HH.01', text: 'Đo góc (độ); nhận biết góc nhọn, vuông, tù, bẹt.', stage: 1 },
      { code: 'T4.HH.02', text: 'Nhận biết hai đường thẳng vuông góc, song song; hình bình hành, hình thoi.', stage: 2 },
    ] },
    { code: 'T4.DL', title: 'Đo lường', description: 'Yến, tạ, tấn; dm², m², mm²; giây, thế kỉ.', outcomes: [
      { code: 'T4.DL.01', text: 'Nhận biết, đổi yến, tạ, tấn.', stage: 1 },
      { code: 'T4.DL.02', text: 'Nhận biết, đổi dm², m², mm².', stage: 1 },
      { code: 'T4.DL.03', text: 'Nhận biết giây, thế kỉ.', stage: 1 },
    ] },
    { code: 'T4.TK', title: 'Thống kê và xác suất', description: 'Dãy số liệu, biểu đồ cột, số lần xuất hiện của sự kiện.', outcomes: [
      { code: 'T4.TK.01', text: 'Đọc, mô tả dãy số liệu thống kê.', stage: 3 },
      { code: 'T4.TK.02', text: 'Đọc, so sánh số liệu trên biểu đồ cột.', stage: 3 },
      { code: 'T4.TK.03', text: 'Kiểm đếm số lần xuất hiện của một sự kiện.', stage: 3 },
    ] },
    { code: 'T4.TD', title: 'Tư duy, nâng cao', description: 'Lập số, đếm số, quy luật, bài toán nhiều bước, phân số vận dụng.', isCore: false, outcomes: [
      { code: 'T4.TD.02', text: 'Tìm quy luật dãy số.', stage: 1, isCore: false },
      { code: 'T4.TD.03', text: 'Giải bài toán nhiều bước: tổng – hiệu, trung bình cộng, phân số, rút về đơn vị.', stage: 2, isCore: false },
      { code: 'T4.TD.04', text: 'Lập số, đếm số, suy luận hình học.', stage: 2, isCore: false },
    ] },
  ],
  'tieng-viet': [
    { code: 'V4.DOC', title: 'Đọc hiểu', description: 'Chi tiết, ý chính, nhân vật, ý nghĩa bài đọc.', outcomes: [
      { code: 'V4.DOC.01', text: 'Trả lời câu hỏi về chi tiết trong bài đọc.', stage: 1 },
      { code: 'V4.DOC.02', text: 'Hiểu ý chính, chủ đề; nhận xét nhân vật.', stage: 1 },
      { code: 'V4.DOC.03', text: 'Suy luận, rút ra bài học, liên hệ bản thân.', stage: 2 },
    ] },
    { code: 'V4.TU', title: 'Từ và từ loại', description: 'Danh từ, động từ, tính từ; mở rộng vốn từ; lựa chọn từ ngữ; nhân hoá.', outcomes: [
      { code: 'V4.TU.01', text: 'Nhận biết danh từ (chung, riêng).', stage: 1 },
      { code: 'V4.TU.02', text: 'Nhận biết động từ.', stage: 1 },
      { code: 'V4.TU.03', text: 'Nhận biết tính từ.', stage: 2 },
      { code: 'V4.TU.04', text: 'Mở rộng vốn từ theo chủ điểm.', stage: 1 },
      { code: 'V4.TU.05', text: 'Lựa chọn từ ngữ phù hợp; từ cùng nghĩa, trái nghĩa.', stage: 3 },
      { code: 'V4.TU.06', text: 'Nhận biết biện pháp nhân hoá.', stage: 2 },
    ] },
    { code: 'V4.CAU', title: 'Câu và dấu câu', description: 'Hai thành phần chính của câu; trạng ngữ; dấu gạch ngang, ngoặc kép, ngoặc đơn.', outcomes: [
      { code: 'V4.CAU.01', text: 'Xác định chủ ngữ, vị ngữ.', stage: 3 },
      { code: 'V4.CAU.02', text: 'Nhận biết trạng ngữ chỉ thời gian, nơi chốn, nguyên nhân, mục đích, phương tiện.', stage: 3 },
      { code: 'V4.CAU.03', text: 'Dùng đúng dấu gạch ngang, dấu ngoặc kép, dấu ngoặc đơn và các dấu câu.', stage: 2 },
    ] },
    { code: 'V4.CT', title: 'Chính tả, viết hoa', description: 'Viết hoa tên cơ quan, tổ chức, tên riêng; dùng từ điển.', outcomes: [
      { code: 'V4.CT.01', text: 'Viết hoa đúng tên cơ quan, tổ chức, tên riêng.', stage: 1 },
      { code: 'V4.CT.02', text: 'Biết cách dùng từ điển (thứ tự chữ cái).', stage: 1 },
    ] },
  ],
  'tieng-anh': [
    { code: 'A4.LANG', title: 'Tiếng Anh 4 theo chủ đề', description: 'Từ vựng, âm và mẫu câu theo 20 unit của Tiếng Anh 4.', outcomes: [
      { code: 'A4.TU.01', text: 'Nhận biết và hiểu nghĩa từ vựng của unit.', stage: 1 },
      { code: 'A4.AM.01', text: 'Nhận biết âm, chữ cái trọng tâm của unit trong từ.', stage: 1 },
      { code: 'A4.CAU.01', text: 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', stage: 1 },
      { code: 'A4.ON.01', text: 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', stage: 2 },
    ] },
  ],
};

export const FORMS4: Record<SubjectCode, ExerciseForm[]> = {
  toan: [],
  'tieng-viet': [
    { code: 'TV.TULOAI', name: 'Từ loại', description: 'Danh từ, động từ, tính từ.', type: 'multiple_choice' },
    { code: 'TV.THANHPHAN', name: 'Thành phần câu', description: 'Chủ ngữ, vị ngữ, trạng ngữ.', type: 'single_choice' },
  ],
  'tieng-anh': [],
};
