// Bộ số ngẫu nhiên có "hạt giống" (seed): cùng seed luôn ra cùng một đề — tải lại trang không đổi đề,
// chấm lại trên server/trình duyệt cho cùng kết quả. Thuật toán mulberry32.

export type Rng = {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // gồm cả hai đầu
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  sample<T>(items: readonly T[], n: number): T[];
  chance(p: number): boolean;
};

export function makeRng(seed: number): Rng {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const shuffle = <T,>(items: readonly T[]) => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return {
    next,
    int,
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle,
    sample: (items, n) => shuffle(items).slice(0, n),
    chance: (p) => next() < p,
  };
}

/** Seed mới cho một lượt luyện tập (1 … 2^31 − 1). */
export function newSeed(): number {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] % 2147483646) + 1;
  } catch {
    return Math.floor(Math.random() * 2147483646) + 1;
  }
}
