'use client';
// Cài đặt âm thanh của Câu lạc bộ cờ (lưu trên trình duyệt, dùng chung cờ vua + cờ tướng):
//  - 'off'   : tắt hết (tiếng quân, chiếu, đồng hồ)
//  - 'low'   : tiếng quân + đồng hồ chỉ báo khi sắp hết giờ (30 giây, 10 giây, tích tắc 10 giây cuối)
//  - 'every' : như trên + tích tắc nhẹ mỗi giây khi đồng hồ của em đang chạy
import { useSyncExternalStore } from 'react';
import { playSound, type SoundName } from '@/lib/sound';

export type ChessSound = 'off' | 'low' | 'every';
export const CHESS_SOUND_MODES: { id: ChessSound; label: string; hint: string }[] = [
  { id: 'low', label: 'Báo sắp hết giờ', hint: 'Tiếng quân cờ, chuông khi còn 30 và 10 giây' },
  { id: 'every', label: 'Tích tắc', hint: 'Thêm tiếng tích tắc mỗi giây khi tới lượt em' },
  { id: 'off', label: 'Tắt tiếng', hint: 'Không phát âm thanh nào' },
];
const KEY = 'co-am-thanh';
const subs = new Set<() => void>();
let cur: ChessSound | null = null;

function read(): ChessSound {
  if (cur) return cur;
  try { const v = localStorage.getItem(KEY); cur = v === 'off' || v === 'every' || v === 'low' ? v : 'low'; } catch { cur = 'low'; }
  return cur;
}
export function setChessSound(m: ChessSound) {
  cur = m;
  try { localStorage.setItem(KEY, m); } catch { /* chế độ riêng tư: chỉ dùng cho lần này */ }
  subs.forEach((f) => f());
}
export function useChessSound(): ChessSound {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, read, () => 'low');
}
/** Phát âm thanh nếu chưa tắt tiếng */
export function sfx(name: SoundName) { if (read() !== 'off') playSound(name); }

/** Âm thanh đồng hồ khi số giây còn lại vừa chuyển sang `sec` */
export function clockSoundFor(sec: number, mode: ChessSound): SoundName | null {
  if (mode === 'off' || sec < 1) return null;
  if (sec <= 5) return 'tickUrgent';
  if (sec === 10 || sec === 30) return 'warn';
  if (sec < 10) return 'tick';
  return mode === 'every' ? 'tickSoft' : null;
}

/** Báo tới lượt em sau khi đối thủ đi: tiếng "ting", rung nhẹ (điện thoại), đổi tiêu đề tab nếu em đang ở tab khác */
export function notifyTurn() {
  if (typeof window === 'undefined') return;
  setTimeout(() => sfx('turn'), 280);
  try { if (read() !== 'off') navigator.vibrate?.([70, 50, 70]); } catch { /* máy không hỗ trợ rung */ }
  if (document.hidden) {
    const old = document.title;
    document.title = '🔔 Đến lượt em!';
    const back = () => { if (!document.hidden) { document.title = old; document.removeEventListener('visibilitychange', back); } };
    document.addEventListener('visibilitychange', back);
  }
}
