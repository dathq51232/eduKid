'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Headphones, Lightbulb, Mic, Music, Play, Square, Volume2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import type { CommunicationQuestion } from '@/lib/english/communicationBank';
import { analyzeSentenceProsody, toProsodicSentence } from '@/lib/english/prosody';
import {
  REFLEX_TIER_META,
  evaluateReflexMetrics,
  playRhythmCountIn,
  startVadMonitor,
  type ReflexMetrics,
  type VadSession,
} from '@/lib/english/reflexEngine';

type Mode = 'listen' | 'shadow' | 'read';
type RecognitionResultLike = { transcript: string };
type RecognitionEventLike = Event & { results: ArrayLike<ArrayLike<RecognitionResultLike>> };
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => RecognitionLike;
  webkitSpeechRecognition?: new () => RecognitionLike;
};

export default function ShadowingStudio({ questions, initialNumber }: { questions: CommunicationQuestion[]; initialNumber: number }) {
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
  const [echoSeconds, setEchoSeconds] = useState(0);
  const [echoReady, setEchoReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [liveLatencyMs, setLiveLatencyMs] = useState<number | null>(null);
  const [showVisualHint, setShowVisualHint] = useState(false);
  const [recognitionNote, setRecognitionNote] = useState('');
  const [reflexMetrics, setReflexMetrics] = useState<ReflexMetrics | null>(null);

  const runId = useRef(0);
  const t0Ref = useRef(0);
  const onsetRef = useRef<number | null>(null);
  const vadRef = useRef<VadSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishSpeechRef = useRef<(() => void) | null>(null);
  const echoTimerRef = useRef<number | null>(null);
  const finishEchoRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const current = questions[index];

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
      stopActiveMedia();
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, [questions]);

  function stopActiveMedia() {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    window.speechSynthesis?.cancel();
    finishSpeechRef.current?.();
    finishSpeechRef.current = null;
    if (echoTimerRef.current !== null) window.clearInterval(echoTimerRef.current);
    echoTimerRef.current = null;
    finishEchoRef.current?.();
    finishEchoRef.current = null;
    vadRef.current?.stop();
    vadRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setMicLevel(0);
  }

  function stop() {
    runId.current++;
    stopActiveMedia();
    setPlaying(false);
    setListening(false);
    setEchoSeconds(0);
    setEchoReady(false);
    setActiveWord(-1);
  }

  function playAudioUrl(url: string, wordsInQuestion: string[], run: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;
      audio.ontimeupdate = () => {
        if (runId.current !== run) return;
        if (!audio.duration || !Number.isFinite(audio.duration) || !wordsInQuestion.length) return;
        const spokenWord = Math.min(
          wordsInQuestion.length - 1,
          Math.floor((audio.currentTime / audio.duration) * wordsInQuestion.length),
        );
        setActiveWord(spokenWord);
      };
      audio.onended = () => {
        if (audioRef.current === audio) audioRef.current = null;
        resolve(true);
      };
      audio.onerror = () => {
        if (audioRef.current === audio) audioRef.current = null;
        resolve(false);
      };
      audio.play().catch(() => {
        if (audioRef.current === audio) audioRef.current = null;
        resolve(false);
      });
    });
  }

  function speakBrowserFallback(question: CommunicationQuestion, run: number) {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      const prosodicText = toProsodicSentence(question);
      const utterance = new SpeechSynthesisUtterance(prosodicText);
      finishSpeechRef.current = resolve;
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.04;
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onboundary = (event) => {
        if (runId.current !== run) return;
        const before = prosodicText.slice(0, event.charIndex).trim();
        const chunkWord = before ? before.split(/\s+/).length : 0;
        setActiveWord(chunkWord);
      };
      utterance.onend = () => { finishSpeechRef.current = null; setActiveWord(-1); resolve(); };
      utterance.onerror = () => { finishSpeechRef.current = null; setActiveWord(-1); resolve(); };
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
      if (ok) {
        setAudioFallback(false);
        setActiveWord(-1);
        return;
      }
    }

    const prosodicText = toProsodicSentence(question);
    const ttsOk = await playAudioUrl(`/api/tts?lang=en&q=${encodeURIComponent(prosodicText)}`, wordsInQuestion, run);
    if (runId.current !== run) return;
    if (ttsOk) {
      setAudioFallback(false);
      setActiveWord(-1);
      return;
    }

    setAudioFallback(true);
    await speakBrowserFallback(question, run);
  }

  async function startReflexCapture(question: CommunicationQuestion, isAutoAfterPrompt = false) {
    if (!current) return;
    vadRef.current?.stop();
    vadRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    setReflexMetrics(null);
    setRecognitionNote('');
    setShowVisualHint(false);
    setLiveLatencyMs(null);
    onsetRef.current = null;

    if (beatEnabled && !isAutoAfterPrompt) {
      await playRhythmCountIn(2, 112);
    }

    const t0 = performance.now();
    t0Ref.current = t0;
    setListening(true);
    setEchoReady(true);

    // 1. Khởi chạy VAD (Web Audio API) để bắt chính xác mốc T1 khi trẻ bật âm đầu tiên
    const vad = await startVadMonitor({
      t0,
      hintTimeoutMs: 2500,
      onSpeechOnset: (lat) => {
        onsetRef.current = lat;
        setLiveLatencyMs(lat);
      },
      onVolumeChange: (pct) => setMicLevel(pct),
      onHintNeeded: () => setShowVisualHint(true),
    });
    vadRef.current = vad;

    // 2. Khởi chạy SpeechRecognition song song để chấm điểm độ chính xác nội dung (S_acc)
    const recognitionConstructor =
      (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;

    if (!recognitionConstructor) {
      setRecognitionNote('Đang đo tốc độ bật âm qua Micro (VAD). Nhấn "Chấm điểm phản xạ" khi em đọc xong nhé!');
      return;
    }

    let heardTranscript = '';
    const recognition = new recognitionConstructor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      heardTranscript = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
      const vadStats = vadRef.current?.stop();
      vadRef.current = null;
      const latencyMs = onsetRef.current ?? vadStats?.latencyMs ?? Math.round(performance.now() - t0Ref.current);
      const speechDurationMs = vadStats?.durationMs || Math.max(800, Math.round(performance.now() - t0Ref.current - latencyMs));
      const metrics = evaluateReflexMetrics({
        latencyMs,
        speechDurationMs,
        expectedText: question.sentence,
        heardText: heardTranscript,
      });
      setReflexMetrics(metrics);
      if (metrics.reflexScore >= 70) markPracticed();
    };
    recognition.onerror = () => {
      const vadStats = vadRef.current?.stop();
      vadRef.current = null;
      if (vadStats?.latencyMs) {
        const metrics = evaluateReflexMetrics({
          latencyMs: vadStats.latencyMs,
          speechDurationMs: vadStats.durationMs,
          expectedText: question.sentence,
          heardText: '',
        });
        setReflexMetrics(metrics);
      } else {
        setRecognitionNote('Chưa nhận được giọng nói. Em hãy đọc to hơn một chút nhé!');
      }
    };
    recognition.onend = () => {
      if (vadRef.current) {
        const vadStats = vadRef.current.stop();
        vadRef.current = null;
        if (!heardTranscript && vadStats.latencyMs) {
          const metrics = evaluateReflexMetrics({
            latencyMs: vadStats.latencyMs,
            speechDurationMs: vadStats.durationMs,
            expectedText: question.sentence,
            heardText: '',
          });
          setReflexMetrics(metrics);
        }
      }
      setListening(false);
      setMicLevel(0);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
      setRecognitionNote('Không thể bật micro lúc này. Em thử bấm "Đo phản xạ nói" nhé.');
    }
  }

  function finishManualVadCapture() {
    if (!current) return;
    const vadStats = vadRef.current?.stop();
    vadRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setMicLevel(0);
    const latencyMs = onsetRef.current ?? vadStats?.latencyMs ?? 1200;
    const durationMs = vadStats?.durationMs || 1400;
    const metrics = evaluateReflexMetrics({
      latencyMs,
      speechDurationMs: durationMs,
      expectedText: current.sentence,
      heardText: '',
    });
    setReflexMetrics(metrics);
  }

  async function playCurrent() {
    if (!current) return;
    stopActiveMedia();
    const run = ++runId.current;
    setEchoSeconds(0);
    setEchoReady(false);
    setReflexMetrics(null);
    setRecognitionNote('');
    setShowVisualHint(false);
    setLiveLatencyMs(null);
    setPlaying(true);
    await playQuestion(current, run);
    if (runId.current !== run) return;
    setPlaying(false);
    // Ngay khi câu mẫu vừa dứt (T0), tự động kích hoạt đo phản xạ VAD + ASR ở chế độ Shadowing
    if (mode === 'shadow') {
      await startReflexCapture(current, true);
    }
  }

  async function playStory() {
    if (!questions.length) return;
    stopActiveMedia();
    const run = ++runId.current;
    setEchoSeconds(0);
    setEchoReady(false);
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
    setIndex((next + questions.length) % questions.length);
    setShowText(false);
    setReflexMetrics(null);
    setRecognitionNote('');
    setShowVisualHint(false);
    setLiveLatencyMs(null);
  }

  function markPracticed() {
    if (!current || practiced.includes(current.number)) return;
    const next = [...practiced, current.number];
    setPracticed(next);
    try { localStorage.setItem(`educhain-shadow-v1:${current.storyId}`, JSON.stringify(next)); } catch { /* Keep progress for this visit. */ }
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
      <section className={`en-shadow-echo${listening || echoReady ? ' is-ready' : ''}`} aria-live="polite">
        <Headphones size={20}/>
        <div className="en-vad-body">
          <b>
            {listening
              ? liveLatencyMs !== null
                ? `⚡ Đã bắt được âm đầu tiên (T1 − T0 = ${liveLatencyMs} ms)! Hãy nói hết câu…`
                : '🎙️ Micro VAD đang lắng nghe (T0 đã bắt đầu)… Em hãy bật tiếng ngay!'
              : echoSeconds > 0
                ? `Đến lượt em nói sau ${echoSeconds} giây…`
                : 'Bấm "Nghe mẫu & Bật phản xạ nói" hoặc bấm trực tiếp nút Micro bên phải'}
          </b>
          {listening && (
            <div className="en-vad-meter" aria-label="Cường độ âm thanh micro">
              <span>Âm lượng Micro (VAD):</span>
              <div className="en-vad-bar"><i style={{ width: `${micLevel}%` }} /></div>
              {liveLatencyMs !== null && <strong className="en-vad-latency">ΔT: {liveLatencyMs} ms</strong>}
            </div>
          )}
          {showVisualHint && (
            <div className="en-visual-hint" role="status">
              <Lightbulb size={16} />
              <span>
                <strong>Gợi ý bật âm nhanh (Visual Hint):</strong> Hãy bắt đầu bằng cụm <em>“{firstThreeWords}…”</em>!
              </span>
            </div>
          )}
        </div>
        {listening ? (
          <button type="button" className="en-vad-stop" onClick={finishManualVadCapture}>
            <Square size={15}/> Chấm điểm
          </button>
        ) : (
          <button type="button" onClick={() => void startReflexCapture(current, false)}>
            <Mic size={17}/> Đo phản xạ nói
          </button>
        )}
      </section>
    )}

    {mode === 'shadow' && reflexMetrics && (
      <div className={`en-reflex-scorecard is-${REFLEX_TIER_META[reflexMetrics.tier].color}`} role="status">
        <div className="en-rs-header">
          <span className="en-rs-badge">
            {REFLEX_TIER_META[reflexMetrics.tier].badge} {REFLEX_TIER_META[reflexMetrics.tier].label} · {REFLEX_TIER_META[reflexMetrics.tier].vi}
          </span>
          <strong className="en-rs-total">Reflex Score: {reflexMetrics.reflexScore}/100</strong>
        </div>
        <div className="en-rs-metrics">
          <div className="en-rs-metric">
            <small>Độ trễ bật âm (ΔT = T1 − T0)</small>
            <b>{reflexMetrics.latencyMs} ms</b>
            <span>Điểm tốc độ (50%): {reflexMetrics.speedScore}/100</span>
          </div>
          <div className="en-rs-metric">
            <small>Độ chính xác nội dung (ASR)</small>
            <b>{reflexMetrics.accuracyScore}%</b>
            <span>Trọng số (30%): {reflexMetrics.accuracyScore}/100</span>
          </div>
          <div className="en-rs-metric">
            <small>Độ trôi chảy cơ miệng (Fluency)</small>
            <b>{(reflexMetrics.speechDurationMs / 1000).toFixed(1)}s</b>
            <span>Trọng số (20%): {reflexMetrics.fluencyScore}/100</span>
          </div>
        </div>
        <p className="en-rs-tip">
          {REFLEX_TIER_META[reflexMetrics.tier].tip}
          {reflexMetrics.heard && <> · Máy nghe được: <em>“{reflexMetrics.heard}”</em></>}
        </p>
      </div>
    )}

    {recognitionNote && <p className="en-shadow-audio-note">{recognitionNote}</p>}

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
      {mode === 'shadow' && <button type="button" className={current && practiced.includes(current.number) ? 'is-done' : ''} onClick={markPracticed} disabled={practiced.includes(current.number)}><Check size={17}/> {practiced.includes(current.number) ? 'Đã luyện' : 'Đánh dấu hoàn thành'}</button>}
      {mode !== 'shadow' && <button type="button" className="en-shadow-next" onClick={() => chooseSentence(index + 1)}>Câu tiếp <ChevronRight size={18}/></button>}
      {mode === 'shadow' && index < questions.length - 1 && <button type="button" className="en-shadow-next" onClick={() => chooseSentence(index + 1)}>Câu tiếp <ChevronRight size={18}/></button>}
    </footer>
    {playing && <p className="en-shadow-status"><Volume2 size={16}/> Đang phát câu {index + 1}…</p>}
    {audioFallback && <p className="en-shadow-audio-note">Đang phát bằng giọng đọc dự phòng của trình duyệt.</p>}
  </div>;
}
