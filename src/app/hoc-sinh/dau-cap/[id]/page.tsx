import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import BattlePlay from '@/components/classroom/BattlePlay';
import { getViewer } from '@/lib/auth/viewer';
import '@/styles/exam.css';
import '@/styles/dash.css';

export const metadata: Metadata = { title: 'Đấu cặp · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Đấu cặp Mắt Xích (migration 0073): em vào bằng mã phòng; câu, giờ, chấm đều ở máy chủ (/api/hoc-sinh/dau-cap).
export default async function StudentBattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Đấu cặp" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/hoc-sinh/dau-cap/${id}`);
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return (
    <>
      <LearnHeader />
      <main className="dash wrap exam-take-page">
        <Link href="/hoc-sinh" className="dash-back"><ArrowLeft aria-hidden="true" /> Trang của em</Link>
        <BattlePlay id={id} />
      </main>
    </>
  );
}
