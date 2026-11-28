'use client';

// ĐẤU TỔ TRÊN LỚP — cô chiếu câu hỏi lên bảng, các tổ hội ý và trả lời bằng BẢNG CON (không cần máy cho từng em):
//   màn Sẵn sàng → mỗi câu: đếm ngược (số giây cô đặt) → hết giờ đồng hồ đứng “Giơ bảng!” → cô Lật đáp án,
//   chạm chọn các tổ đúng → mỗi tổ đúng +1, sai không cộng → Câu tiếp theo (đếm lại từ đầu).
//   Hết câu (hoặc Kết thúc): bảng xếp hạng, cô cộng điểm Thi đua tổ hạng 1–3 (+3 / +2 / +1).
// Giao diện theo mẫu “Đấu tổ Toán” (khung chung ShowFrame). Trạng thái chỉ ở trên máy đang chiếu.
import { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Eye, Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
import EmojiText from '@/components/EmojiText';
import { createClient } from '@/lib/supabase/client';
import { playSound } from '@/lib/sound';
import { speakSegments, speakableQuestion, stopSpeaking } from '@/lib/speech';
import { duckMusic, startMusic, stopMusic } from '@/lib/show-music';
import type { SubjectCode } from '@/lib/types';
import { answerText } from '@/lib/exams/word';
import type { PaperSlot } from '@/lib/exams/matrix';
import { QUIZ_SECS, TEAM_AWARD, liveAwardReason, type TeamSnap } from '@/lib/classroom/team-battle';
import ShowFrame, { Pic, ShowBoard, ShowHero, ShowTimer, TeamPic } from './ShowFrame';

type Stage = 'ready' | 'ask' | 'check' | 'scored';
const L = 'ABCDEFGH';
const clampSecs = (v: number) => Math.max(QUIZ_SECS.min, Math.min(QUIZ_SECS.max, Math.round(v) || QUIZ_SECS.def));
/** màu dải tên tổ (theo thứ tự tổ) */
const RIBBON = ['is-c0', 'is-c1', 'is-c2', 'is-c3', 'is-c4', 'is-c5', 'is-c6', 'is-c7'];

export default function TeamQuiz({ classId, title, subject, subjectCode, teams, questions, seconds = QUIZ_SECS.def, onClose }: {
  classId: string; title: string; /** tên môn, vd “Toán” */ subject: string; /** mã môn — để đọc đề đúng giọng */ subjectCode: SubjectCode;
  teams: TeamSnap[]; questions: PaperSlot[];
  /** giây mỗi câu */ seconds?: number; onClose: () => void;
}) {
  const [qi, setQi] = useState(0);
  // 'ready': màn chờ trước câu 1 — đồng hồ chỉ chạy khi cô bấm Bắt đầu
  const [stage, setStage] = useState<Stage>('ready');
  const [secs, setSecs] = useState(() => clampSecs(seconds));
  const [left, setLeft] = useState(() => clampSecs(seconds));
  const [paused, setPaused] = useState(false);
  const [ok, setOk] = useState<number[]>([]); // các tổ cô chọn là trả lời đúng ở câu hiện tại
  const [hist, setHist] = useState<number[][]>([]); // hist[i] = các tổ đúng ở câu i
  const [done, setDone] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Âm thanh: nhạc nền + tiếng đồng hồ khi đang đếm (bật / tắt, nhớ trên máy); loa đọc đề; tự đọc đề khi sang câu mới
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('dto-sound') !== '0'; } catch { return true; } });
  const [autoRead, setAutoRead] = useState(() => { try { return localStorage.getItem('dto-autoread') !== '0'; } catch { return true; } });
  const [speaking, setSpeaking] = useState(false);
  const [voiceErr, setVoiceErr] = useState('');

  const q = questions[qi];
  const color = useMemo(() => new Map(teams.map((t, i) => [t.no, RIBBON[i % RIBBON.length]])), [teams]);
  const scores = useMemo(() => {
    const s: Record<number, number> = Object.fromEntries(teams.map((t) => [t.no, 0]));
    for (const row of hist) for (const no of row ?? []) s[no] = (s[no] ?? 0) + 1;
    return s;
  }, [teams, hist]);
  // hạng = 1 + số tổ nhiều điểm hơn (bằng điểm thì cùng hạng)
  const ranking = useMemo(() => {
    const list = teams.map((t) => ({ ...t, pts: scores[t.no] ?? 0 }));
    return list.map((t) => ({ ...t, rank: 1 + list.filter((x) => x.pts > t.pts).length })).sort((a, b) => a.rank - b.rank);
  }, [teams, scores]);
  const asked = hist.filter(Boolean).length;

  // đếm ngược: một lần mỗi giây, chỉ khi đang hỏi; hết giờ thì đứng ở 0
  useEffect(() => {
    if (stage !== 'ask' || paused || left <= 0) return;
    const t = window.setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, paused, left]);

  // nhạc nền chỉ chạy khi đồng hồ đang đếm; dừng / hết giờ / chấm thì tắt
  const running = !done && stage === 'ask' && !paused && left > 0;
  useEffect(() => { if (sound && running) startMusic(); else stopMusic(); }, [sound, running]);
  useEffect(() => () => { stopMusic(); stopSpeaking(); }, []);
  // tiếng đồng hồ mỗi giây: nhẹ, 10 giây cuối rõ hơn, 3 giây cuối gấp; hết giờ có chuông
  useEffect(() => {
    if (!sound || done || stage !== 'ask' || paused) return;
    if (left <= 0) playSound('timeout');
    else if (left < secs) playSound(left <= 3 ? 'tickUrgent' : left <= 10 ? 'tick' : 'tickSoft');
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ kêu khi số giây đổi
  const toggleSound = () => setSound((v) => { try { localStorage.setItem('dto-sound', v ? '0' : '1'); } catch { /* chế độ riêng tư */ } return !v; });
  const toggleAuto = () => setAutoRead((v) => { try { localStorage.setItem('dto-autoread', v ? '0' : '1'); } catch { /* chế độ riêng tư */ } return !v; });

  /** Loa: đọc đề + các phương án (giọng Việt / Anh tự chọn); nhạc hạ nhỏ trong lúc đọc */
  const read = async (slot: PaperSlot | undefined = q) => {
    if (!slot) return;
    if (speaking) { stopSpeaking(); setSpeaking(false); duckMusic(false); return; }
    setVoiceErr('');
    const r = await speakSegments(speakableQuestion(slot.q, subjectCode), {
      rate: 0.95,
      onStart: () => { setSpeaking(true); duckMusic(true); },
      onEnd: () => { setSpeaking(false); duckMusic(false); },
    });
    if (!r.ok) { setSpeaking(false); duckMusic(false); setVoiceErr(r.reason === 'no_vi_voice' ? 'Máy này chưa có giọng đọc tiếng Việt.' : 'Trình duyệt này không đọc được đề.'); }
  };
  // sang câu mới (hoặc bắt đầu câu 1): tự đọc đề nếu cô bật
  useEffect(() => {
    if (stage === 'ask' && autoRead && !done) void read(questions[qi]);
    return () => { stopSpeaking(); };
  }, [qi, stage === 'ask']); // eslint-disable-line react-hooks/exhaustive-deps -- chỉ đọc khi vào câu mới

  /** Đổi giây mỗi câu: áp dụng ngay cho câu đang đếm (đếm lại từ đầu) và các câu sau */
  const setTime = (v: number) => { const n = clampSecs(v); setSecs(n); if (stage === 'ready' || stage === 'ask') setLeft(n); };
  const start = () => { setLeft(secs); setPaused(false); setStage('ask'); if (sound) playSound('complete'); };
  const reveal = () => { setStage('check'); setOk([]); };
  const toggle = (no: number) => setOk((s) => (s.includes(no) ? s.filter((x) => x !== no) : [...s, no]));
  const score = () => { setHist((h) => { const n = [...h]; n[qi] = ok; return n; }); setStage('scored'); };
  const next = () => {
    if (qi + 1 >= questions.length) { setDone(true); return; }
    setQi((i) => i + 1); setStage('ask'); setOk([]); setLeft(secs); setPaused(false);
  };
  const close = () => { if (done || !asked || window.confirm('Thoát Đấu tổ? Điểm của buổi này sẽ không được lưu.')) { if (document.fullscreenElement) void document.exitFullscreen(); onClose(); } };

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

  const choice = !!q && (q.q.type === 'single_choice' || q.q.type === 'multiple_choice');
  const opts = q ? (choice ? q.q.options.map((o, k) => `${L[k]}. ${o}`) : q.q.options) : [];
  // phương án đúng được tô sáng khi cô lật đáp án
  const correct = q && 'correct' in q.q.answer ? ([] as string[]).concat(q.q.answer.correct) : [];
  const isAns = (k: number) => choice && (stage === 'check' || stage === 'scored') && correct.includes(q!.q.options[k]);

  const chips = (
    <>
      {!done && (
        <span className="dto-chip dto-secs" role="group" aria-label="Thời gian mỗi câu">
          <button type="button" onClick={() => setTime(secs - 5)} disabled={secs <= QUIZ_SECS.min} aria-label="Bớt 5 giây">−</button>
          <Pic src="/emoji/f3d/alarm-clock.webp" size={22} /> {secs} giây / câu
          <button type="button" onClick={() => setTime(secs + 5)} disabled={secs >= QUIZ_SECS.max} aria-label="Thêm 5 giây">+</button>
        </span>
      )}
      <span className="dto-chip"><Pic src="/brand/ph/star.webp" size={22} /> Đấu tổ ({teams.length} tổ)</span>
      {!done && <button type="button" className={`dto-chip dto-chip-btn${autoRead ? ' is-on' : ''}`} onClick={toggleAuto} aria-pressed={autoRead} title="Tự đọc đề khi sang câu mới">🔊 Tự đọc đề</button>}
    </>
  );
  const tools = (
    <button type="button" className={`dto-sq${sound ? '' : ' is-off'}`} onClick={toggleSound} aria-pressed={sound}
      aria-label={sound ? 'Tắt nhạc nền và tiếng đồng hồ' : 'Bật nhạc nền và tiếng đồng hồ'} title={sound ? 'Tắt nhạc & tiếng đồng hồ' : 'Bật nhạc & tiếng đồng hồ'}>
      {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </button>
  );

  const board = (
    <ShowBoard title="Bảng điểm" note="Trả lời bằng bảng con — đúng +1, sai không cộng.">
      <ol className="dto-score">
        {ranking.map((t) => (
          <li key={t.no} className={`${color.get(t.no)}${t.pts > 0 && t.rank === 1 ? ' is-top' : ''}${stage === 'scored' && !done && (hist[qi] ?? []).includes(t.no) ? ' is-plus' : ''}`}>
            {t.pts > 0 && t.rank === 1 ? <Pic src="/emoji/hd/trophy.webp" size={30} /> : <TeamPic emoji={t.emoji} size={30} />}
            <b>{t.name}</b>
            <strong>{t.pts}</strong>
          </li>
        ))}
      </ol>
    </ShowBoard>
  );

  /** Hàng tổ dưới thẻ câu hỏi: lúc chấm là nút chọn tổ đúng */
  const teamRow = (
    <ul className="dto-tribes">
      {teams.map((t) => {
        const on = (stage === 'check' ? ok : stage === 'scored' ? hist[qi] ?? [] : []).includes(t.no);
        const can = stage === 'check';
        return (
          <li key={t.no}>
            <button type="button" className={`dto-tribe ${color.get(t.no)}${on ? ' is-ok' : stage === 'scored' ? ' is-no' : ''}${can ? ' can' : ''}`} disabled={!can} aria-pressed={can ? on : undefined} onClick={() => toggle(t.no)}>
              <TeamPic emoji={t.emoji} size={64} />
              <span className="dto-ribbon"><b>{t.name}</b></span>
              {(stage === 'check' || stage === 'scored') && (
                <em className="dto-tribe-mark">{on ? <><Check aria-hidden="true" /> {stage === 'scored' ? '+1' : 'Đúng'}</> : stage === 'scored' ? 'Chưa đúng' : 'Chạm nếu đúng'}</em>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <ShowFrame kind="Đấu tổ" subject={subject} tag="Phòng thi tổ" title={title} counter={done ? 'Kết quả' : `Câu ${qi + 1}/${questions.length}`}
      chips={chips} tools={tools} onEnd={!done && asked > 0 ? () => { if (window.confirm('Kết thúc sớm và xem kết quả?')) setDone(true); } : undefined}
      onClose={close} board={board}>
      {done ? (
        <div className="dto-q">
          <ShowHero />
          <div className="dto-card dto-end-card">
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
          </div>
          <div className="dto-btns">
            {awarded ? <p className="dto-ok"><Check aria-hidden="true" /> Đã cộng điểm Thi đua tổ.</p> : (
              <button type="button" className="dto-big is-yellow" disabled={busy} onClick={() => void award()}>
                <Crown aria-hidden="true" /> {busy ? 'Đang cộng…' : `Cộng điểm Thi đua tổ (hạng 1 +${TEAM_AWARD[0]}, 2 +${TEAM_AWARD[1]}, 3 +${TEAM_AWARD[2]})`}
              </button>
            )}
            <button type="button" className="dto-big is-light" onClick={close}>Đóng</button>
          </div>
          {err && <p className="dto-err" role="alert">{err}</p>}
        </div>
      ) : stage === 'ready' ? (
        <div className="dto-q">
          <ShowHero><ShowTimer left={secs} total={secs} /></ShowHero>
          <div className="dto-card">
            <span className="dto-qtag">Sẵn sàng! <Pic src="/brand/ph/star.webp" size={30} /></span>
            <p className="dto-prompt">Mỗi câu có <b>{secs} giây</b>: các tổ hội ý, ghi đáp án vào <b>bảng con</b>.</p>
            <p className="dto-sub">Hết giờ cả lớp giơ bảng, cô lật đáp án — tổ đúng +1, sai không được cộng. Tổng {questions.length} câu.</p>
          </div>
          {teamRow}
          <div className="dto-btns"><button type="button" className="dto-big is-yellow" onClick={start}><Play aria-hidden="true" /> Bắt đầu câu 1</button></div>
        </div>
      ) : q ? (
        <div className="dto-q">
          <ShowHero><ShowTimer left={left} total={secs} label={left <= 0 ? 'Hết giờ!' : undefined} /></ShowHero>
          <div className="dto-card">
            <span className="dto-qtag">Câu {qi + 1} <Pic src="/brand/ph/star.webp" size={30} /></span>
            <em className={`dto-muc m${q.muc}`}>Mức {q.muc}</em>
            <p className="dto-prompt">
              <button type="button" className={`dto-speak${speaking ? ' is-on' : ''}`} onClick={() => void read()} aria-label={speaking ? 'Dừng đọc' : 'Đọc đề'} title={speaking ? 'Dừng đọc' : 'Đọc đề cho các em'}>
                {speaking ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
              </button>
              <EmojiText text={q.q.prompt} />
            </p>
            {voiceErr && <p className="dto-voice-err">{voiceErr}</p>}
            {q.q.left && q.q.left.length > 0 && q.q.type !== 'grouping' && <p className="dto-sub">{q.q.left.join('   ·   ')}</p>}
            {opts.length > 0 && <ul className="dto-optlist">{opts.map((o, k) => <li key={k} className={isAns(k) ? 'is-ans' : undefined}><EmojiText text={o} /></li>)}</ul>}
            {(q.q.blanks ?? q.q.statements)?.map((l, k) => <p key={k} className="dto-sub">{l.replace(/\{\}/g, '……')}</p>)}
            {stage !== 'ask' && <p className="dto-ans">Đáp án: <b>{answerText(q.q)}</b></p>}
          </div>
          {teamRow}
          <div className="dto-btns">
            {stage === 'ask' ? (left > 0 ? (
              <>
                <button type="button" className="dto-big is-yellow" onClick={() => { if (window.confirm('Hết giờ ngay để các tổ giơ bảng?')) setLeft(0); }}><Play aria-hidden="true" /> Hết giờ – giơ bảng!</button>
                <button type="button" className="dto-big is-light" onClick={() => setPaused((p) => !p)}>{paused ? <><Play aria-hidden="true" /> Chạy tiếp</> : <><Pause aria-hidden="true" /> Tạm dừng</>}</button>
              </>
            ) : (
              <>
                <span className="dto-hint">⏰ Hết giờ — các tổ giơ bảng!</span>
                <button type="button" className="dto-big is-yellow" onClick={reveal}><Eye aria-hidden="true" /> Lật đáp án</button>
              </>
            )) : stage === 'check' ? (
              <>
                <span className="dto-hint">Chạm vào các tổ trả lời đúng</span>
                <button type="button" className="dto-big is-yellow" onClick={score}><Check aria-hidden="true" /> Chấm xong{ok.length ? ` · ${ok.length} tổ +1` : ''}</button>
              </>
            ) : (
              <>
                <button type="button" className="dto-big is-light" onClick={() => setStage('check')}>Sửa chấm</button>
                <button type="button" className="dto-big is-yellow" onClick={next}><SkipForward aria-hidden="true" /> {qi + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}</button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </ShowFrame>
  );
}
