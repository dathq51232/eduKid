// DANH MỤC CHƯƠNG TRÌNH LỚP 2 — Toán, Tiếng Việt (Chương trình GDPT 2018), Tiếng Anh 2 (Global Success, tự chọn).
// Cấu trúc giống grade1.ts. YCCĐ được diễn đạt ngắn gọn để dùng trong phần mềm; khi cần trích dẫn chính thức
// hãy đối chiếu văn bản gốc. stage: 1 = đầu HK1, 2 = cuối HK1, 3 = HK2.
// Mục "Tư duy, nâng cao" (isCore: false) dành cho câu mức L4–L5: dạng toán nâng cao tham khảo từ các nguồn
// bài tập phổ biến, đề do EduChain Kids tự viết.

import type { ExerciseForm, Topic } from './grade1';
import type { SubjectCode } from '../types';

export const TOPICS2: Record<SubjectCode, Topic[]> = {
  toan: [
    {
      code: 'T2.SO', title: 'Số trong phạm vi 1000', description: 'Đọc, viết, cấu tạo, so sánh số; tia số.',
      outcomes: [
        { code: 'T2.SO.01', text: 'Nhận biết tia số, số liền trước, số liền sau; ôn các số đến 100.', stage: 1 },
        { code: 'T2.SO.02', text: 'Đọc, viết được các số trong phạm vi 1000; số tròn chục, tròn trăm.', stage: 3 },
        { code: 'T2.SO.03', text: 'Nhận biết trăm, chục, đơn vị; viết số thành tổng các trăm, chục, đơn vị.', stage: 3 },
        { code: 'T2.SO.04', text: 'So sánh, xếp thứ tự các số trong phạm vi 1000.', stage: 3 },
      ],
    },
    {
      code: 'T2.PT', title: 'Phép cộng, phép trừ', description: 'Cộng, trừ qua 10, có nhớ trong phạm vi 100, trong phạm vi 1000; bài toán có lời văn.',
      outcomes: [
        { code: 'T2.PT.01', text: 'Nhận biết số hạng, tổng, số bị trừ, số trừ, hiệu.', stage: 1 },
        { code: 'T2.PT.02', text: 'Cộng, trừ (qua 10) trong phạm vi 20; thuộc bảng cộng, bảng trừ.', stage: 1 },
        { code: 'T2.PT.03', text: 'Cộng, trừ (có nhớ) các số trong phạm vi 100.', stage: 2 },
        { code: 'T2.PT.04', text: 'Cộng, trừ (không nhớ và có nhớ) các số trong phạm vi 1000.', stage: 3 },
        { code: 'T2.PT.05', text: 'Giải bài toán về thêm, bớt; nhiều hơn, ít hơn một số đơn vị; hơn kém nhau bao nhiêu.', stage: 1 },
        { code: 'T2.PT.06', text: 'Tính giá trị biểu thức có hai dấu phép tính cộng, trừ.', stage: 2 },
      ],
    },
    {
      code: 'T2.NC', title: 'Phép nhân, phép chia', description: 'Ý nghĩa phép nhân, phép chia; bảng nhân, bảng chia 2 và 5.',
      outcomes: [
        { code: 'T2.NC.01', text: 'Nhận biết ý nghĩa phép nhân; thừa số, tích.', stage: 3 },
        { code: 'T2.NC.02', text: 'Thuộc và vận dụng bảng nhân 2, bảng nhân 5.', stage: 3 },
        { code: 'T2.NC.03', text: 'Nhận biết ý nghĩa phép chia; số bị chia, số chia, thương.', stage: 3 },
        { code: 'T2.NC.04', text: 'Thuộc và vận dụng bảng chia 2, bảng chia 5; giải bài toán một bước về phép nhân, chia.', stage: 3 },
      ],
    },
    {
      code: 'T2.HH', title: 'Hình học trực quan', description: 'Điểm, đoạn thẳng, đường gấp khúc, hình tứ giác, khối trụ, khối cầu.',
      outcomes: [
        { code: 'T2.HH.01', text: 'Nhận biết điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng.', stage: 2 },
        { code: 'T2.HH.02', text: 'Nhận biết đường gấp khúc, tính độ dài đường gấp khúc; nhận biết hình tứ giác.', stage: 2 },
        { code: 'T2.HH.03', text: 'Nhận biết khối trụ, khối cầu qua đồ vật thực tế.', stage: 3 },
      ],
    },
    {
      code: 'T2.DL', title: 'Đo lường', description: 'Ki-lô-gam, lít, đề-xi-mét, mét, ki-lô-mét; giờ, phút, ngày, tháng; tiền Việt Nam.',
      outcomes: [
        { code: 'T2.DL.01', text: 'Nhận biết đơn vị ki-lô-gam (kg), lít (l); cân, đong, tính với số đo.', stage: 1 },
        { code: 'T2.DL.02', text: 'Đọc giờ trên đồng hồ; biết một ngày có 24 giờ, một giờ có 60 phút.', stage: 2 },
        { code: 'T2.DL.03', text: 'Xem lịch tháng: ngày, thứ, số ngày trong tháng.', stage: 2 },
        { code: 'T2.DL.04', text: 'Nhận biết đề-xi-mét, mét, ki-lô-mét và quan hệ giữa các đơn vị.', stage: 3 },
        { code: 'T2.DL.05', text: 'Nhận biết một số tờ tiền Việt Nam; đổi và tính tiền đơn giản.', stage: 3 },
      ],
    },
    {
      code: 'T2.TK', title: 'Thống kê và xác suất', description: 'Kiểm đếm số liệu, biểu đồ tranh, chắc chắn – có thể – không thể.',
      outcomes: [
        { code: 'T2.TK.01', text: 'Thu thập, phân loại, kiểm đếm số liệu; đọc biểu đồ tranh.', stage: 3 },
        { code: 'T2.TK.02', text: 'Nhận biết khả năng xảy ra của sự kiện: chắc chắn, có thể, không thể.', stage: 3 },
      ],
    },
    {
      code: 'T2.TD', title: 'Tư duy, nâng cao', description: 'Dạng toán nâng cao: tìm số chưa biết, quy luật, bài toán nhiều bước, tuổi, đếm hình.', isCore: false,
      outcomes: [
        { code: 'T2.TD.01', text: 'Tìm thành phần chưa biết của phép tính (tìm số hạng, số bị trừ, số trừ, thừa số).', stage: 1, isCore: false },
        { code: 'T2.TD.02', text: 'Tìm quy luật của dãy số, dãy hình và viết tiếp.', stage: 1, isCore: false },
        { code: 'T2.TD.03', text: 'Giải bài toán hai bước, bài toán về tuổi, bài toán so sánh nhiều đối tượng.', stage: 2, isCore: false },
        { code: 'T2.TD.04', text: 'Lập số theo điều kiện; tìm số lớn nhất, bé nhất; đếm hình.', stage: 2, isCore: false },
      ],
    },
  ],
  'tieng-viet': [
    {
      code: 'V2.DOC', title: 'Đọc hiểu', description: 'Hiểu chi tiết, ý chính và nhân vật của bài đọc ngắn.',
      outcomes: [
        { code: 'V2.DOC.01', text: 'Trả lời được câu hỏi về chi tiết rõ ràng trong bài đọc.', stage: 1 },
        { code: 'V2.DOC.02', text: 'Hiểu ý chính, điều bài đọc muốn nói.', stage: 2 },
        { code: 'V2.DOC.03', text: 'Nhận xét được nhân vật, liên hệ với bản thân.', stage: 2 },
      ],
    },
    {
      code: 'V2.TU', title: 'Từ ngữ', description: 'Từ chỉ sự vật, hoạt động, đặc điểm; mở rộng vốn từ theo chủ điểm.',
      outcomes: [
        { code: 'V2.TU.01', text: 'Nhận biết từ chỉ sự vật (người, đồ vật, con vật, cây cối).', stage: 1 },
        { code: 'V2.TU.02', text: 'Nhận biết từ chỉ hoạt động.', stage: 1 },
        { code: 'V2.TU.03', text: 'Nhận biết từ chỉ đặc điểm (màu sắc, hình dáng, tính nết).', stage: 1 },
        { code: 'V2.TU.04', text: 'Mở rộng vốn từ theo chủ điểm của bài học.', stage: 1 },
        { code: 'V2.TU.05', text: 'Tìm từ có nghĩa giống nhau, trái ngược nhau.', stage: 2, isCore: false },
      ],
    },
    {
      code: 'V2.CAU', title: 'Câu và dấu câu', description: 'Câu giới thiệu, câu nêu hoạt động, câu nêu đặc điểm; dấu câu.',
      outcomes: [
        { code: 'V2.CAU.01', text: 'Nhận biết và đặt câu giới thiệu (Ai là gì?).', stage: 1 },
        { code: 'V2.CAU.02', text: 'Nhận biết và đặt câu nêu hoạt động (Ai làm gì?).', stage: 1 },
        { code: 'V2.CAU.03', text: 'Nhận biết và đặt câu nêu đặc điểm (Ai thế nào?).', stage: 1 },
        { code: 'V2.CAU.04', text: 'Dùng đúng dấu chấm, dấu chấm hỏi, dấu chấm than, dấu phẩy.', stage: 1 },
      ],
    },
    {
      code: 'V2.CT', title: 'Chính tả và chữ viết', description: 'Bảng chữ cái, phân biệt âm vần dễ lẫn, viết hoa.',
      outcomes: [
        { code: 'V2.CT.01', text: 'Thuộc bảng chữ cái, xếp từ theo thứ tự chữ cái.', stage: 1 },
        { code: 'V2.CT.02', text: 'Phân biệt các âm, vần, dấu thanh dễ lẫn (c/k, g/gh, ng/ngh, s/x, ch/tr, d/gi/r, l/n, hỏi/ngã...).', stage: 1 },
        { code: 'V2.CT.03', text: 'Viết hoa tên người, tên địa lí Việt Nam.', stage: 2 },
      ],
    },
    {
      code: 'V2.VIET', title: 'Viết đoạn ngắn', description: 'Sắp xếp câu thành đoạn; chọn câu phù hợp để giới thiệu, kể, tả.',
      outcomes: [
        { code: 'V2.VIET.01', text: 'Sắp xếp các câu thành đoạn văn hợp lí; chọn câu phù hợp khi viết đoạn ngắn.', stage: 2 },
      ],
    },
  ],
  'tieng-anh': [
    {
      code: 'A2.LANG', title: 'Tiếng Anh 2 theo chủ đề', description: 'Từ vựng, âm và mẫu câu theo 16 unit của Tiếng Anh 2.',
      outcomes: [
        { code: 'A2.TU.01', text: 'Nhận biết và hiểu nghĩa từ vựng của unit.', stage: 1 },
        { code: 'A2.AM.01', text: 'Nhận biết âm/chữ cái trọng tâm của unit trong từ.', stage: 1 },
        { code: 'A2.CAU.01', text: 'Hiểu và hoàn thành mẫu câu hỏi – đáp của unit.', stage: 1 },
        { code: 'A2.SO.01', text: 'Đọc, viết số đếm từ 11 đến 20.', stage: 3 },
        { code: 'A2.ON.01', text: 'Ôn tập, vận dụng từ vựng và mẫu câu đã học.', stage: 2 },
      ],
    },
  ],
};

