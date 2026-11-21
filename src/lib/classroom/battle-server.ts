import 'server-only';
import { randomInt } from 'node:crypto';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { ExamItem } from './assignments';
import { decidePair, pairUp, shuffled, type Sub, type WinReason } from './battle';

// ĐẤU CẶP trong PHÒNG THI LỚP — phần máy chủ (migration 0073). Mỗi vòng = một phòng thi (exam_rooms, battle_id, battle_round).
// Phân định khi đọc (cô xem bảng, em xem kết quả): hai em đã nộp → so câu đúng rồi thời gian; phòng hết giờ mà một em
// không nộp → em kia thắng. Vòng xong mà còn đúng 1 em → nhà vô địch.

type Admin = ReturnType<typeof createAdminClient>;
export type BattleRow = { id: string; class_id: string; title: string; subject: string; plan: Record<string, unknown>; minutes: number; status: 'playing' | 'done' | 'closed'; round: number; champion: string | null; created_at: string };
export type PairRow = { id: string; battle_id: string; round: number; slot: number; a: string; b: string | null; room_id: string | null; winner: string | null; reason: WinReason | null; decided_at: string | null };
type RoomLite = { id: string; code: string; status: string; opens_at: string; closes_at: string };
type ResRow = Sub & { room_id: string; student_id: string };

const BATTLE_COLS = 'id, class_id, title, subject, plan, minutes, status, round, champion, created_at';
const PAIR_COLS = 'id, battle_id, round, slot, a, b, room_id, winner, reason, decided_at';

export const isMissingTable = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || e.code === '42703' || /battle|does not exist|schema cache/i.test(e.message ?? ''));

export const cryptoRand = () => randomInt(0, 2 ** 32) / 2 ** 32;

function rng(seed: number) {
  let s = (seed ^ 0x9e3779b9) >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

/** Đề chung của cặp → bản của một em: đảo câu trong từng mức (câu dễ vẫn ở đầu) và đảo phương án */
function paperFor(base: ExamItem[], seed: number): ExamItem[] {
  const r = rng(seed);
  return [1, 2, 3].flatMap((k) => shuffled(base.filter((q) => (q.muc ?? 1) === k), r)).map((q) => {
    if (q.type === 'grouping') return { ...q, left: shuffled(q.left ?? [], r) };
    if (['single_choice', 'multiple_choice', 'matching', 'pair_grid'].includes(q.type)) return { ...q, options: shuffled(q.options ?? [], r) };
    return q;
  });
}

/** Bộ câu hợp lệ: 3–40 câu, câu nào cũng có đề và đáp án */
export function cleanSet(v: unknown): ExamItem[] | null {
  if (!Array.isArray(v) || v.length < 3 || v.length > 40) return null;
  const out: ExamItem[] = [];
  for (const x of v) {
    const q = x as ExamItem;
    if (!q || typeof q.prompt !== 'string' || !q.prompt.trim() || typeof q.type !== 'string' || !q.answer || typeof q.answer !== 'object') return null;
    out.push({ type: q.type, prompt: q.prompt.slice(0, 2000), options: Array.isArray(q.options) ? q.options.slice(0, 10).map(String) : [],
      left: Array.isArray(q.left) ? q.left.map(String) : undefined, blanks: Array.isArray(q.blanks) ? q.blanks.map(String) : undefined,
      statements: Array.isArray(q.statements) ? q.statements.map(String) : undefined, answer: q.answer,
      explanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 2000) : undefined,
      lessonTitle: typeof q.lessonTitle === 'string' ? q.lessonTitle.slice(0, 200) : undefined,
      muc: q.muc === 1 || q.muc === 2 || q.muc === 3 ? q.muc : undefined, pts: Number.isFinite(q.pts) && q.pts > 0 ? Math.min(q.pts, 10) : 1 });
  }
  return out;
}

function newCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => abc[randomInt(0, abc.length)]).join('');
}

/**
 * Tạo một vòng: bốc thăm (crypto), tạo phòng thi của vòng, đề chung cho từng cặp (mỗi em đảo câu / phương án),
 * em lẻ nhận vé đi tiếp. Trả về mã phòng.
 */
