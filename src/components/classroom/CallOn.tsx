'use client';

// Gọi tên – Dò bài: 4 kiểu gọi (vòng quay, bốc thăm, đua thú, trứng nở) để chiếu lên màn hình lớp.
// Không gọi lại em đã lên, bỏ qua em vắng, hiện một câu dò bài theo bài đang học, chấm ✓ ✗ ★.
// Tất cả lưu trên máy đang chiếu (localStorage) — chưa gửi lên máy chủ.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Maximize2, Minimize2, RotateCcw, Users, Volume2, VolumeX, X } from 'lucide-react';
import MiloMascot, { type MiloVariant } from '@/components/mascot/MiloMascot';
import {
  CALL_MODES, addTally, candidatesOf, lotsFor, pickOne, presentOf, raceFor, racePos, restoreState, shortName, wheelAngle,
  type CallMode, type CallState, type Student, type Tally,
} from '@/lib/classroom/callon';
import { bookLessons, lessonPool, type ExamQuestion } from '@/lib/exams/matrix';
import { answerText } from '@/lib/exams/word';
import type { SubjectCode } from '@/lib/types';

const SUBJECTS: { code: SubjectCode; name: string; milo: MiloVariant }[] = [
  { code: 'toan', name: 'Toán', milo: 'professor' },
  { code: 'tieng-viet', name: 'Tiếng Việt', milo: 'artist' },
  { code: 'tieng-anh', name: 'Tiếng Anh', milo: 'astronaut' },
];
const COLORS = ['#2457c5', '#d93f45', '#1f9d6b', '#ffc83d', '#6d3fe0', '#2f8de0'];
const LETTERS = 'ABCDEFGH';

type Phase = 'idle' | 'running' | 'done';
type RaceLane = ReturnType<typeof raceFor>[number];

const hashId = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/* ------------------------------------------------------------ âm thanh (WebAudio, không cần file) */
function useSound(on: boolean) {
  const ctx = useRef<AudioContext | null>(null);
  const beep = useCallback((freq: number, ms = 60, type: OscillatorType = 'triangle', vol = 0.08) => {
    if (!on || typeof window === 'undefined') return;
    try {
      ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const c = ctx.current, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + ms / 1000);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + ms / 1000);
    } catch { /* trình duyệt chặn âm thanh: bỏ qua */ }
  }, [on]);
  const fanfare = useCallback(() => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 180, 'square', 0.05), i * 110)); }, [beep]);
  return { beep, fanfare };
}

