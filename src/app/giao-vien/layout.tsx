import TeacherShell from '@/components/classroom/TeacherShell';
import { getViewer } from '@/lib/auth/viewer';
import { schoolName, teacherClasses } from '@/lib/classroom/teacher-home';
import { hasSupabaseEnv } from '@/lib/supabase/env';

// Khung chung cho mọi trang của giáo viên: thanh công cụ bên trái, tìm nhanh Ctrl+K, thanh tab trên điện thoại.
// Chưa đăng nhập / chưa là giáo viên / chưa cấu hình Supabase: trả nguyên trang (trang tự xử lý).
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  // hỏi người dùng và danh sách lớp cùng một lượt (RLS chỉ trả lớp được phân công; người khác nhận danh sách rỗng)
  const classesP = hasSupabaseEnv() ? teacherClasses().catch(() => []) : Promise.resolve([]);
  const viewer = await getViewer();
  if (viewer.state !== 'ok' || (!viewer.isTeacher && !viewer.isAdmin)) return children;
  const [classes, school] = await Promise.all([classesP, schoolName(viewer.teacherSchoolId)]);
  const list = classes.slice().sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
  return (
    <TeacherShell classes={list} teacherName={viewer.displayName} schoolName={school}>
      {children}
    </TeacherShell>
  );
}
