// Sticker sưu tầm: hoàn thành một bài đạt từ 70% số câu đúng thì nhận 1 sticker ngẫu nhiên chưa có.
// Chỉ để động viên: không quy đổi, không so sánh với bạn khác. Lưu trên trình duyệt của em (giống điểm tích luỹ khi chưa đăng nhập).

export const STICKERS = [
  { id: 'dino', name: 'Khủng long Xanh' },
  { id: 'rocket', name: 'Tên lửa' },
  { id: 'planet', name: 'Hành tinh Tím' },
  { id: 'rainbow', name: 'Cầu vồng' },
  { id: 'whale', name: 'Cá voi Xanh' },
  { id: 'cactus', name: 'Xương rồng' },
  { id: 'sun', name: 'Ông Mặt Trời' },
  { id: 'moon', name: 'Trăng khuyết' },
  { id: 'cloud', name: 'Mây bông' },
  { id: 'sunflower', name: 'Hoa hướng dương' },
  { id: 'tree', name: 'Cây xanh' },
  { id: 'cat', name: 'Mèo mướp' },
  { id: 'goldfish', name: 'Cá vàng' },
  { id: 'turtle', name: 'Rùa con' },
  { id: 'butterfly', name: 'Bướm xinh' },
  { id: 'apple', name: 'Quả táo' },
  { id: 'icecream', name: 'Kem ốc quế' },
  { id: 'balloon', name: 'Bóng bay' },
  { id: 'kite', name: 'Cánh diều' },
  { id: 'boat', name: 'Thuyền buồm' },
  { id: 'car', name: 'Ô tô đỏ' },
  { id: 'house', name: 'Ngôi nhà' },
  { id: 'crown', name: 'Vương miện' },
  { id: 'lucky', name: 'Ngôi sao may mắn' },
] as const;
export type StickerId = (typeof STICKERS)[number]['id'];
export const stickerName = (id: StickerId) => STICKERS.find((s) => s.id === id)?.name ?? '';

/** Tỉ lệ đúng tối thiểu để nhận sticker */
export const STICKER_MIN_RATE = 0.7;

const KEY = 'edukid:stickers';
type Store = { owned: { id: StickerId; at: string; lesson: string }[]; last?: { attempt: string; id: StickerId | null } };

function read(): Store {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Store | null;
    if (v && Array.isArray(v.owned)) return { owned: v.owned.filter((o) => STICKERS.some((s) => s.id === o.id)), last: v.last };
  } catch {
    /* bỏ qua: trình duyệt chặn lưu trữ */
  }
  return { owned: [] };
}
function write(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* bỏ qua */
  }
}

export const readOwnedStickers = (): StickerId[] => read().owned.map((o) => o.id);

/** Chọn sticker mới (chưa có) cho một lượt làm bài. Gọi một lần khi nộp bài; trả về null nếu chưa đạt hoặc đã đủ bộ. */
export function awardSticker(attemptKey: string, lessonId: string, score: number, total: number, rand: () => number = Math.random): StickerId | null {
  const s = read();
  if (s.last?.attempt === attemptKey) return s.last.id;
  let id: StickerId | null = null;
  if (total > 0 && score / total >= STICKER_MIN_RATE) {
    const have = new Set(s.owned.map((o) => o.id));
    const left = STICKERS.filter((x) => !have.has(x.id));
    if (left.length) {
      id = left[Math.floor(rand() * left.length)].id;
      s.owned.push({ id, at: new Date().toISOString(), lesson: lessonId });
    }
  }
  s.last = { attempt: attemptKey, id };
  write(s);
  return id;
}

/** Sticker vừa nhận ở lượt làm bài này (để trang Kết quả hiện "Sticker mới!") */
export function lastAwardFor(attemptKey: string): StickerId | null {
  const s = read();
  return s.last?.attempt === attemptKey ? s.last.id : null;
}

// ---- Tuỳ chọn hiệu ứng (pháo giấy, Milo nhảy, họa tiết chuyển động)
const FX_KEY = 'edukid:fx';
export function readFx(): boolean {
  try {
    return localStorage.getItem(FX_KEY) !== 'off';
  } catch {
    return true;
  }
}
export function saveFx(on: boolean) {
  try {
    localStorage.setItem(FX_KEY, on ? 'on' : 'off');
  } catch {
    /* bỏ qua */
  }
}
export const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
