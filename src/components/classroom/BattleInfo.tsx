'use client';

// Trận ĐẤU CẶP của em trong một phòng thi (migration 0073). Phòng thường: không hiện gì.
//  - Trước khi làm: em đấu với bạn nào, vòng mấy, cách phân định.
//  - Sau khi nộp: chờ bạn nộp (tự tải lại mỗi 15 giây) → em thắng / dừng lại (lời Milo khen cố gắng) / vô địch.
import { useCallback, useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { REASON_LABEL, fmtMs, type WinReason } from '@/lib/classroom/battle';
import '@/styles/bt.css';

type Info = {
  title: string; round: number; roundName: string; opponent: string | null; phase: 'cho' | 'thang' | 'dung' | 'vo_dich'; reason: WinReason | null;
  me: { correct: number; ms: number | null } | null; opp: { correct: number; ms: number | null } | null;
  milo: string | null; championName: string | null; nextOpen: boolean;
};

export default function BattleInfo({ roomId, submitted }: { roomId: string; submitted: boolean }) {
  const [b, setB] = useState<Info | null>(null);
  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/hoc-sinh/dau-cap?room=${roomId}`, { cache: 'no-store' });
      const d = (await res.json()) as { battle: Info | null };
      setB((cur) => (JSON.stringify(cur) === JSON.stringify(d.battle) ? cur : d.battle));
    } catch { /* mất mạng: lần sau */ }
  }, [roomId]);
  useEffect(() => { void load(); }, [load, submitted]);
  useEffect(() => {
    if (!submitted || b?.phase !== 'cho') return;
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [submitted, b?.phase, load]);

  if (!b) return null;
  const vs = b.opponent ? <>với bạn <b>{b.opponent}</b></> : <>(em nhận vé đi tiếp)</>;
  if (!submitted) {
    return (
      <section className="bt-me" aria-label="Trận đấu cặp của em">
        <p className="bt-me-big"><Swords aria-hidden="true" width={20} height={20} /> Đấu cặp · {b.roundName} (vòng {b.round})</p>
        <p>Em đấu {vs}. Hai bạn làm cùng một đề. Ai đúng nhiều câu hơn thắng; bằng câu thì ai làm nhanh hơn thắng — em làm cẩn thận mà nhanh tay nhé!</p>
      </section>
    );
  }
  const score = b.me && b.opp && (
    <p>Em đúng <b>{b.me.correct}</b> câu ({fmtMs(b.me.ms)}) · bạn đúng <b>{b.opp.correct}</b> câu ({fmtMs(b.opp.ms)})</p>
  );
  return (
    <section className={`bt-me${b.phase === 'thang' || b.phase === 'vo_dich' ? ' is-win' : ''}`} aria-live="polite" aria-label="Kết quả đấu cặp">
      {b.phase === 'cho' && <><p className="bt-me-big">⏳ Chờ bạn {b.opponent} nộp bài…</p><p>Hai bạn nộp xong là biết kết quả trận vòng {b.round}. Em có thể về trang của em rồi quay lại xem sau.</p></>}
      {b.phase === 'thang' && <>
        <p className="bt-me-big">🎉 Em thắng trận vòng {b.round} {vs}!</p>{score}
        {b.reason && <p className="dash-muted">Phân định: {REASON_LABEL[b.reason]}.</p>}
        <p>{b.nextOpen ? 'Vòng sau đã mở — em xem phòng thi mới ở trang của em nhé!' : 'Chờ cô bốc thăm vòng sau nhé. Phòng thi mới sẽ hiện ở trang của em.'}</p>
      </>}
      {b.phase === 'dung' && <>
        <p className="bt-me-big">🦉 {b.milo}</p>{score}
        {b.reason && b.reason !== 've' && <p className="dash-muted">Trận {vs}: {REASON_LABEL[b.reason]}.</p>}
        {b.championName && <p>🏆 Nhà vô địch: <b>{b.championName}</b>. Cùng vỗ tay cho bạn nào!</p>}
      </>}
      {b.phase === 'vo_dich' && <><p className="bt-me-big">🏆 Em là nhà vô địch {b.title}!</p>{score}<p>Milo chúc mừng em! Nhớ cảm ơn các bạn đã đấu cùng nhé.</p></>}
    </section>
  );
}
