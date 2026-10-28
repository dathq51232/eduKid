// Bài soạn sẵn của lớp 3 (tách riêng để trang học chỉ tải đúng khối của em).
import type { ContentLesson } from './types';
import { TOAN3_HK1, TOAN3_HK2 } from './toan3';
import { TV3_HK1, TV3_HK2 } from './tv3';
import { TA3_HK1, TA3_HK2 } from './ta3';

export const CONTENT_G3: ContentLesson[] = [...TOAN3_HK1, ...TV3_HK1, ...TA3_HK1, ...TOAN3_HK2, ...TV3_HK2, ...TA3_HK2];
