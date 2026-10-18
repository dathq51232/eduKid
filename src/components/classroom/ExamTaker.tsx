'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import QuestionRenderer from '@/components/questions/QuestionRenderer';
import { createClient } from '@/lib/supabase/client';
import { dueInfo, toQuestion, type ExamItem } from '@/lib/classroom/assignments';
import type { AnswerValue } from '@/lib/types';

type ExamRow = {
  id: string; title: string; subject: string | null; minutes: number | null; due_at: string; status: 'open' | 'closed';
  questions: ExamItem[]; submitted: boolean; score: number | null; max_score: number | null; correct: number | null; total: number | null;
  answers: { i: number; ok: boolean }[];
};
type Result = { score: number; max: number; correct: number; total: number; results: { i: number; ok: boolean }[] };

const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};
const empty = (v: AnswerValue | undefined) => v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Học sinh làm đề thầy cô giao trên app: từng câu một, có giờ, nộp một lần; máy chủ chấm. */
export default function ExamTaker({ id }: { id: string }) {
  const [exam, setExam] = useState<ExamRow | null>(null);
  const [err, setErr] = useState('');
  const [started, setStarted] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerValue[]>([]);
  const [cur, setCur] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const sentRef = useRef(false);
  const kStart = `edukid:de:${id}:start`, kAns = `edukid:de:${id}:ans`;

  useEffect(() => {
    void (async () => {
      const { data, error } = await createClient().rpc('student_get_exam', { p_assignment: id });
      const row = ((data ?? []) as ExamRow[])[0];
      if (error || !row) return setErr('Không mở được đề. Có thể đề không giao cho em, hoặc thầy cô đã xoá đề.');
      setExam(row);
      if (row.submitted) return;
      const s = Number(store.get(kStart));
      if (s > 0) setStarted(s);
      try { const a = JSON.parse(store.get(kAns) ?? '[]'); if (Array.isArray(a)) setAnswers(a); } catch { /* bỏ qua */ }
    })();
  }, [id, kStart, kAns]);

  useEffect(() => { if (started) { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); } }, [started]);
  useEffect(() => { if (started && answers.length) store.set(kAns, JSON.stringify(answers)); }, [answers, started, kAns]);

  const questions = useMemo(() => (exam?.questions ?? []).map(toQuestion), [exam]);
  const limitMs = (exam?.minutes ?? 30) * 60_000;
  const left = started ? Math.max(0, limitMs - (now - started)) : limitMs;

  const submit = useCallback(async () => {
    if (!exam || sentRef.current) return;
    sentRef.current = true;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`/api/hoc-sinh/bai-giao/${id}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers: questions.map((_, i) => answers[i] ?? null), durationMs: started ? Date.now() - started : null }),
      });
      const data = await res.json();
      if (!res.ok) { sentRef.current = res.status === 409; setErr(data.error ?? 'Chưa nộp được bài.'); return; }
      setResult(data as Result);
      store.del(kStart); store.del(kAns);
    } catch {
      sentRef.current = false;
      setErr('Không kết nối được máy chủ. Kiểm tra mạng rồi bấm Nộp bài lần nữa.');
    } finally {
      setBusy(false);
    }
  }, [exam, id, questions, answers, started, kStart, kAns]);

  // hết giờ thì tự nộp
  useEffect(() => { if (started && left === 0 && !result) void submit(); }, [left, started, result, submit]);

  if (err && !exam) return <p className="adm-alert is-error">{err}</p>;
  if (!exam) return <p className="dash-muted">Đang mở đề…</p>;

  const header = (
    <header className="dash-head">
      <div>
        <p className="dash-kicker">Đề thầy cô giao · {exam.questions.length} câu · {exam.minutes ?? 30} phút</p>
        <h1>{exam.title}</h1>
        <p className="dash-muted">Hạn nộp: {dueInfo(exam.due_at).label}</p>
      </div>
    </header>
  );

  // ---------- đã nộp
  const done = result ?? (exam.submitted ? { score: Number(exam.score), max: Number(exam.max_score), correct: exam.correct ?? 0, total: exam.total ?? 0, results: exam.answers } : null);
  if (done) {
    const ten = done.max ? (done.score * 10) / done.max : 0;
    return (
      <>
        {header}
        <section className="dash-card exam-result">
          <h2><CheckCircle2 aria-hidden="true" /> Em đã nộp bài</h2>
          <p className="exam-score"><strong>{fmt(done.score)}</strong> / {fmt(done.max)} điểm{done.max !== 10 ? ` (≈ ${fmt(ten)}/10)` : ''}</p>
          <p>Em làm đúng {done.correct}/{done.total} câu. {ten >= 9 ? 'Xuất sắc!' : ten >= 7 ? 'Làm tốt lắm!' : ten >= 5 ? 'Cố gắng thêm chút nữa nhé!' : 'Em ôn lại bài rồi hỏi thầy cô những câu chưa hiểu nhé.'}</p>
          <ol className="exam-result-list">
            {questions.map((q, i) => {
              const ok = done.results.find((r) => r.i === i)?.ok;
              return <li key={i} className={ok ? 'is-ok' : 'is-wrong'}>{ok ? <CheckCircle2 aria-label="Đúng" /> : <XCircle aria-label="Chưa đúng" />} Câu {i + 1}</li>;
            })}
          </ol>
          <p className="dash-muted">Thầy cô sẽ chữa bài trên lớp.</p>
          <Link href="/hoc-sinh" className="btn btn-primary">Về trang của em</Link>
        </section>
      </>
    );
  }

  if (exam.status !== 'open') return (<>{header}<p className="adm-alert is-info">Thầy cô đã đóng đề này nên em không nộp được nữa.</p><Link href="/hoc-sinh" className="btn btn-outline">Về trang của em</Link></>);

  // ---------- chưa bắt đầu
  if (!started) {
    return (
      <>
        {header}
        <section className="dash-card exam-start">
          <p>Đề có <strong>{exam.questions.length} câu</strong>, em làm trong <strong>{exam.minutes ?? 30} phút</strong>. Làm xong câu nào em chuyển câu tiếp theo; có thể quay lại sửa trước khi nộp.</p>
          <p>Bấm <strong>Nộp bài</strong> khi làm xong. Hết giờ máy tự nộp. <strong>Mỗi em chỉ nộp một lần.</strong></p>
          <button type="button" className="btn btn-yellow" onClick={() => { const t = Date.now(); store.set(kStart, String(t)); setStarted(t); setNow(t); }}>Bắt đầu làm bài</button>
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
        <strong className="exam-bar-title">{exam.title}</strong>
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
            <h1 className="question-prompt">{m[3]}</h1>
          </>
        ) : <h1 className="question-prompt">{q.prompt}</h1>}
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
