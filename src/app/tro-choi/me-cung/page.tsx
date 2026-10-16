import type { Metadata } from 'next';
import GameShell from '@/components/games/GameShell';
import MazeGame from '@/components/games/MazeGame';
import { gameById, parseLevel } from '@/lib/games/catalog';

const game = gameById('maze');
export const metadata: Metadata = { title: `${game.title} · Game trí tuệ · EduChain Kids` };

type Props = { searchParams: Promise<{ cap?: string }> };

export default async function Page({ searchParams }: Props) {
  const { cap } = await searchParams;
  return (
    <GameShell game={game}>
      <MazeGame initialLevel={parseLevel(cap)} />
    </GameShell>
  );
}
