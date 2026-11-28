'use client';

// ĐẤU TỔ TRÊN LỚP — cô chiếu câu hỏi lên bảng, CẢ LỚP trả lời bằng BẢNG CON (không cần máy cho từng em):
//   mỗi câu: hiện câu hỏi + đếm ngược → hết giờ “Giơ bảng!” → cô hiện đáp án, bấm chọn các tổ trả lời đúng
//   → mỗi tổ đúng +1 điểm, sai không được cộng → câu tiếp theo.
//   Hết câu (hoặc cô bấm Kết thúc): bảng xếp hạng tổ, cô cộng điểm Thi đua tổ hạng 1–3 (+3 / +2 / +1).
// Câu hỏi sinh trên máy cô từ chủ đề + quy tắc của form Tạo phòng (đề chung). Trạng thái chỉ ở trên máy đang chiếu.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crown, Eye, Maximize2, Minimize2, Pause, Play, SkipForward, Timer, X } from 'lucide-react';
import EmojiText from '@/components/EmojiText';
import { createClient } from '@/lib/supabase/client';
import { teamIconSrc } from '@/lib/classroom/class-tools';
import { answerText } from '@/lib/exams/word';
import type { PaperSlot } from '@/lib/exams/matrix';
import { TEAM_AWARD, liveAwardReason, type TeamSnap } from '@/lib/classroom/team-battle';
import '@/styles/btn.css';
import '@/styles/dto.css';

type Stage = 'ask' | 'check' | 'scored';
const L = 'ABCDEFGH';
const TIMES = [15, 30, 45, 60];

function TeamPic({ emoji, size }: { emoji: string; size: number }) {
  const src = teamIconSrc(emoji);
  // eslint-disable-next-line @next/next/no-img-element -- hình 3D nhỏ đã tối ưu sẵn (webp)
  return src ? <img src={src} width={size} height={size} style={{ width: size, height: size }} alt="" aria-hidden="true" className="ic3d" decoding="async" />
    : <span style={{ fontSize: size * 0.8, lineHeight: 1 }} aria-hidden="true">{emoji}</span>;
}

