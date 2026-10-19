'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { GAME_MASCOT } from '@/lib/mascots';
import GameFinish from './GameFinish';
import LevelPicker, { rememberLevel } from './LevelPicker';
import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameLevel } from '@/lib/games/catalog';
import { DIRS, DIR_LABEL, SIZE_BY_LEVEL, generateMaze, hasWall, keyToDir, move, solveMaze, type Dir, type Maze, type Pos } from '@/lib/games/maze';

const CELL = 40;
const PAD = 4;
const DIR_ICON = { up: ArrowUp, right: ArrowRight, down: ArrowDown, left: ArrowLeft } as const;
const DIR_SPOKEN: Record<Dir, string> = { up: 'lên', right: 'sang phải', down: 'xuống', left: 'sang trái' };

const randomSeed = () => Math.floor(Math.random() * 2147483646) + 1;

function wallsPath(m: Maze) {
  let d = '';
  for (let y = 0; y < m.h; y++) {
    for (let x = 0; x < m.w; x++) {
      const x0 = PAD + x * CELL;
      const y0 = PAD + y * CELL;
      const p = { x, y };
      if (hasWall(m, p, 'up')) d += `M${x0} ${y0}H${x0 + CELL}`;
      if (hasWall(m, p, 'left')) d += `M${x0} ${y0}V${y0 + CELL}`;
      if (x === m.w - 1 && hasWall(m, p, 'right')) d += `M${x0 + CELL} ${y0}V${y0 + CELL}`;
      if (y === m.h - 1 && hasWall(m, p, 'down')) d += `M${x0} ${y0 + CELL}H${x0 + CELL}`;
    }
  }
  return d;
}

