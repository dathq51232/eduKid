// DANH MỤC CHƯƠNG TRÌNH LỚP 5 — Toán, Tiếng Việt (Chương trình GDPT 2018), Tiếng Anh 5 (Global Success).
// YCCĐ diễn đạt ngắn gọn để dùng trong phần mềm; khi cần trích dẫn chính thức hãy đối chiếu văn bản gốc.
// stage: 1 = đầu HK1, 2 = cuối HK1, 3 = HK2. Mục "Tư duy, nâng cao" (isCore: false) dành cho câu mức L4–L5.

import type { ExerciseForm, Topic } from './grade1';
import type { SubjectCode } from '../types';

export const TOPICS5: Record<SubjectCode, Topic[]> = {
  toan: [
    { code: 'T5.SO', title: 'Số tự nhiên, phân số, hỗn số', description: 'Ôn số tự nhiên và phân số; phân số thập phân; hỗn số.', outcomes: [
      { code: 'T5.SO.01', text: 'Đọc, viết, so sánh, tính với số tự nhiên.', stage: 1 },
      { code: 'T5.SO.02', text: 'Rút gọn, quy đồng, so sánh, tính với phân số.', stage: 1 },
      { code: 'T5.SO.03', text: 'Nhận biết phân số thập phân, hỗn số.', stage: 1 },
    ] },
    { code: 'T5.STP', title: 'Số thập phân', description: 'Khái niệm, so sánh, làm tròn, viết số đo dưới dạng số thập phân; bốn phép tính.', outcomes: [
      { code: 'T5.STP.01', text: 'Đọc, viết số thập phân; hàng của số thập phân.', stage: 1 },
      { code: 'T5.STP.02', text: 'So sánh, sắp xếp, làm tròn số thập phân.', stage: 1 },
      { code: 'T5.STP.03', text: 'Viết số đo đại lượng dưới dạng số thập phân.', stage: 1 },
      { code: 'T5.STP.04', text: 'Cộng, trừ, nhân, chia số thập phân; nhân, chia với 10, 100, 1000 và 0,1; 0,01; 0,001.', stage: 2 },
    ] },
    { code: 'T5.TS', title: 'Tỉ số, tỉ số phần trăm', description: 'Tỉ số; tỉ lệ bản đồ; tổng – tỉ, hiệu – tỉ; tỉ số phần trăm.', outcomes: [
      { code: 'T5.TS.01', text: 'Nhận biết tỉ số, tỉ số phần trăm; tỉ lệ bản đồ.', stage: 3 },
      { code: 'T5.TS.02', text: 'Tìm hai số khi biết tổng (hiệu) và tỉ số.', stage: 3 },
      { code: 'T5.TS.03', text: 'Tìm tỉ số phần trăm của hai số; tìm giá trị phần trăm của một số.', stage: 3 },
    ] },
    { code: 'T5.HH', title: 'Hình học', description: 'Tam giác, hình thang, hình tròn; hình hộp chữ nhật, hình lập phương, hình trụ.', outcomes: [
      { code: 'T5.HH.01', text: 'Tính diện tích hình tam giác, hình thang.', stage: 2 },
      { code: 'T5.HH.02', text: 'Tính chu vi, diện tích hình tròn.', stage: 2 },
      { code: 'T5.HH.03', text: 'Tính diện tích xung quanh, toàn phần, thể tích hình hộp chữ nhật, hình lập phương.', stage: 3 },
    ] },
    { code: 'T5.DL', title: 'Đo lường', description: 'km², ha; cm³, dm³, m³; số đo thời gian; vận tốc, quãng đường, thời gian.', outcomes: [
      { code: 'T5.DL.01', text: 'Đổi các đơn vị đo diện tích (km², ha, m²…).', stage: 1 },
      { code: 'T5.DL.02', text: 'Đổi các đơn vị đo thể tích.', stage: 3 },
      { code: 'T5.DL.03', text: 'Cộng, trừ, nhân, chia số đo thời gian.', stage: 3 },
      { code: 'T5.DL.04', text: 'Tính vận tốc, quãng đường, thời gian của chuyển động đều.', stage: 3 },
    ] },
    { code: 'T5.TK', title: 'Thống kê và xác suất', description: 'Thu thập, sắp xếp số liệu; biểu đồ hình quạt tròn; tỉ số số lần lặp lại một sự kiện.', outcomes: [
      { code: 'T5.TK.01', text: 'Đọc, phân tích số liệu; biểu đồ hình quạt tròn.', stage: 3 },
      { code: 'T5.TK.02', text: 'Tính tỉ số của số lần lặp lại một sự kiện so với tổng số lần thực hiện.', stage: 3 },
    ] },
    { code: 'T5.TD', title: 'Tư duy, nâng cao', description: 'Bài toán nhiều bước: tỉ số, phần trăm, chuyển động, hình học.', isCore: false, outcomes: [
      { code: 'T5.TD.01', text: 'Giải bài toán nhiều bước với số thập phân, phân số.', stage: 2, isCore: false },
      { code: 'T5.TD.02', text: 'Giải bài toán nâng cao về tỉ số, phần trăm, chuyển động, hình học.', stage: 3, isCore: false },
    ] },
  ],
  'tieng-viet': [
    { code: 'V5.DOC', title: 'Đọc hiểu', description: 'Chi tiết, ý chính, nhân vật, ý nghĩa, liên hệ.', outcomes: [
      { code: 'V5.DOC.01', text: 'Trả lời câu hỏi về chi tiết trong bài đọc.', stage: 1 },
      { code: 'V5.DOC.02', text: 'Hiểu ý chính, chủ đề; nhận xét nhân vật, chi tiết.', stage: 1 },
      { code: 'V5.DOC.03', text: 'Suy luận, rút ra bài học, liên hệ bản thân.', stage: 2 },
    ] },
    { code: 'V5.TU', title: 'Từ và nghĩa của từ', description: 'Đại từ, kết từ; từ đồng nghĩa, từ đa nghĩa; điệp từ, điệp ngữ; từ điển.', outcomes: [
      { code: 'V5.TU.01', text: 'Nhận biết và dùng đại từ (xưng hô, thay thế, nghi vấn).', stage: 1 },
      { code: 'V5.TU.02', text: 'Nhận biết và dùng từ đồng nghĩa.', stage: 1 },
      { code: 'V5.TU.03', text: 'Nhận biết từ đa nghĩa; phân biệt nghĩa gốc, nghĩa chuyển.', stage: 1 },
      { code: 'V5.TU.04', text: 'Nhận biết và dùng kết từ.', stage: 2 },
      { code: 'V5.TU.05', text: 'Nhận biết biện pháp điệp từ, điệp ngữ.', stage: 2 },
      { code: 'V5.TU.06', text: 'Ôn danh từ, động từ, tính từ; dùng từ điển.', stage: 1 },
    ] },
    { code: 'V5.CAU', title: 'Câu và liên kết câu', description: 'Câu đơn, câu ghép, cách nối vế câu ghép; liên kết câu bằng lặp, nối, thay thế.', outcomes: [
      { code: 'V5.CAU.01', text: 'Phân biệt câu đơn, câu ghép.', stage: 3 },
      { code: 'V5.CAU.02', text: 'Nối các vế câu ghép bằng kết từ, cặp kết từ, dấu câu.', stage: 3 },
      { code: 'V5.CAU.03', text: 'Liên kết câu bằng cách lặp từ ngữ, dùng từ ngữ nối, từ ngữ thay thế.', stage: 3 },
      { code: 'V5.CAU.04', text: 'Dùng đúng dấu gạch ngang và các dấu câu.', stage: 2 },
    ] },
    { code: 'V5.CT', title: 'Chính tả, viết hoa', description: 'Viết hoa thể hiện sự tôn trọng; viết tên người, tên địa lí nước ngoài.', outcomes: [
      { code: 'V5.CT.01', text: 'Viết hoa danh từ chung để thể hiện sự tôn trọng đặc biệt.', stage: 3 },
      { code: 'V5.CT.02', text: 'Viết đúng tên người, tên địa lí nước ngoài.', stage: 3 },
    ] },
  ],
  'tieng-anh': [
    { code: 'A5.LANG', title: 'Tiếng Anh 5 theo chủ đề', description: 'Từ vựng, trọng âm và mẫu câu theo 20 unit của Tiếng Anh 5.', outcomes: [
      { code: 'A5.TU.01', text: 'Nhận biết và hiểu nghĩa từ vựng của unit.', stage: 1 },
      { code: 'A5.AM.01', text: 'Nhận biết chữ cái, cụm chữ trọng tâm của unit trong từ.', stage: 1 },
      { code: 'A5.CAU.01', text: 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', stage: 1 },
      { code: 'A5.ON.01', text: 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', stage: 2 },
    ] },
  ],
};

export const FORMS5: Record<SubjectCode, ExerciseForm[]> = {
  toan: [],
  'tieng-viet': [
    { code: 'TV.CAUGHEP', name: 'Câu đơn, câu ghép', description: 'Nhận biết câu ghép; nối các vế câu ghép.', type: 'single_choice' },
    { code: 'TV.LIENKET', name: 'Liên kết câu', description: 'Lặp từ ngữ, từ ngữ nối, từ ngữ thay thế.', type: 'single_choice' },
  ],
  'tieng-anh': [],
};
