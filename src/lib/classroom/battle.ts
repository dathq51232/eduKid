// ĐẤU CẶP MẮT XÍCH (migration 0073, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2) — phần dùng chung máy chủ / trình duyệt:
// kiểu dữ liệu, ghép cặp, tính câu hết giờ, phân định thắng thua, độ khó theo vòng. Không đọc / ghi database ở đây.
import type { ExamItem } from './assignments';

export type BattleStatus = 'lobby' | 'playing' | 'done' | 'closed';
export type WinReason = 'dung' | 'thoi_gian' | 'nop_truoc' | 've' | 'xu';
export type BattleAnswer = { i: number; ok: boolean; ms: number };
export type Prog = { i: number; served_at: string | null; answers: BattleAnswer[]; correct: number; time_ms: number; finished_at: string | null };

export const BATTLE_MIN_PLAYERS = 2;
export const BATTLE_MAX_PLAYERS = 60;
/** Trễ mạng cho phép sau khi hết giờ một câu, trước khi máy chủ tự tính câu đó là hết giờ */
export const GRACE_MS = 4000;

export const battleDefaults = (grade: number) => (grade <= 2 ? { n: 5, sec: 40 } : { n: 7, sec: 45 });

export const REASON_LABEL: Record<WinReason, string> = {
  dung: 'đúng nhiều câu hơn', thoi_gian: 'bằng số câu đúng, làm nhanh hơn', nop_truoc: 'bằng câu và thời gian, nộp trước',
  ve: 'vé đi tiếp', xu: 'cô xử thắng',
};

/** Tên vòng theo số em còn lại khi bốc thăm */
export function roundName(alive: number): string {
  if (alive <= 2) return 'Chung kết';
  if (alive <= 4) return 'Bán kết';
  if (alive <= 8) return 'Tứ kết';
  return 'Vòng loại';
}

/** Tỉ lệ Mức 1 / Mức 2 cho bộ câu của vòng (phần còn lại là Mức 3): càng ít em càng khó */
export function roundRatio(alive: number): [number, number] {
  if (alive <= 2) return [0.2, 0.4];
  if (alive <= 8) return [0.4, 0.4];
  return [0.6, 0.4];
}

/** Số vòng cần đấu với n em */
export const roundsFor = (n: number) => (n <= 1 ? 0 : Math.ceil(Math.log2(n)));

// ------------------------------------------------------------------------------------------------- ngẫu nhiên có seed
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let s = (seed ^ 0x9e3779b9) >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
export function shuffled<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * Ghép cặp ngẫu nhiên. Số em lẻ: một em nhận vé đi tiếp — chọn trong các em ít vé nhất.
 * `rand` do máy chủ cấp (crypto) — trình duyệt không quyết định cặp.
 */
export function pairUp(players: { id: string; byes: number }[], rand: () => number): { pairs: [string, string][]; bye: string | null } {
  let pool = shuffled(players, rand);
  let bye: string | null = null;
  if (pool.length % 2 === 1) {
    const least = Math.min(...pool.map((p) => p.byes));
    const cands = pool.filter((p) => p.byes === least);
    bye = cands[Math.floor(rand() * cands.length)].id;
    pool = pool.filter((p) => p.id !== bye);
  }
  const pairs: [string, string][] = [];
  for (let i = 0; i + 1 < pool.length; i += 2) pairs.push([pool[i].id, pool[i + 1].id]);
  return { pairs, bye };
}

/** Thứ tự câu riêng của một em trong trận (cùng bộ câu với bạn, khác thứ tự) — vị trí i của em → câu số order[i] */
export const orderFor = (matchId: string, studentId: string, n: number) =>
  shuffled(Array.from({ length: n }, (_, k) => k), rng(hashStr(`${matchId}:${studentId}`)));

/** Câu gửi cho em: bỏ đáp án, lời giải; đảo phương án (đáp án chấm theo nội dung nên vẫn đúng) */
export function itemForStudent(q: ExamItem, seed: string): ExamItem {
  const rand = rng(hashStr(seed));
  const base: ExamItem = { type: q.type, prompt: q.prompt, options: q.options ?? [], left: q.left, blanks: q.blanks, statements: q.statements, muc: q.muc, pts: 1 };
  if (q.type === 'grouping') return { ...base, left: shuffled(q.left ?? [], rand) };
  if (['single_choice', 'multiple_choice', 'matching', 'pair_grid'].includes(q.type)) return { ...base, options: shuffled(q.options ?? [], rand) };
  return base;
}

