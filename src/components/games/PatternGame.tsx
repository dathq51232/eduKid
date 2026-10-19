'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { GAME_MASCOT } from '@/lib/mascots';
import GameFinish from './GameFinish';
import LevelPicker, { rememberLevel } from './LevelPicker';
import PatternItemView from './PatternItemView';
import MiloMascot from '@/components/mascot/MiloMascot';
import type { GameLevel } from '@/lib/games/catalog';
import { answerOf, explainPattern, itemKey, itemName, optionsOf, patternsForLevel, sequenceOf } from '@/lib/games/patterns';

const PRAISE_RIGHT = ['Chính xác! Thám tử tinh mắt quá.', 'Đúng rồi! Em nhìn ra quy luật rồi đó.', 'Tuyệt! Em suy luận rất chắc chắn.'];
const PRAISE_TRY = ['Chưa đúng lần này, không sao cả! Cùng xem lại nhé.', 'Gần lắm rồi! Thám tử giỏi cũng cần xem lại manh mối.', 'Mình học thêm được một quy luật mới đây!'];

const LEVEL_DETAIL: Record<GameLevel, string> = {
  1: 'nhóm 2 hình lặp lại, 3 lựa chọn',
  2: 'nhóm 3 hình lặp lại, 3 lựa chọn',
  3: 'nhóm 4 hình lặp lại, 4 lựa chọn',
  4: 'số hình tăng / giảm đều và mũi tên xoay, 4 lựa chọn',
  5: 'hình và màu đổi theo hai quy luật cùng lúc, 4 lựa chọn',
};

export default function PatternGame({ initialLevel }: { initialLevel: GameLevel }) {
  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const questions = patternsForLevel(level);
  const q = questions[index];

  // Chuyển câu: đưa con trỏ bàn phím về đầu câu mới; chọn xong: đưa tới nút "Câu tiếp theo"
  useEffect(() => {
    if (!moved.current) return;
    if (picked) nextRef.current?.focus();
    else questionRef.current?.focus();
  }, [picked, index]);

  const restart = (lv: GameLevel = level) => {
    moved.current = true;
    setLevel(lv);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };
  const changeLevel = (lv: GameLevel) => {
    rememberLevel(lv);
    restart(lv);
  };

  if (done) {
    const all = score === questions.length;
    return (
      <>
        <LevelPicker value={level} onChange={changeLevel} detail={(lv) => LEVEL_DETAIL[lv]} />
        <GameFinish
          mascot={GAME_MASCOT.pattern}
          title={all ? 'Thám tử xuất sắc!' : 'Em đã hoàn thành chuyến điều tra!'}
          message={
            all
              ? 'Em tìm ra mọi quy luật. Thử cấp độ tiếp theo để gặp những quy luật mới nhé!'
              : 'Mỗi câu chưa đúng là một manh mối mới. Chơi lại một lần nữa, em sẽ thấy quy luật rõ hơn đấy.'
          }
          stats={[
            { label: 'Quy luật tìm đúng', value: `${score}/${questions.length}` },
            { label: 'Cấp độ', value: `L${level}` },
          ]}
          level={level}
          onReplay={() => restart()}
          onNextLevel={() => changeLevel((level + 1) as GameLevel)}
          record={{ gameId: 'pattern', score, maxScore: questions.length }}
        />
      </>
    );
  }

  const seq = sequenceOf(q);
  const options = optionsOf(q);
  const answer = itemKey(answerOf(q));
  const right = picked === answer;
  const praise = (right ? PRAISE_RIGHT : PRAISE_TRY)[index % 3];
  const last = index === questions.length - 1;

  const choose = (key: string) => {
    if (picked) return;
    moved.current = true;
    setPicked(key);
    if (key === answer) setScore((s) => s + 1);
  };
  const next = () => {
    moved.current = true;
    if (last) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <>
      <LevelPicker value={level} onChange={changeLevel} detail={(lv) => LEVEL_DETAIL[lv]} />

      <section className="game-panel" aria-labelledby="pattern-q">
        <div className="game-panel-top">
          <p className="game-progress">Câu {index + 1}/{questions.length}</p>
          <p className="game-score">Đúng: {score}</p>
        </div>
        <h2 id="pattern-q" ref={questionRef} tabIndex={-1} className="game-question">Hình nào điền vào dấu hỏi?</h2>

        <ol className="pattern-row" aria-label={`Dãy hình: ${seq.map(itemName).join(', ')}, rồi đến dấu hỏi`}>
          {seq.map((it, i) => (
            <li key={i} className="pattern-cell">
              <PatternItemView item={it} />
            </li>
          ))}
          <li className="pattern-cell is-blank">
            {picked ? <PatternItemView item={answerOf(q)} /> : <span aria-hidden="true">?</span>}
          </li>
        </ol>

        <ul className={`pattern-options cols-${options.length}`} aria-label="Các lựa chọn">
          {options.map((opt) => {
            const key = itemKey(opt);
            const state = picked ? (key === answer ? 'is-right' : key === picked ? 'is-wrong' : '') : '';
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`pattern-option ${state}`.trim()}
                  onClick={() => choose(key)}
                  aria-disabled={picked ? true : undefined}
                  aria-pressed={picked === key}
                  aria-label={`${itemName(opt)}${picked && key === answer ? ' (đáp án đúng)' : ''}`}
                >
                  <PatternItemView item={opt} size={52} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="game-feedback-slot" aria-live="polite">
          {picked && (
            <div className={`game-feedback ${right ? 'is-right' : 'is-try'}`}>
              <MiloMascot variant={GAME_MASCOT.pattern} mood={right ? 'cheer' : 'oops'} size={72} />
              <div>
                <p className="game-feedback-title">{praise}</p>
                <p>{explainPattern(q)}</p>
                <button ref={nextRef} type="button" className="button button-blue" onClick={next}>
                  {last ? 'Xem kết quả' : 'Câu tiếp theo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="game-bar">
        <button type="button" className="button button-white" onClick={() => restart()}>Chơi lại</button>
        <Link href="/tro-choi" className="button button-white">Về danh mục</Link>
      </div>
    </>
  );
}
