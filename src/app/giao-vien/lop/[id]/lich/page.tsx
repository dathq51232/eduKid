import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import LunarCalendar from '@/components/utils/LunarCalendar';
import { ToolIcon } from '@/components/classroom/tool-icons';
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
        <LunarCalendar title="Lịch âm dương" subtitle={`Tiện ích · Lớp ${p.cls.name}`} icon={<ToolIcon k="lich" />} classId={p.cls.id} students={p.students} profileHref={`/giao-vien/lop/${p.cls.id}?xem=ho-so`} />
      </main>
    </>
  );
}
