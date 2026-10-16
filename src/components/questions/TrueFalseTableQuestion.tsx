'use client';

// Bảng Đúng/Sai: mỗi nhận định chọn Đ hoặc S. Đáp án gửi đi là mảng 'Đúng'/'Sai' theo thứ tự nhận định.

import type { AnswerValue, Question } from '@/lib/types';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
};

const CHOICES = [
  { value: 'Đúng', short: 'Đ' },
  { value: 'Sai', short: 'S' },
] as const;

export default function TrueFalseTableQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect }: Props) {
  const rows = question.statements ?? [];
  const values = Array.isArray(answer) ? answer : rows.map(() => '');
  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';

  const set = (i: number, v: string) => {
    const next = rows.map((_, k) => values[k] ?? '');
    next[i] = v;
    onAnswerChange(next);
  };

  return (
    <table className={`tf-table${state}`}>
      <thead>
        <tr>
          <th scope="col">Nhận định</th>
          <th scope="col" aria-label="Đúng">Đ</th>
          <th scope="col" aria-label="Sai">S</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((text, i) => (
          <tr key={i}>
            <td>{String.fromCharCode(97 + i)}) {text}</td>
            {CHOICES.map((c) => (
              <td key={c.value} className="tf-cell">
                <button
                  type="button"
                  className="tf-toggle"
                  aria-pressed={values[i] === c.value}
                  aria-label={`${String.fromCharCode(97 + i)}) ${c.value}`}
                  disabled={isSubmitted}
                  onClick={() => set(i, c.value)}
                >
                  {values[i] === c.value ? c.short : ''}
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
