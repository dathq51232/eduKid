'use client';

import { useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles, Volume2, Zap } from 'lucide-react';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import type { StepProps } from '@/components/english/steps/types';

/** Bước 3 — Thay biến số tốc độ cao (Slot Drill) và Ghép từ thành câu (Word Bank). */
export default function StepBuilder({ lesson, state, dispatch, speaking, toggleSample, speak, goStep }: StepProps) {
  const [tab, setTab] = useState<'slot' | 'builder'>('slot');
  const { actionClause, reasonClause, answer, bankQuestion, topic, translation, options, answerIndex, words } = lesson;
  const { choice, placed } = state;
  const picked = choice ?? answerIndex;
  const complete = placed.length === words.length;
  const correct = complete && placed.map((i) => words[i]).join(' ') === answer.replace(/[.!?]+$/, '');

  return (
    <div className="en-builder">
      <div className="en-builder-copy">
        <span className="en-kicker">STEP 3 · HIGH-SPEED SUBSTITUTION &amp; SENTENCE BUILDER</span>
        <h3>Luyện khung câu &amp; Đua tốc độ thay biến số</h3>
        <div className="en-step3-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'slot'} className={tab === 'slot' ? 'is-active' : ''} onClick={() => setTab('slot')}>
            <Zap size={16}/> 1. Đua tốc độ Thay biến số (Slot Drill)
          </button>
          <button type="button" role="tab" aria-selected={tab === 'builder'} className={tab === 'builder' ? 'is-active' : ''} onClick={() => setTab('builder')}>
            <Sparkles size={16}/> 2. Ghép từ thành câu (Word Bank)
          </button>
        </div>
      </div>

      <SentenceIllustration
        action={actionClause}
        reason={reasonClause}
        sentence={answer}
        storyId={bankQuestion?.storyId}
        topicId={topic.id}
        questionNumber={bankQuestion?.number}
        variant="compact"
      />

      {tab === 'slot' ? (
        <div className="en-topic-slot-drill">
          <p className="en-slot-instruction">Giữ nguyên vế hành động <strong>“{actionClause}”</strong>, chạm nhanh các mục đích khác nhau để luyện phản xạ thay biến số:</p>
          <div className="en-slot-frame">
            <span className="en-frame-fixed">{actionClause} ↗ |</span>
            <span className="en-frame-variable">{options[picked] ?? reasonClause}</span>
          </div>
          <div className="en-options">
            {options.map((opt, idx) => (
              <button
                key={`${idx}-${opt}`}
                type="button"
                className={`en-option${picked === idx ? ' is-picked' : ''}${idx === answerIndex ? ' is-answer' : ''}`}
                onClick={() => { dispatch({ type: 'pickSlot', index: idx }); speak(`${actionClause.replace(/[.!?]+$/, '')} ${opt}`); }}
              >
                <span>{idx + 1}</span>
                <b>{actionClause}</b> → <em>{opt}</em>
                <Volume2 size={17} />
              </button>
            ))}
          </div>
          <div className="en-builder-actions">
            <button type="button" className="en-sound" onClick={toggleSample}><Volume2 size={18}/> {speaking ? 'Dừng nghe' : 'Nghe câu chuẩn'}</button>
            <button type="button" className="en-next" onClick={() => goStep(3)}>Sang Rhythm Shadowing <ArrowRight size={18}/></button>
          </div>
        </div>
      ) : (
        <>
          <div className="en-canvas" aria-label="Câu của em">
            {words.map((_, i) => <span className={placed[i] !== undefined ? 'has-word' : ''} key={i}>{placed[i] !== undefined ? words[placed[i]] : `Word ${i + 1}`}</span>)}
          </div>
          <div className="en-word-bank">
            <span>WORD BANK · NGÂN HÀNG TỪ</span>
            <div>{words.map((w, i) => <button type="button" key={`${w}-${i}`} disabled={placed.includes(i)} onClick={() => dispatch({ type: 'place', index: i })}>{w}</button>)}</div>
          </div>
          {complete && (
            <div className="en-feedback">
              <span>{correct ? '✨' : '💡'}</span>
              <div>
                <b>{correct ? 'Câu hoàn chỉnh! · Sentence complete!' : 'Thử sắp xếp lại thứ tự nhé. · Try the word order again.'}</b>
                <p>{answer}<br/><small>{translation}</small></p>
              </div>
            </div>
          )}
          <div className="en-builder-actions">
            <button type="button" className="en-sound" onClick={() => dispatch({ type: 'clearPlaced' })}><RotateCcw size={18}/> Làm lại</button>
            {complete && <button type="button" className="en-sound" onClick={toggleSample}><Volume2 size={18}/> {speaking ? 'Dừng nghe' : 'Nghe câu vừa ghép'}</button>}
            {complete && <button type="button" className="en-next" onClick={() => goStep(3)}>Sang Rhythm Shadowing <ArrowRight size={18}/></button>}
          </div>
        </>
      )}
    </div>
  );
}
