// Tủ quà EDKC (11/2026): vật phẩm theo bộ nhận diện thương hiệu, mở khoá khi em đạt mốc học tập.
// Quà ảo để sưu tầm và khoe với bố mẹ; điều kiện tính từ thành tích thật trên máy chủ (my_achievements),
// nên không cần thêm bảng dữ liệu. Thầy cô / nhà trường có thể dùng danh sách này để trao quà thật nếu muốn.
import type { MyAchievements } from './achievements';

export type GiftStats = Pick<MyAchievements, 'total_points' | 'lessons_done' | 'perfect_lessons' | 'games_played'>;
export type GiftArt = 'badge-blue' | 'cubes' | 'pen' | 'badge-pink' | 'notebook' | 'badge-purple' | 'bottle' | 'tote' | 'tshirt' | 'tote-dark' | 'gold';
type Metric = keyof GiftStats;

export type Gift = { id: GiftArt; name: string; desc: string; metric: Metric; need: number };

const UNIT: Record<Metric, string> = { total_points: 'điểm', lessons_done: 'bài đã làm', perfect_lessons: 'bài đúng hết', games_played: 'lượt chơi game' };

export const GIFTS: Gift[] = [
  { id: 'badge-blue', name: 'Huy hiệu Xanh EDKC', desc: 'Huy hiệu tròn cài áo, dành cho bạn vừa hoàn thành bài học đầu tiên.', metric: 'lessons_done', need: 1 },
  { id: 'cubes', name: 'Bộ khối chữ E-D-K-C', desc: '4 khối chữ nhựa nhiều màu — mỗi chữ là một mảnh của logo.', metric: 'total_points', need: 100 },
  { id: 'pen', name: 'Bút bi EDKC', desc: 'Cây bút xanh của bạn nhỏ chăm chỉ.', metric: 'total_points', need: 250 },
  { id: 'badge-pink', name: 'Huy hiệu Hồng "Đúng hết"', desc: 'Dành cho bạn có 3 bài làm đúng tất cả các câu.', metric: 'perfect_lessons', need: 3 },
  { id: 'notebook', name: 'Sổ tay EDKC', desc: 'Sổ tay bìa xanh in logo xếp hình — ghi lại điều em học được.', metric: 'total_points', need: 500 },
  { id: 'badge-purple', name: 'Huy hiệu Tím "Trí tuệ"', desc: 'Dành cho bạn đã chơi 10 lượt game trí tuệ.', metric: 'games_played', need: 10 },
  { id: 'bottle', name: 'Bình nước EDKC', desc: 'Bình nước trắng in logo — học nhiều thì nhớ uống nước nhé!', metric: 'total_points', need: 800 },
  { id: 'tote', name: 'Túi vải EDKC', desc: 'Túi vải mộc đựng sách vở, in logo và chữ EDKC nhiều màu.', metric: 'total_points', need: 1200 },
  { id: 'tshirt', name: 'Áo thun EDKC', desc: 'Áo thun trắng của đội bạn nhỏ học giỏi.', metric: 'total_points', need: 2000 },
  { id: 'tote-dark', name: 'Túi vải Nhà vô địch', desc: 'Túi xám đậm in logo lớn — dành cho bạn có 25 bài đúng hết.', metric: 'perfect_lessons', need: 25 },
  { id: 'gold', name: 'Huy chương Vàng EDKC', desc: 'Món quà cao nhất: huy chương lục giác vàng cho bạn đạt 3.000 điểm.', metric: 'total_points', need: 3000 },
];

export const giftNeed = (g: Gift) => `${g.need.toLocaleString('vi-VN')} ${UNIT[g.metric]}`;
export const giftHave = (g: Gift, s: GiftStats) => Math.min(g.need, Math.max(0, s[g.metric] ?? 0));
export const giftOpen = (g: Gift, s: GiftStats) => (s[g.metric] ?? 0) >= g.need;

/** Quà gần mở nhất (theo phần trăm đã đạt) */
export function nextGift(s: GiftStats): Gift | null {
  const left = GIFTS.filter((g) => !giftOpen(g, s));
  if (!left.length) return null;
  return left.sort((a, b) => giftHave(b, s) / b.need - giftHave(a, s) / a.need)[0];
}

/* quà đã thấy (để đánh dấu "Mới!") — chỉ lưu trên máy này */
const SEEN = 'edukid:qua-da-xem';
export function readSeen(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN) ?? '[]') as string[]); } catch { return new Set(); }
}
export function saveSeen(ids: string[]) {
  try { localStorage.setItem(SEEN, JSON.stringify(ids)); } catch { /* bỏ qua */ }
}
