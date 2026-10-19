'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import MiloMascot from '@/components/mascot/MiloMascot';
import { LEVEL_INFO, type GameId, type GameLevel } from '@/lib/games/catalog';
import { syncGameResult } from '@/lib/progress-sync';

type Props = {
  title: string;
  message: string;
  stats?: { label: string; value: string }[];
  level: GameLevel;
  onReplay: () => void;
  replayLabel?: string;
  onNextLevel?: () => void;
  extra?: React.ReactNode;
  /** Kết quả gửi lên máy chủ nếu học sinh đã đăng nhập (khách thì bỏ qua) */
  record?: { gameId: GameId; score: number; maxScore: number; details?: Record<string, number> };
};

/** Màn hoàn thành dùng chung cho mọi game: Milo reo vui, lời khen, các nút chơi lại / về danh mục */
export default function GameFinish({ title, message, stats, level, onReplay, replayLabel = 'Chơi lại', onNextLevel, extra, record }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const sent = useRef(false);
  useEffect(() => {
    if (!record || sent.current) return;
    sent.current = true;
    syncGameResult({ ...record, level });
  }, [record, level]);
  return (
    <section className="game-finish" aria-labelledby="game-finish-title">
      <MiloMascot mood="cheer" size={120} />
      <div className="game-finish-body">
        <h2 id="game-finish-title" ref={headingRef} tabIndex={-1}>{title}</h2>
        <p>{message}</p>
        {stats && (
          <dl className="game-stats">
            {stats.map((s) => (
              <div key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="game-finish-actions">
          <button type="button" className="button button-yellow" onClick={onReplay}>{replayLabel}</button>
          {extra}
          {onNextLevel && level < 5 && (
            <button type="button" className="button button-blue" onClick={onNextLevel}>
              Thử L{level + 1} · {LEVEL_INFO[(level + 1) as GameLevel].name}
            </button>
          )}
          <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
        </div>
      </div>
    </section>
  );
}
