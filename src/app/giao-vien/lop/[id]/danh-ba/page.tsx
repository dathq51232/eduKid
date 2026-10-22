import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ParentContacts from '@/components/classroom/ParentContacts';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Danh bạ phụ huynh · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Danh bạ phụ huynh — dữ liệu cá nhân: chỉ giáo viên của lớp (kiểm tra trong database, có nhật ký).
export default async function ContactsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'danh-ba');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Danh bạ phụ huynh" /></main></>);
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <ParentContacts classId={p.cls.id} className={p.cls.name} students={p.students} />
      </main>
    </>
  );
}
