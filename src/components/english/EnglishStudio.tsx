'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lightbulb,
  LockKeyhole,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Trophy,
  Volume2,
  Zap,
} from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import ShadowingStudio from '@/components/english/ShadowingStudio';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import { createClient } from '@/lib/supabase/client';
import { ENGLISH_COMMUNICATION_BANK, ENGLISH_COMMUNICATION_STORIES } from '@/lib/english/communicationBank';
import { analyzeSentenceProsody, toProsodicSentence } from '@/lib/english/prosody';
import {
  AGE_LEVEL_META,
  PATTERN_CHUNKS_BY_LEVEL,
  type AgeLevel,
} from '@/lib/english/patternChunks';
import {
  REFLEX_TIER_META,
  evaluateReflexMetrics,
  playRhythmCountIn,
  startVadMonitor,
  type ReflexMetrics,
  type VadSession,
} from '@/lib/english/reflexEngine';

type Example = { subject: string; action: string; base: string; purpose: string; vi: string; why: string; icon: string };
type Topic = { id: string; name: string; vi: string; icon: string; example: Example };
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

const TOPICS: Topic[] = [
  { id:'daily',name:'Daily Routines',vi:'Sinh hoạt hằng ngày',icon:'🌅',example:{subject:'I',action:'wake up',base:'get dressed',purpose:'go to school',vi:'Tôi thức dậy để mặc quần áo đi học.',why:'Getting dressed helps me get ready for school.',icon:'🎒'} },
  { id:'school',name:'School Activities',vi:'Hoạt động ở trường',icon:'🏫',example:{subject:'We',action:'read',base:'learn',purpose:'new words',vi:'Chúng mình đọc để học từ mới.',why:'Reading helps us learn new words.',icon:'📚'} },
  { id:'health',name:'Health & Hygiene',vi:'Sức khỏe & vệ sinh',icon:'🪥',example:{subject:'I',action:'wash',base:'stay',purpose:'clean',vi:'Tôi rửa tay để giữ sạch sẽ.',why:'Washing my hands helps me stay clean.',icon:'🧼'} },
  { id:'family',name:'Family & Home',vi:'Gia đình & nhà cửa',icon:'🏡',example:{subject:'I',action:'help',base:'make',purpose:'dinner',vi:'Tôi giúp để chuẩn bị bữa tối.',why:'Helping at home makes family life easier.',icon:'🍽️'} },
  { id:'friends',name:'Friends & Social Life',vi:'Bạn bè & giao tiếp',icon:'🧒',example:{subject:'I',action:'share',base:'make',purpose:'my friend happy',vi:'Tôi chia sẻ để làm bạn vui.',why:'Sharing is a kind way to make a friend happy.',icon:'🤝'} },
  { id:'sports',name:'Sports & Playtime',vi:'Thể thao & vui chơi',icon:'⚽',example:{subject:'We',action:'run',base:'stay',purpose:'strong',vi:'Chúng mình chạy để khỏe mạnh.',why:'Running helps us stay strong.',icon:'🏃'} },
  { id:'nature',name:'Nature & Environment',vi:'Thiên nhiên & môi trường',icon:'🌳',example:{subject:'We',action:'plant',base:'help',purpose:'the Earth',vi:'Chúng mình trồng cây để giúp Trái Đất.',why:'Planting trees helps the Earth.',icon:'🌱'} },
  { id:'food',name:'Shopping & Food',vi:'Mua sắm & đồ ăn',icon:'🍎',example:{subject:'I',action:'eat',base:'stay',purpose:'healthy',vi:'Tôi ăn để khỏe mạnh.',why:'Eating fruit helps me stay healthy.',icon:'🍓'} },
  { id:'transport',name:'Transport & Safety',vi:'Đi lại & an toàn',icon:'🚦',example:{subject:'I',action:'look',base:'stay',purpose:'safe',vi:'Tôi nhìn trước khi qua đường để an toàn.',why:'Looking both ways helps me stay safe.',icon:'🚸'} },
  { id:'hobbies',name:'Hobbies & Creativity',vi:'Sở thích & sáng tạo',icon:'🎨',example:{subject:'I',action:'draw',base:'show',purpose:'my ideas',vi:'Tôi vẽ để thể hiện ý tưởng.',why:'Drawing helps me show my ideas.',icon:'🖍️'} },
];
const TOPIC_ART: Record<string, string> = {
  daily: 'alarm-clock', school: 'school', health: 'soap', family: 'house-with-garden', friends: 'grinning-face-with-smiling-eyes',
  sports: 'soccer-ball', nature: 'seedling', food: 'red-apple', transport: 'bus', hobbies: 'artist-palette',
};
const EXAMPLE_ART: Record<string, string> = {
  daily: 'backpack', school: 'books', health: 'soap', family: 'bowl-with-spoon', friends: 'grinning-face-with-smiling-eyes',
  sports: 'person-running', nature: 'deciduous-tree', food: 'red-apple', transport: 'bus', hobbies: 'artist-palette',
};
const STEP_ART: Record<string, string> = {
  Think: 'light-bulb', Connect: 'speech-balloon', Build: 'puzzle-piece', Shadowing: 'speaking-head', Apply: 'star',
};
const STEPS = [
  { en: 'Think', vi: '1. Khắc sâu (Imprint)' },
  { en: 'Connect', vi: '2. Phản xạ ý' },
  { en: 'Build', vi: '3. Thay biến số & Ghép' },
  { en: 'Shadowing', vi: '4. Nhịp & Đo ΔT' },
  { en: 'Apply', vi: '5. Boss Battle' },
];
const PROGRESS_KEY = 'educhain-english-progress-v1';
const sentence = (e: Example) => `${e.subject} ${e.action} to ${e.base} ${e.purpose}.`;

