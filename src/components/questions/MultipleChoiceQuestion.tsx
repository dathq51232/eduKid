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

export default function MultipleChoiceQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const selected = Array.isArray(answer) ? answer : [];

  const toggle = (option: string) => {
    const next = selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option];
    onAnswerChange(next.length ? next : null);
  };

  return (
    <>
      <p className="question-hint">Có thể có nhiều đáp án đúng. Em chọn tất cả nhé.</p>
      <ul className="choice-grid" role="group" aria-label="Các đáp án, chọn được nhiều">
        {question.options.map((option) => {
          const on = selected.includes(option);
          const state = isSubmitted && on ? (isCorrect ? ' is-right' : ' is-wrong') : '';
          return (
            <li key={option}>
              <button type="button" className={`choice${state}`} aria-pressed={on} aria-label={question.optionFigures?.[option] ? `${option}: ${question.optionFigures[option].alt}` : undefined} disabled={isSubmitted} onClick={() => toggle(option)}>
                <span className="choice-check" aria-hidden="true">{on ? '✓' : ''}</span>
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
    </>
  );
}
