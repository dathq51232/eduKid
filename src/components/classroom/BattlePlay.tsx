'use client';

// ĐẤU CẶP MẮT XÍCH — máy của em (migration 0073, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2).
// Sảnh chờ → trận của em (từng câu, đồng hồ theo máy chủ, không báo đúng/sai từng câu) → kết quả trận → chờ vòng sau
// hoặc dừng lại (lời Milo khen cố gắng). Tải lại trạng thái mỗi 2,5 giây; chỉ vẽ lại khi dữ liệu đổi.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Swords, Timer, Volume2 } from 'lucide-react';
import QuestionRenderer from '@/components/questions/QuestionRenderer';
import VoiceHelp from '@/components/VoiceHelp';
import { speakableQuestion, speakSegments, stopSpeaking } from '@/lib/speech';
import { SUBJECT_NAME, toQuestion, type ExamItem } from '@/lib/classroom/assignments';
import { REASON_LABEL, battleError, fmtMs, type WinReason } from '@/lib/classroom/battle';
import type { AnswerValue, SubjectCode } from '@/lib/types';
import '@/styles/btn.css';
import '@/styles/question.css';
import '@/styles/bt.css';

type Result = { won: boolean; reason: WinReason | null; myCorrect: number; oppCorrect: number; myMs: number; oppMs: number; total: number };
type State = {
  phase: 'lobby' | 'bye' | 'question' | 'wait' | 'won' | 'out' | 'champion' | 'closed';
  room: { id: string; title: string; subject: SubjectCode; status: string; round: number; n: number; sec: number };
  me: { name: string }; players: number; alive: number; roundName: string; championName: string | null;
  opponent?: string; oppAt?: number; oppDone?: boolean; total?: number; myAt?: number;
  i?: number; item?: ExamItem; remainingMs?: number; last?: Result | null; outRound?: number; milo?: string;
};

const POLL_MS = 2500;

