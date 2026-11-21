import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { studentOf } from '@/lib/classroom/battle-auth';
import { isMissingTable } from '@/lib/classroom/battle-server';
import { rateLimit } from '@/lib/rate-limit';

// ĐẤU CẶP MẮT XÍCH (migration 0073) — em nhập mã phòng để vào sảnh chờ. Chỉ vào được khi cô chưa bốc thăm.
//   POST { code } -> { id }
export async function POST(request: Request) {
  const sid = await studentOf();
  if (!sid) return NextResponse.json({ error: 'not_allowed' }, { status: 401 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (!rateLimit(`dc-vao:${sid}`, 30, 10 * 60_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });
  const b = (await request.json().catch(() => ({}))) as { code?: string };
  const code = String(b.code ?? '').replace(/\s/g, '').toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: room, error } = await admin.from('battle_rooms').select('id, class_id, status').eq('code', code).maybeSingle();
  if (error) return NextResponse.json({ error: isMissingTable(error) ? 'missing_table' : 'db' }, { status: 500 });
  if (!room) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data: mem } = await admin.from('class_memberships').select('student_id').eq('class_id', room.class_id).eq('student_id', sid).eq('status', 'active').maybeSingle();
  if (!mem) return NextResponse.json({ error: 'not_in_class' }, { status: 403 });
  const { data: me } = await admin.from('battle_players').select('student_id').eq('room_id', room.id).eq('student_id', sid).maybeSingle();
  if (me) return NextResponse.json({ id: room.id }); // đã vào rồi: mở lại phòng
  if (room.status === 'closed' || room.status === 'done') return NextResponse.json({ error: 'closed' }, { status: 409 });
  if (room.status !== 'lobby') return NextResponse.json({ error: 'started' }, { status: 409 });
  const { count } = await admin.from('battle_players').select('student_id', { count: 'exact', head: true }).eq('room_id', room.id);
  if ((count ?? 0) >= 60) return NextResponse.json({ error: 'full' }, { status: 409 });
  const { data: st } = await admin.from('students').select('display_name').eq('id', sid).maybeSingle();
  const { error: insErr } = await admin.from('battle_players').insert({ room_id: room.id, student_id: sid, display_name: String(st?.display_name ?? '').slice(0, 100) });
  if (insErr && insErr.code !== '23505') return NextResponse.json({ error: 'db' }, { status: 500 });
  return NextResponse.json({ id: room.id });
}
