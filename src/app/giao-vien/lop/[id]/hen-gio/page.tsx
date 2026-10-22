import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ClassTimer from '@/components/classroom/ClassTimer';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Hẹn giờ · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Đồng hồ đếm ngược chiếu bảng (chạy trên máy, không lưu database).
export default async function TimerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'hen-gio');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Hẹn giờ" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <ClassTimer className={p.cls.name} />
      </main>
    </>
  );
}
