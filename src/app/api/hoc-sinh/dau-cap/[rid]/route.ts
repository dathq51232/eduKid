import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { studentOf } from '@/lib/classroom/battle-auth';
import { cleanAnswer } from '@/lib/classroom/exam-grade';
import { gradeLocal } from '@/lib/grading';
import { itemForStudent, miloStop, orderFor, roundName, type Prog } from '@/lib/classroom/battle';
import { isMissingTable, loadAll, loadRoom, saveProg, settle, type MatchRow, type PlayerRow, type ProgRow, type RoomRow } from '@/lib/classroom/battle-server';
import { rateLimit } from '@/lib/rate-limit';
import type { AnswerValue } from '@/lib/types';

// ĐẤU CẶP MẮT XÍCH (migration 0073) — máy của em.
//   GET               -> trạng thái của em (sảnh chờ / câu đang làm / chờ bạn / kết quả trận / dừng lại / vô địch)
//   POST { i, answer } -> nộp câu số i (theo thứ tự của em); máy chủ chấm, đo thời gian, gửi câu tiếp
// Đáp án không bao giờ gửi về máy em; em không thấy đúng / sai từng câu, chỉ thấy kết quả khi trận xong.
const UUID = /^[0-9a-f-]{36}$/i;
type Admin = ReturnType<typeof createAdminClient>;

const isEmpty = (v: AnswerValue) => v === null || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);

