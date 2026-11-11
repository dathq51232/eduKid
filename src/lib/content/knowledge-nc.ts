// Kiến thức cần nhớ của mục "Chuyên đề nâng cao" (Toán 1–5). Tách khỏi bộ sinh đề (src/lib/practice/advanced) để trang học
// chỉ tải phần chữ này khi mở bài. Mã bài: nc<lớp>-<chuyên đề>.
import type { Knowledge } from './knowledge';

export const advId = (grade: number, slug: string) => `nc${grade}-${slug}`;
/** Tên "bộ sách" của các bài chuyên đề nâng cao; mã bài nc<lớp>-… */
export const ADV_BOOK = 'Chuyên đề nâng cao';
export const isAdvancedId = (lessonId: string) => /^nc[1-5]-/.test(lessonId);

const BY_SLUG: Record<string, { grades: number[]; k: Knowledge }> = {
  'them-bot': { grades: [2, 3], k: { points: ['Bạn nhiều hơn cho bạn ít hơn 1 cái thì phần hơn giảm đi 2 (bạn này bớt 1, bạn kia thêm 1).', 'Muốn hai bạn bằng nhau: lấy phần hơn chia đôi, đó là số phải cho.', 'Nếu chỉ một bạn được thêm (không ai cho đi) thì phải thêm đúng bằng phần hơn.', 'Tìm số lúc đầu: người cho đi thì cộng lại, người được nhận thì trừ đi.'], example: 'An có 14 viên bi, Bình có 8 viên bi. An hơn Bình 14 − 8 = 6 viên, An phải cho Bình 6 : 2 = 3 viên thì hai bạn bằng nhau.' } },
  'quy-luat-day': { grades: [2, 3], k: { points: ['Tìm hiệu của hai số liền nhau: hiệu không đổi thì cộng (hoặc trừ) tiếp đúng số đó.', 'Số thứ n = số đầu + (n − 1) lần khoảng cách.', 'Số các số của dãy cách đều = (số cuối − số đầu) : khoảng cách + 1.', 'Nếu hiệu thay đổi, xem hiệu tăng thế nào; hoặc tách thành hai dãy đan xen.'], example: 'Dãy 3; 5; 7; 9; … cách đều 2. Số thứ 10 là 3 + 9 × 2 = 21.' } },
  'tinh-nhanh': { grades: [2, 3], k: { points: ['Đổi chỗ, ghép các số có tổng tròn chục, tròn trăm rồi mới cộng.', 'Cộng 9 (99) thì cộng 10 (100) rồi bớt 1; trừ 9 (99) thì trừ 10 (100) rồi cộng lại 1.', 'Dãy cách đều: ghép số đầu với số cuối, các cặp có tổng bằng nhau.', 'Hai tích có chung một thừa số: a × b + a × c = a × (b + c).'], example: '27 + 45 + 73 = (27 + 73) + 45 = 100 + 45 = 145.' } },
  'trong-cay': { grades: [4, 5], k: { points: ['Số khoảng = Độ dài : Khoảng cách.', 'Trồng cả hai đầu: số cây = số khoảng + 1; một đầu: số cây = số khoảng; không trồng hai đầu: số cây = số khoảng − 1.', 'Trồng khép kín một vòng: số cây = số khoảng.', 'Cưa thành n đoạn chỉ cần n − 1 lần cưa; từ tầng 1 lên tầng n phải đi n − 1 đoạn cầu thang.'], example: 'Đường dài 20 m, cứ 5 m trồng một cây, hai đầu đều trồng: 20 : 5 = 4 khoảng → 4 + 1 = 5 cây.' } },
  'tinh-tuoi': { grades: [4, 5], k: { points: ['Hiệu số tuổi của hai người không bao giờ thay đổi.', 'Mỗi năm mỗi người thêm 1 tuổi: sau n năm tổng tuổi của hai người tăng n × 2.', 'Đưa về cùng một thời điểm rồi dùng tổng – hiệu, tổng – tỉ hoặc hiệu – tỉ.'], example: 'Mẹ hơn con 24 tuổi, mẹ gấp 4 lần con: hiệu số phần 4 − 1 = 3 → con 24 : 3 = 8 tuổi.' } },
  'gia-thiet-tam': { grades: [4, 5], k: { points: ['Giả sử tất cả đều thuộc một loại, tính tổng theo giả sử.', 'Lấy tổng thật trừ tổng giả sử ra phần chênh lệch.', 'Chia phần chênh lệch cho mức chênh của mỗi con (mỗi xe, mỗi vé) để ra số của loại còn lại.'], example: '10 con gà và chó có 28 chân: giả sử cả 10 con là gà có 20 chân, thiếu 8 chân; mỗi con chó hơn 2 chân → 8 : 2 = 4 con chó.' } },
  'danh-so-trang': { grades: [4, 5], k: { points: ['Từ trang 1 đến 9 có 9 chữ số; từ trang 10 đến 99 có 90 trang × 2 = 180 chữ số; từ trang 100 đến 999 có 900 trang × 3 = 2700 chữ số.', 'Bài toán ngược: trừ dần số chữ số của từng nhóm rồi chia cho số chữ số của mỗi trang ở nhóm tiếp theo.', 'Đếm một chữ số: đếm riêng ở hàng đơn vị, hàng chục, hàng trăm rồi cộng lại.'], example: 'Sách 120 trang: 9 + 180 + 21 × 3 = 252 chữ số.' } },
  'day-phan-so': { grades: [5], k: { points: ['1/(n × (n + 1)) = 1/n − 1/(n + 1).', 'd/(n × (n + d)) = 1/n − 1/(n + d); nếu tử số khác d thì nhân thêm cho đúng.', 'Cộng lại, các phân số ở giữa triệt tiêu, chỉ còn số đầu trừ số cuối.'], example: '1/(1 × 2) + 1/(2 × 3) + 1/(3 × 4) = 1 − 1/4 = 3/4' } },
  'cong-viec-chung': { grades: [5], k: { points: ['Coi cả công việc là W phần, W là số chia hết cho mọi số ngày đã cho.', 'Một ngày mỗi người làm được W : (số ngày của người đó) phần.', 'Có người nghỉ giữa chừng: tính phần đã làm chung, phần còn lại chia cho năng suất của những người làm tiếp.', 'Vòi chảy vào và vòi tháo ra: mỗi giờ bể thêm hiệu hai năng suất.'], example: 'A làm 6 ngày, B làm 12 ngày: coi việc là 12 phần, một ngày A làm 2 phần, B làm 1 phần → cùng làm 12 : 3 = 4 ngày.' } },
};

