// Bài soạn sẵn của lớp 1 (tách riêng để trang học chỉ tải đúng khối của em).
import type { ContentLesson } from './types';
import { TOAN1_HK1 } from './toan1-hk1';
import { TOAN1_HK2 } from './toan1-hk2';
import { TV1_HK1 } from './tv1-hk1';
import { TV1_HK2 } from './tv1-hk2';
import { TA1_HK1 } from './ta1-hk1';
import { TA1_HK2 } from './ta1-hk2';
import { BANK_LESSONS } from './ngan-hang-lop1';

export const CONTENT_G1: ContentLesson[] = [...TOAN1_HK1, ...TV1_HK1, ...TA1_HK1, ...BANK_LESSONS, ...TOAN1_HK2, ...TV1_HK2, ...TA1_HK2];
