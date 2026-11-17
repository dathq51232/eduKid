import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import LessonPlanner from '@/components/classroom/LessonPlanner';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { computeGaps, type ResultRow } from '@/lib/classroom/gaps';
import { createClient } from '@/lib/supabase/server';
import { classRow, classRoster, warmClass } from '@/lib/classroom/class-page';
import { lessonInfos } from '@/lib/plans/lessons';
import { listDecks } from '@/lib/deck/list-decks';
import type { SubjectCode } from '@/lib/types';
import '@/styles/dash.css';

export const metadata: Metadata = { title: 'Kế hoạch bài dạy · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Kế hoạch bài dạy. Quyền: giáo viên (ở đây) + database (giáo án chỉ người soạn đọc/ghi, chỉ gắn được lớp mình dạy).
export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; sub?: string; plan?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Kế hoạch bài dạy" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/ke-hoach`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Link cũ ?tab=bai-giang: Bài giảng & 3D giờ là mục riêng
  if (sp.tab === 'bai-giang') {
    const q = new URLSearchParams();
    if (sp.sub === 'tg') q.set('tab', 'tg');
    if (/^[0-9a-f-]{36}$/i.test(sp.plan ?? '')) q.set('plan', sp.plan as string);
    redirect(`/giao-vien/lop/${id}/bai-giang-3d${q.size ? `?${q.toString()}` : ''}`);
  }

  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  // Lớp, danh sách em -> kết quả 30 ngày, bài thao giảng: cùng một lượt (trước đây 4 lượt nối tiếp)
  const [{ data: cls }, { students, rows }, decks] = await Promise.all([
    classRow(id),
    // Dạng bài lớp còn hay sai trong 30 ngày (từ bài luyện trên app) — gợi ý cho phần Luyện tập
    classRoster(id).then(async ({ data: roster }) => {
      const students = ((roster ?? []) as RosterRow[]).filter((r) => r.membership_status === 'active').map((r) => ({ id: r.student_id, name: r.display_name }));
      const { data: rows } = students.length
        ? await supabase.from('lesson_results').select('student_id, lesson_code, lesson_title, subject_code, score, total, answers, created_at')
          .in('student_id', students.map((s) => s.id)).gte('created_at', since).order('created_at', { ascending: false }).limit(3000)
        : { data: [] };
      return { students, rows };
    }),
    // Bài thao giảng đã gắn giáo án (migration 0046) — hiện nút Sửa / Trình chiếu trên thẻ tiết ở Tuần dạy
    listDecks(supabase).then((d) => d.rows),
  ]);
  if (!cls) notFound();
  const c = cls as { id: string; name: string; grade: number };
  const { gaps } = computeGaps((rows ?? []) as ResultRow[], students, { maxGaps: 30 });
  const weakForms: Record<SubjectCode, string[]> = { toan: [], 'tieng-viet': [], 'tieng-anh': [] };
  for (const g of gaps) weakForms[g.subject].push(`${g.formName} (${g.lessonTitle}, lớp đúng ${Math.round(g.rate * 100)}%)`);


  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <LessonPlanner classId={c.id} className={c.name} grade={c.grade} school={viewer.schoolNameHint ?? ''} weakForms={weakForms}
          lessonsBySubject={{ toan: lessonInfos('toan', c.grade), 'tieng-viet': lessonInfos('tieng-viet', c.grade), 'tieng-anh': lessonInfos('tieng-anh', c.grade) }}
          decks={decks} initialTab={sp.tab} />
      </main>
    </>
  );
}
