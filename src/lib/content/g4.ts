// Bài soạn sẵn của lớp 4 (tách riêng để trang học chỉ tải đúng khối của em).
import type { ContentLesson } from './types';
import { TOAN4_HK1, TOAN4_HK2 } from './toan4';
import { TV4_HK1, TV4_HK2 } from './tv4';
import { TA4_HK1, TA4_HK2 } from './ta4';

export const CONTENT_G4: ContentLesson[] = [...TOAN4_HK1, ...TV4_HK1, ...TA4_HK1, ...TOAN4_HK2, ...TV4_HK2, ...TA4_HK2];
