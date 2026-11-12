// Thời lượng bài luyện tập (lưu trên trình duyệt của em, áp cho mọi bài):
//  - theo hệ số: nhân thời gian từng câu (×0.5 luyện tốc độ … ×3 thong thả), giữ tỉ lệ câu dễ / câu khó;
//  - theo tổng số phút (quy định đề kiểm tra của trường): chia đúng tổng đó cho các câu theo tỉ lệ độ khó.

export type TimeSetting = { scale: number } | { minutes: number };

export const TIME_PRESETS: { scale: number; label: string; hint: string }[] = [
  { scale: 0.5, label: '×0.5', hint: 'Luyện tốc độ' },
  { scale: 0.75, label: '×0.75', hint: 'Nhanh hơn' },
  { scale: 1, label: 'Gợi ý', hint: 'Theo bài' },
  { scale: 1.5, label: '×1.5', hint: 'Thêm thời gian' },
  { scale: 2, label: '×2', hint: 'Gấp đôi' },
  { scale: 3, label: '×3', hint: 'Thong thả' },
];
export const MAX_MINUTES = 120;
/** Mỗi câu ít nhất 10 giây, tối đa 10 phút */
const MIN_Q = 10;
const MAX_Q = 600;
const KEY = 'educhain-time-setting';

const clampMin = (m: number) => Math.min(MAX_MINUTES, Math.max(1, Math.round(m)));

export function readTimeSetting(): TimeSetting {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<{ scale: number; minutes: number }> | null;
    if (v && Number(v.minutes) > 0) return { minutes: clampMin(Number(v.minutes)) };
    if (v && Number(v.scale) > 0) return { scale: Math.min(3, Math.max(0.5, Number(v.scale))) };
  } catch { /* bỏ qua */ }
  return { scale: 1 };
}
export function saveTimeSetting(t: TimeSetting) {
  const v = 'minutes' in t ? { minutes: clampMin(t.minutes) } : { scale: t.scale };
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* chế độ riêng tư: chỉ dùng cho lần này */ }
  return v as TimeSetting;
}

const clampQ = (s: number) => Math.min(MAX_Q, Math.max(MIN_Q, s));

/** Thời gian (giây) từng câu theo cài đặt. Đặt theo phút thì tổng khớp đúng từng giây (chia phần dư cho câu có phần lẻ lớn nhất). */
export function applyTime(base: number[], t: TimeSetting): number[] {
  if (!('minutes' in t)) return base.map((b) => clampQ(Math.round((b * t.scale) / 5) * 5));
  const sum = base.reduce((a, b) => a + b, 0) || 1;
  const target = t.minutes * 60;
  const raw = base.map((b) => (b * target) / sum);
  const out = raw.map((r) => clampQ(Math.floor(r)));
  let left = target - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && order.length; k = (k + 1) % order.length, left--) {
    const i = order[k][1];
    if (out[i] < MAX_Q) out[i]++;
  }
  return out;
}

/** Tên ngắn của cài đặt đang dùng (dòng tóm tắt) */
export function timeLabel(t: TimeSetting): string {
  if ('minutes' in t) return `${t.minutes} phút`;
  return t.scale === 1 ? 'Gợi ý theo bài' : (TIME_PRESETS.find((p) => p.scale === t.scale)?.label ?? `×${t.scale}`);
}
