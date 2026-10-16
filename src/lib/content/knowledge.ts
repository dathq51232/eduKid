// "KIẾN THỨC CẦN NHỚ" cho từng bài Toán 1 (Kết nối tri thức), hiện ở màn hình bắt đầu làm bài.
// Nội dung do EduChain Kids tự viết lại, ngắn gọn cho học sinh lớp 1, theo mục tiêu "Kiến thức" của từng bài
// trong sách giáo viên Toán 1 — không chép nguyên văn sách.

export type Knowledge = {
  /** Các ý chính, mỗi ý một câu ngắn */
  points: string[];
  /** Một ví dụ mẫu (nhiều dòng = phép tính đặt cột) */
  example?: string;
  /** Lời giải thích cho ví dụ */
  note?: string;
};

export const TOAN1_KNOWLEDGE: Record<string, Knowledge> = {
  // ---------------- HỌC KÌ 1 ----------------
  'toan1-kntt-b01': {
    points: ['Đếm lần lượt từng đồ vật: 1, 2, 3, 4, 5. Số cuối cùng em đếm là số lượng.', 'Không có đồ vật nào thì viết số 0.', 'Thứ tự đếm: 0, 1, 2, 3, 4, 5.'],
    example: '🍎🍎🍎 → đếm 1, 2, 3 → có 3 quả táo.',
  },
  'toan1-kntt-b02': {
    points: ['Thứ tự các số: 6, 7, 8, 9, 10.', 'Số 10 có hai chữ số: chữ số 1 và chữ số 0.', 'Mỗi đồ vật chỉ đếm một lần, không bỏ sót.'],
    example: '⭐⭐⭐⭐⭐⭐⭐ → có 7 ngôi sao.',
  },
  'toan1-kntt-b03': {
    points: ['Nối mỗi đồ vật nhóm này với một đồ vật nhóm kia.', 'Nhóm còn thừa đồ vật là nhóm nhiều hơn; nhóm kia ít hơn.', 'Nối vừa hết cả hai nhóm thì hai nhóm bằng nhau.'],
  },
  'toan1-kntt-b04': {
    points: ['Dấu > đọc là "lớn hơn", dấu < đọc là "bé hơn", dấu = đọc là "bằng".', 'Đầu nhọn của dấu > và < luôn chỉ vào số bé hơn.', 'Số nào đếm sau thì lớn hơn.'],
    example: '7 > 5   ·   3 < 8   ·   6 = 6',
  },
  'toan1-kntt-b05': {
    points: ['Một số có thể tách thành hai số nhỏ hơn: 5 gồm 2 và 3.', 'Gộp hai số lại được số lớn: 2 và 3 được 5.', 'Có nhiều cách tách: 5 gồm 1 và 4, 2 và 3, …'],
    example: '6 gồm 4 và 2 · 6 gồm 5 và 1 · 6 gồm 3 và 3',
  },
  'toan1-kntt-b06': { points: ['Đếm, đọc, viết số đến 10.', 'So sánh số bằng dấu >, <, =.', 'Tách – gộp số trong phạm vi 10.'] },
  'toan1-kntt-b07': {
    points: ['Hình vuông: 4 cạnh bằng nhau.', 'Hình chữ nhật: 4 cạnh, hai cạnh dài và hai cạnh ngắn.', 'Hình tam giác: 3 cạnh. Hình tròn: không có cạnh thẳng.'],
    example: 'Mặt đồng hồ tròn ⚪ · viên gạch hình chữ nhật · biển báo hình tam giác',
  },
  'toan1-kntt-b08': {
    points: ['Ghép các hình nhỏ thành hình lớn: hai hình tam giác có thể ghép thành hình vuông.', 'Xếp que tính: hình vuông cần 4 que, hình tam giác cần 3 que.', 'Hai hình chung một cạnh thì cạnh đó chỉ cần một que.'],
  },
  'toan1-kntt-b09': { points: ['Nhận dạng hình vuông, hình tròn, hình tam giác, hình chữ nhật.', 'Đếm hình: đếm từng loại, mỗi hình chỉ đếm một lần.', 'Tìm quy luật của dãy hình rồi chọn hình tiếp theo.'] },
  'toan1-kntt-b10': {
    points: ['Phép cộng là "gộp lại" hoặc "thêm vào". Dấu cộng: +', 'Số nào cộng với 0 cũng bằng chính số đó.', 'Đổi chỗ hai số trong phép cộng, kết quả không đổi.'],
    example: '3 + 2 = 5   ·   2 + 3 = 5   ·   4 + 0 = 4',
  },
  'toan1-kntt-b11': {
    points: ['Phép trừ là "bớt đi", "lấy đi", "còn lại". Dấu trừ: −', 'Số nào trừ đi 0 cũng bằng chính số đó.', 'Số nào trừ đi chính nó thì bằng 0.'],
    example: '7 − 3 = 4   ·   5 − 0 = 5   ·   6 − 6 = 0',
  },
  'toan1-kntt-b12': {
    points: ['Thuộc bảng cộng, bảng trừ trong phạm vi 10 để tính nhẩm nhanh.', 'Cộng và trừ có liên quan: 6 + 4 = 10 thì 10 − 4 = 6 và 10 − 6 = 4.'],
    example: '3 + 5 = 8 → 8 − 5 = 3 → 8 − 3 = 5',
  },
  'toan1-kntt-b13': { points: ['Tính nhẩm cộng, trừ trong phạm vi 10.', 'Có hai dấu phép tính: tính lần lượt từ trái sang phải.', 'Đọc kĩ tình huống: "thêm, tất cả" → cộng; "bớt, còn lại" → trừ.'], example: '4 + 3 − 2: 4 + 3 = 7, 7 − 2 = 5' },
  'toan1-kntt-b14': {
    points: ['Khối lập phương: các mặt đều là hình vuông (như con xúc xắc).', 'Khối hộp chữ nhật: có các mặt hình chữ nhật (như hộp sữa, viên gạch).'],
  },
  'toan1-kntt-b15': {
    points: ['Vị trí: trên – dưới, trước – sau, phải – trái, ở giữa.', 'Bên phải là phía tay em cầm bút (tay phải), bên trái là phía còn lại.', 'Khi xếp hàng đi tới, bạn đứng trước là bạn đi đầu hơn.'],
  },
  'toan1-kntt-b16': { points: ['Nhận dạng khối lập phương, khối hộp chữ nhật.', 'Xác định vị trí: trên – dưới, phải – trái, trước – sau, ở giữa.'] },
  'toan1-kntt-b17': { points: ['Ôn đếm, đọc, viết số đến 10.', 'So sánh, xếp thứ tự các số.', 'Tách, gộp số trong phạm vi 10.'] },
  'toan1-kntt-b18': { points: ['Ôn bảng cộng, bảng trừ trong phạm vi 10.', 'Viết phép tính phù hợp với tình huống trong tranh hoặc lời văn.'] },
  'toan1-kntt-b19': { points: ['Ôn các hình phẳng: vuông, tròn, tam giác, chữ nhật.', 'Ôn các khối: lập phương, hộp chữ nhật.', 'Ôn vị trí, định hướng trong không gian.'] },
  'toan1-kntt-b20': { points: ['Ôn tổng hợp: số đến 10, cộng – trừ trong phạm vi 10, hình học, vị trí.', 'Đọc kĩ đề, làm từng bước, kiểm tra lại kết quả.'] },

  // ---------------- HỌC KÌ 2 ----------------
  'toan1-kntt-b21': {
    points: [
      'Số có hai chữ số gồm chục và đơn vị: 10 đơn vị = 1 chục.',
      'Chữ số bên trái chỉ số chục, chữ số bên phải chỉ số đơn vị.',
      'Số tròn chục có 0 đơn vị: 10, 20, 30, …, 90.',
      'Cách đọc: 21 "hai mươi mốt", 24 "hai mươi tư", 25 "hai mươi lăm", 15 "mười lăm".',
    ],
    example: '🎋🎋🎋 ❘❘❘❘ → 3 chục và 4 đơn vị → viết 34, đọc "ba mươi tư".',
  },
  'toan1-kntt-b22': {
    points: [
      'So sánh số chục trước: số nào nhiều chục hơn thì lớn hơn.',
      'Nếu số chục bằng nhau thì so sánh số đơn vị.',
      'Dùng cách so sánh đó để tìm số lớn nhất, bé nhất và xếp thứ tự các số.',
    ],
    example: '42 > 25 (4 chục > 2 chục)   ·   16 < 19 (cùng 1 chục, 6 < 9)',
  },
  'toan1-kntt-b23': {
    points: ['99 thêm 1 là 100. Số 100 đọc là "một trăm", 100 gồm 10 chục.', 'Bảng các số từ 1 đến 100: mỗi hàng có 10 số.', 'Trong bảng: sang phải thêm 1, xuống một hàng thêm 1 chục (10).'],
    example: 'Số 99 là số lớn nhất có hai chữ số; 10 là số bé nhất có hai chữ số.',
  },
  'toan1-kntt-b24': { points: ['Đọc, viết, phân tích số có hai chữ số (chục, đơn vị).', 'So sánh, xếp thứ tự các số đến 100.', 'Tìm quy luật của dãy số: đếm thêm 1, thêm 2, thêm 5, thêm 10.'], example: '5, 10, 15, 20, … (mỗi lần thêm 5)' },
  'toan1-kntt-b25': {
    points: ['Muốn so sánh độ dài, đặt các vật thẳng một đầu rồi nhìn đầu kia.', 'Nếu A dài hơn B thì B ngắn hơn A.', 'Tương tự với chiều cao: cao hơn – thấp hơn, cao nhất – thấp nhất.'],
  },
  'toan1-kntt-b26': {
    points: ['Có thể đo độ dài bằng gang tay, sải tay, bước chân.', 'Xăng-ti-mét là đơn vị đo độ dài, viết tắt là cm.', 'Khi đo bằng thước: đặt một đầu vật thẳng vạch 0, đầu kia chỉ vạch nào thì vật dài bấy nhiêu xăng-ti-mét.'],
    example: 'Đầu bút chì ở vạch 0, đầu kia ở vạch 9 → bút chì dài 9 cm.',
  },
  'toan1-kntt-b27': {
    points: ['Ước lượng là đoán gần đúng độ dài trước khi đo.', 'Một gang tay của em dài khoảng 10 cm.', 'Vật nhỏ đo bằng gang tay hoặc cm; vật dài (bảng, phòng học) đo bằng sải tay, bước chân.'],
  },
  'toan1-kntt-b28': { points: ['So sánh dài hơn – ngắn hơn, cao hơn – thấp hơn.', 'Đo độ dài bằng thước có vạch chia xăng-ti-mét.', 'Ước lượng độ dài đồ vật quen thuộc.'] },
  'toan1-kntt-b29': {
    points: ['Đặt tính thẳng cột: đơn vị thẳng đơn vị, chục thẳng chục.', 'Cộng từ phải sang trái: cộng đơn vị trước, rồi hạ chữ số hàng chục.'],
    example: '  41\n+  5\n  46',
    note: '1 cộng 5 bằng 6, viết 6; hạ 4, viết 4.',
  },
  'toan1-kntt-b30': {
    points: ['Cộng đơn vị với đơn vị, chục với chục.', 'Cộng nhẩm số tròn chục: 3 chục + 2 chục = 5 chục, nên 30 + 20 = 50.'],
    example: '  32\n+ 15\n  47',
    note: '2 cộng 5 bằng 7, viết 7; 3 cộng 1 bằng 4, viết 4.',
  },
  'toan1-kntt-b31': {
    points: ['Đặt tính thẳng cột như phép cộng.', 'Trừ từ phải sang trái: trừ đơn vị trước, rồi hạ chữ số hàng chục.'],
    example: '  76\n−  5\n  71',
    note: '6 trừ 5 bằng 1, viết 1; hạ 7, viết 7.',
  },
  'toan1-kntt-b32': {
    points: ['Trừ đơn vị cho đơn vị, chục cho chục.', 'Trừ nhẩm số tròn chục: 6 chục − 2 chục = 4 chục, nên 60 − 20 = 40.'],
    example: '  76\n− 32\n  44',
    note: '6 trừ 2 bằng 4, viết 4; 7 trừ 3 bằng 4, viết 4.',
  },
  'toan1-kntt-b33': {
    points: ['Đặt tính đúng cột, tính từ hàng đơn vị.', 'Bài toán có lời văn: "thêm, tất cả, cả hai" → cộng; "bớt, lấy đi, còn lại" → trừ.', 'Có hai dấu phép tính: tính lần lượt từ trái sang phải.'],
    example: 'Có 75 cây, trong đó 25 cây nhãn → số cây vải: 75 − 25 = 50.',
  },
  'toan1-kntt-b34': {
    points: ['Đồng hồ có kim ngắn chỉ giờ, kim dài chỉ phút.', 'Giờ đúng: kim dài chỉ số 12, kim ngắn chỉ số nào thì là mấy giờ.', 'Một ngày có các buổi: sáng, trưa, chiều, tối.'],
    example: 'Kim ngắn chỉ 6, kim dài chỉ 12 → 6 giờ (sáng em thức dậy).',
  },
  'toan1-kntt-b35': {
    points: ['Một tuần lễ có 7 ngày: thứ Hai, thứ Ba, thứ Tư, thứ Năm, thứ Sáu, thứ Bảy, Chủ nhật.', 'Hôm qua là ngày ngay trước hôm nay; ngày mai là ngày ngay sau hôm nay.'],
    example: 'Hôm nay thứ Tư → hôm qua thứ Ba, ngày mai thứ Năm.',
  },
  'toan1-kntt-b36': {
    points: ['Tờ lịch cho biết tháng, ngày và thứ.', 'Ngày mai: thứ tiếp theo và số ngày thêm 1. Hôm qua: thứ ngay trước và số ngày bớt 1.'],
    example: 'Tờ lịch "Tháng 5 · 7 · Thứ Hai" → ngày mai là thứ Ba, ngày 8.',
  },
  'toan1-kntt-b37': { points: ['Đọc giờ đúng trên đồng hồ.', 'Thứ tự các ngày trong tuần; hôm qua, hôm nay, ngày mai.', 'Đọc tờ lịch: thứ, ngày, tháng.'] },
  'toan1-kntt-b38': { points: ['Ôn các số từ 0 đến 10: đếm, so sánh, xếp thứ tự.', 'Ôn bảng cộng, bảng trừ trong phạm vi 10.', 'Tính có hai dấu phép tính theo thứ tự từ trái sang phải.'] },
  'toan1-kntt-b39': { points: ['Ôn số có hai chữ số: chục, đơn vị, đọc, viết, so sánh.', 'Ôn cộng, trừ (không nhớ) trong phạm vi 100: đặt tính, tính nhẩm số tròn chục.', 'Giải bài toán có lời văn bằng một phép tính.'] },
  'toan1-kntt-b40': { points: ['Ôn hình phẳng, khối lập phương, khối hộp chữ nhật.', 'Ôn đo độ dài (cm, gang tay, sải tay, bước chân).', 'Ôn xem giờ đúng, ngày trong tuần, tờ lịch.'] },
  'toan1-kntt-b41': { points: ['Ôn tập tổng hợp cả năm: số đến 100, cộng – trừ không nhớ, hình học, đo lường, thời gian.', 'Đọc kĩ đề, làm từng bước và thử lại kết quả.'] },
};

/** Kiến thức của bài (bài luyện tập "lt-…" dùng kiến thức của bài sách tương ứng) */
import { TOAN2_KNOWLEDGE } from './knowledge2';
import { TOAN3_KNOWLEDGE } from './knowledge3';
import { TOAN4_KNOWLEDGE } from './knowledge4';
import { TOAN5_KNOWLEDGE } from './knowledge5';

/** Kiến thức cần nhớ của mọi lớp (thêm lớp mới: gộp thêm map của lớp đó) */
export const KNOWLEDGE: Record<string, Knowledge> = { ...TOAN1_KNOWLEDGE, ...TOAN2_KNOWLEDGE, ...TOAN3_KNOWLEDGE, ...TOAN4_KNOWLEDGE, ...TOAN5_KNOWLEDGE };

export function knowledgeFor(lessonId: string): Knowledge | undefined {
  return KNOWLEDGE[lessonId.replace(/^lt-/, '')];
}
