'use client';

// ĐẤU CẶP — MÀN CHIẾU LÊN BẢNG (cùng giao diện Đấu tổ, khung ShowFrame): mã phòng vòng đang đấu, đồng hồ đến giờ
// đóng phòng, các cặp “A vs B” (số câu đúng · thời gian, ai thắng), bảng bên phải: các em vào vòng sau / nhà vô địch.
// Dữ liệu là đấu cặp của BattlePanel (tự tải lại mỗi 20 giây); cô xem lại vòng trước bằng các chip vòng.
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SUBJECT_NAME } from '@/lib/classroom/assignments';
import { REASON_LABEL, fmtMs, roundName } from '@/lib/classroom/battle';
import type { BattleView } from './BattlePanel';
import ShowFrame, { Pic, ShowBoard, ShowHero, ShowTimer } from './ShowFrame';

const clockLabel = (s: number) => {
  if (s <= 0) return 'Hết giờ!';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
};

export default function BattleShow({ b, onClose, onRefresh }: { b: BattleView; onClose: () => void; onRefresh: () => void }) {
  const [view, setView] = useState(b.round);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { setView(b.round); }, [b.round]);
  // đồng hồ đến giờ đóng phòng: cập nhật mỗi giây
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const r = b.rounds.find((x) => x.round === view) ?? b.rounds[b.rounds.length - 1];
  const alive = r ? r.pairs.reduce((n, p) => n + (p.b ? 2 : 1), 0) : 0;
  const decided = r ? r.pairs.filter((p) => p.winner).length : 0;
  const opens = r?.room ? new Date(r.room.opens).getTime() : now;
  const closes = r?.room ? new Date(r.room.closes).getTime() : now;
  const left = Math.max(0, Math.round((closes - now) / 1000));
  const total = Math.max(1, Math.round((closes - opens) / 1000));
  const winners = (r?.pairs ?? []).filter((p) => p.winner).map((p) => (p.winner === p.a ? p.aName : p.bName ?? ''));
  const close = () => { if (document.fullscreenElement) void document.exitFullscreen(); onClose(); };

  const chips = (
    <>
      {r?.room && <span className="dto-chip"><Pic src="/emoji/f3d/door.webp" size={22} /> Mã phòng <b className="dto-code">{r.room.code}</b></span>}
      <span className="dto-chip"><Pic src="/brand/ph/star.webp" size={22} /> {decided}/{r?.pairs.length ?? 0} cặp đã phân định</span>
      {b.rounds.length > 1 && b.rounds.map((x) => (
        <button key={x.round} type="button" className={`dto-chip dto-chip-btn${x.round === view ? ' is-on' : ''}`} onClick={() => setView(x.round)}>Vòng {x.round}</button>
      ))}
    </>
  );

  const board = (
    <ShowBoard title={b.championName ? 'Vô địch' : 'Vào vòng sau'} note="Đúng nhiều câu hơn thắng; bằng câu thì ai làm nhanh hơn thắng.">
      {b.championName ? (
        <div className="dto-champ"><Pic src="/emoji/hd/trophy.webp" size={72} /><b>{b.championName}</b></div>
      ) : winners.length ? (
        <ol className="dto-score">
          {winners.map((n, i) => <li key={`${n}-${i}`} className={`is-c${i % 4}`}><Pic src="/emoji/f3d/sports-medal.webp" size={26} /><b>{n}</b><strong>✓</strong></li>)}
        </ol>
      ) : <p className="dto-rule">Chưa cặp nào phân định — chờ các em nộp bài.</p>}
    </ShowBoard>
  );

  return (
    <ShowFrame kind="Đấu cặp" subject={SUBJECT_NAME[b.subject]} tag="Phòng đấu cặp" title={b.title}
      counter={r ? `Vòng ${r.round} · ${roundName(alive)}` : undefined} chips={chips}
      tools={<button type="button" className="dto-sq" onClick={onRefresh} aria-label="Làm mới" title="Làm mới"><RefreshCw aria-hidden="true" /></button>}
      onClose={close} board={board}>
      <div className="dto-q">
        <ShowHero>{r?.room && b.status === 'playing' && r.round === b.round && <ShowTimer left={left} total={total} label={clockLabel(left)} />}</ShowHero>
        <div className="dto-card">
          <span className="dto-qtag">Vòng {r?.round ?? b.round} <Pic src="/brand/ph/star.webp" size={30} /></span>
          {b.championName && r?.round === b.round ? (
            <p className="dto-prompt">🎉 Chúc mừng nhà vô địch <b>{b.championName}</b>!</p>
          ) : (
            <p className="dto-sub">{r?.room ? `Vào phòng bằng mã ${r.room.code} — làm lúc nào cũng được trước giờ đóng. ` : ''}Cặp nào hai bạn nộp xong là có kết quả.</p>
          )}
          <ul className="dto-pairs">
            {(r?.pairs ?? []).map((p) => (!p.b ? (
              <li key={p.id} className="dto-pair is-bye"><span className="p is-win"><b>{p.aName}</b><small>🎟️ vé đi tiếp</small></span></li>
            ) : (
              <li key={p.id} className="dto-pair" title={p.reason ? REASON_LABEL[p.reason] : undefined}>
                <span className={`p${p.winner ? (p.winner === p.a ? ' is-win' : ' is-lose') : ''}`}><b>{p.winner === p.a ? '🏅 ' : ''}{p.aName}</b><small>{p.ra ? `${p.ra.correct} câu · ${fmtMs(p.ra.ms)}` : 'chưa nộp'}</small></span>
                <span className="dto-vs">VS</span>
                <span className={`p is-b${p.winner ? (p.winner === p.b ? ' is-win' : ' is-lose') : ''}`}><b>{p.winner === p.b ? '🏅 ' : ''}{p.bName}</b><small>{p.rb ? `${p.rb.correct} câu · ${fmtMs(p.rb.ms)}` : 'chưa nộp'}</small></span>
              </li>
            )))}
          </ul>
        </div>
      </div>
    </ShowFrame>
  );
}
