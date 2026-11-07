'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Headphones, Lightbulb, LockKeyhole, Mic, RotateCcw, Sparkles, Volume2, Zap } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';

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
const STEPS = [{en:'Think',vi:'Tư duy',icon:'💭'},{en:'Connect',vi:'Liên kết',icon:'🔗'},{en:'Build',vi:'Ghép câu',icon:'🧩'},{en:'Speak',vi:'Luyện nói',icon:'🗣️'},{en:'Apply',vi:'Ứng dụng',icon:'🌟'}];
const PROGRESS_KEY = 'educhain-english-progress-v1';
const sentence = (e: Example) => `${e.subject} ${e.action} to ${e.base} ${e.purpose}.`;

export default function EnglishStudio() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [mode, setMode] = useState<'learn'|'challenge'>('learn');
  const [seconds, setSeconds] = useState(3);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const topic = TOPICS[active];
  const e = topic.example;
  const answer = sentence(e);
  const words = useMemo(() => [e.subject,e.action,'to',e.base,e.purpose], [e]);

  useEffect(() => { try { const saved = localStorage.getItem(PROGRESS_KEY); if (saved) setDone(JSON.parse(saved) as string[]); } catch { /* Keep the learning page usable when storage is unavailable. */ } }, []);
  useEffect(() => {
    if (!challengeStarted || seconds <= 0 || reviewed) return;
    const timer = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [challengeStarted, seconds, reviewed]);
  useEffect(() => { if (challengeStarted && seconds === 0) { setReviewed(true); setChoice(null); } }, [challengeStarted, seconds]);

  function markComplete() {
    const next = done.includes(topic.id) ? done : [...done, topic.id];
    setDone(next);
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* Progress remains available for this visit. */ }
  }
  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = 0.82; window.speechSynthesis.speak(utterance);
  }
  function nextTopic() { setActive((i) => (i + 1) % TOPICS.length); setStep(0); setPlaced([]); setChoice(null); setReviewed(false); setChallengeStarted(false); setSeconds(3); }
  function startChallenge() { setMode('challenge'); setSeconds(3); setChoice(null); setReviewed(false); setChallengeStarted(true); }
  const options = [e.why, `Because ${e.action} is fun.`, `Because ${e.purpose} is a person.`];

  return <div className="en-studio">
    <header className="en-hero">
      <div className="en-hero-copy"><Link href="/hoc-sinh" className="en-back"><ArrowLeft size={18}/> Trang của em</Link><p className="en-kicker">ENGLISH JOURNEY · A1</p><h1>Think. Connect. Speak.</h1><p>Học tiếng Anh bằng cách kết nối ý tưởng và nói thành câu tự nhiên.</p><p className="en-hero-vi">Tư duy · Liên kết · Nói tiếng Anh tự nhiên</p><div className="en-hero-actions"><a className="en-primary" href="#en-topics">Tiếp tục hành trình <ArrowRight size={18}/></a><Link className="en-secondary" href="/chon-bai?subject=tieng-anh">Bài tiếng Anh trong sách <BookOpen size={17}/></Link></div></div>
      <div className="en-mascot"><span className="en-speech">Let’s think in English!<small>Mình cùng tư duy bằng tiếng Anh nhé!</small></span><MiloMascot size={142}/></div>
    </header>

    <section className="en-journey" aria-label="Năm bước học tiếng Anh"><div className="en-journey-title"><div><span className="en-kicker">YOUR LEARNING FLOW</span><h2>Hành trình 5 bước</h2></div><span className="en-count"><Sparkles size={16}/>{done.length}/10 chủ đề hoàn thành</span></div><ol>{STEPS.map((s,i)=><li key={s.en} className={i===step?'is-current':i<step?'is-past':''}><button onClick={()=>{setStep(i);setReviewed(false);}}><span className="en-step-icon">{s.icon}</span><b>{s.en}</b><small>{s.vi}</small></button>{i<STEPS.length-1&&<i aria-hidden="true"/>}</li>)}</ol></section>

    <section id="en-topics" className="en-topics"><div className="en-section-heading"><div><span className="en-kicker">CHOOSE YOUR ADVENTURE</span><h2>Learning Journey <span>· Hành trình học tập</span></h2></div><p>Chạm vào một chủ đề để bắt đầu khám phá.</p></div><div className="en-topic-grid">{TOPICS.map((t,i)=><button type="button" key={t.id} onClick={()=>{setActive(i);setStep(0);setPlaced([]);setChoice(null);setReviewed(false);setChallengeStarted(false);setSeconds(3);}} className={`en-topic-card${i===active?' is-selected':''}${done.includes(t.id)?' is-done':''}`}><span className="en-topic-icon">{t.icon}</span><span className="en-topic-name">{t.name}<small>{t.vi}</small></span><span className="en-topic-state">{done.includes(t.id)?<><CheckCircle2 size={17}/> Hoàn thành</>:i===0||done.includes(TOPICS[i-1].id)?<><ArrowRight size={17}/> Bắt đầu</>:<><LockKeyhole size={15}/> Sẵn sàng</>}</span></button>)}</div></section>

    <section className="en-lesson" aria-live="polite"><header className="en-lesson-head"><div><span className="en-kicker">{topic.icon} TOPIC {String(active+1).padStart(2,'0')} · A1</span><h2>{topic.name}</h2><p>{topic.vi}</p></div><div className="en-mode"><span>Chế độ</span><button className={mode==='learn'?'is-active':''} onClick={()=>{setMode('learn');setChallengeStarted(false);setReviewed(false);}}>Học tập</button><button className={mode==='challenge'?'is-active':''} onClick={()=>{setMode('challenge');setChallengeStarted(false);setReviewed(false);}}>Thử thách</button></div></header>
      <div className="en-progress-line"><i style={{width:`${(step+1)*20}%`}}/></div>
      {step===0&&<div className="en-discover"><div className="en-picture" role="img" aria-label={topic.vi}>{e.icon}<span>{e.icon==='🎒'?'Ready for school!':e.icon==='📚'?'A curious reader':e.icon==='🧼'?'Clean hands!':e.icon==='🍽️'?'Helping at home':e.icon==='🤝'?'Kind friends':e.icon==='🏃'?'Let’s move!':e.icon==='🌱'?'Care for nature':e.icon==='🍓'?'Yummy and healthy':e.icon==='🚸'?'Cross safely': 'Creative ideas!'}</span></div><div className="en-discover-copy"><span className="en-kicker">STEP 1 · THINK & CONNECT · TƯ DUY & LIÊN KẾT</span><h3>What is happening? <small>Điều gì đang xảy ra?</small></h3><p className="en-prompt">{e.subject} <b>{e.action}</b> <span>→</span> wants to <b>{e.base}</b> <span>→</span> {e.purpose}</p><p className="en-translation">{e.vi}</p><div className="en-reason"><Lightbulb size={20}/><span><b>Connect the ideas</b><small>{e.why}<br/>Kết nối hành động với mục đích.</small></span></div><button className="en-sound" onClick={()=>speak(answer)}><Volume2 size={19}/> Nghe câu mẫu <span>Listen</span></button><button className="en-next" onClick={()=>{setStep(1);setChoice(null);setReviewed(false);}}>Khám phá tiếp <ArrowRight size={18}/></button></div></div>}
      {step===1&&<div className="en-reflex"><div className="en-reflex-title"><div className="en-picture small">{e.icon}</div><div><span className="en-kicker">STEP 2 · REFLEX CHALLENGE</span><h3>Why does {e.subject.toLowerCase()} {e.action}?</h3><p>{e.subject} {e.action} …? · Vì sao?</p></div><span className={`en-timer${seconds===0?' is-soft':''}`}>{mode==='challenge'&&challengeStarted?seconds:'∞'}{mode==='challenge'&&challengeStarted?'s':''}</span></div>
        {mode==='challenge'&&!challengeStarted&&!reviewed?<div className="en-challenge-start"><Zap size={27}/><b>Sẵn sàng thử phản xạ 3 giây?</b><span>Trả lời nhanh để giữ chuỗi sao. Câu trả lời sai hoặc hết giờ sẽ được giải thích nhẹ nhàng.</span><button onClick={startChallenge}>Bắt đầu thử thách <ArrowRight size={18}/></button></div>:<><div className="en-options">{options.map((o,i)=><button key={o} disabled={reviewed} className={`en-option${choice===i?' is-picked':''}${reviewed&&i===0?' is-answer':''}${reviewed&&choice===i&&i!==0?' is-gentle':''}`} onClick={()=>{setChoice(i);setReviewed(true);setChallengeStarted(false);}}><span>{String.fromCharCode(65+i)}</span>{o}{reviewed&&i===0&&<Check size={20}/>}</button>)}</div>{reviewed&&<div className="en-feedback"><span>{choice===0?'🌟':'💛'}</span><div><b>{choice===0?'Brilliant thinking! · Em suy luận giỏi lắm!':'Good try! Let’s connect the ideas. · Mình cùng nối ý nhé!'}</b><p>{e.why}<br/><small>{e.vi}</small></p></div></div>}{!reviewed&&mode==='learn'&&<p className="en-gentle-note">Không cần vội đâu — hãy nghĩ về hành động và mục đích nhé. · Take your time!</p>}{reviewed&&<button className="en-next" onClick={()=>{setStep(2);setPlaced([]);}}>Sang ghép câu <ArrowRight size={18}/></button>}</>}
      </div>}
      {step===2&&<div className="en-builder"><div className="en-builder-copy"><span className="en-kicker">STEP 3 · SENTENCE BUILDER</span><h3>Build the sentence <small>Chạm từ để ghép câu</small></h3><p>Subject + Action + to + Base verb + Purpose</p></div><div className="en-canvas" aria-label="Câu của em">{words.map((_,i)=><span className={placed[i]?'has-word':''} key={i}>{placed[i]??(['Subject','Action','to','Base verb','Purpose'][i])}</span>)}</div><div className="en-word-bank"><span>WORD BANK · NGÂN HÀNG TỪ</span><div>{words.map((w,i)=><button key={`${w}-${i}`} disabled={placed.includes(w)} onClick={()=>setPlaced((p)=>[...p,w])}>{w}</button>)}</div></div>{placed.length===words.length&&<div className="en-feedback"><span>{placed.join(' ')===answer.slice(0,-1)?'✨':'💡'}</span><div><b>{placed.join(' ')===answer.slice(0,-1)?'Câu hoàn chỉnh! · Sentence complete!':'Thử sắp xếp lại thứ tự nhé. · Try the word order again.'}</b><p>{answer}<br/><small>{e.vi}</small></p></div></div>}<div className="en-builder-actions"><button className="en-sound" onClick={()=>setPlaced([])}><RotateCcw size={18}/> Làm lại</button>{placed.length===words.length&&<button className="en-next" onClick={()=>{setStep(3);}}>Luyện nói <ArrowRight size={18}/></button>}</div></div>}
      {step===3&&<div className="en-speak"><div className="en-speak-art">🗣️</div><div><span className="en-kicker">STEP 4 · LISTEN & SPEAK</span><h3>Listen, then say it aloud. <small>Nghe mẫu rồi nói theo.</small></h3><div className="en-sentence"><b>{answer}</b><span>{e.vi}</span></div><div className="en-speak-actions"><button className="en-sound" onClick={()=>speak(answer)}><Headphones size={20}/> Nghe mẫu · Listen</button><button className="en-next" onClick={()=>speak(answer)}><Mic size={20}/> Nói theo · Speak</button></div><p>Chạm “Nói theo” để nghe câu mẫu và luyện phát âm. · Tap to hear the model and practice.</p></div></div>}
      {step===4&&<div className="en-apply"><div className="en-apply-art">{e.icon}</div><div><span className="en-kicker">STEP 5 · APPLY IN REAL LIFE</span><h3>Use it in your day! <small>Thử áp dụng vào cuộc sống!</small></h3><div className="en-sentence"><b>{e.why}</b><span>{e.vi}</span></div><p>Can you think of another reason? · Em nghĩ thêm được lý do nào không?</p><button className="en-next" onClick={()=>{markComplete();nextTopic();}}>Hoàn thành chủ đề <CheckCircle2 size={19}/></button></div></div>}
      {step>0&&<button className="en-step-back" onClick={()=>{setStep((s)=>s-1);setReviewed(false);setChallengeStarted(false);}}>← Bước trước · Previous step</button>}
    </section>
    <footer className="en-footer"><MiloMascot size={58}/><span><b>Small steps, bright ideas!</b><small>Mỗi bước nhỏ, một ý tưởng hay.</small></span><a href="#en-topics">Chọn chủ đề khác ↑</a></footer>
  </div>;
}
