import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ChatApp from '@/components/community/ChatApp';
import CommunityTabs from '@/components/community/CommunityTabs';
import { getViewer } from '@/lib/auth/viewer';
import '@/styles/dash.css';
import '@/styles/cdg.css';

export const metadata: Metadata = { title: 'Tin nhắn · Cộng đồng giáo viên' };
export const dynamic = 'force-dynamic';

// Tin nhắn giữa thầy cô cùng trường (1-1 và nhóm, gửi file) — migration 0080, giao diện ChatApp.
export default async function ChatPage() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Tin nhắn giáo viên" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/giao-vien/cong-dong/tin-nhan');
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  return (
    <main className="cdg is-chat">
      <CommunityTabs on="tin_nhan" />
      <Suspense fallback={<p className="cdg-chat-hint">Đang tải…</p>}>
        <ChatApp meId={viewer.userId} />
      </Suspense>
    </main>
  );
}
