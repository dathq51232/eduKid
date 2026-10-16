// Lịch sử bộ câu đã hiện cho em (lưu trên trình duyệt), để "Đổi bộ câu hỏi" luôn ra bộ câu KHÁC HẲN bộ trước:
//  - Mỗi bộ câu (bài + seed) được ghi lại danh sách mã câu → tải lại trang / "Làm lại bộ này" vẫn đúng bộ đó.
//  - Bộ mới tránh mọi câu của bộ đang có và bộ ngay trước nó.
// Chỉ là tiện ích trên máy của em: thiếu dữ liệu (trình duyệt riêng tư, máy khác) thì vẫn chạy, chỉ là không nhớ được.

type SetEntry = { ids: string[]; prev?: string; t: number };
const SETS_KEY = 'educhain-sets-v1';
const LAST_KEY = 'educhain-last-set-v1';
const MAX_SETS = 60;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Không lưu được: bỏ qua
  }
}
const k = (lessonId: string, seed: number) => `${lessonId}|${seed}`;

export function readSetEntry(lessonId: string, seed: number): SetEntry | null {
  if (typeof window === 'undefined') return null;
  return read<Record<string, SetEntry>>(SETS_KEY, {})[k(lessonId, seed)] ?? null;
}

export function saveSetEntry(lessonId: string, seed: number, ids: string[], prev?: string) {
  if (typeof window === 'undefined') return;
  const all = read<Record<string, SetEntry>>(SETS_KEY, {});
  all[k(lessonId, seed)] = { ids, prev, t: Date.now() };
  const keys = Object.keys(all);
  if (keys.length > MAX_SETS) keys.sort((a, b) => all[a].t - all[b].t).slice(0, keys.length - MAX_SETS).forEach((x) => delete all[x]);
  write(SETS_KEY, all);
}

/** Bộ câu em thấy gần nhất của bài: số seed, hoặc "goc" (bộ câu gốc) */
export function lastShownSet(lessonId: string): string | null {
  if (typeof window === 'undefined') return null;
  return read<Record<string, string>>(LAST_KEY, {})[lessonId] ?? null;
}
export function rememberShownSet(lessonId: string, seedOrGoc: string) {
  if (typeof window === 'undefined') return;
  const all = read<Record<string, string>>(LAST_KEY, {});
  if (all[lessonId] === seedOrGoc) return;
  all[lessonId] = seedOrGoc;
  write(LAST_KEY, all);
}
