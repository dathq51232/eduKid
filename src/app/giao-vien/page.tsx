import type { Metadata } from 'next';
import ShareApp from '@/components/ShareApp';
import Link from 'next/link';
import type { Inbox } from '@/lib/classroom/messages';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Bell, BookCheck, CalendarDays, Check, ChevronRight, Library, Moon, NotebookPen, School, Send } from 'lucide-react';
import { HomeSearch, HonorificPick, QuickTools, TodoList } from '@/components/classroom/TeacherToday';
import { cookies } from 'next/headers';
import { NextLessonCard, TodayLessonCount, WeekSchedule, type SavedSlot } from '@/components/classroom/TodaySchedule';
import { schoolWeek } from '@/lib/classroom/school-week';
import { DashIcon } from '@/components/classroom/dash-icons';
import { LUNAR_MONTH_NAME, canChiYear, solarToLunar } from '@/lib/utils/lunar';
import { type Birthday } from '@/components/classroom/ClassPulse';
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
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { schoolName, teacherClasses } from '@/lib/classroom/teacher-home';
import { FEATURES } from '@/lib/features';
import { buildToday, type TodayItem } from '@/lib/classroom/today';
import '@/styles/adm.css';
import '@/styles/tdy.css';
import '@/styles/class.css';
import '@/styles/dash.css';

export const metadata: Metadata = { title: 'Giáo viên · EduChain Kids' };
export const dynamic = 'force-dynamic';

