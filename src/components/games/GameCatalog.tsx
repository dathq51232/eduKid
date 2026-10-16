'use client';

import { useState } from 'react';
import Link from 'next/link';
import GameCard from './GameCard';
import MiloMascot from '@/components/mascot/MiloMascot';
import { FILTERS, GRADES, LEVEL_NOTE, SUGGESTED_LEVEL, filterGames, type GameFilter, type Grade } from '@/lib/games/catalog';

type Props = { initialGrade: Grade | null; initialFilter: GameFilter };

function syncUrl(filter: GameFilter, grade: Grade | null) {
  try {
    const url = new URL(window.location.href);
    if (filter === 'all') url.searchParams.delete('loai');
    else url.searchParams.set('loai', filter);
    if (grade) url.searchParams.set('lop', String(grade));
    else url.searchParams.delete('lop');
    window.history.replaceState(window.history.state, '', url);
  } catch {
    // Không ảnh hưởng tới việc lọc
  }
}

export default function GameCatalog({ initialGrade, initialFilter }: Props) {
  const [filter, setFilter] = useState<GameFilter>(initialFilter);
  const [grade, setGrade] = useState<Grade | null>(initialGrade);
  const games = filterGames(filter, grade);
  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? '';

  const pickFilter = (f: GameFilter) => {
    setFilter(f);
    syncUrl(f, grade);
  };
  const pickGrade = (g: Grade | null) => {
    setGrade(g);
    syncUrl(filter, g);
  };

  return (
    <>
      <div className="game-toolbar">
        <div className="game-filters" role="group" aria-label="Lọc theo kỹ năng">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="game-filter"
              aria-pressed={filter === f.id}
              onClick={() => pickFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="game-grade">
          <span>Em học lớp</span>
          <select value={grade ?? ''} onChange={(e) => pickGrade(e.target.value ? (Number(e.target.value) as Grade) : null)}>
            <option value="">Chọn lớp</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Lớp {g}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="game-grade-note">
        {grade
          ? `Với lớp ${grade}, Milo gợi ý bắt đầu từ cấp độ L${SUGGESTED_LEVEL[grade]}. Thấy dễ quá hay khó quá, em cứ đổi cấp độ trong game nhé.`
          : 'Chọn lớp để Milo gợi ý cấp độ bắt đầu. Lớp học và cấp độ game là hai thứ khác nhau.'}{' '}
        <span className="game-level-note">{LEVEL_NOTE}</span>
      </p>

      <p className="sr-only" aria-live="polite">
        {games.length ? `Đang hiện ${games.length} game ${filter === 'all' ? '' : `nhóm ${filterLabel}`}` : `Chưa có game nhóm ${filterLabel}`}
      </p>

      {games.length ? (
        <div className="game-grid">
          {games.map((g) => (
            <GameCard key={g.id} game={g} suggested={grade ? SUGGESTED_LEVEL[grade] : undefined} />
          ))}
        </div>
      ) : (
        <div className="game-empty">
          <MiloMascot mood="think" size={88} />
          <div>
            <h2>Game nhóm {filterLabel} đang được chuẩn bị</h2>
            <p>
              Milo chưa muốn đưa ra một game làm vội. Trong lúc chờ, em có thể chơi các game ở mục Tất cả
              {filter === 'language' || filter === 'math' ? ' hoặc luyện bài trong mục Học tập' : ''}.
            </p>
            <div className="game-empty-actions">
              <button type="button" className="button button-white" onClick={() => pickFilter('all')}>Xem tất cả game</button>
              {(filter === 'language' || filter === 'math') && (
                <Link href="/chon-bai" className="button button-blue">Đến mục Học tập</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
