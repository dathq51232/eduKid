import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { chessMe, GAME_COLS, isMissingTable, namesFor } from '@/lib/chess/online';
import { ONLINE_TCS, type GameRow } from '@/lib/chess/online-rules';
import { rateLimit } from '@/lib/rate-limit';

// Sảnh đấu cờ vua của trường. GET: lời mời đang chờ, ván của em, bảng điểm trường, bạn cùng lớp.
// POST: tạo lời mời (cả trường hoặc thách một bạn) / hủy lời mời / nhận lời → tạo ván.
type Seek = { id: string; student_id: string; to_student: string | null; base: number; inc: number; color: 'w' | 'b' | 'r'; created_at: string };
const SEEK_TTL_MS = 30 * 60_000; // lời mời treo quá 30 phút thì tự ẩn
const MAX_ACTIVE = 3;

function fail(error: string, status = 400) { return NextResponse.json({ error }, { status }); }

export async function GET() {
  const who = await chessMe();
  if (!who.ok) return fail(who.error, who.error === 'signed_out' ? 401 : 403);
  const { me } = who;
  const db = createAdminClient();
  const since = new Date(Date.now() - SEEK_TTL_MS).toISOString();
  const { data: myCls } = await db.from('class_memberships').select('class_id').eq('student_id', me.studentId).eq('status', 'active').order('joined_at', { ascending: false }).limit(1);
  const classId = (myCls?.[0] as { class_id?: string } | undefined)?.class_id;
  const [seeks, games, top, myRating, mates] = await Promise.all([
    db.from('chess_seeks').select('id, student_id, to_student, base, inc, color, created_at').eq('school_id', me.schoolId).gte('created_at', since).order('created_at', { ascending: false }).limit(40),
    db.from('chess_games').select(GAME_COLS).or(`white.eq.${me.studentId},black.eq.${me.studentId}`).order('created_at', { ascending: false }).limit(12),
    db.from('chess_ratings').select('student_id, rating, games, wins, draws, losses').eq('school_id', me.schoolId).gt('games', 0).order('rating', { ascending: false }).limit(10),
    db.from('chess_ratings').select('rating, games, wins, draws, losses').eq('student_id', me.studentId).maybeSingle(),
    classId ? db.from('class_memberships').select('student_id').eq('class_id', classId).eq('status', 'active').limit(60) : Promise.resolve({ data: [] }),
  ]);
  if (seeks.error) return fail(isMissingTable(seeks.error.message) ? 'missing' : 'server', 500);

  const seekRows = ((seeks.data ?? []) as Seek[]).filter((s) => !s.to_student || s.to_student === me.studentId || s.student_id === me.studentId);
  const gameRows = (games.data ?? []) as GameRow[];
  const topRows = (top.data ?? []) as { student_id: string; rating: number; games: number; wins: number; draws: number; losses: number }[];
  const mateIds = ((mates.data ?? []) as { student_id: string }[]).map((m) => m.student_id).filter((id) => id !== me.studentId);
  const names = await namesFor([...seekRows.flatMap((s) => [s.student_id, s.to_student ?? '']), ...gameRows.flatMap((g) => [g.white, g.black]), ...topRows.map((t) => t.student_id), ...mateIds]);
  const nm = (id: string) => names[id] ?? { name: 'Bạn', cls: '' };
  const mine = seekRows.find((s) => s.student_id === me.studentId);

  return NextResponse.json({
    me: { id: me.studentId, name: me.name, cls: me.className, rating: (myRating.data as { rating?: number } | null)?.rating ?? 1000, stats: myRating.data ?? { games: 0, wins: 0, draws: 0, losses: 0 } },
    mySeek: mine ? { id: mine.id, base: mine.base, inc: mine.inc, color: mine.color, created_at: mine.created_at, to: mine.to_student ? nm(mine.to_student) : null } : null,
    seeks: seekRows.filter((s) => s.student_id !== me.studentId).map((s) => ({ id: s.id, base: s.base, inc: s.inc, color: s.color, created_at: s.created_at, by: nm(s.student_id), personal: s.to_student === me.studentId })),
    games: gameRows.map((g) => {
      const mine = g.white === me.studentId ? 'w' : 'b';
      const opp = mine === 'w' ? g.black : g.white;
      return { id: g.id, color: mine, opp: nm(opp), status: g.status, result: g.result, reason: g.reason, base: g.base, inc: g.inc, ply: g.ply, myTurn: g.status === 'active' && (g.ply % 2 === 0 ? 'w' : 'b') === mine, created_at: g.created_at };
    }),
    top: topRows.map((t, i) => ({ rank: i + 1, ...nm(t.student_id), rating: t.rating, games: t.games, wins: t.wins, isMe: t.student_id === me.studentId })),
    mates: mateIds.map((id) => ({ id, ...nm(id) })).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
  });
}

