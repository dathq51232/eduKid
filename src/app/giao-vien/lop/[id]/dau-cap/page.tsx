import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import GradeReady from '@/components/learn/GradeReady';
import BattleRooms from '@/components/classroom/BattleRooms';
import { ToolIcon } from '@/components/classroom/tool-icons';
import { getViewer } from '@/lib/auth/viewer';
import { classRow, warmClass } from '@/lib/classroom/class-page';
import '@/styles/dash.css';

export const metadata: Metadata = { title: 'Đấu cặp · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Đấu cặp Mắt Xích (migration 0073, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2). Quyền: giáo viên (ở đây) + teaches_class (API).
export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Đấu cặp" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/dau-cap`);
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
        <header className="dash-head">
          <div>
            <p className="dash-kicker">Lớp {c.name} · Khối {c.grade} · Mùa Mắt Xích</p>
            <h1><ToolIcon k="dau-cap" /> Đấu cặp</h1>
            <p className="dash-muted">Phòng đấu loại trực tiếp cho cả lớp: chiếu mã lên bảng, các em vào phòng, cô bốc thăm chia cặp. Mỗi trận hai em làm cùng bộ câu; đúng nhiều câu hơn thắng, bằng câu thì ai nhanh hơn thắng.</p>
          </div>
        </header>
        <GradeReady grade={c.grade}><BattleRooms classId={c.id} grade={c.grade} /></GradeReady>
      </main>
    </>
  );
}
