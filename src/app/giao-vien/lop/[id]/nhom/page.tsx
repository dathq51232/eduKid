import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import GroupsSeating from '@/components/classroom/GroupsSeating';
import type { SummaryRow } from '@/components/classroom/ClassManager';
import { absentToday, loadClassPage } from '@/lib/classroom/class-page';
import { levelOf, type Level } from '@/lib/classroom/class-tools';

export const metadata: Metadata = { title: 'Nhóm & chỗ ngồi · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Chia nhóm (ngẫu nhiên / cân bằng học lực / theo tổ) và sơ đồ chỗ ngồi. Quyền: giáo viên của lớp (kiểm tra cả trong database).
export default async function GroupsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  const p = await loadClassPage(id, 'nhom');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Nhóm & chỗ ngồi" /></main></>);
  const [{ data: summary }, absent] = await Promise.all([
    p.supabase.rpc('class_results_summary', { p_class: id }),
    absentToday(p.supabase, id),
  ]);
  const levels: Record<string, Level> = Object.fromEntries(((summary ?? []) as SummaryRow[]).map((r) => [r.student_id, levelOf(r.avg_percent, r.lessons_done)]));
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <GroupsSeating classId={p.cls.id} className={p.cls.name} students={p.students} levels={levels} absentToday={absent} initialTab={tab === 'cho-ngoi' ? 'seating' : 'groups'} />
      </main>
    </>
  );
}
