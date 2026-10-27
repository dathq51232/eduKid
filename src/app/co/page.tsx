import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, Swords, Trophy } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import { PieceIcon } from '@/components/chess/ChessPieces';
import { XqDiscIcon } from '@/components/xiangqi/XiangqiBoard';

export const metadata: Metadata = { title: 'Đấu cờ · EduChain Kids' };

// Trang chung của Câu lạc bộ cờ: cờ vua, cờ tướng; chơi với máy, đấu với bạn trong trường, giải đấu toàn trường.
export default function ChessHubPage() {
  return (
    <>
      <LearnHeader />
      <main className="games-main wrap chh">
        <header className="games-hero">
          <div>
            <h1>Câu lạc bộ cờ</h1>
            <p className="games-lead">Chơi cờ vua, cờ tướng theo đúng luật thi đấu. Luyện với máy, đấu với bạn trong trường và tham gia giải toàn trường.</p>
          </div>
          <span className="chh-hero-ic" aria-hidden="true"><PieceIcon type="n" color="w" size={84} /><PieceIcon type="k" color="b" size={96} /></span>
        </header>
        <div className="chh-grid">
          <Link href="/co/vua" className="chh-card is-chess">
            <span className="chh-art" aria-hidden="true"><PieceIcon type="q" color="w" size={70} /><PieceIcon type="n" color="b" size={64} /></span>
            <b>Cờ vua</b>
            <span>Luật quốc tế FIDE · bàn 8×8</span>
            <ul>
              <li><Bot aria-hidden="true" /> Chơi với máy · 3 mức</li>
              <li><Swords aria-hidden="true" /> Đấu với bạn trong trường</li>
              <li className="is-soon"><Trophy aria-hidden="true" /> Giải toàn trường <em>sắp có</em></li>
            </ul>
          </Link>
          <div className="chh-card is-xq is-soon" aria-disabled="true">
            <span className="chh-art chh-xq" aria-hidden="true"><XqDiscIcon piece={{ side: 'r', kind: 'k' }} size={70} /><XqDiscIcon piece={{ side: 'b', kind: 'h' }} size={70} /><XqDiscIcon piece={{ side: 'r', kind: 'c' }} size={70} /></span>
            <b>Cờ tướng</b>
            <span>Luật thi đấu cờ tướng · bàn 9×10</span>
            <ul><li><em>Sắp có</em></li></ul>
          </div>
        </div>
      </main>
    </>
  );
}
