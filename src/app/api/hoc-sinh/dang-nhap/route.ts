import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  LOCK_MINUTES, MAX_PIN_FAILS, hasStudentLoginConfig, isPin, isUuid, normalizeClassCode, studentEmail, studentPassword,
} from '@/lib/auth/student-credentials';
import { clientIp, rateLimit } from '@/lib/rate-limit';

// Bước cuối của đăng nhập học sinh: mã lớp + học sinh đã chọn + PIN.
// Sai PIN quá MAX_PIN_FAILS lần trong cửa sổ LOCK_MINUTES phút -> khóa tạm, giáo viên có thể mở sớm.
export async function POST(request: Request) {
  if (!hasStudentLoginConfig()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  // Cả lớp dùng chung IP: giới hạn rộng; chống dò PIN thật sự là bộ đếm sai PIN theo từng học sinh trong database.
  if (!rateLimit(`pin:${clientIp(request.headers)}`, 300, 10 * 60_000)) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; studentId?: unknown; pin?: unknown };
  const code = normalizeClassCode(body.code);
  if (!code || !isUuid(body.studentId) || !isPin(body.pin)) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const studentId = body.studentId;

  const admin = createAdminClient();
  const { data: cls, error: clsErr } = await admin.from('classes').select('id').eq('join_code', code).eq('status', 'active').maybeSingle();
  if (clsErr) {
    console.error('[hoc-sinh/dang-nhap] classes query failed:', clsErr.code, clsErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  const { data: member } = cls
    ? await admin.from('class_memberships').select('student_id').eq('class_id', cls.id).eq('student_id', studentId).eq('status', 'active').maybeSingle()
    : { data: null };
  const { data: student } = member
    ? await admin.from('students').select('id, status, user_id').eq('id', studentId).maybeSingle()
    : { data: null };
  if (!student || student.status !== 'active' || !student.user_id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const now = Date.now();
  const { data: guard } = await admin.from('student_login_guards').select('failed_count, locked_until, last_failed_at').eq('student_id', studentId).maybeSingle();
  const lockedUntil = guard?.locked_until ? Date.parse(guard.locked_until) : 0;
  if (lockedUntil > now) {
    return NextResponse.json({ error: 'locked', minutes: Math.ceil((lockedUntil - now) / 60_000) }, { status: 423 });
  }
  // Lần sai cũ hơn cửa sổ khóa thì không tính nữa
  const recent = guard?.last_failed_at && now - Date.parse(guard.last_failed_at) < LOCK_MINUTES * 60_000 ? guard.failed_count : 0;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: studentEmail(studentId), password: studentPassword(studentId, body.pin) });

  if (error) {
    const fails = recent + 1;
    const lock = fails >= MAX_PIN_FAILS;
    await admin.from('student_login_guards').upsert({
      student_id: studentId,
      failed_count: fails,
      last_failed_at: new Date(now).toISOString(),
      locked_until: lock ? new Date(now + LOCK_MINUTES * 60_000).toISOString() : null,
      updated_at: new Date(now).toISOString(),
    });
    if (lock) return NextResponse.json({ error: 'locked', minutes: LOCK_MINUTES }, { status: 423 });
    return NextResponse.json({ error: 'wrong_pin', remaining: MAX_PIN_FAILS - fails }, { status: 401 });
  }

  await admin.from('student_login_guards').upsert({ student_id: studentId, failed_count: 0, locked_until: null, last_failed_at: null, updated_at: new Date(now).toISOString() });
  return NextResponse.json({ ok: true, next: '/hoc-sinh' });
}
