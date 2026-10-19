import type { SupabaseClient } from '@supabase/supabase-js';

// Khối lớp của TÀI KHOẢN HỌC SINH (null = không phải học sinh): ưu tiên khối của lớp em đang học
// (lớp đang hoạt động — năm sau lên lớp thì theo lớp mới), không có lớp thì theo khối ghi trong hồ sơ học sinh.
// Đọc bằng phiên đăng nhập của chính em (RLS chỉ trả dữ liệu của em). Dùng ở middleware và API — không tin tham số trên URL.
export async function studentGradeOf(supabase: SupabaseClient, userId: string): Promise<number | null> {
  const { data: st } = await supabase.from('students').select('id, grade').eq('user_id', userId).eq('status', 'active').maybeSingle();
  if (!st) return null;
  const { data: cls } = await supabase.from('classes').select('grade').eq('status', 'active').order('created_at', { ascending: false }).limit(1);
  const g = Number((cls?.[0] as { grade?: number } | undefined)?.grade ?? (st as { grade?: number }).grade);
  return g >= 1 && g <= 5 ? g : null;
}
