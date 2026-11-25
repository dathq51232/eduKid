import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, Map as MapIcon, ChevronRight, ClipboardList, Clock, Crown, Flame, Gamepad2, Lock, PenLine, Rocket, RotateCcw, Sparkles, Star, Trophy, Users } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import GalleryTeaser from '@/components/gallery/GalleryTeaser';
import KidWorld, { KidThemeSection, ThemedMilo } from '@/components/learn/KidWorld';
import { DailyChest, StickerShelf } from '@/components/learn/KidRewards';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import RoomJoin from '@/components/classroom/RoomJoin';
import KnowledgeMap from '@/components/student/KnowledgeMap';
import { mapHrefs, mapOfGrade, mapState } from '@/components/student/knowledge-map-progress';
import { getViewer } from '@/lib/auth/viewer';
import { learningGate } from '@/lib/auth/gate';
import { MUC_NAME, SUBJECT_NAME, dueInfo, lessonHref, type MyAssignment } from '@/lib/classroom/assignments';
import { owlOf, whenLabel, type MyRoom } from '@/lib/classroom/rooms';
import { createClient } from '@/lib/supabase/server';
import { learningStreak } from '@/lib/streak';
import type { SubjectCode } from '@/lib/types';
import '@/styles/adm.css';
import '@/styles/sd.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/result.css';
import '@/styles/task.css';
import '@/styles/tone.css';

