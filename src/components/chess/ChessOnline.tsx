'use client';

// Ván cờ vua trực tuyến giữa hai bạn cùng trường. Máy chủ là trọng tài (kiểm tra nước, giữ đồng hồ);
// trình duyệt nhận thay đổi qua Supabase Realtime và tự tải lại định kỳ phòng khi mạng chập chờn.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Color } from 'chess.js';
import { ArrowLeft, Flag, Handshake, Loader2, RefreshCcw, X } from 'lucide-react';
import ChessBoard, { type BoardMove } from './ChessBoard';
import { PieceIcon } from './ChessPieces';
import { MoveList } from './ChessParts';
import { createClient } from '@/lib/supabase/client';
import { REASON_TEXT, SIDE_NAME, captured, fmtClock } from '@/lib/chess/game';
import { EMOTES, ERROR_TEXT, clockAt, replay, type GameRow } from '@/lib/chess/online-rules';
import type { GamePayload } from '@/lib/chess/online';
import { playSound } from '@/lib/sound';

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export default function ChessOnline({ id, meId }: { id: string; meId: string }) {
  const [pl, setPl] = useState<GamePayload | null>(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<string | null>(null); // nước vừa gửi, chờ máy chủ xác nhận
  const [flip, setFlip] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const offset = useRef(0);
  const lastPly = useRef(-1);
  const flagged = useRef(-1);
  const [, tick] = useState(0);

  const take = useCallback((p: GamePayload) => {
    offset.current = p.now - Date.now();
    setPl((old) => {
      // Bỏ qua dữ liệu cũ hơn cái đang có (realtime và tải lại có thể về không theo thứ tự)
      if (old && Date.parse(old.game.updated_at) > Date.parse(p.game.updated_at)) return old;
      return p;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/co-vua/van/${id}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? 'server'); return; }
      setErr(''); take(j as GamePayload);
    } catch { /* mạng chập chờn: lần sau thử lại */ }
  }, [id, take]);

  useEffect(() => { void load(); }, [load]);

  // Realtime: nhận dòng chess_games mới ngay khi đối thủ đi
  useEffect(() => {
    let sb: ReturnType<typeof createClient> | null = null;
    try { sb = createClient(); } catch { return; }
    const ch = sb.channel(`chess-${id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chess_games', filter: `id=eq.${id}` }, (msg) => {
      const row = msg.new as GameRow;
      setPl((old) => (old && Date.parse(row.updated_at) >= Date.parse(old.game.updated_at) ? { ...old, game: row } : old));
    }).subscribe();
    return () => { void sb?.removeChannel(ch); };
  }, [id]);

  const g = pl?.game;
  const me: Color | null = pl ? (pl.players.w.id === meId ? 'w' : pl.players.b.id === meId ? 'b' : null) : null;
  const turn: Color = g && g.ply % 2 === 1 ? 'b' : 'w';
  const active = g?.status === 'active';

  // Tải lại định kỳ (dự phòng khi realtime chưa bật): nhanh khi đang chờ đối thủ
  useEffect(() => {
    if (!g) return;
    const ms = !active ? 0 : turn === me ? 6000 : 2000;
    if (!ms) return;
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, ms);
    return () => clearInterval(t);
  }, [g, active, turn, me, load]);

  // Đồng hồ chạy + báo hết giờ cho máy chủ
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(t);
  }, [active]);

  const game = useMemo(() => (g ? replay(g.moves) : new Chess()), [g]);
  const shown = useMemo(() => {
    if (!pending) return game;
    const c = new Chess(game.fen());
    try { c.move({ from: pending.slice(0, 2), to: pending.slice(2, 4), promotion: pending[4] }); } catch { return game; }
    return c;
  }, [game, pending]);
  const sans = useMemo(() => (g ? replay(g.moves).history() : []), [g]);

  // Âm thanh khi có nước mới / ván kết thúc; ván vừa kết thúc thì tải lại để có điểm Elo mới
  const prevStatus = useRef<string>('');
  useEffect(() => {
    if (!g) return;
    if (lastPly.current >= 0 && g.ply > lastPly.current) {
      const h = game.history({ verbose: true }); const m = h[h.length - 1];
      playSound(game.inCheck() ? 'check' : m?.captured ? 'capture' : 'move');
    }
    if (prevStatus.current === 'active' && g.status !== 'active') { playSound('complete'); void load(); }
    lastPly.current = g.ply; prevStatus.current = g.status;
  }, [g, game, load]);

  const clock = g ? clockAt(g, Date.now() + offset.current) : { w: 0, b: 0 };
  useEffect(() => {
    if (!g || !active) return;
    if (clock[turn] <= 0 && flagged.current !== g.ply) { flagged.current = g.ply; void act({ action: 'flag' }); }
  });

  const act = async (body: object) => {
    setNote('');
    try {
      const res = await fetch(`/api/co-vua/van/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.game) take(j as GamePayload);
      if (!res.ok && j.error && j.error !== 'not_flagged') setNote(ERROR_TEXT[j.error] ?? 'Chưa gửi được, thử lại nhé.');
      return res.ok;
    } catch { setNote('Mạng chập chờn, đang thử lại…'); void load(); return false; }
  };

  const onMove = async (m: BoardMove) => {
    if (!g || !me || turn !== me || pending) return;
    const uci = `${m.from}${m.to}${m.promotion ?? ''}`;
    setPending(uci); playSound('move');
    await act({ action: 'move', uci, ply: g.ply });
    setPending(null);
  };

  if (err && !pl) return (
    <section className="chl-empty"><h2>Không mở được ván cờ</h2><p>{ERROR_TEXT[err] ?? 'Thử tải lại trang nhé.'}</p><Link href="/co/vua/ban" className="btn btn-primary">Về sảnh đấu</Link></section>
  );
  if (!pl || !g || !me) return <p className="chl-loading"><Loader2 className="spin" aria-hidden="true" /> Đang mở ván cờ…</p>;

  const orientation: Color = flip ? other(me) : me;
  const cap = captured(shown);
  const lastV = shown.history({ verbose: true }).slice(-1)[0];
  const emote = g.emote && Date.now() + offset.current - Date.parse(g.emote.at) < 5000 ? g.emote : null;
  const result = g.status === 'finished' ? { winner: g.result === '1-0' ? 'w' as Color : g.result === '0-1' ? 'b' as Color : null, reason: g.reason } : null;
  const theirOffer = active && g.draw_offer === other(me);
  const myOffer = active && g.draw_offer === me;
  const status = g.status === 'aborted' ? 'Ván đã hủy' : result
    ? (result.winner === null ? `Hòa · ${result.reason ? REASON_TEXT[result.reason] : ''}` : `${result.winner === me ? 'Em thắng' : `${pl.players[result.winner].name} thắng`} · ${result.reason ? REASON_TEXT[result.reason] : ''}`)
    : pending ? 'Đang gửi nước đi…' : turn === me ? (shown.inCheck() ? 'Vua của em đang bị chiếu!' : 'Đến lượt em') : `Chờ ${pl.players[turn].name} đi…`;

  const Card = ({ side }: { side: Color }) => {
    const p = pl.players[side]; const on = active && turn === side; const caps = side === 'w' ? cap.w : cap.b; const adv = side === 'w' ? cap.diff : -cap.diff;
    const t = clock[side];
    return (
      <div className={`chs-card${on ? ' is-active' : ''}`}>
        <span className="chl-av" aria-hidden="true">{p.name.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase()}</span>
        <div className="chs-who">
          <b>{side === me ? `Em · ${p.name}` : p.name} <small>({SIDE_NAME[side]}{p.cls ? ` · ${p.cls}` : ''} · {p.rating})</small></b>
          <span className="chs-caps">{caps.map((x, i) => <PieceIcon key={i} type={x} color={other(side)} size={18} />)}{adv > 0 && <em>+{adv}</em>}</span>
        </div>
        {emote && emote.by === side && <span className="chs-emote" role="status">{EMOTES.find((e) => e.code === emote.code)?.text}</span>}
        <span className={`chs-clock${on ? ' is-on' : ''}${t < 20000 ? ' is-low' : ''}`}>{fmtClock(t)}</span>
      </div>
    );
  };

  return (
    <section className="chs-play">
      <div className="chs-main">
        <Card side={other(orientation)} />
        <ChessBoard fen={shown.fen()} orientation={orientation} movable={active && !pending ? me : null} lastMove={lastV ? { from: lastV.from, to: lastV.to } : null} onMove={(m) => void onMove(m)} label={`Bàn cờ, em cầm quân ${SIDE_NAME[me]}`} />
        <Card side={orientation} />
      </div>
      <aside className="chs-side">
        <Link href="/co/vua/ban" className="ct-link"><ArrowLeft aria-hidden="true" /> Về sảnh đấu</Link>
        <p className={`chs-status${!active ? ' is-end' : ''}`} role="status" aria-live="polite">{status}</p>
        {theirOffer && (
          <div className="chs-offer" role="alert">
            <b><Handshake aria-hidden="true" /> {pl.players[other(me)].name} xin hòa</b>
            <div><button type="button" className="btn btn-primary btn-sm" onClick={() => void act({ action: 'draw_accept' })}>Đồng ý hòa</button><button type="button" className="btn btn-outline btn-sm" onClick={() => void act({ action: 'draw_decline' })}>Đánh tiếp</button></div>
          </div>
        )}
        {myOffer && <p className="chs-note">Em đã xin hòa, chờ bạn trả lời…</p>}
        {note && <p className="chs-note" role="alert">{note}</p>}
        <MoveList sans={sans} />
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
        {!active && <Link href="/co/vua/ban" className="btn btn-primary btn-sm">Về sảnh, chơi ván mới</Link>}
      </aside>

      {(result || g.status === 'aborted') && showResult && (
        <div className="chs-over" role="dialog" aria-modal="true" aria-label="Kết thúc ván">
          <div className={`chs-over-card ${!result || result.winner === null ? 'is-draw' : result.winner === me ? 'is-win' : 'is-lose'}`}>
            <div className="chs-over-ic" aria-hidden="true">{!result || result.winner === null ? <Handshake /> : <PieceIcon type="k" color={result.winner} size={64} />}</div>
            <h2>{!result ? 'Ván đã hủy' : result.winner === null ? 'Hòa cờ' : result.winner === me ? 'Em thắng rồi!' : `${pl.players[result.winner].name} thắng`}</h2>
            <p>{result?.reason ? REASON_TEXT[result.reason] : 'Không tính điểm'} · {Math.ceil(g.ply / 2)} nước</p>
            {result && <p className="chs-over-tip">Điểm của em bây giờ: <b>{pl.players[me].rating}</b></p>}
            <div className="chs-over-act">
              <Link href="/co/vua/ban" className="btn btn-primary">Về sảnh đấu</Link>
              <button type="button" className="btn btn-outline" onClick={() => setShowResult(false)}>Xem lại bàn cờ</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
