import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import ChessOnline from '@/components/chess/ChessOnline';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'Ván cờ vua · EduChain Kids' };

export default async function ChessGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getViewer();
  if (v.state !== 'ok') redirect(`/dang-nhap?next=/co/vua/van/${id}`);
  if (!v.studentId) redirect('/co/vua/ban');
  return (
    <>
      <LearnHeader />
      <main className="chs-page wrap">
        <ChessOnline id={id} meId={v.studentId} />
      </main>
    </>
  );
}