export default function TeamQuiz({ classId, title, teams, questions, onClose }: {
  classId: string; title: string; teams: TeamSnap[]; questions: PaperSlot[]; onClose: () => void;
}) {
  const [qi, setQi] = useState(0);
  const [stage, setStage] = useState<Stage>('ask');
  const [secs, setSecs] = useState(30);
  const [left, setLeft] = useState(30);
  const [paused, setPaused] = useState(false);
  const [ok, setOk] = useState<number[]>([]); // các tổ cô chọn là trả lời đúng ở câu hiện tại
  const [hist, setHist] = useState<number[][]>([]); // hist[i] = các tổ đúng ở câu i
  const [done, setDone] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [full, setFull] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const q = questions[qi];
  const scores = useMemo(() => {
    const s: Record<number, number> = Object.fromEntries(teams.map((t) => [t.no, 0]));
    for (const row of hist) for (const no of row) s[no] = (s[no] ?? 0) + 1;
    return s;
  }, [teams, hist]);
  // hạng = 1 + số tổ nhiều điểm hơn (bằng điểm thì cùng hạng)
  const ranking = useMemo(() => {
    const list = teams.map((t) => ({ ...t, pts: scores[t.no] ?? 0 }));
    return list.map((t) => ({ ...t, rank: 1 + list.filter((x) => x.pts > t.pts).length })).sort((a, b) => a.rank - b.rank);
  }, [teams, scores]);

  // đếm ngược: một lần mỗi giây, chỉ khi đang hỏi
  useEffect(() => {
    if (stage !== 'ask' || paused || left <= 0) return;
    const t = window.setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, paused, left]);
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen?.().catch(() => undefined); };

  const reveal = () => { setStage('check'); setOk([]); };
  const toggle = (no: number) => setOk((s) => (s.includes(no) ? s.filter((x) => x !== no) : [...s, no]));
  const score = () => { setHist((h) => { const n = [...h]; n[qi] = ok; return n; }); setStage('scored'); };
  const next = () => {
    if (qi + 1 >= questions.length) { setDone(true); return; }
    setQi((i) => i + 1); setStage('ask'); setOk([]); setLeft(secs); setPaused(false);
  };
  const close = () => { if (done || !hist.length || window.confirm('Thoát Đấu tổ? Điểm của buổi này sẽ không được lưu.')) { if (document.fullscreenElement) void document.exitFullscreen(); onClose(); } };

  const award = async () => {
    const list = ranking.filter((t) => t.rank <= TEAM_AWARD.length && t.pts > 0);
    if (!list.length) return setErr('Chưa tổ nào có điểm để cộng.');
    if (!window.confirm(`Cộng điểm Thi đua tổ: ${list.map((t) => `${t.name} +${TEAM_AWARD[t.rank - 1]}`).join(', ')}?`)) return;
    setBusy(true); setErr('');
    const day = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const sb = createClient();
    for (const t of list) {
      const { error } = await sb.rpc('teacher_team_point', { p_class: classId, p_team: t.no, p_delta: TEAM_AWARD[t.rank - 1], p_reason: liveAwardReason(day, t.rank) });
      if (error) { setErr('Chưa cộng được điểm thi đua (kiểm tra kết nối), thử lại sau.'); setBusy(false); return; }
    }
    setBusy(false); setAwarded(true);
  };

  const opts = q ? (q.q.type === 'single_choice' || q.q.type === 'multiple_choice' ? q.q.options.map((o, k) => `${L[k]}. ${o}`) : q.q.options) : [];
  const asked = hist.filter(Boolean).length;

  return (
    <div className="dto" ref={root} role="dialog" aria-modal="true" aria-label="Đấu tổ trên lớp">
      <header className="dto-top">
        <b className="dto-title">🏆 {title}</b>
        {!done && <span className="dto-count">Câu {qi + 1}/{questions.length}</span>}
        <span className="dto-top-act">
          {!done && stage === 'ask' && (
            <select className="dto-secs" value={secs} onChange={(e) => { const v = Number(e.target.value); setSecs(v); setLeft(v); }} aria-label="Thời gian mỗi câu">
              {TIMES.map((s) => <option key={s} value={s}>{s} giây / câu</option>)}
            </select>
          )}
          <button type="button" className="dto-ico" onClick={toggleFull} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>{full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
          {!done && asked > 0 && <button type="button" className="dto-ico is-text" onClick={() => { if (window.confirm('Kết thúc sớm và xem kết quả?')) setDone(true); }}>Kết thúc</button>}
          <button type="button" className="dto-ico" onClick={close} aria-label="Thoát"><X aria-hidden="true" /></button>
        </span>
      </header>

      <div className="dto-main">
        <section className="dto-stage" aria-live="polite">
          {done ? (
            <div className="dto-end">
              <h2>Kết quả Đấu tổ</h2>
              <ol className="dto-podium">
                {ranking.map((t) => (
                  <li key={t.no} className={`r${Math.min(t.rank, 4)}`}>
                    <span className="dto-medal">{t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : t.rank}</span>
                    <TeamPic emoji={t.emoji} size={56} />
                    <b>{t.name}</b>
                    <strong>{t.pts} điểm</strong>
                    <small>đúng {t.pts}/{asked} câu</small>
                  </li>
                ))}
              </ol>
              {awarded ? <p className="dto-ok"><Check aria-hidden="true" /> Đã cộng điểm Thi đua tổ.</p> : (
                <button type="button" className="btn btn-yellow" disabled={busy} onClick={() => void award()}>
                  <Crown aria-hidden="true" /> {busy ? 'Đang cộng…' : `Cộng điểm Thi đua tổ (hạng 1 +${TEAM_AWARD[0]}, 2 +${TEAM_AWARD[1]}, 3 +${TEAM_AWARD[2]})`}
                </button>
              )}
              {err && <p className="dto-err" role="alert">{err}</p>}
              <button type="button" className="btn btn-outline" onClick={close}>Đóng</button>
            </div>
          ) : q ? (
            <div className="dto-q">
              <p className="dto-who">✍️ Các tổ viết câu trả lời vào <b>bảng con</b> <em className={`dto-muc m${q.muc}`}>Mức {q.muc}</em></p>
              <div className="dto-card">
                <p className="dto-prompt"><EmojiText text={q.q.prompt} /></p>
                {q.q.left && q.q.left.length > 0 && q.q.type !== 'grouping' && <p className="dto-opts">{q.q.left.join('   ·   ')}</p>}
                {opts.length > 0 && <ul className="dto-optlist">{opts.map((o, k) => <li key={k}><EmojiText text={o} /></li>)}</ul>}
                {(q.q.blanks ?? q.q.statements)?.map((l, k) => <p key={k} className="dto-opts">{l.replace(/\{\}/g, '……')}</p>)}
                {stage !== 'ask' && <p className="dto-ans">Đáp án: <b>{answerText(q.q)}</b></p>}
              </div>

              {stage === 'ask' ? (
                <div className="dto-actions">
                  <span className={`dto-timer${left <= 5 ? ' is-low' : ''}${left <= 0 ? ' is-up' : ''}`}><Timer aria-hidden="true" /> {left > 0 ? `${left} giây` : 'Hết giờ — giơ bảng!'}</span>
                  {left > 0 && <button type="button" className="dto-ico is-text" onClick={() => setPaused((p) => !p)}>{paused ? <><Play aria-hidden="true" /> Tiếp</> : <><Pause aria-hidden="true" /> Dừng</>}</button>}
                  <button type="button" className="btn btn-yellow" onClick={reveal}><Eye aria-hidden="true" /> Hiện đáp án & chấm</button>
                </div>
              ) : (
                <div className="dto-check">
                  <p className="dto-check-h">{stage === 'check' ? 'Bấm chọn các tổ trả lời ĐÚNG (mỗi tổ đúng +1):' : 'Kết quả câu này'}</p>
                  <ul className="dto-teams is-check">
                    {teams.map((t) => {
                      const on = (stage === 'check' ? ok : hist[qi] ?? []).includes(t.no);
                      return (
                        <li key={t.no}>
                          <button type="button" className={`dto-team-btn${on ? ' is-ok' : stage === 'scored' ? ' is-no' : ''}`} aria-pressed={on} disabled={stage !== 'check'} onClick={() => toggle(t.no)}>
                            <TeamPic emoji={t.emoji} size={44} /><b>{t.name}</b>
                            <span className="dto-team-mark">{on ? <><Check aria-hidden="true" /> {stage === 'scored' ? '+1' : 'Đúng'}</> : stage === 'scored' ? 'Chưa đúng' : 'Chạm nếu đúng'}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="dto-actions">
                    {stage === 'check' ? (
                      <button type="button" className="btn btn-yellow" onClick={score}><Check aria-hidden="true" /> Chấm xong{ok.length ? ` · ${ok.length} tổ +1` : ' · không tổ nào đúng'}</button>
                    ) : (
                      <>
                        <button type="button" className="dto-ico is-text" onClick={() => setStage('check')}>Sửa chấm</button>
                        <button type="button" className="btn btn-yellow" onClick={next}><SkipForward aria-hidden="true" /> {qi + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        <aside className="dto-board" aria-label="Bảng điểm các tổ">
          <h3>Bảng điểm</h3>
          <ol>
            {ranking.map((t) => (
              <li key={t.no} className={stage === 'scored' && !done && (hist[qi] ?? []).includes(t.no) ? 'is-cur' : undefined}>
                <span className="dto-rank">{t.pts > 0 && t.rank === 1 ? <Crown aria-label="Dẫn đầu" /> : t.rank}</span>
                <TeamPic emoji={t.emoji} size={34} />
                <b>{t.name}</b>
                <strong>{t.pts}</strong>
              </li>
            ))}
          </ol>
          <p className="dto-rule">Trả lời bằng bảng con · tổ đúng +1 · sai không cộng</p>
        </aside>
      </div>
    </div>
  );
}
