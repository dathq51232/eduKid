// Bài soạn sẵn của lớp 2 (tách riêng để trang học chỉ tải đúng khối của em).
import type { ContentLesson } from './types';
import { TOAN2_HK1, TOAN2_HK2 } from './toan2';
import { TV2_HK1, TV2_HK2 } from './tv2';
import { TA2_HK1, TA2_HK2 } from './ta2';

export const CONTENT_G2: ContentLesson[] = [...TOAN2_HK1, ...TV2_HK1, ...TA2_HK1, ...TOAN2_HK2, ...TV2_HK2, ...TA2_HK2];