export default function BattlePlay({ id }: { id: string }) {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState('');
  const [answer, setAnswer] = useState<AnswerValue>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0); // giây còn lại của câu (chỉ đổi mỗi giây)
  const [speaking, setSpeaking] = useState(false);
  const [voiceProblem, setVoiceProblem] = useState<'unsupported' | 'no_vi_voice' | null>(null);
  const lastJson = useRef('');
  const deadline = useRef(0);
  const qKey = useRef(''); // câu đang hiện (vòng + vị trí) — đổi câu thì xoá đáp án đang chọn
  const sending = useRef(false);

  const apply = useCallback((d: State) => {
    const json = JSON.stringify({ ...d, remainingMs: undefined, serverNow: undefined });
    const key = d.phase === 'question' ? `${d.room.round}:${d.i}` : '';
    if (key && key !== qKey.current) {
      qKey.current = key;
      setAnswer(null);
      deadline.current = Date.now() + (d.remainingMs ?? 0);
      setLeft(Math.ceil((d.remainingMs ?? 0) / 1000));
      stopSpeaking(); setSpeaking(false);
    }
    if (!key) qKey.current = '';
    if (json !== lastJson.current) { lastJson.current = json; setS(d); }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/hoc-sinh/dau-cap/${id}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) { setErr(battleError(d.error)); return; }
      setErr(''); apply(d as State);
    } catch { /* mất mạng: lần sau thử lại */ }
  }, [id, apply]);

  useEffect(() => {
    void load();
    const t = setInterval(() => { if (!sending.current) void load(); }, POLL_MS);
    return () => { clearInterval(t); stopSpeaking(); };
  }, [load]);

  const submit = useCallback(async (value: AnswerValue) => {
    if (!s || s.phase !== 'question' || sending.current) return;
    sending.current = true; setBusy(true);
    try {
      const res = await fetch(`/api/hoc-sinh/dau-cap/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ i: s.i, answer: value }) });
      const d = await res.json();
      if (res.ok) apply(d as State); else setErr(battleError(d.error));
    } catch { setErr('Mất kết nối — em kiểm tra mạng rồi bấm lại nhé.'); }
    finally { sending.current = false; setBusy(false); }
  }, [s, id, apply]);

  // đồng hồ câu: cập nhật mỗi giây; hết giờ thì tự nộp đáp án đang chọn
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    if (s?.phase !== 'question') return;
    const t = setInterval(() => {
      const sec = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft((x) => (x === sec ? x : sec));
      if (sec === 0) void submit(answerRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [s?.phase, s?.i, submit]);

  if (err && !s) return <p className="adm-alert is-error" role="alert">{err}</p>;
  if (!s) return <p className="dash-muted">Đang vào phòng đấu…</p>;

  const head = (
    <header className="bt-head">
      <p className="bt-kicker">{SUBJECT_NAME[s.room.subject]} · Đấu cặp Mắt Xích</p>
      <h1>{s.room.title}</h1>
    </header>
  );

  if (s.phase === 'question' && s.item) {
    const q = toQuestion(s.item, s.i ?? 0);
    const speak = async () => {
      if (speaking) { stopSpeaking(); setSpeaking(false); return; }
      const r = await speakSegments(speakableQuestion(q, s.room.subject), { onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
      if (!r.ok) { setVoiceProblem(r.reason); setSpeaking(false); }
    };
    return (
      <div className="bt-play">
        <div className="bt-vs" aria-label="Trận của em">
          <div className="bt-side is-me"><b>{s.me.name || 'Em'}</b><span>Câu {(s.i ?? 0) + 1}/{s.total}</span></div>
          <Swords aria-hidden="true" className="bt-vs-ico" />
          <div className="bt-side"><b>{s.opponent}</b><span>{s.oppDone ? 'Đã xong' : `Câu ${Math.min((s.oppAt ?? 0) + 1, s.total ?? 0)}/${s.total}`}</span></div>
        </div>
        <p className="bt-round">{s.roundName} · vòng {s.room.round}</p>
        <section className="question-card bt-q">
          <div className="bt-q-top">
            <span className={`bt-timer${left <= 5 ? ' is-low' : ''}`} role="timer" aria-label={`Còn ${left} giây`}><Timer aria-hidden="true" /> {left}s</span>
            <button type="button" className="button button-white speak-button" aria-pressed={speaking} onClick={() => void speak()}>
              <Volume2 size={20} aria-hidden="true" /><span>{speaking ? 'Dừng đọc' : 'Nghe đọc đề'}</span>
            </button>
          </div>
          {voiceProblem && <VoiceHelp reason={voiceProblem} onClose={() => setVoiceProblem(null)} />}
          <QuestionRenderer key={qKey.current} question={q} answer={answer} onAnswerChange={setAnswer} isSubmitted={false} isCorrect={false} onSubmit={() => void submit(answer)} />
        </section>
        <div className="bt-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit(answer)}>{busy ? 'Đang gửi…' : (s.i ?? 0) + 1 >= (s.total ?? 0) ? 'Chốt câu cuối' : 'Chốt đáp án →'}</button>
        </div>
        {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      </div>
    );
  }

  const r = s.last;
  const resultLine = r && (
    <p className="bt-score">Em đúng <b>{r.myCorrect}/{r.total}</b> câu ({fmtMs(r.myMs)}) · bạn đúng <b>{r.oppCorrect}/{r.total}</b> ({fmtMs(r.oppMs)})</p>
  );

  return (
    <div className="bt-wait">
      {head}
      {s.phase === 'lobby' && (
        <div className="bt-card">
          <p className="bt-big">🦉 Em đã vào phòng!</p>
          <p>Có <b>{s.players}</b> bạn trong phòng. Chờ cô bốc thăm chia cặp nhé.</p>
        </div>
      )}
      {s.phase === 'bye' && (
        <div className="bt-card is-good">
          <p className="bt-big">🎟️ Em nhận vé đi tiếp!</p>
          <p>Vòng này em không phải đấu. Chờ các bạn đấu xong rồi cô bốc thăm vòng sau nhé.</p>
        </div>
      )}
      {s.phase === 'wait' && (
        <div className="bt-card">
          <p className="bt-big">✅ Em đã làm xong!</p>
          <p>Chờ bạn <b>{s.opponent}</b> {s.oppDone ? 'xong rồi, máy đang tính kết quả…' : `(đang ở câu ${Math.min((s.oppAt ?? 0) + 1, s.total ?? 0)}/${s.total})…`}</p>
        </div>
      )}
      {s.phase === 'won' && (
        <div className="bt-card is-good">
          <p className="bt-big">🎉 Em thắng trận với bạn {s.opponent}!</p>
          {resultLine}
          {r?.reason && <p className="dash-muted">Phân định: {REASON_LABEL[r.reason]}.</p>}
          <p>Còn <b>{s.alive}</b> bạn trong cuộc đấu. Chờ cô bốc thăm vòng sau nhé.</p>
        </div>
      )}
      {s.phase === 'out' && (
        <div className="bt-card">
          <p className="bt-big">🦉 {s.milo}</p>
          {resultLine}
          {r?.reason && r.reason !== 've' && <p className="dash-muted">Trận với bạn {s.opponent}: {REASON_LABEL[r.reason]}.</p>}
          {s.championName && <p>🏆 Nhà vô địch hôm nay: <b>{s.championName}</b>. Cùng vỗ tay cho bạn nào!</p>}
        </div>
      )}
      {s.phase === 'champion' && (
        <div className="bt-card is-champ">
          <p className="bt-big">🏆 Em là nhà vô địch Đấu cặp hôm nay!</p>
          {resultLine}
          <p>Milo chúc mừng em! Nhớ cảm ơn các bạn đã đấu cùng nhé.</p>
        </div>
      )}
      {s.phase === 'closed' && <div className="bt-card"><p className="bt-big">Phòng đấu đã đóng.</p><p>Cảm ơn em đã tham gia!</p></div>}
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
    </div>
  );
}
