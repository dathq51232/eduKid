'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Mic, Volume2, Zap } from 'lucide-react';
import { resolveVisualIconSrc } from '@/lib/illustration-icons';
import { AGE_LEVEL_META, PATTERN_CHUNKS_BY_LEVEL, type AgeLevel } from '@/lib/english/patternChunks';
import { playRhythmCountIn } from '@/lib/english/reflexEngine';
import { ReflexScorecard, VadMeter } from '@/components/english/ReflexWidgets';
import type { ReflexRound } from '@/components/english/useReflexRound';
import type { SampleAudio } from '@/components/english/useSampleAudio';

const LAB_TAG = 'lab';
const LEVELS: AgeLevel[] = ['age4_6', 'age7_9', 'age10_12'];

/** Khung Pattern Chunks theo 3 độ tuổi + đua tốc độ thay biến số + đo phản xạ từng cụm. */
export default function PatternLab({ audio, reflex, speak, stopAll }: {
  audio: SampleAudio;
  reflex: ReflexRound;
  speak: (text: string) => void;
  stopAll: () => void;
}) {
  const [ageLevel, setAgeLevel] = useState<AgeLevel>('age7_9');
  const [chunkIdx, setChunkIdx] = useState(0);
  const [slotIdx, setSlotIdx] = useState(0);
  const [autoSpeedDrill, setAutoSpeedDrill] = useState(false);

  const levelChunks = PATTERN_CHUNKS_BY_LEVEL[ageLevel];
  const currentChunk = levelChunks[chunkIdx % levelChunks.length] ?? levelChunks[0];
  const currentSlot = currentChunk.slots[slotIdx % currentChunk.slots.length] ?? currentChunk.slots[0];
  const mine = reflex.tag === LAB_TAG;

  // Đua tốc độ: tự đổi biến số mỗi 2,5 giây.
  useEffect(() => {
    if (!autoSpeedDrill) return;
    const timer = window.setInterval(() => setSlotIdx((prev) => (prev + 1) % currentChunk.slots.length), 2500);
    return () => window.clearInterval(timer);
  }, [autoSpeedDrill, currentChunk.slots.length]);

  function measure() {
    setAutoSpeedDrill(false);
    void reflex.start({
      tag: LAB_TAG,
      expected: currentSlot.fullSentence,
      targetMs: currentChunk.targetLatencyMs,
      before: async (isActive) => {
        await audio.play({ text: currentSlot.bossPrompt });
        if (!isActive()) return false;
        await playRhythmCountIn(2, 116);
      },
    });
  }

  return (
    <section id="en-pattern-lab" className="en-pattern-lab" aria-label="Giáo trình Pattern Chunks theo độ tuổi">
      <div className="en-section-heading">
        <div>
          <span className="en-kicker">FUNCTIONAL PATTERN CHUNKS · KHÔNG HỌC NGỮ PHÁP CHẾT</span>
          <h2>Khung Phản xạ Pattern Chunks <span>· Phân bổ theo 3 độ tuổi</span></h2>
        </div>
        <span className="en-count"><Zap size={16}/> Mục tiêu: &lt; {(AGE_LEVEL_META[ageLevel].targetMs / 1000).toFixed(1)}s</span>
      </div>

      <div className="en-age-tabs" role="tablist" aria-label="Chọn cấp độ độ tuổi">
        {LEVELS.map((lvl) => {
          const meta = AGE_LEVEL_META[lvl];
          return (
            <button
              key={lvl}
              type="button"
              role="tab"
              aria-selected={ageLevel === lvl}
              className={`en-age-tab${ageLevel === lvl ? ' is-active' : ''}`}
              onClick={() => { stopAll(); setAgeLevel(lvl); setChunkIdx(0); setSlotIdx(0); setAutoSpeedDrill(false); }}
            >
              <span className="en-age-badge">{meta.badge}</span>
              <strong>{meta.title}</strong>
              <small>{meta.subtitle}</small>
            </button>
          );
        })}
      </div>

      <div className="en-chunk-pills" role="group" aria-label="Chọn mẫu Pattern Chunk">
        {levelChunks.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            className={`en-chunk-pill${idx === chunkIdx % levelChunks.length ? ' is-active' : ''}`}
            onClick={() => { stopAll(); setChunkIdx(idx); setSlotIdx(0); }}
          >
            <b>{c.pattern}</b>
            <small>{c.viPurpose}</small>
          </button>
        ))}
      </div>

      <div className="en-slot-stage">
        <div className="en-slot-visual">
          <span className="en-scene-tag">STIMULUS · {currentChunk.stimulusContext.toUpperCase()}</span>
          <Image src={resolveVisualIconSrc(currentSlot.icon)} width={92} height={92} alt={currentSlot.slotEn} className="en-slot-art" />
          <p className="en-slot-stimulus">“{currentSlot.bossPrompt}”</p>
        </div>

        <div className="en-slot-drill">
          <span className="en-kicker">HIGH-SPEED SUBSTITUTION · THAY BIẾN SỐ VÀO KHUNG CÂU</span>
          <div className="en-slot-frame" aria-live="polite">
            <span className="en-frame-fixed">{currentChunk.framePrefix}</span>
            <span className="en-frame-variable">{currentSlot.slotEn}</span>
            <span className="en-frame-fixed">{currentChunk.frameSuffix}</span>
          </div>

          <div className="en-slot-options" role="group" aria-label="Biến số thực hành">
            {currentChunk.slots.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`en-slot-chip${idx === slotIdx % currentChunk.slots.length ? ' is-active' : ''}`}
                onClick={() => { setSlotIdx(idx); speak(s.fullSentence); }}
              >
                <Image src={resolveVisualIconSrc(s.icon)} width={26} height={26} alt="" />
                <span>{s.slotEn}</span>
              </button>
            ))}
          </div>

          <div className="en-slot-actions">
            <button type="button" className="en-sound" onClick={() => speak(currentSlot.fullSentence)}>
              <Volume2 size={18}/> Nghe mẫu cụm này
            </button>
            <button type="button" className={`en-sound${autoSpeedDrill ? ' is-running' : ''}`} onClick={() => setAutoSpeedDrill((v) => !v)}>
              <Zap size={18}/> {autoSpeedDrill ? 'Dừng đổi tự động (2.5s)' : 'Đua tốc độ đổi hình (2.5s/câu)'}
            </button>
            <button type="button" className="en-primary" disabled={mine && reflex.busy} onClick={measure}>
              <Mic size={18}/> {mine && reflex.status === 'preparing' ? 'Đang chuẩn bị micro…' : <>Đo phản xạ câu này (&lt; {(currentChunk.targetLatencyMs / 1000).toFixed(1)}s)</>}
            </button>
          </div>

          {mine && reflex.listening && <VadMeter reflex={reflex} label="🎙️ Micro đang bắt mốc T1:" inline showStop />}
          {mine && reflex.metrics && <ReflexScorecard metrics={reflex.metrics} targetMs={currentChunk.targetLatencyMs} />}
          {mine && reflex.note && <p className="en-shadow-audio-note">{reflex.note}</p>}
        </div>
      </div>
    </section>
  );
}
