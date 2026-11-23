import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/features';

// Cộng đồng giáo viên đang tắt (FEATURES.community): chặn mọi đường dẫn /giao-vien/cong-dong/… — dữ liệu vẫn giữ nguyên.
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURES.community) notFound();
  return children;
}
