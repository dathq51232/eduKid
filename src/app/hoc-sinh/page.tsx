import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, ChevronRight, ClipboardList, Clock, Crown, CreditCard, Flame, Gamepad2, Lock, RotateCcw, Sparkles, Star, Trophy } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import { getViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import { fmtDay } from '@/lib/billing';
import { MUC_NAME, SUBJECT_NAME, dueInfo, lessonHref, type MyAssignment } from '@/lib/classroom/assignments';
import { createClient } from '@/lib/supabase/server';
import { learningStreak } from '@/lib/streak';
import type { SubjectCode } from '@/lib/types';

export const metadata: Metadata = { title: 'Trang của em · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Result = { id: string; lesson_title: string | null; lesson_code: string; subject_code: SubjectCode | null; grade: number | null; muc: number | null; score: number; total: number; points: number; created_at: string };
/** Mục tiêu mỗi tuần: số ngày có học */
const WEEK_GOAL = 5;

export default async function StudentHome() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Trang của em" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/hoc-sinh');
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');

  const supabase = await createClient();
  // RLS chỉ trả dữ liệu của chính học sinh đang đăng nhập
  const [{ data: me }, { data: cls }, { data: results }, { data: gameRows, count: games }, { data: assigned }] = await Promise.all([
    supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
    supabase.from('classes').select('name, grade').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('lesson_results').select('id, lesson_title, lesson_code, subject_code, grade, muc, score, total, points, created_at').order('created_at', { ascending: false }).limit(300),
    supabase.from('game_results').select('created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(200),
    // Bài thầy cô giao (migration 0017). Chưa chạy migration thì bỏ qua, trang vẫn hiện bình thường.
    supabase.rpc('student_my_assignments'),
  ]);
  // Học phí (migration 0018): hết hạn thì mọi nút học dẫn tới trang đóng phí (máy chủ cũng chặn ở middleware + API)
  const gate = await learningGate(supabase, viewer.userId);
  const locked = gate.is_student && !gate.active;
  const PAY = '/hoc-sinh/dong-phi';
  const tasks = ((assigned ?? []) as MyAssignment[]);
  const todo = tasks.filter((t) => t.status === 'open' && !t.done)
    .sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999'));
  const fmtNum = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
  const list = (results ?? []) as Result[];
  const best = new Map<string, number>();
  for (const r of list) best.set(r.lesson_code, Math.max(best.get(r.lesson_code) ?? 0, r.points));
  const points = [...best.values()].reduce((a, b) => a + b, 0);
  // Khối theo lớp em đang học (năm sau lên lớp thì theo lớp mới), không có lớp thì theo hồ sơ học sinh
  const grade = (cls as { grade?: number } | null)?.grade ?? (me as { grade?: number } | null)?.grade ?? 1;
  const name = (me as { display_name?: string } | null)?.display_name ?? 'em';
  const firstName = name.trim().split(/\s+/).slice(-1)[0];

  // Chuỗi ngày học: tính cả làm bài và chơi game trí tuệ
  const st = learningStreak([...list.map((r) => r.created_at), ...((gameRows ?? []) as { created_at: string }[]).map((g) => g.created_at)]);
  const todayCount = list.filter((r) => r.created_at && new Date(r.created_at).getTime() + 7 * 3600_000 >= Date.parse(`${st.today}T00:00:00Z`)).length;

  // Gợi ý ôn: bài gần đây em làm đúng dưới 80% và chưa làm lại tốt hơn
  const bestRatio = new Map<string, number>();
  for (const r of list) bestRatio.set(r.lesson_code, Math.max(bestRatio.get(r.lesson_code) ?? 0, r.score / r.total));
  const review = list.find((r) => r.subject_code && (bestRatio.get(r.lesson_code) ?? 1) < 0.8);
  const reviewHref = review?.subject_code ? lessonHref(review.lesson_code, review.subject_code, review.grade ?? grade, review.muc) : null;

  // Việc nên làm bây giờ: bài cô giao gần hạn nhất → bài cần ôn → bài mới
  const next = todo[0];
  const nextHref = next ? (locked ? PAY : next.kind === 'exam' ? `/hoc-sinh/de/${next.id}` : next.lesson_code && next.subject ? lessonHref(next.lesson_code, next.subject, next.grade, next.muc) : null) : null;
  const nextDue = next ? dueInfo(next.due_at) : null;

  return (
    <>
      <LearnHeader />
      <main className="dash wrap sd">
        {gate.reason === 'expired' && (
          <p className="adm-alert is-warn tuition-banner" role="status"><Lock aria-hidden="true" /> Thời gian học của em đã hết. Nhờ bố mẹ đóng học phí để học tiếp nhé! <Link href={PAY} className="btn btn-yellow btn-sm"><CreditCard aria-hidden="true" /> Đóng học phí</Link></p>
        )}
        {gate.reason === 'trial' && (
          <p className="adm-alert is-info tuition-banner">Em đang học thử miễn phí đến {fmtDay(gate.until)}. <Link href={PAY}>Xem học phí →</Link></p>
        )}
        {gate.reason === 'paid' && (
          <p className="dash-muted tuition-banner">Đã đóng học phí — học đến hết {fmtDay(gate.until)}. <Link href={PAY}>Học phí</Link></p>
        )}

        <section className="sd-hero">
          <span className="sd-hero-av"><MiloMascot size={84} /></span>
          <div className="sd-hero-txt">
            <p className="dash-kicker">{cls ? `Lớp ${(cls as { name: string }).name}` : `Lớp ${grade}`}</p>
            <h1>Chào {firstName}!</h1>
            <p>{st.studiedToday ? `Hôm nay em đã học ${todayCount || 1} bài rồi, giỏi quá! 🎉` : st.streak > 0 ? `Học một bài nhỏ để giữ chuỗi ${st.streak} ngày nhé! 🔥` : 'Hôm nay mình học một bài nhỏ nhé.'}</p>
          </div>
          <SignOutButton className="sd-signout" />
        </section>

        <div className="sd-top">
          <section className="sd-next" aria-labelledby="sd-next-t">
            <h2 id="sd-next-t"><Sparkles aria-hidden="true" /> Hôm nay em làm gì?</h2>
            {locked ? (
              <div className="sd-next-card is-lock">
                <div><b>Nhờ bố mẹ đóng học phí</b><span>để học tiếp các bài mới nhé.</span></div>
                <Link href={PAY} className="btn btn-yellow"><Lock aria-hidden="true" /> Đóng học phí</Link>
              </div>
            ) : next && nextHref ? (
              <div className={`sd-next-card${nextDue?.overdue ? ' is-over' : ''}`}>
                <span className="sd-next-ic" aria-hidden="true"><ClipboardList /></span>
                <div>
                  <small>Bài cô giao{todo.length > 1 ? ` · còn ${todo.length} bài` : ''}</small>
                  <b>{next.title}</b>
                  <span>{next.kind === 'exam' ? `Đề ${next.n_questions} câu · ${next.minutes ?? 30} phút` : `Luyện tập${next.muc ? ` · mức ${MUC_NAME[next.muc]}` : ''}`}{next.subject ? ` · ${SUBJECT_NAME[next.subject]}` : ''} · Hạn {nextDue?.label}{nextDue?.overdue ? ' (quá hạn)' : ''}</span>
                </div>
                <Link href={nextHref} className="btn btn-yellow">{next.kind === 'exam' ? 'Làm đề' : 'Làm bài'} <ChevronRight aria-hidden="true" /></Link>
              </div>
            ) : review && reviewHref ? (
              <div className="sd-next-card is-review">
                <span className="sd-next-ic" aria-hidden="true"><RotateCcw /></span>
                <div>
                  <small>Ôn lại cho chắc</small>
                  <b>{review.lesson_title ?? review.lesson_code}</b>
                  <span>Lần trước em đúng {review.score}/{review.total} câu. Thử lại để được nhiều sao hơn nhé!</span>
                </div>
                <Link href={reviewHref} className="btn btn-yellow">Ôn lại <ChevronRight aria-hidden="true" /></Link>
              </div>
            ) : (
              <div className="sd-next-card is-new">
                <span className="sd-next-ic" aria-hidden="true"><BookOpen /></span>
                <div><small>Bài mới</small><b>Chọn một bài em thích</b><span>Toán, Tiếng Việt hay Tiếng Anh, mỗi bài chỉ vài phút.</span></div>
                <Link href={`/chon-bai?grade=${grade}`} className="btn btn-yellow">Vào học <ChevronRight aria-hidden="true" /></Link>
              </div>
            )}
            {!locked && (
              <div className="sd-quick">
                <Link href={`/chon-bai?grade=${grade}`}><BookOpen aria-hidden="true" /> Học bài khác</Link>
                <Link href="/tro-choi"><Gamepad2 aria-hidden="true" /> Game trí tuệ</Link>
                <Link href="/co"><Crown aria-hidden="true" /> Đấu cờ</Link>
                <Link href="/thanh-tich"><Trophy aria-hidden="true" /> Thành tích</Link>
              </div>
            )}
          </section>

          <section className="sd-week" aria-labelledby="sd-week-t">
            <h2 id="sd-week-t"><Flame aria-hidden="true" /> Chuỗi ngày học</h2>
            <p className="sd-streak"><b>{st.streak}</b> ngày liên tiếp</p>
            <ol className="sd-dots" aria-label={`Tuần này em học ${st.weekDays} ngày`}>
              {st.week.map((w) => (
                <li key={w.day} className={`${w.done ? 'is-done' : ''}${w.today ? ' is-today' : ''}${w.future ? ' is-future' : ''}`}>
                  <span aria-hidden="true">{w.done ? '🔥' : ''}</span><small>{w.label}</small>
                </li>
              ))}
            </ol>
            <div className="sd-goal">
              <span>Mục tiêu tuần: học {WEEK_GOAL} ngày</span><b>{Math.min(st.weekDays, WEEK_GOAL)}/{WEEK_GOAL}</b>
              <i aria-hidden="true"><i style={{ width: `${Math.min(100, (st.weekDays / WEEK_GOAL) * 100)}%` }} /></i>
            </div>
            {st.weekDays >= WEEK_GOAL && <p className="sd-goal-ok">Em đã đạt mục tiêu tuần này! ⭐</p>}
          </section>
        </div>

        <ul className="stat-row sd-stats">
          <li className="stat-tile tone-blue"><span>Bài đã làm</span><strong>{best.size}</strong></li>
          <li className="stat-tile tone-yellow"><span>⭐ Sao tích luỹ</span><strong>{points}</strong></li>
          <li className="stat-tile tone-green"><span>Lượt chơi game</span><strong>{games ?? 0}</strong></li>
        </ul>

        {tasks.length > 0 && (
          <section className="dash-section student-tasks" id="bai-giao" aria-label="Bài thầy cô giao">
            <h2><ClipboardList aria-hidden="true" /> Bài thầy cô giao{todo.length ? ` · còn ${todo.length} bài` : ' · đã làm hết 🎉'}</h2>
            <ul className="task-list">
              {tasks.map((t) => {
                const d = dueInfo(t.due_at);
                const href = locked ? PAY : t.kind === 'exam' ? `/hoc-sinh/de/${t.id}` : t.lesson_code && t.subject ? lessonHref(t.lesson_code, t.subject, t.grade, t.muc) : null;
                const closed = t.status !== 'open';
                return (
                  <li key={t.id} className={`task-item${t.done ? ' is-done' : ''}${!t.done && d.overdue ? ' is-over' : ''}`}>
                    <span className="task-icon" aria-hidden="true">{t.done ? <CheckCircle2 /> : <Clock />}</span>
                    <div className="task-info">
                      <strong>{t.title}</strong>
                      <span>
                        {t.kind === 'exam' ? `Đề ${t.n_questions} câu · ${t.minutes ?? 30} phút` : `Luyện tập${t.muc ? ` · mức ${MUC_NAME[t.muc]}` : ''}`}
                        {t.subject ? ` · ${SUBJECT_NAME[t.subject]}` : ''} · Hạn {d.label}{!t.done && d.overdue ? ' (quá hạn)' : ''}
                      </span>
                      {t.done && <span className="task-done">{t.kind === 'exam' && t.max_score ? `Đã nộp: ${fmtNum(Number(t.score))}/${fmtNum(Number(t.max_score))} điểm` : 'Em đã làm bài này'}</span>}
                    </div>
                    {href && (t.kind === 'exam'
                      ? (t.done || !closed) && <Link href={href} className={`btn btn-sm ${t.done ? 'btn-outline' : 'btn-yellow'}`}>{t.done ? 'Xem kết quả' : 'Làm đề'}</Link>
                      : <Link href={href} className={`btn btn-sm ${t.done ? 'btn-outline' : 'btn-yellow'}`}>{t.done ? 'Làm lại' : 'Làm bài'}</Link>)}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="dash-section">
          <h2>Bài em làm gần đây</h2>
          {list.length === 0 ? <p className="dash-muted">Em chưa làm bài nào. Bấm “Vào học” để bắt đầu nhé!</p> : (
            <ul className="result-list">
              {list.slice(0, 8).map((r) => {
                const pct = Math.round((r.score / r.total) * 100);
                return (
                  <li key={r.id}>
                    <span className="result-title">{r.lesson_title ?? r.lesson_code}</span>
                    <span className={`result-score ${pct >= 80 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-low'}`}>{r.score}/{r.total}</span>
                    <span className="result-points"><Star aria-hidden="true" /> {r.points}</span>
                    <span className="result-date">{new Date(r.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
