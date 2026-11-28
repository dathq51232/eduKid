'use client';

// ĐẤU TỔ TRÊN LỚP — cô chiếu lên bảng, chơi trực tiếp (không cần máy cho từng em):
//   mỗi lượt: Quay tổ (ngẫu nhiên, đủ một vòng các tổ mới lặp) → Quay bạn trong tổ (không gọi lại bạn đã lên)
//   → hiện câu hỏi, đếm ngược → cô hiện đáp án, chấm Đúng / Sai → đúng cộng điểm theo mức (M1 +1, M2 +2, M3 +3).
//   Hết câu (hoặc cô bấm Kết thúc): bảng xếp hạng tổ, cô cộng điểm Thi đua tổ hạng 1–3 (+3 / +2 / +1).
// Câu hỏi sinh trên máy cô từ chủ đề + quy tắc của form Tạo phòng (đề chung). Trạng thái chỉ ở trên máy đang chiếu.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crown, Eye, Maximize2, Minimize2, Shuffle, SkipForward, Timer, UserX, X } from 'lucide-react';
import EmojiText from '@/components/EmojiText';
import { createClient } from '@/lib/supabase/client';
import { teamIconSrc } from '@/lib/classroom/class-tools';
import { shortName } from '@/lib/classroom/callon';
import { answerText } from '@/lib/exams/word';
import type { PaperSlot } from '@/lib/exams/matrix';
import { TEAM_AWARD, liveAwardReason, pickFair, pointsForMuc, type TeamSnap } from '@/lib/classroom/team-battle';
import '@/styles/btn.css';
import '@/styles/dto.css';

type Stage = 'team' | 'student' | 'question' | 'marked';
type Log = { q: number; team: number; student: string; ok: boolean; pts: number };
const L = 'ABCDEFGH';
const SECS = 30;

function TeamPic({ emoji, size }: { emoji: string; size: number }) {
  const src = teamIconSrc(emoji);
  // eslint-disable-next-line @next/next/no-img-element -- hình 3D nhỏ đã tối ưu sẵn (webp)
  return src ? <img src={src} width={size} height={size} style={{ width: size, height: size }} alt="" aria-hidden="true" className="ic3d" decoding="async" />
    : <span style={{ fontSize: size * 0.8, lineHeight: 1 }} aria-hidden="true">{emoji}</span>;
}

