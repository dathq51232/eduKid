'use client';

// Trang làm bài.
// - Câu hỏi được sắp từ dễ đến khó (L1 → L5); mỗi câu có đồng hồ đếm ngược riêng (src/lib/levels.ts).
// - Bấm "Kiểm tra": chấm, báo đúng/sai rồi tự sang câu tiếp theo chưa làm.
// - Bấm "Để sau" (hoặc chọn số câu ở hàng ô phía trên) để bỏ qua; câu bỏ qua giữ nguyên thời gian còn lại và câu đang
//   làm dở, em quay lại làm bất cứ lúc nào. Câu đã chấm thì không làm lại trong lượt này.
// - Hết giờ: nếu em đã chọn/điền đáp án thì chấm đáp án đó, nếu chưa thì tính là "hết giờ".
// - Đồng hồ tạm dừng khi đang nghe đọc đề, khi mở hộp thoại hoặc khi chuyển sang ứng dụng/tab khác.
// - Kết thúc: tính tổng thời gian, số câu đúng, điểm và điểm tích luỹ rồi chuyển sang trang kết quả.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clock, Dices, Flag, Lightbulb, Play, RefreshCw, SkipForward, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import Figure from '@/components/Figure';
import KnowledgeCard from '@/components/KnowledgeCard';
import LearnHeader from '@/components/LearnHeader';
import GradeGate from '@/components/learn/GradeGate';
import QuestionRenderer from '@/components/questions/QuestionRenderer';
import VoiceHelp from '@/components/VoiceHelp';
import Confetti from '@/components/learn/Confetti';
import LessonDecor from '@/components/learn/LessonDecor';
import MiloTrail from '@/components/learn/MiloTrail';
import { awardSticker, prefersReducedMotion, readFx, saveFx } from '@/lib/stickers';
import { SUBJECT_MASCOT } from '@/lib/mascots';
import { getLesson, getQuestionSet, getReplacement, gradeAnswer, isSubjectCode, parseGrade } from '@/lib/data';
import { isAnswered } from '@/lib/grading';
import { knowledgeFor } from '@/lib/content/knowledge';
import { LEVELS, LEVEL_LIST, SPEED_BONUS, formatDuration, questionPoints, rankFor } from '@/lib/levels';
import { addPoints, readTotalPoints, saveAttempt, saveMucLesson } from '@/lib/progress';
import { syncEnabled, syncLessonResult, writeSyncStatus } from '@/lib/progress-sync';
import { MUC, MUC_LIST, parseMuc, type Muc } from '@/lib/sets';
import { totals } from '@/lib/scoring';
import { TIMER_SOUND_MODES, playSound, readTimerSound, saveTimerSound, timerSoundFor, type TimerSoundMode } from '@/lib/sound';
import { isPracticeId, newSeed } from '@/lib/practice/core';
import { lastShownSet, rememberShownSet } from '@/lib/set-history';
import { getVoiceStatus, questionSegments, segmentsFor, speakSegments, stopSpeaking } from '@/lib/speech';
import type { AnswerRecord, AnswerValue, Question } from '@/lib/types';

type ItemStatus = 'todo' | 'skipped' | 'correct' | 'wrong' | 'timeout';
type Item = {
  status: ItemStatus;
  answer: AnswerValue;
  touched: boolean; // em đã tự chọn/điền (câu sắp xếp có sẵn thứ tự ban đầu nên chưa tính)
  remainingMs: number;
  spentMs: number;
  explanation?: string;
  solution?: string;
  points: number;
  speedBonus: number;
};
type Feedback = { id: string; kind: 'correct' | 'wrong' | 'timeout'; points: number; speedBonus: number };
type Dialog = null | 'submit' | 'exit';

const isDone = (s: ItemStatus) => s === 'correct' || s === 'wrong' || s === 'timeout';
const ADVANCE_MS = { correct: 1800, wrong: 4500, timeout: 4500 } as const;
const MAX_SWAPS = 3; // số lần được đổi câu trong một lượt làm bài

