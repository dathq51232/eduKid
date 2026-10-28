// Phần chung của các trang công cụ lớp: kiểm tra quyền giáo viên, lấy lớp + danh sách em đang học (sắp theo tên).
import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

export type ClassPage =
  | { state: 'not_configured' }
  | { state: 'ok'; supabase: Awaited<ReturnType<typeof createClient>>; cls: { id: string; name: string; grade: number }; students: { id: string; name: string }[] };

const isId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

/** Lớp và danh sách em của lớp — nhớ trong một lượt dựng trang, để các phần cùng dùng chung một truy vấn. */
export const classRow = cache(async (id: string) => (await createClient()).from('classes').select('id, name, grade').eq('id', id).maybeSingle());
export const classRoster = cache(async (id: string) => (await createClient()).rpc('teacher_class_roster', { p_class: id }));

/** Gọi ngay đầu trang: hỏi người dùng, lớp, danh sách em cùng lúc thay vì chờ lần lượt (mỗi lượt chờ là một vòng tới Supabase). */
export function warmClass(id: string) {
  if (!hasSupabaseEnv() || !isId(id)) return;
  void getViewer().catch(() => undefined);
  void classRow(id).then(undefined, () => undefined);
  void classRoster(id).then(undefined, () => undefined);
}

export async function loadClassPage(id: string, path: string): Promise<ClassPage> {
  if (!hasSupabaseEnv()) return { state: 'not_configured' };
  if (!isId(id)) notFound();
  const supabase = await createClient();
  // Hỏi người dùng, lớp và danh sách em cùng một lượt (không chờ nối tiếp); RLS chỉ trả lớp được phân công.
  const [viewer, { data: cls }, { data: roster }] = await Promise.all([
    getViewer(),
    classRow(id),
    classRoster(id),
  ]);
  if (viewer.state === 'not_configured') return { state: 'not_configured' };
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/${path}`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!cls) notFound();
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));
  return { state: 'ok', supabase, cls: cls as { id: string; name: string; grade: number }, students };
}

/** Em vắng hôm nay theo Sổ lớp (migration 0026) — chưa chạy migration thì rỗng */
export async function absentToday(supabase: Awaited<ReturnType<typeof createClient>>, classId: string): Promise<string[]> {
  const vnToday = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc('teacher_diary_day', { p_class: classId, p_day: vnToday });
  if (error) return [];
  return ((data as { entries?: { student_id: string; status: string }[] } | null)?.entries ?? []).filter((e) => e.status !== 'present').map((e) => e.student_id);
}
