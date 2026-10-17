// Hằng số và hàm nhỏ dùng chung, KHÔNG kéo theo ngân hàng câu hỏi (giúp trang Kết quả… tải nhẹ).
// data.ts và sets.ts xuất lại các tên này nên mã cũ vẫn dùng như trước.
import type { Level } from './content/types';
import type { SubjectCode } from './types';

export function isSubjectCode(value: string | null): value is SubjectCode {
  return value === 'toan' || value === 'tieng-viet' || value === 'tieng-anh';
}

export function parseGrade(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1;
}

export type Muc = 1 | 2 | 3;
export const MUC_LIST: Muc[] = [1, 2, 3];
export const MUC: Record<Muc, { name: string; describe: string; minLevel: Level; quota: Partial<Record<Level, number>> }> = {
  1: { name: 'Cơ bản', describe: 'Đủ các mức, từ dễ đến khó (L1 → L5)', minLevel: 1, quota: { 1: 3, 2: 3, 3: 2, 4: 1, 5: 1 } },
  2: { name: 'Khá', describe: 'Bỏ câu dễ nhất, từ L2 trở lên', minLevel: 2, quota: { 2: 3, 3: 3, 4: 2, 5: 2 } },
  3: { name: 'Giỏi', describe: 'Chỉ câu vận dụng và thử thách (L3 → L5)', minLevel: 3, quota: { 3: 3, 4: 3, 5: 4 } },
};
export const parseMuc = (v: string | null | undefined): Muc => (v === '2' ? 2 : v === '3' ? 3 : 1);