export default function TeamQuiz({ classId, title, teams, students, questions, onClose }: {
  classId: string; title: string; teams: TeamSnap[]; students: { id: string; name: string }[]; questions: PaperSlot[]; onClose: () => void;
}) {
  const nameOf = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const [scores, setScores] = useState<Record<number, number>>(() => Object.fromEntries(teams.map((t) => [t.no, 0])));
  const [qi, setQi] = useState(0);
  const [stage, setStage] = useState<Stage>('team');
  const [team, setTeam] = useState<number | null>(null);
  const [student, setStudent] = useState<string | null>(null);
  const [usedTeams, setUsedTeams] = useState<number[]>([]);
  const [usedKids, setUsedKids] = useState<Record<number, string[]>>({});
  const [hi, setHi] = useState<number | string | null>(null); // ô đang sáng khi quay
  const [spinning, setSpinning] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [left, setLeft] = useState(SECS);
  const [log, setLog] = useState<Log[]>([]);
  const [done, setDone] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [full, setFull] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const q = questions[qi];
  const cur = teams.find((t) => t.no === team) ?? null;
  // hạng = 1 + số tổ nhiều điểm hơn (bằng điểm thì cùng hạng)
  const ranking = useMemo(() => {
    const list = teams.map((t) => ({ ...t, pts: scores[t.no] ?? 0 }));
    return list.map((t) => ({ ...t, rank: 1 + list.filter((x) => x.pts > t.pts).length })).sort((a, b) => a.rank - b.rank);
  }, [teams, scores]);

  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); }, []);
  // đếm ngược câu hỏi: một lần mỗi giây, chỉ khi đang hỏi và chưa hiện đáp án
  useEffect(() => {
    if (stage !== 'question' || reveal || left <= 0) return;
    const t = window.setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, reveal, left]);
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggleFull = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void root.current?.requestFullscreen?.().catch(() => undefined); };

  /** Hiệu ứng quay: sáng lần lượt các ô, chậm dần (~2 giây), dừng đúng ô đã bốc, giữ 0,8 giây cho cả lớp thấy rồi mới chuyển */
  const spin = useCallback(<T extends number | string>(list: T[], pick: T, end: () => void) => {
    setSpinning(true);
    let at = 0, k = 0;
    const hops = 16 + Math.floor(Math.random() * 4);
    const step = () => {
      k++;
      if (k >= hops) { setHi(pick); timers.current.push(window.setTimeout(() => { setSpinning(false); end(); }, 800)); return; }
      at = (at + 1 + Math.floor(Math.random() * Math.max(1, list.length - 1))) % list.length;
      setHi(list[at]);
      timers.current.push(window.setTimeout(step, 50 + (k / hops) ** 2 * 200));
    };
    step();
  }, []);

  const spinTeam = () => {
    const withKids = teams.filter((t) => t.members.length).map((t) => t.no);
    const r = pickFair(withKids, usedTeams, team);
    if (!r) return;
    spin(withKids, r.pick, () => { setUsedTeams(r.used); setTeam(r.pick); setStudent(null); setStage('student'); });
  };
  const spinKid = (skip?: string) => {
    if (!cur) return;
    const used = usedKids[cur.no] ?? [];
    const pool = skip && cur.members.length > 1 ? cur.members.filter((m) => m !== skip) : cur.members;
    const r = pickFair(pool, used.filter((m) => pool.includes(m)), student);
    if (!r) return;
    setReveal(false);
    spin(pool, r.pick, () => {
      setUsedKids((u) => ({ ...u, [cur.no]: [...new Set([...(u[cur.no] ?? []).filter((m) => m !== skip), ...r.used])] }));
      setStudent(r.pick); setLeft(SECS); setStage('question');
    });
  };
  const mark = (ok: boolean) => {
    if (!cur || !student || !q) return;
    const pts = ok ? pointsForMuc(q.muc) : 0;
    if (pts) setScores((s) => ({ ...s, [cur.no]: (s[cur.no] ?? 0) + pts }));
    setLog((l) => [...l, { q: qi, team: cur.no, student, ok, pts }]);
    setReveal(true); setStage('marked');
  };
  const next = () => {
    if (qi + 1 >= questions.length) { setDone(true); return; }
    setQi((i) => i + 1); setStage('team'); setTeam(null); setStudent(null); setHi(null); setReveal(false);
  };
  const close = () => { if (done || !log.length || window.confirm('Thoát Đấu tổ? Điểm của buổi này sẽ không được lưu.')) { if (document.fullscreenElement) void document.exitFullscreen(); onClose(); } };

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

  return (
    <div className="dto" ref={root} role="dialog" aria-modal="true" aria-label="Đấu tổ trên lớp">
      <header className="dto-top">
        <b className="dto-title">🏆 {title}</b>
        {!done && <span className="dto-count">Câu {qi + 1}/{questions.length}</span>}
        <span className="dto-top-act">
          <button type="button" className="dto-ico" onClick={toggleFull} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>{full ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
          {!done && log.length > 0 && <button type="button" className="dto-ico is-text" onClick={() => { if (window.confirm('Kết thúc sớm và xem kết quả?')) setDone(true); }}>Kết thúc</button>}
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
                    <small>{log.filter((x) => x.team === t.no && x.ok).length}/{log.filter((x) => x.team === t.no).length} câu đúng</small>
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
          ) : stage === 'team' ? (
            <div className="dto-pick">
              <h2>Câu {qi + 1}: tổ nào sẽ trả lời?</h2>
              <ul className="dto-teams">
                {teams.map((t) => (
                  <li key={t.no} className={`${hi === t.no ? 'is-hi' : ''}${!t.members.length ? ' is-off' : ''}`}>
                    <TeamPic emoji={t.emoji} size={72} /><b>{t.name}</b><small>{t.members.length} bạn</small>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-yellow dto-go" onClick={spinTeam} disabled={spinning}><Shuffle aria-hidden="true" /> {spinning ? 'Đang quay…' : 'Quay tổ'}</button>
            </div>
          ) : stage === 'student' && cur ? (
            <div className="dto-pick">
              <h2><TeamPic emoji={cur.emoji} size={48} /> {cur.name} — bạn nào sẽ trả lời?</h2>
              <ul className="dto-kids">
                {cur.members.map((m) => (
                  <li key={m} className={`${hi === m ? 'is-hi' : ''}${(usedKids[cur.no] ?? []).includes(m) ? ' is-used' : ''}`}>{shortName(nameOf.get(m) ?? '…')}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-yellow dto-go" onClick={() => spinKid()} disabled={spinning}><Shuffle aria-hidden="true" /> {spinning ? 'Đang quay…' : 'Quay bạn trong tổ'}</button>
            </div>
          ) : cur && student && q ? (
            <div className="dto-q">
              <p className="dto-who">
                <TeamPic emoji={cur.emoji} size={40} /> Mời <b>{nameOf.get(student)}</b> <span>· {cur.name}</span>
                <em className={`dto-muc m${q.muc}`}>Mức {q.muc} · +{pointsForMuc(q.muc)} điểm</em>
              </p>
              <div className="dto-card">
                <p className="dto-prompt"><EmojiText text={q.q.prompt} /></p>
                {q.q.left && q.q.left.length > 0 && q.q.type !== 'grouping' && <p className="dto-opts">{q.q.left.join('   ·   ')}</p>}
                {opts.length > 0 && <ul className="dto-optlist">{opts.map((o, k) => <li key={k}><EmojiText text={o} /></li>)}</ul>}
                {(q.q.blanks ?? q.q.statements)?.map((l, k) => <p key={k} className="dto-opts">{l.replace(/\{\}/g, '……')}</p>)}
                {reveal && <p className="dto-ans">Đáp án: <b>{answerText(q.q)}</b></p>}
              </div>
              <div className="dto-actions">
                {stage === 'question' ? (
                  <>
                    <span className={`dto-timer${left <= 5 ? ' is-low' : ''}`}><Timer aria-hidden="true" /> {left > 0 ? `${left} giây` : 'Hết giờ!'}</span>
                    {!reveal && <button type="button" className="btn btn-outline" onClick={() => setReveal(true)}><Eye aria-hidden="true" /> Hiện đáp án</button>}
                    <button type="button" className="btn dto-yes" onClick={() => mark(true)}><Check aria-hidden="true" /> Đúng +{pointsForMuc(q.muc)}</button>
                    <button type="button" className="btn dto-no" onClick={() => mark(false)}><X aria-hidden="true" /> Chưa đúng</button>
                    {!reveal && <button type="button" className="dto-link" onClick={() => spinKid(student)} disabled={spinning}><UserX aria-hidden="true" /> Bạn vắng – quay bạn khác</button>}
                  </>
                ) : (
                  <>
                    <span className={`dto-result${log[log.length - 1]?.ok ? ' is-ok' : ''}`}>{log[log.length - 1]?.ok ? `🎉 Chính xác! ${cur.name} +${log[log.length - 1].pts}` : '💪 Chưa đúng — cố lên lần sau nhé!'}</span>
                    <button type="button" className="btn btn-yellow" onClick={next}><SkipForward aria-hidden="true" /> {qi + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="dto-board" aria-label="Bảng điểm các tổ">
          <h3>Bảng điểm</h3>
          <ol>
            {ranking.map((t) => (
              <li key={t.no} className={t.no === team && !done ? 'is-cur' : undefined}>
                <span className="dto-rank">{t.pts > 0 && t.rank === 1 ? <Crown aria-label="Dẫn đầu" /> : t.rank}</span>
                <TeamPic emoji={t.emoji} size={34} />
                <b>{t.name}</b>
                <strong>{t.pts}</strong>
              </li>
            ))}
          </ol>
          <p className="dto-rule">Đúng: mức 1 +1 · mức 2 +2 · mức 3 +3</p>
        </aside>
      </div>
    </div>
  );
}
