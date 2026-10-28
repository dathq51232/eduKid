// Bài soạn sẵn của lớp 5 (tách riêng để trang học chỉ tải đúng khối của em).
import type { ContentLesson } from './types';
import { TOAN5_HK1, TOAN5_HK2 } from './toan5';
import { TV5_HK1, TV5_HK2 } from './tv5';
import { TA5_HK1, TA5_HK2 } from './ta5';

export const CONTENT_G5: ContentLesson[] = [...TOAN5_HK1, ...TV5_HK1, ...TA5_HK1, ...TOAN5_HK2, ...TV5_HK2, ...TA5_HK2];