async function guard(rid: string) {
  if (!UUID.test(rid)) return { err: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  const sid = await studentOf();
  if (!sid) return { err: NextResponse.json({ error: 'not_allowed' }, { status: 401 }) };
  if (!hasServiceRole()) return { err: NextResponse.json({ error: 'not_configured' }, { status: 503 }) };
  const admin = createAdminClient();
  const { data: room, error } = await loadRoom(admin, rid);
  if (error) return { err: NextResponse.json({ error: isMissingTable(error) ? 'missing_table' : 'db' }, { status: 500 }) };
  if (!room) return { err: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  return { admin, room, sid };
}

function result(m: MatchRow, sid: string, progs: ProgRow[]) {
  const mine = progs.find((p) => p.match_id === m.id && p.student_id === sid);
  const opp = progs.find((p) => p.match_id === m.id && p.student_id !== sid);
  return { won: m.winner === sid, reason: m.reason, myCorrect: mine?.correct ?? 0, oppCorrect: opp?.correct ?? 0, myMs: mine?.time_ms ?? 0, oppMs: opp?.time_ms ?? 0, total: m.questions.length };
}

async function state(admin: Admin, room: RoomRow, sid: string) {
  let all = await loadAll(admin, room);
  if (await settle(admin, room, all.matches, all.progs)) all = await loadAll(admin, room);
  const me = all.players.find((p) => p.student_id === sid);
  if (!me) return { error: 'not_in_room' as const };
  const name = new Map(all.players.map((p: PlayerRow) => [p.student_id, p.display_name]));
  const alive = all.players.filter((p) => p.out_round === null).length;
  const base = {
    room: { id: room.id, title: room.title, subject: room.subject, status: room.status, round: room.round, n: room.n_questions, sec: room.sec_per_q },
    me: { name: me.display_name }, players: all.players.length, alive, roundName: roundName(alive), serverNow: new Date().toISOString(),
    championName: room.champion ? name.get(room.champion) ?? '' : null,
  };
  const myMatches = all.matches.filter((m) => m.a === sid || m.b === sid);
  const cur = myMatches.find((m) => m.round === room.round);
  const last = myMatches[myMatches.length - 1];

  if (room.status === 'done' && room.champion === sid) return { ...base, phase: 'champion' as const, last: last?.b ? result(last, sid, all.progs) : null };
  if (me.out_round !== null) {
    const stop = myMatches.find((m) => m.round === me.out_round);
    const r = stop ? result(stop, sid, all.progs) : null;
    return { ...base, phase: 'out' as const, outRound: me.out_round, last: r, milo: miloStop(me.out_round, r?.myCorrect ?? 0, r?.total ?? room.n_questions),
      opponent: stop ? name.get(stop.a === sid ? stop.b ?? '' : stop.a) ?? '' : '' };
  }
  if (room.status === 'closed') return { ...base, phase: 'closed' as const };
  if (room.status === 'lobby' || !cur) return { ...base, phase: 'lobby' as const };
  if (!cur.b) return { ...base, phase: 'bye' as const };
  const oppId = cur.a === sid ? cur.b : cur.a;
  const mine = all.progs.find((p) => p.match_id === cur.id && p.student_id === sid);
  const opp = all.progs.find((p) => p.match_id === cur.id && p.student_id === oppId);
  const n = cur.questions.length;
  const vs = { opponent: name.get(oppId) ?? '', oppAt: Math.min(opp?.i ?? 0, n), oppDone: !!opp?.finished_at, total: n };
  if (cur.status === 'done') return { ...base, phase: 'won' as const, ...vs, last: result(cur, sid, all.progs) };
  if (!mine) return { ...base, phase: 'lobby' as const };
  if (mine.finished_at || mine.i >= n) return { ...base, phase: 'wait' as const, ...vs, myAt: n };

  // gửi câu đang làm; lần đầu gửi thì máy chủ đánh dấu giờ bắt đầu câu
  let served = mine.served_at;
  if (!served) {
    const at = new Date().toISOString();
    const { data } = await admin.from('battle_progress').update({ served_at: at }).eq('match_id', cur.id).eq('student_id', sid).eq('i', mine.i).is('served_at', null).select('served_at');
    served = (data?.[0]?.served_at as string | undefined) ?? at;
  }
  const order = orderFor(cur.id, sid, n);
  const item = itemForStudent(cur.questions[order[mine.i]], `${cur.id}:${sid}:${mine.i}`);
  const remainingMs = Math.max(0, new Date(served).getTime() + room.sec_per_q * 1000 - Date.now());
  return { ...base, phase: 'question' as const, ...vs, myAt: mine.i, i: mine.i, item, remainingMs };
}

export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const g = await guard((await params).rid);
  if ('err' in g) return g.err;
  if (!rateLimit(`dc-xem:${g.sid}`, 1500, 60 * 60_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });
  const s = await state(g.admin, g.room, g.sid);
  if ('error' in s) return NextResponse.json(s, { status: 403 });
  return NextResponse.json(s, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ rid: string }> }) {
  const g = await guard((await params).rid);
  if ('err' in g) return g.err;
  const { admin, room, sid } = g;
  if (!rateLimit(`dc-nop:${sid}`, 400, 60 * 60_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });
  const b = (await request.json().catch(() => ({}))) as { i?: number; answer?: unknown };
  const now = Date.now();

  if (room.status === 'playing') {
    const all = await loadAll(admin, room);
    await settle(admin, room, all.matches, all.progs); // câu quá giờ tính trước
    const cur = all.matches.find((m) => m.round === room.round && m.status === 'playing' && (m.a === sid || m.b === sid));
    const mine = cur ? all.progs.find((p) => p.match_id === cur.id && p.student_id === sid) : undefined;
    const n = cur?.questions.length ?? 0;
    if (cur && mine && !mine.finished_at && mine.served_at && Number(b.i) === mine.i && mine.i < n) {
      const q = cur.questions[orderFor(cur.id, sid, n)[mine.i]];
      const a = cleanAnswer(b.answer);
      const ok = !isEmpty(a) && !!q.answer && gradeLocal(q.type, a, q.answer);
      const ms = Math.min(Math.max(0, now - new Date(mine.served_at).getTime()), room.sec_per_q * 1000);
      const next: Prog = {
        i: mine.i + 1, answers: [...mine.answers, { i: mine.i, ok, ms }], correct: mine.correct + (ok ? 1 : 0), time_ms: mine.time_ms + ms,
        served_at: mine.i + 1 < n ? new Date(now).toISOString() : mine.served_at, finished_at: mine.i + 1 >= n ? new Date(now).toISOString() : null,
      };
      if (await saveProg(admin, { ...mine, ...next }, mine.i)) {
        Object.assign(mine, next);
        await settle(admin, room, all.matches, all.progs); // em xong câu cuối: có thể chốt trận ngay
      }
    }
  }
  const s = await state(admin, room, sid);
  if ('error' in s) return NextResponse.json(s, { status: 403 });
  return NextResponse.json(s);
}
