import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookCheck, BookOpen, CalendarDays, ChevronRight, Dices, Eye, ListTodo, School, Send, Target, Zap } from 'lucide-react';
import { QuickTools, TodoList } from '@/components/classroom/TeacherToday';
import { alertsOf, summarize, type RangeData } from '@/lib/classroom/diary';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
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

  const active = list.find((c) => c.status === 'active');
  const nowMs = Date.now();
  const vnNow = new Date(nowMs + 7 * 3600_000);
  const todayIso = vnNow.toISOString().slice(0, 10);
  const weekday = vnNow.getUTCDay();
  const firstName = viewer.displayName.trim().split(/\s+/).slice(-2).join(' ');

  // ------------------------------------------------------------ số liệu "Hôm nay" của lớp đang dạy
  let todo: TodayItem[] = [];
  let k: Kpis | null = null;
  let todayPlans: { id: string; subject: string; title: string; period: number | null }[] = [];
  let watch: Watch[] = [];
  if (active) {
    const since14 = new Date(nowMs - 14 * 86400_000).toISOString();
    const [{ data: plans, error: planErr }, { data: asg, error: asgErr }, { data: roster }, { data: diary, error: diaryErr }, { data: month }] = await Promise.all([
      supabase.rpc('teacher_list_plans', { p_class: active.id }),
      supabase.rpc('teacher_list_assignments', { p_class: active.id }),
      supabase.rpc('teacher_class_roster', { p_class: active.id }),
      // Sổ lớp (migration 0026) — chưa chạy migration thì bỏ qua
      supabase.rpc('teacher_diary_day', { p_class: active.id, p_day: todayIso }),
      supabase.rpc('teacher_diary_range', { p_class: active.id, p_from: `${todayIso.slice(0, 7)}-01`, p_to: todayIso }),
    ]);
    const students = ((roster ?? []) as { student_id: string; display_name: string; membership_status: string }[])
      .filter((r) => r.membership_status === 'active').map((r) => ({ id: r.student_id, name: r.display_name }));
    const ids = students.map((x) => x.id);
    const { data: res } = ids.length
      ? await supabase.from('lesson_results').select('student_id, score, total, created_at').in('student_id', ids).gte('created_at', since14).limit(5000)
      : { data: [] };
    const results = (res ?? []) as { student_id: string; score: number; total: number; created_at: string }[];
    const ms = (r: { created_at: string }) => new Date(r.created_at).getTime();
    const week = results.filter((r) => ms(r) >= nowMs - 7 * 86400_000), prev = results.filter((r) => ms(r) < nowMs - 7 * 86400_000);
    const rate = (xs: typeof results) => { const t = xs.reduce((a, r) => a + (r.total || 0), 0); return t ? xs.reduce((a, r) => a + (r.score || 0), 0) / t : null; };
    // biểu đồ nhỏ: số em luyện bài từng ngày trong 7 ngày
    const spark = Array.from({ length: 7 }, (_, d) => {
      const from = nowMs - (7 - d) * 86400_000, to = from + 86400_000;
      return new Set(results.filter((r) => ms(r) >= from && ms(r) < to).map((r) => r.student_id)).size;
    });
    const asgList = asgErr ? [] : (asg ?? []) as { title: string; due_at: string | null; status: string; assigned: number; done: number }[];
    const open = asgList.filter((a) => a.status === 'open').sort((a, b) => (a.due_at ?? '9').localeCompare(b.due_at ?? '9'));
    const d = diaryErr ? null : (diary as { saved_at: string | null; entries: { student_id: string; status: string }[] } | null);
    k = {
      students: ids.length,
      diaryOn: !diaryErr,
      attendanceSaved: Boolean(d?.saved_at),
      absent: d ? d.entries.filter((e) => e.status !== 'present').length : 0,
      practiced: new Set(week.map((r) => r.student_id)).size,
      spark,
      open: open.length,
      openFirst: open[0] ? { title: open[0].title, done: open[0].done, assigned: open[0].assigned, due: open[0].due_at } : null,
      rate: rate(week),
      prevRate: rate(prev),
    };
    todo = buildToday({
      classId: active.id,
      grade: active.grade,
      plans: planErr ? null : (plans ?? []) as Parameters<typeof buildToday>[0]['plans'],
      assignments: asgErr ? null : asgList as Parameters<typeof buildToday>[0]['assignments'],
      students: ids.length,
      activeLast7: k.practiced,
      recordsOn: FEATURES.teacherRecords,
    }).filter((t) => !t.title.startsWith('Hôm nay dạy')); // lịch hôm nay đã có ô riêng
    if (k.diaryOn && ids.length && weekday >= 1 && weekday <= 5) {
      todo.unshift(k.attendanceSaved
        ? { tone: 'done', title: 'Điểm danh hôm nay', detail: `${ids.length - k.absent}/${ids.length} em có mặt.`, href: `/giao-vien/lop/${active.id}/so-lop`, cta: 'Mở Sổ lớp' }
        : { tone: 'urgent', title: 'Điểm danh lớp ' + active.name, detail: 'Cả lớp mặc định có mặt, chỉ cần bấm em vắng.', href: `/giao-vien/lop/${active.id}/so-lop`, cta: 'Điểm danh' });
    }
    todayPlans = planErr ? [] : ((plans ?? []) as { id: string; subject: string; title: string; period: number | null; teach_date: string | null }[])
      .filter((p) => p.teach_date === todayIso).sort((a, b) => (a.period ?? 99) - (b.period ?? 99));
    // cần để ý: từ Sổ lớp tháng này + em làm đúng dưới một nửa trong 2 tuần
    const sum = month ? summarize(students, month as RangeData) : null;
    const fromDiary: Watch[] = sum ? alertsOf(sum.rows).map((a) => ({ id: a.studentId, name: a.strong, text: a.text.replace(/\.$/, ''), tone: a.tone })) : [];
    const weak: Watch[] = students.map((st): Watch | null => {
      const mine = results.filter((r) => r.student_id === st.id);
      const r = rate(mine);
      return mine.length >= 3 && r !== null && r < 0.5 ? { id: st.id, name: st.name, text: `Đúng ${Math.round(r * 100)}% trong ${mine.length} bài, 2 tuần qua`, tone: 'warn' } : null;
    }).filter((x): x is Watch => x !== null);
    const seen = new Set<string>();
    watch = [...fromDiary.filter((w) => w.tone === 'warn'), ...weak, ...fromDiary.filter((w) => w.tone === 'good')]
      .filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true))).slice(0, 5);
  }

  const DAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dateLabel = `${DAYS[weekday]}, ${todayIso.slice(8)}/${todayIso.slice(5, 7)}/${todayIso.slice(0, 4)}`;
  const base = active ? `/giao-vien/lop/${active.id}` : '';
  const pct = (x: number | null) => (x === null ? '–' : `${Math.round(x * 100)}`);
  const delta = k && k.rate !== null && k.prevRate !== null ? Math.round((k.rate - k.prevRate) * 100) : null;
  const maxSpark = Math.max(1, ...(k?.spark ?? [1]));
  const ddmm = (iso: string | null) => (iso ? `${new Date(iso).getDate()}/${new Date(iso).getMonth() + 1}` : '');

  return (
    <main className="tdy">
      <header className="tdy-head">
        <div>
          <p className="tdy-date">{dateLabel}{todayPlans.length ? ` · hôm nay có ${todayPlans.length} tiết đã soạn` : ''}</p>
          <h1>Chào {firstName} <span aria-hidden="true">👋</span></h1>
        </div>
        {active && (
          <div className="tdy-actions">
            <Link href={`${base}/goi-ten`} className="tdy-btn"><Dices aria-hidden="true" /> Gọi tên</Link>
            <Link href={`${base}/giao-bai`} className="tdy-btn"><Send aria-hidden="true" /> Giao bài</Link>
            <Link href={`${base}/so-lop`} className="tdy-btn is-primary"><BookCheck aria-hidden="true" /> Điểm danh</Link>
          </div>
        )}
      </header>

      {!active && (
        <section className="tdy-card tdy-create">
          <h2>Tạo lớp đầu tiên</h2>
          <p className="dash-muted">Mỗi giáo viên phụ trách 1 lớp{planText ? ` · ${planText}` : ', tối đa 40 học sinh'}. Tạo lớp rồi thêm học sinh và in thẻ đăng nhập.</p>
          <CreateClassForm />
        </section>
      )}
      {plan && plan.students_used >= plan.student_limit && (
        <ContactAdmin note={`Thầy cô đã dùng hết ${plan.student_limit} chỗ học sinh của gói. Liên hệ để được mở thêm.`} />
      )}

      {active && k && (
        <>
          <section className="tdy-kpis" aria-label="Số liệu lớp">
            <Link href={`${base}/so-lop`} className="tdy-card tdy-kpi">
              <span className="tdy-kpi-lab"><span className="tsh-ic tone-yellow"><BookCheck aria-hidden="true" /></span>Điểm danh hôm nay</span>
              {!k.diaryOn ? <><b className="tdy-kpi-val is-sm">Chưa bật</b><span className="tdy-kpi-sub">Chạy migration 0026 để dùng Sổ lớp</span></>
                : k.attendanceSaved ? <><b className="tdy-kpi-val">{k.students - k.absent}<small>/{k.students} có mặt</small></b><span className="tdy-bar"><i style={{ width: `${((k.students - k.absent) / Math.max(1, k.students)) * 100}%` }} className="is-green" /></span><span className="tdy-kpi-sub">{k.absent ? `${k.absent} em vắng` : 'Cả lớp đi học đủ'}</span></>
                : <><b className="tdy-kpi-val is-muted">—<small> chưa điểm danh</small></b><span className="tdy-bar"><i style={{ width: 0 }} /></span><span className="tdy-kpi-sub">Bấm để điểm danh</span></>}
            </Link>
            <Link href={`${base}/giao-bai`} className="tdy-card tdy-kpi">
              <span className="tdy-kpi-lab"><span className="tsh-ic tone-blue"><BookOpen aria-hidden="true" /></span>Luyện bài 7 ngày</span>
              <b className="tdy-kpi-val">{k.practiced}<small>/{k.students} em</small></b>
              <span className="tdy-spark" aria-label={`Số em luyện bài mỗi ngày: ${k.spark.join(', ')}`}>{k.spark.map((n, i) => <i key={i} className={i === 6 ? 'is-today' : ''} style={{ height: `${12 + (n / maxSpark) * 88}%` }} />)}</span>
              <span className="tdy-kpi-sub">{k.students - k.practiced > 0 ? <><b className="is-bad">{k.students - k.practiced} em</b> chưa luyện bài nào</> : 'Cả lớp đều đã luyện bài'}</span>
            </Link>
            <Link href={`${base}/giao-bai`} className="tdy-card tdy-kpi">
              <span className="tdy-kpi-lab"><span className="tsh-ic tone-violet"><Send aria-hidden="true" /></span>Bài giao đang mở</span>
              {k.openFirst ? <>
                <b className="tdy-kpi-val">{k.openFirst.done}<small>/{k.openFirst.assigned} đã nộp</small></b>
                <span className="tdy-bar"><i className="is-violet" style={{ width: `${(k.openFirst.done / Math.max(1, k.openFirst.assigned)) * 100}%` }} /></span>
                <span className="tdy-kpi-sub">“{k.openFirst.title}”{k.openFirst.due ? ` · hạn ${ddmm(k.openFirst.due)}` : ''}{k.open > 1 ? ` · +${k.open - 1} bài` : ''}</span>
              </> : <><b className="tdy-kpi-val is-sm">Chưa có</b><span className="tdy-kpi-sub">Giao một bài ngắn cho cả lớp</span></>}
            </Link>
            <Link href={`${base}/lo-hong`} className="tdy-card tdy-kpi">
              <span className="tdy-kpi-lab"><span className="tsh-ic tone-green"><Target aria-hidden="true" /></span>Đúng trung bình</span>
              <b className="tdy-kpi-val">{pct(k.rate)}<small>%</small></b>
              <span className="tdy-bar"><i className="is-green" style={{ width: `${(k.rate ?? 0) * 100}%` }} /></span>
              <span className="tdy-kpi-sub">{delta === null ? '7 ngày qua' : <><b className={delta >= 0 ? 'is-good' : 'is-bad'}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%</b> so với tuần trước</>}</span>
            </Link>
          </section>

          <div className="tdy-grid">
            <section className="tdy-card tdy-todo" aria-labelledby="tdy-todo">
              <h2 id="tdy-todo"><ListTodo aria-hidden="true" /> Việc cần làm</h2>
              <TodoList items={todo} day={todayIso} />
            </section>

            <section className="tdy-card tdy-sched" aria-labelledby="tdy-sched">
              <h2 id="tdy-sched"><CalendarDays aria-hidden="true" /> Lịch hôm nay <Link href={`${base}/ke-hoach`}>Giáo án</Link></h2>
              {todayPlans.length === 0 ? (
                <div className="tdy-empty">
                  <p className="dash-muted">Chưa có tiết nào được soạn cho hôm nay.</p>
                  <Link href={`${base}/ke-hoach`} className="tdy-go">Nạp lịch báo giảng</Link>
                </div>
              ) : (
                <ul className="tdy-slots">
                  {todayPlans.map((p) => (
                    <li key={p.id} className="tdy-slot">
                      <span className="tdy-slot-t">{p.period ? `Tiết ${p.period}` : '—'}</span>
                      <span className="tdy-slot-s"><b>{SUBJECT_NAMES[p.subject as keyof typeof SUBJECT_NAMES] ?? p.subject}</b><span>{p.title}</span></span>
                      <Link href={`${base}/goi-ten`} className="tdy-chip is-blue" title="Gọi tên dò bài cũ">🎡 Dò bài</Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="tdy-card tdy-watch" aria-labelledby="tdy-watch">
              <h2 id="tdy-watch"><Eye aria-hidden="true" /> Cần để ý</h2>
              {watch.length === 0 ? <p className="dash-muted">Chưa có em nào cần chú ý. Số liệu lấy từ Sổ lớp và bài luyện 2 tuần qua.</p> : (
                <ul className="tdy-kids">
                  {watch.map((w) => (
                    <li key={w.id}>
                      <Link href={`${base}/hoc-sinh/${w.id}`} className="tdy-kid">
                        <span className={`tdy-kid-av is-${w.tone}`} aria-hidden="true">{w.name.trim().split(/\s+/).slice(-2).map((x) => x[0]).join('')}</span>
                        <span><b>{w.name}</b><small>{w.text}</small></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="tdy-quick">
            <h2 id="tdy-quick" className="tdy-sect"><Zap aria-hidden="true" /> Dùng nhanh <span>· tự sắp theo số lần thầy cô mở trên máy này</span></h2>
            <QuickTools classId={active.id} />
          </section>
        </>
      )}

      <section aria-labelledby="tdy-classes">
        <h2 id="tdy-classes" className="tdy-sect"><School aria-hidden="true" /> Lớp của tôi <span>· {(school as { name?: string } | null)?.name ?? 'Giáo viên'}{planText ? ` · ${planText}` : ''}</span></h2>
        {list.length === 0 ? <p className="dash-muted">Chưa có lớp nào.</p> : (
          <ul className="class-list">
            {list.map((c) => (
              <li key={c.id}>
                <Link href={`/giao-vien/lop/${c.id}`} className={`class-tile${c.status !== 'active' ? ' is-archived' : ''}`}>
                  <span className="class-tile-name">Lớp {c.name}</span>
                  <span className="class-tile-meta">Khối {c.grade} · {count.get(c.id) ?? 0} học sinh{c.status !== 'active' ? ' · đã lưu trữ' : ''}</span>
                  <span className="class-tile-code">Mã lớp <strong>{c.join_code}</strong></span>
                  <ChevronRight className="class-tile-go" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="dash-muted tdy-note">Mỗi giáo viên phụ trách 1 lớp. Cuối năm học, lưu trữ lớp hiện tại (trong trang Học sinh &amp; mã lớp) để tạo lớp mới.</p>
      </section>
    </main>
  );
}

type Kpis = {
  students: number; diaryOn: boolean; attendanceSaved: boolean; absent: number; practiced: number; spark: number[];
  open: number; openFirst: { title: string; done: number; assigned: number; due: string | null } | null; rate: number | null; prevRate: number | null;
};
type Watch = { id: string; name: string; text: string; tone: 'warn' | 'good' };
