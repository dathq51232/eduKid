import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { teacherOf } from '@/lib/classroom/battle-auth';
import { battleView, cleanSet, createRound, isMissingTable, loadBattles, settle, type BattleRow } from '@/lib/classroom/battle-server';

// ĐẤU CẶP trong PHÒNG THI LỚP (migration 0073) — thao tác của cô trên một đấu cặp.
//   POST { action: 'next', sets, opens, closes } mở vòng sau: bốc thăm các em thắng, tạo phòng thi mới (đề mới, khó hơn)
//        { action: 'force', pairId, winner }    cô xử thắng một cặp (em vắng, gặp sự cố…)
//        { action: 'close' }                    kết thúc đấu cặp
// Trả về trạng thái mới của đấu cặp (giống GET /api/giao-vien/dau-cap).
export async function POST(request: Request, { params }: { params: Promise<{ bid: string }> }) {
  const { bid } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(bid)) return NextResponse.json({ error: 'not_allowed' }, { status: 404 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const admin = createAdminClient();
  const d = await loadBattles(admin, { id: bid });
  if ('error' in d) return NextResponse.json({ error: isMissingTable(d.error) ? 'missing_table' : 'db' }, { status: 500 });
  const battle = d.battles[0] as BattleRow | undefined;
  const userId = battle ? await teacherOf(battle.class_id) : null;
  if (!battle || !userId) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (battle.status !== 'playing') return NextResponse.json({ error: 'closed' }, { status: 409 });
  await settle(admin, d);
  const b = (await request.json().catch(() => ({}))) as { action?: string; sets?: unknown; opens?: string; closes?: string; pairId?: string; winner?: string };
  const cur = d.pairs.filter((p) => p.round === battle.round);

  if (b.action === 'close') {
    await admin.from('battles').update({ status: 'closed' }).eq('id', battle.id);
  } else if (b.action === 'force') {
    const p = cur.find((x) => x.id === b.pairId);
    if (!p || p.winner || !p.b || (b.winner !== p.a && b.winner !== p.b)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await admin.from('battle_pairs').update({ winner: b.winner, reason: 'xu', decided_at: new Date().toISOString() }).eq('id', p.id).is('winner', null);
  } else if (b.action === 'next') {
    if (battle.status !== 'playing' || cur.some((p) => !p.winner)) return NextResponse.json({ error: 'round_running' }, { status: 409 });
    const winners = cur.map((p) => p.winner!);
    if (winners.length < 2) return NextResponse.json({ error: 'closed' }, { status: 409 });
    const opens = Date.parse(String(b.opens ?? '')), closes = Date.parse(String(b.closes ?? ''));
    if (!Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens || closes < Date.now()) return NextResponse.json({ error: 'invalid_window' }, { status: 400 });
    const sets = Array.isArray(b.sets) ? b.sets.map(cleanSet) : [];
    if (sets.length < Math.floor(winners.length / 2) || sets.some((s) => !s)) return NextResponse.json({ error: 'bad_sets' }, { status: 400 });
    const round = battle.round + 1;
    // chuyển vòng trước (điều kiện vòng cũ) để hai lần bấm cùng lúc không tạo hai vòng
    const { data: moved } = await admin.from('battles').update({ round }).eq('id', battle.id).eq('round', battle.round).select('id');
    if (!(moved ?? []).length) return NextResponse.json({ error: 'round_running' }, { status: 409 });
    const byes = (sid: string) => d.pairs.filter((p) => p.a === sid && !p.b).length;
    const r = await createRound(admin, {
      battle: { ...battle, round }, round, players: winners.map((id) => ({ id, byes: byes(id) })), sets: sets as NonNullable<(typeof sets)[number]>[],
      opens: new Date(opens).toISOString(), closes: new Date(closes).toISOString(), userId,
    });
    if (r.error) { await admin.from('battles').update({ round: battle.round }).eq('id', battle.id); return NextResponse.json({ error: r.error }, { status: 400 }); }
  } else {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  // battleView tự phân định lại (vd. sau khi xử thắng cặp cuối của vòng → có nhà vô địch)
  return NextResponse.json(await battleView(admin, { id: bid }));
}

// DELETE: cô xoá một đấu cặp ĐÃ KẾT THÚC (có vô địch hoặc đã bấm Kết thúc) — xoá luôn phòng thi từng vòng
// (bài làm trong các phòng đó), các cặp đấu tự xoá theo (on delete cascade). Đang đấu thì phải Kết thúc trước.
export async function DELETE(_request: Request, { params }: { params: Promise<{ bid: string }> }) {
  const { bid } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(bid)) return NextResponse.json({ error: 'not_allowed' }, { status: 404 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const admin = createAdminClient();
  const { data: battle, error } = await admin.from('battles').select('id, class_id, status').eq('id', bid).maybeSingle();
  if (error) return NextResponse.json({ error: isMissingTable(error) ? 'missing_table' : 'db' }, { status: 500 });
  const userId = battle ? await teacherOf(battle.class_id as string) : null;
  if (!battle || !userId) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (battle.status === 'playing') return NextResponse.json({ error: 'still_playing' }, { status: 409 });
  const rooms = await admin.from('exam_rooms').delete().eq('battle_id', bid).eq('class_id', battle.class_id);
  if (rooms.error) return NextResponse.json({ error: 'db' }, { status: 500 });
  const del = await admin.from('battles').delete().eq('id', bid);
  if (del.error) return NextResponse.json({ error: 'db' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
