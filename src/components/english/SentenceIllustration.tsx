'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Volume2 } from 'lucide-react';
import { buildSentenceVisual } from '@/lib/english/sentenceVisuals';
import { resolveVisualIconSrc } from '@/lib/illustration-icons';

type Props = {
  action: string;
  reason: string;
  sentence: string;
  storyId?: string;
  topicId?: string;
  questionNumber?: number;
  variant?: 'full' | 'compact';
  hidePurpose?: boolean; // Dùng ở Bước 2 (Thử thách phản xạ) trước khi học sinh chọn đáp án
};

export default function SentenceIllustration({
  action,
  reason,
  sentence,
  storyId,
  topicId,
  questionNumber,
  variant = 'full',
  hidePurpose = false,
}: Props) {
  const visual = useMemo(
    () => buildSentenceVisual({ action, reason, sentence, storyId, topicId }),
    [action, reason, sentence, storyId, topicId],
  );
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function speakVocab(word: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingWord(word);
    const audio = new Audio(`/api/tts?lang=en&q=${encodeURIComponent(word)}`);
    audioRef.current = audio;
    audio.onended = () => setSpeakingWord(null);
    audio.onerror = () => setSpeakingWord(null);
    audio.play().catch(() => setSpeakingWord(null));
  }

  const shortAction = action.replace(/[.!?,;]+$/, '').trim();
  const shortReason = reason.replace(/[.!?]+$/, '').trim();

  return (
    <div className={`en-scene-card is-${visual.theme} is-${variant}`} role="region" aria-label="Minh họa tình huống câu tiếng Anh">
      <div className="en-scene-head">
        <span className="en-scene-badge">{visual.themeLabel}</span>
        {questionNumber !== undefined && <span className="en-scene-num">Tình huống #{questionNumber}</span>}
      </div>

      <div className="en-scene-stage">
        <div className="en-scene-box is-action">
          <span className="en-scene-tag">ACTION · HÀNH ĐỘNG</span>
          <div className="en-scene-art-wrap">
            <Image
              className="en-scene-main-art"
              src={resolveVisualIconSrc(visual.actionMainIcon)}
              width={variant === 'compact' ? 60 : 82}
              height={variant === 'compact' ? 60 : 82}
              alt={shortAction}
            />
            {visual.actionSubIcon && (
              <Image
                className="en-scene-sub-art"
                src={resolveVisualIconSrc(visual.actionSubIcon)}
                width={variant === 'compact' ? 30 : 38}
                height={variant === 'compact' ? 30 : 38}
                alt=""
              />
            )}
          </div>
          <p className="en-scene-caption">{shortAction}</p>
        </div>

        <div className="en-scene-arrow" aria-hidden="true">
          <ArrowRight size={20} />
        </div>

        <div className={`en-scene-box is-purpose${hidePurpose ? ' is-mystery' : ''}`}>
          <span className="en-scene-tag">PURPOSE · MỤC ĐÍCH</span>
          <div className="en-scene-art-wrap">
            <Image
              className="en-scene-main-art"
              src={resolveVisualIconSrc(hidePurpose ? 'red-question-mark' : visual.purposeMainIcon)}
              width={variant === 'compact' ? 60 : 82}
              height={variant === 'compact' ? 60 : 82}
              alt={hidePurpose ? 'Mục đích là gì?' : shortReason}
            />
            {!hidePurpose && visual.purposeSubIcon && (
              <Image
                className="en-scene-sub-art"
                src={resolveVisualIconSrc(visual.purposeSubIcon)}
                width={variant === 'compact' ? 30 : 38}
                height={variant === 'compact' ? 30 : 38}
                alt=""
              />
            )}
          </div>
          <p className="en-scene-caption">{hidePurpose ? 'Mục đích là gì nhỉ? 🤔' : shortReason}</p>
        </div>
      </div>

      {visual.vocab.length > 0 && (
        <div className="en-scene-vocab" aria-label="Từ khóa hình ảnh trong câu">
          <span className="en-scene-vocab-title">Từ khóa minh họa (chạm để nghe):</span>
          <div className="en-scene-vocab-list">
            {visual.vocab.map((item) => (
              <button
                key={item.en}
                type="button"
                className={`en-vocab-chip${speakingWord === item.en ? ' is-speaking' : ''}`}
                onClick={() => speakVocab(item.en)}
                title={`Nghe phát âm: ${item.en}`}
              >
                <Image src={resolveVisualIconSrc(item.icon)} width={26} height={26} alt="" />
                <span>
                  <b>{item.en}</b>
                  <small>{item.vi}</small>
                </span>
                <Volume2 size={13} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
