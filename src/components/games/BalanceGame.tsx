'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_MASCOT } from '@/lib/mascots';
import GameFinish from './GameFinish';
import LevelPicker, { rememberLevel } from './LevelPicker';
import { ShapePath } from './ShapeIcon';
import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameLevel } from '@/lib/games/catalog';
import { COLOR_HEX } from '@/lib/games/shapes';
import {
  BALANCE_ROUND, B_SHAPE_COLOR, B_SHAPE_NAME, MAX_BY_LEVEL, makeRound, qSide, tilt,
  type BItem, type BalanceQ, type Scale,
} from '@/lib/games/balance';

const INK = '#1f2a44';
const ITEM = 30;
const PER_ROW = 4;

const randomSeed = () => Math.floor(Math.random() * 2147483646) + 1;

function itemText(it: BItem, q?: number | null): string {
  if (it.kind === 'w') return `quả cân ${it.v}`;
  if (it.kind === 's') return B_SHAPE_NAME[it.s];
  return q ? `số ${q} em chọn` : 'dấu ?';
}
/** Đọc một đĩa: gộp các hình giống nhau ("2 hình tròn, quả cân 3") */
function panText(items: BItem[], q?: number | null): string {
  const parts: string[] = [];
  const counted = new Map<string, number>();
  for (const it of items) if (it.kind === 's') counted.set(it.s, (counted.get(it.s) ?? 0) + 1);
  for (const [s, k] of counted) parts.push(`${k} ${B_SHAPE_NAME[s as keyof typeof B_SHAPE_NAME]}`);
  for (const it of items) if (it.kind !== 's') parts.push(itemText(it, q));
  return parts.join(', ');
}
const scaleText = (sc: Scale, q?: number | null) => `đĩa trái: ${panText(sc.left, q)}; đĩa phải: ${panText(sc.right, q)}`;

function Item({ it, x, y, q }: { it: BItem; x: number; y: number; q?: number | null }) {
  if (it.kind === 's') {
    return (
      <g transform={`translate(${x} ${y}) scale(${ITEM / 40})`}>
        <ShapePath shape={it.s} fill={COLOR_HEX[B_SHAPE_COLOR[it.s]]} />
      </g>
    );
  }
  if (it.kind === 'w') {
    const label = String(it.v);
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d={`M8 6 H22 L28 ${ITEM} H2 Z`} fill="#c9d1de" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={ITEM / 2} cy="4" r="3.2" fill="none" stroke={INK} strokeWidth="2" />
        <text x={ITEM / 2} y={ITEM - 6} textAnchor="middle" fontSize={label.length > 2 ? 10 : 13} fontWeight="800" fill={INK} fontFamily="var(--font-display), sans-serif">{label}</text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width={ITEM} height={ITEM} rx="6" fill={q ? '#fff3d1' : '#fff'} stroke="#1f4fb8" strokeWidth="2.5" strokeDasharray={q ? undefined : '5 4'} />
      <text x={ITEM / 2} y={ITEM / 2 + 5} textAnchor="middle" fontSize={q && q > 99 ? 11 : 15} fontWeight="800" fill="#1f4fb8" fontFamily="var(--font-display), sans-serif">{q ?? '?'}</text>
    </g>
  );
}

/** Đĩa cân: các vật xếp thành hàng, tối đa 4 vật / hàng, xếp từ dưới lên */
function Pan({ items, q }: { items: BItem[]; q?: number | null }) {
  return (
    <g>
      <path d="M-62 0 H62 L52 12 H-52 Z" fill="#f5b82e" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {items.map((it, i) => {
        const row = Math.floor(i / PER_ROW);
        const inRow = Math.min(PER_ROW, items.length - row * PER_ROW);
        const col = i % PER_ROW;
        const x = -(inRow * (ITEM + 2)) / 2 + col * (ITEM + 2);
        const y = -(row + 1) * (ITEM + 2);
        return <Item key={i} it={it} x={x} y={y} q={q} />;
      })}
    </g>
  );
}

