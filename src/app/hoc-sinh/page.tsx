import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Gamepad2, Star } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import MiloMascot from '@/components/mascot/MiloMascot';
import NotConfigured from '@/components/classroom/NotConfigured';
import SignOutButton from '@/components/classroom/SignOutButton';
import { getViewer } from '@/lib/auth/viewer';
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
  const [{ data: me }, { data: cls }, { data: results }, { count: games }] = await Promise.all([
    supabase.from('students').select('display_name, grade').eq('id', viewer.studentId).maybeSingle(),
    supabase.from('classes').select('name, grade').limit(1).maybeSingle(),
    supabase.from('lesson_results').select('id, lesson_title, lesson_code, score, total, points, created_at').order('created_at', { ascending: false }).limit(20),
    supabase.from('game_results').select('id', { count: 'exact', head: true }),
  ]);
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
