'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { MUC } from '@/lib/sets';
import { useSearchParams } from 'next/navigation';
import { Check, Clock, Home, ListChecks, MinusCircle, RotateCcw, Star, Volume2, X, Dices } from 'lucide-react';
import LearnHeader from '@/components/LearnHeader';
import VoiceHelp from '@/components/VoiceHelp';
import { isSubjectCode, parseGrade } from '@/lib/data';
import { LEVELS, formatDuration, rankFor } from '@/lib/levels';
import { readLastAttempt, starsFor } from '@/lib/progress';
import { SYNC_EVENT, readSyncStatus, type SyncStatus } from '@/lib/progress-sync';
import { buildComment, levelStats } from '@/lib/scoring';
import { segmentsFor, speakSegments, stopSpeaking } from '@/lib/speech';
import type { AnswerRecord, AttemptSummary } from '@/lib/types';

function formatAnswer(value: AnswerRecord['userAnswer']) {
  if (value === null) return 'chưa trả lời';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return Object.entries(value).map(([l, r]) => `${l} → ${r}`).join('; ');
  return value;
}

const STATUS_TEXT: Record<AnswerRecord['status'], string> = {
  correct: 'Đúng',
  wrong: 'Chưa đúng',
  timeout: 'Hết giờ',
  unanswered: 'Chưa làm',
};

function StatusIcon({ status }: { status: AnswerRecord['status'] }) {
  if (status === 'correct') return <Check size={18} strokeWidth={3} aria-hidden="true" />;
  if (status === 'wrong') return <X size={18} strokeWidth={3} aria-hidden="true" />;
  if (status === 'timeout') return <Clock size={17} aria-hidden="true" />;
  return <MinusCircle size={17} aria-hidden="true" />;
}

function syncMessage(s: SyncStatus): string {
  if (s.pending) return 'Đang lưu bài cho thầy cô…';
  if (s.saved) return 'Đã lưu bài làm để thầy cô xem.';
  if (s.reason === 'guest') return 'Em chưa đăng nhập bằng mã lớp và PIN nên bài này chưa được lưu cho thầy cô.';
  if (s.reason === 'not_student') return 'Đang dùng tài khoản người lớn nên bài làm không được lưu vào lớp.';
  if (s.reason === 'too_many') return 'Em làm nhanh quá, máy chủ tạm chưa lưu bài này. Lát nữa làm tiếp nhé.';
  return `Chưa lưu được bài lên máy chủ (mã: ${s.reason ?? 'không rõ'}). Em báo thầy cô nhé.`;
}

