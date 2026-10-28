import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ProgressReports from '@/components/classroom/ProgressReports';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import { formsOf } from '@/lib/curriculum';
import { questionMeta, type ResultRow } from '@/lib/classroom/gaps';
import { compareViName } from '@/lib/classroom/names';
import type { CompactResult } from '@/lib/classroom/report';
import { createClient } from '@/lib/supabase/server';
import { classRow, classRoster, warmClass } from '@/lib/classroom/class-page';
import type { SubjectCode } from '@/lib/types';

export const metadata: Metadata = { title: 'Phiếu báo tiến bộ · EduChain Kids' };
export const dynamic = 'force-dynamic';

const SUBJECTS: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];

// Phiếu báo tiến bộ cho phụ huynh. Quyền: giáo viên dạy lớp (RLS lesson_results chỉ trả học sinh lớp mình dạy).
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Phiếu báo tiến bộ" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/phieu-tien-bo`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: cls } = await classRow(id);
  if (!cls) notFound();
  const c = cls as { id: string; name: string; grade: number };
  const { data: roster } = await classRoster(id);
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));
  // 120 ngày gần nhất là đủ cho tuần / tháng / 4 tuần và khoảng liền trước để so sánh
  const since = new Date(Date.now() - 120 * 86400_000).toISOString();
  const { data: rows, error } = students.length
    ? await supabase.from('lesson_results').select('student_id, lesson_code, lesson_title, subject_code, score, total, answers, created_at')
      .in('student_id', students.map((s) => s.id)).gte('created_at', since).order('created_at', { ascending: false }).limit(6000)
    : { data: [], error: null };

  // Đổi mã câu → tên dạng bài ở máy chủ, gửi xuống trình duyệt bản rút gọn (không có nội dung câu hỏi, đáp án)
  const idx = new Map(students.map((s, i) => [s.id, i]));
  const formNames = new Map<string, string>();
  for (const s of SUBJECTS) for (const f of formsOf(s)) formNames.set(`${s}|${f.code}`, f.name);
  const compact: CompactResult[] = [];
  for (const r of (rows ?? []) as ResultRow[]) {
    const s = idx.get(r.student_id);
    if (s === undefined) continue;
    const sub = SUBJECTS.includes(r.subject_code as SubjectCode) ? (r.subject_code as SubjectCode) : null;
    const a: [string, boolean][] = [];
    for (const x of r.answers ?? []) {
      if (!x || typeof x.q !== 'string') continue;
      const m = questionMeta(x.q);
      a.push([m && sub ? formNames.get(`${sub}|${m.form}`) ?? 'Câu khác' : 'Câu khác', !!x.ok]);
    }
    compact.push({ s, l: r.lesson_title ?? r.lesson_code, c: r.lesson_code, sub, t: new Date(r.created_at).getTime(), a });
  }

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <ProgressReports classId={c.id} className={c.name} students={students} rows={compact} teacherName={viewer.displayName === 'Bạn' ? '' : viewer.displayName} failed={Boolean(error)} school={viewer.schoolNameHint ?? ''} />
      </main>
    </>
  );
}
