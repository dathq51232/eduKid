// Trọng tài ván cờ trực tuyến (cờ vua và cờ tướng): dựng lại ván từ danh sách nước, kiểm tra nước đi
// (cờ vua: chess.js; cờ tướng: bộ luật src/lib/xiangqi), tính đồng hồ theo giờ máy chủ, quyết định kết quả.
// Hàm thuần (không gọi database) để kiểm thử được.
import { Chess, type Color } from 'chess.js';
import { boardResult, timeoutResult, type ResultReason } from './game';
import { XqGame, UCI_RE as XQ_UCI, type XqReason } from '@/lib/xiangqi/engine';

export type Variant = 'chess' | 'xiangqi';
export type AnyReason = ResultReason | XqReason;
/** Trọng tài theo loại cờ: thử một nước trên ván đã có; xử khi hết giờ */
type Referee = {
  uci: RegExp;
  tryMove: (moves: string[], uci: string) => { fen: string; result: { winner: Color | null; reason: AnyReason } | null } | null;
  timeout: (moves: string[], flagged: Color) => { winner: Color | null; reason: AnyReason };
};
const CHESS_REF: Referee = {
  uci: /^[a-h][1-8][a-h][1-8][qrbn]?$/,
  tryMove: (moves, uci) => { const g = replay(moves); try { g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); } catch { return null; } return { fen: g.fen(), result: boardResult(g) }; },
  timeout: (moves, flagged) => timeoutResult(replay(moves), flagged),
};
const XQ_REF: Referee = {
  uci: XQ_UCI,
  tryMove: (moves, uci) => { const g = XqGame.fromMoves(moves); if (!g.move(uci)) return null; return { fen: g.fen(), result: g.result() }; },
  // Hết giờ là thua; nếu đối thủ không còn quân tấn công (xe, mã, pháo, tốt) thì hòa
  timeout: (moves, flagged) => { const g = XqGame.fromMoves(moves); const other: Color = flagged === 'w' ? 'b' : 'w'; return g.canMate(other) ? { winner: other, reason: 'timeout' } : { winner: null, reason: 'timeout_vs_material' }; },
};
const refOf = (row: Pick<GameRow, 'variant'>) => (row.variant === 'xiangqi' ? XQ_REF : CHESS_REF);

export type GameStatus = 'active' | 'finished' | 'aborted';
export type GameRow = {
  id: string; school_id: string; white: string; black: string;
  base: number; inc: number; moves: string[]; ply: number; fen: string;
  white_ms: number; black_ms: number; turn_at: string;
  status: GameStatus; result: '1-0' | '0-1' | '1/2-1/2' | null; reason: AnyReason | null; variant: Variant;
  draw_offer: Color | null; emote: { by: Color; code: string; at: string } | null;
  rated: boolean; created_at: string; updated_at: string; finished_at: string | null;
};
export type Patch = Partial<Omit<GameRow, 'id' | 'school_id' | 'white' | 'black' | 'base' | 'inc' | 'created_at' | 'variant'>>;
export type Decision = { ok: true; patch: Patch; finished: boolean } | { ok: false; error: string };

export const EMOTES: { code: string; text: string }[] = [
  { code: 'hi', text: '👋 Chào bạn!' },
  { code: 'gl', text: '🍀 Chúc may mắn!' },
  { code: 'wow', text: '😮 Nước hay quá!' },
  { code: 'think', text: '🤔 Để mình nghĩ…' },
  { code: 'gg', text: '🤝 Ván hay lắm!' },
  { code: 'again', text: '🔁 Chơi lại nhé?' },
];

export const ONLINE_TCS = [
  { base: 180, inc: 2, label: '3 phút + 2 giây' },
  { base: 300, inc: 3, label: '5 phút + 3 giây' },
  { base: 600, inc: 5, label: '10 phút + 5 giây' },
  { base: 900, inc: 10, label: '15 phút + 10 giây' },
];

export function replay(moves: string[]): Chess {
  const g = new Chess();
  for (const m of moves) g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
  return g;
}

export const turnOf = (row: Pick<GameRow, 'ply'>): Color => (row.ply % 2 === 0 ? 'w' : 'b');
export const sideOf = (row: Pick<GameRow, 'white' | 'black'>, studentId: string): Color | null => (row.white === studentId ? 'w' : row.black === studentId ? 'b' : null);

/** Thời gian còn lại của hai bên tại thời điểm now (bên đang đi bị trừ thời gian đã nghĩ) */
export function clockAt(row: Pick<GameRow, 'white_ms' | 'black_ms' | 'turn_at' | 'ply' | 'status'>, now: number): Record<Color, number> {
  const c = { w: row.white_ms, b: row.black_ms };
  if (row.status === 'active') { const t = turnOf(row); c[t] = c[t] - Math.max(0, now - Date.parse(row.turn_at)); }
  return c;
}

const resultOf = (winner: Color | null): GameRow['result'] => (winner === 'w' ? '1-0' : winner === 'b' ? '0-1' : '1/2-1/2');
const finish = (now: number, winner: Color | null, reason: AnyReason): Patch => ({
  status: 'finished', result: resultOf(winner), reason, draw_offer: null, finished_at: new Date(now).toISOString(), updated_at: new Date(now).toISOString(),
});

/** Bên đang đi đã hết giờ chưa → kết thúc ván (thua, hoặc hòa nếu đối thủ không đủ quân chiếu hết) */
export function decideFlag(row: GameRow, now: number): Decision {
  if (row.status !== 'active') return { ok: false, error: 'not_active' };
  const t = turnOf(row);
  const left = clockAt(row, now)[t];
  if (left > 0) return { ok: false, error: 'not_flagged' };
  const r = refOf(row).timeout(row.moves, t);
  return { ok: true, finished: true, patch: { ...finish(now, r.winner, r.reason), [t === 'w' ? 'white_ms' : 'black_ms']: 0 } };
}