// Dạng bài thêm cho lớp 2 (gộp với FORMS lớp 1 trong curriculum/index.ts)
export const FORMS2: Record<SubjectCode, ExerciseForm[]> = {
  toan: [
    { code: 'TOAN.NHANCHIA', name: 'Phép nhân, phép chia', description: 'Tính, điền thừa số, thương; bài toán nhân chia.', type: 'fill_blank' },
    { code: 'TOAN.DOLUONG', name: 'Đo lường', description: 'Kg, lít, dm, m, km, tiền Việt Nam.', type: 'fill_blank' },
    { code: 'TOAN.THONGKE', name: 'Thống kê, khả năng', description: 'Kiểm đếm, biểu đồ tranh, chắc chắn – có thể – không thể.', type: 'single_choice' },
    { code: 'TOAN.TIMX', name: 'Tìm số chưa biết', description: 'Tìm số hạng, số bị trừ, số trừ, thừa số chưa biết.', type: 'fill_blank' },
    { code: 'TOAN.QUYLUAT', name: 'Quy luật dãy số', description: 'Tìm quy luật, viết số tiếp theo.', type: 'fill_blank' },
  ],
  'tieng-viet': [
    { code: 'TV.KIEUCAU', name: 'Kiểu câu', description: 'Câu giới thiệu, câu nêu hoạt động, câu nêu đặc điểm.', type: 'single_choice' },
    { code: 'TV.CHUCAI', name: 'Bảng chữ cái', description: 'Thứ tự chữ cái, xếp tên theo thứ tự.', type: 'ordering' },
    { code: 'TV.VIETHOA', name: 'Viết hoa', description: 'Viết hoa tên người, tên địa lí.', type: 'single_choice' },
    { code: 'TV.NGHIATU', name: 'Từ cùng nghĩa, trái nghĩa', description: 'Tìm từ có nghĩa giống hoặc trái ngược.', type: 'single_choice' },
    { code: 'TV.DOANVAN', name: 'Sắp xếp câu thành đoạn', description: 'Xếp các câu theo trình tự hợp lí.', type: 'ordering' },
  ],
  'tieng-anh': [
    { code: 'TA.HOIDAP', name: 'Hỏi – đáp', description: 'Ghép câu hỏi với câu trả lời, chọn câu trả lời đúng.', type: 'matching' },
    { code: 'TA.XEPCAU', name: 'Sắp xếp từ thành câu', description: 'Xếp các từ thành câu đúng.', type: 'ordering' },
    { code: 'TA.AM', name: 'Nhận biết âm', description: 'Chọn từ có âm/chữ cái của unit.', type: 'single_choice' },
  ],
};
