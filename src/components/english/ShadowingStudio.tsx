'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Eye, EyeOff, Headphones, Play, Square, Volume2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { CommunicationQuestion } from '@/lib/english/communicationBank';

type Mode = 'listen' | 'shadow' | 'read';

export default function ShadowingStudio({ questions, initialNumber }: { questions: CommunicationQuestion[]; initialNumber: number }) {
  const initialIndex = Math.max(0, questions.findIndex((question) => question.number === initialNumber));
  const [index, setIndex] = useState(initialIndex);
  const [mode, setMode] = useState<Mode>('listen');
  const [showText, setShowText] = useState(false);
  const [rate, setRate] = useState(0.82);
  const [practiced, setPracticed] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [audioFallback, setAudioFallback] = useState(false);
  const runId = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishSpeechRef = useRef<(() => void) | null>(null);
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const current = questions[index];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`educhain-shadow-v1:${questions[0]?.storyId ?? 'story'}`);
      if (saved) setPracticed(JSON.parse(saved) as number[]);
    } catch { /* Shadowing remains usable when browser storage is unavailable. */ }
    return () => {
      runId.current++;
      stopActiveMedia();
    };
  }, [questions]);

  function stopActiveMedia() {
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    window.speechSynthesis?.cancel();
    finishSpeechRef.current?.();
    finishSpeechRef.current = null;
  }

  function stop() {
    runId.current++;
    stopActiveMedia();
    setPlaying(false);
  }

  function say(text: string) {
    return new Promise<void>((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      finishSpeechRef.current = resolve;
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.onend = () => { finishSpeechRef.current = null; resolve(); };
      utterance.onerror = () => { finishSpeechRef.current = null; resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  async function playQuestion(question: CommunicationQuestion, run: number) {
    if (supabase) {
      const clipName = `${String(question.storyIndex).padStart(3, '0')}.mp3`;
      const { data } = supabase.storage.from('english-shadowing-audio').getPublicUrl(`${question.storyId}/${clipName}`);
      const audio = new Audio(data.publicUrl);
      audio.playbackRate = rate;
      audioRef.current = audio;
      try {
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error('Audio sample unavailable'));
          audio.play().catch(reject);
        });
        if (audioRef.current === audio) audioRef.current = null;
        if (runId.current === run) setAudioFallback(false);
        return;
      } catch {
        if (audioRef.current === audio) audioRef.current = null;
        if (runId.current !== run) return;
        setAudioFallback(true);
      }
    } else {
      setAudioFallback(true);
    }
    if (runId.current === run) await say(question.sentence);
  }

  async function playCurrent() {
    if (!current) return;
    stopActiveMedia();
    const run = ++runId.current;
    setPlaying(true);
    await playQuestion(current, run);
    if (runId.current === run) setPlaying(false);
  }

  async function playStory() {
    if (!questions.length) return;
    stopActiveMedia();
    const run = ++runId.current;
    setPlaying(true);
    for (let i = 0; i < questions.length; i++) {
      if (runId.current !== run) break;
      setIndex(i);
      await playQuestion(questions[i], run);
      if (i < questions.length - 1 && runId.current === run) {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
      }
    }
    if (runId.current === run) setPlaying(false);
  }

  function chooseSentence(next: number) {
    stop();
    setIndex((next + questions.length) % questions.length);
    setShowText(false);
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
      <button type="button" role="tab" aria-selected={mode === 'listen'} className={mode === 'listen' ? 'is-active' : ''} onClick={() => { setMode('listen'); setShowText(false); }}><Headphones size={17}/> Nghe</button>
      <button type="button" role="tab" aria-selected={mode === 'shadow'} className={mode === 'shadow' ? 'is-active' : ''} onClick={() => { setMode('shadow'); setShowText(false); }}><Volume2 size={17}/> Shadowing</button>
      <button type="button" role="tab" aria-selected={mode === 'read'} className={mode === 'read' ? 'is-active' : ''} onClick={() => setMode('read')}><BookOpen size={17}/> Luyện đọc</button>
    </div>

    <div className="en-shadow-controls">
      <button type="button" className="en-shadow-main" onClick={() => void playCurrent()}><Play size={17}/> Nghe câu này</button>
      <button type="button" onClick={() => void playStory()} disabled={playing}><Headphones size={17}/> Nghe cả mạch</button>
      {playing && <button type="button" onClick={stop}><Square size={15}/> Dừng</button>}
      <label>Tốc độ <select value={rate} onChange={(event) => setRate(Number(event.target.value))}><option value={0.68}>Chậm</option><option value={0.82}>Vừa</option><option value={1}>Tự nhiên</option></select></label>
    </div>

    {mode !== 'read' && <article className={`en-shadow-current${showText ? ' has-text' : ''}`}>
      <span className="en-shadow-number">Câu {current.storyIndex} · {current.storySize}</span>
      {mode === 'listen' && !showText ? <p className="en-shadow-hidden">Nghe câu tiếng Anh, sau đó mở văn bản để đối chiếu.</p> : <>
        <p className="en-shadow-english">{current.sentence}</p>
        {(mode === 'read' || showText) && <p className="en-shadow-vietnamese">{current.translation}</p>}
      </>}
      {mode !== 'read' && <button type="button" className="en-shadow-reveal" onClick={() => setShowText((value) => !value)}>{showText ? <><EyeOff size={16}/> Ẩn văn bản</> : <><Eye size={16}/> Hiện câu & nghĩa</>}</button>}
      {mode === 'shadow' && <p className="en-shadow-prompt">Nghe mẫu, nhắc lại thành tiếng rồi đánh dấu đã luyện. · Listen, repeat, then mark it done.</p>}
    </article>}

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
  </div>;
}
