import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { hasStudentLoginConfig } from '@/lib/auth/student-credentials';
import { issueStudentPin } from '@/lib/classroom/accounts';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const FAMILY_POLICY = 'gia-dinh-2026-11';

/** Lỗi từ hàm database -> lời nhắn cho phụ huynh */
function familyError(m: string): { status: number; error: string } {
  if (m.includes('not_allowed')) return { status: 403, error: 'Tài khoản này chưa phải tài khoản phụ huynh.' };
  if (m.includes('consent_required')) return { status: 400, error: 'Bạn cần xác nhận là cha/mẹ hoặc người giám hộ và đồng ý điều khoản.' };
  if (m.includes('invalid_name')) return { status: 400, error: 'Tên gọi của con cần từ 1 đến 60 ký tự.' };
  if (m.includes('invalid_grade')) return { status: 400, error: 'Chọn khối lớp từ 1 đến 5.' };
  if (m.includes('too_many_children')) return { status: 400, error: 'Mỗi tài khoản phụ huynh thêm được tối đa 6 con.' };
  if (m.includes('duplicate_name')) return { status: 400, error: 'Gia đình đã có một bạn trùng tên gọi này. Thêm chữ để phân biệt (vd: “Bin lớn”).' };
  if (/function .* does not exist|parent_add_child/.test(m)) return { status: 503, error: 'Máy chủ chưa bật tính năng này: chạy supabase/migrations/0047_family_accounts.sql.' };
  return { status: 400, error: 'Không thêm được. Vui lòng thử lại.' };
}

// Phụ huynh thêm con (học tại nhà): hồ sơ + lớp gia đình do database kiểm tra quyền, rồi máy chủ tạo tài khoản + PIN.
export async function POST(request: Request) {
  if (!hasStudentLoginConfig()) return NextResponse.json({ error: 'Máy chủ chưa cấu hình tài khoản học sinh.' }, { status: 503 });
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok') return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  if (viewer.isStudent) return NextResponse.json({ error: 'Hãy đăng nhập bằng tài khoản phụ huynh (email) để thêm con.' }, { status: 403 });
  if (!rateLimit(`them-con:${viewer.userId ?? clientIp(request.headers)}`, 20, 60 * 60_000)) return NextResponse.json({ error: 'Thao tác nhiều quá, thử lại sau ít phút.' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { name?: unknown; grade?: unknown; consent?: unknown };
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
  const grade = Number(body.grade);
  const supabase = await createClient();
  const { data: sid, error } = await supabase.rpc('parent_add_child', { p_name: name, p_grade: grade, p_policy_version: FAMILY_POLICY, p_consent: body.consent === true });
  if (error || typeof sid !== 'string') {
    const e = familyError(error?.message ?? '');
    return NextResponse.json({ error: e.error }, { status: e.status });
  }
  const r = await issueStudentPin(sid, name);
  const { data: fam } = await supabase.rpc('parent_family_class');
  const code = ((fam ?? []) as { join_code: string }[])[0]?.join_code ?? '';
  if ('error' in r) return NextResponse.json({ id: sid, name, code, error: `Đã thêm ${name} nhưng chưa tạo được PIN: bấm “Cấp PIN mới”.` }, { status: 207 });
  return NextResponse.json({ id: sid, name, grade, code, pin: r.pin });
}
