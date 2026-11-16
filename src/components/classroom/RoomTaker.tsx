'use client';

// Học sinh làm bài PHÒNG THI LỚP (migration 0062): đề riêng của em, đồng hồ theo giờ máy chủ, nộp một lần, máy chủ chấm.
// Kết quả: thang 10 + sao + huy hiệu Cú + lời Milo theo kỹ năng; xem lại đáp án khi phòng đã đóng.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import QuestionRenderer from '@/components/questions/QuestionRenderer';
import EmojiText from '@/components/EmojiText';
import { createClient } from '@/lib/supabase/client';
import { answerLabel, SUBJECT_NAME, toQuestion } from '@/lib/classroom/assignments';
import { keyLabel, miloRoomComment, owlOf, roomError, whenLabel, type RoomAnswer, type RoomItem } from '@/lib/classroom/rooms';
import type { AnswerValue, SubjectCode } from '@/lib/types';
import '@/styles/adm.css';
import '@/styles/exam.css';
import '@/styles/lesson.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/question.css';
import '@/styles/room.css';

type RoomData = {
  id: string; title: string; subject: SubjectCode; n_questions: number; minutes: number; opens_at: string; closes_at: string;
  is_open: boolean; server_now: string; started_at: string | null; questions: RoomItem[];
  done: boolean; score: number | null; correct: number | null; total: number | null; stars: number | null; max_stars: number | null;
  answers: RoomAnswer[]; review: boolean;
};
type Result = { score: number; correct: number; total: number; stars: number; maxStars: number; results: RoomAnswer[] };

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};
const empty = (v: AnswerValue | undefined) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const fmt = (n: number) => String(n).replace('.', ',');

