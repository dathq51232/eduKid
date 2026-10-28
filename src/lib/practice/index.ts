// Luyện tập ngẫu nhiên: mỗi bài theo sách có một bài "Luyện tập thêm" sinh đề mới theo seed.
//   - Mã bài:   lt-<mã bài sách>               ví dụ lt-toan1-kntt-b07
//   - Mã câu:   lt-<mã bài sách>~<seed>~<thứ tự>  — chấm lại bằng cách sinh lại đúng đề đó từ seed
// Mỗi đề 10 câu: 2 câu mỗi cấp độ L1 → L5, không trùng nhau trong đề.
//
// Lưu ý bảo mật: đề luyện tập sinh và chấm trên trình duyệt (đáp án nằm trong mã nguồn), chỉ dùng để tự luyện.
// Khi cần chấm "thật" (thi, chứng nhận), chạy cùng bộ sinh này ở server (route handler) và chỉ gửi đề, không gửi đáp án.
// Đủ 5 khối (máy chủ, trang giáo viên, script). Trang học của học sinh nhập './core' và nạp từng khối khi cần.
import { registerEntries } from './core';
import { ENTRIES_G1 } from './g1';
import { ENTRIES_G2 } from './g2';
import { ENTRIES_G3 } from './g3';
import { ENTRIES_G4 } from './g4';
import { ENTRIES_G5 } from './g5';

[ENTRIES_G1, ENTRIES_G2, ENTRIES_G3, ENTRIES_G4, ENTRIES_G5].forEach((list, i) => registerEntries(i + 1, list));
export * from './core';