export default function EnglishStudio() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [mode, setMode] = useState<'learn' | 'challenge'>('learn');
  const [seconds, setSeconds] = useState(3);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [speakingSample, setSpeakingSample] = useState(false);

  // 1. Cấp độ Pattern Chunks theo độ tuổi (4–6, 7–9, 10–12 tuổi)
  const [ageLevel, setAgeLevel] = useState<AgeLevel>('age7_9');
  const [chunkIdx, setChunkIdx] = useState(0);
  const [slotIdx, setSlotIdx] = useState(0);
  const [autoSpeedDrill, setAutoSpeedDrill] = useState(false);

  // 2. Sound-Image Imprint: Mặc định ẩn nghĩa tiếng Việt ở Bước 1 để tránh dịch nhẩm
  const [showViStep1, setShowViStep1] = useState(false);

  // 3. Bước 3: Chuyển đổi giữa High-Speed Slot Substitution và Sentence Builder
  const [step3Mode, setStep3Mode] = useState<'slot' | 'builder'>('slot');

  // 4. Bước 5: Reflex Boss Battle (Đo ΔT_reflex = T1 - T0 trực tiếp)
  const [bossListening, setBossListening] = useState(false);
  const [bossMicLevel, setBossMicLevel] = useState(0);
  const [bossLiveLatency, setBossLiveLatency] = useState<number | null>(null);
  const [bossHintVisible, setBossHintVisible] = useState(false);
  const [bossMetrics, setBossMetrics] = useState<ReflexMetrics | null>(null);
  const [bossNote, setBossNote] = useState('');

  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const bossVadRef = useRef<VadSession | null>(null);
  const bossRecRef = useRef<RecognitionLike | null>(null);
  const bossT0Ref = useRef(0);
  const bossOnsetRef = useRef<number | null>(null);
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);

  const levelChunks = PATTERN_CHUNKS_BY_LEVEL[ageLevel];
  const currentChunk = levelChunks[chunkIdx % levelChunks.length] ?? levelChunks[0];
  const currentSlot = currentChunk.slots[slotIdx % currentChunk.slots.length] ?? currentChunk.slots[0];

  const topic = TOPICS[active];
  const topicBank = useMemo(() => ENGLISH_COMMUNICATION_BANK[topic.id] ?? [], [topic.id]);
  const bankQuestion = topicBank[questionIndex] ?? null;
  const e = topic.example;
  const answer = bankQuestion?.sentence ?? sentence(e);
  const actionClause = bankQuestion?.action ?? `${e.subject} ${e.action}`;
  const reasonClause = bankQuestion?.reason ?? `to ${e.base} ${e.purpose}.`;
  const translation = bankQuestion?.translation ?? e.vi;
  const reason = bankQuestion?.reason ?? e.why;
  const answerIndex = bankQuestion ? bankQuestion.number % 3 : 0;

  const prosodyTokens = useMemo(
    () => analyzeSentenceProsody({ action: actionClause, reason: reasonClause, sentence: answer }),
    [actionClause, reasonClause, answer],
  );

  const words = useMemo(() => {
    const tokens = answer.replace(/[.!?]+$/, '').split(/\s+/);
    const offset = tokens.length > 1 ? ((bankQuestion?.number ?? 2) % (tokens.length - 1)) + 1 : 0;
    return [...tokens.slice(offset), ...tokens.slice(0, offset)];
  }, [answer, bankQuestion?.number]);

  const options = useMemo(() => {
    if (!bankQuestion) return [e.why, `Because ${e.action} is fun.`, `Because ${e.purpose} is a person.`];
    const distractors = [...new Set(topicBank.filter((item) => item.number !== bankQuestion.number).map((item) => item.reason).filter((item) => item !== bankQuestion.reason))];
    const choices = new Array<string>(3);
    choices[answerIndex] = bankQuestion.reason;
    let next = 0;
    for (let i = 0; i < choices.length; i++) {
      if (i !== answerIndex) choices[i] = distractors[next++] ?? e.why;
    }
    return choices;
  }, [answerIndex, bankQuestion, e.action, e.purpose, e.why, topicBank]);

  useEffect(() => { try { const saved = localStorage.getItem(PROGRESS_KEY); if (saved) setDone(JSON.parse(saved) as string[]); } catch { /* Keep the learning page usable when storage is unavailable. */ } }, []);
  useEffect(() => {
    if (!challengeStarted || seconds <= 0 || reviewed) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [challengeStarted, seconds, reviewed]);
  useEffect(() => { if (challengeStarted && seconds === 0) { setReviewed(true); setChoice(null); } }, [challengeStarted, seconds]);

  // High-Speed Substitution Drill: Tự động đổi biến số mỗi 2.5 giây khi bật chế độ Đua tốc độ
  useEffect(() => {
    if (!autoSpeedDrill) return;
    const timer = window.setInterval(() => {
      setSlotIdx((prev) => (prev + 1) % currentChunk.slots.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [autoSpeedDrill, currentChunk.slots.length]);

  useEffect(() => () => {
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current = null;
    }
    bossVadRef.current?.stop();
    bossRecRef.current?.stop();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  function markComplete() {
    const next = done.includes(topic.id) ? done : [...done, topic.id];
    setDone(next);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* Progress remains available for this visit. */ }
  }

  function stopSampleAudio() {
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current.currentTime = 0;
      sampleAudioRef.current = null;
    }
    bossVadRef.current?.stop();
    bossVadRef.current = null;
    bossRecRef.current?.stop();
    bossRecRef.current = null;
    setBossListening(false);
    setBossMicLevel(0);
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setSpeakingSample(false);
  }

  async function speakText(customText?: string) {
    if (speakingSample && !customText) {
      stopSampleAudio();
      return;
    }
    stopSampleAudio();
    setSpeakingSample(true);

    const tryPlayUrl = (url: string, playbackRate = 0.94) =>
      new Promise<boolean>((resolve) => {
        const audio = new Audio(url);
        audio.playbackRate = playbackRate;
        sampleAudioRef.current = audio;
        audio.onended = () => {
          if (sampleAudioRef.current === audio) sampleAudioRef.current = null;
          resolve(true);
        };
        audio.onerror = () => {
          if (sampleAudioRef.current === audio) sampleAudioRef.current = null;
          resolve(false);
        };
        audio.play().catch(() => {
          if (sampleAudioRef.current === audio) sampleAudioRef.current = null;
          resolve(false);
        });
      });

    if (!customText && bankQuestion && supabase) {
      const clipName = `${String(bankQuestion.storyIndex).padStart(3, '0')}.mp3`;
      const { data } = supabase.storage.from('english-shadowing-audio').getPublicUrl(`${bankQuestion.storyId}/${clipName}`);
      const ok = await tryPlayUrl(data.publicUrl, 0.94);
      if (ok) {
        setSpeakingSample(false);
        return;
      }
    }

    const prosodicText = customText ?? toProsodicSentence({ action: actionClause, reason: reasonClause, sentence: answer });
    const ttsOk = await tryPlayUrl(`/api/tts?lang=en&q=${encodeURIComponent(prosodicText)}`, 0.94);
    if (ttsOk) {
      setSpeakingSample(false);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const bestVoice =
        voices.find((v) => /^en[-_]US$/i.test(v.lang) && /natural|online|google/i.test(v.name)) ??
        voices.find((v) => /^en[-_]US$/i.test(v.lang));
      const utterance = new SpeechSynthesisUtterance(prosodicText);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
      utterance.pitch = 1.04;
      if (bestVoice) utterance.voice = bestVoice;
      utterance.onend = () => setSpeakingSample(false);
      utterance.onerror = () => setSpeakingSample(false);
      window.speechSynthesis.speak(utterance);
      return;
    }
    setSpeakingSample(false);
  }

  /**
   * Bước 5 — THE REFLEX BOSS BATTLE:
   * 1. Phát câu hỏi kích thích của Cú Milo (Prompt Audio)
   * 2. Vừa dứt câu hỏi -> Ghi mốc T0 -> Bật VAD + SpeechRecognition đo ΔT_reflex = T1 - T0
   */
  async function startBossBattleRound(promptEn: string, expectedAnswerEn: string, targetMs: number) {
    stopSampleAudio();
    setBossMetrics(null);
    setBossNote('');
    setBossHintVisible(false);
    setBossLiveLatency(null);
    bossOnsetRef.current = null;

    // 1. Phát câu hỏi của Boss Cú Milo
    await new Promise<void>((resolve) => {
      const audio = new Audio(`/api/tts?lang=en&q=${encodeURIComponent(promptEn)}`);
      sampleAudioRef.current = audio;
      audio.onended = () => {
        if (sampleAudioRef.current === audio) sampleAudioRef.current = null;
        resolve();
      };
      audio.onerror = () => {
        if (sampleAudioRef.current === audio) sampleAudioRef.current = null;
        resolve();
      };
      audio.play().catch(() => resolve());
    });

    await playRhythmCountIn(2, 116);

    // 2. Ghi mốc T0 ngay khi câu hỏi dứt
    const t0 = performance.now();
    bossT0Ref.current = t0;
    setBossListening(true);

    const vad = await startVadMonitor({
      t0,
      hintTimeoutMs: 2500,
      onSpeechOnset: (lat) => {
        bossOnsetRef.current = lat;
        setBossLiveLatency(lat);
      },
      onVolumeChange: (pct) => setBossMicLevel(pct),
      onHintNeeded: () => setBossHintVisible(true),
    });
    bossVadRef.current = vad;

    const recognitionConstructor =
      (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;

    if (!recognitionConstructor) {
      setBossNote('Micro VAD đang đo tốc độ bật âm. Khi nói xong, bấm "Chấm điểm đòn phản xạ" nhé!');
      return;
    }

    let heardTranscript = '';
    const recognition = new recognitionConstructor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      heardTranscript = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
      const vadStats = bossVadRef.current?.stop();
      bossVadRef.current = null;
      const latencyMs = bossOnsetRef.current ?? vadStats?.latencyMs ?? Math.round(performance.now() - bossT0Ref.current);
      const durationMs = vadStats?.durationMs || Math.max(700, Math.round(performance.now() - bossT0Ref.current - latencyMs));
      const metrics = evaluateReflexMetrics({
        latencyMs,
        speechDurationMs: durationMs,
        expectedText: expectedAnswerEn,
        heardText: heardTranscript,
        targetLatencyMs: targetMs,
      });
      setBossMetrics(metrics);
    };
    recognition.onerror = () => {
      const vadStats = bossVadRef.current?.stop();
      bossVadRef.current = null;
      if (vadStats?.latencyMs) {
        setBossMetrics(
          evaluateReflexMetrics({
            latencyMs: vadStats.latencyMs,
            speechDurationMs: vadStats.durationMs,
            expectedText: expectedAnswerEn,
            heardText: '',
            targetLatencyMs: targetMs,
          }),
        );
      } else {
        setBossNote('Cú Milo chưa nghe rõ. Em bấm thử lại và nói to ngay sau tiếng phách nhé!');
      }
    };
    recognition.onend = () => {
      if (bossVadRef.current) {
        const vadStats = bossVadRef.current.stop();
        bossVadRef.current = null;
        if (!heardTranscript && vadStats.latencyMs) {
          setBossMetrics(
            evaluateReflexMetrics({
              latencyMs: vadStats.latencyMs,
              speechDurationMs: vadStats.durationMs,
              expectedText: expectedAnswerEn,
              heardText: '',
              targetLatencyMs: targetMs,
            }),
          );
        }
      }
      setBossListening(false);
      setBossMicLevel(0);
      bossRecRef.current = null;
    };
    bossRecRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setBossListening(false);
    }
  }

  function finishManualBossCapture(expectedAnswerEn: string, targetMs: number) {
    const vadStats = bossVadRef.current?.stop();
    bossVadRef.current = null;
    bossRecRef.current?.stop();
    bossRecRef.current = null;
    setBossListening(false);
    setBossMicLevel(0);
    const latencyMs = bossOnsetRef.current ?? vadStats?.latencyMs ?? 950;
    const durationMs = vadStats?.durationMs || 1200;
    setBossMetrics(
      evaluateReflexMetrics({
        latencyMs,
        speechDurationMs: durationMs,
        expectedText: expectedAnswerEn,
        heardText: '',
        targetLatencyMs: targetMs,
      }),
    );
  }

  function nextTopic() { stopSampleAudio(); setActive((i) => (i + 1) % TOPICS.length); setQuestionIndex(0); setStep(0); setPlaced([]); setChoice(null); setReviewed(false); setChallengeStarted(false); setSeconds(3); setBossMetrics(null); }
  function nextQuestion() { stopSampleAudio(); setQuestionIndex((i) => (i + 1) % Math.max(topicBank.length, 1)); setStep(0); setPlaced([]); setChoice(null); setReviewed(false); setChallengeStarted(false); setSeconds(3); setBossMetrics(null); }
  function startChallenge() { setMode('challenge'); setSeconds(3); setChoice(null); setReviewed(false); setChallengeStarted(true); }

  const bossQuestionText = `Why do we say: ${actionClause}?`;

  return <div className="en-studio">
    <header className="en-hero">
      <div className="en-hero-copy"><Link href="/hoc-sinh" className="en-back"><ArrowLeft size={18}/> Trang của em</Link><p className="en-kicker">ENGLISH REFLEX ENGINE · PATTERN CHUNKS</p><h1>Think. Connect. Speak.</h1><p>Học theo khối ngôn ngữ (Pattern Chunks) và đo phản xạ bật âm thực tế (ΔT = T1 − T0).</p><p className="en-hero-vi">Khắc sâu hình ảnh · Nhịp phách · Đua tốc độ thay biến số · Đấu trùm phản xạ</p><div className="en-hero-actions"><a className="en-primary" href="#en-pattern-lab">Khung Pattern Chunks <Zap size={18}/></a><a className="en-secondary" href="#en-topics">10 Chủ đề giao tiếp <ArrowRight size={17}/></a><Link className="en-secondary" href="/chon-bai?subject=tieng-anh">Bài tiếng Anh SGK <BookOpen size={17}/></Link></div></div>
      <div className="en-mascot"><span className="en-speech">Zero Translation!<small>Nhìn hình – bật tiếng Anh ngay!</small></span><MiloMascot size={142}/></div>
    </header>

    {/* =====================================================================
        PHẦN MỚI: KHUNG CHƯƠNG TRÌNH PATTERN CHUNKS PHÂN BỔ THEO 3 ĐỘ TUỔI
       ===================================================================== */}
    <section id="en-pattern-lab" className="en-pattern-lab" aria-label="Giáo trình Pattern Chunks theo độ tuổi">
      <div className="en-section-heading">
        <div>
          <span className="en-kicker">FUNCTIONAL PATTERN CHUNKS · KHÔNG HỌC NGỮ PHÁP CHẾT</span>
          <h2>Khung Phản xạ Pattern Chunks <span>· Phân bổ theo 3 độ tuổi</span></h2>
        </div>
        <span className="en-count"><Zap size={16}/> Mục tiêu: &lt; {(AGE_LEVEL_META[ageLevel].targetMs / 1000).toFixed(1)}s</span>
      </div>

      <div className="en-age-tabs" role="tablist" aria-label="Chọn cấp độ độ tuổi">
        {(['age4_6', 'age7_9', 'age10_12'] as AgeLevel[]).map((lvl) => {
          const meta = AGE_LEVEL_META[lvl];
          return (
            <button
              key={lvl}
              type="button"
              role="tab"
              aria-selected={ageLevel === lvl}
              className={`en-age-tab${ageLevel === lvl ? ' is-active' : ''}`}
              onClick={() => {
                stopSampleAudio();
                setAgeLevel(lvl);
                setChunkIdx(0);
                setSlotIdx(0);
                setAutoSpeedDrill(false);
              }}
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
            className={`en-chunk-pill${idx === chunkIdx % levelChunks.length ? ' is-on' : ''}`}
            onClick={() => {
              stopSampleAudio();
              setChunkIdx(idx);
              setSlotIdx(0);
            }}
          >
            <b>{c.pattern}</b>
            <small>{c.viPurpose}</small>
          </button>
        ))}
      </div>

      <div className="en-slot-stage">
        <div className="en-slot-visual">
          <span className="en-scene-tag">STIMULUS · {currentChunk.stimulusContext.toUpperCase()}</span>
          <Image
            src={`/emoji/f3d/${currentSlot.icon}.webp`}
            width={92}
            height={92}
            alt={currentSlot.slotEn}
            className="en-slot-art"
          />
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
                onClick={() => {
                  setSlotIdx(idx);
                  void speakText(s.fullSentence);
                }}
              >
                <Image src={`/emoji/f3d/${s.icon}.webp`} width={24} height={24} alt="" />
                <span>{s.slotEn}</span>
              </button>
            ))}
          </div>

          <div className="en-slot-actions">
            <button type="button" className="en-sound" onClick={() => void speakText(currentSlot.fullSentence)}>
              <Volume2 size={18}/> Nghe mẫu cụm này
            </button>
            <button
              type="button"
              className={`en-sound${autoSpeedDrill ? ' is-running' : ''}`}
              onClick={() => setAutoSpeedDrill((v) => !v)}
            >
              <Zap size={18}/> {autoSpeedDrill ? 'Dừng đổi tự động (2.5s)' : 'Đua tốc độ đổi hình (2.5s/câu)'}
            </button>
            <button
              type="button"
              className="en-primary"
              onClick={() => void startBossBattleRound(currentSlot.bossPrompt, currentSlot.fullSentence, currentChunk.targetLatencyMs)}
            >
              <Mic size={18}/> Đo phản xạ câu này (&lt; {(currentChunk.targetLatencyMs / 1000).toFixed(1)}s)
            </button>
          </div>

          {bossListening && (
            <div className="en-vad-meter is-inline">
              <span>🎙️ Micro VAD đang bắt mốc T1:</span>
              <div className="en-vad-bar"><i style={{ width: `${bossMicLevel}%` }} /></div>
              {bossLiveLatency !== null && <strong className="en-vad-latency">ΔT: {bossLiveLatency} ms</strong>}
              <button
                type="button"
                className="en-vad-stop"
                onClick={() => finishManualBossCapture(currentSlot.fullSentence, currentChunk.targetLatencyMs)}
              >
                <Square size={14}/> Chấm điểm
              </button>
            </div>
          )}

          {bossMetrics && (
            <div className={`en-reflex-scorecard is-${REFLEX_TIER_META[bossMetrics.tier].color}`}>
              <div className="en-rs-header">
                <span className="en-rs-badge">
                  {REFLEX_TIER_META[bossMetrics.tier].badge} {REFLEX_TIER_META[bossMetrics.tier].label} · {REFLEX_TIER_META[bossMetrics.tier].vi}
                </span>
                <strong className="en-rs-total">Reflex Score: {bossMetrics.reflexScore}/100 (+{REFLEX_TIER_META[bossMetrics.tier].expBonus} EXP)</strong>
              </div>
              <div className="en-rs-metrics">
                <div className="en-rs-metric">
                  <small>Độ trễ phản xạ (ΔT = T1 − T0)</small>
                  <b>{bossMetrics.latencyMs} ms</b>
                  <span>Mục tiêu: &le; {currentChunk.targetLatencyMs} ms (Điểm: {bossMetrics.speedScore})</span>
                </div>
                <div className="en-rs-metric">
                  <small>Độ chính xác (Accuracy)</small>
                  <b>{bossMetrics.accuracyScore}%</b>
                  <span>Trọng số 30%</span>
                </div>
                <div className="en-rs-metric">
                  <small>Độ trôi chảy (Fluency)</small>
                  <b>{bossMetrics.fluencyScore}/100</b>
                  <span>Thời lượng nói: {(bossMetrics.speechDurationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>

    <section className="en-journey" aria-label="Năm bước học tiếng Anh"><div className="en-journey-title"><div><span className="en-kicker">4-STEP REFLEX GAMEPLAY FLOW</span><h2>Quy trình Phản xạ 5 bước</h2></div><span className="en-count"><Sparkles size={16}/>{done.length}/10 chủ đề hoàn thành</span></div><ol>{STEPS.map((s,i)=><li key={s.en} className={i===step?'is-current':i<step?'is-past':''}><button onClick={()=>{stopSampleAudio();setStep(i);setReviewed(false);setBossMetrics(null);}}><Image className="en-step-icon" src={`/emoji/f3d/${STEP_ART[s.en]}.webp`} width={32} height={32} alt="" /> <b>{s.en}</b><small>{s.vi}</small></button>{i<STEPS.length-1&&<i aria-hidden="true"/>}</li>)}</ol></section>

    <section id="en-topics" className="en-topics"><div className="en-section-heading"><div><span className="en-kicker">CHOOSE YOUR ADVENTURE</span><h2>Learning Journey <span>· 10 Chủ đề Giao tiếp</span></h2></div><p>Chạm vào một chủ đề để luyện theo 200 tình huống thực tế.</p></div><div className="en-topic-grid">{TOPICS.map((t,i)=><button type="button" key={t.id} onClick={()=>{stopSampleAudio();setActive(i);setQuestionIndex(0);setStep(0);setPlaced([]);setChoice(null);setReviewed(false);setChallengeStarted(false);setSeconds(3);setBossMetrics(null);}} className={`en-topic-card${i===active?' is-selected':''}${done.includes(t.id)?' is-done':''}`}><Image className="en-topic-icon" src={`/emoji/f3d/${TOPIC_ART[t.id]}.webp`} width={36} height={36} alt=""/><span className="en-topic-name">{t.name}<small>{t.vi}</small><small>{ENGLISH_COMMUNICATION_BANK[t.id]?.length ?? 0} câu giao tiếp</small></span><span className="en-topic-state">{done.includes(t.id)?<><CheckCircle2 size={17}/> Hoàn thành</>:i===0||done.includes(TOPICS[i-1].id)?<><ArrowRight size={17}/> Bắt đầu</>:<><LockKeyhole size={15}/> Sẵn sàng</>}</span></button>)}</div></section>

    <section className="en-lesson" aria-live="polite"><header className="en-lesson-head"><div><span className="en-kicker"><Image className="en-inline-icon" src={`/emoji/f3d/${TOPIC_ART[topic.id]}.webp`} width={22} height={22} alt=""/> TOPIC {String(active+1).padStart(2,'0')} · A1</span><h2>{topic.name}</h2><p>{topic.vi}</p></div><div className="en-mode"><span>Chế độ</span><button className={mode==='learn'?'is-active':''} onClick={()=>{setMode('learn');setChallengeStarted(false);setReviewed(false);}}>Học tập</button><button className={mode==='challenge'?'is-active':''} onClick={()=>{setMode('challenge');setChallengeStarted(false);setReviewed(false);}}>Thử thách</button></div></header>
      <div className="en-progress-line"><i style={{width:`${(step+1)*20}%`}}/></div>
      {bankQuestion&&<div className="en-question-nav"><span><b>Ngân hàng câu hỏi · Câu {bankQuestion.number}</b><small>{questionIndex+1}/{topicBank.length} câu trong chủ đề</small></span><button type="button" onClick={nextQuestion}>Câu tiếp theo <ArrowRight size={17}/></button></div>}

      {/* STEP 1: SOUND-IMAGE IMPRINT (Mặc định ẩn dịch tiếng Việt để tránh dịch nhẩm) */}
      {step===0&&<div className="en-discover">
        <SentenceIllustration
          action={actionClause}
          reason={reasonClause}
          sentence={answer}
          storyId={bankQuestion?.storyId}
          topicId={topic.id}
          questionNumber={bankQuestion?.number}
          variant="full"
        />
        <div className="en-discover-copy"><span className="en-kicker">STEP 1 · SOUND-IMAGE IMPRINT · KHẮC SÂU HÌNH ẢNH &amp; ÂM THANH (KHÔNG DỊCH NHẨM)</span><h3>What is happening? <small>Quan sát tranh 3D và lắng nghe nhịp câu</small></h3>
        <div className="en-prosody-box" aria-label="Câu mẫu kèm hướng dẫn nhấn trọng âm và ngữ điệu">
          <p className="en-prosody-sentence">
            {prosodyTokens.map((tok) => (
              <span key={`${tok.wordIndex}-${tok.word}`} className="en-word-wrap">
                <span className={`en-word${tok.stressed ? ' is-stressed' : ' is-weak'}`}>{tok.word}</span>
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
          <div className="en-prosody-legend">
            <span><b className="en-legend-dot">• Từ đậm</b> Nhấn trọng âm</span>
            <span><b className="en-legend-rise">↗ |</b> Lên giọng nhẹ &amp; nghỉ nhịp</span>
            <span><b className="en-legend-fall">↘</b> Hạ giọng cuối câu</span>
          </div>
        </div>
        <div className="en-imprint-row">
          <button type="button" className="en-shadow-reveal" onClick={() => setShowViStep1((v) => !v)}>
            {showViStep1 ? <><EyeOff size={15}/> Ẩn nghĩa tiếng Việt (Chế độ Imprint)</> : <><Eye size={15}/> Hiện nghĩa tiếng Việt (khi cần)</>}
          </button>
          {showViStep1 && <p className="en-translation">{translation}</p>}
        </div>
        <div className="en-reason"><Lightbulb size={20}/><span><b>Pattern Structure · Khung cấu trúc</b><small>[Action: {actionClause}] ➔ [Purpose: {reason}]</small></span></div><button className="en-sound" onClick={() => void speakText()}><Volume2 size={19}/> {speakingSample ? 'Dừng nghe' : 'Nghe câu mẫu chuẩn ngữ điệu'} <span>{speakingSample ? 'Stop' : 'Listen'}</span></button><button className="en-next" onClick={()=>{stopSampleAudio();setStep(1);setChoice(null);setReviewed(false);}}>Sang phản xạ ý <ArrowRight size={18}/></button></div></div>}

      {/* STEP 2: REFLEX CHALLENGE */}
      {step===1&&<div className="en-reflex">
        <div className="en-reflex-title"><div className="en-picture small"><Image className="en-picture-art" src={`/emoji/f3d/${EXAMPLE_ART[topic.id]}.webp`} width={52} height={52} alt=""/></div><div><span className="en-kicker">STEP 2 · REFLEX CHALLENGE</span><h3>What is the purpose of this action?</h3><p>{bankQuestion?.action ?? `${e.subject} ${e.action}`} · Hãy phản xạ mục đích của hành động.</p></div><span className={`en-timer${seconds===0?' is-soft':''}`}>{mode==='challenge'&&challengeStarted?seconds:'∞'}{mode==='challenge'&&challengeStarted?'s':''}</span></div>
        <SentenceIllustration
          action={actionClause}
          reason={reasonClause}
          sentence={answer}
          storyId={bankQuestion?.storyId}
          topicId={topic.id}
          questionNumber={bankQuestion?.number}
          variant="compact"
          hidePurpose={!reviewed}
        />
        {mode==='challenge'&&!challengeStarted&&!reviewed?<div className="en-challenge-start"><Zap size={27}/><b>Sẵn sàng thử phản xạ 3 giây?</b><span>Trả lời nhanh để giữ chuỗi sao. Câu trả lời sai hoặc hết giờ sẽ được giải thích nhẹ nhàng.</span><button onClick={startChallenge}>Bắt đầu thử thách <ArrowRight size={18}/></button></div>:<><div className="en-options">{options.map((o,i)=><button key={o} disabled={reviewed} className={`en-option${choice===i?' is-picked':''}${reviewed&&i===answerIndex?' is-answer':''}${reviewed&&choice===i&&i!==answerIndex?' is-gentle':''}`} onClick={()=>{setChoice(i);setReviewed(true);setChallengeStarted(false);}}><span>{String.fromCharCode(65+i)}</span>{o}{reviewed&&i===answerIndex&&<Check size={20}/>}</button>)}</div>{reviewed&&<div className="en-feedback"><span>{choice===answerIndex?'🌟':'💛'}</span><div><b>{choice===answerIndex?'Brilliant thinking! · Em suy luận giỏi lắm!':'Good try! Let’s connect the ideas. · Mình cùng nối ý nhé!'}</b><p>{bankQuestion?.sentence ?? e.why}<br/><small>{translation}</small></p></div></div>}{!reviewed&&mode==='learn'&&<p className="en-gentle-note">Không cần vội đâu — hãy nhìn tranh hành động và đoán mục đích nhé. · Take your time!</p>}{reviewed&&<button className="en-next" onClick={()=>{stopSampleAudio();setStep(2);setPlaced([]);}}>Sang thay biến số &amp; ghép câu <ArrowRight size={18}/></button>}</>}
      </div>}

      {/* STEP 3: HIGH-SPEED SUBSTITUTION + SENTENCE BUILDER */}
      {step===2&&<div className="en-builder">
        <div className="en-builder-copy">
          <span className="en-kicker">STEP 3 · HIGH-SPEED SUBSTITUTION &amp; SENTENCE BUILDER</span>
          <h3>Luyện khung câu &amp; Đua tốc độ thay biến số</h3>
          <div className="en-step3-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={step3Mode === 'slot'} className={step3Mode === 'slot' ? 'is-active' : ''} onClick={() => setStep3Mode('slot')}>
              <Zap size={16}/> 1. Đua tốc độ Thay biến số (Slot Drill)
            </button>
            <button type="button" role="tab" aria-selected={step3Mode === 'builder'} className={step3Mode === 'builder' ? 'is-active' : ''} onClick={() => setStep3Mode('builder')}>
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

        {step3Mode === 'slot' ? (
          <div className="en-topic-slot-drill">
            <p className="en-slot-instruction">Giữ nguyên vế hành động <strong>“{actionClause}”</strong>, chạm nhanh các mục đích khác nhau để luyện phản xạ thay biến số:</p>
            <div className="en-slot-frame">
              <span className="en-frame-fixed">{actionClause} ↗ |</span>
              <span className="en-frame-variable">{options[choice ?? answerIndex] ?? reasonClause}</span>
            </div>
            <div className="en-options">
              {options.map((opt, idx) => {
                const full = `${actionClause.replace(/[.!?]+$/, '')} ${opt}`;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`en-option${(choice ?? answerIndex) === idx ? ' is-picked' : ''}${idx === answerIndex ? ' is-answer' : ''}`}
                    onClick={() => {
                      setChoice(idx);
                      void speakText(full);
                    }}
                  >
                    <span>{idx + 1}</span>
                    <b>{actionClause}</b> → <em>{opt}</em>
                    <Volume2 size={17} />
                  </button>
                );
              })}
            </div>
            <div className="en-builder-actions">
              <button className="en-sound" onClick={() => void speakText()}>
                <Volume2 size={18}/> Nghe câu chuẩn
              </button>
              <button className="en-next" onClick={() => { stopSampleAudio(); setStep(3); }}>
                Sang Rhythm Shadowing <ArrowRight size={18}/>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="en-canvas" aria-label="Câu của em">{words.map((_,i)=><span className={placed[i]!==undefined?'has-word':''} key={i}>{placed[i]!==undefined?words[placed[i]]:`Word ${i+1}`}</span>)}</div>
            <div className="en-word-bank"><span>WORD BANK · NGÂN HÀNG TỪ</span><div>{words.map((w,i)=><button key={`${w}-${i}`} disabled={placed.includes(i)} onClick={()=>setPlaced((p)=>[...p,i])}>{w}</button>)}</div></div>
            {placed.length===words.length&&<div className="en-feedback"><span>{placed.map((index)=>words[index]).join(' ')===answer.replace(/[.!?]+$/,'')?'✨':'💡'}</span><div><b>{placed.map((index)=>words[index]).join(' ')===answer.replace(/[.!?]+$/,'')?'Câu hoàn chỉnh! · Sentence complete!':'Thử sắp xếp lại thứ tự nhé. · Try the word order again.'}</b><p>{answer}<br/><small>{translation}</small></p></div></div>}
            <div className="en-builder-actions"><button className="en-sound" onClick={()=>setPlaced([])}><RotateCcw size={18}/> Làm lại</button>{placed.length===words.length&&<button className="en-sound" onClick={() => void speakText()}><Volume2 size={18}/> {speakingSample ? 'Dừng nghe' : 'Nghe câu vừa ghép'}</button>}{placed.length===words.length&&<button className="en-next" onClick={()=>{stopSampleAudio();setStep(3);}}>Sang Rhythm Shadowing <ArrowRight size={18}/></button>}</div>
          </>
        )}
      </div>}

      {/* STEP 4: RHYTHM SHADOWING & VAD LATENCY STUDIO */}
      {step===3&&bankQuestion&&<ShadowingStudio key={`${bankQuestion.storyId}-${bankQuestion.number}`} questions={ENGLISH_COMMUNICATION_STORIES[bankQuestion.storyId] ?? []} initialNumber={bankQuestion.number}/>}

      {/* STEP 5: THE REFLEX BOSS BATTLE */}
      {step===4&&<div className="en-apply">
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
            <strong>Tình huống bất ngờ:</strong> Cú Milo hỏi <em>“{bossQuestionText}”</em>. Em hãy bật tiếng đọc to cả câu trả lời trước khi đồng hồ chạm mốc <strong>1.2 giây</strong>!
          </p>
          <div className="en-sentence">
            <b>{answer}</b>
            {bossHintVisible && (
              <span className="en-visual-hint">
                💡 Gợi ý phản xạ nhanh: Hãy bắt đầu ngay bằng <strong>“{actionClause}…”</strong>! ({translation})
              </span>
            )}
          </div>
          <div className="en-boss-actions">
            <button
              type="button"
              className="en-primary"
              onClick={() => void startBossBattleRound(bossQuestionText, answer, 1200)}
            >
              <Play size={18}/> Bắt đầu Đấu Trùm (Nghe câu hỏi &amp; Bật phản xạ)
            </button>
            {bossListening && (
              <button
                type="button"
                className="en-vad-stop"
                onClick={() => finishManualBossCapture(answer, 1200)}
              >
                <Square size={15}/> Chấm điểm ngay
              </button>
            )}
            <button type="button" className="en-sound" onClick={() => void speakText()}>
              <Volume2 size={18}/> Nghe lại câu mẫu
            </button>
          </div>

          {bossListening && (
            <div className="en-vad-meter">
              <span>🎙️ Micro VAD đang đo độ trễ T1 − T0:</span>
              <div className="en-vad-bar"><i style={{ width: `${bossMicLevel}%` }} /></div>
              {bossLiveLatency !== null && <strong className="en-vad-latency">ΔT: {bossLiveLatency} ms</strong>}
            </div>
          )}

          {bossMetrics && (
            <div className={`en-reflex-scorecard is-${REFLEX_TIER_META[bossMetrics.tier].color}`}>
              <div className="en-rs-header">
                <span className="en-rs-badge">
                  {REFLEX_TIER_META[bossMetrics.tier].badge} {REFLEX_TIER_META[bossMetrics.tier].label} · {REFLEX_TIER_META[bossMetrics.tier].vi}
                </span>
                <strong className="en-rs-total">Reflex Score: {bossMetrics.reflexScore}/100 (+{REFLEX_TIER_META[bossMetrics.tier].expBonus} EXP)</strong>
              </div>
              <div className="en-rs-metrics">
                <div className="en-rs-metric">
                  <small>Độ trễ bật âm (ΔT = T1 − T0)</small>
                  <b>{bossMetrics.latencyMs} ms</b>
                  <span>Điểm tốc độ (50%): {bossMetrics.speedScore}/100</span>
                </div>
                <div className="en-rs-metric">
                  <small>Độ chính xác (Accuracy)</small>
                  <b>{bossMetrics.accuracyScore}%</b>
                  <span>Trọng số (30%): {bossMetrics.accuracyScore}/100</span>
                </div>
                <div className="en-rs-metric">
                  <small>Độ trôi chảy (Fluency)</small>
                  <b>{(bossMetrics.speechDurationMs / 1000).toFixed(1)}s</b>
                  <span>Trọng số (20%): {bossMetrics.fluencyScore}/100</span>
                </div>
              </div>
              <p className="en-rs-tip">{REFLEX_TIER_META[bossMetrics.tier].tip}</p>
            </div>
          )}

          {bossNote && <p className="en-shadow-audio-note">{bossNote}</p>}

          <button className="en-next" onClick={()=>{markComplete();nextTopic();}}>Hoàn thành chủ đề &amp; Nhận huy hiệu <CheckCircle2 size={19}/></button>
        </div>
      </div>}
      {step>0&&<button className="en-step-back" onClick={()=>{stopSampleAudio();setStep((s)=>s-1);setReviewed(false);setChallengeStarted(false);}}>← Bước trước · Previous step</button>}
    </section>
    <footer className="en-footer"><MiloMascot size={58}/><span><b>Small steps, bright ideas!</b><small>Mỗi bước nhỏ, một ý tưởng hay.</small></span><a href="#en-topics">Chọn chủ đề khác ↑</a></footer>
  </div>;
}
