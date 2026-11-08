'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Lightbulb, LockKeyhole, RotateCcw, Sparkles, Volume2, Zap } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import ShadowingStudio from '@/components/english/ShadowingStudio';
import SentenceIllustration from '@/components/english/SentenceIllustration';
import { createClient } from '@/lib/supabase/client';
import { ENGLISH_COMMUNICATION_BANK, ENGLISH_COMMUNICATION_STORIES } from '@/lib/english/communicationBank';
import { analyzeSentenceProsody, toProsodicSentence } from '@/lib/english/prosody';

type Example = { subject: string; action: string; base: string; purpose: string; vi: string; why: string; icon: string };
type Topic = { id: string; name: string; vi: string; icon: string; example: Example };

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
const STEPS = [{en:'Think',vi:'Tư duy',icon:'💭'},{en:'Connect',vi:'Liên kết',icon:'🔗'},{en:'Build',vi:'Ghép câu',icon:'🧩'},{en:'Shadowing',vi:'Nghe & đọc theo',icon:'🎧'},{en:'Apply',vi:'Ứng dụng',icon:'🌟'}];
const PROGRESS_KEY = 'educhain-english-progress-v1';
const sentence = (e: Example) => `${e.subject} ${e.action} to ${e.base} ${e.purpose}.`;

