// DANH MỤC CHƯƠNG TRÌNH LỚP 1 — nguồn dữ liệu duy nhất.
// Lớp 1 -> Môn -> Chủ đề -> Yêu cầu cần đạt (YCCĐ) -> Bài học -> Dạng bài.
//
// - Toán, Tiếng Việt: theo Chương trình GDPT 2018 (Thông tư 32/2018/TT-BGDĐT), phần Lớp 1.
// - Tiếng Anh: theo Chương trình Làm quen tiếng Anh lớp 1 và lớp 2 (tự chọn). Trường dạy theo bộ sách
//   khác thì sửa trong trang quản trị /quan-tri/chuong-trinh; cờ isCore phân biệt nội dung cốt lõi / mở rộng.
// - "stage" (giai đoạn) dùng để tăng dần độ khó, không dạy vượt trước: 1 = đầu HK1, 2 = cuối HK1, 3 = HK2.
//
// File SQL nạp dữ liệu (migration 0005) được sinh từ file này bằng: node scripts/gen-curriculum-sql.mjs
// Nội dung YCCĐ được diễn đạt ngắn gọn để dùng trong phần mềm; khi cần trích dẫn chính thức hãy đối chiếu văn bản gốc.

import type { Level } from '../levels';
import type { QuestionType, SubjectCode } from '../types';

export type Outcome = { code: string; text: string; stage: 1 | 2 | 3; isCore?: boolean };
export type Topic = { code: string; title: string; description: string; isCore?: boolean; outcomes: Outcome[] };
export type ExerciseForm = { code: string; name: string; description: string; type: QuestionType };

// Cấp độ câu hỏi: thang nội bộ L1–L5 (src/lib/levels.ts). L1–L3 tương ứng Nhận biết – Thông hiểu – Vận dụng.
export const LEVEL_LABEL: Record<Level, string> = {
  1: 'L1 Làm quen', 2: 'L2 Cơ bản', 3: 'L3 Vận dụng', 4: 'L4 Thử thách', 5: 'L5 Mở rộng',
};

export const STAGE_LABEL: Record<1 | 2 | 3, string> = { 1: 'Giai đoạn 1', 2: 'Giai đoạn 2', 3: 'Giai đoạn 3' };