function KetQuaContent() {
  const searchParams = useSearchParams();
  const subjectParam = searchParams.get('subject');
  const subjectCode = isSubjectCode(subjectParam) ? subjectParam : 'toan';
  const grade = parseGrade(searchParams.get('grade'));

  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [voiceProblem, setVoiceProblem] = useState<'unsupported' | 'no_vi_voice' | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  useEffect(() => {
    setAttempt(readLastAttempt());
    setLoaded(true);
    const onSync = () => setSync(readSyncStatus());
    onSync();
    window.addEventListener(SYNC_EVENT, onSync);
    return () => { stopSpeaking(); window.removeEventListener(SYNC_EVENT, onSync); };
  }, []);

  if (!loaded) return <LearnHeader />;

  const listHref = `/chon-bai?subject=${attempt?.subject ?? subjectCode}&grade=${attempt?.grade ?? grade}`;

  if (!attempt) {
    return (
      <>
        <LearnHeader />
        <main className="learn-main">
          <div className="empty-state">
            <h1>Chưa có bài làm nào</h1>
            <p>Em chọn một bài học để bắt đầu nhé.</p>
            <Link href={listHref} className="button button-yellow">Chọn bài học</Link>
          </div>
        </main>
      </>
    );
  }

  const stars = starsFor(attempt.score, attempt.total);
  const comment = buildComment(attempt);
  const stats = levelStats(attempt.answers);
  const rank = rankFor(attempt.totalPoints);
  const prevRank = rankFor(attempt.previousTotal);
  const rankUp = rank.index > prevRank.index;
  const speedTotal = attempt.answers.reduce((s, a) => s + a.speedBonus, 0);
  const baseHref = `/lam-bai?lessonId=${attempt.lessonId}&subject=${attempt.subject}&grade=${attempt.grade}`;
  const muc = attempt.muc ?? 1;
  // Làm lại: đúng bộ câu vừa làm; Bộ câu khác: bộ mới cùng mức độ
  const retryHref = attempt.seed ? `${baseHref}&muc=${muc}&seed=${attempt.seed}` : baseHref;
  const newSetHref = `${baseHref}&muc=${muc}&doi=1`;
  const rankPercent = rank.next ? Math.round(((attempt.totalPoints - rank.min) / (rank.next.min - rank.min)) * 100) : 100;

  const speakComment = async () => {
    const r = await speakSegments(segmentsFor([comment.headline, ...comment.lines].join(' '), 'tieng-viet'));
    if (!r.ok) setVoiceProblem(r.reason);
  };

  return (
    <>
      <LearnHeader />
      <main className="learn-main">
        <section className="result-card" aria-live="polite">
          <p className="lesson-tag">{attempt.lessonTitle}</p>
          <h1>{comment.headline}</h1>
          <div className="result-stars" aria-label={`Em được ${stars} trên 3 ngôi sao`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`result-star${i < stars ? ' is-on' : ''}`} style={{ ['--i' as string]: i }}>
                <Star size={44} className={i < stars ? 'star-on' : 'star-off'} aria-hidden="true" />
              </span>
            ))}
          </div>
          <dl className="score-box score-box-3">
            <div>
              <dt>Câu đúng</dt>
              <dd>{attempt.score}/{attempt.total}</dd>
            </div>
            <div>
              <dt>Thời gian</dt>
              <dd className="is-time">{formatDuration(attempt.durationMs)}</dd>
            </div>
            <div>
              <dt>Điểm bài này</dt>
              <dd>{attempt.points}</dd>
            </div>
          </dl>
          {sync && sync.lessonId === attempt.lessonId && (
            <p className={`sync-note${sync.saved ? ' is-ok' : sync.pending ? '' : ' is-warn'}`} role="status">{syncMessage(sync)}</p>
          )}
        </section>

        <section className="points-card" aria-label="Điểm tích luỹ">
          <div className="points-rank">
            <span className="points-rank-icon" aria-hidden="true">{rank.icon}</span>
            <div>
              <p className="points-label">Điểm tích luỹ</p>
              <p className="points-total">
                {attempt.totalPoints} <span>điểm</span>
                {attempt.newPoints > 0 && <span className="points-plus">+{attempt.newPoints}</span>}
              </p>
              <p className="points-rank-name">
                Danh hiệu: <strong>{rank.name}</strong>
                {rankUp && <span className="rank-up"> — Lên hạng mới!</span>}
              </p>
            </div>
          </div>
          {rank.next && (
            <>
              <div className="progress-track" role="progressbar" aria-valuenow={rankPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến tới danh hiệu tiếp theo">
                <div className="progress-fill" style={{ width: `${rankPercent}%` }} />
              </div>
              <p className="points-note">Còn {rank.next.need} điểm nữa để đạt {rank.next.icon} {rank.next.name}.</p>
            </>
          )}
          <ul className="points-breakdown">
            <li><span>Điểm các câu đúng</span><strong>{attempt.questionPoints - speedTotal}</strong></li>
            <li><span>Thưởng làm nhanh</span><strong>{speedTotal}</strong></li>
            <li><span>Thưởng hoàn thành bài</span><strong>{attempt.lessonBonus}</strong></li>
          </ul>
          {attempt.newPoints < attempt.points && (
            <p className="points-note">
              Bài này em đã từng đạt điểm cao hơn hoặc bằng, nên chỉ cộng thêm {attempt.newPoints} điểm. Làm tốt hơn lần trước để được cộng thêm nhé!
            </p>
          )}
        </section>

        <section className="comment-card" aria-label="Nhận xét">
          <div className="comment-head">
            <h2>Nhận xét</h2>
            <button type="button" className="button button-white" style={{ minHeight: 44 }} onClick={speakComment}>
              <Volume2 size={18} aria-hidden="true" /> Nghe
            </button>
          </div>
          {voiceProblem && <VoiceHelp reason={voiceProblem} onClose={() => setVoiceProblem(null)} />}
          <ul>
            {comment.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <table className="level-table">
            <caption className="sr-only">Kết quả theo cấp độ</caption>
            <thead>
              <tr><th scope="col">Cấp độ</th><th scope="col">Đúng</th><th scope="col"><span className="sr-only">Tỉ lệ</span></th></tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.level}>
                  <th scope="row"><span className={`level-chip is-l${s.level}`}>{LEVELS[s.level].code} · {LEVELS[s.level].name}</span></th>
                  <td>{s.correct}/{s.total}</td>
                  <td className="level-bar-cell">
                    <span className="level-bar"><span style={{ width: `${Math.round((s.correct / s.total) * 100)}%` }} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="result-actions">
          <Link href={retryHref} className="button button-yellow">
            <RotateCcw size={18} aria-hidden="true" /> Làm lại bộ này
          </Link>
          <Link href={newSetHref} className="button button-practice">
            <Dices size={18} aria-hidden="true" /> Đổi bộ câu hỏi{attempt.seed ? ` (mức ${MUC[muc].name})` : ''}
          </Link>
          <Link href={listHref} className="button button-white">
            <ListChecks size={18} aria-hidden="true" /> Bài khác
          </Link>
          <Link href="/" className="button button-dark">
            <Home size={18} aria-hidden="true" /> Trang chủ
          </Link>
        </div>

        <h2 className="learn-heading">Từng câu em đã làm</h2>
        <ol className="review-list">
          {attempt.answers.map((item, i) => (
            <li key={item.questionId} className={`review-item is-${item.status}`}>
              <div className="review-top">
                <span className="review-status"><StatusIcon status={item.status} /> {STATUS_TEXT[item.status]}</span>
                <span className={`level-chip is-l${item.level}`}>{LEVELS[item.level].code}</span>
                <span className="review-time">{formatDuration(item.spentMs)} / {item.timeLimit} giây</span>
                {item.points > 0 && <span className="review-points">+{item.points}</span>}
              </div>
              <h3>Câu {i + 1}. {item.prompt}</h3>
              {item.status !== 'correct' && (
                <>
                  {item.userAnswer !== null && item.status !== 'unanswered' && <p>Em đã trả lời: {formatAnswer(item.userAnswer)}</p>}
                  {item.explanation && <p>{item.explanation}</p>}
                  {item.solution && (
                    <details className="review-solution">
                      <summary>Xem lời giải</summary>
                      <p>{item.solution}</p>
                    </details>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}

export default function KetQuaPage() {
  return (
    <Suspense fallback={null}>
      <KetQuaContent />
    </Suspense>
  );
}
