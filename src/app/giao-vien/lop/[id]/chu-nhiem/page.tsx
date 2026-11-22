import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import HomeroomBook from '@/components/classroom/HomeroomBook';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Sổ chủ nhiệm · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Sổ chủ nhiệm: mục tiêu năm, kế hoạch từng tháng, theo dõi em cần quan tâm. Quyền: giáo viên của lớp.
export default async function HomeroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'chu-nhiem');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Sổ chủ nhiệm" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <HomeroomBook classId={p.cls.id} className={p.cls.name} students={p.students} />
      </main>
    </>
  );
}