export const TOPICS: Record<SubjectCode, Topic[]> = {
  toan: [
    {
      code: 'T1.SO',
      title: 'Đếm, đọc, viết và so sánh số',
      description: 'Số tự nhiên trong phạm vi 10, 20 rồi 100, theo từng giai đoạn.',
      outcomes: [
        { code: 'T1.SO.01', text: 'Đếm, đọc, viết được các số trong phạm vi 10.', stage: 1 },
        { code: 'T1.SO.02', text: 'So sánh, xếp thứ tự các số trong phạm vi 10; dùng dấu >, <, =.', stage: 1 },
        { code: 'T1.SO.03', text: 'Đếm, đọc, viết được các số trong phạm vi 20.', stage: 2 },
        { code: 'T1.SO.04', text: 'Đếm, đọc, viết được các số trong phạm vi 100.', stage: 3 },
        { code: 'T1.SO.05', text: 'Nhận biết được chục và đơn vị, số tròn chục.', stage: 3 },
        { code: 'T1.SO.06', text: 'So sánh, xếp thứ tự các số trong phạm vi 100 (nhóm không quá 4 số).', stage: 3 },
      ],
    },
    {
      code: 'T1.PT',
      title: 'Phép cộng, phép trừ và bài toán có lời văn',
      description: 'Ý nghĩa phép cộng, trừ; tính nhẩm; giải quyết vấn đề đơn giản.',
      outcomes: [
        { code: 'T1.PT.01', text: 'Nhận biết được ý nghĩa của phép cộng, phép trừ.', stage: 1 },
        { code: 'T1.PT.02', text: 'Thực hiện được tính nhẩm phép cộng, phép trừ trong phạm vi 10.', stage: 1 },
        { code: 'T1.PT.03', text: 'Nhận biết ý nghĩa thực tế của phép cộng, phép trừ qua tranh ảnh, tình huống thực tế.', stage: 1 },
        { code: 'T1.PT.04', text: 'Thực hiện được phép cộng, phép trừ (không nhớ) các số trong phạm vi 100.', stage: 3 },
        { code: 'T1.PT.05', text: 'Tính nhẩm được phép cộng, phép trừ các số tròn chục.', stage: 3 },
        { code: 'T1.PT.06', text: 'Làm quen với việc thực hiện tính toán có hai dấu phép tính, theo thứ tự từ trái sang phải.', stage: 2 },
        { code: 'T1.PT.07', text: 'Viết được phép tính thích hợp với câu trả lời của bài toán có lời văn và tính đúng kết quả.', stage: 2 },
      ],
    },
    {
      code: 'T1.HH',
      title: 'Hình học trực quan, đo lường và vận dụng',
      description: 'Vị trí, hình phẳng, hình khối, độ dài, giờ và lịch; vận dụng vào đời sống.',
      outcomes: [
        { code: 'T1.HH.01', text: 'Nhận biết vị trí, định hướng: trên – dưới, phải – trái, trước – sau, ở giữa.', stage: 1 },
        { code: 'T1.HH.02', text: 'Nhận dạng hình vuông, hình tròn, hình tam giác, hình chữ nhật qua đồ vật thật.', stage: 1 },
        { code: 'T1.HH.03', text: 'Nhận dạng khối lập phương, khối hộp chữ nhật.', stage: 2 },
        { code: 'T1.HH.04', text: 'Lắp ghép, xếp được các hình đơn giản.', stage: 2 },
        { code: 'T1.HH.05', text: 'Nhận biết dài hơn, ngắn hơn; đơn vị xăng-ti-mét; đọc, viết số đo độ dài trong phạm vi 100 cm.', stage: 3 },
        { code: 'T1.HH.06', text: 'Đo, ước lượng độ dài bằng đơn vị không chính thức (gang tay, bước chân) và bằng thước cm.', stage: 3 },
        { code: 'T1.HH.07', text: 'Biết một tuần có 7 ngày, tên và thứ tự các ngày trong tuần.', stage: 3 },
        { code: 'T1.HH.08', text: 'Đọc giờ đúng trên đồng hồ; xem lịch tờ hằng ngày.', stage: 3 },
        { code: 'T1.HH.09', text: 'Giải quyết vấn đề thực tế đơn giản liên quan đến đo độ dài, xem giờ, xem lịch.', stage: 3 },
      ],
    },
  ],

  'tieng-viet': [
    {
      code: 'V1.AM',
      title: 'Âm, chữ, vần và thanh điệu',
      description: 'Nhận biết âm, chữ cái, vần, thanh điệu và dấu thanh; quy tắc chính tả cơ bản.',
      outcomes: [
        { code: 'V1.AM.01', text: 'Nhận biết và đọc đúng các âm, chữ cái.', stage: 1 },
        { code: 'V1.AM.02', text: 'Nhận biết thanh điệu và dấu thanh; đặt dấu thanh đúng vị trí.', stage: 1 },
        { code: 'V1.AM.03', text: 'Nhận biết và đọc đúng các vần.', stage: 2 },
        { code: 'V1.AM.04', text: 'Phân biệt quy tắc chính tả c/k, g/gh, ng/ngh.', stage: 2 },
      ],
    },
    {
      code: 'V1.DOC',
      title: 'Ghép tiếng, đọc từ, câu và đoạn ngắn',
      description: 'Đọc đúng, đọc trơn và hiểu nội dung đơn giản theo tiến trình học.',
      outcomes: [
        { code: 'V1.DOC.01', text: 'Ghép âm, vần, thanh thành tiếng; đọc đúng tiếng, từ.', stage: 1 },
        { code: 'V1.DOC.02', text: 'Đọc đúng, rõ ràng câu và đoạn văn ngắn (khoảng 40–60 tiếng/phút).', stage: 3 },
        { code: 'V1.DOC.03', text: 'Ngắt nghỉ hơi đúng ở dấu phẩy, dấu chấm, chỗ kết thúc dòng thơ.', stage: 3 },
        { code: 'V1.DOC.04', text: 'Trả lời câu hỏi đơn giản về chi tiết nổi bật, tường minh trong văn bản.', stage: 2 },
        { code: 'V1.DOC.05', text: 'Liên hệ tranh minh hoạ với chi tiết trong văn bản.', stage: 2 },
        { code: 'V1.DOC.06', text: 'Nhận biết trình tự sự việc trong văn bản thông tin ngắn; hiểu kí hiệu đơn giản, quen thuộc.', stage: 3 },
      ],
    },
    {
      code: 'V1.VIET',
      title: 'Viết chữ, chính tả, từ ngữ và câu đơn giản',
      description: 'Kĩ thuật viết, chính tả, vốn từ và viết câu ngắn.',
      outcomes: [
        { code: 'V1.VIET.01', text: 'Viết đúng chữ thường, chữ số 0–9; bước đầu viết chữ hoa.', stage: 1 },
        { code: 'V1.VIET.02', text: 'Viết đúng chính tả bài nghe – viết, nhìn – viết khoảng 30–35 chữ.', stage: 3 },
        { code: 'V1.VIET.03', text: 'Viết hoa chữ cái đầu câu, đầu tên riêng.', stage: 3 },
        { code: 'V1.VIET.04', text: 'Mở rộng vốn từ: từ ngữ chỉ sự vật, hoạt động, đặc điểm quen thuộc.', stage: 2 },
        { code: 'V1.VIET.05', text: 'Dùng đúng dấu chấm, dấu chấm hỏi.', stage: 3 },
        { code: 'V1.VIET.06', text: 'Điền phần thông tin còn trống; viết câu trả lời, chú thích cho tranh.', stage: 3 },
      ],
    },
    {
      code: 'V1.NN',
      title: 'Nghe và nói',
      description: 'Nói rõ ràng thành câu, nghe hiểu, giao tiếp lịch sự theo yêu cầu từng giai đoạn.',
      outcomes: [
        { code: 'V1.NN.01', text: 'Nói rõ ràng, thành câu; biết chào hỏi, cảm ơn, xin lỗi, xin phép phù hợp.', stage: 1 },
        { code: 'V1.NN.02', text: 'Nghe hiểu thông báo, hướng dẫn, yêu cầu, nội quy trong lớp học.', stage: 1 },
        { code: 'V1.NN.03', text: 'Nghe câu chuyện, trả lời được câu hỏi: ai, cái gì, khi nào, ở đâu.', stage: 2 },
        { code: 'V1.NN.04', text: 'Kể lại câu chuyện ngắn dựa vào tranh và câu hỏi gợi ý.', stage: 3 },
      ],
    },
  ],

  'tieng-anh': [
    {
      code: 'A1.HELLO',
      title: 'Chào hỏi và làm quen',
      description: 'Cụm từ chào hỏi, giới thiệu tên, mệnh lệnh lớp học đơn giản.',
      outcomes: [
        { code: 'A1.HELLO.01', text: 'Nghe và đáp lại lời chào: Hello, Hi, Goodbye.', stage: 1 },
        { code: 'A1.HELLO.02', text: 'Hiểu và làm theo chỉ dẫn đơn giản trong lớp (Stand up, Sit down…).', stage: 1 },
        { code: 'A1.HELLO.03', text: 'Nói câu giới thiệu tên: I’m …', stage: 2, isCore: false },
      ],
    },
    {
      code: 'A1.ABC',
      title: 'Chữ cái và âm đầu',
      description: 'Khoảng 13 chữ cái đầu tiên và âm đầu của từ.',
      outcomes: [
        { code: 'A1.ABC.01', text: 'Nghe, nhận biết khoảng 13 chữ cái đã học.', stage: 1 },
        { code: 'A1.ABC.02', text: 'Nhận biết âm đầu của từ quen thuộc.', stage: 2 },
      ],
    },
    {
      code: 'A1.NUM',
      title: 'Số đếm 1–10',
      description: 'Nghe, nói số đếm trong phạm vi 10.',
      outcomes: [
        { code: 'A1.NUM.01', text: 'Nghe hiểu các số đếm trong phạm vi 10.', stage: 1 },
        { code: 'A1.NUM.02', text: 'Đếm và nói số lượng đồ vật (1–10).', stage: 2 },
      ],
    },
    {
      code: 'A1.COLOUR',
      title: 'Màu sắc',
      description: 'Từ vựng màu sắc cơ bản.',
      outcomes: [
        { code: 'A1.COLOUR.01', text: 'Nghe, nhận biết và nói tên các màu cơ bản.', stage: 1 },
        { code: 'A1.COLOUR.02', text: 'Trả lời câu hỏi What colour is it? ở mức từ.', stage: 2 },
      ],
    },
    {
      code: 'A1.SCHOOL',
      title: 'Đồ dùng học tập',
      description: 'Đồ vật trong lớp: pen, book, ruler, bag…',
      outcomes: [
        { code: 'A1.SCHOOL.01', text: 'Nghe, nhận biết và nói tên đồ dùng học tập quen thuộc.', stage: 2 },
      ],
    },
    {
      code: 'A1.FAMILY',
      title: 'Gia đình',
      description: 'Thành viên gia đình: mother, father, brother, sister…',
      outcomes: [
        { code: 'A1.FAMILY.01', text: 'Nghe, nhận biết và nói tên thành viên trong gia đình.', stage: 2 },
        { code: 'A1.FAMILY.02', text: 'Giới thiệu thành viên gia đình bằng câu This is my …', stage: 3, isCore: false },
      ],
    },
    {
      code: 'A1.ANIMAL',
      title: 'Con vật',
      description: 'Con vật quen thuộc: cat, dog, fish, bird…',
      outcomes: [
        { code: 'A1.ANIMAL.01', text: 'Nghe, nhận biết và nói tên các con vật quen thuộc.', stage: 3 },
      ],
    },
    {
      code: 'A1.EXTRA',
      title: 'Chủ đề mở rộng',
      description: 'Đồ chơi, quả và đồ ăn, bộ phận cơ thể — chọn theo sách nhà trường dùng.',
      isCore: false,
      outcomes: [
        { code: 'A1.EXTRA.01', text: 'Nhận biết tên đồ chơi quen thuộc.', stage: 3, isCore: false },
        { code: 'A1.EXTRA.02', text: 'Nhận biết tên quả và đồ ăn quen thuộc.', stage: 3, isCore: false },
        { code: 'A1.EXTRA.03', text: 'Nhận biết tên bộ phận cơ thể.', stage: 3, isCore: false },
      ],
    },
  ],
};

