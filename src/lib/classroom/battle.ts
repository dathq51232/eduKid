// ĐẤU CẶP trong PHÒNG THI LỚP (migration 0073, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2) — phần dùng chung máy chủ / trình duyệt:
// ghép cặp, phân định theo kết quả nộp bài, tên vòng, độ khó theo vòng, lời Milo. Không đọc / ghi database ở đây.
// Mỗi vòng là một phòng thi: các em làm lúc nào cũng được trong giờ mở; hai em trong cặp nộp xong thì phân định.

export type WinReason = 'dung' | 'thoi_gian' | 'nop_truoc' | 'bo_thi' | 've' | 'xu';
/** Kết quả nộp bài của một em trong phòng thi của vòng (exam_room_results) */
export type Sub = { correct: number; duration_ms: number | null; created_at: string };

export const REASON_LABEL: Record<WinReason, string> = {
  dung: 'đúng nhiều câu hơn', thoi_gian: 'bằng số câu đúng, làm nhanh hơn', nop_truoc: 'bằng câu và thời gian, nộp trước',
  bo_thi: 'bạn không làm bài', ve: 'vé đi tiếp', xu: 'cô xử thắng',
};

/** Tên vòng theo số em còn đấu */
export function roundName(alive: number): string {
  if (alive <= 2) return 'Chung kết';
  if (alive <= 4) return 'Bán kết';
  if (alive <= 8) return 'Tứ kết';
  return 'Vòng loại';
}

/** Tỉ lệ Mức 1 / Mức 2 cho đề của vòng (phần còn lại là Mức 3): càng ít em càng khó */
export function roundRatio(alive: number): [number, number] {
  if (alive <= 2) return [0.2, 0.4];
  if (alive <= 8) return [0.4, 0.4];
  return [0.6, 0.4];
}

export const roundsFor = (n: number) => (n <= 1 ? 0 : Math.ceil(Math.log2(n)));

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

/**
 * Phân định một cặp: cả hai đã nộp → đúng nhiều hơn → thời gian ít hơn → nộp trước.
 * Phòng của vòng đã hết giờ / đóng mà chỉ một em nộp → em đó thắng. Chưa đủ để phân định → null.
 */
export function decidePair(a: Sub | null, b: Sub | null, ended: boolean): { winner: 'a' | 'b'; reason: WinReason } | null {
  if (a && b) {
    if (a.correct !== b.correct) return { winner: a.correct > b.correct ? 'a' : 'b', reason: 'dung' };
    const ta = a.duration_ms ?? Infinity, tb = b.duration_ms ?? Infinity;
    if (ta !== tb) return { winner: ta < tb ? 'a' : 'b', reason: 'thoi_gian' };
    return { winner: Date.parse(a.created_at) <= Date.parse(b.created_at) ? 'a' : 'b', reason: 'nop_truoc' };
  }
  if (ended && (a || b)) return { winner: a ? 'a' : 'b', reason: 'bo_thi' };
  return null;
}

/** Lời Milo cho em dừng lại ở một vòng — khen cố gắng, không dùng chữ "thua", "bị loại" */
export function miloStop(round: number): string {
  return round <= 1
    ? 'Em đã dũng cảm vào trận đầu tiên. Milo tự hào lắm! Mình cổ vũ các bạn còn lại nhé.'
    : `Em đã vào tới vòng ${round}. Milo tự hào lắm! Mình cổ vũ các bạn còn lại nhé.`;
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—';
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)} phút ${s % 60} giây` : `${s} giây`;
}

export function battleError(code: string): string {
  const m: Record<string, string> = {
    not_allowed: 'Bạn không có quyền với đấu cặp này.',
    too_few: 'Cần ít nhất 2 em để chia cặp.',
    round_running: 'Còn cặp chưa phân định — chờ các em nộp bài, hoặc xử thắng, rồi mở vòng sau.',
    bad_sets: 'Chưa đủ câu cho các cặp — chọn thêm chủ đề hoặc giảm số câu.',
    invalid_window: 'Giờ đóng phải sau giờ mở và chưa qua.',
    student_not_in_class: 'Có em không còn trong lớp, tải lại trang rồi thử lại.',
    closed: 'Đấu cặp này đã kết thúc hoặc đã đóng.',
    missing_table: 'Máy chủ chưa có Đấu cặp — cần chạy migration 0073_battle_rooms.sql trên Supabase.',
    not_configured: 'Máy chủ chưa cấu hình.',
  };
  return m[code] ?? 'Có lỗi, thử lại sau.';
}
