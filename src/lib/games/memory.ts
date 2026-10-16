// Game B — Nhà vô địch trí nhớ: logic thuần (không phụ thuộc giao diện) để dễ kiểm thử.
//
// Luật:
// - Bộ thẻ gồm N cặp; mỗi hình xuất hiện đúng 2 lần, xáo trộn lại mỗi lần bắt đầu (Fisher–Yates).
// - Không lật được thẻ đang mở, thẻ đã ghép xong, hay chính thẻ vừa lật trong cùng một lượt.
// - Lật thẻ thứ hai là hết một lượt. Hai thẻ khác nhau thì chờ úp lại (settle) rồi mới lật tiếp.
// - Chỉ đếm số lượt và số lần lật, không có đồng hồ.

import type { GameLevel } from './catalog';
import { SHAPES, shapeLabel, type Shape, type ShapeColor } from './shapes';

export type MemoryFace = { id: string; shape: Shape; color: ShapeColor; label: string };
export type MemoryCard = { uid: number; face: MemoryFace };

export const PAIRS_BY_LEVEL: Record<GameLevel, number> = { 1: 3, 2: 4, 3: 6, 4: 8, 5: 10 };
export const COLUMNS_BY_LEVEL: Record<GameLevel, number> = { 1: 3, 2: 4, 3: 4, 4: 4, 5: 5 };

const FACE_COLORS: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'blue', 'red', 'green', 'purple'];
/** 10 hình khác nhau cả về dáng — đủ cho cấp độ lớn nhất */
export const MEMORY_FACES: MemoryFace[] = SHAPES.map((shape, i) => ({
  id: shape,
  shape,
  color: FACE_COLORS[i],
  label: shapeLabel(shape, FACE_COLORS[i]),
}));

export type Random = () => number;

export function shuffle<T>(xs: T[], random: Random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeck(pairs: number, random: Random): MemoryCard[] {
  if (pairs < 1 || pairs > MEMORY_FACES.length) throw new Error(`Số cặp không hợp lệ: ${pairs}`);
  const faces = shuffle(MEMORY_FACES, random).slice(0, pairs);
  const cards = faces.flatMap((face) => [face, face]);
  return shuffle(cards, random).map((face, uid) => ({ uid, face }));
}

export type MemoryState = {
  cards: MemoryCard[];
  /** Vị trí các thẻ đang ngửa trong lượt hiện tại (0, 1 hoặc 2 thẻ) */
  open: number[];
  matched: boolean[];
  /** Hai thẻ khác nhau đang chờ úp lại */
  waiting: boolean;
  flips: number;
  turns: number;
};

export type FlipResult = 'ignored' | 'first' | 'match' | 'miss';

export function newGame(pairs: number, random: Random): MemoryState {
  const cards = createDeck(pairs, random);
  return { cards, open: [], matched: cards.map(() => false), waiting: false, flips: 0, turns: 0 };
}

export function canFlip(s: MemoryState, index: number): boolean {
  return index >= 0 && index < s.cards.length && !s.waiting && !s.matched[index] && !s.open.includes(index);
}

export function flip(s: MemoryState, index: number): { state: MemoryState; result: FlipResult } {
  if (!canFlip(s, index)) return { state: s, result: 'ignored' };
  if (s.open.length === 0) return { state: { ...s, open: [index], flips: s.flips + 1 }, result: 'first' };
  const first = s.open[0];
  const same = s.cards[first].face.id === s.cards[index].face.id;
  if (same) {
    const matched = [...s.matched];
    matched[first] = true;
    matched[index] = true;
    return { state: { ...s, open: [], matched, flips: s.flips + 1, turns: s.turns + 1 }, result: 'match' };
  }
  return { state: { ...s, open: [first, index], waiting: true, flips: s.flips + 1, turns: s.turns + 1 }, result: 'miss' };
}

/** Úp hai thẻ không trùng xuống để lật lượt mới */
export function settle(s: MemoryState): MemoryState {
  return s.waiting ? { ...s, open: [], waiting: false } : s;
}

export const isDone = (s: MemoryState) => s.matched.every(Boolean);
export const pairsFound = (s: MemoryState) => s.matched.filter(Boolean).length / 2;
