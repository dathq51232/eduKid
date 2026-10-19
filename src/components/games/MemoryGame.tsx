'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GAME_MASCOT } from '@/lib/mascots';
import GameFinish from './GameFinish';
import LevelPicker, { rememberLevel } from './LevelPicker';
import ShapeIcon from './ShapeIcon';
import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameLevel } from '@/lib/games/catalog';
import { COLUMNS_BY_LEVEL, PAIRS_BY_LEVEL, flip, isDone, newGame, pairsFound, settle, type MemoryState } from '@/lib/games/memory';

/** Thời gian hai thẻ không trùng còn ngửa để em kịp nhìn (không phải đồng hồ tính giờ) */
const PEEK_MS = 1100;

export default function MemoryGame({ initialLevel }: { initialLevel: GameLevel }) {
  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [game, setGame] = useState<MemoryState | null>(null);
  const [message, setMessage] = useState('Lật hai thẻ. Nếu giống nhau, em ghép được một cặp!');
  const [mood, setMood] = useState<'happy' | 'cheer' | 'think'>('happy');

  // Xáo thẻ ở trình duyệt (sau khi tải trang) để mỗi lần bắt đầu là một cách sắp xếp mới
  useEffect(() => {
    setGame(newGame(PAIRS_BY_LEVEL[initialLevel], Math.random));
  }, [initialLevel]);

  // Hai thẻ khác nhau: để ngửa một chút rồi úp lại
  useEffect(() => {
    if (!game?.waiting) return;
    const t = window.setTimeout(() => setGame((g) => (g ? settle(g) : g)), PEEK_MS);
    return () => window.clearTimeout(t);
  }, [game]);

  const start = (lv: GameLevel = level) => {
    setLevel(lv);
    setGame(newGame(PAIRS_BY_LEVEL[lv], Math.random));
    setMessage('Thẻ đã được xáo lại. Lật hai thẻ để bắt đầu nhé!');
    setMood('happy');
  };
  const changeLevel = (lv: GameLevel) => {
    rememberLevel(lv);
    start(lv);
  };

  const onCard = (i: number) => {
    if (!game) return;
    // Đang chờ úp hai thẻ cũ mà em lật thẻ khác: úp ngay rồi lật thẻ mới
    const base = game.waiting && !game.open.includes(i) ? settle(game) : game;
    const { state, result } = flip(base, i);
    if (result === 'ignored') return;
    setGame(state);
    const face = state.cards[i].face.label;
    if (result === 'first') {
      setMessage(`Em vừa lật ${face}. Thẻ còn lại ở đâu nhỉ?`);
      setMood('think');
    } else if (result === 'match') {
      const left = state.cards.length / 2 - pairsFound(state);
      setMessage(left ? `Trùng khớp: hai ${face}! Còn ${left} cặp nữa.` : `Trùng khớp: hai ${face}!`);
      setMood('cheer');
    } else {
      const other = state.cards[state.open[0]].face.label;
      setMessage(`Chưa trùng: ${other} và ${face}. Nhớ vị trí của chúng nhé!`);
      setMood('happy');
    }
  };

  const pairs = PAIRS_BY_LEVEL[level];
  const detail = (lv: GameLevel) => `${PAIRS_BY_LEVEL[lv]} cặp thẻ (${PAIRS_BY_LEVEL[lv] * 2} thẻ), không tính giờ`;

  if (game && isDone(game)) {
    return (
      <>
        <LevelPicker value={level} onChange={changeLevel} detail={detail} />
        <GameFinish
          mascot={GAME_MASCOT.memory}
          title="Nhà vô địch trí nhớ!"
          message={`Em đã tìm đủ ${pairs} cặp thẻ. Trí nhớ được luyện mỗi ngày sẽ càng ngày càng giỏi!`}
          stats={[
            { label: 'Số lượt', value: String(game.turns) },
            { label: 'Số lần lật', value: String(game.flips) },
            { label: 'Cặp thẻ', value: `${pairs}/${pairs}` },
          ]}
          level={level}
          onReplay={() => start()}
          onNextLevel={() => changeLevel((level + 1) as GameLevel)}
          record={{ gameId: 'memory', score: pairs, maxScore: pairs, details: { turns: game.turns, flips: game.flips } }}
        />
      </>
    );
  }

  return (
    <>
      <LevelPicker value={level} onChange={changeLevel} detail={detail} />

      <section className="game-panel" aria-labelledby="memory-title">
        <div className="game-panel-top">
          <h2 id="memory-title" className="game-progress">Tìm {pairs} cặp hình giống nhau</h2>
          <p className="game-score">
            Lượt: <strong>{game?.turns ?? 0}</strong> · Cặp: <strong>{game ? pairsFound(game) : 0}/{pairs}</strong>
          </p>
        </div>

        <div className="memory-status">
          <MiloMascot variant={GAME_MASCOT.memory} mood={mood} size={56} />
          <p aria-live="polite">{message}</p>
        </div>

        {game ? (
          <ul className="memory-grid" style={{ ['--cols' as string]: COLUMNS_BY_LEVEL[level] }} aria-label="Các thẻ">
            {game.cards.map((card, i) => {
              const matched = game.matched[i];
              const up = matched || game.open.includes(i);
              const label = `Thẻ ${i + 1}: ${up ? card.face.label : 'đang úp'}${matched ? ', đã ghép' : ''}`;
              return (
                <li key={card.uid}>
                  <button
                    type="button"
                    className={`memory-card${up ? ' is-up' : ''}${matched ? ' is-matched' : ''}`}
                    onClick={() => onCard(i)}
                    aria-label={label}
                    aria-disabled={up ? true : undefined}
                  >
                    <span className="memory-inner">
                      <span className="memory-back" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 3l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16l-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3z" fill="rgba(255,255,255,.75)" /></svg>
                      </span>
                      <span className="memory-front" aria-hidden="true">
                        <ShapeIcon shape={card.face.shape} color={card.face.color} size={48} />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="game-loading">Milo đang xáo thẻ…</p>
        )}
      </section>

      <div className="game-bar">
        <button type="button" className="button button-white" onClick={() => start()}>Bắt đầu lại</button>
        <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
      </div>
    </>
  );
}