// ---------------------------------------------------------------------------
// Đồng hồ đếm ngược dạng vòng tròn
// ---------------------------------------------------------------------------
function TimerRing({ remainingMs, limitSec, paused }: { remainingMs: number; limitSec: number; paused: boolean }) {
  const sec = Math.ceil(remainingMs / 1000);
  const ratio = Math.max(0, Math.min(1, remainingMs / (limitSec * 1000)));
  const tone = sec <= 5 ? 'is-danger' : ratio <= 0.25 ? 'is-low' : ratio <= 0.5 ? 'is-mid' : 'is-ok';
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className={`timer-ring ${tone}${paused ? ' is-paused' : ''}`} role="timer" aria-label={`Còn ${sec} giây${paused ? ', đồng hồ đang tạm dừng' : ''}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="timer-track" cx="32" cy="32" r={r} />
        <circle className="timer-value" cx="32" cy="32" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} />
      </svg>
      <span className="timer-text" aria-hidden="true">{sec}</span>
      <span className="timer-unit" aria-hidden="true">{paused ? 'dừng' : 'giây'}</span>
    </div>
  );
}

function LamBaiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonId = searchParams.get('lessonId') || '';
  const subjectParam = searchParams.get('subject');
  const subjectCode = isSubjectCode(subjectParam) ? subjectParam : 'toan';
  const grade = parseGrade(searchParams.get('grade'));
  const backHref = `/chon-bai?subject=${subjectCode}&grade=${grade}`;

  // Bộ câu: không có seed = bộ câu gốc; có seed = bộ câu mới theo mức độ (Cơ bản / Khá / Giỏi).
  // seed nằm trên địa chỉ trang nên tải lại trang vẫn giữ đúng bộ câu đó.
  const practice = isPracticeId(lessonId);
  const muc = parseMuc(searchParams.get('muc'));
  const wantsNewSet = searchParams.get('doi') === '1';
  const seedParam = Number(searchParams.get('seed'));
  const seed = Number.isInteger(seedParam) && seedParam > 0 ? seedParam : undefined;
  // tru = bộ câu đang có ("goc" hoặc seed): bộ mới sẽ không lặp lại câu nào của bộ đó
  const truParam = searchParams.get('tru');
  const newSetHref = useCallback(
    (m: Muc, from?: string) =>
      `/lam-bai?lessonId=${lessonId}&subject=${subjectCode}&grade=${grade}&muc=${m}&seed=${newSeed()}&tru=${from ?? (seed ? String(seed) : 'goc')}`,
    [lessonId, subjectCode, grade, seed],
  );
  const originalHref = `/lam-bai?lessonId=${lessonId}&subject=${subjectCode}&grade=${grade}`;
  const needSeed = !seed && (practice || muc > 1 || wantsNewSet);
  useEffect(() => {
    // Mở từ danh sách bài / trang kết quả: tránh các câu của bộ em vừa gặp gần nhất
    if (needSeed) router.replace(newSetHref(muc, truParam ?? lastShownSet(lessonId) ?? 'goc'));
  }, [needSeed, muc, router, newSetHref, truParam, lessonId]);
  useEffect(() => {
    if (!needSeed && lessonId) rememberShownSet(lessonId, seed ? String(seed) : 'goc');
  }, [needSeed, lessonId, seed]);

  const lesson = getLesson(lessonId);
  // Câu dễ trước, câu khó sau (sắp ổn định: cùng cấp độ giữ thứ tự của bài)
  const questionSet = useMemo(() => getQuestionSet(lessonId, seed, muc, truParam), [lessonId, seed, muc, truParam]);
  const setNote = questionSet.note;
  const baseOrder = useMemo<Question[]>(() => [...questionSet.questions].sort((a, b) => a.level - b.level), [questionSet]);
  // Danh sách câu của lượt làm (nút "Đổi câu" thay một câu bằng câu khác cùng cấp độ)
  const [order, setOrder] = useState<Question[]>(baseOrder);
  const [swapsLeft, setSwapsLeft] = useState(MAX_SWAPS);
  const [swapNote, setSwapNote] = useState('');
  const usedRef = useRef<Question[]>([]); // mọi câu đã xuất hiện trong lượt (kể cả câu đã đổi đi)
  const extraMsRef = useRef(0); // thời gian đã dùng cho các câu bị đổi đi (vẫn tính vào tổng thời gian)

  const [phase, setPhase] = useState<'intro' | 'quiz'>('intro');
  const [items, setItems] = useState<Record<string, Item>>({});
  const itemsRef = useRef(items);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  currentRef.current = current;
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [holdAdvance, setHoldAdvance] = useState(false);
  const [advanceLeft, setAdvanceLeft] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [hidden, setHidden] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundRef = useRef(true);
  soundRef.current = soundEnabled;
  // Âm thanh đồng hồ đếm ngược: 10 giây cuối (mặc định), mỗi giây, hoặc tắt
  const [timerSound, setTimerSound] = useState<TimerSoundMode>('last10');
  const timerSoundRef = useRef<TimerSoundMode>('last10');
  timerSoundRef.current = timerSound;
  useEffect(() => setTimerSound(readTimerSound()), []);
  const chooseTimerSound = (m: TimerSoundMode) => {
    setTimerSound(m);
    saveTimerSound(m);
    const demo = timerSoundFor(m === 'every' ? 20 : 10, m); // nghe thử
    if (demo && soundRef.current) playSound(demo);
  };
  const [voiceProblem, setVoiceProblem] = useState<'unsupported' | 'no_vi_voice' | null>(null);
  const [startTotal, setStartTotal] = useState(0);
  // Hiệu ứng (pháo giấy, Milo nhảy, họa tiết trôi): em tắt được; máy bật "giảm chuyển động" thì tự bỏ chuyển động
  const [fx, setFx] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    setFx(readFx());
    setReduceMotion(prefersReducedMotion());
  }, []);
  const motion = fx && !reduceMotion;
  // Mỗi câu mới hiện từ đầu trang (để thấy đường tiến độ có Milo ngay trên câu hỏi)
  useEffect(() => {
    if (phase === 'quiz') window.scrollTo({ top: 0 });
  }, [phase, current]);
  const toggleFx = () => setFx((v) => { saveFx(!v); return !v; });
  const finishedRef = useRef(false);

  const q = order[current];
  const item = q ? items[q.id] : undefined;

  // Khởi tạo trạng thái từng câu
  useEffect(() => {
    const init: Record<string, Item> = {};
    setOrder(baseOrder);
    setSwapsLeft(MAX_SWAPS);
    setSwapNote('');
    usedRef.current = [...baseOrder];
    extraMsRef.current = 0;
    for (const x of baseOrder) {
      init[x.id] = { status: 'todo', answer: null, touched: false, remainingMs: x.timeLimit * 1000, spentMs: 0, points: 0, speedBonus: 0 };
    }
    itemsRef.current = init;
    setItems(init);
    setCurrent(0);
    setPhase('intro');
    setFeedback(null);
    finishedRef.current = false;
  }, [baseOrder]);

  useEffect(() => {
    void getVoiceStatus();
    setStartTotal(readTotalPoints());
    const onVis = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      stopSpeaking();
    };
  }, []);

  // Cập nhật một câu: ref là nguồn đúng (đồng hồ đọc ref), state để vẽ lại giao diện
  const patch = useCallback((id: string, p: Partial<Item>) => {
    const next = { ...itemsRef.current, [id]: { ...itemsRef.current[id], ...p } };
    itemsRef.current = next;
    setItems(next);
  }, []);

  const playIf = (name: Parameters<typeof playSound>[0]) => {
    if (soundRef.current) playSound(name);
  };

  // ---------------------------------------------------------------------------
  // Kết thúc bài
  // ---------------------------------------------------------------------------
  const finish = useCallback(() => {
    if (finishedRef.current || !lesson) return;
    finishedRef.current = true;
    stopSpeaking();
    const all = itemsRef.current;
    const answers: AnswerRecord[] = order.map((x) => {
      const it = all[x.id];
      const status = it.status === 'todo' || it.status === 'skipped' ? 'unanswered' : it.status;
      return {
        questionId: x.id,
        prompt: x.prompt,
        level: x.level,
        timeLimit: x.timeLimit,
        spentMs: Math.round(it.spentMs),
        status,
        userAnswer: it.answer,
        isCorrect: it.status === 'correct',
        points: it.points,
        speedBonus: it.speedBonus,
        explanation: it.explanation,
        solution: it.solution,
      };
    });
    const t = totals(answers);
    t.durationMs += extraMsRef.current; // gồm cả thời gian làm dở các câu đã đổi
    const added = addPoints(lessonId, lesson.title, t.points);
    const finishedAt = new Date().toISOString();
    awardSticker(finishedAt, lessonId, t.score, order.length);
    saveAttempt({
      lessonId,
      lessonTitle: lesson.title,
      subject: subjectCode,
      grade,
      score: t.score,
      total: order.length,
      durationMs: t.durationMs,
      points: t.points,
      questionPoints: t.questionPoints,
      lessonBonus: t.lessonBonus,
      newPoints: added.newPoints,
      totalPoints: added.totalPoints,
      previousTotal: added.previousTotal,
      finishedAt,
      seed,
      muc: seed ? muc : undefined,
      answers,
    });
    // Học sinh đã đăng nhập: gửi bài làm để máy chủ chấm lại và lưu (khách thì máy chủ bỏ qua)
    if (syncEnabled()) writeSyncStatus({ lessonId, saved: false, pending: true });
    void syncLessonResult({
      lessonId,
      seed,
      muc: seed ? muc : undefined,
      answers: answers.map((a) => ({ questionId: a.questionId, answer: a.userAnswer ?? null, spentMs: a.spentMs })),
    }).then((r) => { if (syncEnabled()) writeSyncStatus({ lessonId, ...r, pending: false }); });
    playIf('complete');
    router.push(`/ket-qua?subject=${subjectCode}&grade=${grade}`);
  }, [order, lesson, lessonId, subjectCode, grade, router, seed, muc]);

  // Câu chưa làm tiếp theo (vòng lại từ đầu); -1 nếu đã làm hết
  const findNext = useCallback(
    (from: number) => {
      const all = itemsRef.current;
      for (let step = 1; step <= order.length; step++) {
        const i = (from + step) % order.length;
        const st = all[order[i].id]?.status;
        if (st && !isDone(st) && i !== from) return i;
      }
      return -1;
    },
    [order],
  );

  const goTo = useCallback(
    (index: number) => {
      stopSpeaking();
      setIsSpeaking(false);
      const curQ = order[currentRef.current];
      const curItem = curQ ? itemsRef.current[curQ.id] : undefined;
      // Rời câu đang làm dở => để dành làm sau
      if (curQ && curItem && curItem.status === 'todo' && index !== currentRef.current) patch(curQ.id, { status: 'skipped' });
      setFeedback(null);
      setHoldAdvance(false);
      setShowSolution(false);
      setCurrent(index);
    },
    [order, patch],
  );

  const goNext = useCallback(() => {
    const next = findNext(currentRef.current);
    if (next === -1) {
      const cur = order[currentRef.current];
      if (cur && !isDone(itemsRef.current[cur.id].status)) return; // còn đúng câu đang làm
      finish();
      return;
    }
    goTo(next);
  }, [findNext, finish, goTo, order]);

  // ---------------------------------------------------------------------------
  // Chấm
  // ---------------------------------------------------------------------------
  const submit = useCallback(
    async (id: string, answer: AnswerValue, timedOut: boolean) => {
      const x = order.find((o) => o.id === id);
      const it = itemsRef.current[id];
      if (!x || !it || isDone(it.status)) return;
      setIsChecking(true);
      try {
        const spentMs = timedOut ? x.timeLimit * 1000 : it.spentMs;
        const result = await gradeAnswer(id, answer, { spentMs, timedOut });
        const kind: Feedback['kind'] = answer === null ? 'timeout' : result.correct ? 'correct' : 'wrong';
        const pts = questionPoints(x.level, kind === 'correct', spentMs, x.timeLimit);
        patch(id, {
          status: kind,
          spentMs,
          remainingMs: timedOut ? 0 : it.remainingMs,
          explanation: result.explanation,
          solution: result.solution,
          points: pts.base + pts.speed,
          speedBonus: pts.speed,
        });
        setShowSolution(false);
        setHoldAdvance(false);
        setFeedback({ id, kind, points: pts.base + pts.speed, speedBonus: pts.speed });
        playIf(kind === 'correct' ? 'correct' : kind === 'timeout' ? 'timeout' : 'wrong');
      } finally {
        setIsChecking(false);
      }
    },
    [order, patch],
  );

  const handleCheck = () => {
    if (!q || !item || isDone(item.status) || !isAnswered(item.answer) || isChecking) return;
    stopSpeaking();
    setIsSpeaking(false);
    void submit(q.id, item.answer, false);
  };

  const handleTimeUp = useCallback(
    (id: string) => {
      stopSpeaking();
      setIsSpeaking(false);
      const it = itemsRef.current[id];
      // Em đã chọn/điền đáp án nhưng chưa bấm Kiểm tra: chấm luôn đáp án đó
      void submit(id, it.touched && isAnswered(it.answer) ? it.answer : null, true);
    },
    [submit],
  );

  // ---------------------------------------------------------------------------
  // Đồng hồ: chạy khi đang làm câu hiện tại và không bị tạm dừng
  // ---------------------------------------------------------------------------
  const running = phase === 'quiz' && !!q && !!item && !isDone(item.status) && !feedback && !isChecking && !dialog && !hidden && !isSpeaking;
  useEffect(() => {
    if (!running || !q) return;
    const id = q.id;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1000, now - last);
      last = now;
      const it = itemsRef.current[id];
      if (!it || isDone(it.status)) return;
      const remaining = Math.max(0, it.remainingMs - dt);
      const before = Math.ceil(it.remainingMs / 1000);
      const after = Math.ceil(remaining / 1000);
      if (after < before) {
        const snd = timerSoundFor(after, timerSoundRef.current);
        if (snd) playIf(snd);
      }
      patch(id, { remainingMs: remaining, spentMs: it.spentMs + (it.remainingMs - remaining) });
      if (remaining <= 0) {
        window.clearInterval(timer);
        handleTimeUp(id);
      }
    }, 200);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, q?.id, patch, handleTimeUp]);

  // Tự sang câu tiếp sau khi báo đúng/sai (dừng nếu em mở lời giải hoặc hộp thoại)
  useEffect(() => {
    if (!feedback || holdAdvance || dialog) return;
    const delay = ADVANCE_MS[feedback.kind];
    const deadline = Date.now() + delay;
    setAdvanceLeft(Math.ceil(delay / 1000));
    const timer = window.setInterval(() => {
      const left = deadline - Date.now();
      if (left <= 0) {
        window.clearInterval(timer);
        goNext();
      } else setAdvanceLeft(Math.ceil(left / 1000));
    }, 200);
    return () => window.clearInterval(timer);
  }, [feedback, holdAdvance, dialog, goNext]);

  // ---------------------------------------------------------------------------
  // Đổi câu: thay câu đang làm bằng câu khác cùng cấp độ, đồng hồ tính lại từ đầu
  // ---------------------------------------------------------------------------
  const swapQuestion = () => {
    const x = order[currentRef.current];
    const it = x ? itemsRef.current[x.id] : undefined;
    if (!x || !it || isDone(it.status) || swapsLeft <= 0 || feedback || isChecking) return;
    const repl = getReplacement(lessonId, x, usedRef.current.map((u) => u.id), usedRef.current);
    if (!repl) {
      setSwapNote('Bài này không còn câu khác cùng cấp độ để đổi.');
      return;
    }
    stopSpeaking();
    setIsSpeaking(false);
    usedRef.current = [...usedRef.current, repl];
    extraMsRef.current += it.spentMs;
    const next = { ...itemsRef.current };
    delete next[x.id];
    next[repl.id] = { status: 'todo', answer: null, touched: false, remainingMs: repl.timeLimit * 1000, spentMs: 0, points: 0, speedBonus: 0 };
    itemsRef.current = next;
    setItems(next);
    setOrder((o) => o.map((q2, i) => (i === currentRef.current ? repl : q2)));
    setSwapsLeft((n) => n - 1);
    setSwapNote('');
    setShowSolution(false);
    playIf('tick');
  };

  // ---------------------------------------------------------------------------
  // Nghe đọc đề (đồng hồ dừng trong lúc đọc)
  // ---------------------------------------------------------------------------
  const handleSpeakPrompt = async () => {
    if (!q) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const readOptions = ['single_choice', 'true_false', 'multiple_choice'].includes(q.type) ? q.options : [];
    // Điền nhiều ô: đọc các dòng, ô trống đọc là "mấy"; bảng Đúng/Sai: đọc từng nhận định
    const extra = [
      ...(q.blanks ?? []).map((line) => line.replace(/\{\}/g, ' mấy ')),
      ...(q.statements ?? []).map((t, i) => `${String.fromCharCode(97 + i)}: ${t}`),
    ];
    const text = [q.prompt, ...extra].map((t) => (/[.!?:]$/.test(t.trim()) ? t : `${t}.`)).join(' ');
    const result = await speakSegments(questionSegments(text, readOptions, subjectCode), {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
    if (!result.ok) {
      setVoiceProblem(result.reason);
      setIsSpeaking(false);
    }
  };

  const onAnswerChange = useCallback(
    (value: AnswerValue) => {
      const x = order[currentRef.current];
      if (!x) return;
      const it = itemsRef.current[x.id];
      if (!it || isDone(it.status)) return;
      // Câu sắp xếp: lần gọi đầu là thứ tự xáo sẵn, chưa phải em làm
      patch(x.id, { answer: value, touched: it.touched || x.type !== 'ordering' || it.answer !== null });
    },
    [order, patch],
  );

  // ---------------------------------------------------------------------------
  // Giao diện
  // ---------------------------------------------------------------------------
  if (needSeed) return <LearnHeader />;

  if (!lesson || order.length === 0) {
    return (
      <>
        <LearnHeader />
        <main className="learn-main">
          <div className="empty-state">
            <h1>{lesson ? 'Bài này chưa có câu hỏi' : 'Không tìm thấy bài học'}</h1>
            <p>Em chọn một bài học khác nhé.</p>
            <Link href={backHref} className="button button-yellow">Về danh sách bài học</Link>
          </div>
        </main>
      </>
    );
  }

  const totalLimitSec = order.reduce((s, x) => s + x.timeLimit, 0);

  if (phase === 'intro') {
    const rank = rankFor(startTotal);
    return (
      <>
        <LearnHeader />
        <LessonDecor subject={subjectCode} animate={motion} />
        <main className="learn-main">
          <Link href={backHref} className="back-link">
            <ArrowLeft size={20} aria-hidden="true" /> Danh sách bài
          </Link>
          <section className="intro-card">
            <p className="lesson-tag">{lesson.title}</p>
            <h1>Sẵn sàng chưa nào?</h1>

            {knowledgeFor(lessonId) && <KnowledgeCard knowledge={knowledgeFor(lessonId)!} />}

            <div className="set-panel">
              <p className="set-panel-title">Chọn mức độ</p>
              <div className="muc-picker" role="radiogroup" aria-label="Mức độ của bộ câu hỏi">
                {MUC_LIST.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={!!seed && m === muc}
                    className={`muc-option is-m${m}`}
                    onClick={() => {
                      saveMucLesson(lessonId, m);
                      router.replace(newSetHref(m));
                    }}
                  >
                    <strong>{MUC[m].name}</strong>
                    <small>{MUC[m].describe}</small>
                  </button>
                ))}
              </div>
              <div className="set-actions">
                <button type="button" className="button button-practice" onClick={() => router.replace(newSetHref(muc))}>
                  <Dices size={20} aria-hidden="true" /> Đổi bộ câu hỏi
                </button>
                {seed && !practice && (
                  <button type="button" className="button button-white" onClick={() => { saveMucLesson(lessonId, null); router.replace(originalHref); }}>
                    Về bộ câu gốc
                  </button>
                )}
              </div>
              <p className="intro-seed">
                {seed ? <>Đang dùng: <strong>bộ câu mới, mức {MUC[muc].name}</strong>. Bấm “Đổi bộ câu hỏi” để lấy bộ khác — không trùng câu nào với bộ đang làm.</> : <>Đang dùng: <strong>bộ câu gốc của bài</strong>.</>}
              </p>
              {setNote && <p className="set-note">{setNote}</p>}
            </div>
            <fieldset className="timer-sound">
              <legend><Volume2 size={18} aria-hidden="true" /> Âm thanh đồng hồ</legend>
              <div className="timer-sound-options">
                {TIMER_SOUND_MODES.map((m) => (
                  <label key={m.id} className="timer-sound-option">
                    <input type="radio" name="timer-sound" value={m.id} checked={timerSound === m.id} onChange={() => chooseTimerSound(m.id)} />
                    <span>
                      <strong>{m.label}</strong>
                      <small>{m.hint}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <ul className="intro-facts">
              <li><strong>{order.length}</strong> câu hỏi</li>
              <li><Clock size={18} aria-hidden="true" /> tối đa <strong>{formatDuration(totalLimitSec * 1000)}</strong></li>
              <li>{rank.icon} Em đang có <strong>{startTotal}</strong> điểm</li>
            </ul>
            <div className="level-strip" aria-label="Số câu theo cấp độ">
              {LEVEL_LIST.map((lv) => {
                const n = order.filter((x) => x.level === lv).length;
                if (!n) return null;
                return (
                  <span key={lv} className={`level-chip is-l${lv}`}>
                    {LEVELS[lv].code} {LEVELS[lv].name} · {n} câu · {LEVELS[lv].points} điểm/câu
                  </span>
                );
              })}
            </div>
            <ol className="intro-rules">
              <li>Câu <strong>dễ</strong> làm trước, câu <strong>khó</strong> để cuối.</li>
              <li>Mỗi câu có <strong>đồng hồ đếm ngược</strong> có tiếng báo (chọn ở trên; nút 🔊 trên cùng tắt mọi âm thanh). Bấm <strong>Nghe đọc đề</strong> thì đồng hồ tạm dừng.</li>
              <li>Chưa làm được? Bấm <strong>Để sau</strong>, em quay lại làm câu đó sau.</li>
              <li>Muốn câu khác? Bấm <strong>Đổi câu khác</strong> để lấy câu mới cùng mức độ (tối đa {MAX_SWAPS} lần mỗi bài).</li>
              <li>Đúng và nhanh (dùng chưa tới nửa thời gian) được thưởng <strong>+{SPEED_BONUS} điểm</strong>.</li>
            </ol>
            <button
              type="button"
              className="button button-yellow intro-start"
              onClick={() => {
                if (soundEnabled) playSound('tick'); // mở khoá âm thanh trên iPad/Safari
                setPhase('quiz');
              }}
            >
              <Play size={20} aria-hidden="true" /> Bắt đầu làm bài
            </button>

          </section>
        </main>
      </>
    );
  }

  if (!q || !item) return <LearnHeader />;

  const doneCount = order.filter((x) => isDone(items[x.id]?.status ?? 'todo')).length;
  const unfinished = order.length - doneCount;
  const progressPercent = Math.round((doneCount / order.length) * 100);
  const submitted = isDone(item.status);
  const fb = feedback && feedback.id === q.id ? feedback : null;
  const feedbackClass = fb ? (fb.kind === 'correct' ? ' is-right' : ' is-wrong') : '';
  const otherUnfinished = order.some((x, i) => i !== current && !isDone(items[x.id]?.status ?? 'todo'));
  const paused = !running && !submitted;
  const lastOne = findNext(current) === -1;

  const navLabel = (st: ItemStatus) =>
    st === 'correct' ? 'đã làm đúng' : st === 'wrong' ? 'đã làm sai' : st === 'timeout' ? 'hết giờ' : st === 'skipped' ? 'để sau' : 'chưa làm';

  const trailMood = fb && motion ? (fb.kind === 'correct' ? 'jump' : 'tilt') : 'idle';
  const trailMessage = fb ? (fb.kind === 'correct' ? 'Giỏi quá!' : 'Cố lên, câu sau nhé!') : undefined;

  return (
    <>
      <LearnHeader />
      <LessonDecor subject={subjectCode} animate={motion} />

      <div className="quiz-bar">
        <div className="quiz-bar-inner">
          <button type="button" className="icon-button" aria-label="Thoát bài học" onClick={() => setDialog('exit')}>
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <div className="progress-track quiz-progress" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ bài học" style={{ marginTop: 0 }}>
            <div className="progress-fill is-green" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="quiz-count">{doneCount}/{order.length}</span>
          <button type="button" className="icon-button" aria-pressed={soundEnabled} aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'} onClick={() => setSoundEnabled((v) => !v)}>
            {soundEnabled ? <Volume2 size={22} aria-hidden="true" /> : <VolumeX size={22} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={`icon-button fx-toggle${fx ? ' is-on' : ''}`}
            aria-pressed={fx}
            aria-label={fx ? 'Tắt hiệu ứng (pháo giấy, Milo nhảy)' : 'Bật hiệu ứng (pháo giấy, Milo nhảy)'}
            title={fx ? 'Tắt hiệu ứng' : 'Bật hiệu ứng'}
            onClick={toggleFx}
          >
            <Sparkles size={22} aria-hidden="true" />
          </button>
          <button type="button" className="button button-dark quiz-submit" onClick={() => (unfinished > 0 ? setDialog('submit') : finish())}>
            <Flag size={18} aria-hidden="true" /> Nộp bài
          </button>
        </div>
        <nav className="quiz-nav" aria-label="Chọn câu hỏi">
          {order.map((x, i) => {
            const st = items[x.id]?.status ?? 'todo';
            return (
              <button
                key={x.id}
                type="button"
                className={`nav-dot is-${st} is-l${x.level}${i === current ? ' is-current' : ''}`}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`Câu ${i + 1}, ${LEVELS[x.level].code} ${LEVELS[x.level].name}, ${navLabel(st)}`}
                disabled={(isDone(st) && i !== current) || isChecking}
                onClick={() => i !== current && goTo(i)}
              >
                {st === 'correct' ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : st === 'wrong' ? <X size={16} strokeWidth={3} aria-hidden="true" /> : st === 'timeout' ? <Clock size={15} aria-hidden="true" /> : i + 1}
              </button>
            );
          })}
        </nav>
      </div>

      <main className={`learn-main${motion ? ' fx-on' : ''}`} style={{ paddingBottom: 240 }}>
        <section className="question-card">
          {motion && fb?.kind === 'correct' && <Confetti burst={fb.id} />}
          <MiloTrail statuses={order.map((x) => items[x.id]?.status ?? 'todo')} current={current} mood={trailMood} message={trailMessage} variant={SUBJECT_MASCOT[subjectCode]} />
          <div className="question-top">
            <div className="question-meta">
              <span className="lesson-tag">Câu {current + 1}/{order.length}</span>
              <span className={`level-chip is-l${q.level}`}>{LEVELS[q.level].code} · {LEVELS[q.level].name}</span>
              {item.status === 'skipped' && !submitted && <span className="skip-tag">Câu để sau</span>}
            </div>
            <TimerRing remainingMs={item.remainingMs} limitSec={q.timeLimit} paused={paused && phase === 'quiz'} />
          </div>

          <div className="question-tools">
            <button type="button" className="button button-white speak-button" onClick={handleSpeakPrompt}>
              <Volume2 size={20} aria-hidden="true" />
              <span>{isSpeaking ? 'Dừng đọc' : 'Nghe đọc đề'}</span>
            </button>
            {!submitted && (
              <button
                type="button"
                className="button button-white swap-button"
                disabled={swapsLeft <= 0 || isChecking}
                onClick={swapQuestion}
                title="Đổi sang câu khác cùng cấp độ"
              >
                <RefreshCw size={20} aria-hidden="true" />
                <span>Đổi câu khác</span>
                <span className="swap-count">{swapsLeft > 0 ? `còn ${swapsLeft}` : 'hết lượt'}</span>
              </button>
            )}
          </div>
          {swapNote && <p className="swap-note" role="status">{swapNote}</p>}

          {voiceProblem && <VoiceHelp reason={voiceProblem} onClose={() => setVoiceProblem(null)} />}

          {(() => {
            // Câu đọc hiểu (Tiếng Việt 2+): "Đọc bài "…":\n<bài đọc>\n\n<câu hỏi>" → khung bài đọc căn trái, câu hỏi bên dưới
            const m = /^Đọc bài "([^"]+)":\n([\s\S]+?)\n\n([\s\S]+)$/.exec(q.prompt);
            if (!m) return <h1 className="question-prompt">{q.prompt}</h1>;
            return (
              <>
                <section className="reading-box" aria-label={`Bài đọc: ${m[1]}`}>
                  <p className="reading-title">{m[1]}</p>
                  <p className="reading-text">{m[2]}</p>
                </section>
                <h1 className="question-prompt">{m[3]}</h1>
              </>
            );
          })()}

          {q.figure && <Figure figure={q.figure} />}

          <QuestionRenderer
            key={q.id}
            question={q}
            answer={item.answer}
            onAnswerChange={onAnswerChange}
            isSubmitted={submitted}
            isCorrect={item.status === 'correct'}
            onSubmit={handleCheck}
          />
        </section>

        {submitted && item.solution && (
          <section className="solution-card" aria-label="Lời giải">
            {!showSolution ? (
              <button
                type="button"
                className="button button-white"
                onClick={() => {
                  setShowSolution(true);
                  setHoldAdvance(true); // đọc lời giải thì không tự chuyển câu
                }}
              >
                <Lightbulb size={20} aria-hidden="true" /> Xem lời giải
              </button>
            ) : (
              <>
                <div className="solution-head">
                  <h2><Lightbulb size={22} aria-hidden="true" /> Lời giải</h2>
                  <button
                    type="button"
                    className="button button-white"
                    style={{ minHeight: 44 }}
                    onClick={async () => {
                      const r = await speakSegments(segmentsFor(item.solution ?? '', subjectCode));
                      if (!r.ok) setVoiceProblem(r.reason);
                    }}
                  >
                    <Volume2 size={18} aria-hidden="true" /> Nghe
                  </button>
                </div>
                <p className="solution-text">{item.solution}</p>
              </>
            )}
          </section>
        )}
      </main>

      <footer className={`feedback-bar${feedbackClass}`}>
        <div className="feedback-inner">
          <div className="feedback-text" aria-live="polite">
            {!submitted ? (
              <p>
                {paused && hidden ? 'Đồng hồ đang tạm dừng.' : isSpeaking ? 'Đang đọc đề, đồng hồ tạm dừng.' : <>Làm xong rồi bấm <strong>Kiểm tra</strong> nhé!</>}
                {otherUnfinished && <span className="feedback-sub">Còn {unfinished} câu chưa làm.</span>}
              </p>
            ) : (
              <>
                <span className="feedback-icon" aria-hidden="true">
                  {item.status === 'correct' ? <Check size={28} strokeWidth={3} /> : item.status === 'timeout' ? <Clock size={26} strokeWidth={3} /> : <X size={28} strokeWidth={3} />}
                </span>
                <div>
                  <h2>
                    {item.status === 'correct' ? 'Đúng rồi, em giỏi quá!' : item.status === 'timeout' ? 'Hết giờ rồi!' : 'Chưa đúng, cố lên nào!'}
                    {item.points > 0 && <span className="points-pop">+{item.points} điểm{item.speedBonus > 0 ? ' (nhanh!)' : ''}</span>}
                  </h2>
                  {item.explanation && <p>{item.explanation}</p>}
                  {fb && !holdAdvance && !dialog && (
                    <p className="advance-note">{lastOne ? 'Xem kết quả' : 'Sang câu tiếp'} sau {advanceLeft} giây…</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="feedback-actions">
            {!submitted ? (
              <>
                {otherUnfinished && (
                  <button type="button" className="button button-white" disabled={isChecking} onClick={goNext}>
                    <SkipForward size={18} aria-hidden="true" /> Để sau
                  </button>
                )}
                <button type="button" className="button button-yellow" disabled={!isAnswered(item.answer) || isChecking} onClick={handleCheck}>
                  {isChecking ? 'Đang chấm...' : 'Kiểm tra'}
                </button>
              </>
            ) : (
              <button type="button" className="button button-dark" onClick={goNext}>
                <span>{lastOne ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {dialog && (
        <div className="dialog-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(e) => e.stopPropagation()}>
            {dialog === 'submit' ? (
              <>
                <h2 id="dialog-title">Em muốn nộp bài?</h2>
                <p>Còn <strong>{unfinished}</strong> câu em chưa làm. Câu chưa làm sẽ không được tính điểm.</p>
                <div className="dialog-actions">
                  <button type="button" className="button button-yellow" autoFocus onClick={() => setDialog(null)}>Làm tiếp</button>
                  <button type="button" className="button button-white" onClick={() => { setDialog(null); finish(); }}>Nộp bài luôn</button>
                </div>
              </>
            ) : (
              <>
                <h2 id="dialog-title">Thoát bài học?</h2>
                <p>Bài đang làm sẽ không được lưu điểm.</p>
                <div className="dialog-actions">
                  <button type="button" className="button button-yellow" autoFocus onClick={() => setDialog(null)}>Ở lại làm tiếp</button>
                  <Link href={backHref} className="button button-white" onClick={() => stopSpeaking()}>Thoát</Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function LamBaiPage() {
  return (
    <Suspense fallback={null}>
      <GradeGate>
        <LamBaiContent />
      </GradeGate>
    </Suspense>
  );
}
