// Dữ liệu chung của khung giáo viên (layout) và trang chủ giáo viên: danh sách lớp + sĩ số, tên trường.
// Bọc cache() để layout và trang trong cùng một lượt dựng chỉ hỏi Supabase một lần (trước đây mỗi bên hỏi riêng).
import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export type TeacherClass = { id: string; name: string; grade: number; status: string; join_code: string | null; students: number };

/** Lớp giáo viên được phân công (RLS) kèm số em đang học, xếp theo ngày tạo */
export const teacherClasses = cache(async (): Promise<TeacherClass[]> => {
  const supabase = await createClient();
  const [{ data: classes }, { data: members }] = await Promise.all([
    supabase.from('classes').select('id, name, grade, status, join_code').order('created_at'),
    supabase.from('class_memberships').select('class_id').eq('status', 'active'),
  ]);
  const count = new Map<string, number>();
  for (const m of (members ?? []) as { class_id: string }[]) count.set(m.class_id, (count.get(m.class_id) ?? 0) + 1);
  return ((classes ?? []) as Omit<TeacherClass, 'students'>[]).map((c) => ({ ...c, students: count.get(c.id) ?? 0 }));
});

/** Tên trường của giáo viên ('' nếu chưa có) */
export const schoolName = cache(async (id: string | null): Promise<string> => {
  if (!id) return '';
  const { data } = await (await createClient()).from('schools').select('name').eq('id', id).maybeSingle();
  return (data as { name?: string } | null)?.name ?? '';
});
