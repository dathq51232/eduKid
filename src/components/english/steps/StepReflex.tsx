'use client';

import Image from 'next/image';
import { ArrowRight, Check, Zap } from 'lucide-react';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import { EXAMPLE_ART } from '@/components/english/lesson';
import type { StepProps } from '@/components/english/steps/types';

/** Bước 2 — Reflex Challenge: chọn mục đích đúng của hành động (có chế độ đếm ngược 3 giây). */
export default function StepReflex({ lesson, state, dispatch, goStep }: StepProps) {
  const { actionClause, reasonClause, answer, bankQuestion, topic, translation, options, answerIndex } = lesson;
  const { mode, challengeStarted, reviewed, seconds, choice } = state;
  const timing = mode === 'challenge' && challengeStarted;

  return (
    <div className="en-reflex">
      <div className="en-reflex-title">
        <div className="en-picture small"><Image className="en-picture-art" src={`/emoji/f3d/${EXAMPLE_ART[topic.id]}.webp`} width={52} height={52} alt=""/></div>
        <div>
          <span className="en-kicker">STEP 2 · REFLEX CHALLENGE</span>
          <h3>What is the purpose of this action?</h3>
          <p>{actionClause} · Hãy phản xạ mục đích của hành động.</p>
        </div>
        <span className={`en-timer${seconds === 0 ? ' is-soft' : ''}`}>{timing ? `${seconds}s` : '∞'}</span>
      </div>
      <SentenceIllustration
        action={actionClause}
        reason={reasonClause}
        sentence={answer}
        storyId={bankQuestion?.storyId}
        topicId={topic.id}
        questionNumber={bankQuestion?.number}
        variant="compact"
        hidePurpose={!reviewed}
      />
      {mode === 'challenge' && !challengeStarted && !reviewed ? (
        <div className="en-challenge-start">
          <Zap size={27}/>
          <b>Sẵn sàng thử phản xạ 3 giây?</b>
          <span>Trả lời nhanh để giữ chuỗi sao. Câu trả lời sai hoặc hết giờ sẽ được giải thích nhẹ nhàng.</span>
          <button type="button" onClick={() => dispatch({ type: 'startChallenge' })}>Bắt đầu thử thách <ArrowRight size={18}/></button>
        </div>
      ) : (
        <>
          <div className="en-options">
            {options.map((o, i) => (
              <button
                type="button"
                key={`${i}-${o}`}
                disabled={reviewed}
                className={`en-option${choice === i ? ' is-picked' : ''}${reviewed && i === answerIndex ? ' is-answer' : ''}${reviewed && choice === i && i !== answerIndex ? ' is-gentle' : ''}`}
                onClick={() => dispatch({ type: 'answer', index: i })}
              >
                <span>{String.fromCharCode(65 + i)}</span>{o}{reviewed && i === answerIndex && <Check size={20}/>}
              </button>
            ))}
          </div>
          {reviewed && (
            <div className="en-feedback">
              <span>{choice === answerIndex ? '🌟' : '💛'}</span>
              <div>
                <b>{choice === answerIndex ? 'Brilliant thinking! · Em suy luận giỏi lắm!' : 'Good try! Let’s connect the ideas. · Mình cùng nối ý nhé!'}</b>
                <p>{bankQuestion?.sentence ?? topic.example.why}<br/><small>{translation}</small></p>
              </div>
            </div>
          )}
          {!reviewed && mode === 'learn' && <p className="en-gentle-note">Không cần vội đâu — hãy nhìn tranh hành động và đoán mục đích nhé. · Take your time!</p>}
          {reviewed && <button type="button" className="en-next" onClick={() => goStep(2)}>Sang thay biến số &amp; ghép câu <ArrowRight size={18}/></button>}
        </>
      )}
    </div>
  );
}
