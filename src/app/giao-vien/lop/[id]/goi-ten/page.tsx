import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import CallOn from '@/components/classroom/CallOn';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Gọi tên – Dò bài · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Gọi tên ngẫu nhiên để dò bài cũ / gọi phát biểu, chiếu lên màn hình lớp.
// Quyền kiểm tra ở đây (giáo viên) và trong database (teacher_class_roster chỉ trả lớp được phân công).
export default async function CallOnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Gọi tên – Dò bài" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/goi-ten`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: cls } = await supabase.from('classes').select('id, name, grade').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const vnToday = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const [{ data: roster }, { data: diary, error: diaryErr }] = await Promise.all([
    supabase.rpc('teacher_class_roster', { p_class: id }),
    // em vắng hôm nay theo Sổ lớp (migration 0026) — chưa chạy migration thì bỏ qua
    supabase.rpc('teacher_diary_day', { p_class: id, p_day: vnToday }),
  ]);
  const absentToday = diaryErr ? [] : ((diary as { entries?: { student_id: string; status: string }[] } | null)?.entries ?? [])
    .filter((e) => e.status !== 'present').map((e) => e.student_id);
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));
  const c = cls as { id: string; name: string; grade: number };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap callon-page">
        <Link href="/giao-vien" className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp của tôi</Link>
        <CallOn classId={c.id} className={c.name} grade={c.grade} students={students} absentToday={absentToday} />
      </main>
    </>
  );
}
