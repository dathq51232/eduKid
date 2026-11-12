import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import TeacherCalendar from '@/components/classroom/TeacherCalendar';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Lịch âm dương · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Lịch âm dương: tính trên máy; sinh nhật học sinh đọc từ Hồ sơ học sinh (0050).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'lich');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Lịch âm dương" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <TeacherCalendar classId={p.cls.id} className={p.cls.name} students={p.students} />
      </main>
    </>
  );
}
