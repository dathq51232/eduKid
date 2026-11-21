import 'server-only';
import { randomInt } from 'node:crypto';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { ExamItem } from './assignments';
import { applyTimeouts, decide, pairUp, type BattleStatus, type Prog, type WinReason } from './battle';

// ĐẤU CẶP MẮT XÍCH — phần máy chủ (migration 0073). Mọi bảng chỉ service_role đọc/ghi; API kiểm quyền trước khi gọi.
// Trận được "chốt" ở bất kỳ lần đọc / ghi nào (giáo viên xem bảng, em lấy câu / nộp câu): câu quá giờ tự tính sai,
// cả hai xong → phân định, đánh dấu em dừng lại; mọi trận của vòng xong mà chỉ còn 1 em → nhà vô địch.

type Admin = ReturnType<typeof createAdminClient>;
export type RoomRow = {
  id: string; class_id: string; code: string; title: string; subject: string; grade: number; lessons: string[];
  n_questions: number; sec_per_q: number; status: BattleStatus; round: number; champion: string | null; created_at: string;
};
export type PlayerRow = { student_id: string; display_name: string; byes: number; out_round: number | null; joined_at: string };
export type MatchRow = {
  id: string; round: number; slot: number; a: string; b: string | null; questions: ExamItem[]; status: 'playing' | 'done';
  winner: string | null; reason: WinReason | null; started_at: string; finished_at: string | null;
};
export type ProgRow = Prog & { match_id: string; student_id: string };

const ROOM_COLS = 'id, class_id, code, title, subject, grade, lessons, n_questions, sec_per_q, status, round, champion, created_at';
const MATCH_COLS = 'id, round, slot, a, b, questions, status, winner, reason, started_at, finished_at';
const PROG_COLS = 'match_id, student_id, i, served_at, answers, correct, time_ms, finished_at';

/** Bảng chưa có (chưa chạy migration 0073) */
export const isMissingTable = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /battle_|does not exist|schema cache/i.test(e.message ?? ''));

export async function loadRoom(admin: Admin, id: string) {
  return admin.from('battle_rooms').select(ROOM_COLS).eq('id', id).maybeSingle<RoomRow>();
}

export async function loadAll(admin: Admin, room: RoomRow) {
  const [{ data: players }, { data: matches }] = await Promise.all([
    admin.from('battle_players').select('student_id, display_name, byes, out_round, joined_at').eq('room_id', room.id).order('joined_at'),
    admin.from('battle_matches').select(MATCH_COLS).eq('room_id', room.id).order('round').order('slot'),
  ]);
  const ms = (matches ?? []) as MatchRow[];
  const { data: progs } = ms.length ? await admin.from('battle_progress').select(PROG_COLS).in('match_id', ms.map((m) => m.id)) : { data: [] };
  return { players: (players ?? []) as PlayerRow[], matches: ms, progs: (progs ?? []) as ProgRow[] };
}

/** Lưu tiến độ một em (chỉ khi câu đang làm vẫn là `fromI` — tránh hai yêu cầu ghi đè nhau) */
export async function saveProg(admin: Admin, p: ProgRow, fromI: number) {
  const { data } = await admin.from('battle_progress')
    .update({ i: p.i, served_at: p.served_at, answers: p.answers, correct: p.correct, time_ms: p.time_ms, finished_at: p.finished_at })
    .eq('match_id', p.match_id).eq('student_id', p.student_id).eq('i', fromI).select('i');
  return (data ?? []).length > 0;
}

/** Kết thúc một trận (chỉ một yêu cầu thắng được nhờ điều kiện status = 'playing') và đánh dấu em dừng lại */
export async function finishMatch(admin: Admin, room: RoomRow, m: MatchRow, winner: string, reason: WinReason) {
  const { data } = await admin.from('battle_matches').update({ status: 'done', winner, reason, finished_at: new Date().toISOString() })
    .eq('id', m.id).eq('status', 'playing').select('id');
  if (!(data ?? []).length) return false;
  const loser = m.a === winner ? m.b : m.a;
  if (loser) await admin.from('battle_players').update({ out_round: m.round }).eq('room_id', room.id).eq('student_id', loser).is('out_round', null);
  m.status = 'done'; m.winner = winner; m.reason = reason;
  return true;
}

/**
 * Chốt các trận đang đấu của vòng hiện tại: câu quá giờ → sai; hai em xong → phân định.
 * Vòng xong mà chỉ còn một em → phòng kết thúc, có nhà vô địch. Trả về true nếu có thay đổi.
 */
export async function settle(admin: Admin, room: RoomRow, matches: MatchRow[], progs: ProgRow[]): Promise<boolean> {
  if (room.status !== 'playing') return false;
  const now = Date.now();
  const secMs = room.sec_per_q * 1000;
  let changed = false;
  for (const m of matches.filter((x) => x.round === room.round && x.status === 'playing')) {
    const n = m.questions.length;
    const mine = progs.filter((p) => p.match_id === m.id);
    for (const p of mine) {
      const t = applyTimeouts(p, n, secMs, now);
      if (t && (await saveProg(admin, { ...p, ...t }, p.i))) { Object.assign(p, t); changed = true; }
    }
    const pa = mine.find((p) => p.student_id === m.a);
    const pb = m.b ? mine.find((p) => p.student_id === m.b) : undefined;
    if (pa?.finished_at && pb?.finished_at) {
      const d = decide(pa, pb);
      if (await finishMatch(admin, room, m, d.winner === 'a' ? m.a : m.b!, d.reason)) changed = true;
    }
  }
  if (await closeRoundIfDone(admin, room, matches)) changed = true;
  return changed;
}

