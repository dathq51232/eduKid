import type { Metadata } from 'next';
import GameShell from '@/components/games/GameShell';
import PatternGame from '@/components/games/PatternGame';
import { gameById, parseLevel } from '@/lib/games/catalog';

const game = gameById('pattern');
export const metadata: Metadata = { title: `${game.title} · Game trí tuệ · EduChain Kids` };

type Props = { searchParams: Promise<{ cap?: string }> };

export default async function Page({ searchParams }: Props) {
  const { cap } = await searchParams;
  return (
    <GameShell game={game}>
      <PatternGame initialLevel={parseLevel(cap)} />
    </GameShell>
  );
}
