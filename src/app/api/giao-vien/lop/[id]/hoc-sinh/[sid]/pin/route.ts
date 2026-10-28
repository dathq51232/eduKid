import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasStudentLoginConfig, isUuid } from '@/lib/auth/student-credentials';
import { issueStudentPin } from '@/lib/classroom/accounts';

// Giáo viên đặt PIN mới cho một học sinh trong lớp mình (cũng dùng để tạo tài khoản nếu bạn đó chưa có).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  if (!hasStudentLoginConfig()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình tài khoản học sinh.' }, { status: 503 });
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!viewer.isTeacher || !isUuid(id) || !isUuid(sid)) return NextResponse.json({ error: 'Không có quyền.' }, { status: 403 });

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc('teacher_can_manage_student', { p_class: id, p_student: sid });
  if (allowed !== true) return NextResponse.json({ error: 'Bạn không có quyền với học sinh này.' }, { status: 403 });

  const { data: student } = await supabase.from('students').select('display_name').eq('id', sid).maybeSingle();
  const r = await issueStudentPin(sid, (student?.display_name as string) ?? 'Học sinh');
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ pin: r.pin, name: student?.display_name ?? '' });
}
