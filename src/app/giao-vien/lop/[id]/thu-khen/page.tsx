import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import PraiseLetters from '@/components/classroom/PraiseLetters';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { compareViName } from '@/lib/classroom/names';
import { createClient } from '@/lib/supabase/server';
import { classRow, classRoster, warmClass } from '@/lib/classroom/class-page';

export const metadata: Metadata = { title: 'Thư khen · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Tạo thư khen cho học sinh của lớp. Quyền kiểm tra ở đây (giáo viên) và trong database (teacher_class_roster chỉ trả lớp được phân công).
export default async function PraisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Thư khen" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/thu-khen`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: cls } = await classRow(id);
  if (!cls) notFound();
  const [{ data: roster }, { data: awardRows, error: awardErr }] = await Promise.all([
    classRoster(id),
    // Khen thưởng đã nhập (migration 0014) — chỉ để gợi ý; chưa chạy migration thì bỏ qua
    supabase.rpc('teacher_list_awards', { p_class: id }),
  ]);
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));
  const awards = (awardErr ? [] : ((awardRows ?? []) as { student_id: string; title: string; awarded_on: string }[]))
    .map((a) => ({ student_id: a.student_id, title: a.title, awarded_on: a.awarded_on ?? '' }));
  const c = cls as { id: string; name: string; grade: number };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <PraiseLetters
          classId={c.id}
          className={c.name}
          grade={c.grade}
          students={students}
          awards={awards}
          teacherName={viewer.displayName === 'Bạn' ? '' : viewer.displayName}
          schoolName={viewer.schoolNameHint ?? ''}
        />
      </main>
    </>
  );
}
