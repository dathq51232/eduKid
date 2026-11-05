import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasStudentLoginConfig, isUuid } from '@/lib/auth/student-credentials';
import { issueStudentPin } from '@/lib/classroom/accounts';

// Phụ huynh cấp PIN mới cho con do chính mình tạo (con quên PIN / lần đầu chưa có tài khoản).
export async function POST(request: Request) {
  const { sid } = (await request.json().catch(() => ({}))) as { sid?: unknown };
  if (!hasStudentLoginConfig()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình tài khoản học sinh.' }, { status: 503 });
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (!isUuid(sid)) return NextResponse.json({ error: 'Không hợp lệ.' }, { status: 400 });
  const supabase = await createClient();
  const { data: own } = await supabase.rpc('parent_owns_child', { p_student: sid });
  if (own !== true) return NextResponse.json({ error: 'Bạn chỉ cấp PIN được cho con do mình tạo. Con học ở trường thì nhờ thầy cô.' }, { status: 403 });
  const { data: st } = await supabase.from('students').select('display_name').eq('id', sid).maybeSingle();
  const r = await issueStudentPin(sid, (st?.display_name as string) ?? 'Học sinh');
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ pin: r.pin });
}
