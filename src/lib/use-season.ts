// Hook đọc mùa lễ đang bật trên trình duyệt (tách khỏi seasons.ts để máy chủ / layout dùng được danh sách mùa).
import { useSyncExternalStore } from 'react';
import { seasonOf, type Season } from '@/lib/seasons';

// Trạng thái gắn sẵn lên <html> bởi script trong layout, trước khi trang hiện
const FX_KEY = 'educhain-season-fx';
const EVT = 'educhain-season';

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
const readSeason = () => document.documentElement.dataset.season ?? null;
const readFx = () => document.documentElement.dataset.seasonFx !== 'off';

/** Mùa đang bật (null = không có) */
export function useSeason(): Season | null {
  const id = useSyncExternalStore(subscribe, readSeason, () => null);
  return seasonOf(id);
}

/** Hiệu ứng (hạt rơi, đồ vật trôi) đang bật? */
export function useSeasonFx(): boolean {
  return useSyncExternalStore(subscribe, readFx, () => true);
}

export function setSeasonFx(on: boolean) {
  const el = document.documentElement;
  if (on) delete el.dataset.seasonFx;
  else el.dataset.seasonFx = 'off';
  try { localStorage.setItem(FX_KEY, on ? 'on' : 'off'); } catch { /* trình duyệt chặn lưu */ }
  window.dispatchEvent(new Event(EVT));
}
