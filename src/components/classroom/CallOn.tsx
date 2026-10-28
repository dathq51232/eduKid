'use client';

// Gọi tên – Dò bài: 5 kiểu gọi (vòng quay, bốc thăm, đua thú, trứng nở, bịt mắt bắt vịt) để chiếu lên màn hình lớp.
// Không gọi lại em đã lên, bỏ qua em vắng, hiện một câu dò bài theo bài đang học, chấm ✓ ✗ ★.
// Trạng thái gọi tên lưu trên máy đang chiếu (localStorage). Em trả lời đúng / phát biểu hay thì tự thêm
// "★ Phát biểu tốt" vào Sổ lớp hôm nay (migration 0038; chưa chạy thì chỉ đếm trên máy).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, EyeOff, Maximize2, Timer, Minimize2, RotateCcw, Users, Volume2, VolumeX, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MiloMascot, { type MiloVariant } from '@/components/mascot/MiloMascot';
import DuckCatch from '@/components/classroom/DuckCatch';
import {
  CALL_MODES, DURATIONS, addTally, duckPen, raceLineup, candidatesOf, lotHops, lotsFor, pickOne, presentOf, raceFor, racePos, restoreState, shortName, sliceAt, spinEase, spinTurns, wheelAngle,
  type CallMode, type CallState, type RaceSlot, type Student, type Tally,
} from '@/lib/classroom/callon';
import { bookLessons, lessonPool, type ExamQuestion } from '@/lib/exams/matrix';
import { useGradeContent } from '@/components/learn/GradeReady';
import { answerText } from '@/lib/exams/word';
import type { SubjectCode } from '@/lib/types';

const SUBJECTS: { code: SubjectCode; name: string; milo: MiloVariant }[] = [
  { code: 'toan', name: 'Toán', milo: 'professor' },
  { code: 'tieng-viet', name: 'Tiếng Việt', milo: 'artist' },
  { code: 'tieng-anh', name: 'Tiếng Anh', milo: 'astronaut' },
];
const COLORS = ['#2457c5', '#d93f45', '#1f9d6b', '#ffc83d', '#6d3fe0', '#2f8de0'];
const LETTERS = 'ABCDEFGH';
/** Nhãn ghi vào Sổ lớp và lời nhận xét hiện trên thẻ khi chấm */
const OK_TAG = '★ Phát biểu tốt';
const TRY_TAG = 'Cần cố gắng hơn';
const OK_LINES = ['Em phát biểu rất tốt! 🌟', 'Giỏi quá! Cả lớp cho bạn một tràng pháo tay nhé! 👏', 'Chính xác! Em học bài rất chăm. ⭐', 'Tuyệt vời! Em trả lời to, rõ và đúng. 🎉'];
const TRY_LINES = ['Em cần cố gắng hơn, về ôn lại bài nhé! 💪', 'Gần đúng rồi! Lần sau em sẽ làm được. 🌱', 'Không sao đâu, mình cùng xem lại đáp án nhé! 📖', 'Em chú ý nghe giảng hơn nữa nhé, cô tin em làm được! 💪'];
const pickLine = (a: string[]) => a[Math.floor(Math.random() * a.length)];

type Phase = 'idle' | 'running' | 'done';
type RaceLane = ReturnType<typeof raceFor>[number];

const hashId = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];

