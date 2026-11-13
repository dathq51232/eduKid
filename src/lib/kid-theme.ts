// "Thế giới của em": học sinh tự chọn chủ đề nền cho trang Của em, Chọn bài và Làm bài.
// Lưu trên trình duyệt (giống sticker); đổi ở một tab thì các tab khác cập nhật theo.
import { useSyncExternalStore } from 'react';
import type { MiloVariant } from '@/components/mascot/MiloMascot';

export type KidThemeId = 'meadow' | 'space' | 'jungle' | 'ocean' | 'candy';

const f3d = (n: string) => `/emoji/f3d/${n}.webp`;
const stk = (n: string) => `/stickers/${n}.webp`;

/** Đồ vật trôi nhẹ ở hai bên màn hình: x, y theo % màn hình, s = cỡ (px), d = thời gian một nhịp (giây) */
export type Floater = { src: string; x: number; y: number; s: number; d: number; keep?: boolean };

export type KidTheme = {
  id: KidThemeId;
  name: string;
  tag: string;
  /** Màu nhận diện (viền thẻ đang chọn, đường đi trên bản đồ) */
  color: string;
  hero: string;
  side: string;
  /** Trang phục Milo hợp chủ đề (không có thì Milo mặc theo môn học) */
  milo?: MiloVariant;
  floaters: Floater[];
};

export const KID_THEMES: KidTheme[] = [
  {
    id: 'meadow', name: 'Đồng cỏ lâu đài', tag: 'Nắng xanh, mây trắng', color: '#2f9e44',
    hero: stk('rainbow'), side: stk('sun'), floaters: [],
  },
  {
    id: 'space', name: 'Vũ trụ', tag: 'Bay cùng tên lửa', color: '#6d4fe0', milo: 'astronaut',
    hero: stk('rocket'), side: stk('planet'),
    floaters: [
      { src: stk('rocket'), x: 4, y: 22, s: 120, d: 7, keep: true },
      { src: f3d('star'), x: 90, y: 16, s: 64, d: 5 },
      { src: stk('planet'), x: 88, y: 58, s: 110, d: 9 },
      { src: f3d('star'), x: 7, y: 70, s: 48, d: 6 },
      { src: f3d('crescent-moon'), x: 93, y: 84, s: 60, d: 8 },
    ],
  },
  {
    id: 'jungle', name: 'Rừng xanh', tag: 'Khám phá cùng muông thú', color: '#1f9d55',
    hero: f3d('monkey'), side: f3d('parrot'),
    floaters: [
      { src: f3d('parrot'), x: 5, y: 18, s: 96, d: 6, keep: true },
      { src: f3d('butterfly'), x: 90, y: 22, s: 64, d: 5 },
      { src: f3d('monkey'), x: 89, y: 54, s: 104, d: 8 },
      { src: f3d('lady-beetle'), x: 6, y: 62, s: 48, d: 7 },
      { src: f3d('frog'), x: 8, y: 84, s: 72, d: 6 },
    ],
  },
  {
    id: 'ocean', name: 'Đại dương', tag: 'Lặn xuống biển sâu', color: '#0b84d8',
    hero: f3d('tropical-fish'), side: f3d('spiral-shell'),
    floaters: [
      { src: f3d('tropical-fish'), x: 5, y: 20, s: 92, d: 6, keep: true },
      { src: f3d('dolphin'), x: 88, y: 18, s: 110, d: 8 },
      { src: f3d('turtle'), x: 90, y: 56, s: 90, d: 9 },
      { src: f3d('fish'), x: 7, y: 54, s: 64, d: 7 },
      { src: f3d('crab'), x: 9, y: 86, s: 64, d: 5 },
    ],
  },
  {
    id: 'candy', name: 'Vương quốc kẹo', tag: 'Ngọt ngào sắc màu', color: '#e0457f', milo: 'artist',
    hero: f3d('cupcake'), side: f3d('soft-ice-cream'),
    floaters: [
      { src: f3d('balloon'), x: 5, y: 16, s: 92, d: 6, keep: true },
      { src: f3d('soft-ice-cream'), x: 90, y: 20, s: 80, d: 7 },
      { src: f3d('cupcake'), x: 89, y: 58, s: 92, d: 8 },
      { src: f3d('pink-heart'), x: 7, y: 58, s: 54, d: 5 },
      { src: f3d('wrapped-gift'), x: 9, y: 84, s: 70, d: 6 },
    ],
  },
];

export const kidTheme = (id: KidThemeId): KidTheme => KID_THEMES.find((t) => t.id === id) ?? KID_THEMES[0];
const isKidTheme = (v: unknown): v is KidThemeId => KID_THEMES.some((t) => t.id === v);

const KEY = 'edukid:the-gioi';
const EVT = 'edukid-the-gioi';

function read(): KidThemeId {
  try {
    const v = localStorage.getItem(KEY);
    return isKidTheme(v) ? v : 'meadow';
  } catch {
    return 'meadow';
  }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** Chủ đề đang chọn (máy chủ và lần vẽ đầu luôn là 'meadow' để khớp hydrate) */
export function useKidTheme(): KidThemeId {
  return useSyncExternalStore(subscribe, read, () => 'meadow');
}

export function saveKidTheme(id: KidThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* bỏ qua: trình duyệt chặn lưu trữ */
  }
  window.dispatchEvent(new Event(EVT));
}