export function decideMove(row: GameRow, side: Color, uci: string, expectPly: number, now: number): Decision {
  if (row.status !== 'active') return { ok: false, error: 'not_active' };
  if (expectPly !== row.ply) return { ok: false, error: 'stale' };
  if (turnOf(row) !== side) return { ok: false, error: 'not_your_turn' };
  const ref = refOf(row);
  if (!ref.uci.test(uci)) return { ok: false, error: 'bad_move' };
  const flag = decideFlag(row, now);
  if (flag.ok) return flag; // hết giờ trước khi kịp đi: ván kết thúc
  const tried = ref.tryMove(row.moves, uci);
  if (!tried) return { ok: false, error: 'illegal' };
  const left = clockAt(row, now)[side] + row.inc * 1000;
  const iso = new Date(now).toISOString();
  const patch: Patch = {
    moves: [...row.moves, uci], ply: row.ply + 1, fen: tried.fen,
    [side === 'w' ? 'white_ms' : 'black_ms']: Math.round(left), turn_at: iso, updated_at: iso,
    // Đi quân nghĩa là không nhận lời xin hòa của đối thủ; lời xin hòa của chính mình vẫn giữ
    draw_offer: row.draw_offer === side ? side : null,
  };
  const r = tried.result;
  if (r) return { ok: true, finished: true, patch: { ...patch, ...finish(now, r.winner, r.reason) } };
  return { ok: true, finished: false, patch };
}

export function decideResign(row: GameRow, side: Color, now: number): Decision {
  if (row.status !== 'active') return { ok: false, error: 'not_active' };
  const c = clockAt(row, now);
  return { ok: true, finished: true, patch: { ...finish(now, side === 'w' ? 'b' : 'w', 'resign'), white_ms: Math.max(0, Math.round(c.w)), black_ms: Math.max(0, Math.round(c.b)) } };
}

export function decideDraw(row: GameRow, side: Color, action: 'offer' | 'accept' | 'decline', now: number): Decision {
  if (row.status !== 'active') return { ok: false, error: 'not_active' };
  const iso = new Date(now).toISOString();
  if (action === 'offer') {
    if (row.draw_offer === side) return { ok: false, error: 'already' };
    if (row.draw_offer && row.draw_offer !== side) return decideDraw(row, side, 'accept', now); // hai bên cùng xin hòa = đồng ý
    return { ok: true, finished: false, patch: { draw_offer: side, updated_at: iso } };
  }
  if (!row.draw_offer || row.draw_offer === side) return { ok: false, error: 'no_offer' };
  if (action === 'decline') return { ok: true, finished: false, patch: { draw_offer: null, updated_at: iso } };
  const c = clockAt(row, now);
  return { ok: true, finished: true, patch: { ...finish(now, null, 'agreement'), white_ms: Math.round(c.w), black_ms: Math.round(c.b) } };
}

/** Hủy ván khi chưa bên nào đi đủ 1 nước (không tính điểm) */
export function decideAbort(row: GameRow, now: number): Decision {
  if (row.status !== 'active') return { ok: false, error: 'not_active' };
  if (row.ply >= 2) return { ok: false, error: 'too_late' };
  const iso = new Date(now).toISOString();
  return { ok: true, finished: false, patch: { status: 'aborted', draw_offer: null, finished_at: iso, updated_at: iso } };
}

export function decideEmote(row: GameRow, side: Color, code: string, now: number): Decision {
  if (!EMOTES.some((e) => e.code === code)) return { ok: false, error: 'bad_emote' };
  if (row.emote && row.emote.by === side && now - Date.parse(row.emote.at) < 4000) return { ok: false, error: 'too_fast' };
  const iso = new Date(now).toISOString();
  return { ok: true, finished: false, patch: { emote: { by: side, code, at: iso }, updated_at: iso } };
}

export const ERROR_TEXT: Record<string, string> = {
  not_active: 'Ván cờ đã kết thúc.',
  stale: 'Bàn cờ vừa thay đổi, đang tải lại…',
  not_your_turn: 'Chưa tới lượt em.',
  bad_move: 'Nước đi không hợp lệ.',
  illegal: 'Nước đi không đúng luật.',
  not_flagged: 'Đồng hồ vẫn còn giờ.',
  already: 'Em đã xin hòa rồi, chờ bạn trả lời nhé.',
  no_offer: 'Không có lời xin hòa nào.',
  too_late: 'Đã đi quân rồi nên không hủy ván được.',
  bad_emote: 'Biểu cảm không hợp lệ.',
  too_fast: 'Chờ chút rồi gửi tiếp nhé.',
  conflict: 'Bàn cờ vừa thay đổi, đang tải lại…',
  not_player: 'Em không phải người chơi của ván này.',
  not_found: 'Không tìm thấy ván cờ.',
  no_class: 'Em cần vào một lớp học để đấu với bạn cùng trường.',
  not_student: 'Chỉ tài khoản học sinh mới đấu trực tuyến được.',
  not_configured: 'Máy chủ chưa cấu hình xong (thiếu khóa Supabase).',
  missing: 'Chưa bật đấu trực tuyến: cần chạy migration 0035_chess_online.sql trên Supabase.',
  too_many_games: 'Em đang có 3 ván dở, hãy chơi xong trước nhé.',
  seek_gone: 'Lời mời này không còn nữa.',
  own_seek: 'Đây là lời mời của chính em.',
  bad_tc: 'Kiểu đồng hồ không hợp lệ.',
  bad_target: 'Bạn này không cùng trường.',
  rate: 'Thao tác nhanh quá, chờ chút nhé.',
};
