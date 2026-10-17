import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasStudentLoginConfig, normalizeClassCode } from '@/lib/auth/student-credentials';
import { clientIp, rateLimit } from '@/lib/rate-limit';

// Bước 1 của đăng nhập học sinh: nhập mã lớp -> danh sách TÊN GỌI các bạn trong lớp (không trả gì khác).
export async function POST(request: Request) {
  if (!hasStudentLoginConfig()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  // Cả lớp thường dùng chung một mạng wifi (cùng IP) nên giới hạn theo IP phải đủ rộng cho ~40 học sinh.
  if (!rateLimit(`lop:${clientIp(request.headers)}`, 150, 10 * 60_000)) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { code?: unknown };
  const code = normalizeClassCode(body.code);
  if (!code) return NextResponse.json({ error: 'invalid_code' }, { status: 400 });

  const admin = createAdminClient();
  const { data: cls, error: clsErr } = await admin.from('classes').select('id, name, grade').eq('join_code', code).eq('status', 'active').maybeSingle();
  // Lỗi truy vấn (thường do SUPABASE_SERVICE_ROLE_KEY sai/đã đổi) phải báo khác với "không có lớp", nếu không sẽ rất khó dò.
  if (clsErr) {
    console.error('[hoc-sinh/lop] classes query failed:', clsErr.code, clsErr.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
  if (!cls) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: members } = await admin.from('class_memberships').select('student_id').eq('class_id', cls.id).eq('status', 'active');
  const ids = (members ?? []).map((m) => m.student_id as string);
  const { data: students } = ids.length
    ? await admin.from('students').select('id, display_name').in('id', ids).eq('status', 'active').not('user_id', 'is', null)
    : { data: [] as { id: string; display_name: string }[] };

  const list = (students ?? [])
    .map((s) => ({ id: s.id as string, name: s.display_name as string }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  return NextResponse.json({ code, className: cls.name, grade: cls.grade, students: list });
}
