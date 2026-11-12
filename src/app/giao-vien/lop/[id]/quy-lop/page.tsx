import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ClassFund from '@/components/classroom/ClassFund';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Quỹ lớp · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Quỹ lớp (0052): khoản thu theo em, sổ quỹ, công khai quỹ — chỉ giáo viên của lớp.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'quy-lop');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Quỹ lớp" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <ClassFund classId={p.cls.id} className={p.cls.name} students={p.students} />
      </main>
    </>
  );
}
