'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import ShadowingStudio from '@/components/english/ShadowingStudio';
import PatternLab from '@/components/english/PatternLab';
import StepDiscover from '@/components/english/steps/StepDiscover';
import StepReflex from '@/components/english/steps/StepReflex';
import StepBuilder from '@/components/english/steps/StepBuilder';
import StepBoss from '@/components/english/steps/StepBoss';
import type { StepProps } from '@/components/english/steps/types';
import { useReflexRound } from '@/components/english/useReflexRound';
import { useSampleAudio } from '@/components/english/useSampleAudio';
import { STEPS, STEP_ART, TOPICS, TOPIC_ART, buildLesson, initialLesson, lessonReducer } from '@/components/english/lesson';
import { createClient } from '@/lib/supabase/client';
import { ENGLISH_COMMUNICATION_BANK, ENGLISH_COMMUNICATION_STORIES } from '@/lib/english/communicationBank';
import { toProsodicSentence } from '@/lib/english/prosody';

const PROGRESS_KEY = 'educhain-english-progress-v1';

export default function EnglishStudio() {
  const [state, dispatch] = useReducer(lessonReducer, initialLesson);
  const [done, setDone] = useState<string[]>([]);
  const audio = useSampleAudio();
  const reflex = useReflexRound();
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);

  const topic = TOPICS[state.active];
  const topicBank = useMemo(() => ENGLISH_COMMUNICATION_BANK[topic.id] ?? [], [topic.id]);
  const lesson = useMemo(() => buildLesson(topic, topicBank, state.questionIndex), [topic, topicBank, state.questionIndex]);
  const { bankQuestion } = lesson;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROGRESS_KEY);
      if (saved) setDone(JSON.parse(saved) as string[]);
    } catch { /* Trang vẫn dùng được khi trình duyệt chặn bộ nhớ. */ }
  }, []);

  // Đồng hồ thử thách 3 giây: một nhịp mỗi giây, reducer tự dừng khi hết giờ / đã trả lời.
  useEffect(() => {
    if (!state.challengeStarted || state.reviewed || state.seconds <= 0) return;
    const timer = window.setTimeout(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearTimeout(timer);
  }, [state.challengeStarted, state.reviewed, state.seconds]);

  const { stop: stopAudio, play } = audio;
  const { reset: resetReflex, cancel: cancelReflex } = reflex;

  /** Dừng mọi âm thanh + huỷ lượt đo và xoá kết quả (khi chuyển bước / chủ đề / câu). */
  const stopAll = useCallback(() => { stopAudio(); resetReflex(); }, [stopAudio, resetReflex]);

  /** Phát một câu bất kỳ — huỷ lượt đo đang chạy để micro không nghe nhầm giọng mẫu. */
  const speak = useCallback((text: string) => { cancelReflex(); void play({ text }); }, [cancelReflex, play]);

  const clipUrl = useMemo(() => {
    if (!bankQuestion || !supabase) return null;
    const clipName = `${String(bankQuestion.storyIndex).padStart(3, '0')}.mp3`;
    return supabase.storage.from('english-shadowing-audio').getPublicUrl(`${bankQuestion.storyId}/${clipName}`).data.publicUrl;
  }, [bankQuestion, supabase]);

  const toggleSample = useCallback(() => {
    if (audio.speaking) { stopAudio(); return; }
    cancelReflex();
    void play({
      clipUrl,
      text: toProsodicSentence({ action: lesson.actionClause, reason: lesson.reasonClause, sentence: lesson.answer }),
    });
  }, [audio.speaking, stopAudio, cancelReflex, play, clipUrl, lesson]);

  const goStep = useCallback((step: number) => { stopAll(); dispatch({ type: 'goStep', step }); }, [stopAll]);
  const selectTopic = (index: number) => { stopAll(); dispatch({ type: 'selectTopic', index }); };
  const nextQuestion = () => { stopAll(); dispatch({ type: 'nextQuestion', total: topicBank.length }); };

  function completeTopic() {
    const next = done.includes(topic.id) ? done : [...done, topic.id];
    setDone(next);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* Tiến độ vẫn giữ trong lượt truy cập này. */ }
    selectTopic(state.active + 1);
  }

  const stepProps: StepProps = { lesson, state, dispatch, speaking: audio.speaking, toggleSample, speak, goStep };

  return <div className="en-studio">
    <header className="en-hero">
      <div className="en-hero-copy">
        <Link href="/hoc-sinh" className="en-back"><ArrowLeft size={18}/> Trang của em</Link>
        <p className="en-kicker">ENGLISH REFLEX ENGINE · PATTERN CHUNKS</p>
        <h1>Think. Connect. Speak.</h1>
        <p>Học theo khối ngôn ngữ (Pattern Chunks) và đo phản xạ bật âm thực tế (ΔT = T1 − T0).</p>
        <p className="en-hero-vi">Khắc sâu hình ảnh · Nhịp phách · Đua tốc độ thay biến số · Đấu trùm phản xạ</p>
        <div className="en-hero-actions">
          <a className="en-primary" href="#en-pattern-lab">Khung Pattern Chunks <Zap size={18}/></a>
          <a className="en-secondary" href="#en-topics">10 Chủ đề giao tiếp <ArrowRight size={17}/></a>
          <Link className="en-secondary" href="/chon-bai?subject=tieng-anh">Bài tiếng Anh SGK <BookOpen size={17}/></Link>
        </div>
      </div>
      <div className="en-mascot"><span className="en-speech">Zero Translation!<small>Nhìn hình – bật tiếng Anh ngay!</small></span><MiloMascot size={142}/></div>
    </header>

    <PatternLab audio={audio} reflex={reflex} speak={speak} stopAll={stopAll} />

    <section className="en-journey" aria-label="Năm bước học tiếng Anh">
      <div className="en-journey-title">
        <div><span className="en-kicker">5-STEP REFLEX GAMEPLAY FLOW</span><h2>Quy trình Phản xạ 5 bước</h2></div>
        <span className="en-count"><Sparkles size={16}/>{done.length}/{TOPICS.length} chủ đề hoàn thành</span>
      </div>
      <ol>
        {STEPS.map((s, i) => (
          <li key={s.en} className={i === state.step ? 'is-current' : i < state.step ? 'is-past' : ''}>
            <button type="button" onClick={() => goStep(i)}>
              <Image className="en-step-icon" src={`/emoji/f3d/${STEP_ART[s.en]}.webp`} width={32} height={32} alt="" /> <b>{s.en}</b><small>{s.vi}</small>
            </button>
            {i < STEPS.length - 1 && <i aria-hidden="true"/>}
          </li>
        ))}
      </ol>
    </section>

    <section id="en-topics" className="en-topics">
      <div className="en-section-heading">
        <div><span className="en-kicker">CHOOSE YOUR ADVENTURE</span><h2>Learning Journey <span>· 10 Chủ đề Giao tiếp</span></h2></div>
        <p>Chạm vào một chủ đề để luyện theo 200 tình huống thực tế.</p>
      </div>
      <div className="en-topic-grid">
        {TOPICS.map((t, i) => (
          <button type="button" key={t.id} onClick={() => selectTopic(i)} className={`en-topic-card${i === state.active ? ' is-selected' : ''}${done.includes(t.id) ? ' is-done' : ''}`}>
            <Image className="en-topic-icon" src={`/emoji/f3d/${TOPIC_ART[t.id]}.webp`} width={36} height={36} alt=""/>
            <span className="en-topic-name">{t.name}<small>{t.vi}</small><small>{ENGLISH_COMMUNICATION_BANK[t.id]?.length ?? 0} câu giao tiếp</small></span>
            <span className="en-topic-state">
              {done.includes(t.id) ? <><CheckCircle2 size={17}/> Hoàn thành</> : <><ArrowRight size={17}/> {i === state.active ? 'Đang học' : 'Bắt đầu'}</>}
            </span>
          </button>
        ))}
      </div>
    </section>

    <section className="en-lesson" aria-live="polite">
      <header className="en-lesson-head">
        <div>
          <span className="en-kicker"><Image className="en-inline-icon" src={`/emoji/f3d/${TOPIC_ART[topic.id]}.webp`} width={22} height={22} alt=""/> TOPIC {String(state.active + 1).padStart(2, '0')} · A1</span>
          <h2>{topic.name}</h2>
          <p>{topic.vi}</p>
        </div>
        <div className="en-mode">
          <span>Chế độ</span>
          <button type="button" className={state.mode === 'learn' ? 'is-active' : ''} onClick={() => dispatch({ type: 'setMode', mode: 'learn' })}>Học tập</button>
          <button type="button" className={state.mode === 'challenge' ? 'is-active' : ''} onClick={() => dispatch({ type: 'setMode', mode: 'challenge' })}>Thử thách</button>
        </div>
      </header>
      <div className="en-progress-line"><i style={{ width: `${(state.step + 1) * (100 / STEPS.length)}%` }}/></div>
      {bankQuestion && (
        <div className="en-question-nav">
          <span><b>Ngân hàng câu hỏi · Câu {bankQuestion.number}</b><small>{state.questionIndex + 1}/{topicBank.length} câu trong chủ đề</small></span>
          <button type="button" onClick={nextQuestion}>Câu tiếp theo <ArrowRight size={17}/></button>
        </div>
      )}

      {state.step === 0 && <StepDiscover {...stepProps} />}
      {state.step === 1 && <StepReflex {...stepProps} />}
      {state.step === 2 && <StepBuilder {...stepProps} />}
      {state.step === 3 && bankQuestion && (
        <ShadowingStudio
          key={`${bankQuestion.storyId}-${bankQuestion.number}`}
          questions={ENGLISH_COMMUNICATION_STORIES[bankQuestion.storyId] ?? []}
          initialNumber={bankQuestion.number}
          reflex={reflex}
          onBeforePlay={stopAll}
        />
      )}
      {state.step === 4 && <StepBoss {...stepProps} reflex={reflex} audio={audio} onComplete={completeTopic} />}

      {state.step > 0 && <button type="button" className="en-step-back" onClick={() => goStep(state.step - 1)}>← Bước trước · Previous step</button>}
    </section>
    <footer className="en-footer"><MiloMascot size={58}/><span><b>Small steps, bright ideas!</b><small>Mỗi bước nhỏ, một ý tưởng hay.</small></span><a href="#en-topics">Chọn chủ đề khác ↑</a></footer>
  </div>;
}