/** Chiếc cân: đòn cân nghiêng theo bên nặng hơn (-1 trái, 1 phải) */
function ScaleView({ sc, t, q, small, label }: { sc: Scale; t: -1 | 0 | 1; q?: number | null; small?: boolean; label: string }) {
  const rows = Math.max(1, Math.ceil(Math.max(sc.left.length, sc.right.length) / PER_ROW));
  const top = 34 + rows * (ITEM + 2);
  const deg = t * 9;
  const rad = (deg * Math.PI) / 180;
  const L = 92;
  const end = (s: -1 | 1) => ({ x: 160 + s * L * Math.cos(rad), y: top + s * L * Math.sin(rad) });
  const l = end(-1), r = end(1);
  const H = 44;
  return (
    <svg viewBox={`0 0 320 ${top + 92}`} className={`balance-svg${small ? ' is-small' : ''}`} role="img" aria-label={label}>
      <path d={`M160 ${top} L146 ${top + 78} H174 Z`} fill="#8b5cf6" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="112" y={top + 76} width="96" height="12" rx="6" fill="#8b5cf6" stroke={INK} strokeWidth="2.5" />
      <g className="balance-beam" style={{ transform: `rotate(${deg}deg)`, transformOrigin: `160px ${top}px` }}>
        <rect x={160 - L - 6} y={top - 5} width={2 * L + 12} height="10" rx="5" fill="#2f6fed" stroke={INK} strokeWidth="2.5" />
      </g>
      <circle cx="160" cy={top} r="7" fill="#f5b82e" stroke={INK} strokeWidth="2.5" />
      {[l, r].map((p, i) => (
        <g key={i}>
          <g className="balance-pan" style={{ transform: `translate(${p.x}px, ${p.y + H}px)` }}>
            <path d={`M0 ${-H} L-50 0 M0 ${-H} L50 0`} stroke={INK} strokeWidth="1.6" fill="none" />
            <Pan items={i === 0 ? sc.left : sc.right} q={q} />
          </g>
        </g>
      ))}
    </svg>
  );
}

