'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eraser, Lightbulb } from 'lucide-react';
import GameFinish from './GameFinish';
import LevelPicker, { rememberLevel } from './LevelPicker';
import ShapeIcon from './ShapeIcon';
import type { GameLevel } from '@/lib/games/catalog';
import { SHAPE_NAME, type Shape, type ShapeColor } from '@/lib/games/shapes';
import { SUDOKU_LEVELS, findConflict, findHint, generateSudoku, isSolved, type Grid, type Sudoku } from '@/lib/games/sudoku';

const SYMBOLS: { shape: Shape; color: ShapeColor }[] = [
  { shape: 'circle', color: 'red' },
  { shape: 'square', color: 'blue' },
  { shape: 'triangle', color: 'yellow' },
  { shape: 'star', color: 'purple' },
];
const WHERE = { row: 'Hàng', col: 'Cột', box: 'Vùng' } as const;

const randomSeed = () => Math.floor(Math.random() * 2147483646) + 1;

export default function SudokuGame({ initialLevel }: { initialLevel: GameLevel }) {
  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [game, setGame] = useState<Sudoku | null>(null);
  const [grid, setGrid] = useState<Grid>([]);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [msg, setMsg] = useState('');
  const [mark, setMark] = useState<{ r: number; c: number } | null>(null);

  const start = useCallback((lv: GameLevel) => {
    const g = generateSudoku(lv, randomSeed());
    setLevel(lv);
    setGame(g);
    setGrid(g.puzzle.map((row) => [...row]));
    setSel(null);
    setMistakes(0);
    setHints(0);
    setMark(null);
    setMsg('Chọn một ô trống, rồi chọn hình / số để điền.');
  }, []);
  // Tạo đề ở trình duyệt để mỗi lần chơi là một đề mới
  useEffect(() => start(initialLevel), [initialLevel, start]);

  const changeLevel = (lv: GameLevel) => {
    rememberLevel(lv);
    start(lv);
  };

  const symbols = game?.symbols ?? false;
  const nameOf = useCallback((v: number) => (symbols ? SHAPE_NAME[SYMBOLS[v - 1].shape] : String(v)), [symbols]);
  const show = (v: number, size: number) =>
    symbols ? <ShapeIcon shape={SYMBOLS[v - 1].shape} color={SYMBOLS[v - 1].color} size={size} /> : <span>{v}</span>;

  const done = !!game && grid.length > 0 && isSolved(game, grid);
  const blanks = useMemo(() => (game ? game.puzzle.flat().filter((v) => !v).length : 0), [game]);

  const put = useCallback(
    (v: number) => {
      if (!game || !sel || done) return;
      const { r, c } = sel;
      if (game.puzzle[r][c]) {
        setMsg('Ô này có sẵn từ đầu, em chọn ô trống nhé.');
        return;
      }
      if (grid[r][c] === v) return; // bấm lại đúng thứ đang có: không tính thêm lần sai
      const next = grid.map((row) => [...row]);
      next[r][c] = v;
      setGrid(next);
      setMark(null);
      if (v === 0) {
        setMsg(`Đã xoá ô hàng ${r + 1}, cột ${c + 1}.`);
        return;
      }
      if (v === game.solution[r][c]) {
        setMsg(isSolved(game, next) ? 'Hoàn thành!' : `Đúng rồi: hàng ${r + 1}, cột ${c + 1} là ${nameOf(v)}.`);
        return;
      }
      setMistakes((m) => m + 1);
      const cf = findConflict(next, game.br, game.bc, r, c, v);
      if (cf) {
        setMark({ r: cf.r, c: cf.c });
        setMsg(`Chưa đúng: ${WHERE[cf.where].toLowerCase()} này đã có ${nameOf(v)} rồi (ô hàng ${cf.r + 1}, cột ${cf.c + 1}). Mỗi ${cf.where === 'box' ? 'vùng' : cf.where === 'row' ? 'hàng' : 'cột'} chỉ có một ${nameOf(v)}.`);
      } else {
        setMsg(`Chưa đúng: ${nameOf(v)} chưa trùng ngay, nhưng sẽ làm các ô khác bị kẹt. Em thử xem hàng, cột và vùng của ô này còn thiếu gì nhé.`);
      }
    },
    [game, sel, grid, done, nameOf],
  );

  const hint = () => {
    if (!game || done) return;
    const h = findHint(game, grid);
    if (!h) return;
    setHints((n) => n + 1);
    setSel({ r: h.r, c: h.c });
    setMark(null);
    setMsg(
      h.reason === 'single'
        ? `Gợi ý: nhìn ô hàng ${h.r + 1}, cột ${h.c + 1}. Hàng, cột và vùng của nó đã có ${h.used.map(nameOf).join(', ')} — vậy chỉ còn thiếu một thứ. Là gì nhỉ?`
        : `Gợi ý: ô hàng ${h.r + 1}, cột ${h.c + 1} là ${nameOf(h.value)}.`,
    );
  };

  // Phím số 1..n điền, mũi tên di chuyển ô chọn, Backspace / Delete xoá
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!game || e.altKey || e.ctrlKey || e.metaKey) return;
      const n = game.n;
      const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (e.key in d) {
        e.preventDefault();
        const [dr, dc] = d[e.key];
        const cur = sel ?? { r: 0, c: 0 };
        const nr = Math.min(n - 1, Math.max(0, cur.r + dr)), nc = Math.min(n - 1, Math.max(0, cur.c + dc));
        setSel({ r: nr, c: nc });
        document.getElementById(`sdk-${nr}-${nc}`)?.focus();
      } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= n) {
        e.preventDefault();
        put(Number(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        put(0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game, sel, put]);

  const cfg = SUDOKU_LEVELS[level];
  const detail = (lv: GameLevel) => {
    const c = SUDOKU_LEVELS[lv];
    return `lưới ${c.n} × ${c.n}, vùng ${c.br} × ${c.bc}, ${c.blanks} ô trống, ${c.symbols ? 'điền hình' : `điền số 1–${c.n}`}`;
  };

  if (game && done) {
    const score = Math.max(0, blanks - mistakes);
    return (
      <>
        <LevelPicker value={level} onChange={changeLevel} detail={detail} />
        <GameFinish
          title="Em giải xong Sudoku!"
          message={
            mistakes === 0
              ? `Không sai ô nào${hints ? `, chỉ dùng ${hints} gợi ý` : ''}. Suy luận rất chắc chắn!`
              : `Em điền đủ ${blanks} ô, có ${mistakes} lần điền chưa đúng rồi tự sửa lại. Mỗi lần sai là một lần học cách loại trừ đấy!`
          }
          stats={[
            { label: 'Ô cần điền', value: String(blanks) },
            { label: 'Lần điền chưa đúng', value: String(mistakes) },
            { label: 'Gợi ý', value: String(hints) },
          ]}
          level={level}
          onReplay={() => start(level)}
          replayLabel="Đề mới"
          onNextLevel={() => changeLevel((level + 1) as GameLevel)}
          record={{ gameId: 'sudoku', score, maxScore: blanks, details: { mistakes, hints } }}
        />
      </>
    );
  }

  return (
    <>
      <LevelPicker value={level} onChange={changeLevel} detail={detail} />

      <section className="game-panel" aria-labelledby="sudoku-title">
        <div className="game-panel-top">
          <h2 id="sudoku-title" className="game-progress">Sudoku {cfg.n} × {cfg.n}</h2>
          <p className="game-score">Ô chưa xong: <strong>{grid.flat().filter((v, i) => !v || (game && v !== game.solution[Math.floor(i / game.n)][i % game.n])).length}</strong></p>
        </div>
        <p className="maze-help">
          Luật chơi: mỗi <strong>hàng</strong>, mỗi <strong>cột</strong> và mỗi <strong>vùng</strong> viền đậm ({cfg.br} × {cfg.bc} ô) đều có đủ {symbols ? '4 hình' : `các số từ 1 đến ${cfg.n}`}, không thứ nào lặp lại.
        </p>

        {game ? (
          <div className="sudoku-layout">
            <div
              className={`sudoku-grid n${game.n}`}
              role="grid"
              aria-label={`Lưới Sudoku ${game.n} × ${game.n}`}
              style={{ ['--n' as string]: game.n }}
            >
              {grid.map((row, r) => (
                <div role="row" key={r} className="sudoku-row">
                  {row.map((v, c) => {
                    const given = !!game.puzzle[r][c];
                    const wrong = !!v && !given && v !== game.solution[r][c];
                    const isSel = sel?.r === r && sel?.c === c;
                    const peer = !!sel && (sel.r === r || sel.c === c || (Math.floor(sel.r / game.br) === Math.floor(r / game.br) && Math.floor(sel.c / game.bc) === Math.floor(c / game.bc)));
                    const cls = [
                      'sudoku-cell',
                      given && 'is-given',
                      wrong && 'is-wrong',
                      isSel && 'is-sel',
                      !isSel && peer && 'is-peer',
                      mark?.r === r && mark?.c === c && 'is-mark',
                      (c + 1) % game.bc === 0 && c < game.n - 1 && 'box-r',
                      (r + 1) % game.br === 0 && r < game.n - 1 && 'box-b',
                    ].filter(Boolean).join(' ');
                    return (
                      <button
                        role="gridcell"
                        key={c}
                        id={`sdk-${r}-${c}`}
                        type="button"
                        className={cls}
                        onClick={() => setSel({ r, c })}
                        aria-selected={isSel}
                        aria-label={`Hàng ${r + 1}, cột ${c + 1}: ${v ? nameOf(v) : 'trống'}${given ? ' (có sẵn)' : wrong ? ' (chưa đúng)' : ''}`}
                      >
                        {v ? show(v, game.n === 4 ? 40 : 30) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="sudoku-pad" style={{ ['--keys' as string]: game.n === 4 ? 5 : 4 }} role="group" aria-label={sel ? `Điền vào ô hàng ${sel.r + 1}, cột ${sel.c + 1}` : 'Chọn ô trước khi điền'}>
              {Array.from({ length: game.n }, (_, i) => i + 1).map((v) => (
                <button key={v} type="button" className="sudoku-key" onClick={() => put(v)} disabled={!sel} aria-label={`Điền ${nameOf(v)}`}>
                  {show(v, 34)}
                </button>
              ))}
              <button type="button" className="sudoku-key is-erase" onClick={() => put(0)} disabled={!sel} aria-label="Xoá ô đang chọn">
                <Eraser aria-hidden="true" />
                <span>Xoá</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="game-loading">Milo đang tạo đề…</p>
        )}

        <p className="maze-note" aria-live="polite">{msg}</p>
      </section>

      <div className="game-bar">
        <button type="button" className="button button-white" onClick={hint} disabled={!game}>
          <Lightbulb aria-hidden="true" className="icon" /> Gợi ý
        </button>
        <button type="button" className="button button-white" onClick={() => start(level)}>Đề mới</button>
        <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
      </div>
    </>
  );
}
