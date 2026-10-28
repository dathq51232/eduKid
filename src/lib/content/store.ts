// Kho bài soạn sẵn đang có trên máy: trang học của học sinh nạp TỪNG KHỐI khi cần (src/lib/grade-loader.ts) để đỡ phải
// tải cả 5 khối (hơn 1 MB mã) mỗi lần mở trang; máy chủ / trang giáo viên nạp đủ 5 khối qua src/lib/content/index.ts.
import type { ContentLesson } from './types';

/** Các bài đã nạp, giữ đúng thứ tự trong từng khối */
export const CONTENT_LIVE: ContentLesson[] = [];
const loaded = new Set<number>();
let version = 0;

export function registerContent(grade: number, list: ContentLesson[]) {
  if (loaded.has(grade)) return;
  loaded.add(grade);
  CONTENT_LIVE.push(...list);
  version++;
}
export const contentVersion = () => version;
export const isContentLoaded = (grade: number) => loaded.has(grade);
