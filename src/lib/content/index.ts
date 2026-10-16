// Bộ bài tập soạn sẵn. Thêm môn/học kỳ mới: tạo file mới rồi thêm vào CONTENT.
import type { ContentLesson } from './types';
import { TOAN1_HK1 } from './toan1-hk1';
import { TOAN1_HK2 } from './toan1-hk2';
import { TV1_HK1 } from './tv1-hk1';
import { TV1_HK2 } from './tv1-hk2';
import { TA1_HK1 } from './ta1-hk1';
import { TA1_HK2 } from './ta1-hk2';
import { BANK_LESSONS } from './ngan-hang-lop1';
import { TOAN2_HK1, TOAN2_HK2 } from './toan2';
import { TV2_HK1, TV2_HK2 } from './tv2';
import { TA2_HK1, TA2_HK2 } from './ta2';
import { TOAN3_HK1, TOAN3_HK2 } from './toan3';
import { TV3_HK1, TV3_HK2 } from './tv3';
import { TA3_HK1, TA3_HK2 } from './ta3';
import { TOAN4_HK1, TOAN4_HK2 } from './toan4';
import { TV4_HK1, TV4_HK2 } from './tv4';
import { TA4_HK1, TA4_HK2 } from './ta4';
import { TOAN5_HK1, TOAN5_HK2 } from './toan5';
import { TV5_HK1, TV5_HK2 } from './tv5';
import { TA5_HK1, TA5_HK2 } from './ta5';

// Bài theo sách (Toán, Tiếng Việt: Kết nối tri thức; Tiếng Anh: Global Success) + đề ôn tập theo cấp độ L1–L5
// Học kì 2 (Toán, Tiếng Việt) đặt sau các đề ôn tập học kì 1 để danh sách bài đi đúng trình tự năm học
export const CONTENT: ContentLesson[] = [
  ...TOAN1_HK1, ...TV1_HK1, ...TA1_HK1, ...BANK_LESSONS, ...TOAN1_HK2, ...TV1_HK2, ...TA1_HK2,
  // Lớp 2
  ...TOAN2_HK1, ...TV2_HK1, ...TA2_HK1, ...TOAN2_HK2, ...TV2_HK2, ...TA2_HK2,
  // Lớp 3
  ...TOAN3_HK1, ...TV3_HK1, ...TA3_HK1, ...TOAN3_HK2, ...TV3_HK2, ...TA3_HK2,
  // Lớp 4
  ...TOAN4_HK1, ...TV4_HK1, ...TA4_HK1, ...TOAN4_HK2, ...TV4_HK2, ...TA4_HK2,
  // Lớp 5
  ...TOAN5_HK1, ...TV5_HK1, ...TA5_HK1, ...TOAN5_HK2, ...TV5_HK2, ...TA5_HK2,
];
export type { ContentLesson, ContentQuestion } from './types';
