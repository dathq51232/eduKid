'use client';

// Ván cờ tướng trực tuyến giữa hai bạn cùng trường. Máy chủ là trọng tài (bộ luật cờ tướng, đồng hồ);
// phần tải ván / realtime / đồng hồ dùng chung với cờ vua (useOnlineGame).
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Flag, Handshake, Loader2, RefreshCcw, X } from 'lucide-react';
import XiangqiBoard, { XqDiscIcon } from './XiangqiBoard';
import { CapturedRow, XQ_SIDE, XqMoveList, boardOf, capturedOf, idx, pt, vnHistory } from './xq-ui';
import { useOnlineGame } from '@/components/chess/useOnlineGame';
import { LiveClock } from '@/components/chess/ChessParts';
import { XqGame, sqName, type XSide } from '@/lib/xiangqi/engine';
import { fmtClock, reasonText } from '@/lib/chess/game';
import { EMOTES, ERROR_TEXT } from '@/lib/chess/online-rules';
import { playSound } from '@/lib/sound';

const other = (c: XSide): XSide => (c === 'w' ? 'b' : 'w');
const ptOf = (s: string) => ({ f: s.charCodeAt(0) - 97, r: 9 - Number(s[1]) });

export default function XqOnline({ id, meId }: { id: string; meId: string }) {
  const { pl, err, note, load, act, g, me, turn, active, clockFor, serverNow } = useOnlineGame(id, meId);
  const [, bump] = useState(0);
  // Bong bóng biểu cảm tự ẩn sau vài giây (không cần nhịp vẽ lại liên tục)
  useEffect(() => {
    if (!g?.emote) return;
    const left = 7000 - (serverNow() - Date.parse(g.emote.at));
    if (left <= 0) return;
    const t = setTimeout(() => bump((n) => n + 1), left + 50);
    return () => clearTimeout(t);
  }, [g?.emote]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pending, setPending] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [flip, setFlip] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const lastPly = useRef(-1);
  const prevStatus = useRef('');

  const game = useMemo(() => { const x = XqGame.fromMoves(g?.moves ?? []); if (pending) x.move(pending); return x; }, [g, pending]);
  const notes = useMemo(() => vnHistory(g?.moves ?? []), [g]);

  useEffect(() => {
    if (!g) return;
    if (lastPly.current >= 0 && g.ply > lastPly.current) {
      const x = XqGame.fromMoves(g.moves.slice(0, -1)); const m = x.move(g.moves[g.moves.length - 1]);
      playSound(x.inCheck() ? 'check' : m?.cap ? 'capture' : 'move');
    }
    if (prevStatus.current === 'active' && g.status !== 'active') { playSound('complete'); void load(); }
    lastPly.current = g.ply; prevStatus.current = g.status;
  }, [g, load]);

  if (err && !pl) return (
    <section className="chl-empty"><h2>Không mở được ván cờ</h2><p>{ERROR_TEXT[err] ?? 'Thử tải lại trang nhé.'}</p><Link href="/co/tuong/ban" className="btn btn-primary">Về sảnh đấu</Link></section>
  );
  if (!pl || !g || !me) return <p className="chl-loading"><Loader2 className="spin" aria-hidden="true" /> Đang mở ván cờ…</p>;

  const myTurn = active && turn === me && !pending;
  const onPoint = (p: { f: number; r: number }) => {
    if (!myTurn) return;
    const i = idx(p); const pc = game.get(i);
    if (sel !== null && game.movesFrom(sel).some((m) => m.to === i)) {
      const uci = sqName(sel) + sqName(i);
      setSel(null); setPending(uci); playSound('move');
      void act({ action: 'move', uci, ply: g.ply }).finally(() => setPending(null));
      return;
    }
    if (pc && pc.side === me) setSel(i === sel ? null : i); else setSel(null);
  };

  const orientation: XSide = flip ? other(me) : me;
  const cap = capturedOf(game.bd);
  const lastU = game.ucis[game.ucis.length - 1];
  const last = lastU ? { from: ptOf(lastU.slice(0, 2)), to: ptOf(lastU.slice(2, 4)) } : null;
  const targets = sel !== null && myTurn ? game.movesFrom(sel).map((m) => ({ ...pt(m.to), capture: Boolean(m.cap) })) : [];
  const checkPt = game.inCheck() ? pt(game.bd.king(game.bd.side)) : null;
  const emote = g.emote && serverNow() - Date.parse(g.emote.at) < 7000 ? g.emote : null;
  const result = g.status === 'finished' ? { winner: g.result === '1-0' ? 'w' as XSide : g.result === '0-1' ? 'b' as XSide : null, reason: g.reason } : null;
  const theirOffer = active && g.draw_offer === other(me);
  const myOffer = active && g.draw_offer === me;
  const status = g.status === 'aborted' ? 'Ván đã hủy' : result
    ? (result.winner === null ? `Hòa · ${reasonText(result.reason, 'xiangqi')}` : `${result.winner === me ? 'Em thắng' : `${pl.players[result.winner].name} thắng`} · ${reasonText(result.reason, 'xiangqi')}`)
    : pending ? 'Đang gửi nước đi…' : turn === me ? (game.inCheck() ? 'Tướng của em đang bị chiếu!' : 'Đến lượt em') : `Chờ ${pl.players[turn].name} đi…`;

  const card = (side: XSide) => {
    const p = pl.players[side]; const on = active && turn === side; const ck = clockFor(side);
    const caps = side === 'w' ? cap.w : cap.b; const adv = side === 'w' ? cap.diff : -cap.diff;
    return (
      <div className={`chs-card${on ? ' is-active' : ''}`}>
        <span className={`chl-av xq-av is-${side}`} aria-hidden="true">{p.name.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase()}</span>
        <div className="chs-who">
          <b>{side === me ? `Em · ${p.name}` : p.name} <small>({XQ_SIDE[side]}{p.cls ? ` · ${p.cls}` : ''} · {p.rating})</small></b>
          <span className="xq-capline"><CapturedRow kinds={caps} side={side === 'w' ? 'b' : 'r'} />{adv > 0 && <em>+{adv}</em>}</span>
        </div>
        {emote && emote.by === side && <span className="chs-emote" role="status">{EMOTES.find((e) => e.code === emote.code)?.text}</span>}
        <LiveClock key={`${side}-${g.ply}-${g.status}`} left={ck.left} since={ck.since} running={ck.running} fmt={fmtClock} />
      </div>
    );
  };

  return (
    <section className="chs-play xq-play">
      <div className="chs-main">
        {card(other(orientation))}
        <XiangqiBoard board={boardOf(game.bd)} orientation={orientation === 'w' ? 'r' : 'b'} selected={sel !== null ? pt(sel) : null} targets={targets} lastMove={last} check={checkPt} onPoint={onPoint} label={`Bàn cờ tướng, em cầm quân ${XQ_SIDE[me]}`} />
        {card(orientation)}
      </div>
      <aside className="chs-side">
        <Link href="/co/tuong/ban" className="ct-link"><ArrowLeft aria-hidden="true" /> Về sảnh đấu</Link>
        <p className={`chs-status${!active ? ' is-end' : ''}`} role="status" aria-live="polite">{status}</p>
        {theirOffer && (
          <div className="chs-offer" role="alert">
            <b><Handshake aria-hidden="true" /> {pl.players[other(me)].name} xin hòa</b>
            <div><button type="button" className="btn btn-primary btn-sm" onClick={() => void act({ action: 'draw_accept' })}>Đồng ý hòa</button><button type="button" className="btn btn-outline btn-sm" onClick={() => void act({ action: 'draw_decline' })}>Đánh tiếp</button></div>
          </div>
        )}
        {myOffer && <p className="chs-note">Em đã xin hòa, chờ bạn trả lời…</p>}
        {note && <p className="chs-note" role="alert">{note}</p>}
        <XqMoveList notes={notes} />
        {active && (
          <>
            <div className="chs-emotes" aria-label="Gửi biểu cảm">{EMOTES.map((e) => <button key={e.code} type="button" onClick={() => void act({ action: 'emote', code: e.code })} title={e.text}>{e.text}</button>)}</div>
            <div className="chs-tools">
              {g.ply < 2
                ? <button type="button" className="btn btn-outline btn-sm" onClick={() => void act({ action: 'abort' })}><X aria-hidden="true" /> Hủy ván</button>
                : <button type="button" className="btn btn-outline btn-sm" onClick={() => void act({ action: 'draw_offer' })} disabled={myOffer}><Handshake aria-hidden="true" /> Xin hòa</button>}
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setFlip((f) => !f)}><RefreshCcw aria-hidden="true" /> Lật bàn</button>
              {confirmResign
                ? <><button type="button" className="btn btn-outline btn-sm is-danger" onClick={() => { setConfirmResign(false); void act({ action: 'resign' }); }}>Chắc chắn xin thua?</button><button type="button" className="ct-link" onClick={() => setConfirmResign(false)}>Thôi</button></>
                : <button type="button" className="btn btn-outline btn-sm is-danger" onClick={() => setConfirmResign(true)} disabled={g.ply < 2}><Flag aria-hidden="true" /> Xin thua</button>}
            </div>
          </>
        )}
        {!active && <Link href="/co/tuong/ban" className="btn btn-primary btn-sm">Về sảnh, chơi ván mới</Link>}
      </aside>

      {(result || g.status === 'aborted') && showResult && (
        <div className="chs-over" role="dialog" aria-modal="true" aria-label="Kết thúc ván">
          <div className={`chs-over-card ${!result || result.winner === null ? 'is-draw' : result.winner === me ? 'is-win' : 'is-lose'}`}>
            <div className="chs-over-ic" aria-hidden="true">{!result || result.winner === null ? <Handshake /> : <XqDiscIcon piece={{ side: result.winner === 'w' ? 'r' : 'b', kind: 'k' }} size={72} />}</div>
            <h2>{!result ? 'Ván đã hủy' : result.winner === null ? 'Hòa cờ' : result.winner === me ? 'Em thắng rồi!' : `${pl.players[result.winner].name} thắng`}</h2>
            <p>{result?.reason ? reasonText(result.reason, 'xiangqi') : 'Không tính điểm'} · {Math.ceil(g.ply / 2)} nước</p>
            {result && <p className="chs-over-tip">Điểm cờ tướng của em bây giờ: <b>{pl.players[me].rating}</b></p>}
            <div className="chs-over-act">
              <Link href="/co/tuong/ban" className="btn btn-primary">Về sảnh đấu</Link>
              <button type="button" className="btn btn-outline" onClick={() => setShowResult(false)}>Xem lại bàn cờ</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
