import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import Lesson3DHome, { type Lesson3DRow } from '@/components/lesson3d/Lesson3DHome';
import type { DeckRow } from '@/components/deck/DeckHome';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Bài giảng & 3D · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Bài giảng & 3D (mục riêng, cùng cấp Kế hoạch bài dạy): bài 3D (migration 0034), bài thao giảng / trình chiếu (0046), bài STEM lớp 1–5.
// ?tab=tg hoặc ?sub=tg: mở thẳng thẻ Bài thao giảng · ?plan=<id>: tạo bài thao giảng từ giáo án.
export default async function Lessons3DPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; sub?: string; plan?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const p = await loadClassPage(id, 'bai-giang-3d');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Bài giảng & 3D" /></main></>);
  const [{ data, error }, decks] = await Promise.all([
    p.supabase.from('lessons3d').select('id, title, grade, stem_ref, updated_at').order('updated_at', { ascending: false }).limit(200),
    p.supabase.from('slide_decks').select('id, title, grade, updated_at, slides:data->slides, plan:data->src->>plan').order('updated_at', { ascending: false }).limit(200),
  ]);
  const deckRows: DeckRow[] = ((decks.data ?? []) as { id: string; title: string; grade: number; updated_at: string; slides: unknown; plan: string | null }[])
    .map((d) => ({ id: d.id, title: d.title, grade: d.grade, updated_at: d.updated_at, slides: Array.isArray(d.slides) ? d.slides.length : undefined, plan: d.plan ?? undefined }));
  const plan = /^[0-9a-f-]{36}$/i.test(sp.plan ?? '') ? sp.plan : undefined;
  const initialTab = plan || sp.tab === 'tg' || sp.sub === 'tg' ? 'tg' : sp.tab;
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <Lesson3DHome key={plan ?? 'b3d'} classId={p.cls.id} className={p.cls.name} grade={p.cls.grade} lessons={(data ?? []) as Lesson3DRow[]} missing={!!error}
          decks={deckRows} decksMissing={!!decks.error} initialTab={initialTab} openPlan={plan} />
      </main>
    </>
  );
}
