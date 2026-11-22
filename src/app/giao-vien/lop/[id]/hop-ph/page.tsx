import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ParentMeetings from '@/components/classroom/ParentMeetings';
import { loadClassPage } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Họp phụ huynh · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Họp phụ huynh: thư mời, điểm danh phụ huynh, biên bản. Quyền: giáo viên của lớp (kiểm tra cả trong database).
export default async function ParentMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'hop-ph');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Họp phụ huynh" /></main></>);
  const { data: { user } } = await p.supabase.auth.getUser();
  const { data: me } = user ? await p.supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle() : { data: null };
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <ParentMeetings classId={p.cls.id} className={p.cls.name} teacher={(me?.display_name as string | undefined) ?? ''} students={p.students} />
      </main>
    </>
  );
}
