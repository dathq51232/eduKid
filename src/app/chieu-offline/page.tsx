import type { Metadata } from 'next';
import OfflineShows from '@/components/offline/OfflineShows';

export const metadata: Metadata = { title: 'Bài đã lưu offline · EduChain Kids', robots: { index: false } };
// Trang tĩnh, không đọc dữ liệu máy chủ: bộ nhớ đệm (public/sw.js) giữ lại để mở được khi mất mạng.
export const dynamic = 'force-static';

export default function OfflinePage() {
  return <OfflineShows />;
}
