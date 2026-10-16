import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

// Người đang xem trang. Vai trò luôn đọc từ database bằng phiên đăng nhập đã xác thực (getUser),
// không bao giờ lấy từ dữ liệu do trình duyệt gửi. Đây là lớp giao diện; quyền thật do RLS và hàm DB kiểm tra.
export type Viewer =
  | { state: 'not_configured' }
  | { state: 'signed_out' }
  | {
      state: 'ok';
      userId: string;
      email: string;
      displayName: string;
      isAdmin: boolean;
      isTeacher: boolean;
      isParent: boolean;
      isStudent: boolean;
      teacherSchoolId: string | null;
      studentId: string | null;
      teacherApplication: 'pending' | 'rejected' | null;
      wantsTeacher: boolean;
      schoolNameHint: string;
    };

export const getViewer = cache(async (): Promise<Viewer> => {
  if (!hasSupabaseEnv()) return { state: 'not_configured' };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { state: 'signed_out' };

  const [{ data: roles }, { data: profile }, { data: student }, { data: apps }] = await Promise.all([
    supabase.from('user_roles').select('role, school_id').eq('user_id', user.id),
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    supabase.from('students').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('teacher_applications').select('status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ]);

  const list = (roles ?? []) as { role: string; school_id: string | null }[];
  const has = (r: string) => list.some((x) => x.role === r);
  const teacherRow = list.find((x) => x.role === 'teacher');
  const app = (apps?.[0] as { status: string } | undefined)?.status;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    state: 'ok',
    userId: user.id,
    email: user.email ?? '',
    displayName: (profile as { display_name?: string } | null)?.display_name ?? 'Bạn',
    isAdmin: has('system_admin'),
    isTeacher: Boolean(teacherRow),
    isParent: has('parent'),
    isStudent: has('student') && Boolean(student),
    teacherSchoolId: teacherRow?.school_id ?? null,
    studentId: (student as { id?: string } | null)?.id ?? null,
    teacherApplication: app === 'pending' || app === 'rejected' ? app : null,
    wantsTeacher: meta.wants_teacher === true,
    schoolNameHint: typeof meta.school_name === 'string' ? meta.school_name.slice(0, 180) : '',
  };
});

/** Trang chính theo vai trò sau khi đăng nhập */
export function homeFor(v: Viewer): string {
  if (v.state !== 'ok') return '/dang-nhap';
  if (v.isStudent) return '/hoc-sinh';
  if (v.isAdmin) return '/quan-tri';
  if (v.isTeacher || v.teacherApplication || v.wantsTeacher) return '/giao-vien';
  return '/giao-vien'; // đã bỏ mục phụ huynh: tài khoản người lớn chưa được duyệt vào trang giáo viên để gửi yêu cầu
}
