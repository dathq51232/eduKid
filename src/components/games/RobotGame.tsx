'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Lightbulb, Minus, Play, Plus, RotateCcw, RotateCw, Trash2, Undo2 } from 'lucide-react';
import GameFinish from './GameFinish';
import LevelPicker, { rememberLevel } from './LevelPicker';
import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameLevel } from '@/lib/games/catalog';
import {
  MAX_COUNT, ROBOT_LEVELS, ROUND_SIZE, R_DIRS, R_DIR_LABEL, R_DIR_SPOKEN, cmdLabel, generatePuzzle, runProgram, solve,
  type Cmd, type Puzzle, type RDir, type RunResult,
} from '@/lib/games/robot';

const CELL = 56;
const PAD = 4;
const INK = '#1f2a44';
const DIR_ICON = { 0: ArrowUp, 1: ArrowRight, 2: ArrowDown, 3: ArrowLeft } as const;
const STAR = 'M0 -15l4.4 9 9.9 1.4-7.2 7 1.7 9.8L0 2.6l-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z';

const randomSeed = () => Math.floor(Math.random() * 2147483646) + 1;

function CmdIcon({ c }: { c: Cmd }) {
  if (c.kind === 'turn') return c.side === 'L' ? <RotateCcw aria-hidden="true" /> : <RotateCw aria-hidden="true" />;
  const Icon = c.kind === 'move' ? DIR_ICON[c.dir] : ArrowUp;
  return <Icon aria-hidden="true" strokeWidth={3} />;
}

/** Robot nhỏ: thân tròn, ăng-ten, mũi tên chỉ hướng đang nhìn */
function RobotSprite({ x, y, f, showFacing }: { x: number; y: number; f: RDir; showFacing: boolean }) {
  const cx = PAD + x * CELL + CELL / 2;
  const cy = PAD + y * CELL + CELL / 2;
  return (
    <g className="robot-sprite" style={{ transform: `translate(${cx}px, ${cy}px)` }}>
      {showFacing && (
        <g style={{ transform: `rotate(${f * 90}deg)` }} className="robot-facing">
          <path d="M-8 -19 L0 -27 L8 -19 Z" fill="#e2483d" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        </g>
      )}
      <line x1="0" y1="-17" x2="0" y2="-22" stroke={INK} strokeWidth="2.5" />
      <circle cx="0" cy="-23" r="3" fill="#f5b82e" stroke={INK} strokeWidth="2" />
      <rect x="-16" y="-17" width="32" height="30" rx="9" fill="#2f6fed" stroke={INK} strokeWidth="2.5" />
      <rect x="-11" y="-11" width="22" height="13" rx="5" fill="#e1ebff" stroke={INK} strokeWidth="2" />
      <circle cx="-5" cy="-4.5" r="2.6" fill={INK} />
      <circle cx="5" cy="-4.5" r="2.6" fill={INK} />
      <path d="M-6 7 h12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="-19" y="-6" width="3" height="10" rx="1.5" fill={INK} />
      <rect x="16" y="-6" width="3" height="10" rx="1.5" fill={INK} />
    </g>
  );
}

