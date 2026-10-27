import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import XqOnline from '@/components/xiangqi/XqOnline';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'Ván cờ tướng · EduChain Kids' };

export default async function XqGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getViewer();
  if (v.state !== 'ok') redirect(`/dang-nhap?next=/co/tuong/van/${id}`);
  if (!v.studentId) redirect('/co/tuong/ban');
  return (
    <>
      <LearnHeader />
      <main className="chs-page wrap">
        <XqOnline id={id} meId={v.studentId} />
      </main>
    </>
  );
}
