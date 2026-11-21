import { NextResponse } from 'next/server';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';
import { teacherOf } from '@/lib/classroom/battle-auth';
import { battleView, cleanSet, createRound, isMissingTable, type BattleRow } from '@/lib/classroom/battle-server';
import { rateLimit } from '@/lib/rate-limit';

// ĐẤU CẶP trong PHÒNG THI LỚP (migration 0073) — giáo viên.
//   GET  ?classId=  -> các đấu cặp của lớp: từng vòng (phòng thi, mã), từng cặp (kết quả, người thắng), nhà vô địch
//   POST            -> tạo đấu cặp + vòng 1: { classId, title, subject, minutes, opens, closes, plan, students, sets }
//                      sets: đề cho từng cặp (máy cô sinh theo quy tắc của phòng thi), máy chủ bốc thăm rồi gán đề cho cặp
export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get('classId') ?? '';
  if (!(await teacherOf(classId))) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const v = await battleView(createAdminClient(), { classId });
  if ('error' in v) return NextResponse.json({ error: isMissingTable(v.error ?? null) ? 'missing_table' : 'db' }, { status: 500 });
  return NextResponse.json(v, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as {
    classId?: string; title?: string; subject?: string; minutes?: number; opens?: string; closes?: string; plan?: unknown; students?: unknown; sets?: unknown;
  };
  const userId = await teacherOf(String(b.classId ?? ''));
  if (!userId) return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  if (!hasServiceRole()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  if (!rateLimit(`dc-tao:${userId}`, 30, 60 * 60_000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });

  const title = String(b.title ?? '').trim().slice(0, 180);
  const subject = String(b.subject ?? '');
  const minutes = Math.round(Number(b.minutes));
  const opens = Date.parse(String(b.opens ?? '')), closes = Date.parse(String(b.closes ?? ''));
  const students = Array.isArray(b.students) ? [...new Set(b.students.map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x)))].slice(0, 60) : [];
  const sets = Array.isArray(b.sets) ? b.sets.map(cleanSet) : [];
  const plan = b.plan && typeof b.plan === 'object' && !Array.isArray(b.plan) ? (b.plan as Record<string, unknown>) : {};
  if (title.length < 2 || !['toan', 'tieng-viet', 'tieng-anh'].includes(subject) || !(minutes >= 5 && minutes <= 90)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (!Number.isFinite(opens) || !Number.isFinite(closes) || closes <= opens || closes < Date.now() || closes > opens + 30 * 86400_000) return NextResponse.json({ error: 'invalid_window' }, { status: 400 });
  if (students.length < 2) return NextResponse.json({ error: 'too_few' }, { status: 400 });
  if (sets.length < Math.floor(students.length / 2) || sets.some((s) => !s)) return NextResponse.json({ error: 'bad_sets' }, { status: 400 });
  if (JSON.stringify(plan).length > 45000) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const admin = createAdminClient();
  const { data: cls } = await admin.from('classes').select('id, status').eq('id', b.classId!).maybeSingle();
  if (!cls || cls.status !== 'active') return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  const { data: mem } = await admin.from('class_memberships').select('student_id').eq('class_id', cls.id).eq('status', 'active').in('student_id', students);
  if ((mem ?? []).length !== students.length) return NextResponse.json({ error: 'student_not_in_class' }, { status: 400 });

  const { data: battle, error } = await admin.from('battles').insert({ class_id: cls.id, title, subject, plan, minutes, created_by: userId })
    .select('id, class_id, title, subject, plan, minutes, status, round, champion, created_at').single();
  if (error || !battle) return NextResponse.json({ error: isMissingTable(error) ? 'missing_table' : 'db' }, { status: 500 });
  const r = await createRound(admin, {
    battle: battle as BattleRow, round: 1, players: students.map((id) => ({ id, byes: 0 })), sets: sets as NonNullable<(typeof sets)[number]>[],
    opens: new Date(opens).toISOString(), closes: new Date(closes).toISOString(), userId,
  });
  if (r.error) { await admin.from('battles').delete().eq('id', battle.id); return NextResponse.json({ error: r.error }, { status: r.error === 'db' ? 500 : 400 }); }
  return NextResponse.json({ id: battle.id, code: r.code });
}