// Toán lớp 1 (chỉ cộng, trừ trong phạm vi 100, không nhớ)
const GRADE1: Record<string, Knowledge> = {
  'xep-hang': { points: ['Đếm từ trái và đếm từ phải đều tính cả bạn đó: số bạn của hàng = thứ tự từ trái + thứ tự từ phải − 1.', 'Trước có mấy bạn, sau có mấy bạn: cộng lại rồi thêm chính bạn đó (thêm 1).', 'Bên phải bạn có số bạn = số bạn cả hàng − thứ tự của bạn tính từ trái.'], example: 'An đứng thứ 3 từ trái, thứ 4 từ phải: hàng có 3 + 4 − 1 = 6 bạn.' },
  'o-trong': { points: ['… + a = b: lấy b − a.', 'a − … = b: lấy a − b.', '… − a = b: lấy b + a.', 'Hai vế bằng nhau: tính vế đã biết trước rồi mới tìm số còn thiếu.'], example: '… + 3 = 8 → 8 − 3 = 5.' },
  'quy-luat-day': { points: ['Xem số sau hơn (hay kém) số trước bao nhiêu: đếm thêm (hay đếm bớt) đúng bấy nhiêu.', 'Dãy đếm thêm 10: chỉ chữ số hàng chục thay đổi.', 'Nếu khoảng cách thay đổi: xem nó tăng dần thế nào, hoặc tách thành hai dãy xen kẽ.'], example: 'Dãy 2; 4; 6; 8; … đếm thêm 2 → số tiếp theo là 10.' },
  'hon-kem': { points: ['Hơn mấy thì cộng thêm, kém mấy thì bớt đi.', 'Mỗi năm ai cũng thêm 1 tuổi nên anh chị luôn hơn em bấy nhiêu tuổi.', 'Bài nhiều bước: tìm số của từng bạn lần lượt rồi mới trả lời.'], example: 'An 6 tuổi, chị hơn An 3 tuổi → chị 6 + 3 = 9 tuổi. 2 năm nữa chị vẫn hơn An 3 tuổi.' },
};

export const ADV_KNOWLEDGE: Record<string, Knowledge> = {
  ...Object.fromEntries(Object.entries(BY_SLUG).flatMap(([slug, v]) => v.grades.map((g) => [advId(g, slug), v.k]))),
  ...Object.fromEntries(Object.entries(GRADE1).map(([slug, k]) => [advId(1, slug), k])),
};
