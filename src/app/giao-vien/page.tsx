import type { Metadata } from 'next';
import Link from 'next/link';
import type { Inbox } from '@/lib/classroom/messages';
import { redirect } from 'next/navigation';
import { BookCheck, BookOpen, CalendarDays, Check, ChevronRight, Dices, School, Send, Target } from 'lucide-react';
import { TodoList } from '@/components/classroom/TeacherToday';
import TodaySchedule from '@/components/classroom/TodaySchedule';
import ClassPulse, { type Birthday } from '@/components/classroom/ClassPulse';
import MiniCalendar from '@/components/utils/MiniCalendar';
import MoneyCard from '@/components/utils/MoneyCard';
import LessonPlanAside from '@/components/classroom/LessonPlanAside';
import { alertsOf, summarize, type RangeData } from '@/lib/classroom/diary';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import { CreateClassForm, TeacherRequestForm } from '@/components/classroom/TeacherForms';
import { getViewer } from '@/lib/auth/viewer';
import ContactAdmin from '@/components/ContactAdmin';
import { FREE_STUDENT_LIMIT, TEACHER_TRIAL_DAYS } from '@/lib/contact';
import { fmtDay } from '@/lib/billing';
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
            <p>Nhập tên trường để bắt đầu ngay — không cần chờ duyệt. Giáo viên mới được <strong>dùng thử đủ lớp 40 học sinh trong {TEACHER_TRIAL_DAYS} ngày</strong>, sau đó gói miễn phí 1 lớp, tối đa {FREE_STUDENT_LIMIT} học sinh; dùng đủ các công cụ giao bài, đề kiểm tra, phiếu bài tập. Muốn thêm học sinh, liên hệ quản trị.</p>
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
  const plan = ((planRows ?? []) as { student_limit: number; students_used: number; trial_until?: string | null; base_limit?: number; locked?: number }[])[0];
  const trialUntil = plan?.trial_until ?? null;
  const trialDays = trialUntil ? Math.max(1, Math.ceil((Date.parse(trialUntil) - Date.now()) / 86_400_000)) : 0;
  const planText = plan ? `${trialUntil ? `Dùng thử đủ lớp đến ${fmtDay(trialUntil)}` : plan.student_limit <= FREE_STUDENT_LIMIT ? 'Gói miễn phí' : 'Gói của thầy cô'}: ${plan.students_used}/${plan.student_limit} học sinh` : null;
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
  let inbox: Inbox | null = null;
  let births: Birthday[] = [];
  let birthsOn = false;
  let contactGaps: number | null = null;
  if (active) {
    const since14 = new Date(nowMs - 14 * 86400_000).toISOString();
    const [{ data: plans, error: planErr }, { data: asg, error: asgErr }, { data: roster }, { data: diary, error: diaryErr }, { data: month }, { data: msgs, error: msgErr }, { data: profRaw, error: profErr }, { data: gaps, error: gapErr }] = await Promise.all([
      supabase.rpc('teacher_list_plans', { p_class: active.id }),
      supabase.rpc('teacher_list_assignments', { p_class: active.id }),
      supabase.rpc('teacher_class_roster', { p_class: active.id }),
      // Sổ lớp (migration 0026) — chưa chạy migration thì bỏ qua
      supabase.rpc('teacher_diary_day', { p_class: active.id, p_day: todayIso }),
      supabase.rpc('teacher_diary_range', { p_class: active.id, p_from: `${todayIso.slice(0, 7)}-01`, p_to: todayIso }),
      // Tin nhắn phụ huynh (migration 0037) — chưa chạy migration thì bỏ qua
      supabase.rpc('teacher_messages', { p_class: active.id, p_limit: 5 }),
      // Hồ sơ học sinh (0050): ngày sinh, chỗ ở — chưa chạy migration thì bỏ qua
      supabase.rpc('teacher_student_profiles', { p_class: active.id }),
      // Số em chưa có số điện thoại phụ huynh (0051) — chỉ là con số, không mở danh bạ
      supabase.rpc('teacher_contact_gaps', { p_class: active.id }),
    ]);
    inbox = msgErr ? null : (msgs as Inbox | null);
    const activeRoster = ((roster ?? []) as { student_id: string; display_name: string; membership_status: string; has_account: boolean }[])
      .filter((r) => r.membership_status === 'active');
    const students = activeRoster.map((r) => ({ id: r.student_id, name: r.display_name }));
    const noAccount = activeRoster.filter((r) => !r.has_account).length;
    const prof = profErr ? null : (profRaw ?? {}) as Record<string, { birth: string | null; address: string | null }>;
    birthsOn = Boolean(prof && Object.values(prof).some((p) => p.birth));
    births = prof ? upcomingBirthdays(students, prof, todayIso) : [];
    const profileLack = prof ? students.filter((st) => !prof[st.id]?.birth || !prof[st.id]?.address).length : 0;
    contactGaps = gapErr ? null : Number(gaps ?? 0);
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
    // Việc tự sinh từ dữ liệu lớp (điểm danh đã có ở nút trên cùng và ô số liệu nên không lặp lại ở đây)
    const today0 = births.filter((b) => b.inDays === 0);
    if (today0.length) todo.unshift({ tone: 'soon', title: `Hôm nay sinh nhật ${today0.map((b) => b.short).join(', ')} 🎂`, detail: 'Cả lớp hát mừng sinh nhật, hoặc gửi em một thư khen nhỏ.', href: `/giao-vien/lop/${active.id}/thu-khen`, cta: 'Viết thư khen' });
    if (noAccount) todo.push({ tone: 'soon', title: `${noAccount} em chưa có PIN đăng nhập`, detail: 'Đặt PIN rồi in thẻ để các em vào luyện bài ở nhà.', href: `/giao-vien/lop/${active.id}`, cta: 'Đặt PIN' });
    if (prof && profileLack) todo.push({ tone: 'info', title: `Hồ sơ còn thiếu ${profileLack} em`, detail: 'Chưa có ngày sinh hoặc chỗ ở — dán một lần từ file danh sách của trường.', href: `/giao-vien/lop/${active.id}?xem=ho-so`, cta: 'Bổ sung' });
    if (contactGaps) todo.push({ tone: 'info', title: `${contactGaps} em chưa có số điện thoại phụ huynh`, detail: 'Cần khi nhắn tin, báo vắng; phụ huynh cũng tự thêm được ở Góc phụ huynh.', href: `/giao-vien/lop/${active.id}/danh-ba`, cta: 'Thêm số' });
    if (inbox?.unread) {
      todo.unshift({ tone: 'urgent', title: `${inbox.unread} tin nhắn phụ huynh chưa đọc`, detail: inbox.pending_leave ? `Có ${inbox.pending_leave} tin xin phép nghỉ đang chờ cô đồng ý.` : 'Phụ huynh hỏi han, nhắn cô.', href: `/giao-vien/lop/${active.id}/tin-nhan`, cta: 'Đọc tin' });
    } else if (inbox?.items.length) {
      // Tin nhắn phụ huynh gộp vào "Việc hôm nay": không có tin mới thì chỉ nhắc nhẹ
      todo.push({ tone: 'info', title: 'Tin nhắn phụ huynh', detail: `Không có tin mới · ${inbox.items.length} tin gần đây.`, href: `/giao-vien/lop/${active.id}/tin-nhan`, cta: 'Hộp thư' });
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
            {k?.attendanceSaved
              ? <Link href={`${base}/so-lop`} className="tdy-btn is-done" title="Mở Sổ lớp để sửa"><Check aria-hidden="true" /> Đã điểm danh · {k.students - k.absent}/{k.students}</Link>
              : <Link href={`${base}/so-lop`} className="tdy-btn is-primary"><BookCheck aria-hidden="true" /> Điểm danh</Link>}
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
      {trialUntil && plan && (
        <p className="adm-alert is-info" role="status">
          Thầy cô đang <strong>dùng thử đủ lớp (tối đa 40 học sinh)</strong> đến hết {fmtDay(trialUntil)} — còn {trialDays} ngày.
          Sau đó gói miễn phí giữ {plan.base_limit ?? FREE_STUDENT_LIMIT} em vào lớp sớm nhất; các em còn lại tạm khoá phần học (bài đã làm vẫn giữ) cho đến khi được mở gói.
        </p>
      )}
      {plan && (plan.locked ?? 0) > 0 && (
        <ContactAdmin note={`Đã hết thời gian dùng thử: ${plan.locked} em đang tạm khoá (gói hiện có ${plan.student_limit} chỗ). Liên hệ để mở gói cho cả lớp — các em học lại ngay, không mất bài.`} />
      )}
      {plan && !trialUntil && !(plan.locked ?? 0) && plan.students_used >= plan.student_limit && (
        <ContactAdmin note={`Thầy cô đã dùng hết ${plan.student_limit} chỗ học sinh của gói. Liên hệ để được mở thêm.`} />
      )}

      {active && k && (
        <>
          {/* 1 · Số liệu lớp: một hàng gọn, bấm để mở chi tiết */}
          <section className="tdy-stats" aria-label="Số liệu lớp">
            <Link href={`${base}/so-lop`} className="tdy-stat">
              <span className="tsh-ic tone-yellow"><BookCheck aria-hidden="true" /></span>
              {!k.diaryOn ? <span><b>Chưa bật</b><small>Sổ lớp (migration 0026)</small></span>
                : k.attendanceSaved ? <span><b>{k.students - k.absent}<i>/{k.students}</i></b><small>{k.absent ? `có mặt · ${k.absent} em vắng` : 'có mặt · đủ lớp'}</small></span>
                : <span><b className="is-todo">Chưa điểm danh</b><small>bấm để điểm danh →</small></span>}
            </Link>
            <Link href={`${base}/giao-bai`} className="tdy-stat">
              <span className="tsh-ic tone-blue"><BookOpen aria-hidden="true" /></span>
              <span><b>{k.practiced}<i>/{k.students}</i></b><small>luyện bài 7 ngày</small></span>
              <span className="tdy-spark" aria-label={`Số em luyện bài mỗi ngày: ${k.spark.join(', ')}`}>{k.spark.map((n, i) => <i key={i} className={i === 6 ? 'is-today' : ''} style={{ height: `${12 + (n / maxSpark) * 88}%` }} />)}</span>
            </Link>
            <Link href={`${base}/giao-bai`} className="tdy-stat">
              <span className="tsh-ic tone-violet"><Send aria-hidden="true" /></span>
              {k.openFirst
                ? <span><b>{k.openFirst.done}<i>/{k.openFirst.assigned}</i></b><small title={k.openFirst.title}>đã nộp “{k.openFirst.title}”{k.open > 1 ? ` · +${k.open - 1} bài` : ''}</small></span>
                : <span><b className="is-todo">Chưa có bài giao</b><small>bấm để giao bài →</small></span>}
            </Link>
            <Link href={`${base}/lo-hong`} className="tdy-stat">
              <span className="tsh-ic tone-green"><Target aria-hidden="true" /></span>
              {k.practiced >= 5 && k.rate !== null
                ? <span><b>{pct(k.rate)}<i>%</i></b><small>đúng TB 7 ngày{delta !== null ? <> · <em className={delta >= 0 ? 'is-good' : 'is-bad'}>{delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}%</em></> : ''}</small></span>
                : <span><b className="is-todo">Tỉ lệ đúng</b><small>hiện khi ≥5 em luyện bài{k.practiced ? ` (mới ${k.practiced})` : ''}</small></span>}
            </Link>
          </section>

          {/* 2 · Hai cột: trái = việc phải làm + tiết phải dạy; phải = gợi ý tiết dạy + nhịp của lớp */}
          <div className="tdy-cols">
            <div className="tdy-stack">
              <section className="tdy-card tdy-todo" aria-labelledby="tdy-todo">
                <TodoList items={todo} day={todayIso} headingId="tdy-todo" />
              </section>
              <section className="tdy-card tdy-sched" aria-labelledby="tdy-sched">
                <h2 id="tdy-sched"><CalendarDays aria-hidden="true" /> Hôm nay dạy <Link href={`${base}/ke-hoach`}>Giáo án</Link></h2>
                <TodaySchedule classId={active.id} day={todayIso} base={base} saved={todayPlans} />
              </section>
            </div>

            <div className="tdy-stack">
              <LessonPlanAside classId={active.id} grade={active.grade} />
              <MiniCalendar href={`${base}/lich`} />
              <ClassPulse base={base} births={births} birthsOn={birthsOn} watch={watch}
                unread={inbox?.unread ?? 0} pendingLeave={inbox?.pending_leave ?? 0} recentMsgs={inbox?.items.length ?? 0} contactGaps={contactGaps}
                spark={k.spark} students={k.students} todayIso={todayIso} planText={planText} />
              <MoneyCard href={`${base}/thu-chi`} title="Thu chi cá nhân" fundHref={`${base}/quy-lop`} classId={active.id} />
            </div>
          </div>
        </>
      )}

      {!active && (
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
        </section>
      )}
    </main>
  );
}

