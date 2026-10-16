// DANH MỤC CHƯƠNG TRÌNH LỚP 3 — Toán, Tiếng Việt (Chương trình GDPT 2018), Tiếng Anh 3 (Global Success).
// Cấu trúc giống grade1.ts / grade2.ts. YCCĐ diễn đạt ngắn gọn để dùng trong phần mềm; khi cần trích dẫn chính thức
// hãy đối chiếu văn bản gốc. stage: 1 = đầu HK1, 2 = cuối HK1, 3 = HK2.
// Mục "Tư duy, nâng cao" (isCore: false) dành cho câu mức L4–L5 (dạng toán nâng cao phổ biến, đề tự viết).

import type { ExerciseForm, Topic } from './grade1';
import type { SubjectCode } from '../types';

export const TOPICS3: Record<SubjectCode, Topic[]> = {
  toan: [
    {
      code: 'T3.SO', title: 'Số đến 100 000', description: 'Đọc, viết, cấu tạo, so sánh, làm tròn số; số La Mã.',
      outcomes: [
        { code: 'T3.SO.01', text: 'Ôn các số đến 1000; đọc, viết, so sánh số.', stage: 1 },
        { code: 'T3.SO.02', text: 'Đọc, viết, phân tích cấu tạo các số có bốn, năm chữ số.', stage: 3 },
        { code: 'T3.SO.03', text: 'So sánh, xếp thứ tự các số trong phạm vi 100 000.', stage: 3 },
        { code: 'T3.SO.04', text: 'Làm tròn số đến hàng chục, trăm, nghìn, chục nghìn.', stage: 3 },
        { code: 'T3.SO.05', text: 'Đọc, viết các số La Mã từ I đến XX.', stage: 3 },
      ],
    },
    {
      code: 'T3.PT', title: 'Phép cộng, phép trừ', description: 'Cộng, trừ trong phạm vi 1000, 10 000, 100 000; tìm thành phần.',
      outcomes: [
        { code: 'T3.PT.01', text: 'Cộng, trừ các số trong phạm vi 1000 (ôn tập).', stage: 1 },
        { code: 'T3.PT.02', text: 'Tìm số hạng, số bị trừ, số trừ chưa biết.', stage: 1 },
        { code: 'T3.PT.03', text: 'Cộng, trừ các số trong phạm vi 10 000 và 100 000.', stage: 3 },
      ],
    },
    {
      code: 'T3.NC', title: 'Phép nhân, phép chia', description: 'Bảng nhân, bảng chia 2–9; nhân, chia số có nhiều chữ số với số có một chữ số.',
      outcomes: [
        { code: 'T3.NC.01', text: 'Thuộc bảng nhân, bảng chia 2 đến 9.', stage: 1 },
        { code: 'T3.NC.02', text: 'Tìm thừa số, số bị chia, số chia chưa biết.', stage: 1 },
        { code: 'T3.NC.03', text: 'Nhân, chia số có hai, ba chữ số với số có một chữ số; phép chia có dư.', stage: 2 },
        { code: 'T3.NC.04', text: 'Gấp một số lên một số lần, giảm một số đi một số lần; so sánh số lớn gấp mấy lần số bé.', stage: 2 },
        { code: 'T3.NC.05', text: 'Nhân, chia số có bốn, năm chữ số với số có một chữ số.', stage: 3 },
        { code: 'T3.NC.06', text: 'Nhận biết một phần mấy của một số, một hình.', stage: 1 },
      ],
    },
    {
      code: 'T3.BT', title: 'Biểu thức và bài toán', description: 'Tính giá trị biểu thức; bài toán giải bằng hai bước tính.',
      outcomes: [
        { code: 'T3.BT.01', text: 'Tính giá trị biểu thức số (có và không có dấu ngoặc).', stage: 2 },
        { code: 'T3.BT.02', text: 'Giải bài toán có đến hai bước tính.', stage: 2 },
      ],
    },
    {
      code: 'T3.HH', title: 'Hình học', description: 'Trung điểm, hình tròn, góc vuông, tam giác, tứ giác, chu vi, diện tích.',
      outcomes: [
        { code: 'T3.HH.01', text: 'Nhận biết điểm ở giữa, trung điểm đoạn thẳng; tâm, bán kính, đường kính hình tròn.', stage: 1 },
        { code: 'T3.HH.02', text: 'Nhận biết góc vuông, góc không vuông; đỉnh, cạnh của hình; khối lập phương, khối hộp chữ nhật.', stage: 1 },
        { code: 'T3.HH.03', text: 'Tính chu vi hình tam giác, tứ giác, hình chữ nhật, hình vuông.', stage: 3 },
        { code: 'T3.HH.04', text: 'Tính diện tích hình chữ nhật, hình vuông (cm²).', stage: 3 },
      ],
    },
    {
      code: 'T3.DL', title: 'Đo lường', description: 'mm, g, ml, °C; xem đồng hồ, tháng – năm; tiền Việt Nam.',
      outcomes: [
        { code: 'T3.DL.01', text: 'Nhận biết mi-li-mét, gam, mi-li-lít, độ C; đổi và tính với số đo.', stage: 2 },
        { code: 'T3.DL.02', text: 'Xem đồng hồ chính xác đến phút; tháng, năm; xem lịch.', stage: 3 },
        { code: 'T3.DL.03', text: 'Nhận biết tiền Việt Nam; tính tiền khi mua bán.', stage: 3 },
      ],
    },
    {
      code: 'T3.TK', title: 'Thống kê và xác suất', description: 'Thu thập, phân loại số liệu, bảng số liệu; khả năng xảy ra.',
      outcomes: [
        { code: 'T3.TK.01', text: 'Thu thập, phân loại, ghi chép số liệu; đọc bảng số liệu.', stage: 3 },
        { code: 'T3.TK.02', text: 'Nhận biết khả năng xảy ra của một sự kiện: chắc chắn, có thể, không thể.', stage: 3 },
      ],
    },
    {
      code: 'T3.TD', title: 'Tư duy, nâng cao', description: 'Dạng toán nâng cao: quy luật, bài toán nhiều bước, tìm số, đếm hình, tổng – hiệu.', isCore: false,
      outcomes: [
        { code: 'T3.TD.01', text: 'Tìm thành phần chưa biết trong biểu thức nhiều bước.', stage: 1, isCore: false },
        { code: 'T3.TD.02', text: 'Tìm quy luật của dãy số và viết tiếp.', stage: 1, isCore: false },
        { code: 'T3.TD.03', text: 'Giải bài toán nhiều bước: tuổi, tổng – hiệu, gấp – giảm, rút về đơn vị.', stage: 2, isCore: false },
        { code: 'T3.TD.04', text: 'Lập số theo điều kiện; đếm hình; suy luận logic.', stage: 2, isCore: false },
      ],
    },
  ],
  'tieng-viet': [
    {
      code: 'V3.DOC', title: 'Đọc hiểu', description: 'Hiểu chi tiết, ý chính, nhân vật và bài học của bài đọc.',
      outcomes: [
        { code: 'V3.DOC.01', text: 'Trả lời được câu hỏi về chi tiết trong bài đọc.', stage: 1 },
        { code: 'V3.DOC.02', text: 'Hiểu ý chính, điều tác giả muốn nói; nhận xét nhân vật.', stage: 1 },
        { code: 'V3.DOC.03', text: 'Suy luận từ chi tiết; liên hệ bài học với bản thân.', stage: 2 },
      ],
    },
    {
      code: 'V3.TU', title: 'Từ ngữ', description: 'Từ chỉ sự vật, hoạt động, đặc điểm; mở rộng vốn từ; từ cùng nghĩa, trái nghĩa; so sánh.',
      outcomes: [
        { code: 'V3.TU.01', text: 'Nhận biết từ chỉ sự vật.', stage: 1 },
        { code: 'V3.TU.02', text: 'Nhận biết từ chỉ hoạt động.', stage: 1 },
        { code: 'V3.TU.03', text: 'Nhận biết từ chỉ đặc điểm.', stage: 1 },
        { code: 'V3.TU.04', text: 'Mở rộng vốn từ theo chủ điểm.', stage: 1 },
        { code: 'V3.TU.05', text: 'Tìm từ có nghĩa giống nhau, trái ngược nhau.', stage: 2 },
        { code: 'V3.TU.06', text: 'Nhận biết biện pháp so sánh; tìm sự vật được so sánh.', stage: 2 },
      ],
    },
    {
      code: 'V3.CAU', title: 'Câu và dấu câu', description: 'Câu kể, câu hỏi, câu cảm, câu khiến; dấu câu; trả lời câu hỏi Khi nào? Ở đâu? Bằng gì? Để làm gì?',
      outcomes: [
        { code: 'V3.CAU.01', text: 'Nhận biết câu giới thiệu.', stage: 1 },
        { code: 'V3.CAU.02', text: 'Nhận biết câu nêu hoạt động.', stage: 1 },
        { code: 'V3.CAU.03', text: 'Nhận biết câu nêu đặc điểm.', stage: 1 },
        { code: 'V3.CAU.04', text: 'Dùng đúng dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy.', stage: 1 },
        { code: 'V3.CAU.05', text: 'Nhận biết câu kể, câu hỏi, câu cảm, câu khiến.', stage: 1 },
        { code: 'V3.CAU.06', text: 'Dùng đúng dấu hai chấm, dấu gạch ngang, dấu ngoặc kép.', stage: 2 },
        { code: 'V3.CAU.07', text: 'Đặt và trả lời câu hỏi Khi nào? Ở đâu? Bằng gì? Để làm gì?', stage: 3 },
      ],
    },
    {
      code: 'V3.CT', title: 'Chính tả và chữ viết', description: 'Phân biệt âm vần dễ lẫn; viết hoa tên riêng.',
      outcomes: [
        { code: 'V3.CT.01', text: 'Xếp từ, tên theo thứ tự bảng chữ cái.', stage: 1 },
        { code: 'V3.CT.02', text: 'Phân biệt các âm, vần, dấu thanh dễ lẫn.', stage: 1 },
        { code: 'V3.CT.03', text: 'Viết hoa tên người, tên địa lí Việt Nam.', stage: 1 },
        { code: 'V3.CT.04', text: 'Viết đúng tên riêng nước ngoài (phiên âm có gạch nối).', stage: 3 },
      ],
    },
    {
      code: 'V3.VIET', title: 'Viết đoạn văn', description: 'Sắp xếp câu thành đoạn; chọn câu phù hợp.',
      outcomes: [{ code: 'V3.VIET.01', text: 'Sắp xếp các câu thành đoạn văn hợp lí.', stage: 2 }],
    },
  ],
  'tieng-anh': [
    {
      code: 'A3.LANG', title: 'Tiếng Anh 3 theo chủ đề', description: 'Từ vựng, âm và mẫu câu theo 20 unit của Tiếng Anh 3.',
      outcomes: [
        { code: 'A3.TU.01', text: 'Nhận biết và hiểu nghĩa từ vựng của unit.', stage: 1 },
        { code: 'A3.AM.01', text: 'Nhận biết âm, chữ cái trọng tâm của unit trong từ.', stage: 1 },
        { code: 'A3.CAU.01', text: 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', stage: 1 },
        { code: 'A3.ON.01', text: 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', stage: 2 },
      ],
    },
  ],
};

export const FORMS3: Record<SubjectCode, ExerciseForm[]> = {
  toan: [
    { code: 'TOAN.BIEUTHUC', name: 'Biểu thức', description: 'Tính giá trị biểu thức có và không có dấu ngoặc.', type: 'fill_blank' },
    { code: 'TOAN.PHANSO', name: 'Một phần mấy', description: 'Tìm một phần mấy của một số, một hình.', type: 'single_choice' },
    { code: 'TOAN.CHUVI', name: 'Chu vi, diện tích', description: 'Tính chu vi, diện tích hình chữ nhật, hình vuông.', type: 'fill_blank' },
  ],
  'tieng-viet': [
    { code: 'TV.SOSANH', name: 'Biện pháp so sánh', description: 'Tìm câu có so sánh, sự vật được so sánh.', type: 'single_choice' },
    { code: 'TV.CAUHOI', name: 'Trả lời câu hỏi', description: 'Bộ phận câu trả lời câu hỏi Khi nào? Ở đâu? Bằng gì? Để làm gì?', type: 'single_choice' },
  ],
  'tieng-anh': [],
};
