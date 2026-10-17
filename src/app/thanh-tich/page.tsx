import type { Metadata } from 'next';
import Link from 'next/link';
import LearnHeader from '@/components/LearnHeader';
import MiloBadge from '@/components/mascot/MiloBadge';
import MiloMascot from '@/components/mascot/MiloMascot';
import { GAME_LEVELS, gameById, gameHref } from '@/lib/games/catalog';
import { DEMO_BADGES, DEMO_PLAYER, DEMO_PRAISE, DEMO_PROGRESS, totalChallenges, totalPlays } from '@/lib/games/demo-achievements';
import LiveAchievements from '@/components/achievements/LiveAchievements';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'Thành tích · EduChain Kids' };

export const dynamic = 'force-dynamic';

// Đã nối Supabase: học sinh xem thành tích THẬT (tự làm mới); thầy cô được dẫn sang Quản lý lớp.
// Chưa nối Supabase (chế độ demo): giữ trang dữ liệu minh họa như cũ.
export default async function AchievementsPage() {
  const viewer = await getViewer();
  if (viewer.state === 'ok' && viewer.isStudent) {
    return (<><LearnHeader /><main className="games-main wrap"><LiveAchievements /></main></>);
  }
  if (viewer.state === 'ok') {
    return (
      <>
        <LearnHeader />
        <main className="games-main wrap">
          <header className="ach-hero">
            <MiloMascot mood="cheer" size={104} />
            <div>
              <h1>Thành tích</h1>
              <p>Trang này dành cho học sinh đăng nhập bằng mã lớp và PIN. Thầy cô xem bảng <strong>Bạn điểm cao nhất</strong> tuần/tháng của từng lớp trong mục Quản lý lớp.</p>
              <p><Link href="/giao-vien" className="btn btn-outline">Đến Quản lý lớp</Link></p>
            </div>
          </header>
        </main>
      </>
    );
  }
  return <DemoAchievements />;
}

function DemoAchievements() {
  const earned = DEMO_BADGES.filter((b) => b.earned).length;
  return (
    <>
      <LearnHeader />
      <main className="games-main wrap">
        <header className="ach-hero">
          <MiloMascot mood="cheer" size={104} />
          <div>
            <p className="demo-label">Dữ liệu minh họa</p>
            <h1>Thành tích của em</h1>
            <p>
              Trang này đang hiển thị <strong>dữ liệu minh họa</strong> của {DEMO_PLAYER.name} — một bạn nhỏ giả định — để xem trước giao diện.
              Kết quả chơi thật chưa được lưu. Khi đăng nhập bằng mã lớp và PIN, trang hiện điểm thật của em và bảng bạn điểm cao nhất trong lớp.
            </p>
          </div>
        </header>

        <section aria-labelledby="ach-summary" className="ach-section">
          <h2 id="ach-summary" className="sr-only">Tổng quan</h2>
          <dl className="ach-stats">
            <div><dt>Lượt chơi</dt><dd>{totalPlays()}</dd></div>
            <div><dt>Thử thách hoàn thành</dt><dd>{totalChallenges()}</dd></div>
            <div><dt>Huy hiệu</dt><dd>{earned}/{DEMO_BADGES.length}</dd></div>
          </dl>
        </section>

        <section aria-labelledby="ach-praise" className="ach-section ach-praise">
          <h2 id="ach-praise">Milo muốn khen em</h2>
          <ul>
            {DEMO_PRAISE.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </section>

        <section aria-labelledby="ach-progress" className="ach-section">
          <h2 id="ach-progress">Tiến độ từng trò chơi</h2>
          <ul className="ach-progress">
            {DEMO_PROGRESS.map((p) => {
              const g = gameById(p.game);
              const next = GAME_LEVELS.find((lv) => !p.levelsDone.includes(lv));
              return (
                <li key={p.game} className="ach-game">
                  <div className="ach-game-head">
                    <h3>{g.title}</h3>
                    <span>{p.plays} lượt chơi</span>
                  </div>
                  <ol className="ach-levels" aria-label={`Đã hoàn thành ${p.levelsDone.length} trên 5 cấp độ`}>
                    {GAME_LEVELS.map((lv) => (
                      <li key={lv} className={p.levelsDone.includes(lv) ? 'is-done' : ''}>
                        <span aria-hidden="true">L{lv}</span>
                        <span className="sr-only">Cấp độ L{lv}: {p.levelsDone.includes(lv) ? 'đã hoàn thành' : 'chưa chơi'}</span>
                      </li>
                    ))}
                  </ol>
                  <p>{p.note}</p>
                  {next && <Link href={gameHref(g, next)} className="text-action">Thử L{next}</Link>}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="ach-badges" className="ach-section">
          <h2 id="ach-badges">Huy hiệu</h2>
          <p className="ach-muted">Huy hiệu chỉ để ghi nhớ cố gắng của em, không đổi được thành tiền hay quà.</p>
          <ul className="ach-badges">
            {DEMO_BADGES.map((b) => (
              <li key={b.id} className={b.earned ? '' : 'is-locked'}>
                <MiloBadge icon={b.icon} earned={b.earned} />
                <h3>{b.title}</h3>
                <p>{b.detail}</p>
                <span className="sr-only">{b.earned ? 'Đã nhận' : 'Chưa nhận'}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
