// Nạp bài soạn sẵn + bộ sinh câu của MỘT khối cho trang học của học sinh (chọn bài, làm bài).
// Mỗi khối là một gói mã riêng: em lớp 2 chỉ tải phần lớp 2 thay vì cả 5 khối (trước đây hơn 1,2 MB mã mỗi lần mở trang).
import { isContentLoaded, registerContent } from './content/store';
import { registerEntries } from './practice/core';

const pending = new Map<number, Promise<void>>();

async function load(g: number) {
  switch (g) {
    case 1: { const [c, p] = await Promise.all([import('./content/g1'), import('./practice/g1')]); registerContent(1, c.CONTENT_G1); registerEntries(1, p.ENTRIES_G1); break; }
    case 2: { const [c, p] = await Promise.all([import('./content/g2'), import('./practice/g2')]); registerContent(2, c.CONTENT_G2); registerEntries(2, p.ENTRIES_G2); break; }
    case 3: { const [c, p] = await Promise.all([import('./content/g3'), import('./practice/g3')]); registerContent(3, c.CONTENT_G3); registerEntries(3, p.ENTRIES_G3); break; }
    case 4: { const [c, p] = await Promise.all([import('./content/g4'), import('./practice/g4')]); registerContent(4, c.CONTENT_G4); registerEntries(4, p.ENTRIES_G4); break; }
    case 5: { const [c, p] = await Promise.all([import('./content/g5'), import('./practice/g5')]); registerContent(5, c.CONTENT_G5); registerEntries(5, p.ENTRIES_G5); break; }
  }
}

/** Đảm bảo đã nạp khối g (gọi nhiều lần không sao) */
export function loadGrade(g: number): Promise<void> {
  if (g < 1 || g > 5 || isContentLoaded(g)) return Promise.resolve();
  let p = pending.get(g);
  if (!p) { p = load(g); p.catch(() => pending.delete(g)); pending.set(g, p); }
  return p;
}
export const gradeLoaded = (g: number) => isContentLoaded(g);
