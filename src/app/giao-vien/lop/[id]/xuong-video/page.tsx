import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import VideoStudio from '@/components/video-studio/VideoStudio';
import { loadClassPage } from '@/lib/classroom/class-page';
import { getViewer } from '@/lib/auth/viewer';
import { videoLessons } from '@/lib/video-studio/lessons';

export const metadata: Metadata = { title: 'Xưởng video · EduChain Kids', robots: { index: false } };
export const dynamic = 'force-dynamic';

// Xưởng video stickman (0064): soạn phân cảnh và câu lệnh Google Flow, thư viện nhân vật / bối cảnh dùng chung.
// Đặt dưới lớp để dùng chung thanh công cụ; danh sách bài học mặc định theo khối của lớp đang mở.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await loadClassPage(id, 'xuong-video');
  if (p.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Xưởng video" /></main></>);
  const viewer = await getViewer();
  return (
    <>
      <LearnHeader />
      <main className="dash wrap ct-page">
        <VideoStudio lessons={videoLessons()} isAdmin={viewer.state === 'ok' && viewer.isAdmin} defaultGrade={p.cls.grade} />
      </main>
    </>
  );
}
