import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, ClipboardList, Clock, Gamepad2, Star } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import { getViewer } from '@/lib/auth/viewer';
import { MUC_NAME, SUBJECT_NAME, dueInfo, lessonHref, type MyAssignment } from '@/lib/classroom/assignments';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Trang của em · EduChain Kids' };
export const dynamic = 'force-dynamic';

type Result = { id: string; lesson_title: string | null; lesson_code: string; score: number; total: number; points: number; created_at: string };

export default async function StudentHome() {
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Trang của em" /></main></>);
  if (viewer.state === 'signed_out') redirect('/dang-nhap?next=/hoc-sinh');
  if (!viewer.isStudent || !viewer.studentId) redirect('/sau-dang-nhap');

  const supabase = await createClient();
  // RLS chỉ trả dữ liệu của chính học sinh đang đăng nhập
  const [{ data: me }, { data: cls }, { data: results }, { count: games }, { data: assigned }] = await Promise.all([
    supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
    supabase.from('classes').select('name, grade').limit(1).maybeSingle(),
    supabase.from('lesson_results').select('id, lesson_title, lesson_code, score, total, points, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('game_results').select('id', { count: 'exact', head: true }),
    // Bài thầy cô giao (migration 0017). Chưa chạy migration thì bỏ qua, trang vẫn hiện bình thường.
    supabase.rpc('student_my_assignments'),
  ]);
  const tasks = ((assigned ?? []) as MyAssignment[]);
  const todo = tasks.filter((t) => t.status === 'open' && !t.done);
  const fmtNum = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
  const list = (results ?? []) as Result[];
  const best = new Map<string, number>();
  for (const r of list) best.set(r.lesson_code, Math.max(best.get(r.lesson_code) ?? 0, r.points));
  const points = [...best.values()].reduce((a, b) => a + b, 0);
  const grade = (me as { grade?: number } | null)?.grade ?? 1;

  return (
    <>
      <LearnHeader />
      <main className="dash wrap">
        <section className="dash-hero">
          <MiloMascot size={110} />
          <div>
            <p className="dash-kicker">{cls ? `Lớp ${(cls as { name: string }).name}` : `Lớp ${grade}`}</p>
            <h1>Chào {(me as { display_name?: string } | null)?.display_name ?? 'em'}!</h1>
            <p>Hôm nay mình học một bài nhỏ nhé.</p>
            <div className="dash-actions">
              <Link href={`/chon-bai?grade=${grade}`} className="btn btn-yellow"><BookOpen aria-hidden="true" /> Vào học</Link>
              <Link href="/tro-choi" className="btn btn-outline"><Gamepad2 aria-hidden="true" /> Game trí tuệ</Link>
              <SignOutButton />
            </div>
          </div>
        </section>

        {tasks.length > 0 && (
          <section className="dash-section student-tasks" aria-label="Bài thầy cô giao">
            <h2><ClipboardList aria-hidden="true" /> Bài thầy cô giao{todo.length ? ` · còn ${todo.length} bài` : ''}</h2>
            <ul className="task-list">
              {tasks.map((t) => {
                const d = dueInfo(t.due_at);
                const href = t.kind === 'exam' ? `/hoc-sinh/de/${t.id}` : t.lesson_code && t.subject ? lessonHref(t.lesson_code, t.subject, t.grade, t.muc) : null;
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

        <ul className="stat-row">
          <li className="stat-tile tone-blue"><span>Bài đã làm</span><strong>{best.size}</strong></li>
          <li className="stat-tile tone-yellow"><span>Điểm tích luỹ</span><strong>{points}</strong></li>
          <li className="stat-tile tone-green"><span>Lượt chơi game</span><strong>{games ?? 0}</strong></li>
        </ul>

        <section className="dash-section">
          <h2>Bài em làm gần đây</h2>
          {list.length === 0 ? <p className="dash-muted">Em chưa làm bài nào. Bấm “Vào học” để bắt đầu nhé!</p> : (
            <ul className="result-list">
              {list.map((r) => (
                <li key={r.id}>
                  <span className="result-title">{r.lesson_title ?? r.lesson_code}</span>
                  <span className="result-score">{r.score}/{r.total}</span>
                  <span className="result-points"><Star aria-hidden="true" /> {r.points}</span>
                  <span className="result-date">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