export default function RobotGame({ initialLevel }: { initialLevel: GameLevel }) {
  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [seeds, setSeeds] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [program, setProgram] = useState<Cmd[]>([]);
  const [count, setCount] = useState(2);
  const [run, setRun] = useState<RunResult | null>(null);
  const [frame, setFrame] = useState(0);
  const [runs, setRuns] = useState(0);
  const [hints, setHints] = useState(0);
  const [stats, setStats] = useState({ firstTry: 0, runs: 0, hints: 0 });
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const cfg = ROBOT_LEVELS[level];
  const puzzle: Puzzle | null = useMemo(() => (seeds.length ? generatePuzzle(level, seeds[idx]) : null), [level, seeds, idx]);
  const solution = useMemo(() => (puzzle ? solve(puzzle) ?? [] : []), [puzzle]);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const startRound = useCallback((lv: GameLevel) => {
    stop();
    setLevel(lv);
    setSeeds(Array.from({ length: ROUND_SIZE }, randomSeed));
    setIdx(0);
    setProgram([]);
    setRun(null);
    setFrame(0);
    setRuns(0);
    setHints(0);
    setStats({ firstTry: 0, runs: 0, hints: 0 });
    setFinished(false);
  }, []);
  // Tạo màn ở trình duyệt để mỗi lần chơi là màn mới
  useEffect(() => startRound(initialLevel), [initialLevel, startRound]);

  const animating = !!run && frame < run.frames.length - 1;
  const ended = !!run && !animating;
  const won = ended && run.result === 'win';

  useEffect(() => {
    if (ended) resultRef.current?.focus();
  }, [ended]);

  const edit = (fn: (p: Cmd[]) => Cmd[]) => {
    if (animating || won || !puzzle) return;
    stop();
    setRun(null);
    setFrame(0);
    setProgram((p) => fn(p));
  };
  const add = (c: Cmd) => edit((p) => (puzzle && p.length < puzzle.limit ? [...p, c] : p));

  const go = () => {
    if (!puzzle || animating || won || !program.length) return;
    const r = runProgram(puzzle, program);
    setRun(r);
    setFrame(0);
    setRuns((n) => n + 1);
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    stop();
    timer.current = setInterval(() => {
      setFrame((fr) => {
        if (fr >= r.frames.length - 1) {
          stop();
          return fr;
        }
        return fr + 1;
      });
    }, reduce ? 90 : 360);
  };

  const nextPuzzle = () => {
    const first = runs === 1 && hints === 0 ? 1 : 0;
    const s = { firstTry: stats.firstTry + first, runs: stats.runs + runs, hints: stats.hints + hints };
    setStats(s);
    stop();
    setRun(null);
    setFrame(0);
    setProgram([]);
    setRuns(0);
    setHints(0);
    if (idx + 1 >= ROUND_SIZE) setFinished(true);
    else setIdx(idx + 1);
  };

  const changeLevel = (lv: GameLevel) => {
    rememberLevel(lv);
    startRound(lv);
  };

  // Phím mũi tên thêm thẻ (kiểu mũi tên / có số bước), Backspace xoá thẻ cuối, Enter chạy
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey || !puzzle || finished) return;
      const map: Record<string, RDir> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
      if (e.key in map && cfg.mode !== 'relative') {
        e.preventDefault();
        add({ kind: 'move', dir: map[e.key], n: cfg.mode === 'counted' ? count : 1 });
      } else if (e.key === 'Backspace' && t?.tagName !== 'BUTTON') {
        e.preventDefault();
        edit((p) => p.slice(0, -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const detail = (lv: GameLevel) => {
    const c = ROBOT_LEVELS[lv];
    const kind = c.mode === 'arrows' ? 'thẻ mũi tên, mỗi thẻ đi 1 bước' : c.mode === 'counted' ? 'thẻ có số bước (đi 3 bước = 1 thẻ)' : 'robot có hướng nhìn: Tiến, Quay trái, Quay phải';
    return `sân ${c.size} × ${c.size} ô, ${c.stars} ngôi sao, ${kind}${c.slack === null ? '' : ', giới hạn số thẻ'}`;
  };

  if (finished) {
    return (
      <>
        <LevelPicker value={level} onChange={changeLevel} detail={detail} />
        <GameFinish
          title="Robot đã nhặt hết sao!"
          message={
            stats.firstTry === ROUND_SIZE
              ? `Cả ${ROUND_SIZE} màn em đều viết đúng chương trình ngay lần chạy đầu. Em là lập trình viên nhí rồi!`
              : `Em giải xong ${ROUND_SIZE} màn, ${stats.firstTry} màn đúng ngay lần chạy đầu. Lập trình viên thật cũng chạy thử rồi sửa lỗi nhiều lần đấy!`
          }
          stats={[
            { label: 'Đúng ngay lần đầu', value: `${stats.firstTry}/${ROUND_SIZE}` },
            { label: 'Số lần chạy', value: String(stats.runs) },
          ]}
          level={level}
          onReplay={() => startRound(level)}
          onNextLevel={() => changeLevel((level + 1) as GameLevel)}
          record={{ gameId: 'robot', score: stats.firstTry, maxScore: ROUND_SIZE, details: { runs: stats.runs, hints: stats.hints } }}
        />
      </>
    );
  }

  const fr = run ? run.frames[frame] : puzzle ? { x: puzzle.start.x, y: puzzle.start.y, f: (cfg.mode === 'relative' ? puzzle.facing : 1) as RDir, got: [] as number[] } : null;
  const activeCmd = run ? run.cmdAt[frame] : -1;
  const size = puzzle ? puzzle.size * CELL + PAD * 2 : 0;
  const failedCmd = run?.failAt ?? -1;
  const left = puzzle && fr ? puzzle.stars.length - fr.got.length : 0;
  const hintCmds = solution.slice(0, hints);

  return (
    <>
      <LevelPicker value={level} onChange={changeLevel} detail={detail} />

      <section className="game-panel" aria-labelledby="robot-title">
        <div className="game-panel-top">
          <h2 id="robot-title" className="game-progress">Màn {idx + 1}/{ROUND_SIZE}</h2>
          <p className="game-score">Đúng ngay lần đầu: <strong>{stats.firstTry}</strong></p>
        </div>
        <p className="maze-help">
          Xếp các thẻ lệnh thành chương trình rồi bấm <strong>Chạy</strong>. Robot làm đúng từng lệnh theo thứ tự và phải nhặt hết ngôi sao, không va vào đá, không ra ngoài sân.
          {cfg.mode === 'relative' && ' Mũi tên đỏ cho biết robot đang nhìn về phía nào; "Tiến" là đi thẳng theo hướng đó.'}
        </p>

        {puzzle && fr ? (
          <div className="robot-layout">
            <svg
              className="robot-board"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`Sân ${puzzle.size} × ${puzzle.size} ô. Robot ở hàng ${fr.y + 1}, cột ${fr.x + 1}${cfg.mode === 'relative' ? `, đang nhìn ${R_DIR_SPOKEN[fr.f]}` : ''}. Ngôi sao còn lại: ${puzzle.stars
                .filter((_, i) => !fr.got.includes(i))
                .map((s) => `hàng ${s.y + 1} cột ${s.x + 1}`)
                .join('; ')}. Tảng đá: ${puzzle.rocks.map((r) => `hàng ${r.y + 1} cột ${r.x + 1}`).join('; ')}.`}
            >
              {Array.from({ length: puzzle.size * puzzle.size }, (_, i) => {
                const x = i % puzzle.size, y = Math.floor(i / puzzle.size);
                return <rect key={i} x={PAD + x * CELL + 1} y={PAD + y * CELL + 1} width={CELL - 2} height={CELL - 2} rx="8" fill={(x + y) % 2 ? '#eef6ff' : '#f7fbff'} stroke="#c9d6ea" />;
              })}
              <rect x={PAD} y={PAD} width={puzzle.size * CELL} height={puzzle.size * CELL} rx="10" fill="none" stroke={INK} strokeWidth="3" />
              {puzzle.rocks.map((r) => (
                <path
                  key={`r${r.x},${r.y}`}
                  transform={`translate(${PAD + r.x * CELL + CELL / 2} ${PAD + r.y * CELL + CELL / 2})`}
                  d="M-17 9 C-20 0 -14 -12 -4 -14 C6 -17 16 -9 17 0 C19 8 13 14 2 14 C-8 15 -15 14 -17 9 Z"
                  fill="#9aa6b8"
                  stroke={INK}
                  strokeWidth="2.5"
                />
              ))}
              {puzzle.stars.map((s, i) => (
                <path
                  key={`s${i}`}
                  transform={`translate(${PAD + s.x * CELL + CELL / 2} ${PAD + s.y * CELL + CELL / 2 + 2})`}
                  d={STAR}
                  fill={fr.got.includes(i) ? '#dff3e8' : '#f5b82e'}
                  stroke={fr.got.includes(i) ? '#8fcfb0' : INK}
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              ))}
              <circle cx={PAD + puzzle.start.x * CELL + CELL / 2} cy={PAD + puzzle.start.y * CELL + CELL / 2} r="22" fill="none" stroke="#2f6fed" strokeWidth="2" strokeDasharray="4 4" />
              {run?.result === 'crash' && ended && run.blocked && (
                <g
                  transform={`translate(${PAD + Math.min(Math.max(run.blocked.x, -0.35), puzzle.size - 0.65) * CELL + CELL / 2} ${PAD + Math.min(Math.max(run.blocked.y, -0.35), puzzle.size - 0.65) * CELL + CELL / 2})`}
                >
                  <circle r="11" fill="#e2483d" stroke={INK} strokeWidth="2" />
                  <path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
              <RobotSprite x={fr.x} y={fr.y} f={fr.f} showFacing={cfg.mode === 'relative'} />
            </svg>

            <div className="robot-side">
              <div className="robot-palette" role="group" aria-label="Thẻ lệnh">
                {cfg.mode !== 'arrows' && (
                  <div className="robot-count" role="group" aria-label="Số bước">
                    <span>Số bước</span>
                    <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="Bớt một bước" disabled={count <= 1}><Minus aria-hidden="true" /></button>
                    <strong aria-live="polite">{count}</strong>
                    <button type="button" onClick={() => setCount((c) => Math.min(MAX_COUNT, c + 1))} aria-label="Thêm một bước" disabled={count >= MAX_COUNT}><Plus aria-hidden="true" /></button>
                  </div>
                )}
                {cfg.mode === 'relative' ? (
                  <div className="robot-keys is-rel">
                    <button type="button" className="robot-key" onClick={() => add({ kind: 'turn', side: 'L' })}><RotateCcw aria-hidden="true" /><span>Quay trái</span></button>
                    <button type="button" className="robot-key" onClick={() => add({ kind: 'fwd', n: count })}><ArrowUp aria-hidden="true" strokeWidth={3} /><span>Tiến {count}</span></button>
                    <button type="button" className="robot-key" onClick={() => add({ kind: 'turn', side: 'R' })}><RotateCw aria-hidden="true" /><span>Quay phải</span></button>
                  </div>
                ) : (
                  <div className="robot-keys">
                    {R_DIRS.map((d) => {
                      const Icon = DIR_ICON[d];
                      const n = cfg.mode === 'counted' ? count : 1;
                      return (
                        <button key={d} type="button" className={`robot-key is-d${d}`} onClick={() => add({ kind: 'move', dir: d, n })} aria-label={`Thêm thẻ: ${cmdLabel({ kind: 'move', dir: d, n })}`}>
                          <Icon aria-hidden="true" strokeWidth={3} />
                          <span>{R_DIR_LABEL[d]}{n > 1 ? ` ${n}` : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="robot-prog-head">
                <h3>Chương trình</h3>
                <span>{program.length}/{puzzle.limit} thẻ</span>
              </div>
              <ol className="robot-prog" aria-label="Chương trình của em">
                {program.map((c, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className={`robot-card${activeCmd === i ? ' is-active' : ''}${ended && run?.result === 'crash' && i === failedCmd ? ' is-bad' : ''}`}
                      onClick={() => edit((p) => p.filter((_, k) => k !== i))}
                      aria-label={`Lệnh ${i + 1}: ${cmdLabel(c)}. Bấm để bỏ thẻ này`}
                      disabled={animating || won}
                    >
                      <small>{i + 1}</small>
                      <CmdIcon c={c} />
                      <span>{c.kind === 'turn' ? (c.side === 'L' ? 'Trái' : 'Phải') : c.n > 1 ? `× ${c.n}` : ''}</span>
                    </button>
                  </li>
                ))}
                {Array.from({ length: Math.max(0, puzzle.limit - program.length) }, (_, i) => (
                  <li key={`e${i}`} className="robot-slot" aria-hidden="true" />
                ))}
              </ol>
              {!program.length && <p className="robot-empty">Bấm các thẻ lệnh ở trên để xếp chương trình.</p>}

              <div className="robot-actions">
                <button type="button" className="button button-yellow" onClick={go} disabled={!program.length || animating || won}>
                  <Play aria-hidden="true" className="icon" /> Chạy
                </button>
                <button type="button" className="button button-white" onClick={() => edit((p) => p.slice(0, -1))} disabled={!program.length || animating || won}>
                  <Undo2 aria-hidden="true" className="icon" /> Bỏ thẻ cuối
                </button>
                <button type="button" className="button button-white" onClick={() => edit(() => [])} disabled={!program.length || animating || won}>
                  <Trash2 aria-hidden="true" className="icon" /> Xoá hết
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="game-loading">Robot đang chuẩn bị sân chơi…</p>
        )}

        <div className="game-feedback-slot" aria-live="polite">
          {ended && run && puzzle && (
            <div className={`game-feedback ${won ? 'is-right' : 'is-try'}`} ref={resultRef} tabIndex={-1}>
              <MiloMascot mood={won ? 'cheer' : 'think'} size={64} />
              <div>
                {won ? (
                  <>
                    <p className="game-feedback-title">{runs === 1 && hints === 0 ? 'Đúng ngay lần đầu!' : 'Robot nhặt đủ sao rồi!'}</p>
                    <p>
                      Chương trình của em dùng {program.length} thẻ
                      {program.length <= puzzle.best ? ' — ngắn nhất có thể, quá giỏi!' : `. Cách ngắn nhất chỉ cần ${puzzle.best} thẻ, lần sau thử tìm xem nhé.`}
                    </p>
                    <button type="button" className="button button-blue" onClick={nextPuzzle}>{idx + 1 >= ROUND_SIZE ? 'Xem kết quả' : 'Màn tiếp theo'}</button>
                  </>
                ) : run.result === 'crash' ? (
                  <>
                    <p className="game-feedback-title">Ối, robot {run.blocked?.out ? 'sắp đi ra ngoài sân' : 'va vào tảng đá'}!</p>
                    <p>Lỗi ở lệnh số {failedCmd + 1}. Em sửa chương trình (bấm vào thẻ để bỏ) rồi chạy lại nhé.</p>
                  </>
                ) : (
                  <>
                    <p className="game-feedback-title">Robot chạy hết lệnh rồi</p>
                    <p>Nhưng vẫn còn {left} ngôi sao chưa nhặt. Em thêm lệnh rồi chạy lại nhé.</p>
                  </>
                )}
              </div>
            </div>
          )}
          {!ended && hints > 0 && (
            <p className="robot-hint">
              <Lightbulb aria-hidden="true" className="icon" /> Gợi ý — {hints === 1 ? 'lệnh đầu tiên' : `${hints} lệnh đầu`} của một cách giải ngắn nhất:{' '}
              <strong>{hintCmds.map(cmdLabel).join(' → ')}</strong>
            </p>
          )}
        </div>
      </section>

      <div className="game-bar">
        <button type="button" className="button button-white" onClick={() => setHints((h) => Math.min(solution.length, h + 1))} disabled={!puzzle || won || hints >= solution.length}>
          <Lightbulb aria-hidden="true" className="icon" /> Gợi ý
        </button>
        <button type="button" className="button button-white" onClick={() => startRound(level)}>Chơi lượt mới</button>
        <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
      </div>
    </>
  );
}