export default function RoomTaker({ id }: { id: string }) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [err, setErr] = useState('');
  const [skew, setSkew] = useState(0); // giờ máy chủ - giờ máy em
  const [answers, setAnswers] = useState<AnswerValue[]>([]);
  const [cur, setCur] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const sentRef = useRef(false);
  const leavesRef = useRef(0);
  const kAns = `edukid:phong:${id}:ans`, kLeave = `edukid:phong:${id}:leave`;

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc('student_get_room', { p_room: id });
    const row = ((data ?? []) as RoomData[])[0];
    if (error || !row) return setErr(error ? roomError(error.message) : 'Không mở được phòng thi.');
    setSkew(new Date(row.server_now).getTime() - Date.now());
    setRoom(row);
    if (row.done) return;
    try { const a = JSON.parse(store.get(kAns) ?? '[]'); if (Array.isArray(a)) setAnswers(a); } catch { /* bỏ qua */ }
    leavesRef.current = Number(store.get(kLeave)) || 0;
  }, [id, kAns, kLeave]);
  useEffect(() => { void load(); }, [load]);

  const started = room?.started_at ? new Date(room.started_at).getTime() : null;
  const running = Boolean(started && room && !room.done && !result);
  useEffect(() => { if (!running) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [running]);
  useEffect(() => { if (running && answers.length) store.set(kAns, JSON.stringify(answers)); }, [answers, running, kAns]);
  // rời trang (chuyển tab / thu nhỏ) trong lúc làm: đếm để cô xem lại, không phạt
  useEffect(() => {
    if (!running) return;
    const on = () => { if (document.visibilityState === 'hidden') { leavesRef.current++; store.set(kLeave, String(leavesRef.current)); } };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, [running, kLeave]);

  const questions = useMemo(() => (room?.questions ?? []).map(toQuestion), [room]);
  const endAt = room && started ? Math.min(started + room.minutes * 60_000, new Date(room.closes_at).getTime()) : 0;
  const left = running ? Math.max(0, endAt - (now + skew)) : 0;

  const submit = useCallback(async () => {
    if (!room || sentRef.current) return;
    sentRef.current = true;
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/hoc-sinh/phong-thi/${id}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: questions.map((_, i) => answers[i] ?? null), leaves: leavesRef.current }),
      });
      const data = await res.json();
      if (!res.ok) { sentRef.current = res.status === 409; setErr(data.error ?? 'Chưa nộp được bài.'); return; }
      setResult(data as Result);
      store.del(kAns); store.del(kLeave);
    } catch {
      sentRef.current = false;
      setErr('Không kết nối được máy chủ. Kiểm tra mạng rồi bấm Nộp bài lần nữa.');
    } finally { setBusy(false); }
  }, [room, id, questions, answers, kAns, kLeave]);

  useEffect(() => { if (running && left === 0 && endAt) void submit(); }, [running, left, endAt, submit]);

  const start = async () => {
    setBusy(true); setErr('');
    const { data, error } = await createClient().rpc('student_start_room', { p_room: id });
    setBusy(false);
    if (error) return setErr(roomError(error.message));
    setRoom((r) => (r ? { ...r, started_at: data as string } : r));
    setNow(Date.now());
  };

  if (err && !room) return <p className="adm-alert is-error">{err}</p>;
  if (!room) return <p className="dash-muted">Đang mở phòng thi…</p>;

  const header = (
    <header className="dash-head">
      <div>
        <p className="dash-kicker">🌼 Phòng thi lớp · {SUBJECT_NAME[room.subject]} · {room.questions.length} câu · {room.minutes} phút</p>
        <h1>{room.title}</h1>
        <p className="dash-muted">Mở {whenLabel(room.opens_at)} – đóng {whenLabel(room.closes_at)}</p>
      </div>
    </header>
  );

  // ---------- đã nộp
  const done = result
    ? { score: result.score, correct: result.correct, total: result.total, stars: result.stars, max: result.maxStars, rows: result.results }
    : room.done ? { score: Number(room.score), correct: room.correct ?? 0, total: room.total ?? 0, stars: room.stars ?? 0, max: room.max_stars ?? 0, rows: room.answers } : null;
  if (done) {
    const owl = owlOf(done.score);
    const milo = miloRoomComment(done.rows);
    return (
      <>
        {header}
        <section className="dash-card room-result">
          <div className={`room-owl is-${owl.key}`} aria-hidden="true"><EmojiText text={owl.key === 'try' ? '🌱' : '🦉'} /></div>
          <div>
            <p className="room-score"><strong>{fmt(done.score)}</strong><span>/10</span></p>
            <p className="room-badge">{owl.key === 'try' ? 'Em đã hoàn thành bài thi — cố lên nhé!' : <>Em nhận huy hiệu <b>{owl.name}</b>!</>}</p>
            <p className="room-stars">⭐ {done.stars}/{done.max} sao · đúng {done.correct}/{done.total} câu</p>
          </div>
          <div className="room-milo">
            {milo.strong.length > 0 && <p>Milo thấy em đã vững: <b>{milo.strong.join(', ')}</b>.</p>}
            {milo.weak.length > 0 && <p>Em luyện thêm chút nữa: <b>{milo.weak.join(', ')}</b> nhé.</p>}
            {!milo.strong.length && !milo.weak.length && <p>Em làm đều tay lắm! Cô sẽ chữa bài trên lớp.</p>}
          </div>
          {!room.review && <p className="dash-muted">Đáp án và lời giải sẽ hiện ở đây sau khi cô đóng phòng thi.</p>}
          <Link href="/hoc-sinh" className="btn btn-primary">Về trang của em</Link>
        </section>
        {room.review && (
          <section className="dash-card room-review">
            <h2>Xem lại bài</h2>
            <ol>
              {room.questions.map((q, i) => {
                const r = room.answers.find((x) => x.i === i);
                return (
                  <li key={i} className={r?.ok ? 'is-ok' : 'is-wrong'}>
                    <p className="room-q">{r?.ok ? <CheckCircle2 aria-label="Đúng" /> : <XCircle aria-label="Chưa đúng" />} <EmojiText text={q.prompt.split('\n').pop() ?? q.prompt} /></p>
                    <p>Em trả lời: <b>{answerLabel(r?.a)}</b>{!r?.ok && <> · Đáp án: <b>{keyLabel(q.answer)}</b></>}</p>
                    {q.explanation && <p className="dash-muted"><EmojiText text={q.explanation} /></p>}
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </>
    );
  }

  // ---------- chưa bắt đầu
  if (!started) {
    const before = Date.now() + skew < new Date(room.opens_at).getTime();
    return (
      <>
        {header}
        <section className="dash-card exam-start">
          {room.is_open ? (
            <>
              <p>Đề của em có <strong>{room.questions.length} câu</strong>, làm trong <strong>{room.minutes} phút</strong>. Mỗi bạn một đề riêng, nên em cứ tự tin làm theo cách của mình nhé!</p>
              <p>Em làm <strong>một lần</strong>. Có thể quay lại sửa câu trước khi nộp; hết giờ máy tự nộp phần em đã làm.</p>
              <button type="button" className="btn btn-yellow" onClick={start} disabled={busy}>{busy ? 'Đang mở đề…' : 'Bắt đầu làm bài'}</button>
            </>
          ) : <p className="adm-alert is-info">{before ? `Phòng thi mở lúc ${whenLabel(room.opens_at)}. Em quay lại đúng giờ nhé!` : 'Phòng thi đã đóng. Nếu em chưa kịp làm, nhờ cô bấm “Cho làm lại”.'}</p>}
          {err && <p className="adm-alert is-error" role="alert">{err}</p>}
        </section>
      </>
    );
  }

  // ---------- đang làm
  const q = questions[cur];
  const m = /^Đọc bài "([^"]+)":\n([\s\S]+?)\n\n([\s\S]+)$/.exec(q.prompt);
  const answered = questions.filter((_, i) => !empty(answers[i])).length;
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  const setAnswer = (v: AnswerValue) => setAnswers((a) => { const n = [...a]; while (n.length < questions.length) n.push(null); n[cur] = v; return n; });
  const finish = () => {
    const missing = questions.length - answered;
    if (missing > 0 && !window.confirm(`Em còn ${missing} câu chưa làm. Vẫn nộp bài?`)) return;
    void submit();
  };

  return (
    <div className="exam-taker">
      <div className="exam-bar">
        <strong className="exam-bar-title">{room.title}</strong>
        <span className={`exam-timer${left < 60_000 ? ' is-low' : ''}`}><Clock aria-hidden="true" /> {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</span>
        <span className="dash-muted">Đã làm {answered}/{questions.length}</span>
      </div>
      <nav className="exam-nav" aria-label="Chọn câu">
        {questions.map((_, i) => (
          <button key={i} type="button" className={`exam-nav-btn${i === cur ? ' is-current' : ''}${!empty(answers[i]) ? ' is-answered' : ''}`} onClick={() => setCur(i)} aria-label={`Câu ${i + 1}${!empty(answers[i]) ? ' (đã làm)' : ''}`}>{i + 1}</button>
        ))}
      </nav>
      <section className="question-card">
        <div className="question-meta"><span className="lesson-tag">Câu {cur + 1}/{questions.length}</span></div>
        {m ? (
          <>
            <section className="reading-box" aria-label={`Bài đọc: ${m[1]}`}><p className="reading-title">{m[1]}</p><p className="reading-text">{m[2]}</p></section>
            <h1 className="question-prompt"><EmojiText text={m[3]} /></h1>
          </>
        ) : <h1 className="question-prompt"><EmojiText text={q.prompt} /></h1>}
        <QuestionRenderer key={q.id} question={q} answer={answers[cur] ?? null} onAnswerChange={setAnswer} isSubmitted={false} isCorrect={false}
          onSubmit={() => setCur((c) => Math.min(c + 1, questions.length - 1))} />
      </section>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      <div className="exam-actions">
        <button type="button" className="btn btn-outline" onClick={() => setCur((c) => Math.max(0, c - 1))} disabled={cur === 0}><ArrowLeft aria-hidden="true" /> Câu trước</button>
        {cur < questions.length - 1
          ? <button type="button" className="btn btn-primary" onClick={() => setCur((c) => c + 1)}>Câu sau <ArrowRight aria-hidden="true" /></button>
          : <button type="button" className="btn btn-yellow" onClick={finish} disabled={busy}><Send aria-hidden="true" /> {busy ? 'Đang nộp…' : 'Nộp bài'}</button>}
      </div>
      {cur < questions.length - 1 && <p className="exam-submit-early"><button type="button" className="mini-btn" onClick={finish} disabled={busy}><Send aria-hidden="true" /> Nộp bài ngay</button></p>}
    </div>
  );
}
