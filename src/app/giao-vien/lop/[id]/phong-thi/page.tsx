import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import GradeReady from '@/components/learn/GradeReady';
import ExamRooms from '@/components/classroom/ExamRooms';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { ToolIcon } from '@/components/classroom/tool-icons';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { classRow, classRoster, warmClass } from '@/lib/classroom/class-page';
import '@/styles/dash.css';

export const metadata: Metadata = { title: 'Phòng thi lớp · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Phòng thi lớp (chặng “Ra hoa” – Mùa Mắt Xích). Quyền: giáo viên (ở đây) + teaches_class (trong database).
export default async function RoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phòng thi lớp" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/phong-thi`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: cls } = await classRow(id);
  if (!cls) notFound();
  const c = cls as { id: string; name: string; grade: number };
  const { data: roster } = await classRoster(id);
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <header className="dash-head">
          <div>
            <p className="dash-kicker">Lớp {c.name} · Khối {c.grade} · {students.length} học sinh · Mùa Mắt Xích – chặng Ra hoa</p>
            <h1><ToolIcon k="phong-thi" /> Phòng thi lớp</h1>
            <p className="dash-muted">Tạo phòng, đọc mã phòng cho các em. Cô tự đặt quy tắc sinh đề (đề riêng từng em hoặc đề chung), xem trước và sửa đề trước khi mở phòng; mỗi em làm một lần, cô xem điểm, huy hiệu Cú, kỹ năng cả lớp cần ôn và các bài cần xem lại.</p>
          </div>
        </header>
        <GradeReady grade={c.grade}><ExamRooms classId={c.id} className={c.name} grade={c.grade} students={students} /></GradeReady>
      </main>
    </>
  );
}