export async function POST(req: Request) {
  const who = await chessMe();
  if (!who.ok) return fail(who.error, who.error === 'signed_out' ? 401 : 403);
  const { me } = who;
  if (!rateLimit(`chess-lobby:${me.studentId}`, 40, 60_000)) return fail('rate', 429);
  const body = (await req.json().catch(() => ({}))) as { action?: string; base?: unknown; inc?: unknown; color?: unknown; to?: unknown; id?: unknown };
  const db = createAdminClient();

  if (body.action === 'cancel') {
    await db.from('chess_seeks').delete().eq('student_id', me.studentId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'seek') {
    const tc = ONLINE_TCS.find((t) => t.base === body.base && t.inc === body.inc);
    if (!tc) return fail('bad_tc');
    const color = body.color === 'w' || body.color === 'b' ? body.color : 'r';
    let to: string | null = null;
    if (typeof body.to === 'string' && body.to) {
      // Chỉ thách được bạn cùng trường
      const { data: t } = await db.from('class_memberships').select('student_id, classes!inner(school_id, status)').eq('student_id', body.to).eq('status', 'active').eq('classes.school_id', me.schoolId).limit(1);
      if (!t?.length || body.to === me.studentId) return fail('bad_target');
      to = body.to;
    }
    const { error } = await db.from('chess_seeks').upsert({ school_id: me.schoolId, student_id: me.studentId, to_student: to, base: tc.base, inc: tc.inc, color, created_at: new Date().toISOString() }, { onConflict: 'student_id' });
    if (error) return fail(isMissingTable(error.message) ? 'missing' : 'server', 500);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'accept') {
    if (typeof body.id !== 'string') return fail('seek_gone');
    const { count } = await db.from('chess_games').select('id', { count: 'exact', head: true }).eq('status', 'active').or(`white.eq.${me.studentId},black.eq.${me.studentId}`);
    if ((count ?? 0) >= MAX_ACTIVE) return fail('too_many_games', 409);
    // Kiểm tra lời mời (cùng trường, không phải của mình, mời cả trường hoặc mời đúng em, chưa hết hạn)…
    const { data: found } = await db.from('chess_seeks').select('id, student_id, to_student, base, inc, color, created_at').eq('id', body.id).eq('school_id', me.schoolId).maybeSingle();
    const f = found as Seek | null;
    if (!f || f.student_id === me.studentId || (f.to_student && f.to_student !== me.studentId) || Date.parse(f.created_at) < Date.now() - SEEK_TTL_MS) return fail('seek_gone', 409);
    // …rồi xóa đúng dòng đó: ai xóa được trước thì người đó nhận lời (tránh hai bạn cùng nhận một lời mời)
    const { data: taken } = await db.from('chess_seeks').delete().eq('id', f.id).eq('student_id', f.student_id).select('student_id, base, inc, color');
    const s = (taken?.[0] as Pick<Seek, 'student_id' | 'base' | 'inc' | 'color'> | undefined);
    if (!s) return fail('seek_gone', 409);
    const hostWhite = s.color === 'w' ? true : s.color === 'b' ? false : Math.random() < 0.5;
    const { data: g, error } = await db.from('chess_games').insert({
      school_id: me.schoolId, white: hostWhite ? s.student_id : me.studentId, black: hostWhite ? me.studentId : s.student_id,
      base: s.base, inc: s.inc, white_ms: s.base * 1000, black_ms: s.base * 1000, turn_at: new Date().toISOString(),
    }).select('id').single();
    if (error || !g) return fail('server', 500);
    await db.from('chess_seeks').delete().eq('student_id', me.studentId); // nhận lời thì bỏ lời mời của chính mình
    return NextResponse.json({ ok: true, gameId: (g as { id: string }).id });
  }
  return fail('bad_action');
}