/** Mọi trận của vòng xong: còn đúng 1 em → nhà vô địch, phòng kết thúc */
export async function closeRoundIfDone(admin: Admin, room: RoomRow, matches: MatchRow[]) {
  const cur = matches.filter((x) => x.round === room.round);
  if (room.status !== 'playing' || !cur.length || cur.some((x) => x.status !== 'done')) return false;
  const winners = cur.map((x) => x.winner).filter(Boolean) as string[];
  if (winners.length !== 1) return false;
  const { data } = await admin.from('battle_rooms').update({ status: 'done', champion: winners[0] }).eq('id', room.id).eq('status', 'playing').select('id');
  if ((data ?? []).length) { room.status = 'done'; room.champion = winners[0]; return true; }
  return false;
}

/** Số ngẫu nhiên [0, 1) từ crypto — dùng để bốc thăm */
export const cryptoRand = () => randomInt(0, 2 ** 32) / 2 ** 32;

/** Bốc thăm vòng tiếp: ghép cặp ngẫu nhiên, mỗi trận một bộ câu; em lẻ nhận vé đi tiếp */
export async function drawRound(admin: Admin, room: RoomRow, players: PlayerRow[], sets: ExamItem[][]): Promise<{ error?: string }> {
  const alive = players.filter((p) => p.out_round === null);
  if (alive.length < 2) return { error: 'too_few' };
  const { pairs, bye } = pairUp(alive.map((p) => ({ id: p.student_id, byes: p.byes })), cryptoRand);
  if (sets.length < pairs.length) return { error: 'bad_sets' };
  const round = room.round + 1;
  // chuyển vòng trước (điều kiện round cũ) để hai lần bấm cùng lúc không tạo hai vòng
  const { data: moved } = await admin.from('battle_rooms').update({ round, status: 'playing' }).eq('id', room.id).eq('round', room.round).in('status', ['lobby', 'playing']).select('id');
  if (!(moved ?? []).length) return { error: 'round_running' };
  room.round = round; room.status = 'playing';
  const now = new Date().toISOString();
  const rows = pairs.map(([a, b], slot) => ({ room_id: room.id, round, slot, a, b, questions: sets[slot], status: 'playing' }));
  if (bye) rows.push({ room_id: room.id, round, slot: pairs.length, a: bye, b: null as unknown as string, questions: [], status: 'done' });
  const { data: made, error } = await admin.from('battle_matches').insert(rows).select('id, a, b, slot');
  if (error || !made) return { error: 'db' };
  const progRows = (made as { id: string; a: string; b: string | null }[]).filter((m) => m.b).flatMap((m) => [
    { match_id: m.id, student_id: m.a }, { match_id: m.id, student_id: m.b! },
  ]);
  if (progRows.length) await admin.from('battle_progress').insert(progRows);
  if (bye) {
    const byeMatch = (made as { id: string; b: string | null }[]).find((m) => !m.b);
    if (byeMatch) await admin.from('battle_matches').update({ winner: bye, reason: 've', finished_at: now }).eq('id', byeMatch.id);
    const p = players.find((x) => x.student_id === bye);
    await admin.from('battle_players').update({ byes: (p?.byes ?? 0) + 1 }).eq('room_id', room.id).eq('student_id', bye);
  }
  return {};
}

/** Bộ câu hợp lệ: 3–10 câu, câu nào cũng có đề và đáp án */
export function cleanSet(v: unknown, n: number): ExamItem[] | null {
  if (!Array.isArray(v) || v.length < Math.min(3, n) || v.length > 10) return null;
  const out: ExamItem[] = [];
  for (const x of v) {
    const q = x as ExamItem;
    if (!q || typeof q.prompt !== 'string' || !q.prompt.trim() || typeof q.type !== 'string' || !q.answer || typeof q.answer !== 'object') return null;
    out.push({ type: q.type, prompt: q.prompt.slice(0, 2000), options: Array.isArray(q.options) ? q.options.slice(0, 10).map(String) : [],
      left: Array.isArray(q.left) ? q.left.map(String) : undefined, blanks: Array.isArray(q.blanks) ? q.blanks.map(String) : undefined,
      statements: Array.isArray(q.statements) ? q.statements.map(String) : undefined, answer: q.answer,
      explanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 2000) : undefined,
      lessonTitle: typeof q.lessonTitle === 'string' ? q.lessonTitle.slice(0, 200) : undefined,
      muc: q.muc === 1 || q.muc === 2 || q.muc === 3 ? q.muc : undefined, pts: 1 });
  }
  return out;
}

/** Mã phòng 6 ký tự (bỏ chữ dễ nhầm I, O, 0, 1) */
export function newCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => abc[randomInt(0, abc.length)]).join('');
}
