import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, GraduationCap } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ClassManager, { type BillingRow, type RosterRow, type SummaryRow } from '@/components/classroom/ClassManager';
import ClassProgress from '@/components/classroom/ClassProgress';
import { ClassLeaderboard } from '@/components/achievements/LiveAchievements';
import type { LessonResult } from '@/lib/classroom/progress';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';
import { classRoster, warmClass } from '@/lib/classroom/class-page';
import { FEATURES } from '@/lib/features';

export const metadata: Metadata = { title: 'Quản lý lớp · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Quản lý một lớp. Quyền được kiểm tra 2 lớp: ở đây (phải là giáo viên) và trong database
// (RLS chỉ trả lớp được phân công; các hàm teacher_* báo not_allowed với lớp khác).
export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  warmClass(id);
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Quản lý lớp" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: cls } = await supabase.from('classes').select('id, name, grade, join_code, status').eq('id', id).maybeSingle();
  if (!cls) notFound(); // lớp không tồn tại HOẶC không được phân công — trả cùng một kết quả

  const [{ data: roster }, { data: summary }, { data: pinRows, error: pinErr }, { data: billing }, { data: planRows }] = await Promise.all([
    classRoster(id),
    supabase.rpc('class_results_summary', { p_class: id }),
    // PIN học sinh (migration 0009) — chỉ giáo viên của lớp đọc được; lỗi (chưa chạy migration) thì coi như chưa có PIN
    supabase.rpc('teacher_class_pins', { p_class: id }),
    // Tình trạng học phí (migration 0018) — giáo viên chỉ xem; chưa chạy migration thì bỏ qua
    supabase.rpc('teacher_class_billing', { p_class: id }),
    // Gói của giáo viên (migration 0019): giới hạn học sinh; quản trị xem lớp thì không giới hạn
    supabase.rpc('teacher_my_plan'),
  ]);
  // em đang tạm khoá vì hết chỗ trong gói (migration 0045); chưa chạy migration thì bỏ qua
  const { data: lockedRows } = await supabase.rpc('teacher_locked_students', { p_class: id });
  const lockedIds = ((lockedRows ?? []) as { student_id: string }[]).map((r) => r.student_id);
  const planRow = ((planRows ?? []) as { student_limit: number; students_used: number }[])[0];
  const plan = planRow ? { limit: planRow.student_limit, used: planRow.students_used } : null;
  const pins: Record<string, string> = Object.fromEntries(((pinRows ?? []) as { student_id: string; pin: string }[]).map((p) => [p.student_id, p.pin]));
  const rosterRows = (roster ?? []) as RosterRow[];
  const active = rosterRows.filter((r) => r.membership_status === 'active');
  const names = new Map(active.map((r) => [r.student_id, r.display_name]));
  // RLS chỉ trả kết quả của học sinh thuộc lớp giáo viên được phân công
  const { data: results } = active.length
    ? await supabase.from('lesson_results')
        .select('id, student_id, lesson_code, lesson_title, subject_code, grade, muc, score, total, points, duration_ms, created_at')
        .in('student_id', active.map((r) => r.student_id))
        .order('created_at', { ascending: false })
        .limit(5000)
    : { data: [] };

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <Link href="/giao-vien" className="dash-back"><ArrowLeft aria-hidden="true" /> Các lớp</Link>
        {pinErr && (
          <p className="adm-alert is-warn" role="status">
            Chưa đọc được PIN đã lưu (thường do chưa chạy <code>supabase/migrations/0009_teacher_view_pin.sql</code> trên Supabase). Chạy file đó, rồi bấm <strong>Đặt PIN mới</strong> cho từng em để PIN hiện ở cột PIN.
          </p>
        )}
        <ClassManager
          cls={cls as { id: string; name: string; grade: number; join_code: string; status: string }}
          roster={rosterRows}
          summary={(summary ?? []) as SummaryRow[]}
          pins={pins}
          billing={(billing ?? []) as BillingRow[]}
          plan={plan}
          lockedIds={lockedIds}
        />
        {FEATURES.teacherRecords && (
          <section className="dash-section comments-entry no-print">
            <div className="comments-actions">
              <Link href={`/giao-vien/lop/${id}/ket-qua-truong`} className="btn btn-outline"><GraduationCap aria-hidden="true" /> Kết quả học tập trên trường</Link>
              <Link href={`/giao-vien/lop/${id}/nhan-xet`} className="btn btn-outline"><ClipboardCheck aria-hidden="true" /> Nhận xét học sinh (tuần · học kỳ · cả năm)</Link>
            </div>
            <p className="dash-muted">Nhập điểm kiểm tra định kỳ và khen thưởng của các em; hệ thống kết hợp với bài luyện tập trong app để gợi ý mức đạt và lời nhận xét. Thầy cô sửa, lưu và tải Excel để nhập lên hệ thống của trường.</p>
          </section>
        )}
        <ClassLeaderboard classId={id} />
        <ClassProgress classId={id} className={(cls as { name: string }).name} results={(results ?? []) as LessonResult[]} names={names} />
      </main>
    </>
  );
}
