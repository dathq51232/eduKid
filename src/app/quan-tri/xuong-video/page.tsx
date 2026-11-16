import VideoStudio from '@/components/video-studio/VideoStudio';
import { getStaffContext } from '@/lib/auth/staff';
import { videoLessons } from '@/lib/video-studio/lessons';

export const metadata = { title: 'Xưởng video — Quản trị EduChain Kids' };
export const dynamic = 'force-dynamic';

// Xưởng video trong khu quản trị: giáo viên và quản trị dùng chung thư viện nhân vật / bối cảnh (migration 0064).
export default async function VideoStudioPage() {
  const ctx = await getStaffContext();
  if (ctx.state !== 'ok') return null;
  return <VideoStudio lessons={videoLessons()} isAdmin={ctx.isAdmin} />;
}
