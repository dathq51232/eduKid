// Gọi tên – Dò bài: phần tính toán thuần (chọn em công bằng, đánh số lá thăm, cuộc đua), không phụ thuộc giao diện.
// Lưu trên máy đang chiếu (localStorage) theo lớp và theo ngày: em vắng, em đã gọi, điểm ✓ ✗ ★.

export type CallMode = 'wheel' | 'lots' | 'race' | 'eggs';
export const CALL_MODES: { id: CallMode; label: string; icon: string; action: string }[] = [
  { id: 'wheel', label: 'Vòng quay', icon: '🎡', action: 'Quay' },
  { id: 'lots', label: 'Bốc thăm', icon: '🎴', action: 'Bốc thăm' },
  { id: 'race', label: 'Đua thú', icon: '🏁', action: 'Xuất phát' },
  { id: 'eggs', label: 'Trứng nở', icon: '🥚', action: 'Gõ trứng' },
];

export type Student = { id: string; name: string };

/** Thời gian quay thầy cô chọn được (giây) */
export const DURATIONS = [3, 6, 10, 15, 20];
export type Tally = { ok: number; no: number; star: number };
export type CallState = {
  day: string; // yyyy-mm-dd — sang ngày mới thì danh sách vắng và đã gọi tự xoá
  round: number; // tăng mỗi lần "Vòng mới": đổi cách đánh số lá thăm
  absent: string[];
  called: string[];
  tally: Record<string, Tally>; // giữ qua các ngày
  mode: CallMode;
  noRepeat: boolean;
  duration: number; // giây quay / bốc / đua / trứng lắc — thầy cô chọn
  sound: boolean;
  subject: string;
  lessonId: string; // '' = chỉ gọi phát biểu, không hiện câu hỏi
};

export const today = (now = new Date()) => {
  const d = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
};

export function emptyState(): CallState {
  return { day: today(), round: 1, absent: [], called: [], tally: {}, mode: 'wheel', noRepeat: true, duration: 6, sound: true, subject: 'toan', lessonId: '' };
}

/** Đọc trạng thái đã lưu; sang ngày mới thì bắt đầu lại danh sách vắng / đã gọi nhưng giữ điểm và cài đặt. */
export function restoreState(raw: string | null, now = new Date()): CallState {
  const base = emptyState();
  if (!raw) return base;
  try {
    const s = { ...base, ...(JSON.parse(raw) as Partial<CallState>) };
    if (!CALL_MODES.some((m) => m.id === s.mode)) s.mode = 'wheel';
    if (!DURATIONS.includes(s.duration)) s.duration = 6;
    if (s.day !== today(now)) return { ...s, day: today(now), absent: [], called: [], round: s.round + 1 };
    return s;
  } catch {
    return base;
  }
}

/** Các em có mặt (theo thứ tự danh sách) */
export const presentOf = (students: Student[], s: Pick<CallState, 'absent'>) => students.filter((x) => !s.absent.includes(x.id));

/** Các em có thể được gọi lượt này. Không gọi lại: bỏ em đã gọi; gọi hết cả lớp thì trả cả lớp (vòng mới). */
export function candidatesOf(students: Student[], s: Pick<CallState, 'absent' | 'called' | 'noRepeat'>): { list: Student[]; newRound: boolean } {
  const present = presentOf(students, s);
  if (!s.noRepeat) return { list: present, newRound: false };
  const left = present.filter((x) => !s.called.includes(x.id));
  return left.length ? { list: left, newRound: false } : { list: present, newRound: present.length > 0 };
}

/** Bộ sinh số ngẫu nhiên có hạt giống (để cùng một vòng thì lá thăm giữ nguyên số) */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickOne<T>(list: T[], rand: () => number = Math.random): T | null {
  return list.length ? list[Math.floor(rand() * list.length) % list.length] : null;
}

/** Lá thăm: mỗi em có mặt một lá, số lá xáo theo vòng. Trả về [số lá] = em. */
export function lotsFor(students: Student[], s: Pick<CallState, 'absent' | 'round'>, classSeed: number): Student[] {
  return shuffle(presentOf(students, s), rng(classSeed * 31 + s.round * 7919));
}

