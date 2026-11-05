import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import WhiteboardTool from '@/components/board/WhiteboardTool';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Bảng trắng · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Bảng trắng (nhóm Dạy học, cùng cấp Luyện chữ): bút nét thanh nhọn, hình phẳng, hình khối, đồ dùng Toán, thước, êke, compa.
export default async function TeacherWhiteboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'bang-trang');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Bảng trắng" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <h1 className="sr-only">Bảng trắng — lớp {p.cls.name}</h1>
        <WhiteboardTool classId={p.cls.id} />
      </main>
    </>
  );
}