// Dạng bài theo môn (gắn cho từng câu hỏi). "type" là giao diện mặc định khi chọn dạng bài này.
export const FORMS: Record<SubjectCode, ExerciseForm[]> = {
  toan: [
    { code: 'TOAN.DEM', name: 'Đếm số lượng', description: 'Đếm đồ vật, chọn số đúng.', type: 'single_choice' },
    { code: 'TOAN.DOCVIET', name: 'Đọc, viết số', description: 'Viết số theo cách đọc và ngược lại.', type: 'fill_blank' },
    { code: 'TOAN.SOSANH', name: 'So sánh số (>, <, =)', description: 'Điền hoặc chọn dấu so sánh.', type: 'single_choice' },
    { code: 'TOAN.SAPXEP', name: 'Sắp xếp thứ tự số', description: 'Xếp từ bé đến lớn hoặc ngược lại.', type: 'ordering' },
    { code: 'TOAN.TINH', name: 'Tính cộng, trừ', description: 'Tính kết quả phép tính.', type: 'fill_blank' },
    { code: 'TOAN.SOTHIEU', name: 'Tìm số còn thiếu', description: 'Điền số vào chỗ trống trong phép tính hoặc dãy số.', type: 'fill_blank' },
    { code: 'TOAN.LOIVAN', name: 'Bài toán có lời văn', description: 'Đọc tình huống, viết phép tính và kết quả.', type: 'fill_blank' },
    { code: 'TOAN.HINH', name: 'Nhận dạng hình', description: 'Hình phẳng, hình khối, vị trí.', type: 'single_choice' },
    { code: 'TOAN.DODAI', name: 'Đo độ dài', description: 'Dài hơn/ngắn hơn, đo bằng cm.', type: 'fill_blank' },
    { code: 'TOAN.GIOLICH', name: 'Xem giờ, xem lịch', description: 'Giờ đúng, ngày trong tuần.', type: 'single_choice' },
    { code: 'TOAN.DUNGSAI', name: 'Đúng hay sai', description: 'Nhận định phép tính, so sánh đúng hay sai.', type: 'true_false' },
  ],
  'tieng-viet': [
    { code: 'TV.AMCHU', name: 'Nhận biết âm, chữ', description: 'Chọn âm/chữ đầu của tiếng, từ.', type: 'single_choice' },
    { code: 'TV.GHEPVAN', name: 'Ghép âm, vần thành tiếng', description: 'Điền âm/vần còn thiếu.', type: 'fill_blank' },
    { code: 'TV.DAUTHANH', name: 'Chọn dấu thanh', description: 'Chọn dấu thanh đúng cho tiếng.', type: 'single_choice' },
    { code: 'TV.CHINHTA', name: 'Chính tả c/k, g/gh, ng/ngh', description: 'Điền chữ đúng quy tắc chính tả.', type: 'fill_blank' },
    { code: 'TV.NOITU', name: 'Nối từ với tranh, nghĩa', description: 'Ghép từ với nghĩa hoặc tranh.', type: 'matching' },
    { code: 'TV.XEPCAU', name: 'Sắp xếp từ thành câu', description: 'Xếp các từ thành câu đúng.', type: 'ordering' },
    { code: 'TV.DOCHIEU', name: 'Đọc hiểu câu, đoạn ngắn', description: 'Trả lời câu hỏi về chi tiết tường minh.', type: 'single_choice' },
    { code: 'TV.DAUCAU', name: 'Điền dấu câu', description: 'Dấu chấm, dấu chấm hỏi.', type: 'single_choice' },
    { code: 'TV.TUNGU', name: 'Tìm từ chỉ sự vật, hoạt động, đặc điểm', description: 'Chọn các từ cùng nhóm.', type: 'multiple_choice' },
  ],
  'tieng-anh': [
    { code: 'TA.TUVUNG', name: 'Nhận biết từ vựng', description: 'Chọn từ đúng với nghĩa hoặc tranh.', type: 'single_choice' },
    { code: 'TA.NOINGHIA', name: 'Nối từ với nghĩa', description: 'Ghép từ tiếng Anh với nghĩa tiếng Việt.', type: 'matching' },
    { code: 'TA.CHUCAI', name: 'Điền chữ cái còn thiếu', description: 'Hoàn thành từ bằng chữ cái.', type: 'fill_blank' },
    { code: 'TA.SODEM', name: 'Đếm và chọn số', description: 'Nghe/đọc số đếm 1–10.', type: 'single_choice' },
    { code: 'TA.NHOMTU', name: 'Chọn các từ cùng nhóm', description: 'Chọn tất cả từ thuộc một chủ đề.', type: 'multiple_choice' },
    { code: 'TA.MAUCAU', name: 'Hoàn thành mẫu câu', description: 'Điền từ vào mẫu câu quen thuộc.', type: 'fill_blank' },
  ],
};

export function findTopic(subject: SubjectCode, code: string | undefined) {
  return TOPICS[subject].find((t) => t.code === code);
}

export function findOutcome(subject: SubjectCode, code: string | undefined) {
  for (const t of TOPICS[subject]) {
    const o = t.outcomes.find((x) => x.code === code);
    if (o) return { topic: t, outcome: o };
  }
  return undefined;
}
