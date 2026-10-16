import type { Metadata } from 'next';
import GameShell from '@/components/games/GameShell';
import MemoryGame from '@/components/games/MemoryGame';
import { gameById, parseLevel } from '@/lib/games/catalog';

const game = gameById('memory');
export const metadata: Metadata = { title: `${game.title} · Game trí tuệ · EduChain Kids` };

type Props = { searchParams: Promise<{ cap?: string }> };

export default async function Page({ searchParams }: Props) {
  const { cap } = await searchParams;
  return (
    <GameShell game={game}>
      <MemoryGame initialLevel={parseLevel(cap)} />
    </GameShell>
  );
}
