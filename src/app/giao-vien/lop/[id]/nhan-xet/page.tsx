import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import CommentsBoard from '@/components/classroom/CommentsBoard';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Nhận xét học sinh · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Nhận xét tuần / học kỳ / cả năm. Quyền kiểm tra ở đây (giáo viên) và trong database (teaches_class).
export default async function CommentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Nhận xét học sinh" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/nhan-xet`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: cls } = await supabase.from('classes').select('id, name, grade').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const { data: roster } = await supabase.rpc('teacher_class_roster', { p_class: id });
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name)); // theo tên như sổ vnEdu
  const c = cls as { id: string; name: string; grade: number };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <CommentsBoard classId={c.id} className={c.name} grade={c.grade} students={students} />
      </main>
    </>
  );
}
