import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

export type StaffContext =
  | { state: 'not_configured' }
  | { state: 'signed_out' }
  | { state: 'forbidden'; email: string }
  | { state: 'ok'; userId: string; email: string; displayName: string; isAdmin: boolean; isTeacher: boolean };

// Xác định người đang đăng nhập có được vào khu quản trị không.
// Đây chỉ là lớp giao diện: quyền thật được kiểm tra bởi RLS và các hàm trong database.
export async function getStaffContext(): Promise<StaffContext> {
  if (!hasSupabaseEnv()) return { state: 'not_configured' };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { state: 'signed_out' };

  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from('user_roles').select('role').eq('user_id', user.id),
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
  ]);

  const names = new Set((roles ?? []).map((r: { role: string }) => r.role));
  const isAdmin = names.has('system_admin');
  const isTeacher = names.has('teacher');
  if (!isAdmin && !isTeacher) return { state: 'forbidden', email: user.email ?? '' };

  return {
    state: 'ok',
    userId: user.id,
    email: user.email ?? '',
    displayName: profile?.display_name ?? user.email ?? 'Người dùng',
    isAdmin,
    isTeacher,
  };
}
