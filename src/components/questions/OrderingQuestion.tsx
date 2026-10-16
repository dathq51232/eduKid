'use client';

import { useEffect } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { shuffle } from '@/lib/shuffle';
import type { AnswerValue, Question } from '@/lib/types';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
};

// Sắp xếp bằng nút lên/xuống: dùng được trên màn hình cảm ứng nhỏ và bằng bàn phím.
export default function OrderingQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const items = Array.isArray(answer) ? answer : [];

  useEffect(() => {
    if (!Array.isArray(answer)) onAnswerChange(shuffle(question.options, question.id));
  }, [answer, onAnswerChange, question.id, question.options]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onAnswerChange(next);
  };

  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';

  return (
    <>
      <p className="question-hint">Dùng nút mũi tên để xếp lại cho đúng thứ tự.</p>
      <ol className={`order-list${state}`}>
        {items.map((item, index) => (
          <li key={item} className="order-item">
            <span className="order-no" aria-hidden="true">{index + 1}</span>
            <span className="order-text">{item}</span>
            <span className="order-actions">
              <button type="button" className="icon-button" disabled={isSubmitted || index === 0} onClick={() => move(index, index - 1)} aria-label={`Đưa "${item}" lên`}>
                <ArrowUp size={20} aria-hidden="true" />
              </button>
              <button type="button" className="icon-button" disabled={isSubmitted || index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={`Đưa "${item}" xuống`}>
                <ArrowDown size={20} aria-hidden="true" />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
