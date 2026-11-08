'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Headphones, Mic, Play, Square, Star, Volume2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { CommunicationQuestion } from '@/lib/english/communicationBank';
import { analyzeSentenceProsody, toProsodicSentence } from '@/lib/english/prosody';

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

const normalizeWords = (text: string) => text.toLowerCase().replace(/[^a-z']/g, ' ').split(/\s+/).filter(Boolean);

export default function ShadowingStudio({ questions, initialNumber }: { questions: CommunicationQuestion[]; initialNumber: number }) {
  const initialIndex = Math.max(0, questions.findIndex((question) => question.number === initialNumber));
  const [index, setIndex] = useState(initialIndex);
  const [mode, setMode] = useState<Mode>('listen');
  const [showText, setShowText] = useState(false);
  const [rate, setRate] = useState(0.92);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [activeWord, setActiveWord] = useState(-1);
  const [practiced, setPracticed] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [audioFallback, setAudioFallback] = useState(false);
  const [echoSeconds, setEchoSeconds] = useState(0);
  const [echoReady, setEchoReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognitionNote, setRecognitionNote] = useState('');
  const [recognitionResult, setRecognitionResult] = useState<{ heard: string; score: number } | null>(null);
  const runId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishSpeechRef = useRef<(() => void) | null>(null);
  const echoTimerRef = useRef<number | null>(null);
  const finishEchoRef = useRef<(() => void) | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const current = questions[index];

  // Ưu tiên giọng Neural/Natural trực tuyến (Aria, Ana, Jenny, Guy, Google US English) thay vì giọng máy Zira/David
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
    recognitionRef.current?.stop();
    recognitionRef.current = null;
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
      // Đọc liền mạch câu có dấu phẩy prosodic giữa action và reason để giữ ngữ điệu nối câu (↗ | ↘)
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

    // 1. Ưu tiên file thu mẫu Neural trên Supabase Storage (english-shadowing-audio)
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

    // 2. Dự phòng qua /api/tts Neural 24kHz với dấu ngắt nhịp prosodic (action, reason)
    const prosodicText = toProsodicSentence(question);
    const ttsOk = await playAudioUrl(`/api/tts?lang=en&q=${encodeURIComponent(prosodicText)}`, wordsInQuestion, run);
    if (runId.current !== run) return;
    if (ttsOk) {
      setAudioFallback(false);
      setActiveWord(-1);
      return;
    }

    // 3. Dự phòng ngoại tuyến qua Web Speech API
    setAudioFallback(true);
    await speakBrowserFallback(question, run);
  }

  function startEchoInterval(question: CommunicationQuestion, run: number) {
    const words = normalizeWords(question.sentence).length;
    const total = Math.max(2, Math.ceil((words * 0.34) / rate + 1.5));
    setEchoSeconds(total);
    setEchoReady(false);
    return new Promise<void>((resolve) => {
      let remaining = total;
      finishEchoRef.current = resolve;
      echoTimerRef.current = window.setInterval(() => {
        if (runId.current !== run) {
          if (echoTimerRef.current !== null) window.clearInterval(echoTimerRef.current);
          echoTimerRef.current = null;
          finishEchoRef.current = null;
          resolve();
          return;
        }
        remaining -= 1;
        setEchoSeconds(Math.max(remaining, 0));
        if (remaining <= 0) {
          if (echoTimerRef.current !== null) window.clearInterval(echoTimerRef.current);
          echoTimerRef.current = null;
          finishEchoRef.current = null;
          setEchoReady(true);
          resolve();
        }
      }, 1000);
    });
  }

  async function playCurrent() {
    if (!current) return;
    stopActiveMedia();
    const run = ++runId.current;
    setEchoSeconds(0);
    setEchoReady(false);
    setRecognitionResult(null);
    setRecognitionNote('');
    setPlaying(true);
    await playQuestion(current, run);
    if (runId.current !== run) return;
    setPlaying(false);
    if (mode === 'shadow') await startEchoInterval(current, run);
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

  function startRecognition() {
    if (!current) return;
    const recognitionConstructor = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
    if (!recognitionConstructor) {
      setRecognitionNote('Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Em vẫn có thể tự nghe và đọc nhại theo.');
      return;
    }
    setRecognitionResult(null);
    setRecognitionNote('');
    const recognition = new recognitionConstructor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const heard = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
      const expectedWords = normalizeWords(current.sentence);
      const heardWords = new Map<string, number>();
      normalizeWords(heard).forEach((word) => heardWords.set(word, (heardWords.get(word) ?? 0) + 1));
      const correct = expectedWords.filter((word) => {
        const available = heardWords.get(word) ?? 0;
        if (!available) return false;
        heardWords.set(word, available - 1);
        return true;
      }).length;
      setRecognitionResult({ heard, score: expectedWords.length ? Math.round((correct / expectedWords.length) * 100) : 0 });
    };
    recognition.onerror = () => setRecognitionNote('Chưa nhận được giọng nói. Kiểm tra quyền micro rồi thử lại nhé.');
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    setListening(true);
    try { recognition.start(); } catch { setListening(false); setRecognitionNote('Không thể bật micro lúc này. Em thử lại nhé.'); }
  }

  function chooseSentence(next: number) {
    stop();
    setIndex((next + questions.length) % questions.length);
    setShowText(false);
    setRecognitionResult(null);
    setRecognitionNote('');
  }

  function markPracticed() {
    if (!current || practiced.includes(current.number)) return;
    const next = [...practiced, current.number];
    setPracticed(next);
    try { localStorage.setItem(`educhain-shadow-v1:${current.storyId}`, JSON.stringify(next)); } catch { /* Keep progress for this visit. */ }
  }

  if (!current) return null;

  return <div className="en-shadow">
    <header className="en-shadow-head">
      <div>
        <span className="en-kicker">STEP 4 · SHADOWING STUDIO · NGHE & ĐỌC THEO</span>
        <h3>{current.storyTitle}</h3>
        <p>{current.storyTitleVi}</p>
      </div>
      <span className="en-shadow-count"><Check size={16}/>{practiced.length}/{questions.length} câu đã luyện</span>
    </header>

    <div className="en-shadow-modes" role="tablist" aria-label="Chế độ luyện tập">
      <button type="button" role="tab" aria-selected={mode === 'listen'} className={mode === 'listen' ? 'is-active' : ''} onClick={() => { stop(); setMode('listen'); setShowText(false); }}><Headphones size={17}/> Nghe</button>
      <button type="button" role="tab" aria-selected={mode === 'shadow'} className={mode === 'shadow' ? 'is-active' : ''} onClick={() => { stop(); setMode('shadow'); setShowText(false); }}><Volume2 size={17}/> Shadowing</button>
      <button type="button" role="tab" aria-selected={mode === 'read'} className={mode === 'read' ? 'is-active' : ''} onClick={() => { stop(); setMode('read'); }}><BookOpen size={17}/> Luyện đọc</button>
    </div>

    <div className="en-shadow-controls">
      <button type="button" className="en-shadow-main" onClick={() => void playCurrent()}><Play size={17}/> {mode === 'shadow' ? 'Nghe & đến lượt em' : 'Nghe câu này'}</button>
      <button type="button" onClick={() => void playStory()} disabled={playing}><Headphones size={17}/> {questions.length > 10 ? 'Nghe 10 câu liền' : 'Nghe cả mạch'}</button>
      {playing && <button type="button" onClick={stop}><Square size={15}/> Dừng</button>}
      <label>Tốc độ <select value={rate} onChange={(event) => setRate(Number(event.target.value))}><option value={0.8}>Chậm rõ · 0.8x</option><option value={0.92}>Chuẩn tiểu học · 0.92x</option><option value={1}>Tự nhiên · 1.0x</option></select></label>
    </div>
    <p className="en-shadow-voice">
      Giọng mẫu: <strong>EduChain Neural US (en-US)</strong> · có nhấn trọng âm &amp; ngữ điệu nối câu
    </p>

    {mode !== 'read' && <article className={`en-shadow-current${showText ? ' has-text' : ''}`}>
      <span className="en-shadow-number">Câu {current.storyIndex} · {current.storySize}</span>
      {mode === 'listen' && !showText && !playing && activeWord < 0 ? <p className="en-shadow-hidden">Nghe câu tiếng Anh, để ý chỗ nhấn giọng và nhịp nghỉ giữa câu, sau đó mở văn bản để đối chiếu.</p> : <>
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
      <button type="button" className="en-shadow-reveal" onClick={() => setShowText((value) => !value)}>{showText ? <><EyeOff size={16}/> Ẩn văn bản</> : <><Eye size={16}/> Hiện câu &amp; nghĩa</>}</button>
      {mode === 'shadow' && <p className="en-shadow-prompt">Nghe mẫu, nhấn rõ các từ có dấu chấm (•), nghỉ nhẹ ở vạch (↗ |) rồi đọc theo thành tiếng.</p>}
    </article>}

    {mode === 'shadow' && <section className={`en-shadow-echo${echoReady ? ' is-ready' : ''}`} aria-live="polite">
      <Headphones size={20}/><div><b>{echoSeconds > 0 ? `Đến lượt em nói sau ${echoSeconds} giây…` : echoReady ? 'Đến lượt em nói!' : 'Nghe mẫu rồi chuẩn bị nhắc lại nhé.'}</b><small>{echoReady ? 'Nhấn micro để đọc câu tiếng Anh.' : 'Sau câu mẫu, hệ thống chừa thời gian để em luyện nói.'}</small><small>Micro chỉ bật khi em nhấn; một số trình duyệt xử lý giọng nói qua dịch vụ trực tuyến.</small></div>
      <button type="button" onClick={startRecognition} disabled={listening || !echoReady}><Mic size={17}/>{listening ? 'Đang nghe…' : 'Em đọc'}</button>
    </section>}
    {mode === 'shadow' && recognitionResult && <div className="en-shadow-score" role="status"><Star size={18}/><span><b>{recognitionResult.score >= 80 ? `Rất tốt! Độ khớp từ khoảng ${recognitionResult.score}%.` : `Độ khớp từ khoảng ${recognitionResult.score}%. Em thử đọc lại nhé.`}</b><small>Máy nhận được: “{recognitionResult.heard}” · Kết quả nhận diện trên trình duyệt, chỉ để luyện tập.</small></span></div>}
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
      {mode === 'shadow' && <button type="button" className={current && practiced.includes(current.number) ? 'is-done' : ''} onClick={markPracticed} disabled={practiced.includes(current.number)}><Check size={17}/> {practiced.includes(current.number) ? 'Đã luyện' : 'Đã đọc theo'}</button>}
      {mode !== 'shadow' && <button type="button" className="en-shadow-next" onClick={() => chooseSentence(index + 1)}>Câu tiếp <ChevronRight size={18}/></button>}
      {mode === 'shadow' && index < questions.length - 1 && <button type="button" className="en-shadow-next" onClick={() => chooseSentence(index + 1)}>Câu tiếp <ChevronRight size={18}/></button>}
    </footer>
    {playing && <p className="en-shadow-status"><Volume2 size={16}/> Đang phát câu {index + 1}…</p>}
    {audioFallback && <p className="en-shadow-audio-note">Đang phát bằng giọng đọc dự phòng của trình duyệt.</p>}
  </div>;
}