export default function CallOn({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
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
  const reduced = useRef(false);
  const { beep, fanfare } = useSound(s.sound);

  // đọc / ghi trạng thái trên máy
  useEffect(() => {
    try { setS(restoreState(localStorage.getItem(storeKey))); } catch { /* chế độ riêng tư */ }
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setLoaded(true);
  }, [storeKey]);
  useEffect(() => { if (loaded) { try { localStorage.setItem(storeKey, JSON.stringify(s)); } catch { /* bỏ qua */ } } }, [s, loaded, storeKey]);

  const present = useMemo(() => presentOf(students, s), [students, s]);
  const { list: cands } = useMemo(() => candidatesOf(students, s), [students, s]);
  const calledCount = present.filter((x) => s.called.includes(x.id)).length;
  const lessons = useMemo(() => bookLessons(s.subject as SubjectCode, grade), [s.subject, grade]);
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
    setPhase('done');
    setS((x) => ({ ...x, called: x.called.includes(st.id) ? x.called : [...x.called, st.id] }));
    fanfare();
  }, [nextQuestion, fanfare]);

  const mark = (m: keyof Tally) => {
    if (!picked) return;
    setS((x) => addTally(x, picked.id, m));
    closeResult();
  };
  const closeResult = () => { setPhase('idle'); setPicked(null); setQuestion(null); setNotice(''); setTaps(0); setFlipped(null); };

  /* -------------------------------------------- 1. vòng quay */
  // ô trên vòng = các em còn có thể được gọi; giữ nguyên trong lúc quay và lúc hiện kết quả
  const [wheelSnap, setWheelSnap] = useState<Student[] | null>(null);
  const wheelList = phase !== 'idle' && wheelSnap ? wheelSnap : cands;
  const [angle, setAngle] = useState(0);
  const spinWheel = () => {
    const st = choose();
    if (!st) return;
    const list = candidatesOf(students, s).list;
    const i = list.findIndex((x) => x.id === st.id);
    setWheelSnap(list);
    const dur = reduced.current ? 300 : 4200;
    setAngle((a) => wheelAngle(i, list.length, a, reduced.current ? 1 : 6));
    setPhase('running');
    if (!reduced.current) { let k = 0; const tick = () => { k++; beep(900 + (k % 2) * 200, 30); if (k < 40) setTimeout(tick, 30 + k * k * 0.12); }; tick(); }
    setTimeout(() => reveal(st), dur + 150);
  };

  /* -------------------------------------------- 2. bốc thăm */
  const lots = useMemo(() => lotsFor(students, s, hashId(classId)), [students, s, classId]);
  const [flipped, setFlipped] = useState<number | null>(null);
  const drawLot = (index?: number) => {
    let i = index;
    if (i === undefined) {
      const st = choose();
      if (!st) return;
      i = lots.findIndex((x) => x.id === st.id);
    } else if (s.noRepeat && s.called.includes(lots[i].id)) return;
    const st = lots[i];
    if (!st) return;
    setFlipped(i);
    setPhase('running');
    beep(660, 90); setTimeout(() => beep(880, 90), 120);
    setTimeout(() => reveal(st), reduced.current ? 200 : 900);
  };

  /* -------------------------------------------- 3. đua thú */
  const [race, setRace] = useState<RaceLane[] | null>(null);
  const [raceT, setRaceT] = useState(0);
  const runRace = () => {
    const st = choose();
    if (!st) return;
    const lanes = raceFor(st, present);
    setRace(lanes);
    setRaceT(0);
    setPhase('running');
    const winnerAt = lanes.find((l) => l.student.id === st.id)!.finish;
    const speed = reduced.current ? 6 : 1;
    const t0 = performance.now();
    let lastBeat = 0;
    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * speed;
      setRaceT(t);
      if (t - lastBeat > 0.25) { lastBeat = t; beep(220 + Math.random() * 60, 50, 'sine', 0.05); }
      if (t < winnerAt) requestAnimationFrame(frame);
      else { setRaceT(winnerAt); reveal(st); }
    };
    requestAnimationFrame(frame);
  };

  /* -------------------------------------------- 4. trứng nở */
  const [taps, setTaps] = useState(0);
  const tapEgg = (from: number) => {
    const n = from + 1;
    beep(300 + n * 140, 120, 'square', 0.05);
    if (n < 3) { setTaps(n); return; }
    const st = choose();
    if (!st) return;
    setTaps(3);
    setPhase('running');
    setTimeout(() => reveal(st), reduced.current ? 150 : 650);
  };

  /* -------------------------------------------- nút chính + phím cách */
  const go = () => {
    if (phase === 'running') return;
    const wasDone = phase === 'done';
    if (wasDone) closeResult();
    if (!present.length) { setNotice('Chưa có em nào có mặt. Mở danh sách để bỏ đánh dấu vắng.'); return; }
    if (s.mode === 'wheel') spinWheel();
    else if (s.mode === 'lots') drawLot();
    else if (s.mode === 'race') runRace();
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
              <svg viewBox="0 0 540 540" className="cw-wheel" style={{ transform: `rotate(${angle}deg)`, transitionDuration: reduced.current ? '300ms' : '4200ms' }} aria-hidden="true">
                {wheelList.map((st, i) => {
                  const n = wheelList.length, R = 266, c = 270;
                  if (n === 1) return <circle key={st.id} cx={c} cy={c} r={R} fill={COLORS[0]} />;
                  const a0 = ((i * 360) / n - 90) * Math.PI / 180, a1 = (((i + 1) * 360) / n - 90) * Math.PI / 180;
                  const large = 360 / n > 180 ? 1 : 0;
                  const col = COLORS[i % COLORS.length];
                  const mid = ((i + 0.5) * 360) / n - 90;
                  return (
                    <g key={st.id}>
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
          </div>
        )}

        {s.mode === 'lots' && (
          <div className="cl">
            <p className="callon-hint">Bấm một lá thăm, hoặc bấm <b>Bốc thăm</b> để Milo bốc giúp</p>
            <ol className="cl-grid" style={{ ['--cols' as string]: String(Math.max(5, Math.min(10, Math.ceil(lots.length / 3)))) }}>
              {lots.map((st, i) => {
                const used = s.noRepeat && s.called.includes(st.id) && flipped !== i;
                return (
                  <li key={st.id}>
                    <button type="button" className={`cl-lot${used ? ' is-used' : ''}${flipped === i ? ' is-flip' : ''}`} style={{ ['--c' as string]: COLORS[i % 5 === 3 ? 4 : i % 5] }}
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
            <p className="callon-hint">{race ? 'Em về đích đầu tiên được gọi' : `Bấm Xuất phát: ${Math.min(6, present.length)} em ngẫu nhiên vào đua`}</p>
            <div className="cr-track">
              <span className="cr-finish" aria-hidden="true" />
              {(race ?? Array.from({ length: Math.min(6, Math.max(1, present.length)) }, (_, i) => ({ student: { id: `?${i}`, name: '?' }, animal: ['🐢', '🐇', '🦆', '🐘', '🐎', '🐿️'][i], finish: 1, wobble: 1 }))).map((l) => {
                const p = race ? racePos(raceT, l.finish, l.wobble) : 0;
                const win = phase === 'done' && picked?.id === l.student.id;
                return (
                  <div key={l.student.id} className={`cr-lane${win ? ' is-win' : ''}`}>
                    <span className="cr-name">{race ? l.student.name : 'Ai sẽ vào đua?'}</span>
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
            <button type="button" className={`ce-egg taps-${taps}${phase === 'done' ? ' is-open' : ''}`} onClick={go} aria-label={phase === 'done' ? 'Gõ quả trứng mới' : `Gõ trứng (${taps}/3)`}>
              <span className="ce-nest" aria-hidden="true" />
              {phase === 'done' && <span className="ce-milo"><MiloMascot variant={subject.milo} size={180} /></span>}
              <span className="ce-shell" aria-hidden="true"><i /><i /></span>
              {taps > 0 && phase !== 'done' && <span className="ce-count" aria-hidden="true">{taps}/3</span>}
            </button>
          </div>
        )}

        {/* ------------------------------------------------ kết quả */}
        {phase === 'done' && picked && (
          <div className="callon-result" role="dialog" aria-label={`Mời ${picked.name}`}>
            <button type="button" className="callon-close" aria-label="Đóng" onClick={closeResult}><X aria-hidden="true" /></button>
            <div className="callon-who">
              <MiloMascot variant={subject.milo} size={64} />
              <div><p>Mời bạn lên bảng</p><h2>{picked.name}</h2></div>
            </div>
            {question && (
              <div className="callon-q">
                <small>Câu dò bài · {subject.name}{lessonTitle ? ` · ${lessonTitle}` : ''}</small>
                <p>{question.prompt}</p>
                {question.statements?.length ? <ul className="callon-st">{question.statements.map((t) => <li key={t}>{t}</li>)}</ul> : null}
                {question.blanks?.length ? <ul className="callon-st">{question.blanks.map((t) => <li key={t}>{t.replace(/\{\}/g, '……')}</li>)}</ul> : null}
                {question.options.length > 0 && question.type !== 'ordering' && (
                  <ol className="callon-opts">{question.options.map((o, i) => <li key={o}><b>{LETTERS[i]}.</b> {o}</li>)}</ol>
                )}
                {question.type === 'ordering' && <p className="callon-st">Sắp xếp: {question.options.join(' · ')}</p>}
                <button type="button" className="callon-ans" onClick={() => setShowAnswer((v) => !v)}>
                  {showAnswer ? <><EyeOff aria-hidden="true" /> Đáp án: <strong>{answerText(question)}</strong></> : <><Eye aria-hidden="true" /> Xem đáp án</>}
                </button>
              </div>
            )}
            <div className="callon-marks">
              <button type="button" className="m-ok" onClick={() => mark('ok')}>✓ Đúng</button>
              <button type="button" className="m-no" onClick={() => mark('no')}>✗ Chưa đúng</button>
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
