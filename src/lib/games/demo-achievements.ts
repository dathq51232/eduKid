// DỮ LIỆU MINH HỌA cho trang Thành tích — không phải dữ liệu của học sinh thật, không lưu lên máy chủ.
// Chỉ có thành tích của một bạn nhỏ giả định; không có bảng xếp hạng, không so sánh với bạn khác,
// huy hiệu không quy đổi được thành tiền hay quà.

import type { BadgeIcon } from '@/components/mascot/MiloBadge';
import type { GameId, GameLevel } from './catalog';

export type DemoGameProgress = { game: GameId; plays: number; levelsDone: GameLevel[]; note: string };
export type DemoBadge = { id: string; icon: BadgeIcon; title: string; detail: string; earned: boolean };

export const DEMO_PLAYER = { name: 'Bạn nhỏ Milo', avatar: '🦉' };

export const DEMO_PROGRESS: DemoGameProgress[] = [
  { game: 'pattern', plays: 9, levelsDone: [1, 2, 3], note: 'Đã tìm ra quy luật nhóm 4 hình. Lần gần nhất đúng thêm 2 câu so với lần đầu!' },
  { game: 'memory', plays: 7, levelsDone: [1, 2], note: 'Số lượt để tìm 4 cặp giảm từ 9 xuống 6 lượt.' },
  { game: 'maze', plays: 5, levelsDone: [1, 2, 3, 4], note: 'Đã đi hết mê cung 10 × 10 ô mà không bỏ cuộc.' },
];

export const DEMO_BADGES: DemoBadge[] = [
  { id: 'first', icon: 'star', title: 'Bước đầu tiên', detail: 'Hoàn thành game đầu tiên', earned: true },
  { id: 'pattern', icon: 'pattern', title: 'Thám tử nhỏ', detail: 'Hoàn thành L3 Thám tử quy luật', earned: true },
  { id: 'maze', icon: 'maze', title: 'Nhà thám hiểm', detail: 'Đến đích mê cung L4', earned: true },
  { id: 'steady', icon: 'steady', title: 'Kiên trì', detail: 'Chơi lại một cấp độ để làm tốt hơn', earned: true },
  { id: 'memory', icon: 'memory', title: 'Trí nhớ vàng', detail: 'Hoàn thành L3 Nhà vô địch trí nhớ', earned: false },
  { id: 'explorer', icon: 'explorer', title: 'Chinh phục L5', detail: 'Hoàn thành L5 ở một game bất kì', earned: false },
];

export const DEMO_PRAISE = [
  'Em đã chơi lại mê cung L3 ba lần cho tới khi đến đích — đó là sự kiên trì thật sự!',
  'Ở Nhà vô địch trí nhớ, em cần ít lượt hơn so với tuần trước. Trí nhớ của em đang tiến bộ.',
  'Em thử cả quy luật khó ở L3. Dám thử thách mới là điều rất đáng khen.',
];

export const totalPlays = () => DEMO_PROGRESS.reduce((s, p) => s + p.plays, 0);
export const totalChallenges = () => DEMO_PROGRESS.reduce((s, p) => s + p.levelsDone.length, 0);