type Kpis = {
  students: number; diaryOn: boolean; attendanceSaved: boolean; absent: number; practiced: number; spark: number[];
  open: number; openFirst: { title: string; done: number; assigned: number; due: string | null } | null; rate: number | null; prevRate: number | null;
};
export type Watch = { id: string; name: string; text: string; tone: 'warn' | 'good' };

/** Sinh nhật trong 7 ngày tới (tính theo ngày Việt Nam) */
function upcomingBirthdays(students: { id: string; name: string }[], prof: Record<string, { birth: string | null }>, todayIso: string): Birthday[] {
  const t0 = Date.parse(`${todayIso}T00:00:00Z`);
  const year = +todayIso.slice(0, 4);
  const out: Birthday[] = [];
  for (const st of students) {
    const b = prof[st.id]?.birth;
    if (!b) continue;
    const [by, bm, bd] = b.split('-').map(Number);
    for (const y of [year, year + 1]) {
      const days = Math.round((Date.UTC(y, bm - 1, bd) - t0) / 86_400_000);
      if (days >= 0 && days <= 6) {
        out.push({ id: st.id, name: st.name, short: st.name.trim().split(/\s+/).slice(-2).join(' '), inDays: days, date: `${String(bd).padStart(2, '0')}/${String(bm).padStart(2, '0')}`, age: y - by });
        break;
      }
    }
  }
  return out.sort((a, b) => a.inDays - b.inDays);
}
