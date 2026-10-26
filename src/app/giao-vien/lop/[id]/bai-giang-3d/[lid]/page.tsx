import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import Lesson3DStudio from '@/components/lesson3d/Lesson3DStudio';
import { loadClassPage } from '@/lib/classroom/class-page';
import { normalizeLesson } from '@/lib/lesson3d/types';

export const metadata: Metadata = { title: 'Xưởng bài giảng 3D · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Soạn và trình chiếu một bài giảng 3D. RLS: chỉ người soạn đọc được bài của mình.
export default async function Lesson3DEditPage({ params }: { params: Promise<{ id: string; lid: string }> }) {
  const { id, lid } = await params;
  const p = await loadClassPage(id, 'bai-giang-3d');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Bài giảng 3D" /></main></>);
  if (!/^[0-9a-f-]{36}$/i.test(lid)) notFound();
  const { data } = await p.supabase.from('lessons3d').select('id, title, data').eq('id', lid).maybeSingle();
  if (!data) notFound();
  const row = data as { id: string; title: string; data: unknown };
  return (
    <main className="s3d-page">
      <Lesson3DStudio classId={p.cls.id} lessonId={row.id} initial={normalizeLesson(row.data, row.title)} />
    </main>
  );
}
