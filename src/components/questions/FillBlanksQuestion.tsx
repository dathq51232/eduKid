'use client';

// Điền nhiều ô trong câu, ví dụ: "Có {} hình tròn." — "{}" là ô trống. Đáp án gửi đi là mảng theo thứ tự các ô.

import { useMemo } from 'react';
import type { AnswerValue, Question } from '@/lib/types';

type Props = {
  question: Question;
  answer: AnswerValue;
  onAnswerChange: (value: AnswerValue) => void;
  isSubmitted: boolean;
  isCorrect: boolean;
  onSubmit?: () => void;
};

export default function FillBlanksQuestion({ question, answer, onAnswerChange, isSubmitted, isCorrect, onSubmit }: Props) {
  const lines = useMemo(() => (question.blanks ?? []).map((l) => l.split('{}')), [question.blanks]);
  const total = lines.reduce((s, parts) => s + parts.length - 1, 0);
  const values = Array.isArray(answer) ? answer : Array.from({ length: total }, () => '');
  const state = isSubmitted ? (isCorrect ? ' is-right' : ' is-wrong') : '';

  const set = (i: number, v: string) => {
    const next = Array.from({ length: total }, (_, k) => values[k] ?? '');
    // ô điền số: tối đa 9 chữ số phần nguyên (lớp 4: lớp triệu); lớp 5 có số thập phân — gõ dấu phẩy (dấu chấm tự đổi thành phẩy)
    const [int = '', ...dec] = v.replace(/\./g, ',').replace(/[^0-9,]/g, '').split(',');
    next[i] = int.slice(0, 9) + (dec.length ? ',' + dec.join('').slice(0, 4) : '');
    onAnswerChange(next.every((x) => x === '') ? null : next);
  };

  let idx = 0;
  return (
    <div className="blanks-wrap">
      {lines.map((parts, li) => (
        <p key={li} className="blanks-line">
          {parts.map((text, pi) => {
            const isLast = pi === parts.length - 1;
            const myIndex = isLast ? -1 : idx++;
            return (
              <span key={pi}>
                {text}
                {!isLast && (
                  <input
                    className={`blank-input${state}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    maxLength={14}
                    style={(values[myIndex] ?? '').length > 2 ? { width: `${30 + 18 * (values[myIndex] ?? '').length}px` } : undefined}
                    aria-label={`Ô trống thứ ${myIndex + 1}`}
                    value={values[myIndex] ?? ''}
                    disabled={isSubmitted}
                    onChange={(e) => set(myIndex, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onSubmit) onSubmit();
                    }}
                  />
                )}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
