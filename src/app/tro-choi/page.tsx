import type { Metadata } from 'next';
import LearnHeader from '@/components/LearnHeader';
import GameCatalog from '@/components/games/GameCatalog';
import MiloMascot from '@/components/mascot/MiloMascot';
import { FILTERS, GAMES, parseGrade, type GameFilter } from '@/lib/games/catalog';

export const metadata: Metadata = { title: 'Game trí tuệ · EduChain Kids' };

type Props = { searchParams: Promise<{ lop?: string; loai?: string }> };

export default async function GamesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.id === sp.loai)?.id ?? 'all') as GameFilter;
  return (
    <>
      <LearnHeader />
      <main className="games-main wrap">
        <header className="games-hero">
          <div>
            <h1>Thế giới khám phá</h1>
            <p className="games-lead">{GAMES.length} trò chơi nhỏ để em luyện quan sát, trí nhớ, suy luận và cách tìm đường.</p>
          </div>
          <MiloMascot mood="happy" size={112} className="games-hero-milo" />
        </header>
        <GameCatalog initialGrade={parseGrade(sp.lop)} initialFilter={filter} />
      </main>
    </>
  );
}