export const metadata: Metadata = { title: 'Trang của em · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Result = { id: string; lesson_title: string | null; lesson_code: string; subject_code: SubjectCode | null; grade: number | null; muc: number | null; score: number; total: number; points: number; created_at: string };
/** Mục tiêu mỗi tuần: số ngày có học */
const WEEK_GOAL = 5;

export default async function StudentHome({ searchParams }: { searchParams: Promise<{ phong?: string }> }) {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Trang của em" /></main></>);
  // quét mã QR phòng thi khi chưa đăng nhập: đăng nhập xong quay lại đúng phòng
  const phong = ((await searchParams).phong ?? '').replace(/[^0-9A-Za-z]/g, '').slice(0, 8);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=${encodeURIComponent(phong ? `/hoc-sinh?phong=${phong}` : '/hoc-sinh')}`);
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');

  const supabase = await createClient();
  // RLS chỉ trả dữ liệu của chính học sinh đang đăng nhập
  const [{ data: me }, { data: cls }, { data: results }, { data: gameRows, count: games }, { data: assigned }, { data: roomRows }, gate] = await Promise.all([
    supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
    supabase.from('classes').select('name, grade').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('lesson_results').select('id, lesson_title, lesson_code, subject_code, grade, muc, score, total, points, created_at').order('created_at', { ascending: false }).limit(300),
    supabase.from('game_results').select('created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(200),
    // Bài thầy cô giao (migration 0017). Chưa chạy migration thì bỏ qua, trang vẫn hiện bình thường.
    supabase.rpc('student_my_assignments'),
    // Phòng thi lớp (migration 0062). Chưa chạy migration thì danh sách rỗng.
    supabase.rpc('student_my_rooms'),
    // Học phí (migration 0018) — hỏi cùng lượt với các truy vấn trên
    learningGate(supabase, viewer.userId),
  ]);
  const rooms = ((roomRows ?? []) as MyRoom[]);
  const nowMs = Date.now();
  // Học phí (migration 0018): hết hạn thì mọi nút học dẫn tới trang đóng phí (máy chủ cũng chặn ở middleware + API)
  const locked = gate.is_student && !gate.active;
  // Bài cô giao + phòng thi lớp: hết học phí vẫn làm được (migration 0075); chỉ khoá khi em bị tạm khoá vì gói của thầy cô
  const classLocked = gate.reason === 'plan_locked';
  const workHref = (t: { id: string; kind: string; status: string; lesson_code: string | null; subject: SubjectCode | null; grade: number; muc: number | null }) =>
    classLocked ? PAY
      : t.kind === 'exam' ? `/hoc-sinh/de/${t.id}`
      : t.lesson_code && t.subject ? (locked && t.status !== 'open' ? PAY : lessonHref(t.lesson_code, t.subject, t.grade, t.muc)) : null;
  // Học phí là việc của ba mẹ: em chỉ được nhắc mở Góc Phụ huynh (thẻ học phí ở đó)
  const PAY = gate.reason === 'plan_locked' ? '/hoc-sinh#tam-khoa' : '/phu-huynh#hoc-phi';
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
  const nextHref = next ? workHref(next) : null;
  const nextDue = next ? dueInfo(next.due_at) : null;

  // Bản đồ kiến thức Toán theo khối của em: mức từng trạm tính từ bài em đã làm
  const map = mapOfGrade(grade);
  const kmState = map ? mapState(map, list) : null;
  const kmHrefs = map && kmState ? (locked ? Object.fromEntries(map.nodes.map((n) => [n.id, PAY])) : mapHrefs(map, kmState, list)) : undefined;

  return (
    <>
      <LearnHeader />
      <KidWorld />
      <main className="dash wrap sd">
        {gate.reason === 'plan_locked' && (
          <p id="tam-khoa" className="adm-alert is-warn tuition-banner" role="status"><Lock aria-hidden="true" /> Tài khoản của em đang tạm khoá vì lớp đã hết thời gian dùng thử. Bài em đã làm vẫn được giữ nguyên — khi thầy cô mở thêm chỗ, em học tiếp được ngay.</p>
        )}
        {gate.reason === 'trial' && gate.until && Date.parse(gate.until) - nowMs < 3 * 86_400_000 && (
          <p className="adm-alert is-info tuition-banner" role="status">⭐ Milo vừa gửi ba mẹ bản tóm tắt những ngày em học chăm. Nhờ ba mẹ mở Góc Phụ huynh xem nhé! <Link href="/phu-huynh#hoc-phi" className="btn btn-yellow btn-sm"><Users aria-hidden="true" /> Góc Phụ huynh</Link></p>
        )}
        {gate.reason === 'expired' && (
          <p className="adm-alert is-warn tuition-banner" role="status"><Lock aria-hidden="true" /> Các bài tự chọn đang tạm nghỉ. Em vẫn làm được bài cô giao và phòng thi lớp nhé! Nhờ ba mẹ mở Góc Phụ huynh để em luyện thêm. <Link href={PAY} className="btn btn-yellow btn-sm"><Users aria-hidden="true" /> Góc Phụ huynh</Link></p>
        )}

        <section className="sd-hero">
          <span className="sd-hero-av"><ThemedMilo size={84} /></span>
          <div className="sd-hero-txt">
            <p className="dash-kicker">{cls ? `Lớp ${(cls as { name: string }).name}` : `Lớp ${grade}`}</p>
            <h1>Chào {firstName}!</h1>
            <p>{st.studiedToday ? `Hôm nay em đã học ${todayCount || 1} bài rồi, giỏi quá! 🎉` : st.streak > 0 ? `Học một bài nhỏ để giữ chuỗi ${st.streak} ngày nhé! 🔥` : 'Hôm nay mình học một bài nhỏ nhé.'}</p>
          </div>
          <div className="sd-hero-actions">
            <Link href="/phu-huynh" className="btn btn-outline btn-sm sd-parent-switch"><Users aria-hidden="true" /> Mở Góc Phụ huynh</Link>
            <SignOutButton className="sd-signout" />
          </div>
        </section>

        <div className="sd-top">
          <section className="sd-next" aria-labelledby="sd-next-t">
            <h2 id="sd-next-t"><Sparkles aria-hidden="true" /> Hôm nay em làm gì?</h2>
            {locked && (classLocked || !next || !nextHref) ? (
              <div className="sd-next-card is-lock">
                <div><b>Nhờ ba mẹ mở Góc Phụ huynh</b><span>để em luyện tiếp các bài mới nhé.</span></div>
                <Link href={PAY} className="btn btn-yellow"><Users aria-hidden="true" /> Góc Phụ huynh</Link>
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
                <Link href={`/chon-bai?grade=${grade}&nc=1`}><Rocket aria-hidden="true" /> Chuyên đề nâng cao</Link>
                <Link href="/tieng-anh"><BookOpen aria-hidden="true" /> English Journey</Link>
                <Link href="/tro-choi"><Gamepad2 aria-hidden="true" /> Game trí tuệ</Link>
                <Link href="/co"><Crown aria-hidden="true" /> Đấu cờ</Link>
                <Link href="/thanh-tich"><Trophy aria-hidden="true" /> Thành tích</Link>
                <Link href="/luyen-chu"><PenLine aria-hidden="true" /> Luyện chữ</Link>
              </div>
            )}
          </section>

          <GalleryTeaser />

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

        {map && kmState && (
          <section className="dash-section sd-map" id="ban-do" aria-labelledby="sd-map-t">
            <h2 id="sd-map-t"><MapIcon aria-hidden="true" /> Bản đồ kiến thức · {map.title}</h2>
            <KnowledgeMap grade={map.grade} state={kmState} hrefs={kmHrefs} compact />
          </section>
        )}

        <div className="sd-fun">
          <DailyChest day={st.today} studied={st.studiedToday} />
          <StickerShelf />
        </div>

        <KidThemeSection />

        <ul className="stat-row sd-stats">
          <li className="stat-tile tone-blue"><span>Bài đã làm</span><strong>{best.size}</strong></li>
          <li className="stat-tile tone-yellow"><span>⭐ Sao tích luỹ</span><strong>{points}</strong></li>
          <li className="stat-tile tone-green"><span>Lượt chơi game</span><strong>{games ?? 0}</strong></li>
        </ul>

        <section className="dash-section student-rooms" id="phong-thi" aria-label="Phòng thi lớp">
          <h2>🌼 Phòng thi lớp</h2>
          {!classLocked && <RoomJoin />}
          {rooms.length > 0 && (
            <ul className="task-list">
              {rooms.map((r) => {
                const open = r.status === 'open' && nowMs >= new Date(r.opens_at).getTime() && nowMs < new Date(r.closes_at).getTime();
                const soon = r.status === 'open' && nowMs < new Date(r.opens_at).getTime();
                return (
                  <li key={r.id} className={`task-item${r.done ? ' is-done' : ''}`}>
                    <span className="task-icon" aria-hidden="true">{r.done ? <CheckCircle2 /> : <Clock />}</span>
                    <div className="task-info">
                      <strong>{r.title}</strong>
                      <span>{SUBJECT_NAME[r.subject]} · {r.n_questions} câu · {r.minutes} phút · {soon ? `mở ${whenLabel(r.opens_at)}` : open ? `đóng ${whenLabel(r.closes_at)}` : 'đã đóng'}</span>
                      {r.done && r.score !== null && <span className="task-done">Đã nộp: {String(Number(r.score)).replace('.', ',')}/10 · {owlOf(Number(r.score)).name} · ⭐ {r.stars}</span>}
                    </div>
                    {!classLocked && (r.done || open) && <Link href={`/hoc-sinh/phong-thi/${r.id}`} className={`btn btn-sm ${r.done ? 'btn-outline' : 'btn-yellow'}`}>{r.done ? 'Xem kết quả' : 'Vào thi'}</Link>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {tasks.length > 0 && (
          <section className="dash-section student-tasks" id="bai-giao" aria-label="Bài thầy cô giao">
            <h2><ClipboardList aria-hidden="true" /> Bài thầy cô giao{todo.length ? ` · còn ${todo.length} bài` : ' · đã làm hết 🎉'}</h2>
            <ul className="task-list">
              {tasks.map((t) => {
                const d = dueInfo(t.due_at);
                const href = workHref(t);
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
