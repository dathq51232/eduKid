import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { teacherOf } from '@/lib/classroom/battle-auth';
import { itemSig } from '@/lib/classroom/battle';
import { cleanSet, drawRound, finishMatch, isMissingTable, loadAll, loadRoom, settle, type RoomRow } from '@/lib/classroom/battle-server';

// ĐẤU CẶP MẮT XÍCH (migration 0073) — màn chiếu của cô.
//   GET  -> trạng thái phòng: em trong phòng, các trận (tiến độ, số câu đúng, thời gian), câu đã dùng (để vòng sau không lặp)
//   POST { action: 'draw', sets }           bốc thăm vòng tiếp (sets: bộ câu cho từng trận, do máy cô sinh từ các bài đã chọn)
//        { action: 'force', matchId, winner } cô xử thắng (em mất mạng / bỏ dở)
//        { action: 'replay', matchId, set }   đấu lại trận với bộ câu mới
//        { action: 'close' }                  đóng phòng
const UUID = /^[0-9a-f-]{36}$/i;

async function guard(rid: string) {
  if (!UUID.test(rid)) return { err: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  if (!hasServiceRole()) return { err: NextResponse.json({ error: 'not_configured' }, { status: 503 }) };
  const admin = createAdminClient();
  const { data: room, error } = await loadRoom(admin, rid);
  if (error) return { err: NextResponse.json({ error: isMissingTable(error) ? 'missing_table' : 'db' }, { status: 500 }) };
  if (!room || !(await teacherOf(room.class_id))) return { err: NextResponse.json({ error: 'not_allowed' }, { status: 403 }) };
  return { admin, room };
}

async function state(admin: ReturnType<typeof createAdminClient>, room: RoomRow) {
  let all = await loadAll(admin, room);
  if (await settle(admin, room, all.matches, all.progs)) all = await loadAll(admin, room);
  const name = new Map(all.players.map((p) => [p.student_id, p.display_name]));
  return {
    room: { id: room.id, code: room.code, title: room.title, subject: room.subject, grade: room.grade, lessons: room.lessons,
      n: room.n_questions, sec: room.sec_per_q, status: room.status, round: room.round, champion: room.champion, championName: room.champion ? name.get(room.champion) ?? '' : null },
    players: all.players.map((p) => ({ id: p.student_id, name: p.display_name, out: p.out_round, byes: p.byes })),
    matches: all.matches.map((m) => {
      const pr = (sid: string | null) => {
        const p = sid ? all.progs.find((x) => x.match_id === m.id && x.student_id === sid) : undefined;
        return p ? { i: p.i, correct: p.correct, ms: p.time_ms, done: !!p.finished_at } : null;
      };
      return { id: m.id, round: m.round, slot: m.slot, n: m.questions.length, a: m.a, b: m.b, aName: name.get(m.a) ?? '', bName: m.b ? name.get(m.b) ?? '' : null,
        status: m.status, winner: m.winner, reason: m.reason, pa: pr(m.a), pb: pr(m.b) };
    }),
    used: [...new Set(all.matches.flatMap((m) => m.questions.map(itemSig)))],
    serverNow: new Date().toISOString(),
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ rid: string }> }) {
  const g = await guard((await params).rid);
  if ('err' in g) return g.err;
  return NextResponse.json(await state(g.admin, g.room), { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request, { params }: { params: Promise<{ rid: string }> }) {
  const g = await guard((await params).rid);
  if ('err' in g) return g.err;
  const { admin, room } = g;
  const b = (await request.json().catch(() => ({}))) as { action?: string; sets?: unknown; set?: unknown; matchId?: string; winner?: string };
  if (room.status === 'closed') return NextResponse.json({ error: 'closed' }, { status: 409 });

  if (b.action === 'close') {
    await admin.from('battle_rooms').update({ status: 'closed' }).eq('id', room.id);
    room.status = 'closed';
    return NextResponse.json(await state(admin, room));
  }

  const all = await loadAll(admin, room);
  await settle(admin, room, all.matches, all.progs);

  if (b.action === 'draw') {
    if (room.status === 'done') return NextResponse.json({ error: 'closed' }, { status: 409 });
    if (all.matches.some((m) => m.round === room.round && m.status !== 'done')) return NextResponse.json({ error: 'round_running' }, { status: 409 });
    const sets = Array.isArray(b.sets) ? b.sets.map((s) => cleanSet(s, room.n_questions)) : [];
    if (!sets.length || sets.some((s) => !s)) return NextResponse.json({ error: 'bad_sets' }, { status: 400 });
    const r = await drawRound(admin, room, all.players, sets as NonNullable<(typeof sets)[number]>[]);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.error === 'db' ? 500 : 409 });
    return NextResponse.json(await state(admin, room));
  }

  const m = all.matches.find((x) => x.id === b.matchId);
  if (!m || m.round !== room.round || !m.b) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (b.action === 'force') {
    if (m.status !== 'playing' || (b.winner !== m.a && b.winner !== m.b)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await finishMatch(admin, room, m, b.winner, 'xu');
    return NextResponse.json(await state(admin, room));
  }

  if (b.action === 'replay') {
    const set = cleanSet(b.set, room.n_questions);
    if (!set) return NextResponse.json({ error: 'bad_sets' }, { status: 400 });
    // trận đã xử xong: trả em dừng lại về trạng thái còn đấu trước khi đấu lại
    if (m.status === 'done') {
      if (room.status === 'done') return NextResponse.json({ error: 'closed' }, { status: 409 });
      await admin.from('battle_players').update({ out_round: null }).eq('room_id', room.id).in('student_id', [m.a, m.b]).eq('out_round', m.round);
    }
    await admin.from('battle_matches').update({ questions: set, status: 'playing', winner: null, reason: null, finished_at: null, started_at: new Date().toISOString() }).eq('id', m.id);
    await admin.from('battle_progress').update({ i: 0, served_at: null, answers: [], correct: 0, time_ms: 0, finished_at: null }).eq('match_id', m.id);
    return NextResponse.json(await state(admin, room));
  }

  return NextResponse.json({ error: 'invalid' }, { status: 400 });
}