/**
 * Tính các câu đã quá giờ (em mất mạng / bỏ đi): mỗi câu quá giờ tính sai, thời gian = đủ giờ câu đó,
 * câu sau coi như được gửi đúng lúc câu trước hết giờ. Trả về bản mới nếu có thay đổi, null nếu không.
 */
export function applyTimeouts(p: Prog, n: number, secMs: number, now: number): Prog | null {
  if (p.finished_at || !p.served_at || p.i >= n) return null;
  let served = new Date(p.served_at).getTime();
  if (now <= served + secMs + GRACE_MS) return null;
  const out: Prog = { ...p, answers: [...p.answers] };
  while (out.i < n && now > served + secMs + GRACE_MS) {
    out.answers.push({ i: out.i, ok: false, ms: secMs });
    out.time_ms += secMs;
    out.i += 1;
    served += secMs;
  }
  out.served_at = new Date(served).toISOString();
  if (out.i >= n) out.finished_at = new Date(served).toISOString();
  return out;
}

/** Phân định khi cả hai đã xong: đúng nhiều hơn → tổng thời gian ít hơn → nộp câu cuối trước */
export function decide(a: Prog, b: Prog): { winner: 'a' | 'b'; reason: WinReason } {
  if (a.correct !== b.correct) return { winner: a.correct > b.correct ? 'a' : 'b', reason: 'dung' };
  if (a.time_ms !== b.time_ms) return { winner: a.time_ms < b.time_ms ? 'a' : 'b', reason: 'thoi_gian' };
  const fa = a.finished_at ? new Date(a.finished_at).getTime() : Infinity;
  const fb = b.finished_at ? new Date(b.finished_at).getTime() : Infinity;
  return { winner: fa <= fb ? 'a' : 'b', reason: 'nop_truoc' };
}

/** Chữ ký câu (giống ma trận đề) để không lặp câu giữa các vòng */
export const itemSig = (q: { prompt: string; blanks?: string[]; statements?: string[] }) =>
  [q.prompt, (q.blanks ?? []).join('|'), (q.statements ?? []).join('|')].join('#');

/** Lời Milo cho em dừng lại ở một vòng — khen cố gắng, không dùng chữ "thua", "bị loại" */
export function miloStop(round: number, correct: number, total: number): string {
  const r = round <= 1 ? 'Em đã dũng cảm vào trận đầu tiên' : `Em đã vào tới vòng ${round}`;
  const c = correct > 0 ? ` và làm đúng ${correct}/${total} câu` : '';
  return `${r}${c}. Milo tự hào lắm! Mình cổ vũ các bạn còn lại nhé.`;
}

export const fmtMs = (ms: number) => `${(Math.round(ms / 100) / 10).toFixed(1).replace('.', ',')} giây`;

export function battleError(code: string): string {
  const m: Record<string, string> = {
    not_allowed: 'Bạn không có quyền với phòng đấu này.',
    not_found: 'Không có phòng đấu với mã này. Em kiểm tra lại mã cô đọc nhé.',
    not_in_class: 'Phòng đấu này không phải của lớp em.',
    started: 'Phòng đấu đã bốc thăm rồi, em chờ trận sau nhé.',
    closed: 'Phòng đấu đã đóng.',
    too_few: 'Cần ít nhất 2 em trong phòng để bốc thăm.',
    round_running: 'Còn trận chưa xong — chờ các trận xong (hoặc xử thắng) rồi bốc thăm vòng sau.',
    bad_sets: 'Chưa đủ câu cho các trận — chọn thêm bài hoặc giảm số câu mỗi trận.',
    missing_table: 'Máy chủ chưa có Đấu cặp — cần chạy migration 0073_battle_rooms.sql trên Supabase.',
    not_configured: 'Máy chủ chưa cấu hình.',
  };
  return m[code] ?? 'Có lỗi, thử lại sau.';
}
