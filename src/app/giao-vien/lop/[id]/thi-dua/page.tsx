import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import TeamContest from '@/components/classroom/TeamContest';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Thi đua tổ · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Thi đua tổ: cộng / trừ điểm theo tuần, tổng kết tuần. Quyền: giáo viên của lớp (kiểm tra cả trong database).
export default async function TeamContestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'thi-dua');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Thi đua tổ" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <TeamContest classId={p.cls.id} className={p.cls.name} students={p.students} />
      </main>
    </>
  );
}
