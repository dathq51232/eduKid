import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import DeckPlayer from '@/components/deck/DeckPlayer';
import { loadClassPage } from '@/lib/classroom/class-page';
import { normalizeDeck } from '@/lib/deck/types';

export const metadata: Metadata = { title: 'Trình chiếu · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Trình chiếu bài thao giảng: màn hình của cô (mặc định) hoặc màn hình chiếu (?man=chieu) đồng bộ với máy cô.
export default async function DeckShowPage({ params, searchParams }: { params: Promise<{ id: string; did: string }>; searchParams: Promise<{ man?: string; trang?: string }> }) {
  const [{ id, did }, sp] = await Promise.all([params, searchParams]);
  const p = await loadClassPage(id, 'bai-giang-3d');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Trình chiếu" /></main></>);
  if (!/^[0-9a-f-]{36}$/i.test(did)) notFound();
  const { data } = await p.supabase.from('slide_decks').select('id, title, data').eq('id', did).maybeSingle();
  if (!data) notFound();
  const row = data as { id: string; title: string; data: unknown };
  return (
    <main className="dp-page">
      <DeckPlayer classId={p.cls.id} deckId={row.id} deck={normalizeDeck(row.data, row.title)} students={p.students}
        start={Math.max(0, (Number(sp.trang) || 1) - 1)} audience={sp.man === 'chieu'} />
    </main>
  );
}
