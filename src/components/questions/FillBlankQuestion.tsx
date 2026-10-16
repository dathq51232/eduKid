'use client';

import type { AnswerValue, Question } from '@/lib/types';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
  onSubmit?: () => void;
};

export default function FillBlankQuestion({ answer, onAnswerChange, isSubmitted, isCorrect, onSubmit }: Props) {
  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';

  return (
    <div className="fill-wrap">
      <input
        className={`fill-input${state}`}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={60}
        aria-label="Nhập đáp án của em"
        placeholder="Đáp án"
        value={typeof answer === 'string' ? answer : ''}
        disabled={isSubmitted}
        onChange={(e) => onAnswerChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) onSubmit();
        }}
      />
    </div>
  );
}
