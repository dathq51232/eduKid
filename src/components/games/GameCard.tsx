import Link from 'next/link';
import { Clock } from 'lucide-react';
import GameArt from './GameArt';
import { CATEGORY_LABEL, LEVEL_INFO, gameHref, type GameInfo, type GameLevel } from '@/lib/games/catalog';

type Props = { game: GameInfo; suggested?: GameLevel };

export default function GameCard({ game, suggested }: Props) {
  const headingId = `game-${game.id}-title`;
  return (
    <article className="game-card" aria-labelledby={headingId}>
      <GameArt id={game.id} />
      <div className="game-card-body">
        <div className="game-card-tags">
          {game.categories.map((c) => (
            <span key={c} className="game-tag">{CATEGORY_LABEL[c]}</span>
          ))}
          {game.status === 'beta' && <span className="game-tag is-beta">Đang thử nghiệm</span>}
        </div>
        <h3 id={headingId}>{game.title}</h3>
        <p className="game-card-summary">{game.summary}</p>
        <p className="game-card-skills">
          <span className="sr-only">Kỹ năng được luyện: </span>
          {game.skills.join(' · ')}
        </p>
        <p className="game-card-meta">
          <Clock className="icon" aria-hidden="true" />
          <span>Khoảng {game.minutes[0]}–{game.minutes[1]} phút</span>
          {suggested && <span className="game-card-level">Gợi ý: L{suggested} · {LEVEL_INFO[suggested].name}</span>}
        </p>
        <Link href={gameHref(game, suggested)} className="button button-yellow game-play" aria-label={`Chơi ngay: ${game.title}`}>
          Chơi ngay
        </Link>
      </div>
    </article>
  );
}