export default function MazeGame({ initialLevel }: { initialLevel: GameLevel }) {
  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [maze, setMaze] = useState<Maze | null>(null);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const [steps, setSteps] = useState(0);
  const [visited, setVisited] = useState<Set<string>>(() => new Set(['0,0']));
  const [note, setNote] = useState('Dẫn Milo tới ngôi sao ở góc dưới bên phải nhé!');

  // Tạo mê cung ở trình duyệt để mỗi lần chơi là một mê cung mới
  useEffect(() => {
    setMaze(generateMaze(SIZE_BY_LEVEL[initialLevel], randomSeed()));
  }, [initialLevel]);

  const done = !!maze && pos.x === maze.goal.x && pos.y === maze.goal.y;
  const shortest = useMemo(() => (maze ? solveMaze(maze).steps : null), [maze]);
  const walls = useMemo(() => (maze ? wallsPath(maze) : ''), [maze]);

  const reset = (m: Maze | null) => {
    setPos({ x: 0, y: 0 });
    setSteps(0);
    setVisited(new Set(['0,0']));
    setNote(m ? 'Dẫn Milo tới ngôi sao ở góc dưới bên phải nhé!' : '');
  };
  const replaySame = () => reset(maze);
  const newMaze = (lv: GameLevel = level) => {
    const m = generateMaze(SIZE_BY_LEVEL[lv], randomSeed());
    setLevel(lv);
    setMaze(m);
    reset(m);
  };
  const changeLevel = (lv: GameLevel) => {
    rememberLevel(lv);
    newMaze(lv);
  };

  const go = useCallback(
    (d: Dir) => {
      if (!maze || done) return;
      const n = move(maze, pos, d);
      if (!n) {
        setNote(`Ôi, phía ${DIR_SPOKEN[d]} có tường rồi. Thử hướng khác nhé!`);
        return;
      }
      setPos(n);
      setSteps((s) => s + 1);
      setVisited((v) => new Set(v).add(`${n.x},${n.y}`));
      const ways = DIRS.filter((x) => !hasWall(maze, n, x)).map((x) => DIR_SPOKEN[x]);
      setNote(`Milo ở hàng ${n.y + 1}, cột ${n.x + 1}. Có thể đi: ${ways.join(', ')}.`);
    },
    [maze, pos, done],
  );

  // Phím mũi tên và W A S D (không giành phím khi em đang ở ô chọn / nhập)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const d = keyToDir(e.key);
      if (!d) return;
      e.preventDefault();
      go(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const detail = (lv: GameLevel) => `mê cung ${SIZE_BY_LEVEL[lv]} × ${SIZE_BY_LEVEL[lv]} ô, không đếm ngược`;

  if (maze && done) {
    const best = shortest !== null && steps === shortest;
    return (
      <>
        <LevelPicker value={level} onChange={changeLevel} detail={detail} />
        <GameFinish
          mascot={GAME_MASCOT.maze}
          title="Milo đã đến đích!"
          message={
            best
              ? `Em dẫn Milo đi ${steps} bước — đúng đường ngắn nhất luôn. Giỏi quá!`
              : `Em dẫn Milo đi ${steps} bước. Đường ngắn nhất là ${shortest} bước — lần sau thử tìm xem nhé!`
          }
          stats={[
            { label: 'Số bước', value: String(steps) },
            { label: 'Mê cung', value: `${maze.w} × ${maze.h}` },
          ]}
          level={level}
          onReplay={replaySame}
          extra={<button type="button" className="button button-white" onClick={() => newMaze()}>Mê cung mới</button>}
          onNextLevel={() => changeLevel((level + 1) as GameLevel)}
          record={{ gameId: 'maze', score: 1, maxScore: 1, details: { steps, shortest: shortest ?? 0 } }}
        />
      </>
    );
  }

  const size = maze ? maze.w * CELL + PAD * 2 : 0;
  return (
    <>
      <LevelPicker value={level} onChange={changeLevel} detail={detail} />

      <section className="game-panel" aria-labelledby="maze-title">
        <div className="game-panel-top">
          <h2 id="maze-title" className="game-progress">Đưa Milo đến ngôi sao</h2>
          <p className="game-score">Số bước: <strong>{steps}</strong></p>
        </div>

        <p className="maze-help">Bấm các nút mũi tên, hoặc dùng phím mũi tên / W A S D.</p>

        {maze ? (
          <div className="maze-layout">
            <svg
              className="maze-board"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`Mê cung ${maze.w} × ${maze.h} ô. Milo ở hàng ${pos.y + 1}, cột ${pos.x + 1}. Đích ở hàng ${maze.goal.y + 1}, cột ${maze.goal.x + 1}.`}
            >
              <rect x={PAD} y={PAD} width={maze.w * CELL} height={maze.h * CELL} fill="#fff" />
              {[...visited].map((k) => {
                const [x, y] = k.split(',').map(Number);
                return <rect key={k} x={PAD + x * CELL + 4} y={PAD + y * CELL + 4} width={CELL - 8} height={CELL - 8} rx="6" fill="#fff3d1" />;
              })}
              <path
                d={`M${PAD + maze.goal.x * CELL + 20} ${PAD + maze.goal.y * CELL + 6}l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3-9.3-4.9-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z`}
                fill="#f5b82e"
                stroke="#1f2a44"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d={walls} stroke="#1f2a44" strokeWidth="4" strokeLinecap="round" fill="none" />
              <MiloMascot variant={GAME_MASCOT.maze} x={PAD + pos.x * CELL + 4} y={PAD + pos.y * CELL + 3} size={CELL - 8} />
            </svg>

            <div className="maze-pad" role="group" aria-label="Nút điều khiển">
              {DIRS.map((d) => {
                const Icon = DIR_ICON[d];
                return (
                  <button key={d} type="button" className={`maze-btn is-${d}`} onClick={() => go(d)} aria-label={`Đi ${DIR_SPOKEN[d]}`}>
                    <Icon aria-hidden="true" strokeWidth={3} />
                    <span>{DIR_LABEL[d]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="game-loading">Milo đang vẽ mê cung…</p>
        )}

        <p className="maze-note" aria-live="polite">{note}</p>
      </section>

      <div className="game-bar">
        <button type="button" className="button button-white" onClick={replaySame}>Chơi lại</button>
        <button type="button" className="button button-white" onClick={() => newMaze()}>Mê cung mới</button>
        <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
      </div>
    </>
  );
}
