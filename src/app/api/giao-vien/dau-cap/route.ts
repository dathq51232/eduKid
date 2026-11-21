import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { teacherOf } from '@/lib/classroom/battle-auth';
import { isMissingTable, newCode } from '@/lib/classroom/battle-server';
import { rateLimit } from '@/lib/rate-limit';

// ĐẤU CẶP MẮT XÍCH (migration 0073) — giáo viên: danh sách phòng đấu của lớp (GET ?classId=) và tạo phòng (POST).
const LESSON = /^[a-z0-9][a-z0-9-]{0,79}$/i;

export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get('classId') ?? '';
  if (!(await teacherOf(classId))) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const { data, error } = await createAdminClient().from('battle_rooms')
    .select('id, code, title, subject, n_questions, sec_per_q, status, round, created_at')
    .eq('class_id', classId).order('created_at', { ascending: false }).limit(30);
  if (error) return NextResponse.json({ error: isMissingTable(error) ? 'missing_table' : 'db' }, { status: 500 });
  return NextResponse.json({ rooms: data ?? [] });
}

export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as { classId?: string; title?: string; subject?: string; lessons?: unknown; n?: number; sec?: number };
  const userId = await teacherOf(String(b.classId ?? ''));
  if (!userId) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (!rateLimit(`dc-tao:${userId}`, 30, 60 * 60_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });

  const title = String(b.title ?? '').trim().slice(0, 200);
  const subject = String(b.subject ?? '');
  const lessons = Array.isArray(b.lessons) ? [...new Set(b.lessons.map(String).filter((x) => LESSON.test(x)))].slice(0, 60) : [];
  const n = Math.round(Number(b.n)), sec = Math.round(Number(b.sec));
  if (title.length < 2 || !['toan', 'tieng-viet', 'tieng-anh'].includes(subject) || !lessons.length || !(n >= 3 && n <= 10) || !(sec >= 10 && sec <= 180)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: cls } = await admin.from('classes').select('id, grade, status').eq('id', b.classId!).maybeSingle();
  if (!cls || cls.status !== 'active') return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  for (let k = 0; k < 8; k++) {
    const { data, error } = await admin.from('battle_rooms').insert({
      class_id: cls.id, code: newCode(), title, subject, grade: cls.grade, lessons, n_questions: n, sec_per_q: sec, created_by: userId,
    }).select('id, code').single();
    if (!error && data) return NextResponse.json(data);
    if (isMissingTable(error)) return NextResponse.json({ error: 'missing_table' }, { status: 500 });
    if (error?.code !== '23505') return NextResponse.json({ error: 'db' }, { status: 500 });
  }
  return NextResponse.json({ error: 'db' }, { status: 500 });
}