export default function EnglishStudio() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [mode, setMode] = useState<'learn'|'challenge'>('learn');
  const [seconds, setSeconds] = useState(3);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [speakingSample, setSpeakingSample] = useState(false);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);

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
  useEffect(() => () => {
    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current = null;
    }
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
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setSpeakingSample(false);
  }

  async function speak() {
    if (speakingSample) {
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

    // 1. Ưu tiên phát file thu mẫu Neural trên Supabase Storage nếu có
    if (bankQuestion && supabase) {
      const clipName = `${String(bankQuestion.storyIndex).padStart(3, '0')}.mp3`;
      const { data } = supabase.storage.from('english-shadowing-audio').getPublicUrl(`${bankQuestion.storyId}/${clipName}`);
      const ok = await tryPlayUrl(data.publicUrl, 0.94);
      if (ok) {
        setSpeakingSample(false);
        return;
      }
    }

    // 2. Phát qua /api/tts Neural 24kHz có dấu ngắt nhịp prosodic (action, reason)
    const prosodicText = toProsodicSentence({ action: actionClause, reason: reasonClause, sentence: answer });
    const ttsOk = await tryPlayUrl(`/api/tts?lang=en&q=${encodeURIComponent(prosodicText)}`, 0.94);
    if (ttsOk) {
      setSpeakingSample(false);
      return;
    }

    // 3. Fallback ngoại tuyến qua Web Speech API (ưu tiên giọng Natural/Online/Google)
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

  function nextTopic() { stopSampleAudio(); setActive((i) => (i + 1) % TOPICS.length); setQuestionIndex(0); setStep(0); setPlaced([]); setChoice(null); setReviewed(false); setChallengeStarted(false); setSeconds(3); }
  function nextQuestion() { stopSampleAudio(); setQuestionIndex((i) => (i + 1) % Math.max(topicBank.length, 1)); setStep(0); setPlaced([]); setChoice(null); setReviewed(false); setChallengeStarted(false); setSeconds(3); }
  function startChallenge() { setMode('challenge'); setSeconds(3); setChoice(null); setReviewed(false); setChallengeStarted(true); }

  return <div className="en-studio">
    <header className="en-hero">
      <div className="en-hero-copy"><Link href="/hoc-sinh" className="en-back"><ArrowLeft size={18}/> Trang của em</Link><p className="en-kicker">ENGLISH JOURNEY · A1</p><h1>Think. Connect. Speak.</h1><p>Học tiếng Anh bằng cách kết nối ý tưởng và nói thành câu tự nhiên.</p><p className="en-hero-vi">Tư duy · Liên kết · Nói tiếng Anh tự nhiên</p><div className="en-hero-actions"><a className="en-primary" href="#en-topics">Tiếp tục hành trình <ArrowRight size={18}/></a><Link className="en-secondary" href="/chon-bai?subject=tieng-anh">Bài tiếng Anh trong sách <BookOpen size={17}/></Link></div></div>
      <div className="en-mascot"><span className="en-speech">Let’s think in English!<small>Mình cùng tư duy bằng tiếng Anh nhé!</small></span><MiloMascot size={142}/></div>
    </header>

    <section className="en-journey" aria-label="Năm bước học tiếng Anh"><div className="en-journey-title"><div><span className="en-kicker">YOUR LEARNING FLOW</span><h2>Hành trình 5 bước</h2></div><span className="en-count"><Sparkles size={16}/>{done.length}/10 chủ đề hoàn thành</span></div><ol>{STEPS.map((s,i)=><li key={s.en} className={i===step?'is-current':i<step?'is-past':''}><button onClick={()=>{stopSampleAudio();setStep(i);setReviewed(false);}}><Image className="en-step-icon" src={`/emoji/f3d/${STEP_ART[s.en]}.webp`} width={32} height={32} alt="" /> <b>{s.en}</b><small>{s.vi}</small></button>{i<STEPS.length-1&&<i aria-hidden="true"/>}</li>)}</ol></section>

    <section id="en-topics" className="en-topics"><div className="en-section-heading"><div><span className="en-kicker">CHOOSE YOUR ADVENTURE</span><h2>Learning Journey <span>· Hành trình học tập</span></h2></div><p>Chạm vào một chủ đề để bắt đầu khám phá.</p></div><div className="en-topic-grid">{TOPICS.map((t,i)=><button type="button" key={t.id} onClick={()=>{stopSampleAudio();setActive(i);setQuestionIndex(0);setStep(0);setPlaced([]);setChoice(null);setReviewed(false);setChallengeStarted(false);setSeconds(3);}} className={`en-topic-card${i===active?' is-selected':''}${done.includes(t.id)?' is-done':''}`}><Image className="en-topic-icon" src={`/emoji/f3d/${TOPIC_ART[t.id]}.webp`} width={36} height={36} alt=""/><span className="en-topic-name">{t.name}<small>{t.vi}</small><small>{ENGLISH_COMMUNICATION_BANK[t.id]?.length ?? 0} câu giao tiếp</small></span><span className="en-topic-state">{done.includes(t.id)?<><CheckCircle2 size={17}/> Hoàn thành</>:i===0||done.includes(TOPICS[i-1].id)?<><ArrowRight size={17}/> Bắt đầu</>:<><LockKeyhole size={15}/> Sẵn sàng</>}</span></button>)}</div></section>

    <section className="en-lesson" aria-live="polite"><header className="en-lesson-head"><div><span className="en-kicker"><Image className="en-inline-icon" src={`/emoji/f3d/${TOPIC_ART[topic.id]}.webp`} width={22} height={22} alt=""/> TOPIC {String(active+1).padStart(2,'0')} · A1</span><h2>{topic.name}</h2><p>{topic.vi}</p></div><div className="en-mode"><span>Chế độ</span><button className={mode==='learn'?'is-active':''} onClick={()=>{setMode('learn');setChallengeStarted(false);setReviewed(false);}}>Học tập</button><button className={mode==='challenge'?'is-active':''} onClick={()=>{setMode('challenge');setChallengeStarted(false);setReviewed(false);}}>Thử thách</button></div></header>
      <div className="en-progress-line"><i style={{width:`${(step+1)*20}%`}}/></div>
      {bankQuestion&&<div className="en-question-nav"><span><b>Ngân hàng câu hỏi · Câu {bankQuestion.number}</b><small>{questionIndex+1}/{topicBank.length} câu trong chủ đề</small></span><button type="button" onClick={nextQuestion}>Câu tiếp theo <ArrowRight size={17}/></button></div>}
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
        <div className="en-discover-copy"><span className="en-kicker">STEP 1 · THINK &amp; CONNECT · TƯ DUY &amp; LIÊN KẾT</span><h3>What is happening? <small>Điều gì đang xảy ra?</small></h3>
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
        <p className="en-translation">{translation}</p><div className="en-reason"><Lightbulb size={20}/><span><b>Connect the ideas</b><small>{actionClause} → {reason}<br/>Kết nối hành động với mục đích.</small></span></div><button className="en-sound" onClick={() => void speak()}><Volume2 size={19}/> {speakingSample ? 'Dừng nghe' : 'Nghe câu mẫu chuẩn ngữ điệu'} <span>{speakingSample ? 'Stop' : 'Listen'}</span></button><button className="en-next" onClick={()=>{stopSampleAudio();setStep(1);setChoice(null);setReviewed(false);}}>Khám phá tiếp <ArrowRight size={18}/></button></div></div>}
      {step===1&&<div className="en-reflex">
        <div className="en-reflex-title"><div className="en-picture small"><Image className="en-picture-art" src={`/emoji/f3d/${EXAMPLE_ART[topic.id]}.webp`} width={52} height={52} alt=""/></div><div><span className="en-kicker">STEP 2 · REFLEX CHALLENGE</span><h3>What is the purpose of this action?</h3><p>{bankQuestion?.action ?? `${e.subject} ${e.action}`} · Hãy nghĩ về mục đích.</p></div><span className={`en-timer${seconds===0?' is-soft':''}`}>{mode==='challenge'&&challengeStarted?seconds:'∞'}{mode==='challenge'&&challengeStarted?'s':''}</span></div>
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
        {mode==='challenge'&&!challengeStarted&&!reviewed?<div className="en-challenge-start"><Zap size={27}/><b>Sẵn sàng thử phản xạ 3 giây?</b><span>Trả lời nhanh để giữ chuỗi sao. Câu trả lời sai hoặc hết giờ sẽ được giải thích nhẹ nhàng.</span><button onClick={startChallenge}>Bắt đầu thử thách <ArrowRight size={18}/></button></div>:<><div className="en-options">{options.map((o,i)=><button key={o} disabled={reviewed} className={`en-option${choice===i?' is-picked':''}${reviewed&&i===answerIndex?' is-answer':''}${reviewed&&choice===i&&i!==answerIndex?' is-gentle':''}`} onClick={()=>{setChoice(i);setReviewed(true);setChallengeStarted(false);}}><span>{String.fromCharCode(65+i)}</span>{o}{reviewed&&i===answerIndex&&<Check size={20}/>}</button>)}</div>{reviewed&&<div className="en-feedback"><span>{choice===answerIndex?'🌟':'💛'}</span><div><b>{choice===answerIndex?'Brilliant thinking! · Em suy luận giỏi lắm!':'Good try! Let’s connect the ideas. · Mình cùng nối ý nhé!'}</b><p>{bankQuestion?.sentence ?? e.why}<br/><small>{translation}</small></p></div></div>}{!reviewed&&mode==='learn'&&<p className="en-gentle-note">Không cần vội đâu — hãy nghĩ về hành động và mục đích nhé. · Take your time!</p>}{reviewed&&<button className="en-next" onClick={()=>{stopSampleAudio();setStep(2);setPlaced([]);}}>Sang ghép câu <ArrowRight size={18}/></button>}</>}
      </div>}
      {step===2&&<div className="en-builder"><div className="en-builder-copy"><span className="en-kicker">STEP 3 · SENTENCE BUILDER</span><h3>Build the sentence <small>Chạm từ để ghép câu</small></h3><p>Rebuild the sentence from the mixed word bank.</p></div>
        <SentenceIllustration
          action={actionClause}
          reason={reasonClause}
          sentence={answer}
          storyId={bankQuestion?.storyId}
          topicId={topic.id}
          questionNumber={bankQuestion?.number}
          variant="compact"
        />
        <div className="en-canvas" aria-label="Câu của em">{words.map((_,i)=><span className={placed[i]!==undefined?'has-word':''} key={i}>{placed[i]!==undefined?words[placed[i]]:`Word ${i+1}`}</span>)}</div><div className="en-word-bank"><span>WORD BANK · NGÂN HÀNG TỪ</span><div>{words.map((w,i)=><button key={`${w}-${i}`} disabled={placed.includes(i)} onClick={()=>setPlaced((p)=>[...p,i])}>{w}</button>)}</div></div>{placed.length===words.length&&<div className="en-feedback"><span>{placed.map((index)=>words[index]).join(' ')===answer.replace(/[.!?]+$/,'')?'✨':'💡'}</span><div><b>{placed.map((index)=>words[index]).join(' ')===answer.replace(/[.!?]+$/,'')?'Câu hoàn chỉnh! · Sentence complete!':'Thử sắp xếp lại thứ tự nhé. · Try the word order again.'}</b><p>{answer}<br/><small>{translation}</small></p></div></div>}<div className="en-builder-actions"><button className="en-sound" onClick={()=>setPlaced([])}><RotateCcw size={18}/> Làm lại</button>{placed.length===words.length&&<button className="en-sound" onClick={() => void speak()}><Volume2 size={18}/> {speakingSample ? 'Dừng nghe' : 'Nghe câu vừa ghép'}</button>}{placed.length===words.length&&<button className="en-next" onClick={()=>{stopSampleAudio();setStep(3);}}>Luyện nói <ArrowRight size={18}/></button>}</div></div>}
      {step===3&&bankQuestion&&<ShadowingStudio key={`${bankQuestion.storyId}-${bankQuestion.number}`} questions={ENGLISH_COMMUNICATION_STORIES[bankQuestion.storyId] ?? []} initialNumber={bankQuestion.number}/>}
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
        <div><span className="en-kicker">STEP 5 · APPLY IN REAL LIFE</span><h3>Use it in your day! <small>Thử áp dụng vào cuộc sống!</small></h3><div className="en-sentence"><b>{answer}</b><span>{translation}</span></div><p>Can you think of another reason? · Em nghĩ thêm được lý do nào không?</p><button className="en-next" onClick={()=>{markComplete();nextTopic();}}>Hoàn thành chủ đề <CheckCircle2 size={19}/></button></div></div>}
      {step>0&&<button className="en-step-back" onClick={()=>{stopSampleAudio();setStep((s)=>s-1);setReviewed(false);setChallengeStarted(false);}}>← Bước trước · Previous step</button>}
    </section>
    <footer className="en-footer"><MiloMascot size={58}/><span><b>Small steps, bright ideas!</b><small>Mỗi bước nhỏ, một ý tưởng hay.</small></span><a href="#en-topics">Chọn chủ đề khác ↑</a></footer>
  </div>;
}
