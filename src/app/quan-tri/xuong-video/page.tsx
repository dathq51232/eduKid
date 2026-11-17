import Link from 'next/link';
import VideoStudio from '@/components/video-studio/VideoStudio';
import { getStaffContext } from '@/lib/auth/staff';
import { videoLessons } from '@/lib/video-studio/lessons';

export const metadata = { title: 'Xưởng video — Quản trị EduChain Kids' };
export const dynamic = 'force-dynamic';

// Xưởng video: CHỈ quản trị viên (database cũng chặn giáo viên — migration 0066).
export default async function VideoStudioPage() {
  const ctx = await getStaffContext();
  if (ctx.state !== 'ok') return null;
  if (!ctx.isAdmin) {
    return (
      <div className="adm-alert is-info" role="status">
        Xưởng video chỉ dành cho quản trị viên. <Link href="/quan-tri">Về trang tổng quan</Link>
      </div>
    );
  }
  return <VideoStudio lessons={videoLessons()} />;
}