export async function createRound(admin: Admin, p: {
  battle: BattleRow; round: number; players: { id: string; byes: number }[]; sets: ExamItem[][];
  opens: string; closes: string; userId: string;
}): Promise<{ code?: string; error?: string }> {
  if (p.players.length < 2) return { error: 'too_few' };
  const { pairs, bye } = pairUp(p.players, cryptoRand);
  if (p.sets.length < pairs.length) return { error: 'bad_sets' };
  const n = Math.max(...p.sets.slice(0, pairs.length).map((s) => s.length));
  let room: { id: string; code: string } | null = null;
  for (let k = 0; k < 8 && !room; k++) {
    const { data, error } = await admin.from('exam_rooms').insert({
      class_id: p.battle.class_id, code: newCode(), title: `${p.battle.title} · Vòng ${p.round}`.slice(0, 200), subject: p.battle.subject,
      n_questions: n, minutes: p.battle.minutes, opens_at: p.opens, closes_at: p.closes,
      matrix: { ...p.battle.plan, mode: 'chung', battle: true }, created_by: p.userId, battle_id: p.battle.id, battle_round: p.round,
    }).select('id, code').single();
    if (data) room = data as { id: string; code: string };
    else if (error?.code !== '23505') return { error: isMissingTable(error) ? 'missing_table' : 'db' };
  }
  if (!room) return { error: 'db' };
  const salt = randomInt(0, 2 ** 31);
  const papers = pairs.flatMap(([a, b], k) => [a, b].map((sid, j) => ({ room_id: room!.id, student_id: sid, questions: paperFor(p.sets[k], salt + k * 7 + j) })));
  const { error: pe } = await admin.from('exam_room_papers').insert(papers);
  if (pe) { await admin.from('exam_rooms').delete().eq('id', room.id); return { error: 'db' }; }
  const now = new Date().toISOString();
  const rows = pairs.map(([a, b], slot) => ({ battle_id: p.battle.id, round: p.round, slot, a, b, room_id: room!.id }));
  if (bye) rows.push({ battle_id: p.battle.id, round: p.round, slot: pairs.length, a: bye, b: null as unknown as string, room_id: null as unknown as string, winner: bye, reason: 've', decided_at: now } as never);
  const { error: re } = await admin.from('battle_pairs').insert(rows);
  if (re) return { error: 'db' };
  return { code: room.code };
}

/** Đọc đầy đủ một nhóm đấu cặp: các cặp, phòng của từng vòng, kết quả nộp bài */
export async function loadBattles(admin: Admin, filter: { classId?: string; id?: string }) {
  let q = admin.from('battles').select(BATTLE_COLS).order('created_at', { ascending: false }).limit(10);
  if (filter.id) q = q.eq('id', filter.id);
  if (filter.classId) q = q.eq('class_id', filter.classId);
  const { data: battles, error } = await q;
  if (error) return { error };
  const bs = (battles ?? []) as BattleRow[];
  if (!bs.length) return { battles: bs, pairs: [] as PairRow[], rooms: [] as RoomLite[], results: [] as ResRow[] };
  const { data: pairs } = await admin.from('battle_pairs').select(PAIR_COLS).in('battle_id', bs.map((b) => b.id)).order('round').order('slot');
  const ps = (pairs ?? []) as PairRow[];
  const roomIds = [...new Set(ps.map((x) => x.room_id).filter(Boolean))] as string[];
  const [{ data: rooms }, { data: results }] = roomIds.length
    ? await Promise.all([
      admin.from('exam_rooms').select('id, code, status, opens_at, closes_at').in('id', roomIds),
      admin.from('exam_room_results').select('room_id, student_id, correct, duration_ms, created_at').in('room_id', roomIds),
    ])
    : [{ data: [] }, { data: [] }];
  return { battles: bs, pairs: ps, rooms: (rooms ?? []) as RoomLite[], results: (results ?? []) as ResRow[] };
}

