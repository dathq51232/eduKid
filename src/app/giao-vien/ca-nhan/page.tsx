import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import TeacherProfileForm, { type TeacherProfile } from '@/components/classroom/TeacherProfileForm';
import { getViewer } from '@/lib/auth/viewer';
import { schoolName } from '@/lib/classroom/teacher-home';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import '@/styles/cn.css';

// THÔNG TIN CÁ NHÂN GIÁO VIÊN (bấm ảnh đại diện ở trang chủ giáo viên):
// họ tên (profiles.display_name), xưng hô (cookie gv-xung-ho), điện thoại / ngày sinh / công việc (user_metadata của tài khoản),
// hồ sơ chuyên môn dùng cho Cộng đồng (community_profiles, migration 0079). Không cần migration mới.
export const metadata: Metadata = { title: 'Thông tin cá nhân', robots: { index: false } };

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export default async function TeacherProfilePage() {
  if (!hasSupabaseEnv()) redirect('/giao-vien');
  const viewer = await getViewer();
  if (viewer.state !== 'ok') redirect('/dang-nhap?vai=nguoi-lon');
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');

  const supabase = await createClient();
  const [{ data: auth }, cp, school] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc('community_profile'),
    schoolName(viewer.teacherSchoolId).catch(() => null),
  ]);
  const meta = (auth.user?.user_metadata ?? {}) as Record<string, unknown>;
  const c = (cp.error ? null : cp.data) as { bio?: string; subjects?: string[]; grades?: number[]; book?: string; showSchool?: boolean } | null;
  const xhRaw = (await cookies()).get('gv-xung-ho')?.value;

  const initial: TeacherProfile = {
    name: viewer.displayName,
    email: viewer.email,
    school: school ?? '',
    xh: xhRaw === 'thay' || xhRaw === 'co' ? xhRaw : '',
    phone: str(meta.gv_phone),
    birthday: str(meta.gv_birthday),
    position: str(meta.gv_position),
    community: c ? { bio: c.bio ?? '', subjects: c.subjects ?? [], grades: c.grades ?? [], book: c.book ?? '', showSchool: c.showSchool ?? true } : null,
  };

  return (
    <main className="cn">
      <Link href="/giao-vien" className="cn-back"><ChevronLeft aria-hidden="true" /> Trang chủ</Link>
      <h1>Thông tin cá nhân</h1>
      <p className="cn-lead">Thêm, sửa hoặc xoá thông tin của {initial.xh === 'thay' ? 'thầy' : initial.xh === 'co' ? 'cô' : 'thầy cô'}. Số điện thoại và ngày sinh chỉ mình {initial.xh === 'thay' ? 'thầy' : initial.xh === 'co' ? 'cô' : 'thầy cô'} xem được.</p>
      <TeacherProfileForm initial={initial} />
    </main>
  );
}
