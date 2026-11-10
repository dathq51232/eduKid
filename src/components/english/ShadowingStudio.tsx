'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Headphones, Lightbulb, Mic, Music, Play, Square, Volume2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import { ReflexScorecard, VadMeter } from '@/components/english/ReflexWidgets';
import type { ReflexRound } from '@/components/english/useReflexRound';
import type { CommunicationQuestion } from '@/lib/english/communicationBank';
import { analyzeSentenceProsody, toProsodicSentence } from '@/lib/english/prosody';
import { playRhythmCountIn } from '@/lib/english/reflexEngine';

type Mode = 'listen' | 'shadow' | 'read';
const SHADOW_TAG = 'shadow';

export default function ShadowingStudio({ questions, initialNumber, reflex, onBeforePlay }: {
  questions: CommunicationQuestion[];
  initialNumber: number;
  /** Lượt đo phản xạ dùng chung của trang (một micro cho cả trang). */
  reflex: ReflexRound;
  /** Gọi trước khi phát để trang cha dừng âm thanh khác. */
  onBeforePlay?: () => void;
}) {
  const initialIndex = Math.max(0, questions.findIndex((question) => question.number === initialNumber));
  const [index, setIndex] = useState(initialIndex);
  const [mode, setMode] = useState<Mode>('shadow');
  const [showText, setShowText] = useState(false);
  const [rate, setRate] = useState(0.92);
  const [beatEnabled, setBeatEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeWord, setActiveWord] = useState(-1);
  const [practiced, setPracticed] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [audioFallback, setAudioFallback] = useState(false);

  const runId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Kết thúc ngay lời hứa đang chờ (audio/giọng trình duyệt) khi bị dừng — tránh treo. */
  const abortPlayRef = useRef<(() => void) | null>(null);
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const current = questions[index];
  const mine = reflex.tag === SHADOW_TAG;
  const listening = mine && reflex.listening;

  const preferredVoice =
    voices.find((voice) => /^en[-_]US$/i.test(voice.lang) && /natural|online/i.test(voice.name) && /aria|ana|jenny|ava|emma/i.test(voice.name)) ??
    voices.find((voice) => /^en[-_]US$/i.test(voice.lang) && /natural|online|google/i.test(voice.name)) ??
    voices.find((voice) => /^en[-_]US$/i.test(voice.lang) && /samantha|ava|allison/i.test(voice.name)) ??
    voices.find((voice) => /^en[-_]US$/i.test(voice.lang)) ??
    voices.find((voice) => /^en/i.test(voice.lang));

  const prosodyTokens = useMemo(() => (current ? analyzeSentenceProsody(current) : []), [current]);

  useEffect(() => {
    const runRef = runId;
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    try {
      const saved = localStorage.getItem(`educhain-shadow-v1:${questions[0]?.storyId ?? 'story'}`);
      if (saved) setPracticed(JSON.parse(saved) as number[]);
    } catch { /* Shadowing remains usable when browser storage is unavailable. */ }
    return () => {
      runRef.current++;
      stopMedia();
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, [questions]);

  function stopMedia() {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    window.speechSynthesis?.cancel();
    const abort = abortPlayRef.current;
    abortPlayRef.current = null;
    abort?.();
  }

  function stop() {
    runId.current++;
    stopMedia();
    reflex.cancel();
    setPlaying(false);
    setActiveWord(-1);
  }

  function playAudioUrl(url: string, wordsInQuestion: string[], run: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (audioRef.current === audio) audioRef.current = null;
        if (abortPlayRef.current === abort) abortPlayRef.current = null;
        resolve(ok);
      };
      const abort = () => done(false);
      abortPlayRef.current = abort;
      audio.ontimeupdate = () => {
        if (runId.current !== run) return;
        if (!audio.duration || !Number.isFinite(audio.duration) || !wordsInQuestion.length) return;
        // React bỏ qua giá trị trùng → chỉ vẽ lại khi sang từ mới.
        setActiveWord(Math.min(wordsInQuestion.length - 1, Math.floor((audio.currentTime / audio.duration) * wordsInQuestion.length)));
      };
      audio.onended = () => done(true);
      audio.onerror = () => done(false);
      audio.play().catch(() => done(false));
    });
  }

  function speakBrowserFallback(question: CommunicationQuestion, run: number) {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      const prosodicText = toProsodicSentence(question);
      const utterance = new SpeechSynthesisUtterance(prosodicText);
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (abortPlayRef.current === done) abortPlayRef.current = null;
        setActiveWord(-1);
        resolve();
      };
      abortPlayRef.current = done;
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.04;
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onboundary = (event) => {
        if (runId.current !== run) return;
        const before = prosodicText.slice(0, event.charIndex).trim();
        setActiveWord(before ? before.split(/\s+/).length : 0);
      };
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
    });
  }

  async function playQuestion(question: CommunicationQuestion, run: number) {
    const wordsInQuestion = question.sentence.match(/[^\s]+/g) ?? [];

    if (beatEnabled && mode === 'shadow') {
      await playRhythmCountIn(2, 112);
      if (runId.current !== run) return;
    }

    if (supabase) {
      const clipName = `${String(question.storyIndex).padStart(3, '0')}.mp3`;
      const { data } = supabase.storage.from('english-shadowing-audio').getPublicUrl(`${question.storyId}/${clipName}`);
      const ok = await playAudioUrl(data.publicUrl, wordsInQuestion, run);
      if (runId.current !== run) return;
      if (ok) { setAudioFallback(false); setActiveWord(-1); return; }
    }

    const prosodicText = toProsodicSentence(question);
    const ttsOk = await playAudioUrl(`/api/tts?lang=en&q=${encodeURIComponent(prosodicText)}`, wordsInQuestion, run);
    if (runId.current !== run) return;
    if (ttsOk) { setAudioFallback(false); setActiveWord(-1); return; }

    setAudioFallback(true);
    await speakBrowserFallback(question, run);
  }

  function markPracticed(number: number, storyId: string) {
    setPracticed((prev) => {
      if (prev.includes(number)) return prev;
      const next = [...prev, number];
      try { localStorage.setItem(`educhain-shadow-v1:${storyId}`, JSON.stringify(next)); } catch { /* Keep progress for this visit. */ }
      return next;
    });
  }

  /** Đo phản xạ: micro mở sẵn → (giọng mẫu / nhịp phách) → T0 → chờ em bật âm (T1). */
  function startReflexCapture(question: CommunicationQuestion, withModel: boolean) {
    onBeforePlay?.();
    stopMedia();
    const run = ++runId.current;
    setPlaying(false);
    void reflex.start({
      tag: SHADOW_TAG,
      expected: question.sentence,
      before: async () => {
        if (withModel) {
          setPlaying(true);
          await playQuestion(question, run);
          if (runId.current !== run) return false;
          setPlaying(false);
        } else if (beatEnabled) {
          await playRhythmCountIn(2, 112);
        }
        return runId.current === run;
      },
      onScored: (metrics) => { if (metrics.reflexScore >= 70) markPracticed(question.number, question.storyId); },
    });
  }

  async function playCurrent() {
    if (!current) return;
    if (mode === 'shadow') { startReflexCapture(current, true); return; }
    onBeforePlay?.();
    stop();
    const run = runId.current;
    setPlaying(true);
    await playQuestion(current, run);
    if (runId.current === run) setPlaying(false);
  }

  async function playStory() {
    if (!questions.length) return;
    onBeforePlay?.();
    stop();
    const run = runId.current;
    setPlaying(true);
    const start = index;
    const end = Math.min(start + 10, questions.length);
    for (let i = start; i < end; i++) {
      if (runId.current !== run) break;
      setIndex(i);
      await playQuestion(questions[i], run);
      if (i < end - 1 && runId.current === run) {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
      }
    }
    if (runId.current === run) setPlaying(false);
  }

  function chooseSentence(next: number) {
    stop();
    reflex.reset();
    setIndex((next + questions.length) % questions.length);
    setShowText(false);
  }

  if (!current) return null;

  const firstThreeWords = current.sentence.split(/\s+/).slice(0, 3).join(' ');

  return <div className="en-shadow">
    <header className="en-shadow-head">
      <div>
        <span className="en-kicker">STEP 4 · RHYTHM SHADOWING &amp; REFLEX ENGINE · ĐO PHẢN XẠ GIỌNG NÓI</span>
        <h3>{current.storyTitle}</h3>
        <p>{current.storyTitleVi}</p>
      </div>
      <span className="en-shadow-count"><Check size={16}/>{practiced.length}/{questions.length} câu đã luyện</span>
    </header>

    <div className="en-shadow-modes" role="tablist" aria-label="Chế độ luyện tập">
      <button type="button" role="tab" aria-selected={mode === 'listen'} className={mode === 'listen' ? 'is-active' : ''} onClick={() => { stop(); setMode('listen'); setShowText(false); }}><Headphones size={17}/> 1. Nghe khắc sâu</button>
      <button type="button" role="tab" aria-selected={mode === 'shadow'} className={mode === 'shadow' ? 'is-active' : ''} onClick={() => { stop(); setMode('shadow'); setShowText(false); }}><Zap size={17}/> 2. Shadowing &amp; Đo phản xạ</button>
      <button type="button" role="tab" aria-selected={mode === 'read'} className={mode === 'read' ? 'is-active' : ''} onClick={() => { stop(); setMode('read'); }}><BookOpen size={17}/> 3. Toàn mạch truyện</button>
    </div>

    <div className="en-shadow-controls">
      <button type="button" className="en-shadow-main" onClick={() => void playCurrent()}>
        <Play size={17}/> {mode === 'shadow' ? 'Nghe mẫu & Bật phản xạ nói (T0 → T1)' : 'Nghe câu này'}
      </button>
      <button
        type="button"
        className={`en-beat-toggle${beatEnabled ? ' is-on' : ''}`}
        onClick={() => setBeatEnabled((b) => !b)}
        title="Bật/tắt tiếng gõ nhịp phách (Clap-Clap) trước khi đọc"
      >
        <Music size={16}/> Nhịp phách Beat: {beatEnabled ? 'BẬT' : 'TẮT'}
      </button>
      <button type="button" onClick={() => void playStory()} disabled={playing}><Headphones size={17}/> {questions.length > 10 ? 'Nghe 10 câu liền' : 'Nghe cả mạch'}</button>
      {playing && <button type="button" onClick={stop}><Square size={15}/> Dừng</button>}
      <label>Tốc độ <select value={rate} onChange={(event) => setRate(Number(event.target.value))}><option value={0.8}>Chậm rõ · 0.8x</option><option value={0.92}>Chuẩn tiểu học · 0.92x</option><option value={1}>Tự nhiên · 1.0x</option></select></label>
    </div>
    <p className="en-shadow-voice">
      Giọng mẫu: <strong>EduChain Neural US (en-US)</strong> · Đo độ trễ bật âm <strong>ΔT = T1 − T0 (ms)</strong> qua Web Audio VAD
    </p>

    {mode !== 'read' && <article className={`en-shadow-current${showText ? ' has-text' : ''}`}>
      <span className="en-shadow-number">Câu {current.storyIndex} · {current.storySize}</span>
      <SentenceIllustration
        action={current.action}
        reason={current.reason}
        sentence={current.sentence}
        storyId={current.storyId}
        topicId={current.topicId}
        questionNumber={current.number}
        variant="compact"
      />
      {mode === 'listen' && !showText && !playing && activeWord < 0 ? <p className="en-shadow-hidden">Nghe câu tiếng Anh, nhìn tranh minh họa tình huống và để ý chỗ nhấn giọng, sau đó mở văn bản để đối chiếu.</p> : <>
        <p className="en-shadow-english" aria-label={current.sentence}>
          {prosodyTokens.map((tok) => (
            <span key={`${tok.wordIndex}-${tok.word}`} className="en-word-wrap">
              <span
                className={`en-word${tok.stressed ? ' is-stressed' : ' is-weak'}${tok.wordIndex === activeWord ? ' is-speaking' : ''}`}
              >
                {tok.word}
              </span>
              {tok.intonationAfter === 'rise' && (
                <span className="en-prosody-mark is-rise" title="Lên giọng nhẹ và nghỉ nửa nhịp" aria-hidden="true">↗ |</span>
              )}
              {tok.intonationAfter === 'fall' && (
                <span className="en-prosody-mark is-fall" title="Hạ giọng kết câu" aria-hidden="true">↘</span>
              )}
              {tok.wordIndex < prosodyTokens.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
        <div className="en-prosody-legend" aria-label="Chú giải ngữ điệu">
          <span><b className="en-legend-dot">• Từ đậm</b> Nhấn trọng âm</span>
          <span><b className="en-legend-rise">↗ |</b> Lên giọng nhẹ &amp; nghỉ nhịp</span>
          <span><b className="en-legend-fall">↘</b> Hạ giọng cuối câu</span>
        </div>
        {showText && <p className="en-shadow-vietnamese">{current.translation}</p>}
      </>}
      <button type="button" className="en-shadow-reveal" onClick={() => setShowText((value) => !value)}>{showText ? <><EyeOff size={16}/> Ẩn nghĩa tiếng Việt</> : <><Eye size={16}/> Hiện nghĩa tiếng Việt</>}</button>
      {mode === 'shadow' && <p className="en-shadow-prompt">Ngay khi giọng mẫu vừa dứt (T0), hãy bật tiếng đọc theo ngay lập tức (dưới 1.2 giây để đạt Lightning Reflex ⚡)!</p>}
    </article>}

    {mode === 'shadow' && (
      <section className={`en-shadow-echo${mine && reflex.busy ? ' is-ready' : ''}`} aria-live="polite">
        <Headphones size={20}/>
        <div className="en-vad-body">
          <b>
            {listening
              ? reflex.liveLatency !== null
                ? `⚡ Đã bắt được âm đầu tiên (T1 − T0 = ${reflex.liveLatency} ms)! Hãy nói hết câu…`
                : '🎙️ Micro đang lắng nghe (T0 đã bắt đầu)… Em hãy bật tiếng ngay!'
              : mine && reflex.status === 'preparing'
                ? playing ? '🔊 Nghe giọng mẫu… nói ngay khi giọng mẫu dứt!' : '⏳ Đang chuẩn bị micro…'
                : 'Bấm "Nghe mẫu & Bật phản xạ nói" hoặc bấm trực tiếp nút Micro bên phải'}
          </b>
          {listening && <VadMeter reflex={reflex} label="Âm lượng Micro (VAD):" />}
          {mine && reflex.hintVisible && (
            <div className="en-visual-hint" role="status">
              <Lightbulb size={16} />
              <span>
                <strong>Gợi ý bật âm nhanh (Visual Hint):</strong> Hãy bắt đầu bằng cụm <em>“{firstThreeWords}…”</em>!
              </span>
            </div>
          )}
        </div>
        {listening ? (
          <button type="button" className="en-vad-stop" onClick={reflex.finish} disabled={reflex.status === 'scoring'}>
            <Square size={15}/> Chấm điểm
          </button>
        ) : (
          <button type="button" onClick={() => startReflexCapture(current, false)} disabled={mine && reflex.busy}>
            <Mic size={17}/> Đo phản xạ nói
          </button>
        )}
      </section>
    )}

    {mode === 'shadow' && mine && reflex.metrics && <ReflexScorecard metrics={reflex.metrics} showExp={false} showHeard />}

    {mine && reflex.note && <p className="en-shadow-audio-note">{reflex.note}</p>}

    {mode === 'read' && <div className="en-shadow-story-list" aria-label="Văn bản câu chuyện">
      {questions.map((question, i) => <button type="button" key={question.number} className={i === index ? 'is-current' : ''} onClick={() => { chooseSentence(i); setMode('read'); }}>
        <span className="en-shadow-list-no">{question.storyIndex}</span>
        <span className="en-shadow-list-copy"><b>{question.sentence}</b><small>{question.translation}</small></span>
        <Play size={16} aria-hidden="true" />
      </button>)}
    </div>}

    <footer className="en-shadow-footer">
      <button type="button" onClick={() => chooseSentence(index - 1)} disabled={index === 0}><ChevronLeft size={18}/> Câu trước</button>
      <span>{index + 1} / {questions.length}</span>
      {mode === 'shadow' && <button type="button" className={current && practiced.includes(current.number) ? 'is-done' : ''} onClick={() => markPracticed(current.number, current.storyId)} disabled={practiced.includes(current.number)}><Check size={17}/> {practiced.includes(current.number) ? 'Đã luyện' : 'Đánh dấu hoàn thành'}</button>}
      {mode !== 'shadow' && <button type="button" className="en-shadow-next" onClick={() => chooseSentence(index + 1)}>Câu tiếp <ChevronRight size={18}/></button>}
      {mode === 'shadow' && index < questions.length - 1 && <button type="button" className="en-shadow-next" onClick={() => chooseSentence(index + 1)}>Câu tiếp <ChevronRight size={18}/></button>}
    </footer>
    {playing && <p className="en-shadow-status"><Volume2 size={16}/> Đang phát câu {index + 1}…</p>}
    {audioFallback && <p className="en-shadow-audio-note">Đang phát bằng giọng đọc dự phòng của trình duyệt.</p>}
  </div>;
}
