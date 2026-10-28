import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import HandwritingPractice from '@/components/writing/HandwritingPractice';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Luyện chữ · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Luyện chữ trên màn hình cho giáo viên (chiếu bảng, làm mẫu cho cả lớp) — chữ mẫu theo khối của lớp. Không lưu bài.
export default async function TeacherWritingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'luyen-chu');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Luyện chữ" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <HandwritingPractice grade={p.cls.grade} />
      </main>
    </>
  );
}