export default async function TeacherHome() {
  // danh sách lớp hỏi cùng lượt với người dùng (dùng chung kết quả với layout giáo viên)
  const classesP = hasSupabaseEnv() ? teacherClasses().catch(() => []) : Promise.resolve([]);
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
  const [list, school, { data: planRows }] = await Promise.all([
    classesP,
    schoolName(viewer.teacherSchoolId),
    supabase.rpc('teacher_my_plan'),
  ]);
  const plan = ((planRows ?? []) as { student_limit: number; students_used: number; trial_until?: string | null; base_limit?: number; locked?: number; open_plan?: boolean }[])[0];
  // Đang thu học phí từ phụ huynh (migration 0076): cô dùng miễn phí đủ lớp — không còn dùng thử / giới hạn gói
  const openPlan = !!plan?.open_plan;
  const trialUntil = openPlan ? null : plan?.trial_until ?? null;
  const trialDays = trialUntil ? Math.max(1, Math.ceil((Date.parse(trialUntil) - Date.now()) / 86_400_000)) : 0;
  const planText = !plan ? null : openPlan ? `Miễn phí cho thầy cô · tối đa 40 em/lớp: ${plan.students_used} học sinh`
    : `${trialUntil ? `Dùng thử đủ lớp đến ${fmtDay(trialUntil)}` : plan.student_limit <= FREE_STUDENT_LIMIT ? 'Gói miễn phí' : 'Gói của thầy cô'}: ${plan.students_used}/${plan.student_limit} học sinh`;

  const active = list.find((c) => c.status === 'active');
  const nowMs = Date.now();
  const vnNow = new Date(nowMs + 7 * 3600_000);
  const todayIso = vnNow.toISOString().slice(0, 10);
  const weekday = vnNow.getUTCDay();
  const firstName = viewer.displayName.trim().split(/\s+/).slice(-2).join(' ');
  // Xưng hô thầy / cô: thầy cô tự chọn trên trang (cookie), chưa chọn thì dùng "thầy cô" và hình cô giáo
  const xhRaw = (await cookies()).get('gv-xung-ho')?.value;
  const xh: 'thay' | 'co' | null = xhRaw === 'thay' || xhRaw === 'co' ? xhRaw : null;
  const xhWord = xh === 'thay' ? 'thầy' : xh === 'co' ? 'cô' : 'thầy cô';

  // ------------------------------------------------------------ số liệu "Hôm nay" của lớp đang dạy
  let todo: TodayItem[] = [];
  let k: Kpis | null = null;
  let todayPlans: { id: string; subject: string; title: string; period: number | null }[] = [];
  let tomorrowPlans: typeof todayPlans = [];
  const tomorrowIso = new Date(nowMs + 7 * 3600_000 + 86_400_000).toISOString().slice(0, 10);
  let watch: Watch[] = [];
  const savedByDay: Record<string, SavedSlot[]> = {};
  let inbox: Inbox | null = null;
  let births: Birthday[] = [];
  let birthsOn = false;
  let contactGaps: number | null = null;
  if (active) {
    const since14 = new Date(nowMs - 14 * 86400_000).toISOString();
    const [{ data: plans, error: planErr }, { data: asg, error: asgErr }, { data: roster, res }, { data: diary, error: diaryErr }, { data: month }, { data: msgs, error: msgErr }, { data: profRaw, error: profErr }, { data: gaps, error: gapErr }] = await Promise.all([
      supabase.rpc('teacher_list_plans', { p_class: active.id }),
      supabase.rpc('teacher_list_assignments', { p_class: active.id }),
      // danh sách em -> kết quả 14 ngày của các em: nối tiếp nhau nhưng chạy song song với các truy vấn khác
      supabase.rpc('teacher_class_roster', { p_class: active.id }).then(async (r) => {
        const ids = ((r.data ?? []) as { student_id: string; membership_status: string }[]).filter((x) => x.membership_status === 'active').map((x) => x.student_id);
        const { data: res } = ids.length
          ? await supabase.from('lesson_results').select('student_id, score, total, created_at').in('student_id', ids).gte('created_at', since14).limit(5000)
          : { data: [] };
        return { data: r.data, res };
      }),
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
      students: students.length,
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
      students: students.length,
      activeLast7: k.practiced,
      recordsOn: FEATURES.teacherRecords,
    }).filter((t) => !t.title.startsWith('Hôm nay dạy')); // lịch hôm nay đã có ô riêng
    // Việc tự sinh từ dữ liệu lớp (điểm danh đã có ở nút trên cùng và ô số liệu nên không lặp lại ở đây)
    const today0 = births.filter((b) => b.inDays === 0);
    if (today0.length) todo.unshift({ tone: 'soon', title: `Hôm nay sinh nhật ${today0.map((b) => b.short).join(', ')} 🎂`, detail: 'Cả lớp hát mừng sinh nhật, hoặc gửi em một thư khen nhỏ.', href: `/giao-vien/lop/${active.id}/thu-khen`, cta: 'Viết thư khen' });
    if (noAccount) todo.push({ tone: 'soon', title: `${noAccount} em chưa có PIN đăng nhập`, detail: 'Đặt PIN rồi in thẻ để các em vào luyện bài ở nhà.', href: `/giao-vien/lop/${active.id}`, cta: 'Đặt PIN' });
    if (prof && profileLack) todo.push({ tone: 'info', title: `Hồ sơ còn thiếu ${profileLack} em`, detail: 'Chưa có ngày sinh hoặc chỗ ở — dán một lần từ file danh sách của trường.', href: `/giao-vien/lop/${active.id}?xem=ho-so`, cta: 'Bổ sung', later: true });
    // Thiếu số điện thoại phụ huynh: thiếu từ một nửa lớp trở lên thì đưa lên "Nên làm", mở sẵn hộp Dán từ Excel
    if (contactGaps) {
      const many = contactGaps * 2 >= students.length;
      todo.push(many
        ? { tone: 'soon', title: `${contactGaps}/${students.length} em chưa có số điện thoại phụ huynh`, detail: 'Dán cả lớp một lần từ file Excel của trường (tên em + số điện thoại). Trong lúc chưa có số, vẫn nhắn được phụ huynh ngay trong app ở Danh bạ.', href: `/giao-vien/lop/${active.id}/danh-ba?dan=excel`, cta: 'Dán từ Excel' }
        : { tone: 'info', title: `${contactGaps} em chưa có số điện thoại phụ huynh`, detail: 'Cần khi nhắn tin, báo vắng; phụ huynh cũng tự thêm được ở Góc phụ huynh.', href: `/giao-vien/lop/${active.id}/danh-ba`, cta: 'Thêm số', later: true });
    }
    if (inbox?.unread) {
      todo.unshift({ tone: 'urgent', title: `${inbox.unread} tin nhắn phụ huynh chưa đọc`, detail: inbox.pending_leave ? `Có ${inbox.pending_leave} tin xin phép nghỉ đang chờ cô đồng ý.` : 'Phụ huynh hỏi han, nhắn cô.', href: `/giao-vien/lop/${active.id}/tin-nhan`, cta: 'Đọc tin' });
    } else if (inbox?.items.length) {
      // Tin nhắn phụ huynh gộp vào "Việc hôm nay": không có tin mới thì chỉ nhắc nhẹ
      todo.push({ tone: 'info', title: 'Tin nhắn phụ huynh', detail: `Không có tin mới · ${inbox.items.length} tin gần đây.`, href: `/giao-vien/lop/${active.id}/tin-nhan`, cta: 'Hộp thư' });
    }
    todayPlans = planErr ? [] : ((plans ?? []) as { id: string; subject: string; title: string; period: number | null; teach_date: string | null }[])
      .filter((p) => p.teach_date === todayIso).sort((a, b) => (a.period ?? 99) - (b.period ?? 99));
    for (const p of (planErr ? [] : (plans ?? []) as { id: string; subject: string; title: string; period: number | null; teach_date: string | null }[])) {
      if (p.teach_date) (savedByDay[p.teach_date] ??= []).push({ id: p.id, subject: p.subject, title: p.title, period: p.period });
    }
    tomorrowPlans = planErr ? [] : ((plans ?? []) as { id: string; subject: string; title: string; period: number | null; teach_date: string | null }[])
      .filter((p) => p.teach_date === tomorrowIso).sort((a, b) => (a.period ?? 99) - (b.period ?? 99));
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
  const delta = k && k.rate !== null && k.prevRate !== null ? Math.round((k.rate - k.prevRate) * 100) : null;
  const lunar = solarToLunar(+todayIso.slice(8), +todayIso.slice(5, 7), +todayIso.slice(0, 4));
  const week = schoolWeek(todayIso);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  const todoLeft = todo.filter((t) => t.tone !== 'done').length;
  const warn = watch.filter((w) => w.tone === 'warn');
  const unread = inbox?.unread ?? 0;
  const initial = (firstName.trim().split(/\s+/).pop() ?? 'G').charAt(0).toUpperCase();

  return (
    <main className="tdy tdy-v2">
      {/* ① Đầu trang: trái = ngày, lời chào, Milo; phải = ô tìm, chuông, ảnh đại diện + thẻ lớn "Tiết học tiếp theo" */}
      <div className="tdy-top">
        <div className="tdy-top-l">
          <p className="tdy-date">
            <CalendarDays aria-hidden="true" className="tdy-date-ic" /> {dateLabel}
            {week && <span className="tdy-week" title="Tuần học tính từ thứ Hai đầu tiên sau ngày 5/9">Tuần {week}</span>}
            <span className="tdy-lunar" title={`Ngày ${lunar.day} tháng ${LUNAR_MONTH_NAME[lunar.month]} năm ${canChiYear(lunar.year)}`}><Moon aria-hidden="true" /> {lunar.day}/{lunar.month}{lunar.leap ? ' nhuận' : ''}</span>
          </p>
          <h1>Chào {firstName}! <span aria-hidden="true">👋</span></h1>
          <p className="tdy-wish">Chúc {xhWord} một ngày dạy học thật hiệu quả và nhiều niềm vui! <HonorificPick value={xh} /></p>
          <DashIcon name={xh === 'thay' ? 'teacher-male' : 'teacher'} h={236} className={`tdy-teacher${xh === 'thay' ? ' is-male' : ''}`} priority />
          <Image className="tdy-mascot" src="/brand/milo-professor.webp" alt="" width={560} height={773} priority aria-hidden="true" />
        </div>
        <div className="tdy-top-r">
          <div className="tdy-bar">
            <HomeSearch />
            <ShareApp who="teacher" className="tdy-share" />
            {active && (
              <Link href={`${base}/tin-nhan`} className="tdy-bell" aria-label={unread ? `${unread} tin nhắn phụ huynh chưa đọc` : 'Tin nhắn phụ huynh'}>
                <Bell aria-hidden="true" />{unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}
              </Link>
            )}
            <span className="tdy-av" title={viewer.displayName} aria-hidden="true">{initial}</span>
          </div>
          {active && k && (
            <div className="tdy-next-wrap">
              <NextLessonCard classId={active.id} day={todayIso} tomorrow={tomorrowIso} base={base} saved={todayPlans} savedTomorrow={tomorrowPlans} className={active.name} />
              <DashIcon name="hero-book" h={170} className="tdy-next-art" />
              <Image className="tdy-next-art-m" src="/emoji/f3d/open-book.webp" alt="" width={96} height={96} aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {!active && (
        <section className="tdy-card tdy-create" data-tour="tao-lop">
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
      {plan && !openPlan && (plan.locked ?? 0) > 0 && (
        <ContactAdmin note={`Đã hết thời gian dùng thử: ${plan.locked} em đang tạm khoá (gói hiện có ${plan.student_limit} chỗ). Liên hệ để mở gói cho cả lớp — các em học lại ngay, không mất bài.`} />
      )}
      {plan && !openPlan && !trialUntil && !(plan.locked ?? 0) && plan.students_used >= plan.student_limit && (
        <ContactAdmin note={`Thầy cô đã dùng hết ${plan.student_limit} chỗ học sinh của gói. Liên hệ để được mở thêm.`} />
      )}

      {active && k && (
        <>
          {/* ② 4 ô số liệu (có hình 3D trang trí) */}
          <ul className="tdy-stats" aria-label="Số liệu lớp">
            <li><Link href={`${base}/so-lop`} className="tdy-stat is-blue">
              <span className="tdy-stat-ic is-img"><DashIcon name="stat-users" h={60} /></span>
              <b>{k.attendanceSaved ? `${k.students - k.absent}/${k.students}` : k.students}</b>
              <small>{k.attendanceSaved ? 'Có mặt hôm nay' : 'Học sinh'}</small>
              <DashIcon name="stat-kids" h={56} className="tdy-stat-art is-kids" />
            </Link></li>
            <li><Link href={`${base}/giao-bai`} className="tdy-stat is-green">
              <span className="tdy-stat-ic is-img"><DashIcon name="stat-book" h={60} /></span>
              <b>{k.practiced}/{k.students}</b>
              <small>Đã luyện bài</small>
              <i className="tdy-ring" style={{ '--p': pct(k.practiced, k.students) } as React.CSSProperties} title={`${pct(k.practiced, k.students)}% học sinh luyện bài trong 7 ngày`}><span>{pct(k.practiced, k.students)}%</span></i>
            </Link></li>
            <li><Link href={`${base}/ke-hoach`} className="tdy-stat is-coral">
              <span className="tdy-stat-ic is-img"><DashIcon name="stat-cal" h={60} /></span>
              <b><TodayLessonCount classId={active.id} day={todayIso} saved={todayPlans} /></b>
              <small>Tiết hôm nay</small>
              <DashIcon name="stat-cal3d" h={64} className="tdy-stat-art" />
            </Link></li>
            <li><a href="#tdy-todo" className="tdy-stat is-violet">
              <span className="tdy-stat-ic is-img"><DashIcon name="stat-check" h={60} /></span>
              <b>{todoLeft}</b>
              <small>Việc cần làm</small>
              <DashIcon name="stat-clip3d" h={66} className="tdy-stat-art" />
            </a></li>
          </ul>

          {/* Việc hằng ngày — chỉ hiện trên điện thoại / máy tính bảng (4 ô vuông) */}
          <nav className="tdy-acts" aria-label="Việc hằng ngày" data-tour="viec-nhanh">
            {k.attendanceSaved
              ? <Link href={`${base}/so-lop`} className="tdy-act is-done" title="Mở Sổ lớp để sửa"><Check aria-hidden="true" /><span>Đã điểm danh</span></Link>
              : <Link href={`${base}/so-lop`} className="tdy-act is-blue"><BookCheck aria-hidden="true" /><span>Điểm danh</span></Link>}
            <Link href={`${base}/giao-bai`} className="tdy-act is-violet"><Send aria-hidden="true" /><span>Giao bài</span></Link>
            <Link href={`${base}/ke-hoach`} className="tdy-act is-green"><NotebookPen aria-hidden="true" /><span>Xem giáo án</span></Link>
            <Link href={`${base}/kho-cau-hoi`} className="tdy-act is-coral"><Library aria-hidden="true" /><span>Kho câu hỏi</span></Link>
          </nav>

          {/* ③ Việc hôm nay | Lịch tuần | Lớp học của tôi */}
          <div className="tdy-board">
            <section className="tdy-card tdy-todo" aria-labelledby="tdy-todo">
              <TodoList items={todo} day={todayIso} headingId="tdy-todo" calHref={`${base}/lich`} compact />
            </section>
            <WeekSchedule classId={active.id} base={base} day={todayIso} savedByDay={savedByDay} />
            <section className="tdy-card tdy-class" aria-labelledby="tdy-class-h">
              <h2 id="tdy-class-h"><DashIcon name="h-class" h={26} /> Lớp học của tôi <Link href={base}>Xem chi tiết <ChevronRight aria-hidden="true" /></Link></h2>
              <div className="tdy-class-body">
                <div className="tdy-class-art" aria-hidden="true">
                  <DashIcon name="class-kids" h={104} className="tdy-class-kids" />
                  <span>Lớp {active.name}</span>
                </div>
                <ul className="tdy-class-nums">
                  <li className="is-blue"><Link href={`${base}/so-lop`}><DashIcon name="c-users" h={34} /><b>{k.attendanceSaved ? `${k.students - k.absent}/${k.students}` : `${k.students}`}</b><small>{k.attendanceSaved ? 'Có mặt' : 'Học sinh'}</small></Link></li>
                  <li className="is-green"><Link href={`${base}/lo-hong`}><DashIcon name="c-target" h={34} /><b>{k.rate !== null ? `${Math.round(k.rate * 100)}%` : '—'}{delta !== null && k.rate !== null && <em className={delta >= 0 ? 'is-good' : 'is-bad'}>{delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}</em>}</b><small>Tỷ lệ làm đúng</small></Link></li>
                  <li className="is-red"><Link href={`${base}/lo-hong`} title={warn.map((w) => `${w.name}: ${w.text}`).join('\n') || undefined}><DashIcon name="c-alert" h={34} /><b>{String(warn.length).padStart(2, '0')}</b><small>Cần chú ý</small></Link></li>
                  <li className="is-violet"><Link href={birthsOn ? `${base}/lich` : `${base}?xem=ho-so`} title={births.map((b) => `${b.name} · ${b.date}`).join('\n') || undefined}><DashIcon name="c-party" h={34} /><b>{birthsOn ? births.length : '—'}</b><small>Sinh nhật tuần này</small></Link></li>
                </ul>
              </div>
              <nav className="tdy-class-links" aria-label="Lối tắt lớp">
                <Link href={`${base}?xem=ho-so`}><DashIcon name="l-profile" h={18} /> Hồ sơ lớp</Link>
                <Link href={`${base}/nhan-xet`}><DashIcon name="l-comment" h={18} /> Nhận xét</Link>
                <Link href={`${base}/phieu-tien-bo`}><DashIcon name="l-chart" h={18} /> Báo cáo</Link>
                <Link href={`${base}/tin-nhan`}><DashIcon name="l-phone" h={18} /> Liên hệ PH{unread > 0 && <span className="tdy-dot" title="Có tin chưa đọc" />}</Link>
              </nav>
            </section>
          </div>

          {/* ④ Công cụ giảng dạy | Không gian cá nhân */}
          <div className="tdy-bottom">
            <section id="cong-cu" className="tdy-card tdy-quick-sec" aria-labelledby="tdy-quick-h" data-tour="cong-cu">
              <QuickTools classId={active.id} />
            </section>
            <section className="tdy-card tdy-mine" aria-labelledby="tdy-mine-h">
              <h2 id="tdy-mine-h"><DashIcon name="h-mine" h={26} /> Không gian cá nhân</h2>
              <div className="tdy-mine-links">
                <Link href={`${base}/tieng-anh`} className="tdy-mine-link is-orange">
                  <span className="tdy-mine-ic"><DashIcon name="m-english" h={44} /></span>
                  <span><b>Tiếng Anh sư phạm</b><small>Lộ trình học · Bài tập · Đánh giá</small></span>
                  <ChevronRight aria-hidden="true" className="tdy-mine-go" />
                </Link>
                <Link href={`${base}/thu-chi`} className="tdy-mine-link is-green">
                  <span className="tdy-mine-ic"><DashIcon name="m-money" h={44} /></span>
                  <span><b>Thu chi cá nhân</b><small>Quản lý chi tiêu · Báo cáo tháng</small></span>
                  <ChevronRight aria-hidden="true" className="tdy-mine-go" />
                </Link>
              </div>
            </section>
          </div>
        </>
      )}

      {!active && (
        <section aria-labelledby="tdy-classes">
          <h2 id="tdy-classes" className="tdy-sect"><School aria-hidden="true" /> Lớp của tôi <span>· {school || 'Giáo viên'}{planText ? ` · ${planText}` : ''}</span></h2>
          {list.length === 0 ? <p className="dash-muted">Chưa có lớp nào.</p> : (
            <ul className="class-list">
              {list.map((c) => (
                <li key={c.id}>
                  <Link href={`/giao-vien/lop/${c.id}`} className={`class-tile${c.status !== 'active' ? ' is-archived' : ''}`}>
                    <span className="class-tile-name">Lớp {c.name}</span>
                    <span className="class-tile-meta">Khối {c.grade} · {c.students} học sinh{c.status !== 'active' ? ' · đã lưu trữ' : ''}</span>
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
