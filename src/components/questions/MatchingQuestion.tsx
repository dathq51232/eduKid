'use client';

import { useMemo, useState } from 'react';
import { shuffle } from '@/lib/shuffle';
import type { AnswerValue, Question } from '@/lib/types';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
};

const COLORS = ['#2f6fed', '#e2483d', '#1f9d6b', '#d99a12', '#8a4fd8', '#0f8fa8', '#c2457a', '#5b6b84'];

// Ghép cặp: chạm một ô bên trái, rồi chạm ô bên phải. Chạm lại ô trái đã ghép để bỏ ghép.
export default function MatchingQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const pairs = answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const lefts = question.leftItems ?? [];
  const rights = useMemo(() => shuffle(question.options, `${question.id}-r`), [question.id, question.options]);

  const colorOf = (left: string) => COLORS[lefts.indexOf(left) % COLORS.length];
  const leftOfRight = (right: string) => Object.keys(pairs).find((l) => pairs[l] === right);

  const pickLeft = (left: string) => {
    if (isSubmitted) return;
    if (pairs[left]) {
      const next = { ...pairs };
      delete next[left];
      onAnswerChange(Object.keys(next).length ? next : null);
      setActiveLeft(left);
      return;
    }
    setActiveLeft(activeLeft === left ? null : left);
  };

  const pickRight = (right: string) => {
    if (isSubmitted || !activeLeft) return;
    const next = { ...pairs };
    const owner = leftOfRight(right);
    if (owner) delete next[owner];
    next[activeLeft] = right;
    onAnswerChange(next);
    setActiveLeft(null);
  };

  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';

  return (
    <>
      <p className="question-hint">Chạm một ô bên trái, rồi chạm ô bên phải để ghép. Đã ghép {Object.keys(pairs).length}/{lefts.length}.</p>
      <div className={`match-board${state}`}>
        <ul className="match-col" aria-label="Cột trái">
          {lefts.map((left) => {
            const paired = Boolean(pairs[left]);
            return (
              <li key={left}>
                <button
                  type="button"
                  className={`match-cell${activeLeft === left ? ' is-active' : ''}${paired ? ' is-paired' : ''}`}
                  style={paired ? { borderColor: colorOf(left), boxShadow: `inset 8px 0 0 ${colorOf(left)}` } : undefined}
                  aria-pressed={activeLeft === left}
                  disabled={isSubmitted}
                  onClick={() => pickLeft(left)}
                >
                  {left}
                  {paired && <span className="match-pair">→ {pairs[left]}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="match-col" aria-label="Cột phải">
          {rights.map((right) => {
            const owner = leftOfRight(right);
            return (
              <li key={right}>
                <button
                  type="button"
                  className={`match-cell${owner ? ' is-paired' : ''}`}
                  style={owner ? { borderColor: colorOf(owner), boxShadow: `inset -8px 0 0 ${colorOf(owner)}` } : undefined}
                  disabled={isSubmitted || !activeLeft}
                  onClick={() => pickRight(right)}
                >
                  {right}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
