import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ClassDiary from '@/components/classroom/ClassDiary';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { classRow, classRoster, warmClass } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Sổ lớp hằng ngày · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Sổ lớp hằng ngày: điểm danh, ghi chú từng em, tin nhắn phụ huynh, tổng hợp tháng.
// Quyền kiểm tra ở đây (giáo viên) và trong database (teacher_class_roster chỉ trả lớp được phân công).
export default async function ClassDiaryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; em?: string }> }) {
  const { id } = await params;
  warmClass(id);
  const { tab, em } = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Sổ lớp hằng ngày" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/so-lop`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: cls } = await classRow(id);
  if (!cls) notFound();
  const { data: roster } = await classRoster(id);
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));
  const c = cls as { id: string; name: string; grade: number };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap diary-page">
        <Link href="/giao-vien" className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp của tôi</Link>
        <ClassDiary classId={c.id} className={c.name} students={students} initialTab={tab === 'thang' ? 'month' : tab === 'tin-nhan' ? 'msg' : 'day'} initialSelected={em} />
      </main>
    </>
  );
}
