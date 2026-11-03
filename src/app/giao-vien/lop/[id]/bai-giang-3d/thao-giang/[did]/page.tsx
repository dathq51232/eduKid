import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import DeckStudio from '@/components/deck/DeckStudio';
import { loadClassPage } from '@/lib/classroom/class-page';
import { normalizeDeck } from '@/lib/deck/types';

export const metadata: Metadata = { title: 'Soạn bài thao giảng · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Soạn bài thao giảng (trình chiếu kiểu PowerPoint). RLS: chỉ người soạn đọc được bài của mình (migration 0046).
export default async function DeckEditPage({ params }: { params: Promise<{ id: string; did: string }> }) {
  const { id, did } = await params;
  const p = await loadClassPage(id, 'bai-giang-3d');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Bài thao giảng" /></main></>);
  if (!/^[0-9a-f-]{36}$/i.test(did)) notFound();
  const { data } = await p.supabase.from('slide_decks').select('id, title, data').eq('id', did).maybeSingle();
  if (!data) notFound();
  const row = data as { id: string; title: string; data: unknown };
  return (
    <main className="dk-page">
      <DeckStudio classId={p.cls.id} deckId={row.id} initial={normalizeDeck(row.data, row.title)} />
    </main>
  );
}
