'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Play, Trophy, Volume2 } from 'lucide-react';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import { ReflexScorecard, VadMeter } from '@/components/english/ReflexWidgets';
import { playRhythmCountIn } from '@/lib/english/reflexEngine';
import type { ReflexRound } from '@/components/english/useReflexRound';
import type { SampleAudio } from '@/components/english/useSampleAudio';
import type { StepProps } from '@/components/english/steps/types';

const BOSS_TAG = 'boss';
const BOSS_TARGET_MS = 1200;

/**
 * Bước 5 — THE REFLEX BOSS BATTLE:
 * Milo hỏi → nhịp phách → mốc T0 → đo ΔT tới lúc em bật âm (T1) + chấm nội dung.
 * Câu đáp án bị ẩn khi đấu để em phản xạ từ tranh, không đọc chữ; gợi ý hiện sau 2,5 s.
 */
export default function StepBoss({ lesson, speaking, toggleSample, reflex, audio, onComplete }: StepProps & {
  reflex: ReflexRound;
  audio: SampleAudio;
  onComplete: () => void;
}) {
  const [peek, setPeek] = useState(false);
  const { actionClause, reasonClause, answer, bankQuestion, topic, translation } = lesson;
  const mine = reflex.tag === BOSS_TAG;
  const question = `Why do we say: ${actionClause}?`;
  // Chỉ ẩn câu trong lúc đang đấu (đến khi hiện gợi ý hoặc em tự bấm xem).
  const revealed = peek || !(mine && reflex.busy) || reflex.hintVisible;

  function fight() {
    setPeek(false);
    void reflex.start({
      tag: BOSS_TAG,
      expected: answer,
      targetMs: BOSS_TARGET_MS,
      before: async (isActive) => {
        await audio.play({ text: question });
        if (!isActive()) return false;
        await playRhythmCountIn(2, 116);
      },
    });
  }

  return (
    <div className="en-apply">
      <SentenceIllustration
        action={actionClause}
        reason={reasonClause}
        sentence={answer}
        storyId={bankQuestion?.storyId}
        topicId={topic.id}
        questionNumber={bankQuestion?.number}
        variant="full"
      />
      <div className="en-boss-panel">
        <span className="en-kicker">STEP 5 · THE REFLEX BOSS BATTLE · ĐẤU TRÙM PHẢN XẠ THỰC TẾ</span>
        <h3><Trophy size={22} className="en-inline-icon"/> Thử thách Phản xạ với Cú Milo!</h3>
        <p className="en-boss-challenge">
          <strong>Tình huống bất ngờ:</strong> Cú Milo hỏi <em>“{question}”</em>. Nhìn tranh và nói to cả câu trả lời trước mốc <strong>{(BOSS_TARGET_MS / 1000).toFixed(1)} giây</strong>!
        </p>
        <div className="en-sentence">
          {revealed ? <b>{answer}</b> : <b aria-label="Câu trả lời đang ẩn">🙈 Câu trả lời đang ẩn — nhìn tranh và nói nhé!</b>}
          {mine && reflex.hintVisible && !reflex.metrics && (
            <span className="en-visual-hint">
              💡 Gợi ý phản xạ nhanh: Hãy bắt đầu ngay bằng <strong>“{actionClause}…”</strong>! ({translation})
            </span>
          )}
          {mine && reflex.busy && !reflex.hintVisible && (
            <button type="button" className="en-shadow-reveal" onClick={() => setPeek((v) => !v)}>
              {peek ? <><EyeOff size={15}/> Ẩn câu</> : <><Eye size={15}/> Xem câu</>}
            </button>
          )}
        </div>
        <div className="en-boss-actions">
          <button type="button" className="en-primary" disabled={mine && reflex.busy} onClick={fight}>
            <Play size={18}/> {mine && reflex.status === 'preparing' ? 'Milo đang hỏi…' : 'Bắt đầu Đấu Trùm (Nghe câu hỏi & Bật phản xạ)'}
          </button>
          <button type="button" className="en-sound" onClick={toggleSample}>
            <Volume2 size={18}/> {speaking ? 'Dừng nghe' : 'Nghe lại câu mẫu'}
          </button>
        </div>

        {mine && reflex.listening && <VadMeter reflex={reflex} label="🎙️ Micro đang đo độ trễ T1 − T0:" showStop />}
        {mine && reflex.metrics && <ReflexScorecard metrics={reflex.metrics} targetMs={BOSS_TARGET_MS} showHeard />}
        {mine && reflex.note && <p className="en-shadow-audio-note">{reflex.note}</p>}

        <button type="button" className="en-next" onClick={onComplete}>Hoàn thành chủ đề &amp; Nhận huy hiệu <CheckCircle2 size={19}/></button>
      </div>
    </div>
  );
}
