import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import RoomTaker from '@/components/classroom/RoomTaker';
import { getViewer } from '@/lib/auth/viewer';
import '@/styles/exam.css';
import '@/styles/dash.css';

export const metadata: Metadata = { title: 'Phòng thi lớp · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Phòng thi lớp (migration 0062). Quyền xem đề trong database (student_get_room), nộp bài qua máy chủ.
export default async function StudentRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phòng thi lớp" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/hoc-sinh/phong-thi/${id}`);
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return (
    <>
      <LearnHeader />
      <main className="dash wrap exam-take-page">
        <Link href="/hoc-sinh" className="dash-back"><ArrowLeft aria-hidden="true" /> Trang của em</Link>
        <RoomTaker id={id} />
      </main>
    </>
  );
}
