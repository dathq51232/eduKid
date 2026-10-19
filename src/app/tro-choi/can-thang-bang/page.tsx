import type { Metadata } from 'next';
import GameShell from '@/components/games/GameShell';
import BalanceGame from '@/components/games/BalanceGame';
import { gameById, parseLevel } from '@/lib/games/catalog';

const game = gameById('balance');
export const metadata: Metadata = { title: `${game.title} · Game trí tuệ · EduChain Kids` };

type Props = { searchParams: Promise<{ cap?: string }> };

export default async function Page({ searchParams }: Props) {
  const { cap } = await searchParams;
  return (
    <GameShell game={game}>
      <BalanceGame initialLevel={parseLevel(cap)} />
    </GameShell>
  );
}
