import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import AssignmentsBoard, { type LessonOption } from '@/components/classroom/AssignmentsBoard';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { CONTENT } from '@/lib/content';
import { classRow, classRoster, warmClass } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Giao bài về nhà · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Giao bài luyện tập có hạn nộp + theo dõi em nào đã làm. Quyền kiểm tra ở đây và trong database (teaches_class).
export default async function AssignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lesson?: string; hs?: string }> }) {
  const { id } = await params;
  warmClass(id);
  const sp = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap assign-page"><NotConfigured title="Giao bài về nhà" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/giao-bai`);
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
  // Bài của khối lớp (chỉ tên, không gửi câu hỏi xuống trình duyệt)
  const lessons: LessonOption[] = CONTENT.filter((l) => l.grade === c.grade).map((l) => ({
    id: l.id, subject: l.subject, title: l.title,
    group: l.kind === 'review' ? `Ôn tập · Học kỳ ${l.semester}` : `Học kỳ ${l.semester} · ${l.unit.title}`,
  }));
  const hs = (sp.hs ?? '').split(',').filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 40);

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <header className="dash-head">
          <div>
            <p className="dash-kicker">Lớp {c.name} · Khối {c.grade} · {students.length} học sinh</p>
            <h1><Send aria-hidden="true" /> Giao bài về nhà</h1>
            <p className="dash-muted">Chọn bài, mức và hạn nộp; giao cho cả lớp hoặc một nhóm em. Các em thấy bài ở trang của mình, làm trên app như bình thường. Danh sách bên dưới cho biết em nào đã làm, em nào chưa, kết quả ra sao.</p>
          </div>
        </header>
        <AssignmentsBoard classId={c.id} className={c.name} students={students} lessons={lessons}
          preset={sp.lesson ? { lessonId: sp.lesson, studentIds: hs } : undefined} />
      </main>
    </>
  );
}
