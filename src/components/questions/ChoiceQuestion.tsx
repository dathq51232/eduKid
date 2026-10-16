'use client';

import Figure from '@/components/Figure';
import type { AnswerValue, Question } from '@/lib/types';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
};

export default function ChoiceQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const isPair = question.options.length === 2;

  return (
    <ul className={`choice-grid${isPair ? ' is-pair' : ''}`} role="group" aria-label="Các đáp án">
      {question.options.map((option) => {
        const selected = answer === option;
        // Sau khi kiểm tra chỉ tô màu đáp án em đã chọn (server không trả đáp án đúng về trình duyệt).
        const state = isSubmitted && selected ? (isCorrect ? ' is-right' : ' is-wrong') : '';
        return (
          <li key={option}>
            <button
              type="button"
              className={`choice${state}`}
              aria-pressed={selected}
              aria-label={question.optionFigures?.[option] ? `${option}: ${question.optionFigures[option].alt}` : undefined}
              disabled={isSubmitted}
              onClick={() => onAnswerChange(option)}
            >
              {question.optionFigures?.[option] ? (
                <span className="choice-figure">
                  <Figure figure={question.optionFigures[option]} compact />
                  <span className="choice-caption">{option}</span>
                </span>
              ) : (
                option
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
