// Bộ bài tập soạn sẵn (đủ 5 khối) — dùng ở máy chủ, trang giáo viên, script. Thêm môn/học kỳ mới: thêm vào file gN.ts của khối.
// Trang học của học sinh (chọn bài, làm bài) KHÔNG nhập file này mà tải từng khối khi cần (src/lib/grade-loader.ts).
import type { ContentLesson } from './types';
import { CONTENT_G1 } from './g1';
import { CONTENT_G2 } from './g2';
import { CONTENT_G3 } from './g3';
import { CONTENT_G4 } from './g4';
import { CONTENT_G5 } from './g5';
import { registerContent } from './store';

// Bài theo sách (Toán, Tiếng Việt: Kết nối tri thức; Tiếng Anh: Global Success) + đề ôn tập theo cấp độ L1–L5
// Học kì 2 (Toán, Tiếng Việt) đặt sau các đề ôn tập học kì 1 để danh sách bài đi đúng trình tự năm học
export const CONTENT: ContentLesson[] = [...CONTENT_G1, ...CONTENT_G2, ...CONTENT_G3, ...CONTENT_G4, ...CONTENT_G5];
// nạp sẵn cả 5 khối vào kho dùng chung (data.ts / sets.ts đọc kho này)
[CONTENT_G1, CONTENT_G2, CONTENT_G3, CONTENT_G4, CONTENT_G5].forEach((list, i) => registerContent(i + 1, list));
export type { ContentLesson, ContentQuestion } from './types';
