import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpen, CheckCircle2, ChevronDown, ChevronRight, ClipboardList,
  Clock, CreditCard, Crown, Gamepad2, Lock, PenLine, Settings,
  Star, Trophy,
} from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import KidWorld, { KidThemeSection, ThemedMilo } from '@/components/learn/KidWorld';
import { StickerShelf } from '@/components/learn/KidRewards';
import NotConfigured from '@/components/classroom/NotConfigured';
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

export default async function StudentHome() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Trang của em" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/hoc-sinh');
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');

  const supabase = await createClient();
  const [{ data: me }, { data: cls }, { data: results }, { data: gameRows, count: games }, { data: assigned }] = await Promise.all([
    supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
    supabase.from('classes').select('name, grade').eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('lesson_results').select('id, lesson_title, lesson_code, subject_code, grade, muc, score, total, points, created_at').order('created_at', { ascending: false }).limit(300),
    supabase.from('game_results').select('created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(200),
    supabase.rpc('student_my_assignments'),
  ]);

  const gate = await learningGate(supabase, viewer.userId);
  const locked = gate.is_student && !gate.active;
  const PAY = gate.reason === 'plan_locked' ? '/hoc-sinh#tam-khoa' : '/hoc-sinh/dong-phi';
  const tasks = ((assigned ?? []) as MyAssignment[]);
  const todo = tasks.filter((t) => t.status === 'open' && !t.done)
    .sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999'));
  const fmtNum = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
  const list = (results ?? []) as Result[];
  const best = new Map<string, number>();
  for (const r of list) best.set(r.lesson_code, Math.max(best.get(r.lesson_code) ?? 0, r.points));
  const grade = (cls as { grade?: number } | null)?.grade ?? (me as { grade?: number } | null)?.grade ?? 1;
  const name = (me as { display_name?: string } | null)?.display_name ?? 'em';
  const firstName = name.trim().split(/\s+/).slice(-1)[0];

  const st = learningStreak([...list.map((r) => r.created_at), ...((gameRows ?? []) as { created_at: string }[]).map((g) => g.created_at)]);

  const bestRatio = new Map<string, number>();
  for (const r of list) bestRatio.set(r.lesson_code, Math.max(bestRatio.get(r.lesson_code) ?? 0, r.score / r.total));

  const next = todo[0];
  const nextHref = next ? (locked ? PAY : next.kind === 'exam' ? `/hoc-sinh/de/${next.id}` : next.lesson_code && next.subject ? lessonHref(next.lesson_code, next.subject, next.grade, next.muc) : null) : null;
  const nextDue = next ? dueInfo(next.due_at) : null;

  return (
    <>
      <LearnHeader />
      <KidWorld />
      <main className="sd-game">
        {/* === Thông báo học phí === */}
        {gate.reason === 'plan_locked' && (
          <p id="tam-khoa" className="adm-alert is-warn tuition-banner" role="status"><Lock aria-hidden="true" /> Tài khoản của em đang tạm khoá vì lớp đã hết thời gian dùng thử. Bài em đã làm vẫn được giữ nguyên — khi thầy cô mở thêm chỗ, em học tiếp được ngay.</p>
        )}
        {gate.reason === 'expired' && (
          <p className="adm-alert is-warn tuition-banner" role="status"><Lock aria-hidden="true" /> Thời gian học của em đã hết. Nhờ bố mẹ đóng học phí để học tiếp nhé! <Link href={PAY} className="btn btn-yellow btn-sm"><CreditCard aria-hidden="true" /> Đóng học phí</Link></p>
        )}
        {gate.reason === 'trial' && (
          <p className="adm-alert is-info tuition-banner">Em đang học thử miễn phí đến {fmtDay(gate.until)}. <Link href={PAY}>Xem học phí →</Link></p>
        )}
        {gate.reason === 'paid' && (
          <p className="dash-muted tuition-banner">Đã đóng học phí — học đến hết {fmtDay(gate.until)}. <Link href={PAY}>Học phí</Link></p>
        )}

        {/* === LAYOUT GAME === */}
        <div className="sdg-wrap">

          {/* ---- Panel trái: bảng đen ---- */}
          <div className="sdg-left">
            {/* Header logo + streak + settings */}
            <div className="sdg-topbar">
              <span className="sdg-logo">
                <Image src="/brand/logo.svg" alt="EduChain Kids" width={120} height={40} />
              </span>
              <span className="sdg-streak">🔥 {st.streak} ngày</span>
              <Link href="/hoc-sinh/cai-dat" className="sdg-settings" aria-label="Cài đặt">
                <Settings />
              </Link>
            </div>

            {/* Bảng đen lớn */}
            <div className="sdg-board">
              {/* Nhân vật cô bé bên trái bảng (dùng ThemedMilo vì không có milo-girl.webp) */}
              <div className="sdg-girl" aria-hidden="true">
                <ThemedMilo size={180} />
              </div>

              {/* Cú Milo góc trên */}
              <div className="sdg-owl" aria-hidden="true">
                <div className="sdg-owl-bubble">Chào {firstName}! ♥</div>
                <ThemedMilo size={72} />
              </div>

              {/* Nội dung bảng phấn */}
              <div className="sdg-chalk">
                <span className="sdg-chalk-sub">Hôm nay:</span>
                <h1 className="sdg-chalk-title">
                  {next ? next.title : 'Chọn một bài em thích'}
                </h1>
                <p className="sdg-chalk-meta">
                  <Clock size={16} />
                  {next
                    ? `${(next as MyAssignment & { n_questions?: number }).n_questions ?? 10} câu · khoảng ${(next as MyAssignment & { minutes?: number }).minutes ?? 8} phút`
                    : 'Toán, Tiếng Việt hay Tiếng Anh'}
                </p>
                <Link
                  href={nextHref ?? (locked ? PAY : `/chon-bai?grade=${grade}`)}
                  className="sdg-btn-play"
                  aria-label="Vào học"
                >
                  ▶ Vào học
                </Link>
                {todo.length > 0 && (
                  <Link href="#bai-giao" className="sdg-more-tasks">
                    <BookOpen size={14} /> còn {todo.length} bài cô giao <ChevronDown size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ---- Panel phải: 3 card ---- */}
          <div className="sdg-right">

            {/* Card 1: Tuần của em */}
            <div className="sdg-card sdg-week-card">
              <div className="sdg-card-head">
                <h2>Tuần của em</h2>
                <span className="sdg-gift">🎁</span>
              </div>
              <ol className="sdg-week-row">
                {st.week.map((w) => (
                  <li key={w.day} className={`${w.done ? 'is-done' : ''}${w.today ? ' is-today' : ''}${w.future ? ' is-future' : ''}`}>
                    <span>{w.done ? '✓' : ''}</span>
                    <small>{w.label}</small>
                  </li>
                ))}
              </ol>
            </div>

            {/* Card 2: Cặp sách */}
            <div className="sdg-card sdg-bag-card">
              <div className="sdg-card-head">
                <span className="sdg-bag-icon">🎒</span>
                <h2>Cặp sách</h2>
              </div>
              <div className="sdg-books">
                <Link href={`/chon-bai?grade=${grade}&subject=toan`} className="sdg-book is-blue">
                  <span>++</span><b>Toán</b>
                </Link>
                <Link href={`/chon-bai?grade=${grade}&subject=tieng-viet`} className="sdg-book is-red">
                  <BookOpen size={28} /><b>T.Việt</b>
                </Link>
                <Link href="/tieng-anh" className="sdg-book is-green">
                  <span>🇬🇧</span><b>T.Anh</b>
                </Link>
              </div>
              <div className="sdg-quick-icons">
                <Link href="/tro-choi"><Gamepad2 size={22} /><span>Game</span></Link>
                <Link href="/co"><Crown size={22} /><span>Cờ</span></Link>
                <Link href="/luyen-chu"><PenLine size={22} /><span>Luyện chữ</span></Link>
                <Link href="/thanh-tich"><Trophy size={22} /><span>Thành tích</span></Link>
              </div>
            </div>

            {/* Card 3: Sticker */}
            <div className="sdg-card sdg-sticker-card">
              <StickerShelf />
            </div>

          </div>
        </div>

        {/* Bài thầy cô giao */}
        {tasks.length > 0 && (
          <section className="dash-section student-tasks sdg-history" id="bai-giao" aria-label="Bài thầy cô giao">
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

        {/* Bài đã làm gần đây */}
        <section className="dash-section sdg-history" aria-label="Bài em làm gần đây">
          <h2>Bài em làm gần đây</h2>
          {list.length === 0 ? <p className="dash-muted">Em chưa làm bài nào. Bấm &quot;Vào học&quot; để bắt đầu nhé!</p> : (
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

        <KidThemeSection />
      </main>
    </>
  );
}
