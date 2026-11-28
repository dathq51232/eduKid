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
        <header className="dash-head room-hero">
          <div className="room-hero-txt">
            <p className="dash-kicker">Lớp {c.name} · Khối {c.grade} · {students.length} học sinh · Mùa Mắt Xích – chặng Ra hoa</p>
            <h1><ToolIcon k="phong-thi" /> Phòng thi lớp</h1>
            <p className="dash-muted">Tạo đề thi, đấu cặp hoặc đấu tổ cho cả lớp và theo dõi kết quả ngay tức thì. Các em ôn tập, củng cố kiến thức; cô xem điểm, huy hiệu Cú và kỹ năng cả lớp cần ôn.</p>
          </div>
          <div className="room-hero-art" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element -- tranh minh hoạ đã tối ưu sẵn (webp) */}
            <img src="/brand/dash/class-kids.webp" alt="" width={560} height={420} className="room-hero-kids" decoding="async" />
            {/* eslint-disable-next-line @next/next/no-img-element -- tranh minh hoạ đã tối ưu sẵn (webp) */}
            <img src="/brand/milo-professor-sm.webp" alt="" width={240} height={330} className="room-hero-milo" decoding="async" />
          </div>
        </header>
        <GradeReady grade={c.grade}><ExamRooms classId={c.id} className={c.name} grade={c.grade} students={students} /></GradeReady>
      </main>
    </>
  );
}
