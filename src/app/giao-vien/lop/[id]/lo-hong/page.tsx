import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import type { RosterRow } from '@/components/classroom/ClassManager';
import { getViewer } from '@/lib/auth/viewer';
import GapsView, { GAP_PERIODS } from '@/components/classroom/GapsView';
import { computeGaps, type ResultRow } from '@/lib/classroom/gaps';
import { compareViName } from '@/lib/classroom/names';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Lỗ hổng kiến thức của lớp · EduChain Kids' };
export const dynamic = 'force-dynamic';


// Gom đúng/sai từng câu các em đã làm trên app theo bài + dạng bài → dạng lớp hay sai, em cần kèm; giao bài ôn ngay.
export default async function GapsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Lỗ hổng kiến thức" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/lo-hong`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const days = GAP_PERIODS.find((p) => String(p.d) === sp.d)?.d ?? 30;

  const supabase = await createClient();
  const { data: cls } = await supabase.from('classes').select('id, name, grade').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const c = cls as { id: string; name: string; grade: number };
  const { data: roster } = await supabase.rpc('teacher_class_roster', { p_class: id });
  const students = ((roster ?? []) as RosterRow[])
    .filter((r) => r.membership_status === 'active')
    .map((r) => ({ id: r.student_id, name: r.display_name }))
    .sort((a, b) => compareViName(a.name, b.name));
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  // RLS: giáo viên chỉ đọc được kết quả của học sinh lớp mình dạy
  const { data: rows, error } = students.length
    ? await supabase.from('lesson_results')
      .select('student_id, lesson_code, lesson_title, subject_code, score, total, answers, created_at')
      .in('student_id', students.map((s) => s.id)).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(5000)
    : { data: [], error: null };
  const g = computeGaps((rows ?? []) as ResultRow[], students);

  return (
    <>
      <LearnHeader />
      <GapsView id={id} c={c} students={students} days={days} g={g} failed={Boolean(error)} />
    </>
  );
}
