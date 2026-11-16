'use client';

// 🧩 Mảnh ghép: hai vế của các cặp trộn chung trên một lưới. Chạm 2 mảnh hợp nhau để ghép (cùng màu);
// chạm mảnh đã ghép để gỡ. Không báo đúng/sai từng cặp trước khi bấm Kiểm tra.
// Dữ liệu: leftItems / options là hai vế; câu trả lời { vế 1: vế 2 } (chấm như ghép cặp).
import { useMemo, useState } from 'react';
import EmojiText from '@/components/EmojiText';
import IllustrationIcon from '@/components/IllustrationIcon';
import { illustrationIconSrc } from '@/lib/illustration-icons';
import { shuffle } from '@/lib/shuffle';
import type { AnswerValue, Question } from '@/lib/types';
import '@/styles/qgroup.css';
import '@/styles/question.css';

type Props = { question: Question; answer: AnswerValue; onAnswerChange: (value: AnswerValue) => void; isSubmitted: boolean; isCorrect: boolean };

const COLORS = ['#2f6fed', '#e2483d', '#1f9d6b', '#d99a12', '#8a4fd8', '#0f8fa8', '#c2457a', '#5b6b84'];
type Tile = { id: string; text: string; side: 'L' | 'R' };

export default function PairGridQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const pairs = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const lefts = useMemo(() => question.leftItems ?? [], [question.leftItems]);
  const tiles = useMemo<Tile[]>(() => shuffle([
    ...lefts.map((t) => ({ id: `L:${t}`, text: t, side: 'L' as const })),
    ...question.options.map((t) => ({ id: `R:${t}`, text: t, side: 'R' as const })),
  ], `${question.id}-grid`), [question.id, question.options, lefts]);
  const [first, setFirst] = useState<Tile | null>(null);

  const partner = (t: Tile): string | undefined => (t.side === 'L' ? pairs[t.text] : Object.keys(pairs).find((l) => pairs[l] === t.text));
  const pairIndex = (t: Tile) => { const l = t.side === 'L' ? t.text : partner(t); return l ? Object.keys(pairs).indexOf(l) : -1; };

  const tap = (t: Tile) => {
    if (isSubmitted) return;
    if (partner(t) !== undefined) { // gỡ cặp
      const next = { ...pairs };
      if (t.side === 'L') delete next[t.text]; else { const l = partner(t); if (l) delete next[l]; }
      onAnswerChange(Object.keys(next).length ? next : null);
      setFirst(null);
      return;
    }
    if (!first) return setFirst(t);
    if (first.id === t.id) return setFirst(null);
    if (first.side === t.side) return setFirst(t); // hai mảnh cùng một vế: đổi lựa chọn
    const [l, r] = first.side === 'L' ? [first.text, t.text] : [t.text, first.text];
    onAnswerChange({ ...pairs, [l]: r });
    setFirst(null);
  };

  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';
  const cols = tiles.length <= 6 ? 3 : 4;
  return (
    <>
      <p className="question-hint">Chạm 2 mảnh hợp nhau để ghép thành cặp. Đã ghép {Object.keys(pairs).length}/{lefts.length} cặp.</p>
      <ul className={`qp-grid${state}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {tiles.map((t) => {
          const k = pairIndex(t);
          const c = k >= 0 ? COLORS[k % COLORS.length] : undefined;
          return (
            <li key={t.id}>
              <button type="button" className={`qp-tile${first?.id === t.id ? ' is-active' : ''}${c ? ' is-paired' : ''}`}
                style={c ? { borderColor: c, boxShadow: `inset 0 -6px 0 ${c}` } : undefined}
                aria-pressed={first?.id === t.id} disabled={isSubmitted} onClick={() => tap(t)}>
                {illustrationIconSrc(t.text) ? <IllustrationIcon value={t.text} alt={t.text} className="qp-ill" /> : <EmojiText text={t.text} />}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