/** Phân định các cặp đủ điều kiện; vòng xong mà còn 1 em → nhà vô địch. Trả về true nếu có thay đổi. */
export async function settle(admin: Admin, d: { battles: BattleRow[]; pairs: PairRow[]; rooms: RoomLite[]; results: ResRow[] }) {
  let changed = false;
  const now = Date.now();
  for (const b of d.battles.filter((x) => x.status === 'playing')) {
    const cur = d.pairs.filter((x) => x.battle_id === b.id && x.round === b.round);
    for (const p of cur.filter((x) => !x.winner && x.b && x.room_id)) {
      const room = d.rooms.find((r) => r.id === p.room_id);
      const ended = !room || room.status !== 'open' || Date.parse(room.closes_at) < now;
      const sub = (sid: string) => d.results.find((r) => r.room_id === p.room_id && r.student_id === sid) ?? null;
      const dec = decidePair(sub(p.a), sub(p.b!), ended);
      if (!dec) continue;
      const winner = dec.winner === 'a' ? p.a : p.b!;
      const { data } = await admin.from('battle_pairs').update({ winner, reason: dec.reason, decided_at: new Date().toISOString() })
        .eq('id', p.id).is('winner', null).select('id');
      if ((data ?? []).length) { p.winner = winner; p.reason = dec.reason; changed = true; }
    }
    if (cur.length && cur.every((x) => x.winner)) {
      const winners = [...new Set(cur.map((x) => x.winner!))];
      if (winners.length === 1) {
        const { data } = await admin.from('battles').update({ status: 'done', champion: winners[0] }).eq('id', b.id).eq('status', 'playing').select('id');
        if ((data ?? []).length) { b.status = 'done'; b.champion = winners[0]; changed = true; }
      }
    }
  }
  return changed;
}

/** Tên các em (bảng students) */
export async function namesOf(admin: Admin, ids: string[]) {
  const uniq = [...new Set(ids)];
  if (!uniq.length) return new Map<string, string>();
  const { data } = await admin.from('students').select('id, display_name').in('id', uniq);
  return new Map(((data ?? []) as { id: string; display_name: string }[]).map((s) => [s.id, s.display_name]));
}

/** Trạng thái đấu cặp gửi cho trang của cô (đã phân định các cặp đủ điều kiện) */
export async function battleView(admin: Admin, filter: { classId?: string; id?: string }) {
  let d = await loadBattles(admin, filter);
  if ('error' in d) return { error: d.error };
  if (await settle(admin, d)) { const again = await loadBattles(admin, filter); if (!('error' in again)) d = again; }
  const names = await namesOf(admin, d.pairs.flatMap((p) => [p.a, p.b].filter(Boolean) as string[]));
  const res = (room: string | null, sid: string | null) => {
    const r = room && sid ? d.results.find((x) => x.room_id === room && x.student_id === sid) : undefined;
    return r ? { correct: r.correct, ms: r.duration_ms } : null;
  };
  return {
    battles: d.battles.map((b) => {
      const mine = d.pairs.filter((p) => p.battle_id === b.id);
      const rounds = [...new Set(mine.map((p) => p.round))].sort((x, y) => x - y).map((round) => {
        const ps = mine.filter((p) => p.round === round);
        const room = d.rooms.find((r) => r.id === ps.find((p) => p.room_id)?.room_id) ?? null;
        return {
          round, room: room && { id: room.id, code: room.code, opens: room.opens_at, closes: room.closes_at, status: room.status },
          pairs: ps.map((p) => ({ id: p.id, a: p.a, b: p.b, aName: names.get(p.a) ?? '', bName: p.b ? names.get(p.b) ?? '' : null,
            winner: p.winner, reason: p.reason, ra: res(p.room_id, p.a), rb: res(p.room_id, p.b) })),
        };
      });
      return { id: b.id, title: b.title, subject: b.subject, status: b.status, round: b.round, minutes: b.minutes, plan: b.plan,
        created_at: b.created_at, championName: b.champion ? names.get(b.champion) ?? '' : null, rounds };
    }),
  };
}
