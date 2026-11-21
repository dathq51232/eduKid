import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { studentOf } from '@/lib/classroom/battle-auth';
import { loadBattles, namesOf, settle } from '@/lib/classroom/battle-server';
import { miloStop, roundName } from '@/lib/classroom/battle';

// ĐẤU CẶP trong PHÒNG THI LỚP (migration 0073) — em xem trận của mình trong một phòng thi.
//   GET ?room=<id phòng thi> -> { battle: null } (phòng thường) hoặc { battle: { title, round, opponent, phase, ... } }
// Kết quả của bạn (số câu đúng, thời gian) chỉ hiện khi cặp đã phân định.
export async function GET(request: Request) {
  const room = new URL(request.url).searchParams.get('room') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(room)) return NextResponse.json({ battle: null });
  const sid = await studentOf();
  if (!sid || !hasServiceRole()) return NextResponse.json({ battle: null });
  const admin = createAdminClient();
  const { data: er, error } = await admin.from('exam_rooms').select('battle_id').eq('id', room).maybeSingle();
  if (error || !er?.battle_id) return NextResponse.json({ battle: null });
  const d = await loadBattles(admin, { id: er.battle_id as string });
  if ('error' in d || !d.battles.length) return NextResponse.json({ battle: null });
  await settle(admin, d);
  const b = d.battles[0];
  const pair = d.pairs.find((p) => p.room_id === room && (p.a === sid || p.b === sid));
  if (!pair) return NextResponse.json({ battle: null });
  const oppId = pair.a === sid ? pair.b : pair.a;
  const names = await namesOf(admin, [oppId ?? '', b.champion ?? ''].filter(Boolean));
  const alive = d.pairs.filter((p) => p.round === pair.round).reduce((n, p) => n + (p.b ? 2 : 1), 0);
  const sub = (id: string | null) => {
    const r = id ? d.results.find((x) => x.room_id === room && x.student_id === id) : undefined;
    return r ? { correct: r.correct, ms: r.duration_ms } : null;
  };
  const decided = !!pair.winner;
  const phase = !decided ? 'cho' : pair.winner === sid ? (b.status === 'done' && b.champion === sid ? 'vo_dich' : 'thang') : 'dung';
  return NextResponse.json({
    battle: {
      title: b.title, round: pair.round, roundName: roundName(alive), opponent: oppId ? names.get(oppId) ?? '' : null, phase, reason: pair.reason,
      me: sub(sid), opp: decided ? sub(oppId) : null, milo: phase === 'dung' ? miloStop(pair.round) : null,
      championName: b.champion ? names.get(b.champion) ?? '' : null, nextOpen: phase === 'thang' && b.round > pair.round,
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
