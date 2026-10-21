import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Gamepad2, ListChecks } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import NotConfigured from '@/components/classroom/NotConfigured';
import CsvButton from '@/components/classroom/CsvButton';
import { getViewer } from '@/lib/auth/viewer';
import { createClient } from '@/lib/supabase/server';
import { gameById } from '@/lib/games/catalog';
import type { GameId } from '@/lib/games/catalog';
import {
  fmtDateTime, fmtDuration, lessonsOfStudent, percent, studentTotals, subjectLabel,
  type GameResult, type LessonResult,
} from '@/lib/classroom/progress';

export const metadata: Metadata = { title: 'Tiến độ học sinh · EduChain Kids' };
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;
const tone = (p: number) => (p >= 80 ? 'is-good' : p >= 50 ? 'is-mid' : 'is-low');

// Tiến độ chi tiết của MỘT học sinh, chỉ cho giáo viên được phân công lớp đó.
// Kiểm tra 2 lớp: lớp phải đọc được qua RLS và học sinh phải đang ở trong danh sách lớp (hàm teacher_class_roster).
export default async function StudentProgressPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const viewer = await getViewer();
  if (viewer.state === 'not_configured') return (<><LearnHeader /><main className="dash wrap"><NotConfigured title="Tiến độ học sinh" /></main></>);
  if (viewer.state === 'signed_out') redirect(`/dang-nhap?next=/giao-vien/lop/${id}/hoc-sinh/${sid}`);
  if (!viewer.isTeacher && !viewer.isAdmin) redirect('/giao-vien');
  if (!UUID.test(id) || !UUID.test(sid)) notFound();

  const supabase = await createClient();
  const { data: cls } = await supabase.from('classes').select('id, name, grade').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const { data: roster } = await supabase.rpc('teacher_class_roster', { p_class: id });
  const student = ((roster ?? []) as { student_id: string; display_name: string; membership_status: string }[]).find((r) => r.student_id === sid);
  if (!student) notFound();

  const [{ data: lessons }, { data: games }] = await Promise.all([
    supabase.from('lesson_results')
      .select('id, student_id, lesson_code, lesson_title, subject_code, grade, muc, score, total, points, duration_ms, created_at')
      .eq('student_id', sid).order('created_at', { ascending: false }).limit(1000),
    supabase.from('game_results')
      .select('id, student_id, game_id, level, score, max_score, duration_ms, created_at')
      .eq('student_id', sid).order('created_at', { ascending: false }).limit(200),
  ]);
  const results = (lessons ?? []) as LessonResult[];
  const gameList = (games ?? []) as GameResult[];
  const rows = lessonsOfStudent(results);
  const t = studentTotals(results);
  const clsName = (cls as { name: string }).name;

  return (
    <>
      <LearnHeader />
      <main className="dash wrap student-progress">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back"><ArrowLeft aria-hidden="true" /> Lớp {clsName}</Link>
        <div className="dash-head">
          <div>
            <p className="dash-kicker">Tiến độ học sinh · Lớp {clsName}</p>
            <h1>{student.display_name}</h1>
            {student.membership_status !== 'active' && <p className="dash-muted">Bạn này đã rời lớp.</p>}
          </div>
          <CsvButton
            filename={`ket-qua-${student.display_name.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`}
            header={['Bài', 'Môn', 'Mức', 'Số câu đúng', 'Tổng số câu', '% đúng', 'Điểm', 'Thời gian (giây)', 'Lúc làm']}
            rows={results.map((r) => [r.lesson_title ?? r.lesson_code, subjectLabel(r.subject_code), r.muc, r.score, r.total, percent(r.score, r.total), r.points, r.duration_ms ? Math.round(r.duration_ms / 1000) : null, fmtDateTime(r.created_at)])}
          />
        </div>

        <ul className="stat-row">
          <li className="stat-tile tone-blue"><span>Bài đã làm</span><strong>{t.lessons}</strong></li>
          <li className="stat-tile tone-sky"><span>Lượt làm bài</span><strong>{t.attempts}</strong></li>
          <li className="stat-tile tone-green"><span>Đúng trung bình</span><strong>{t.attempts ? `${t.avgPercent}%` : '—'}</strong></li>
          <li className="stat-tile tone-yellow"><span>Điểm tích luỹ</span><strong>{t.points}</strong></li>
          <li className="stat-tile tone-purple"><span>Thời gian học</span><strong>{t.minutes} phút</strong></li>
        </ul>

        <section className="dash-section">
          <h2><ListChecks aria-hidden="true" /> Các bài đã làm ({rows.length})</h2>
          {rows.length === 0 ? <p className="dash-muted">Em chưa làm bài nào.</p> : (
            <div className="table-scroll">
              <table className="roster-table progress-table">
                <thead>
                  <tr><th>Bài</th><th>Môn</th><th>Số lần</th><th>Tốt nhất</th><th>Lần gần nhất</th><th>Điểm</th><th>Lúc làm gần nhất</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const bp = percent(r.best.score, r.best.total);
                    const lp = percent(r.last.score, r.last.total);
                    return (
                      <tr key={r.lesson_code}>
                        <th scope="row">{r.title}</th>
                        <td>{subjectLabel(r.subject)}</td>
                        <td>{r.attempts}</td>
                        <td><span className={`score-chip ${tone(bp)}`}>{r.best.score}/{r.best.total}</span></td>
                        <td><span className={`score-chip ${tone(lp)}`}>{r.last.score}/{r.last.total}</span></td>
                        <td>{r.bestPoints}</td>
                        <td>{fmtDateTime(r.last.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dash-section">
          <h2>Lịch sử làm bài</h2>
          {results.length === 0 ? <p className="dash-muted">Chưa có lượt làm bài.</p> : (
            <div className="table-scroll">
              <table className="roster-table progress-table">
                <thead>
                  <tr><th>Lúc làm</th><th>Bài</th><th>Kết quả</th><th>Điểm</th><th>Thời gian</th></tr>
                </thead>
                <tbody>
                  {results.slice(0, 50).map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDateTime(r.created_at)}</td>
                      <th scope="row">{r.lesson_title ?? r.lesson_code}</th>
                      <td><span className={`score-chip ${tone(percent(r.score, r.total))}`}>{r.score}/{r.total} · {percent(r.score, r.total)}%</span></td>
                      <td>{r.points}</td>
                      <td>{fmtDuration(r.duration_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {results.length > 50 && <p className="dash-muted">Hiện 50 lượt gần nhất. Tải CSV để xem đủ {results.length} lượt.</p>}
        </section>

        <section className="dash-section">
          <h2><Gamepad2 aria-hidden="true" /> Game trí tuệ ({gameList.length} lượt)</h2>
          <p className="dash-muted">Game chạy trên máy của em nên chỉ dùng để tham khảo, không tính vào điểm bài học.</p>
          {gameList.length > 0 && (
            <div className="table-scroll">
              <table className="roster-table progress-table">
                <thead><tr><th>Lúc chơi</th><th>Game</th><th>Cấp</th><th>Kết quả</th></tr></thead>
                <tbody>
                  {gameList.slice(0, 30).map((g) => (
                    <tr key={g.id}>
                      <td>{fmtDateTime(g.created_at)}</td>
                      <th scope="row">{gameById(g.game_id as GameId)?.title ?? (g.game_id === 'robot' ? 'Robot lập trình (đã gỡ)' : g.game_id)}</th>
                      <td>{g.level}</td>
                      <td>{g.score}/{g.max_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
