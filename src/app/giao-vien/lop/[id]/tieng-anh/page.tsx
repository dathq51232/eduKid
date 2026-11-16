import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import TeacherEnglish from '@/components/teacher-english/TeacherEnglish';
import { loadClassPage } from '@/lib/classroom/class-page';
import '@/styles/ct.css';

export const metadata: Metadata = { title: 'Tiếng Anh sư phạm · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Tiếng Anh sư phạm (0056): lộ trình 24 tuần + ngân hàng mẫu câu lớp học. Dữ liệu riêng của giáo viên,
// đặt dưới lớp để dùng chung thanh công cụ; ngân hàng câu mặc định lọc theo khối của lớp đang mở.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'tieng-anh');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Tiếng Anh sư phạm" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <TeacherEnglish grade={p.cls.grade} />
      </main>
    </>
  );
}
