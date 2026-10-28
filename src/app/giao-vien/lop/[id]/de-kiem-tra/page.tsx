import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import GradeReady from '@/components/learn/GradeReady';
import ExamBuilder from '@/components/exams/ExamBuilder';
import { getViewer } from '@/lib/auth/viewer';
import { classRow, warmClass } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Ma trận và đề kiểm tra · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Ma trận + đề kiểm tra định kỳ của lớp. Quyền: giáo viên (ở đây) + teaches_class (trong database).
export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Ma trận và đề kiểm tra" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/de-kiem-tra`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: cls } = await classRow(id);
  if (!cls) notFound();
  const c = cls as { id: string; name: string; grade: number };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <GradeReady grade={c.grade}><ExamBuilder classId={c.id} className={c.name} grade={c.grade} /></GradeReady>
      </main>
    </>
  );
}
