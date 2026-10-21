import TeacherShell from '@/components/classroom/TeacherShell';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';

// Khung chung cho mọi trang của giáo viên: thanh công cụ bên trái, tìm nhanh Ctrl+K, thanh tab trên điện thoại.
// Chưa đăng nhập / chưa là giáo viên / chưa cấu hình Supabase: trả nguyên trang (trang tự xử lý).
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer.state !== 'ok' || (!viewer.isTeacher && !viewer.isAdmin)) return children;
  const supabase = await createClient();
  const [{ data: classes }, { data: members }, { data: school }] = await Promise.all([
    supabase.from('classes').select('id, name, grade, status').order('created_at'),
    supabase.from('class_memberships').select('class_id').eq('status', 'active'),
    viewer.teacherSchoolId ? supabase.from('schools').select('name').eq('id', viewer.teacherSchoolId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const count = new Map<string, number>();
  for (const m of (members ?? []) as { class_id: string }[]) count.set(m.class_id, (count.get(m.class_id) ?? 0) + 1);
  const list = ((classes ?? []) as { id: string; name: string; grade: number; status: string }[])
    .map((c) => ({ ...c, students: count.get(c.id) ?? 0 }))
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
  return (
    <TeacherShell classes={list} teacherName={viewer.displayName} schoolName={(school as { name?: string } | null)?.name ?? ''}>
      {children}
    </TeacherShell>
  );
}