/* ------------------------------------------------------------ âm thanh (WebAudio, tự tạo, không cần file) */
// Mỗi kiểu một bộ tiếng: vòng quay "tách tách", bốc thăm tiếng xào giấy + đàn gõ, đua thú tiếng bước chạy + còi + reo hò,
// trứng nở tiếng gõ cốc cốc + trống dồn + vỏ nứt + gà con chiêm chiếp.
function useSound(on: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  const noiseBuf = useRef<AudioBuffer | null>(null);
  const audio = useCallback(() => {
    if (!on || typeof window === 'undefined') return null;
    try {
      ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (ctx.current.state === 'suspended') void ctx.current.resume();
      return ctx.current;
    } catch { return null; }
  }, [on]);
  const beep = useCallback((freq: number, ms = 60, type: OscillatorType = 'triangle', vol = 0.08, toFreq?: number) => {
    const c = audio(); if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + ms / 1000);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
    } catch { /* bỏ qua */ }
  }, [audio]);
  /** tiếng ồn đã lọc: bước chân, xào giấy, vỏ nứt, reo hò */
  const noise = useCallback((ms: number, freq: number, vol = 0.2, type: BiquadFilterType = 'bandpass', q = 1.2, toFreq?: number, attack = 0) => {
    const c = audio(); if (!c) return;
    try {
      if (!noiseBuf.current) {
        const b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0);
        for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
        noiseBuf.current = b;
      }
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime, end = t + ms / 1000;
      src.buffer = noiseBuf.current; src.loop = true;
      f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
      if (toFreq) f.frequency.exponentialRampToValueAtTime(toFreq, end);
      g.gain.setValueAtTime(attack ? 0.0001 : vol, t);
      if (attack) g.gain.exponentialRampToValueAtTime(vol, t + attack / 1000);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      src.connect(f).connect(g).connect(c.destination); src.start(t); src.stop(end + 0.02);
    } catch { /* bỏ qua */ }
  }, [audio]);
  const at = (fn: () => void, ms: number) => window.setTimeout(fn, ms);

  // vòng quay: tiếng lẫy "tách", trầm dần khi chậm lại
  const tick = useCallback((x = 0) => { beep(1300 - 500 * x, 26, 'square', 0.03); noise(18, 3000 - 1200 * x, 0.06, 'highpass', 0.7); }, [beep, noise]);
  // bốc thăm: nốt đàn gõ cho mỗi bước đèn chạy (thang ngũ cung), tiếng lật "vút", tiếng xào thăm
  const chime = useCallback((x = 0) => { const f = PENTA[Math.floor(Math.random() * PENTA.length)] * (x > 0.85 ? 0.5 : 1); beep(f, 220, 'sine', 0.09); beep(f * 2.76, 90, 'sine', 0.02); }, [beep]);
  const whoosh = useCallback(() => noise(380, 400, 0.18, 'bandpass', 0.8, 3500, 60), [noise]);
  const riffle = useCallback((ms = 1100) => { for (let t = 0; t < ms; t += 28 + Math.random() * 22) at(() => noise(22, 2500 + Math.random() * 2500, 0.08, 'bandpass', 1.5), t); }, [noise]);
  // đua thú: đếm ngược, còi xuất phát, bước chân, reo hò
  const countBeep = useCallback((last = false) => beep(last ? 1046 : 523, last ? 420 : 180, 'square', 0.06), [beep]);
  const whistle = useCallback(() => { beep(2600, 500, 'sine', 0.06); beep(2750, 500, 'sine', 0.04); }, [beep]);
  const step = useCallback((x = 0, heavy = false) => { noise(heavy ? 90 : 55, heavy ? 160 : 320 + Math.random() * 120, heavy ? 0.5 : 0.32, 'lowpass', 0.9); if (!heavy) beep(90 + x * 40, 40, 'sine', 0.07); }, [beep, noise]);
  const cheer = useCallback(() => { noise(1600, 1400, 0.12, 'bandpass', 0.6, 900, 250); noise(1400, 2400, 0.06, 'bandpass', 0.8, 1600, 300); }, [noise]);
  const dice = useCallback(() => { for (let t = 0; t < 700; t += 50 + Math.random() * 60) at(() => { noise(30, 1800 + Math.random() * 1500, 0.15, 'bandpass', 2); beep(700 + Math.random() * 500, 25, 'square', 0.02); }, t); }, [beep, noise]);
  // trứng nở: gõ cốc cốc, trống dồn, vỏ nứt, gà con
  const knock = useCallback((n = 1) => { beep(170 + n * 40, 90, 'triangle', 0.16); noise(50, 1100 + n * 200, 0.25, 'bandpass', 3); }, [beep, noise]);
  const drum = useCallback(() => { beep(110 + Math.random() * 30, 80, 'triangle', 0.13); noise(60, 200, 0.18, 'lowpass', 0.8); }, [beep, noise]);
  const crack = useCallback(() => { for (let k = 0; k < 7; k++) at(() => noise(35, 3000 + Math.random() * 3000, 0.22, 'highpass', 0.8), k * 45 + Math.random() * 20); }, [noise]);
  const chirp = useCallback(() => { [0, 170, 420, 590].forEach((t) => at(() => beep(2200, 110, 'sine', 0.07, 3400), t)); }, [beep]);
  /** tiếng vịt kêu "quạc quạc" */
  const quack = useCallback(() => { beep(560, 120, 'sawtooth', 0.045, 420); at(() => beep(540, 130, 'sawtooth', 0.04, 400), 170); }, [beep]);
  /** "ta-da": hợp âm rồi chuỗi nốt lấp lánh */
  const fanfare = useCallback(() => {
    [392, 523, 659].forEach((f) => beep(f, 420, 'square', 0.04));
    [784, 988, 1175, 1568].forEach((f, i) => at(() => beep(f, 260, 'triangle', 0.06), 220 + i * 90));
    at(() => [523, 659, 784, 1047].forEach((f) => beep(f, 700, 'triangle', 0.045)), 620);
  }, [beep]);
  /** trả lời đúng: "ting ting" đi lên */
  const right = useCallback(() => { [784, 988, 1319, 1568].forEach((f, i) => at(() => { beep(f, 260, 'triangle', 0.09); beep(f * 2, 120, 'sine', 0.025); }, i * 95)); }, [beep]);
  /** trả lời chưa đúng: "è è" trầm, nhẹ nhàng (không chê) */
  const wrong = useCallback(() => { beep(220, 230, 'sawtooth', 0.05, 160); at(() => beep(196, 320, 'sawtooth', 0.05, 130), 260); }, [beep]);
  return { beep, tick, chime, whoosh, riffle, countBeep, whistle, step, cheer, dice, knock, drum, crack, chirp, fanfare, quack, right, wrong };
}

