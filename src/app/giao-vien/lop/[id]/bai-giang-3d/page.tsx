import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Bài giảng 3D đã gộp vào Kế hoạch bài dạy (mục "Bài giảng & 3D"): giữ đường dẫn cũ, chuyển sang trang mới.
export default async function Lessons3DPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; plan?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const q = new URLSearchParams({ tab: 'bai-giang' });
  if (sp.tab === 'tg') q.set('sub', 'tg');
  if (sp.plan && /^[0-9a-f-]{36}$/i.test(sp.plan)) q.set('plan', sp.plan);
  redirect(`/giao-vien/lop/${id}/ke-hoach?${q.toString()}`);
}
