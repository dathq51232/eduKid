import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

// Người đang xem trang. Vai trò luôn đọc từ database bằng phiên đăng nhập (API route quyền cao dùng getVerifiedViewer),
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

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };

/** Đọc người dùng từ access token trong cookie, không gọi mạng (bỏ một vòng hỏi máy chủ Auth mỗi lần chuyển trang).
 *  Chữ ký token vẫn được PostgREST kiểm tra ở mọi truy vấn phía sau: token giả thì không đọc được vai trò nào. */
async function tokenUser(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession(); // tự làm mới token khi đã hết hạn
  const token = data.session?.access_token;
  if (!token) return null;
  try {
    const part = token.split('.')[1] ?? '';
    const c = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { sub?: string; email?: string; exp?: number; user_metadata?: Record<string, unknown> };
    if (!c.sub || !c.exp || c.exp * 1000 < Date.now() + 5_000) return null;
    return { id: c.sub, email: c.email, user_metadata: c.user_metadata };
  } catch { return null; }
}

async function loadViewer(verify: boolean): Promise<Viewer> {
  if (!hasSupabaseEnv()) return { state: 'not_configured' };
  const supabase = await createClient();
  let user: AuthUser | null = verify ? null : await tokenUser(supabase);
  if (!user) {
    const { data: auth } = await supabase.auth.getUser();
    user = auth.user;
  }
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
}

/** Dùng cho trang (giao diện): nhanh, đọc người dùng từ token; dữ liệu vẫn do RLS bảo vệ. */
export const getViewer = cache(() => loadViewer(false));

/** Dùng cho API route có quyền cao (khoá dịch vụ, service role): luôn hỏi máy chủ Auth để xác thực người dùng. */
export const getVerifiedViewer = cache(() => loadViewer(true));

/** Trang chính theo vai trò sau khi đăng nhập */
export function homeFor(v: Viewer): string {
  if (v.state !== 'ok') return '/dang-nhap';
  if (v.isStudent) return '/hoc-sinh';
  if (v.isAdmin) return '/quan-tri';
  if (v.isTeacher || v.teacherApplication || v.wantsTeacher) return '/giao-vien';
  return '/phu-huynh'; // phụ huynh và người lớn chưa nhập mã mời
}
