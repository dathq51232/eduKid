// Gộp mọi hoạt động học của con thành một dòng thời gian cho phụ huynh:
// luyện bài (lesson_results), trò chơi trí tuệ + cờ với máy (game_results), cờ online (chess_games),
// bài cô giao + phòng thi (student_recent_results, migration 0067).
import { GAMES } from '../games/catalog';

export type ActivityKind = 'luyen' | 'game' | 'co' | 'thi' | 'giao';
export const KIND_INFO: Record<ActivityKind, { name: string; icon: string }> = {
  luyen: { name: 'Luyện bài', icon: '📘' },
  giao: { name: 'Bài cô giao', icon: '📝' },
  thi: { name: 'Phòng thi', icon: '🌼' },
  game: { name: 'Trò chơi trí tuệ', icon: '🧩' },
  co: { name: 'Chơi cờ', icon: '♟️' },
};
export const KIND_ORDER: ActivityKind[] = ['luyen', 'giao', 'thi', 'game', 'co'];

/** Một hoạt động: `pct` = độ đúng / kết quả 0–100 (null nếu không chấm) */
export type Activity = { kind: ActivityKind; title: string; result: string; pct: number | null; at: string; subject?: string | null };

export type LessonRow = { lesson_title: string | null; lesson_code: string; subject_code?: string | null; score: number; total: number; created_at: string };
export type GameRow = { game_id: string; level: number; score: number; max_score: number; created_at: string };
export type ChessRow = { variant?: string | null; white: string; black: string; result: string | null; finished_at: string | null; created_at: string };
export type RecentRow = { kind: 'bai-giao' | 'phong-thi'; title: string; subject: string | null; score: number; max_score: number; correct: number; total: number; done_at: string };

const BOT = ['', 'Dễ', 'Vừa', 'Khó'];
const OUTCOME = ['Thua', 'Hoà', 'Thắng'];
const num = (x: number) => String(Math.round(Number(x) * 10) / 10).replace('.', ',');

/** Tên trò chơi / ván cờ theo mã game_id */
export function gameLabel(id: string, level?: number): string {
  if (id === 'chess') return `Cờ vua với máy${level ? ` · mức ${BOT[level] ?? level}` : ''}`;
  if (id === 'xiangqi') return `Cờ tướng với máy${level ? ` · mức ${BOT[level] ?? level}` : ''}`;
  if (id === 'robot') return 'Robot lập trình (đã gỡ)';
  return GAMES.find((g) => g.id === id)?.title ?? id;
}
const isBoard = (id: string) => id === 'chess' || id === 'xiangqi';
/** Kết quả một lượt game: cờ → Thắng/Hoà/Thua, trò chơi → điểm */
export function gameResult(g: Pick<GameRow, 'game_id' | 'score' | 'max_score'>): string {
  return isBoard(g.game_id) ? OUTCOME[Math.max(0, Math.min(2, g.score))] : `${g.score}/${g.max_score} điểm`;
}

export function buildActivities(p: { studentId: string; lessons: LessonRow[]; games: GameRow[]; chess: ChessRow[]; recent: RecentRow[] }): Activity[] {
  const out: Activity[] = [];
  // bài cô giao dạng bài học cũng nằm trong lesson_results: đã có ở mục "Bài cô giao" thì không lặp ở "Luyện bài"
  // (nhận theo đúng thời điểm làm: hàm 0067 trả về created_at của chính lượt luyện đó; tên bài cô đặt có thể khác tên bài học)
  const assigned = new Set(p.recent.filter((r) => r.kind === 'bai-giao').map((r) => Date.parse(r.done_at)));
  for (const r of p.lessons) {
    const title = r.lesson_title ?? r.lesson_code;
    if (assigned.has(Date.parse(r.created_at))) continue;
    out.push({ kind: 'luyen', title, result: `${r.score}/${r.total} câu đúng`, pct: r.total ? Math.round((r.score * 100) / r.total) : null, at: r.created_at, subject: r.subject_code });
  }
  for (const g of p.games) {
    out.push({ kind: isBoard(g.game_id) ? 'co' : 'game', title: gameLabel(g.game_id, g.level), result: gameResult(g), pct: g.max_score ? Math.round((g.score * 100) / g.max_score) : null, at: g.created_at });
  }
  for (const c of p.chess) {
    if (!c.result) continue;
    const mine = c.white === p.studentId ? 'w' : 'b';
    const win = (c.result === '1-0' && mine === 'w') || (c.result === '0-1' && mine === 'b');
    const draw = c.result === '1/2-1/2';
    out.push({ kind: 'co', title: `${c.variant === 'xiangqi' ? 'Cờ tướng' : 'Cờ vua'} online với bạn`, result: draw ? 'Hoà' : win ? 'Thắng' : 'Thua', pct: draw ? 50 : win ? 100 : 0, at: c.finished_at ?? c.created_at });
  }
  for (const r of p.recent) {
    const thi = r.kind === 'phong-thi';
    out.push({
      kind: thi ? 'thi' : 'giao', title: r.title, subject: r.subject,
      result: thi ? `${num(r.score)}/10 điểm · ${r.correct}/${r.total} câu` : `${num(r.score)}/${num(r.max_score)} điểm · ${r.correct}/${r.total} câu`,
      pct: r.max_score ? Math.round((Number(r.score) * 100) / Number(r.max_score)) : null, at: r.done_at,
    });
  }
  return out.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