const ANIMALS = ['🐢', '🐇', '🦆', '🐘', '🐎', '🐿️', '🐧', '🦒', '🐌', '🦔'];

/** Cuộc đua: em được gọi + tối đa 5 bạn khác; thời gian về đích (giây) — em được gọi luôn về trước. */
export function raceFor(winner: Student, pool: Student[], rand: () => number = Math.random, lanes = 6, seconds = 4) {
  const others = shuffle(pool.filter((x) => x.id !== winner.id), rand).slice(0, lanes - 1);
  const racers = shuffle([winner, ...others], rand);
  const animals = shuffle(ANIMALS, rand);
  const base = Math.max(1.5, seconds) * (0.9 + rand() * 0.1);
  return racers.map((st, i) => ({
    student: st,
    animal: animals[i % animals.length],
    finish: st.id === winner.id ? base : base * (1.06 + rand() * 0.35),
    wobble: 0.6 + rand() * 1.4,
  }));
}

/** Vị trí (0–1) của một con vật ở giây t: chạy nhanh dần, có lúc bứt tốc lúc chững lại. */
export function racePos(t: number, finish: number, wobble: number): number {
  if (t >= finish) return 1;
  const x = t / finish;
  const surge = 0.035 * Math.sin(x * Math.PI * (2 + wobble)) * (1 - x);
  return Math.max(0, Math.min(0.999, x * x * (3 - 2 * x) + surge));
}

/** Góc quay để ô của em thứ index (trong n ô) dừng đúng dưới kim ở đỉnh; quay thêm vài vòng cho đẹp. */
export function wheelAngle(index: number, n: number, current: number, turns = 6): number {
  const slice = 360 / n;
  const target = -(index + 0.5) * slice; // ô bắt đầu từ đỉnh, theo chiều kim đồng hồ
  const base = current - (current % 360) + turns * 360;
  let a = base + ((target % 360) + 360) % 360;
  if (a - current < turns * 360 - 180) a += 360;
  return a;
}

/** Tên ngắn trên ô vòng quay: 2 chữ cuối ("Gia Huy") */
export const shortName = (name: string) => name.trim().split(/\s+/).slice(-2).join(' ');

export function addTally(s: CallState, studentId: string, mark: keyof Tally): CallState {
  const t = s.tally[studentId] ?? { ok: 0, no: 0, star: 0 };
  return { ...s, tally: { ...s.tally, [studentId]: { ...t, [mark]: t[mark] + 1 } } };
}

/** Vòng quay giảm tốc êm, chậm dần ở cuối để cả lớp hồi hộp nhìn kim lướt qua từng bạn (0 → 1). */
export const spinEase = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/** Số vòng quay theo thời gian: quay lâu thì nhiều vòng hơn */
export const spinTurns = (seconds: number) => Math.max(3, Math.min(16, Math.round(seconds * 1.1)));

/** Ô đang nằm dưới kim (ở đỉnh) khi vòng đã quay góc a */
export function sliceAt(a: number, n: number): number {
  const atTop = (((-a) % 360) + 360) % 360;
  return Math.min(n - 1, Math.floor(atTop / (360 / n)));
}

/** Bốc thăm: các bước "đèn chạy" qua các lá, nhanh lúc đầu, chậm dần, dừng đúng lá được chọn. Trả về [chỉ số lá, thời điểm ms]. */
export function lotHops(choices: number[], target: number, seconds: number, rand: () => number = Math.random): [number, number][] {
  const total = Math.max(1, seconds) * 1000;
  const out: [number, number][] = [];
  let t = 0, prev = -1;
  while (true) {
    const x = t / total;
    const gap = 70 + 650 * Math.pow(x, 2.2);
    if (t + gap > total) break;
    t += gap;
    let i = choices[Math.floor(rand() * choices.length)];
    if (choices.length > 1) while (i === prev) i = choices[Math.floor(rand() * choices.length)];
    out.push([i, t]);
    prev = i;
  }
  out.push([target, total]);
  return out;
}
