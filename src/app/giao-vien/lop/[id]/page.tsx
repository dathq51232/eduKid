import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ClipboardCheck, GraduationCap } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import ClassManager, { type BillingRow, type RosterRow, type SummaryRow } from '@/components/classroom/ClassManager';
import FeeWaivers from '@/components/classroom/FeeWaivers';
import ClassFeePlan from '@/components/classroom/ClassFeePlan';
import ClassProgress from '@/components/classroom/ClassProgress';
import { ClassLeaderboard } from '@/components/achievements/LiveAchievements';
import { lessonsOfClass, type ClassLessonRow, type LessonResult } from '@/lib/classroom/progress';

type StatRow = { lesson_code: string; title: string; subject: string | null; students: number; attempts: number; avg_best: number; low_students: string[] | null; last: string };
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';
import { classRoster, warmClass } from '@/lib/classroom/class-page';
import { compareViName } from '@/lib/classroom/names';
import { FEATURES } from '@/lib/features';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/comments.css';
import '@/styles/dash.css';

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
  // Mọi truy vấn chạy cùng một lượt (trước đây 4 lượt nối tiếp). Lớp không được phân công: RLS / hàm teacher_* không trả gì.
  const rosterP = classRoster(id);
  const [{ data: cls }, { data: roster }, { data: summary }, { data: pinRows, error: pinErr }, { data: billing }, { data: planRows }, { data: lockedRows }, { data: lessonRows }] = await Promise.all([
    supabase.from('classes').select('id, name, grade, join_code, status').eq('id', id).maybeSingle(),
    rosterP,
    supabase.rpc('class_results_summary', { p_class: id }),
    // PIN học sinh (migration 0009) — chỉ giáo viên của lớp đọc được; lỗi (chưa chạy migration) thì coi như chưa có PIN
    supabase.rpc('teacher_class_pins', { p_class: id }),
    // Tình trạng học phí (migration 0018) — giáo viên chỉ xem; chưa chạy migration thì bỏ qua
    supabase.rpc('teacher_class_billing', { p_class: id }),
    // Gói của giáo viên (migration 0019): giới hạn học sinh; quản trị xem lớp thì không giới hạn
    supabase.rpc('teacher_my_plan'),
    // em đang tạm khoá vì hết chỗ trong gói (migration 0045); chưa chạy migration thì bỏ qua
    supabase.rpc('teacher_locked_students', { p_class: id }),
    // RLS chỉ trả kết quả của học sinh thuộc lớp giáo viên được phân công; chờ danh sách em rồi hỏi ngay
    // Tiến độ theo bài: database tổng hợp sẵn (0078) → vài chục dòng thay vì 5.000 dòng kết quả.
    // Chưa chạy migration 0078 thì quay về cách cũ (tải kết quả rồi gom ở máy chủ web).
    supabase.rpc('teacher_class_lesson_stats', { p_class: id }).then(async ({ data, error }) => {
      if (!error) return { data: ((data ?? []) as StatRow[]).map((r): ClassLessonRow => ({ lesson_code: r.lesson_code, title: r.title, subject: r.subject, students: r.students, attempts: r.attempts, avgBestPercent: r.avg_best, lowStudents: r.low_students ?? [], last: r.last })) };
      const { data: rows } = await rosterP;
      const ids = ((rows ?? []) as RosterRow[]).filter((r) => r.membership_status === 'active').map((r) => r.student_id);
      if (!ids.length) return { data: [] as ClassLessonRow[] };
      const { data: res } = await supabase.from('lesson_results')
        .select('id, student_id, lesson_code, lesson_title, subject_code, grade, muc, score, total, points, duration_ms, created_at')
        .in('student_id', ids).order('created_at', { ascending: false }).limit(5000);
      return { data: lessonsOfClass((res ?? []) as LessonResult[]) };
    }),
  ]);
  if (!cls) notFound(); // lớp không tồn tại HOẶC không được phân công — trả cùng một kết quả
  const lockedIds = ((lockedRows ?? []) as { student_id: string }[]).map((r) => r.student_id);
  const planRow = ((planRows ?? []) as { student_limit: number; students_used: number; open_plan?: boolean }[])[0];
  // đang thu học phí (0076): cô dùng miễn phí đủ lớp → chỉ còn giới hạn 40 em/lớp
  const plan = planRow && !planRow.open_plan ? { limit: planRow.student_limit, used: planRow.students_used } : null;
  const pins: Record<string, string> = Object.fromEntries(((pinRows ?? []) as { student_id: string; pin: string }[]).map((p) => [p.student_id, p.pin]));
  // Xếp theo tên tiếng Việt A–Z (tên → họ đệm), cùng thứ tự với Sổ lớp, Danh bạ…
  const rosterRows = ((roster ?? []) as RosterRow[]).slice().sort((x, y) => compareViName(x.display_name, y.display_name));
  const active = rosterRows.filter((r) => r.membership_status === 'active');
  const names = new Map(active.map((r) => [r.student_id, r.display_name]));

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
        {/* Gói học phí cô công bố cho lớp (migration 0075) — tự ẩn khi chưa chạy migration */}
        <ClassFeePlan classId={id} />
        {/* Đặc cách học phí (migration 0074): chỉ hiện khi đang thu phí */}
        {((billing ?? []) as BillingRow[]).some((b) => b.reason !== 'free') && (
          <FeeWaivers classId={id} students={active.map((r) => ({ id: r.student_id, name: r.display_name, paid: ((billing ?? []) as BillingRow[]).some((b) => b.student_id === r.student_id && b.reason === 'paid') }))} />
        )}
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
        <ClassProgress classId={id} className={(cls as { name: string }).name} rows={lessonRows ?? []} names={names} />
      </main>
    </>
  );
}
