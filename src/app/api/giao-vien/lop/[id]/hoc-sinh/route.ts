import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasStudentLoginConfig, isUuid } from '@/lib/auth/student-credentials';
import { POLICY_VERSION, dbError, issueStudentPin } from '@/lib/classroom/accounts';

// Giáo viên thêm học sinh vào lớp và tạo tài khoản + PIN cho từng bạn.
// Quyền được database kiểm tra (teacher_add_students chạy bằng phiên của chính giáo viên);
// chỉ sau đó máy chủ mới dùng service_role để tạo tài khoản đăng nhập.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasStudentLoginConfig()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình tài khoản học sinh (xem docs/AUTH-SETUP.md).' }, { status: 503 });
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher) return NextResponse.json({ error: 'Chỉ giáo viên đã được duyệt mới thêm được học sinh.' }, { status: 403 });
  if (!isUuid(id)) return NextResponse.json({ error: 'Lớp không hợp lệ.' }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { names?: unknown; consent?: unknown };
  const names = Array.isArray(body.names)
    ? body.names.filter((n): n is string => typeof n === 'string').map((n) => n.trim()).filter(Boolean)
    : [];
  if (!names.length) return NextResponse.json({ error: 'Nhập ít nhất một tên học sinh.' }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('teacher_add_students', {
    p_class: id, p_names: names, p_policy_version: POLICY_VERSION, p_consent: body.consent === true,
  });
  if (error) {
    const e = dbError(error);
    return NextResponse.json({ error: e.message }, { status: e.status });
  }

  const created: { id: string; name: string; pin?: string; error?: string }[] = [];
  for (const row of (data ?? []) as { student_id: string; display_name: string }[]) {
    const r = await issueStudentPin(row.student_id, row.display_name);
    created.push({ id: row.student_id, name: row.display_name, ...('pin' in r ? { pin: r.pin } : { error: r.error }) });
  }
  return NextResponse.json({ created });
}
