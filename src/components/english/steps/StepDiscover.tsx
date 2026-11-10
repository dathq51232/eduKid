'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lightbulb, Volume2 } from 'lucide-react';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import { analyzeSentenceProsody } from '@/lib/english/prosody';
import type { StepProps } from '@/components/english/steps/types';

/** Bước 1 — Sound-Image Imprint: nhìn tranh, nghe nhịp câu, mặc định ẩn nghĩa tiếng Việt. */
export default function StepDiscover({ lesson, speaking, toggleSample, goStep }: StepProps) {
  const [showVi, setShowVi] = useState(false);
  const { actionClause, reasonClause, answer, bankQuestion, topic, translation } = lesson;
  const prosodyTokens = useMemo(
    () => analyzeSentenceProsody({ action: actionClause, reason: reasonClause, sentence: answer }),
    [actionClause, reasonClause, answer],
  );

  return (
    <div className="en-discover">
      <SentenceIllustration
        action={actionClause}
        reason={reasonClause}
        sentence={answer}
        storyId={bankQuestion?.storyId}
        topicId={topic.id}
        questionNumber={bankQuestion?.number}
        variant="full"
      />
      <div className="en-discover-copy">
        <span className="en-kicker">STEP 1 · SOUND-IMAGE IMPRINT · KHẮC SÂU HÌNH ẢNH &amp; ÂM THANH (KHÔNG DỊCH NHẨM)</span>
        <h3>What is happening? <small>Quan sát tranh 3D và lắng nghe nhịp câu</small></h3>
        <div className="en-prosody-box" aria-label="Câu mẫu kèm hướng dẫn nhấn trọng âm và ngữ điệu">
          <p className="en-prosody-sentence">
            {prosodyTokens.map((tok) => (
              <span key={`${tok.wordIndex}-${tok.word}`} className="en-word-wrap">
                <span className={`en-word${tok.stressed ? ' is-stressed' : ' is-weak'}`}>{tok.word}</span>
                {tok.intonationAfter === 'rise' && <span className="en-prosody-mark is-rise" title="Lên giọng nhẹ và nghỉ nửa nhịp" aria-hidden="true">↗ |</span>}
                {tok.intonationAfter === 'fall' && <span className="en-prosody-mark is-fall" title="Hạ giọng kết câu" aria-hidden="true">↘</span>}
                {tok.wordIndex < prosodyTokens.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
          <div className="en-prosody-legend">
            <span><b className="en-legend-dot">• Từ đậm</b> Nhấn trọng âm</span>
            <span><b className="en-legend-rise">↗ |</b> Lên giọng nhẹ &amp; nghỉ nhịp</span>
            <span><b className="en-legend-fall">↘</b> Hạ giọng cuối câu</span>
          </div>
        </div>
        <div className="en-imprint-row">
          <button type="button" className="en-shadow-reveal" onClick={() => setShowVi((v) => !v)}>
            {showVi ? <><EyeOff size={15}/> Ẩn nghĩa tiếng Việt (Chế độ Imprint)</> : <><Eye size={15}/> Hiện nghĩa tiếng Việt (khi cần)</>}
          </button>
          {showVi && <p className="en-translation">{translation}</p>}
        </div>
        <div className="en-reason">
          <Lightbulb size={20}/>
          <span><b>Pattern Structure · Khung cấu trúc</b><small>[Action: {actionClause}] ➔ [Purpose: {reasonClause}]</small></span>
        </div>
        <button type="button" className="en-sound" onClick={toggleSample}>
          <Volume2 size={19}/> {speaking ? 'Dừng nghe' : 'Nghe câu mẫu chuẩn ngữ điệu'} <span>{speaking ? 'Stop' : 'Listen'}</span>
        </button>
        <button type="button" className="en-next" onClick={() => goStep(1)}>Sang phản xạ ý <ArrowRight size={18}/></button>
      </div>
    </div>
  );
}
