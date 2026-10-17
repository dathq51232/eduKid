import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';
import type { AchievementsPayload, BoardRow, MyAchievements } from '@/lib/achievements';

export const dynamic = 'force-dynamic';

// Thành tích thật + bảng điểm cao nhất tuần/tháng của MỘT lớp (migration 0012).
// Học sinh: lớp của chính em. Thầy cô: truyền ?lop=<id lớp mình dạy>. Quyền xem kiểm tra trong database.
export async function GET(request: Request) {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'signed_out' }, { status: 401 });
  const supabase = await createClient();
  const nocache = { headers: { 'cache-control': 'no-store' } };

  let me: MyAchievements | null = null;
  let classId: string | null = null;
  if (viewer.isStudent) {
    const { data, error } = await supabase.rpc('my_achievements');
    if (error) {
      console.error('[thanh-tich] my_achievements failed:', error.code, error.message);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
    me = ((data ?? []) as MyAchievements[])[0] ?? null;
    classId = me?.class_id ?? null;
  } else {
    const lop = new URL(request.url).searchParams.get('lop');
    if (!lop || !/^[0-9a-f-]{36}$/i.test(lop)) return NextResponse.json({ error: 'not_student' }, { status: 403 });
    classId = lop;
  }

  if (!classId) return NextResponse.json({ me, classId: null, week: [], month: [], at: new Date().toISOString() } satisfies AchievementsPayload, nocache);
  const [w, m] = await Promise.all([
    supabase.rpc('class_leaderboard', { p_class: classId, p_period: 'week', p_limit: 5 }),
    supabase.rpc('class_leaderboard', { p_class: classId, p_period: 'month', p_limit: 5 }),
  ]);
  if (w.error || m.error) {
    const e = w.error ?? m.error;
    if (e?.message?.includes('not_allowed')) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
    console.error('[thanh-tich] class_leaderboard failed:', e?.code, e?.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  return NextResponse.json({ me, classId, week: (w.data ?? []) as BoardRow[], month: (m.data ?? []) as BoardRow[], at: new Date().toISOString() } satisfies AchievementsPayload, nocache);
}
