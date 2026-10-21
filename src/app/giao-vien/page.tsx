import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, ChevronRight, School } from 'lucide-react';
import TodayBoard from '@/components/classroom/TodayBoard';
import TeacherTools from '@/components/classroom/TeacherTools';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import { CreateClassForm, TeacherRequestForm } from '@/components/classroom/TeacherForms';
import { getViewer } from '@/lib/auth/viewer';
import ContactAdmin from '@/components/ContactAdmin';
import { FREE_STUDENT_LIMIT } from '@/lib/contact';
import { createClient } from '@/lib/supabase/server';
import { FEATURES } from '@/lib/features';
import { buildToday, type TodayItem } from '@/lib/classroom/today';

export const metadata: Metadata = { title: 'Giáo viên · EduChain Kids' };
export const dynamic = 'force-dynamic';

type ClassRow = { id: string; name: string; grade: number; join_code: string | null; status: string };

export default async function TeacherHome() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Khu vực giáo viên" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/giao-vien');
  if (viewer.isStudent) redirect('/hoc-sinh');

  if (!viewer.isTeacher) {
    return (
      <>
        <LearnHeader />
        <main className="dash wrap">
          <div className="dash-head">
            <div><p className="dash-kicker">Giáo viên</p><h1>Chào {viewer.displayName}!</h1></div>
            <SignOutButton />
          </div>
          <section className="dash-card">
            <h2>Đăng ký dùng miễn phí cho giáo viên</h2>
            <p>Nhập tên trường để bắt đầu ngay — không cần chờ duyệt. Gói miễn phí: <strong>1 lớp, tối đa {FREE_STUDENT_LIMIT} học sinh</strong>, dùng đủ các công cụ giao bài, đề kiểm tra, phiếu bài tập. Muốn thêm học sinh, liên hệ quản trị.</p>
            <TeacherRequestForm schoolHint={viewer.schoolNameHint} />
          </section>
          <ContactAdmin title="Liên hệ quản trị" compact />
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const [{ data: classes }, { data: members }, { data: school }, { data: planRows }] = await Promise.all([
    supabase.from('classes').select('id, name, grade, join_code, status').order('created_at'),
    supabase.from('class_memberships').select('class_id').eq('status', 'active'),
    viewer.teacherSchoolId ? supabase.from('schools').select('name').eq('id', viewer.teacherSchoolId).maybeSingle() : Promise.resolve({ data: null }),
    supabase.rpc('teacher_my_plan'),
  ]);
  const plan = ((planRows ?? []) as { student_limit: number; students_used: number }[])[0];
  const planText = plan ? `${plan.student_limit <= FREE_STUDENT_LIMIT ? 'Gói miễn phí' : 'Gói của thầy cô'}: ${plan.students_used}/${plan.student_limit} học sinh` : null;
  const count = new Map<string, number>();
  for (const m of (members ?? []) as { class_id: string }[]) count.set(m.class_id, (count.get(m.class_id) ?? 0) + 1);
  const list = (classes ?? []) as ClassRow[];

  // Việc hôm nay của lớp đang dạy (lỗi / chưa chạy migration thì bỏ qua phần đó)
  const active = list.find((c) => c.status === 'active');
  let today: TodayItem[] = [];
  if (active) {
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const [{ data: plans, error: planErr }, { data: asg, error: asgErr }, { data: mem }] = await Promise.all([
      supabase.rpc('teacher_list_plans', { p_class: active.id }),
      supabase.rpc('teacher_list_assignments', { p_class: active.id }),
      supabase.from('class_memberships').select('student_id').eq('class_id', active.id).eq('status', 'active'),
    ]);
    const ids = ((mem ?? []) as { student_id: string }[]).map((m) => m.student_id);
    const { data: recent } = ids.length
      ? await supabase.from('lesson_results').select('student_id').in('student_id', ids).gte('created_at', since).limit(3000)
      : { data: [] };
    today = buildToday({
      classId: active.id,
      grade: active.grade,
      plans: planErr ? null : (plans ?? []) as Parameters<typeof buildToday>[0]['plans'],
      assignments: asgErr ? null : (asg ?? []) as Parameters<typeof buildToday>[0]['assignments'],
      students: ids.length,
      activeLast7: new Set(((recent ?? []) as { student_id: string }[]).map((r) => r.student_id)).size,
      recordsOn: FEATURES.teacherRecords,
    });
  }

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <div className="dash-head">
          <div>
            <p className="dash-kicker"><School aria-hidden="true" /> {(school as { name?: string } | null)?.name ?? 'Giáo viên'}</p>
            <h1>Lớp của {viewer.displayName}</h1>
          </div>
          <SignOutButton />
        </div>

        {list.some((c) => c.status === 'active') ? (
          <p className="adm-alert is-info">Mỗi giáo viên phụ trách <strong>1 lớp</strong>{planText ? <> · <strong>{planText}</strong></> : ' (tối đa 40 học sinh)'}. Cuối năm học, lưu trữ lớp hiện tại để tạo lớp mới.</p>
        ) : (
          <section className="dash-card">
            <h2>Tạo lớp</h2>
            <p className="dash-muted">Mỗi giáo viên phụ trách 1 lớp{planText ? ` · ${planText}` : ', tối đa 40 học sinh'}.</p>
            <CreateClassForm />
          </section>
        )}

        {plan && plan.students_used >= plan.student_limit && (
          <ContactAdmin note={`Thầy cô đã dùng hết ${plan.student_limit} chỗ học sinh của gói. Liên hệ để được mở thêm.`} />
        )}

        {active && <TodayBoard className={active.name} items={today} />}

        {active && <TeacherTools classId={active.id} className={active.name} />}

        <section className="dash-section">
          <h2>Các lớp đang quản lý</h2>
          {list.length === 0 ? (
            <p className="dash-muted">Chưa có lớp nào. Tạo lớp đầu tiên ở trên, rồi thêm học sinh và in thẻ đăng nhập.</p>
          ) : (
            <ul className="class-list">
              {list.map((c) => (
                <li key={c.id}>
                  <Link href={`/giao-vien/lop/${c.id}`} className={`class-tile${c.status !== 'active' ? ' is-archived' : ''}`}>
                    <span className="class-tile-name">Lớp {c.name}</span>
                    <span className="class-tile-meta">Khối {c.grade} · {count.get(c.id) ?? 0} học sinh{c.status !== 'active' ? ' · đã lưu trữ' : ''}</span>
                    <span className="class-tile-code">Mã lớp <strong>{c.join_code}</strong></span>
                    <ChevronRight className="class-tile-go" aria-hidden="true" />
                  </Link>
                  {c.status === 'active' && (
                    <Link href={`/giao-vien/lop/${c.id}/thu-khen`} className="class-quick"><Award aria-hidden="true" /> Thư khen lớp {c.name}</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
