import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import Lesson3DHome, { type Lesson3DRow } from '@/components/lesson3d/Lesson3DHome';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Bài giảng 3D · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Xưởng bài giảng 3D: danh sách bài của giáo viên, bài mẫu và danh mục bài STEM lớp 1–5 (migration 0034).
export default async function Lessons3DPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'bai-giang-3d');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Bài giảng 3D" /></main></>);
  const { data, error } = await p.supabase.from('lessons3d').select('id, title, grade, stem_ref, updated_at').order('updated_at', { ascending: false }).limit(200);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <Lesson3DHome classId={p.cls.id} className={p.cls.name} grade={p.cls.grade} lessons={(data ?? []) as Lesson3DRow[]} missing={!!error} />
      </main>
    </>
  );
}
