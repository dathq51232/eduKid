import type { Metadata } from 'next';
import Link from 'next/link';
import { KIND_ICON, ago, leaveRange, senderLabel, type Inbox } from '@/lib/classroom/messages';
import { redirect } from 'next/navigation';
import { BookCheck, BookOpen, CalendarDays, ChevronRight, Dices, Eye, ListTodo, MailOpen, School, Send, Target } from 'lucide-react';
import { TodoList } from '@/components/classroom/TeacherToday';
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
  let inbox: Inbox | null = null;
  if (active) {
    const since14 = new Date(nowMs - 14 * 86400_000).toISOString();
    const [{ data: plans, error: planErr }, { data: asg, error: asgErr }, { data: roster }, { data: diary, error: diaryErr }, { data: month }, { data: msgs, error: msgErr }] = await Promise.all([
      supabase.rpc('teacher_list_plans', { p_class: active.id }),
      supabase.rpc('teacher_list_assignments', { p_class: active.id }),
      supabase.rpc('teacher_class_roster', { p_class: active.id }),
      // Sổ lớp (migration 0026) — chưa chạy migration thì bỏ qua
      supabase.rpc('teacher_diary_day', { p_class: active.id, p_day: todayIso }),
      supabase.rpc('teacher_diary_range', { p_class: active.id, p_from: `${todayIso.slice(0, 7)}-01`, p_to: todayIso }),
      // Tin nhắn phụ huynh (migration 0037) — chưa chạy migration thì bỏ qua
      supabase.rpc('teacher_messages', { p_class: active.id, p_limit: 5 }),
    ]);
    inbox = msgErr ? null : (msgs as Inbox | null);
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
    if (inbox?.unread) {
      todo.unshift({ tone: 'urgent', title: `${inbox.unread} tin nhắn phụ huynh chưa đọc`, detail: inbox.pending_leave ? `Có ${inbox.pending_leave} tin xin phép nghỉ đang chờ cô đồng ý.` : 'Phụ huynh hỏi han, nhắn cô.', href: `/giao-vien/lop/${active.id}/tin-nhan`, cta: 'Đọc tin' });
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
  const pendingCount = todo.filter((t) => t.tone !== 'done').length;

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
          {/* 1 · Số liệu lớp: một hàng gọn, bấm để mở chi tiết */}
          <section className="tdy-stats" aria-label="Số liệu lớp">
            <Link href={`${base}/so-lop`} className="tdy-stat">
              <span className="tsh-ic tone-yellow"><BookCheck aria-hidden="true" /></span>
              {!k.diaryOn ? <span><b>Chưa bật</b><small>Sổ lớp (migration 0026)</small></span>
                : k.attendanceSaved ? <span><b>{k.students - k.absent}<i>/{k.students}</i></b><small>{k.absent ? `có mặt · ${k.absent} em vắng` : 'có mặt · đủ lớp'}</small></span>
                : <span><b className="is-muted">—</b><small className="is-warn">chưa điểm danh</small></span>}
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
                : <span><b className="is-muted">0</b><small>bài giao đang mở</small></span>}
            </Link>
            <Link href={`${base}/lo-hong`} className="tdy-stat">
              <span className="tsh-ic tone-green"><Target aria-hidden="true" /></span>
              {k.practiced >= 5 && k.rate !== null
                ? <span><b>{pct(k.rate)}<i>%</i></b><small>đúng TB 7 ngày{delta !== null ? <> · <em className={delta >= 0 ? 'is-good' : 'is-bad'}>{delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}%</em></> : ''}</small></span>
                : <span><b className="is-muted">—</b><small>đúng TB · cần ≥5 em luyện{k.practiced ? ` (mới ${k.practiced})` : ''}</small></span>}
            </Link>
          </section>

          {/* 2 · Cần xử lý: việc gấp xếp trước, việc đã xong thu gọn */}
          <section className="tdy-card tdy-todo" aria-labelledby="tdy-todo">
            <h2 id="tdy-todo"><ListTodo aria-hidden="true" /> Cần xử lý {pendingCount > 0 && <span className="tdy-count">{pendingCount}</span>}</h2>
            <TodoList items={todo} day={todayIso} />
          </section>

          {/* 3 · Hôm nay dạy | Tin nhắn phụ huynh + Cần để ý */}
          <div className="tdy-cols">
            <section className="tdy-card tdy-sched" aria-labelledby="tdy-sched">
              <h2 id="tdy-sched"><CalendarDays aria-hidden="true" /> Hôm nay dạy <Link href={`${base}/ke-hoach`}>Giáo án</Link></h2>
              {todayPlans.length === 0 ? (
                <p className="tdy-line">Chưa có tiết nào được soạn cho hôm nay. <Link href={`${base}/ke-hoach`}>Nạp lịch báo giảng</Link></p>
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

            <div className="tdy-stack">
              <section className={`tdy-card tdy-inbox${inbox?.unread ? ' has-new' : ''}`} aria-labelledby="tdy-inbox">
                <h2 id="tdy-inbox"><MailOpen aria-hidden="true" /> Tin nhắn phụ huynh {inbox && inbox.unread > 0 && <span className="tdy-inbox-badge">{inbox.unread} mới</span>} <Link href={`${base}/tin-nhan`}>Hộp thư</Link></h2>
                {!inbox ? <p className="tdy-line">Chưa bật: chạy migration 0037 trên Supabase.</p>
                  : inbox.items.length === 0 ? <p className="tdy-line">Chưa có tin nhắn. Phụ huynh nhắn cô từ trang Phụ huynh.</p> : (
                  <ul className="tdy-inbox-list">
                    {inbox.items.slice(0, 3).map((m) => (
                      <li key={m.id} className={m.status === 'new' ? 'is-new' : undefined}>
                        <Link href={`${base}/tin-nhan`}>
                          <span className="tdy-inbox-ic" aria-hidden="true">{KIND_ICON[m.kind]}</span>
                          <span className="tdy-inbox-txt">
                            <b>{senderLabel(m)} <small>Phụ huynh em {m.student_name}</small></b>
                            <span>{m.kind === 'leave' ? <em>Xin nghỉ {leaveRange(m)}: </em> : null}{m.body}</span>
                          </span>
                          <small className="tdy-inbox-time">{ago(m.created_at)}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {watch.length > 0 && (
                <section className="tdy-card tdy-watch" aria-labelledby="tdy-watch">
                  <h2 id="tdy-watch"><Eye aria-hidden="true" /> Cần để ý</h2>
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
                </section>
              )}
            </div>
          </div>
        </>
      )}

      {active ? (
        <p className="tdy-foot">
          <School aria-hidden="true" /> Lớp {active.name} · mã lớp <b>{active.join_code}</b> · {(school as { name?: string } | null)?.name ?? 'Giáo viên'}{planText ? ` · ${planText}` : ''}
          <Link href={`/giao-vien/lop/${active.id}`}>Học sinh &amp; mã lớp <ChevronRight aria-hidden="true" /></Link>
        </p>
      ) : (
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
type Watch = { id: string; name: string; text: string; tone: 'warn' | 'good' };
