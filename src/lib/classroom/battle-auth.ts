import 'server-only';
import { getVerifiedViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';

// Quyền cho API Đấu cặp (migration 0073).
const UUID = /^[0-9a-f-]{36}$/i;

/** Người đang xem có dạy lớp này không (hàm teaches_class trong database, admin cũng qua) — trả về userId */
export async function teacherOf(classId: string): Promise<string | null> {
  if (!UUID.test(classId)) return null;
  const viewer = await getVerifiedViewer();
  if (viewer.state !== 'ok' || (!viewer.isTeacher && !viewer.isAdmin)) return null;
  const { data } = await (await createClient()).rpc('teaches_class', { target_class: classId });
  return data === true ? viewer.userId : null;
}

/** Học sinh đang đăng nhập — trả về mã học sinh */
export async function studentOf(): Promise<string | null> {
  const viewer = await getVerifiedViewer();
  return viewer.state === 'ok' && viewer.isStudent && viewer.studentId ? viewer.studentId : null;
}
