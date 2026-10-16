'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import QuestionRenderer from '@/components/questions/QuestionRenderer';
import { answerKeyOf, learnerQuestionOf } from '@/lib/admin/questions';
import { gradeLocal, isAnswered } from '@/lib/grading';
import type { AnswerValue } from '@/lib/types';
import type { QuestionDraft } from '@/lib/admin/types';

// Xem câu hỏi đúng như học sinh thấy và thử trả lời (chấm tại chỗ, không lưu gì).
export default function QuestionPreview({ draft, onClose }: { draft: QuestionDraft; onClose: () => void }) {
  const question = useMemo(() => learnerQuestionOf(draft), [draft]);
  const [answer, setAnswer] = useState<AnswerValue>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const [round, setRound] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const check = () => setResult(gradeLocal(draft.type, answer, answerKeyOf(draft)));
  const reset = () => {
    setAnswer(null);
    setResult(null);
    setRound((r) => r + 1);
  };

  return (
    <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Xem thử câu hỏi" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal-box">
        <div className="adm-modal-head">
          <strong>Xem thử như học sinh</strong>
          <button ref={closeRef} type="button" className="adm-icon" aria-label="Đóng" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        <section className="question-card adm-preview-card">
          <h1 className="question-prompt">{question.prompt}</h1>
          <QuestionRenderer
            key={`${question.id}-${round}`}
            question={question}
            answer={answer}
            onAnswerChange={setAnswer}
            isSubmitted={result !== null}
            isCorrect={result === true}
            onSubmit={check}
          />
        </section>
        {result !== null && draft.solution.trim() && (
          <details className="adm-solution" open>
            <summary>Lời giải</summary>
            <p>{draft.solution.trim()}</p>
          </details>
        )}
        <div className={`adm-preview-foot${result === null ? '' : result ? ' is-right' : ' is-wrong'}`} aria-live="polite">
          {result === null ? (
            <>
              <span className="adm-muted">Thử trả lời để kiểm tra đáp án đã nhập.</span>
              <button type="button" className="adm-btn is-primary" disabled={!isAnswered(answer)} onClick={check}>Kiểm tra</button>
            </>
          ) : (
            <>
              <span className="adm-preview-result">
                {result ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
                {result ? 'Đúng' : 'Chưa đúng'}{draft.explanation.trim() ? ` — ${draft.explanation.trim()}` : ''}
              </span>
              <button type="button" className="adm-btn" onClick={reset}><RotateCcw size={16} aria-hidden="true" /> Thử lại</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