export default function CallOn({ classId, className, grade, students, absentToday = [] }: { classId: string; className: string; grade: number; students: Student[]; /** em vắng hôm nay theo Sổ lớp */ absentToday?: string[] }) {
  const storeKey = `goi-ten:${classId}`;
  const [s, setS] = useState<CallState>(() => restoreState(null));
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [picked, setPicked] = useState<Student | null>(null);
  const [question, setQuestion] = useState<ExamQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [full, setFull] = useState(false);
  const [notice, setNotice] = useState('');
  const boardRef = useRef<HTMLDivElement>(null);
  const { tick, chime, whoosh, riffle, countBeep, whistle, step, cheer, dice, knock, drum, crack, chirp, fanfare, quack, right, wrong } = useSound(s.sound);
  // Thẻ câu hỏi: phóng to giữa màn hình để cả lớp đọc; chấm xong tự thu nhỏ
  const [big, setBig] = useState(true);
  const [chosen, setChosen] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<'ok' | 'no' | null>(null);
  const [diaryNote, setDiaryNote] = useState('');
  const [comment, setComment] = useState('');
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  // Thời gian chạy luôn theo lựa chọn của thầy cô. Không rút ngắn theo cài đặt "giảm chuyển động" của máy:
  // Windows tắt "Animation effects" (máy yếu, chế độ Best performance) làm trò chơi chỉ chạy 0,6 giây.
  const secs = s.duration;
  const [celebrate, setCelebrate] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // đọc / ghi trạng thái trên máy
  useEffect(() => {
    let st = restoreState(null);
    try { st = restoreState(localStorage.getItem(storeKey)); } catch { /* chế độ riêng tư */ }
    // em vắng đã điểm danh trong Sổ lớp hôm nay: tự đánh dấu vắng (thầy cô vẫn bỏ đánh dấu được)
    const add = absentToday.filter((id) => !st.absent.includes(id));
    setS(add.length ? { ...st, absent: [...st.absent, ...add] } : st);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đọc một lần khi mở trang
  }, [storeKey]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(storeKey, JSON.stringify(s)); } catch { /* bỏ qua */ } } }, [s, loaded, storeKey]);

  const present = useMemo(() => presentOf(students, s), [students, s]);
  const { list: cands } = useMemo(() => candidatesOf(students, s), [students, s]);
  const calledCount = present.filter((x) => s.called.includes(x.id)).length;
  const bank = useGradeContent(grade); // ngân hàng bài của khối: tải riêng, xong thì danh sách bài hiện ra
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lessons = useMemo(() => bookLessons(s.subject as SubjectCode, grade), [s.subject, grade, bank.version]);
  const subject = SUBJECTS.find((x) => x.code === s.subject) ?? SUBJECTS[0];
  const mode = CALL_MODES.find((m) => m.id === s.mode) ?? CALL_MODES[0];

  /* -------------------------------------------- câu dò bài: lấy ngẫu nhiên ở mức Nhận biết / Kết nối, không lặp trong buổi */
  const usedQ = useRef(new Set<string>());
  const nextQuestion = useCallback((): ExamQuestion | null => {
    if (!s.lessonId) return null;
    const pool = lessonPool(s.lessonId);
    const easy = pool.filter((q) => q.muc <= 2 && q.type !== 'matching');
    const from = (easy.length ? easy : pool).filter((q) => !usedQ.current.has(q.key));
    const q = pickOne(from.length ? from : easy.length ? easy : pool);
    if (q) usedQ.current.add(q.key);
    return q;
  }, [s.lessonId]);

  /* -------------------------------------------- chọn em và kết thúc lượt */
  const choose = useCallback((): Student | null => {
    const { list, newRound } = candidatesOf(students, s);
    if (newRound) {
      setS((x) => ({ ...x, called: [], round: x.round + 1 }));
      setNotice('Cả lớp đã được gọi — bắt đầu vòng mới.');
    }
    return pickOne(list);
  }, [students, s]);

  const reveal = useCallback((st: Student) => {
    setPicked(st);
    setQuestion(nextQuestion());
    setShowAnswer(false);
    setBig(true); setChosen([]); setVerdict(null); setDiaryNote(''); setComment('');
    setPhase('done');
    setS((x) => ({ ...x, called: x.called.includes(st.id) ? x.called : [...x.called, st.id] }));
    fanfare();
    // tên em được chọn hiện to giữa sân chơi kèm pháo giấy, rồi mới thu về thẻ kết quả
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2200);
  }, [nextQuestion, fanfare]);

  /** Thêm "★ Phát biểu tốt" vào Sổ lớp hôm nay của em */
  const praise = async (st: Student, tag = OK_TAG) => {
    if (!supabase) return;
    const { error } = await supabase.rpc('teacher_diary_add_tag', { p_class: classId, p_student: st.id, p_tag: tag });
    setDiaryNote(error ? (/function|schema cache|does not exist/i.test(error.message) ? 'Chưa ghi được vào Sổ lớp: cần chạy migration 0038.' : 'Chưa ghi được vào Sổ lớp, thầy cô ghi tay giúp nhé.') : `Đã ghi “${tag}” cho ${shortName(st.name)} vào Sổ lớp hôm nay.`);
  };
  const shrinkLater = () => later(() => setBig(false), 2600);
  /** Chấm: đúng → tiếng "ting", +1 đúng, ghi lời khen; chưa đúng → tiếng nhẹ, +1 chưa đúng. Sau đó thẻ tự thu nhỏ. */
  const judge = (ok: boolean) => {
    if (!picked || verdict) return;
    setVerdict(ok ? 'ok' : 'no');
    setS((x) => addTally(x, picked.id, ok ? 'ok' : 'no'));
    setComment(pickLine(ok ? OK_LINES : TRY_LINES));
    if (ok) { right(); void praise(picked); } else { wrong(); setShowAnswer(true); void praise(picked, TRY_TAG); }
    shrinkLater();
  };
  const mark = (m: keyof Tally) => {
    if (!picked) return;
    if (m === 'star') {
      setS((x) => addTally(x, picked.id, 'star'));
      right(); void praise(picked); setComment(pickLine(OK_LINES));
      if (!verdict) setVerdict('ok');
      shrinkLater();
      return;
    }
    judge(m === 'ok');
  };
  // Câu chọn đáp án: bấm ô để tích, tự chấm (câu nhiều đáp án: tích rồi bấm "Chốt")
  const key = (question?.answer ?? {}) as { correct?: string | string[] };
  const tfOpts = question?.type === 'true_false' && !question.options.length ? ['Đúng', 'Sai'] : null;
  const optList = tfOpts ?? (question && question.type !== 'ordering' ? question.options : []);
  const choosable = !!question && (question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'true_false') && optList.length > 0 && key.correct !== undefined;
  const isRight = (i: number) => Array.isArray(key.correct) ? key.correct.includes(optList[i]) : key.correct === optList[i];
  const pickOpt = (i: number) => {
    if (verdict) return;
    if (question?.type === 'multiple_choice') { setChosen((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i])); return; }
    setChosen([i]);
    judge(isRight(i));
  };
  const lockMulti = () => {
    if (!chosen.length) return;
    const want = optList.map((_, i) => i).filter(isRight);
    judge(want.length === chosen.length && want.every((i) => chosen.includes(i)));
  };
  const closeResult = () => { setPhase('idle'); setPicked(null); setQuestion(null); setNotice(''); setTaps(0); setFlipped(null); setHot(null); setCelebrate(false); setVerdict(null); setChosen([]); setDiaryNote(''); setComment(''); setBig(true); };

  /* -------------------------------------------- 1. vòng quay */
  // ô trên vòng = các em còn có thể được gọi; giữ nguyên trong lúc quay và lúc hiện kết quả
  const [wheelSnap, setWheelSnap] = useState<Student[] | null>(null);
  const wheelList = phase !== 'idle' && wheelSnap ? wheelSnap : cands;
  const angleRef = useRef(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  const [underPointer, setUnderPointer] = useState<string>('');
  const spinWheel = () => {
    const st = choose();
    if (!st) return;
    const list = candidatesOf(students, s).list;
    const i = list.findIndex((x) => x.id === st.id);
    setWheelSnap(list);
    setPhase('running');
    const from = angleRef.current;
    const to = wheelAngle(i, list.length, from, spinTurns(secs));
    const ms = secs * 1000;
    const t0 = performance.now();
    let last = sliceAt(from, list.length);
    const frame = (now: number) => {
      const x = Math.min(1, (now - t0) / ms);
      const a = from + (to - from) * spinEase(x);
      angleRef.current = a;
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${a}deg)`;
      const k = sliceAt(a, list.length);
      if (k !== last) { last = k; tick(x); setUnderPointer(list[k]?.name ?? ''); }
      if (x < 1) requestAnimationFrame(frame);
      else later(() => reveal(st), 350);
    };
    requestAnimationFrame(frame);
  };

  /* -------------------------------------------- 2. bốc thăm */
  const lots = useMemo(() => lotsFor(students, s, hashId(classId)), [students, s, classId]);
  const [mixing, setMixing] = useState(false);
  /** Trộn thăm: các lá bay lộn xộn rồi đánh số lại (em đã bốc vẫn được giữ) */
  const mixLots = () => {
    if (phase === 'running' || mixing) return;
    closeResult();
    setMixing(true);
    riffle(1300);
    later(() => setS((x) => ({ ...x, mix: x.mix + 1 })), 650);
    later(() => setMixing(false), 1300);
  };
  const [flipped, setFlipped] = useState<number | null>(null);
  const [hot, setHot] = useState<number | null>(null); // lá đang sáng khi đèn chạy
  const flipLot = (i: number, st: Student) => {
    setHot(null);
    setFlipped(i);
    whoosh();
    later(() => reveal(st), 900);
  };
  const drawLot = (index?: number) => {
    if (index !== undefined) { // em tự chọn lá: lật ngay
      const st = lots[index];
      if (!st || (s.noRepeat && s.called.includes(st.id))) return;
      setPhase('running');
      flipLot(index, st);
      return;
    }
    const st = choose();
    if (!st) return;
    const target = lots.findIndex((x) => x.id === st.id);
    const ids = new Set(candidatesOf(students, s).list.map((x) => x.id));
    const choices = lots.map((x, k) => (ids.has(x.id) ? k : -1)).filter((k) => k >= 0);
    setPhase('running');
    const hops = lotHops(choices, target, secs);
    hops.forEach(([k, t], n) => later(() => { setHot(k); chime(t / (secs * 1000)); if (n === hops.length - 1) later(() => flipLot(k, st), 450); }, t));
  };

  /* -------------------------------------------- 3. đua thú */
  const [race, setRace] = useState<RaceLane[] | null>(null);
  const [raceT, setRaceT] = useState(0);
  const [lineup, setLineup] = useState<RaceSlot[] | null>(null);
  const [lining, setLining] = useState(false);
  const [count, setCount] = useState<number | null>(null); // đếm ngược 3-2-1
  /** Xếp vị trí xuất phát ngẫu nhiên (ưu tiên em chưa được gọi) */
  const shuffleLineup = () => {
    if (phase === 'running' || lining) return;
    closeResult(); setRace(null);
    setLining(true); dice();
    let k = 0;
    const roll = () => { setLineup(raceLineup(candidatesOf(students, s).list, present)); if (++k < 6) later(roll, 110); else setLining(false); };
    roll();
  };
  const runRace = () => {
    // em được gọi: một bạn chưa được gọi trong các làn đã xếp (chưa xếp thì xếp ngẫu nhiên)
    const { list, newRound } = candidatesOf(students, s);
    if (newRound) { setS((x) => ({ ...x, called: [], round: x.round + 1 })); setNotice('Cả lớp đã được gọi — bắt đầu vòng mới.'); }
    let slots = lineup && lineup.every((l) => present.some((p) => p.id === l.student.id)) ? lineup : null;
    if (!slots || !slots.some((l) => list.some((c) => c.id === l.student.id))) slots = raceLineup(list, present);
    setLineup(slots);
    const inLane = slots.filter((l) => list.some((c) => c.id === l.student.id)).map((l) => l.student);
    const st = pickOne(inLane);
    if (!st) return;
    const lanes = raceFor(st, present, Math.random, slots.length, secs, slots);
    setRace(lanes);
    setRaceT(0);
    setPhase('running');
    // đếm ngược 3 – 2 – 1 rồi còi xuất phát
    const cd = 3;
    for (let n = cd; n >= 1; n--) later(() => { setCount(n); countBeep(false); }, (cd - n) * 700);
    later(() => { setCount(0); countBeep(true); whistle(); start(); }, cd * 700);
    later(() => setCount(null), cd * 700 + 600);
    const start = () => {
      const winnerAt = lanes.find((l) => l.student.id === st.id)!.finish;
            const t0 = performance.now();
      let nextStep = 0, foot = 0;
      const frame = (now: number) => {
        const t = (now - t0) / 1000;
        setRaceT(t);
        // tiếng bước chạy: dồn dập dần khi về gần đích; xen tiếng chân nặng (voi, ngựa)
        if (t >= nextStep) { foot++; step(t / winnerAt, foot % 4 === 0); nextStep = t + Math.max(0.09, 0.26 - 0.16 * (t / winnerAt)); }
        if (t < winnerAt) requestAnimationFrame(frame);
        else { setRaceT(winnerAt); cheer(); later(() => reveal(st), 600); }
      };
      requestAnimationFrame(frame);
    };
  };

  /* -------------------------------------------- 4. trứng nở */
  const [taps, setTaps] = useState(0);
  const tapEgg = (from: number) => {
    const n = from + 1;
    knock(n);
    if (n < 3) { setTaps(n); return; }
    const st = choose();
    if (!st) return;
    setTaps(3);
    setPhase('running');
    const ms = secs * 1000;
    let t = 0;
    while (t < ms) { const x = t / ms; later(drum, t); t += 300 - 230 * x; }
    later(crack, ms - 250);
    later(() => { reveal(st); chirp(); }, ms);
  };

  /* -------------------------------------------- 5. bịt mắt bắt vịt */
  const [pen, setPen] = useState<Student[] | null>(null);
  const [duckRun, setDuckRun] = useState<{ key: number; target: Student | null }>({ key: 0, target: null });
  const penList = pen ?? [];
  // vào kiểu Bắt vịt lần đầu: thả vịt vào sân (giữ nguyên giữa các lần vẽ lại)
  useEffect(() => { if (s.mode === 'ducks' && !pen && loaded && present.length) setPen(duckPen(candidatesOf(students, s).list, present, null)); }, [s, pen, loaded, present, students]);
  const newPen = () => { if (phase === 'running') return; closeResult(); setPen(duckPen(candidatesOf(students, s).list, present, null)); dice(); };
  const runDucks = () => {
    const { list, newRound } = candidatesOf(students, s);
    if (newRound) { setS((x) => ({ ...x, called: [], round: x.round + 1 })); setNotice('Cả lớp đã được gọi — bắt đầu vòng mới.'); }
    const ducks = duckPen(list, present, pen ?? penList);
    const st = pickOne(ducks.filter((d) => list.some((c) => c.id === d.id)));
    if (!st) return;
    setPen(ducks);
    setPhase('running');
    setDuckRun((r) => ({ key: r.key + 1, target: st }));
  };
  const duckSfx = useMemo(() => ({ quack, step, whoosh, cheer, whistle }), [quack, step, whoosh, cheer, whistle]);

  /* -------------------------------------------- nút chính + phím cách */
  const go = () => {
    if (phase === 'running') return;
    const wasDone = phase === 'done';
    if (wasDone) closeResult();
    if (!present.length) { setNotice('Chưa có em nào có mặt. Mở danh sách để bỏ đánh dấu vắng.'); return; }
    if (s.mode === 'wheel') spinWheel();
    else if (s.mode === 'lots') drawLot();
    else if (s.mode === 'race') runRace();
    else if (s.mode === 'ducks') runDucks();
    else tapEgg(wasDone ? 0 : taps);
  };
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space' || e.key === 'PageDown') { e.preventDefault(); goRef.current(); }
      if (e.key === 'Escape') { setDrawer(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // toàn màn hình
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void boardRef.current?.requestFullscreen?.().catch(() => setNotice('Trình duyệt không cho bật toàn màn hình. Bấm F11.'));
  };

  const setMode = (m: CallMode) => { if (phase === 'running') return; closeResult(); setRace(null); setS((x) => ({ ...x, mode: m })); };
  const toggleAbsent = (id: string) => setS((x) => ({ ...x, absent: x.absent.includes(id) ? x.absent.filter((a) => a !== id) : [...x.absent, id] }));
  const newRound = () => { closeResult(); setS((x) => ({ ...x, called: [], round: x.round + 1 })); setNotice('Đã bắt đầu vòng mới: cả lớp đều có thể được gọi.'); };

  if (!students.length) {
    return <section className="dash-card"><h1>Gọi tên – Dò bài</h1><p className="dash-muted">Lớp {className} chưa có học sinh. Thêm học sinh ở trang quản lý lớp trước nhé.</p></section>;
  }

  const lessonTitle = lessons.find((l) => l.id === s.lessonId)?.title;

  return (
    <div ref={boardRef} className={`callon${full ? ' is-full' : ''}`}>
      {/* ------------------------------------------------ thanh trên */}
      <header className="callon-top">
        <div className="callon-title">
          <h1>Gọi tên – Dò bài</h1>
          <p>Lớp {className} · có mặt {present.length}/{students.length} · đã gọi {calledCount}</p>
        </div>
        <nav className="callon-modes" aria-label="Kiểu gọi tên">
          {CALL_MODES.map((m) => (
            <button key={m.id} type="button" aria-pressed={s.mode === m.id} onClick={() => setMode(m.id)}><span aria-hidden="true">{m.icon}</span> {m.label}</button>
          ))}
        </nav>
      </header>

      {/* ------------------------------------------------ chọn bài để dò */}
      <div className="callon-lesson">
        <span>Câu dò bài:</span>
        {SUBJECTS.map((x) => (
          <button key={x.code} type="button" className={`callon-subj${s.subject === x.code ? ' is-on' : ''}`} onClick={() => setS((v) => ({ ...v, subject: x.code, lessonId: '' }))}>{x.name}</button>
        ))}
        <select aria-label="Bài để dò" value={s.lessonId} onChange={(e) => { usedQ.current.clear(); setS((v) => ({ ...v, lessonId: e.target.value })); }}>
          <option value="">Không hỏi — chỉ gọi phát biểu</option>
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <div className="callon-toggles">
          <label className="callon-chip callon-time" title="Thời gian quay / bốc / đua">
            <Timer aria-hidden="true" />
            <span className="sr-only">Thời gian quay</span>
            <select value={s.duration} onChange={(e) => setS((x) => ({ ...x, duration: Number(e.target.value) }))} disabled={phase === 'running'}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d} giây</option>)}
            </select>
          </label>
          <button type="button" className={`callon-chip${s.noRepeat ? ' is-on' : ''}`} aria-pressed={s.noRepeat} onClick={() => setS((x) => ({ ...x, noRepeat: !x.noRepeat }))}>{s.noRepeat ? '✓ ' : ''}Không gọi lại</button>
          <button type="button" className={`callon-chip${s.sound ? ' is-on' : ''}`} aria-pressed={s.sound} aria-label={s.sound ? 'Tắt âm thanh' : 'Bật âm thanh'} onClick={() => setS((x) => ({ ...x, sound: !x.sound }))}>{s.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}</button>
          <button type="button" className="callon-chip" onClick={() => setDrawer(true)}><Users aria-hidden="true" /> Danh sách</button>
          <button type="button" className="callon-chip" aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} onClick={toggleFull}>{full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
        </div>
        {notice && <p className="callon-notice" role="status">{notice}</p>}
      </div>

      {/* ------------------------------------------------ sân chơi */}
      <section className={`callon-stage mode-${s.mode}`} aria-live="polite">
        {s.mode === 'wheel' && (
          <div className="cw">
            <p className="callon-hint">Vòng quay có <b>{wheelList.length} em</b>{s.noRepeat ? ' chưa được gọi' : ''}</p>
            <div className="cw-box">
              <span className="cw-pointer" aria-hidden="true" />
              <svg ref={wheelRef} viewBox="0 0 540 540" className={`cw-wheel${phase === 'done' ? ' is-done' : ''}`} style={{ transform: `rotate(${angleRef.current}deg)` }} aria-hidden="true">
                {wheelList.map((st, i) => {
                  const n = wheelList.length, R = 266, c = 270;
                  if (n === 1) return <circle key={st.id} cx={c} cy={c} r={R} fill={COLORS[0]} />;
                  const a0 = ((i * 360) / n - 90) * Math.PI / 180, a1 = (((i + 1) * 360) / n - 90) * Math.PI / 180;
                  const large = 360 / n > 180 ? 1 : 0;
                  const col = COLORS[i % COLORS.length];
                  const mid = ((i + 0.5) * 360) / n - 90;
                  return (
                    <g key={st.id} className={phase === 'done' && picked?.id === st.id ? 'is-win' : undefined}>
                      <path d={`M${c} ${c}L${c + R * Math.cos(a0)} ${c + R * Math.sin(a0)}A${R} ${R} 0 ${large} 1 ${c + R * Math.cos(a1)} ${c + R * Math.sin(a1)}Z`} fill={col} stroke="#fff" strokeWidth="3" />
                      <text transform={`translate(${c} ${c}) rotate(${mid}) translate(${R - 16} 0)`} textAnchor="end" dominantBaseline="middle" fontWeight="700" fontSize={n > 24 ? 13 : n > 14 ? 15 : 18} fill={col === '#ffc83d' ? '#1e2b4a' : '#fff'}>
                        {n > 10 ? shortName(st.name) : st.name}
                      </text>
                    </g>
                  );
                })}
                <circle cx="270" cy="270" r="266" fill="none" stroke="#1e2b4a" strokeWidth="8" />
              </svg>
              <span className="cw-hub"><MiloMascot size={72} /></span>
            </div>
            {phase === 'running' && underPointer && <p className="cw-now" aria-hidden="true">{underPointer}</p>}
          </div>
        )}

        {s.mode === 'lots' && (
          <div className="cl">
            <div className="callon-stagebar">
              <p className="callon-hint">Bấm một lá thăm, hoặc bấm <b>Bốc thăm</b> để Milo bốc giúp</p>
              <button type="button" className="callon-chip" onClick={mixLots} disabled={phase === 'running' || mixing}>🔀 Trộn thăm</button>
            </div>
            <ol className={`cl-grid${mixing ? ' is-mixing' : ''}`} style={{ ['--cols' as string]: String(Math.max(5, Math.min(10, Math.ceil(lots.length / 3)))) }}>
              {lots.map((st, i) => {
                const used = s.noRepeat && s.called.includes(st.id) && flipped !== i;
                return (
                  <li key={st.id} style={{ ['--dx' as string]: `${((i * 73) % 11) - 5}0px`, ['--dy' as string]: `${((i * 37) % 9) - 4}0px`, ['--r' as string]: `${((i * 53) % 31) - 15}deg` }}>
                    <button type="button" className={`cl-lot${used ? ' is-used' : ''}${flipped === i ? ' is-flip' : ''}${hot === i ? ' is-hot' : ''}`} style={{ ['--c' as string]: COLORS[i % 5 === 3 ? 4 : i % 5] }}
                      disabled={used || phase === 'running'} aria-label={used ? `Lá ${i + 1}: đã bốc` : `Lá thăm số ${i + 1}`} onClick={() => { if (phase === 'done') closeResult(); drawLot(i); }}>
                      <span className="cl-front">{used ? 'đã bốc' : i + 1}</span>
                      <span className="cl-back">{flipped === i ? st.name : ''}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {s.mode === 'race' && (
          <div className="cr">
            <div className="callon-stagebar">
              <p className="callon-hint">{race ? 'Em về đích đầu tiên được gọi' : lineup ? 'Đã xếp vị trí — bấm Xuất phát' : `Bấm Xuất phát hoặc xếp ${Math.min(6, present.length)} bạn vào vị trí ngẫu nhiên`}</p>
              <button type="button" className="callon-chip" onClick={shuffleLineup} disabled={phase === 'running' || lining}>🎲 Xếp vị trí ngẫu nhiên</button>
            </div>
            {count !== null && <span key={count} className="cr-count" aria-live="assertive">{count === 0 ? 'Chạy!' : count}</span>}
            <div className="cr-track">
              <span className="cr-finish" aria-hidden="true" />
              {(race ?? (lineup ?? Array.from({ length: Math.min(6, Math.max(1, present.length)) }, (_, i) => ({ student: { id: `?${i}`, name: '?' }, animal: ['🐢', '🐇', '🦆', '🐘', '🐎', '🐿️'][i] }))).map((l) => ({ ...l, finish: 1, wobble: 1 }))).map((l) => {
                const p = race ? racePos(raceT, l.finish, l.wobble) : 0;
                const win = phase === 'done' && picked?.id === l.student.id;
                return (
                  <div key={l.student.id} className={`cr-lane${win ? ' is-win' : ''}`}>
                    <span className={`cr-name${lining ? ' is-rolling' : ''}`}>{race || lineup ? l.student.name : 'Ai sẽ vào đua?'}</span>
                    <span className="cr-animal" style={{ left: `calc(170px + ${p} * (100% - 250px))` }} aria-hidden="true">{l.animal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {s.mode === 'eggs' && (
          <div className="ce">
            <p className="callon-hint">Gõ trứng 3 lần (bấm vào trứng hoặc phím cách) · trứng nở ra tên một em</p>
            <button type="button" className={`ce-egg taps-${taps}${phase === 'done' ? ' is-open' : ''}${phase === 'running' && taps === 3 ? ' is-hatching' : ''}`} onClick={go} aria-label={phase === 'done' ? 'Gõ quả trứng mới' : `Gõ trứng (${taps}/3)`}>
              <span className="ce-nest" aria-hidden="true" />
              {phase === 'done' && <span className="ce-milo"><MiloMascot variant={subject.milo} size={180} /></span>}
              <span className="ce-shell" aria-hidden="true"><i /><i /></span>
              {taps > 0 && phase !== 'done' && <span className="ce-count" aria-hidden="true">{taps === 3 ? 'Sắp nở…' : `${taps}/3`}</span>}
            </button>
          </div>
        )}

        {s.mode === 'ducks' && (
          <div className="cd">
            <div className="callon-stagebar">
              <p className="callon-hint">{phase === 'running' ? 'Bạn bịt mắt đang tìm vịt…' : `Trong sân có ${penList.length} chú vịt · bấm Bịt mắt bắt vịt`}</p>
              <button type="button" className="callon-chip" onClick={newPen} disabled={phase === 'running'}>🎲 Thả vịt mới</button>
            </div>
            <DuckCatch ducks={penList} target={duckRun.target} runKey={duckRun.key} seconds={secs} caughtId={phase === 'done' && picked ? picked.id : null} onCaught={(st) => reveal(st)} sfx={duckSfx} />
          </div>
        )}

        {/* ------------------------------------------------ kết quả */}
        {phase === 'done' && picked && celebrate && (
          <div className="callon-spot" aria-hidden="true">
            <span className="callon-burst">{Array.from({ length: 36 }, (_, k) => <i key={k} style={{ ['--a' as string]: `${(k * 360) / 36}deg`, ['--d' as string]: `${140 + (k % 5) * 45}px`, ['--c' as string]: COLORS[k % COLORS.length] }} />)}</span>
            <span className="callon-spot-card">
              <MiloMascot variant={subject.milo} size={110} />
              <small>Mời bạn</small>
              <strong>{picked.name}</strong>
            </span>
          </div>
        )}
        {phase === 'done' && picked && !celebrate && (
          <div className={`callon-result${big ? ' is-big' : ''}${verdict ? ` is-${verdict}` : ''}`} role="dialog" aria-label={`Mời ${picked.name}`}>
            <div className="callon-rtools">
              <button type="button" className="callon-close" aria-label={big ? 'Thu nhỏ' : 'Phóng to'} title={big ? 'Thu nhỏ' : 'Phóng to'} onClick={() => setBig((v) => !v)}>{big ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
              <button type="button" className="callon-close" aria-label="Đóng" title="Đóng" onClick={closeResult}><X aria-hidden="true" /></button>
            </div>
            <div className="callon-who">
              <MiloMascot variant={subject.milo} size={64} />
              <div><p>Mời bạn lên bảng</p><h2>{picked.name}</h2></div>
              {verdict && <span className={`callon-verdict is-${verdict}`}>{verdict === 'ok' ? '✓ Phát biểu tốt' : '✗ Cần cố gắng hơn'}</span>}
            </div>
            {comment && <p className={`callon-comment is-${verdict ?? 'ok'}`} role="status">{comment}</p>}
            {question && (big || !verdict) && (
              <div className="callon-q">
                <small>Câu dò bài · {subject.name}{lessonTitle ? ` · ${lessonTitle}` : ''}</small>
                <p className={question.prompt.length > 260 ? 'is-xlong' : question.prompt.length > 140 ? 'is-long' : undefined}>{question.prompt}</p>
                {question.statements?.length ? <ul className="callon-st">{question.statements.map((t) => <li key={t}>{t}</li>)}</ul> : null}
                {question.blanks?.length ? <ul className="callon-st">{question.blanks.map((t) => <li key={t}>{t.replace(/\{\}/g, '……')}</li>)}</ul> : null}
                {choosable ? (
                  <div className={`callon-choices${question.type === 'multiple_choice' ? ' is-multi' : ''}`} role={question.type === 'multiple_choice' ? 'group' : 'radiogroup'} aria-label="Chọn đáp án">
                    {optList.map((o, i) => {
                      const on = chosen.includes(i);
                      const cls = verdict ? (isRight(i) ? ' is-right' : on ? ' is-wrong' : ' is-dim') : on ? ' is-on' : '';
                      return (
                        <button key={o} type="button" role={question.type === 'multiple_choice' ? 'checkbox' : 'radio'} aria-checked={on} className={`callon-choice${cls}`} onClick={() => pickOpt(i)} disabled={!!verdict}>
                          <span className="callon-box" aria-hidden="true">{(on || (verdict && isRight(i))) ? <Check /> : null}</span>
                          <b>{tfOpts ? '' : `${LETTERS[i]}.`}</b> <span>{o}</span>
                        </button>
                      );
                    })}
                    {question.type === 'multiple_choice' && !verdict && <button type="button" className="callon-lock" onClick={lockMulti} disabled={!chosen.length}>Chốt đáp án</button>}
                  </div>
                ) : (
                  <>
                    {question.options.length > 0 && question.type !== 'ordering' && (
                      <ol className="callon-opts">{question.options.map((o, i) => <li key={o}><b>{LETTERS[i]}.</b> {o}</li>)}</ol>
                    )}
                    {question.type === 'ordering' && <p className="callon-st">Sắp xếp: {question.options.join(' · ')}</p>}
                  </>
                )}
                {!(choosable && verdict) && (
                  <button type="button" className="callon-ans" onClick={() => setShowAnswer((v) => !v)}>
                    {showAnswer ? <><EyeOff aria-hidden="true" /> Đáp án: <strong>{answerText(question)}</strong></> : <><Eye aria-hidden="true" /> Xem đáp án</>}
                  </button>
                )}
              </div>
            )}
            {diaryNote && <p className="callon-diary" role="status">{diaryNote}</p>}
            <div className="callon-marks">
              {!verdict && <button type="button" className="m-ok" onClick={() => mark('ok')}>✓ Đúng</button>}
              {!verdict && <button type="button" className="m-no" onClick={() => mark('no')}>✗ Chưa đúng</button>}
              <button type="button" className="m-star" onClick={() => mark('star')}>★ Phát biểu hay</button>
            </div>
          </div>
        )}
      </section>

      <div className="callon-bottom">
        <p className="callon-progress"><span style={{ width: `${present.length ? (calledCount / present.length) * 100 : 0}%` }} /></p>
        <button type="button" className="callon-go" onClick={go} disabled={phase === 'running'}>
          {phase === 'done' ? 'Gọi em tiếp theo' : s.mode === 'eggs' && taps > 0 ? `Gõ tiếp (${taps}/3)` : mode.action} <kbd>phím cách</kbd>
        </button>
      </div>

      {/* ------------------------------------------------ danh sách (ẩn, mở bằng nút) */}
      {drawer && (
        <div className="callon-drawer-bg" onClick={() => setDrawer(false)}>
          <aside className="callon-drawer" aria-label="Danh sách lớp" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>Lớp {className}</h2>
              <button type="button" className="callon-close" aria-label="Đóng danh sách" onClick={() => setDrawer(false)}><X aria-hidden="true" /></button>
            </header>
            <p className="dash-muted">Bấm vào tên để đánh dấu <b>vắng</b> hôm nay. Đã gọi {calledCount}/{present.length} em có mặt.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={newRound}><RotateCcw aria-hidden="true" /> Vòng mới</button>
            <ul>
              {students.map((st) => {
                const off = s.absent.includes(st.id), done = s.called.includes(st.id), t = s.tally[st.id];
                return (
                  <li key={st.id}>
                    <button type="button" className={`${off ? 'is-off' : ''}${done ? ' is-done' : ''}${picked?.id === st.id ? ' is-now' : ''}`} aria-pressed={off} onClick={() => toggleAbsent(st.id)}>
                      <span className="nm">{st.name}</span>
                      {off ? <span className="tag-off">vắng</span> : t ? <span className="tally">{t.ok ? `✓${t.ok}` : ''}{t.no ? ` ✗${t.no}` : ''}{t.star ? ` ★${t.star}` : ''}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="dash-muted">Điểm ✓ ✗ ★ lưu trên máy này.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
