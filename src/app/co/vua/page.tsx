import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import ChessVsBot from '@/components/chess/ChessVsBot';
import { ChessTabs } from '@/components/chess/ChessParts';

export const metadata: Metadata = { title: 'Cờ vua · EduChain Kids' };

export default function ChessPage() {
  return (
    <>
      <LearnHeader />
      <main className="chs-page wrap">
        <header className="chs-head">
          <div className="chs-title">
            <Link href="/co" className="back-link" aria-label="Về Câu lạc bộ cờ"><ArrowLeft className="icon" aria-hidden="true" /> <span>Câu lạc bộ cờ</span></Link>
            <h1>Cờ vua</h1>
          </div>
          <ChessTabs active="bot" />
        </header>
        <ChessVsBot />
      </main>
    </>
  );
}
