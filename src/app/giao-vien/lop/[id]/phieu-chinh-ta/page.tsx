import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import SpellingSheets from '@/components/classroom/SpellingSheets';
import { getViewer } from '@/lib/auth/viewer';
import { classRow, warmClass } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Phiếu chính tả · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Phiếu chính tả lớp 1 cho giáo viên: sinh phiếu ngay trên trình duyệt, không lưu dữ liệu học sinh.
export default async function SpellingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phiếu chính tả" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/phieu-chinh-ta`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: cls } = await classRow(id);
  if (!cls) notFound();
  const c = cls as { id: string; name: string; grade: number };
  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <SpellingSheets defaultClass={c.name} defaultSchool={viewer.schoolNameHint ?? ''} defaultTeacher={viewer.displayName === 'Bạn' ? '' : viewer.displayName} />
      </main>
    </>
  );
}
