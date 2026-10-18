import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ExamTaker from '@/components/classroom/ExamTaker';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'Làm đề · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Đề thầy cô giao làm trên app. Quyền xem đề kiểm tra trong database (student_get_exam), nộp bài qua máy chủ.
export default async function StudentExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Làm đề" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/hoc-sinh/de/${id}`);
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return (
    <>
      <LearnHeader />
      <main className="dash wrap exam-take-page">
        <Link href="/hoc-sinh" className="dash-back"><ArrowLeft aria-hidden="true" /> Trang của em</Link>
        <ExamTaker id={id} />
      </main>
    </>
  );
}
