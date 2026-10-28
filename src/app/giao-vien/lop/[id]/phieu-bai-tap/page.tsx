import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import GradeReady from '@/components/learn/GradeReady';
import WorksheetBuilder from '@/components/exams/WorksheetBuilder';
import { getViewer } from '@/lib/auth/viewer';
import { classRow, warmClass } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Phiếu bài tập · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Phiếu bài tập in / giao làm trên app. Quyền: giáo viên (ở đây) + teaches_class (trong database khi giao bài).
export default async function WorksheetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lesson?: string }> }) {
  const { id } = await params;
  warmClass(id);
  const sp = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phiếu bài tập" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/phieu-bai-tap`);
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
        <GradeReady grade={c.grade}><WorksheetBuilder classId={c.id} className={c.name} grade={c.grade} presetLesson={sp.lesson?.slice(0, 120)} /></GradeReady>
      </main>
    </>
  );
}
