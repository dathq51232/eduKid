import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import TeacherInbox from '@/components/classroom/TeacherInbox';
import { loadClassPage } from '@/lib/classroom/class-page';
import type { Inbox } from '@/lib/classroom/messages';

export const metadata: Metadata = { title: 'Tin nhắn phụ huynh · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Hộp thư phụ huynh của lớp (migration 0037) — chỉ giáo viên dạy lớp đọc được (kiểm tra trong database).
export default async function InboxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'tin-nhan');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Tin nhắn phụ huynh" /></main></>);
  const { data, error } = await p.supabase.rpc('teacher_messages', { p_class: p.cls.id, p_limit: 200 });
  const inbox = (error ? null : data) as Inbox | null;
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <TeacherInbox classId={p.cls.id} className={p.cls.name} initial={inbox ?? { unread: 0, pending_leave: 0, items: [] }} missing={Boolean(error)} />
      </main>
    </>
  );
}
