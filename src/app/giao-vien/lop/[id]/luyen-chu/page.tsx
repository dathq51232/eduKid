import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import TeacherWriting from '@/components/writing/TeacherWriting';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Luyện chữ · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Luyện chữ của giáo viên: tạo trang vở A4 để in, giao câu thơ / ca dao cho lớp (migration 0042); luyện trên màn hình để chiếu bảng.
export default async function TeacherWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'luyen-chu');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Luyện chữ" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <TeacherWriting classId={p.cls.id} className={p.cls.name} grade={p.cls.grade} />
      </main>
    </>
  );
}
