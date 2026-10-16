import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import type { GameInfo } from '@/lib/games/catalog';

/** Khung chung của một trang game: nút về danh mục, tên game, mô tả, rồi tới phần chơi */
export default function GameShell({ game, children }: { game: GameInfo; children: React.ReactNode }) {
  return (
    <>
      <LearnHeader />
      <main className="game-main">
        <Link href="/tro-choi" className="back-link"><ArrowLeft className="icon" aria-hidden="true" /> Về danh mục</Link>
        <header className="game-head">
          <h1>{game.title}</h1>
          {game.status === 'beta' && <span className="game-tag is-beta">Đang thử nghiệm</span>}
          <p>{game.summary}</p>
        </header>
        {children}
      </main>
    </>
  );
}