export default function BalanceGame({ initialLevel }: { initialLevel: GameLevel }) {
  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [round, setRound] = useState<BalanceQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [tried, setTried] = useState<number[]>([]);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const start = useCallback((lv: GameLevel) => {
    setLevel(lv);
    setRound(makeRound(lv, randomSeed()));
    setIdx(0);
    setTried([]);
    setRight(0);
    setFinished(false);
  }, []);
  // Tạo đề ở trình duyệt để mỗi lượt là đề mới
  useEffect(() => start(initialLevel), [initialLevel, start]);

  const q = round[idx];
  const last = tried.length ? tried[tried.length - 1] : null;
  const solved = !!q && last === q.answer;

  useEffect(() => {
    if (!q) return;
    if (solved) nextRef.current?.focus();
    else if (moved.current && tried.length === 0) headRef.current?.focus();
  }, [q, solved, tried.length]);

  const choose = (v: number) => {
    if (!q || solved || tried.includes(v)) return;
    if (v === q.answer && tried.length === 0) setRight((n) => n + 1);
    setTried((t) => [...t, v]);
  };
  const next = () => {
    moved.current = true;
    setTried([]);
    if (idx + 1 >= round.length) setFinished(true);
    else setIdx(idx + 1);
  };
  const changeLevel = (lv: GameLevel) => {
    rememberLevel(lv);
    start(lv);
  };

  const detail = (lv: GameLevel) =>
    ({
      1: 'quả cân trong phạm vi 10, cộng trừ',
      2: 'phạm vi 20, 2–3 quả cân mỗi đĩa',
      3: 'một hình đã biết cân nặng, có phép nhân',
      4: 'suy luận 2 bước: hình vuông bằng mấy hình tròn',
      5: `suy luận 3 bước, có phép chia, phạm vi ${MAX_BY_LEVEL[5]}`,
    })[lv];

  if (finished) {
    return (
      <>
        <LevelPicker value={level} onChange={changeLevel} detail={detail} />
        <GameFinish
          mascot={GAME_MASCOT.balance}
          title="Cân nào cũng thăng bằng!"
          message={
            right === round.length
              ? `Em đúng cả ${round.length} câu ngay lần đầu. Tư duy toán học rất vững!`
              : `Em đúng ${right}/${round.length} câu ngay lần đầu, các câu còn lại em đã tự sửa đúng. Nhìn chiếc cân nghiêng là biết cần số lớn hơn hay nhỏ hơn đấy!`
          }
          stats={[{ label: 'Đúng ngay lần đầu', value: `${right}/${round.length}` }]}
          level={level}
          onReplay={() => start(level)}
          onNextLevel={() => changeLevel((level + 1) as GameLevel)}
          record={{ gameId: 'balance', score: right, maxScore: round.length, details: {} }}
        />
      </>
    );
  }

  const shown = last;
  const t = q ? (shown === null ? 0 : tilt(q.main, q.values, shown)) : 0;
  const side = q ? qSide(q.main) : 'left';
  const wrongMsg =
    q && last !== null && !solved
      ? t === 0
        ? ''
        : (t === -1) === (side === 'left')
          ? `Đĩa có dấu ? bị nặng hơn (lệch xuống) — cần số nhỏ hơn ${last}.`
          : `Đĩa có dấu ? còn nhẹ hơn (bị nâng lên) — cần số lớn hơn ${last}.`
      : '';

  return (
    <>
      <LevelPicker value={level} onChange={changeLevel} detail={detail} />

      <section className="game-panel" aria-labelledby="balance-q">
        {q ? (
          <>
            <div className="game-panel-top">
              <p className="game-progress">Câu {idx + 1}/{BALANCE_ROUND}</p>
              <p className="game-score">Đúng ngay lần đầu: <strong>{right}</strong></p>
            </div>
            <h2 id="balance-q" className="game-question" ref={headRef} tabIndex={-1}>Số nào đặt vào ô ? để cân thăng bằng?</h2>

            {q.facts.length > 0 && (
              <div className="balance-facts">
                <p>Gợi ý — các cân này đang thăng bằng:</p>
                <ul>
                  {q.facts.map((f, i) => (
                    <li key={i}>
                      <ScaleView sc={f} t={0} small label={`Cân gợi ý ${i + 1}, đang thăng bằng: ${scaleText(f)}`} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="balance-main">
              <ScaleView
                sc={q.main}
                t={t}
                q={shown}
                label={`Cân chính: ${scaleText(q.main, shown)}. ${t === 0 ? (shown ? 'Cân thăng bằng.' : '') : t === -1 ? 'Đĩa trái nặng hơn, cân lệch sang trái.' : 'Đĩa phải nặng hơn, cân lệch sang phải.'}`}
              />
            </div>

            <ul className={`pattern-options cols-${q.options.length === 3 ? 3 : 4}`} aria-label="Các lựa chọn">
              {q.options.map((o) => {
                const isWrong = tried.includes(o) && o !== q.answer;
                const isRight = solved && o === q.answer;
                return (
                  <li key={o}>
                    <button
                      type="button"
                      className={`pattern-option balance-option${isRight ? ' is-right' : ''}${isWrong ? ' is-wrong' : ''}`}
                      onClick={() => choose(o)}
                      aria-disabled={solved || isWrong}
                      aria-label={`${o}${isRight ? ', đúng' : isWrong ? ', chưa đúng' : ''}`}
                    >
                      {o}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="game-feedback-slot" aria-live="polite">
              {solved ? (
                <div className="game-feedback is-right">
                  <MiloMascot variant={GAME_MASCOT.balance} mood="cheer" size={64} />
                  <div>
                    <p className="game-feedback-title">{tried.length === 1 ? 'Chính xác!' : 'Đúng rồi, cân đã thăng bằng!'}</p>
                    <p>{q.explain}</p>
                    <button type="button" className="button button-blue" onClick={next} ref={nextRef}>
                      {idx + 1 >= round.length ? 'Xem kết quả' : 'Câu tiếp theo'}
                    </button>
                  </div>
                </div>
              ) : last !== null ? (
                <div className="game-feedback is-try">
                  <MiloMascot variant={GAME_MASCOT.balance} mood="think" size={64} />
                  <div>
                    <p className="game-feedback-title">Cân chưa thăng bằng</p>
                    <p>{wrongMsg}</p>
                    {tried.length >= 2 && <p>Mách nhỏ: {q.explain.split('. ')[0]}.</p>}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <p className="game-loading">Milo đang chuẩn bị chiếc cân…</p>
        )}
      </section>

      <div className="game-bar">
        <button type="button" className="button button-white" onClick={() => start(level)}>Chơi lượt mới</button>
        <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
      </div>
    </>
  );
}
