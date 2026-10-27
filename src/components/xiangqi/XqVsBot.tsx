'use client';

// Chơi cờ tướng với máy: chọn bên (Đỏ đi trước), mức máy, đồng hồ; luật cờ tướng đầy đủ (bộ luật src/lib/xiangqi);
// gợi ý nước, đi lại (khi không tính giờ), xin hòa, xin thua, lật bàn, ghi nước kiểu Việt (P2-5, M8.7…).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Flag, Handshake, Lightbulb, Play, RefreshCcw, RotateCcw, Undo2, User } from 'lucide-react';
import XiangqiBoard, { XQ_VIET, XqDiscIcon } from './XiangqiBoard';
import { CapturedRow, XQ_RULES, XQ_SIDE, XqMoveList, boardOf, capturedOf, idx, pt, vnHistory } from './xq-ui';
import { XqGame, kindOf, sqName, type XSide } from '@/lib/xiangqi/engine';
import { xqEvaluate, xqPickMove } from '@/lib/xiangqi/bot';
import { BOT_LEVELS, type BotLevel } from '@/lib/chess/bot';
import { TIME_CONTROLS, fmtClock, reasonText } from '@/lib/chess/game';
import { sfx } from '@/lib/chess/sound-pref';
import { BoardAlerts, LiveClock, SoundButton, TurnBar } from '@/components/chess/ChessParts';

type Pick = 'w' | 'b' | 'x';
type Setup = { pick: Pick; level: BotLevel; tc: string };
type Result = { winner: XSide | null; reason: string };
const KEY = 'xq-bot-setup';
const other = (c: XSide): XSide => (c === 'w' ? 'b' : 'w');

function useXqWorker() {
  const ref = useRef<Worker | null>(null);
  const seq = useRef(0);
  const waiters = useRef(new Map<number, (m: string | null) => void>());
  useEffect(() => {
    try {
      const w = new Worker(new URL('../../lib/xiangqi/bot.worker.ts', import.meta.url));
      w.onmessage = (e: MessageEvent<{ id: number; move: string | null }>) => { const f = waiters.current.get(e.data.id); waiters.current.delete(e.data.id); f?.(e.data.move); };
      ref.current = w;
    } catch { ref.current = null; }
    const waiting = waiters.current;
    return () => { ref.current?.terminate(); ref.current = null; waiting.clear(); };
  }, []);
  return useCallback((fen: string, level: BotLevel, history: string[], ms?: number) => new Promise<string | null>((resolve) => {
    const id = ++seq.current;
    if (ref.current) { waiters.current.set(id, resolve); ref.current.postMessage({ id, fen, level, ms, history }); }
    else setTimeout(() => resolve(xqPickMove(fen, level, Math.random, { ms, history })), 30);
  }), []);
}

export default function XqVsBot() {
  const [setup, setSetup] = useState<Setup>({ pick: 'w', level: 1, tc: 'free' });
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Setup | null; if (s && BOT_LEVELS.some((l) => l.id === s.level)) setSetup(s); } catch { /* bỏ qua */ } }, []);
  const save = (s: Setup) => { setSetup(s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bỏ qua */ } };

  const [me, setMe] = useState<XSide>('w');
  const [flip, setFlip] = useState(false);
  const gRef = useRef(new XqGame());
  const [ver, setVer] = useState(0); // tăng mỗi khi ván thay đổi
  const [sel, setSel] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<{ from: number; to: number } | null>(null);
  const [note, setNote] = useState('');
  const tc = TIME_CONTROLS.find((t) => t.id === setup.tc) ?? TIME_CONTROLS[0];
  const timed = tc.base > 0;
  const clock = useRef({ w: 0, b: 0, since: 0 });
  const ask = useXqWorker();
  const gen = useRef(0);
  const g = gRef.current;
  const bot = other(me);

  const finish = useCallback((r: Result) => { setResult(r); setShowResult(true); setThinking(false); setHint(null); setNote(''); sfx(r.winner === null || r.winner === me ? 'complete' : 'timeout'); }, [me]);

  const apply = useCallback((uci: string) => {
    const game = gRef.current; const mover = game.turn();
    const m = game.move(uci); if (!m) return false;
    if (timed) { const now = Date.now(); const c = clock.current; c[mover] = c[mover] - (now - c.since) + tc.inc * 1000; c.since = now; }
    setVer((v) => v + 1); setSel(null); setHint(null); setNote('');
    sfx(game.inCheck() ? 'check' : m.cap ? 'capture' : 'move');
    const r = game.result(); if (r) finish(r);
    return true;
  }, [timed, tc.inc, finish]);

  // Máy đi khi tới lượt
  useEffect(() => {
    if (phase !== 'play' || result || g.turn() !== bot) return;
    const my = gen.current; setThinking(true);
    const t = setTimeout(() => {
      void ask(g.fen(), setup.level, g.keys.slice(-16)).then((m) => { if (gen.current !== my) return; setThinking(false); if (m) apply(m); });
    }, setup.level === 1 ? 500 : 250);
    return () => clearTimeout(t);
  }, [ver, phase, result, bot, setup.level, ask, apply, g]);

  // Đồng hồ
  useEffect(() => {
    if (phase !== 'play' || !timed || result) return;
    const id = setInterval(() => {
      const c = clock.current; const side = gRef.current.turn();
      if (c[side] - (Date.now() - c.since) <= 0) {
        c[side] = 0; c.since = Date.now();
        finish(gRef.current.canMate(other(side)) ? { winner: other(side), reason: 'timeout' } : { winner: null, reason: 'timeout_vs_material' });
      }
    }, 250); // chỉ kiểm tra hết giờ; con số trên đồng hồ do LiveClock tự vẽ
    return () => clearInterval(id);
  }, [phase, timed, result, finish]);

  const start = () => {
    gen.current++;
    const color: XSide = setup.pick === 'x' ? (Math.random() < 0.5 ? 'w' : 'b') : setup.pick;
    gRef.current = new XqGame();
    clock.current = { w: tc.base * 1000, b: tc.base * 1000, since: Date.now() };
    setMe(color); setFlip(false); setVer((v) => v + 1); setSel(null); setResult(null); setShowResult(false); setHint(null); setNote(''); setThinking(false);
    setPhase('play');
  };
  const undo = () => {
    if (timed || thinking) return;
    gen.current++;
    g.undo(); if (g.turn() !== me) g.undo();
    setVer((v) => v + 1); setSel(null); setResult(null); setShowResult(false); setHint(null); setNote('');
  };
  const askHint = () => {
    if (thinking || result || g.turn() !== me) return;
    const my = gen.current; setNote('Đang tìm nước hay…');
    void ask(g.fen(), 3, g.keys.slice(-16), 1000).then((m) => {
      if (gen.current !== my || !m) return;
      const from = idx({ f: m.charCodeAt(0) - 97, r: 9 - Number(m[1]) }), to = idx({ f: m.charCodeAt(2) - 97, r: 9 - Number(m[3]) });
      setHint({ from, to }); setNote('Gợi ý: đi theo mũi tên màu cam.');
    });
  };
  const offerDraw = () => {
    if (result || thinking) return;
    const e = xqEvaluate(g.bd) * (g.turn() === bot ? 1 : -1);
    if (e <= -150 || (g.ucis.length >= 80 && Math.abs(e) < 60)) finish({ winner: null, reason: 'agreement' });
    else setNote('Máy chưa đồng ý hòa. Em cứ đánh tiếp nhé!');
  };

  const onPoint = (p: { f: number; r: number }) => {
    if (phase !== 'play' || result || thinking || g.turn() !== me) return;
    const i = idx(p); const pc = g.get(i);
    if (sel !== null) {
      const m = g.movesFrom(sel).find((x) => x.to === i);
      if (m) { apply(sqName(sel) + sqName(i)); return; }
    }
    if (pc && pc.side === me) setSel(i === sel ? null : i); else setSel(null);
  };

  const notes = useMemo(() => vnHistory(g.ucis), [g, ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const cap = useMemo(() => capturedOf(g.bd), [g, ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const board = useMemo(() => boardOf(g.bd), [g, ver]); // eslint-disable-line react-hooks/exhaustive-deps
  const targets = sel !== null ? g.movesFrom(sel).map((m) => ({ ...pt(m.to), capture: Boolean(m.cap) })) : [];
  const lastU = g.ucis[g.ucis.length - 1];
  const last = lastU ? { from: { f: lastU.charCodeAt(0) - 97, r: 9 - Number(lastU[1]) }, to: { f: lastU.charCodeAt(2) - 97, r: 9 - Number(lastU[3]) } } : null;
  const checkPt = g.inCheck() ? pt(g.bd.king(g.bd.side)) : null;
  const orientation: XSide = flip ? other(me) : me;
  const levelInfo = BOT_LEVELS.find((l) => l.id === setup.level)!;
  const status = result
    ? (result.winner === null ? `Hòa · ${reasonText(result.reason, 'xiangqi')}` : `${result.winner === me ? 'Em thắng' : 'Máy thắng'} · ${reasonText(result.reason, 'xiangqi')}`)
    : thinking ? 'Máy đang nghĩ…' : g.turn() === me ? (g.inCheck() ? 'Tướng của em đang bị chiếu!' : 'Đến lượt em') : '';
  // Nước vừa đi + chiếu tướng (báo lượt rõ ràng, chữ CHIẾU TƯỚNG thật to)
  const lastH = g.bd.hist[g.bd.hist.length - 1];
  const lastPiece = lastH ? g.get(lastH.m.to) : null;
  const lastText = lastH && lastPiece ? `${lastPiece.side === me ? 'Em' : 'Máy'} vừa đi ${XQ_VIET[lastPiece.kind]} (${notes[notes.length - 1] ?? ''})${lastH.m.cap ? `, ăn ${XQ_VIET[kindOf(lastH.m.cap)]}` : ''}` : null;
  const inCheck = g.inCheck();
  const checkKey = inCheck ? g.ucis.length : null;
  const turnTone = result ? 'end' : g.turn() === me ? (inCheck ? 'check' : 'me') : 'wait';
  const turnTitle = result ? status : g.turn() === me ? (inCheck ? 'Đến lượt em · Tướng đang bị chiếu!' : 'Đến lượt em đi') : 'Lượt của máy · máy đang nghĩ…';

  if (phase === 'setup') {
    return (
      <section className="chs-setup" aria-label="Chuẩn bị ván cờ">
        <div className="chs-setup-card">
          <h2>Chơi với máy</h2>
          <fieldset><legend>Em cầm quân</legend>
            <div className="chs-opts">
              {([['w', 'Đỏ', 'Đi trước'], ['b', 'Đen', 'Đi sau'], ['x', 'Ngẫu nhiên', 'Máy chọn giúp']] as const).map(([id, l, n]) => (
                <button key={id} type="button" aria-pressed={setup.pick === id} onClick={() => save({ ...setup, pick: id })}>
                  <span className="chs-opt-ic">{id === 'x' ? <><XqDiscIcon piece={{ side: 'r', kind: 'k' }} size={30} /><XqDiscIcon piece={{ side: 'b', kind: 'k' }} size={30} /></> : <XqDiscIcon piece={{ side: id === 'w' ? 'r' : 'b', kind: 'k' }} size={36} />}</span>
                  <b>{l}</b><small>{n}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset><legend>Mức của máy</legend>
            <div className="chs-opts">
              {BOT_LEVELS.map((l) => (
                <button key={l.id} type="button" aria-pressed={setup.level === l.id} onClick={() => save({ ...setup, level: l.id })}>
                  <span className="chs-stars" aria-hidden="true">{'★'.repeat(l.id)}{'☆'.repeat(3 - l.id)}</span><b>{l.label}</b><small>{l.note}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset><legend>Đồng hồ</legend>
            <div className="chs-chips">{TIME_CONTROLS.map((t) => <button key={t.id} type="button" aria-pressed={setup.tc === t.id} onClick={() => save({ ...setup, tc: t.id })}>{t.label}</button>)}</div>
          </fieldset>
          <button type="button" className="btn btn-primary chs-go" onClick={start}><Play aria-hidden="true" /> Bắt đầu ván cờ</button>
        </div>
        <aside className="chs-rules">
          <h3>Luật thi đấu</h3>
          <ul>{XQ_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        </aside>
      </section>
    );
  }

  const card = (side: XSide) => {
    const isMe = side === me; const active = !result && g.turn() === side;
    const caps = side === 'w' ? cap.w : cap.b; const adv = side === 'w' ? cap.diff : -cap.diff;
    return (
      <div className={`chs-card${active ? ' is-active' : ''}`}>
        <span className="chs-av" aria-hidden="true">{isMe ? <User /> : <Bot />}</span>
        <div className="chs-who">
          <b>{isMe ? 'Em' : `Máy · ${levelInfo.label}`} <small>({XQ_SIDE[side]})</small></b>
          <span className="xq-capline"><CapturedRow kinds={caps} side={side === 'w' ? 'b' : 'r'} />{adv > 0 && <em>+{adv}</em>}</span>
        </div>
        {!isMe && thinking && <span className="chs-think" aria-hidden="true"><i /><i /><i /></span>}
        {timed && <LiveClock key={`${side}-${clock.current.since}-${result ? 'end' : 'on'}`} left={clock.current[side]} since={clock.current.since} running={active} fmt={fmtClock} sound={side === me} />}
      </div>
    );
  };

  return (
    <section className="chs-play xq-play">
      <div className="chs-main">
        {card(other(orientation))}
        <TurnBar tone={turnTone} title={turnTitle} sub={lastText ?? `Em cầm quân ${XQ_SIDE[me]}${me === 'w' ? ', được đi trước' : ''}`} />
        <div className="chs-boardwrap">
          <XiangqiBoard board={board} orientation={orientation === 'w' ? 'r' : 'b'} selected={sel !== null ? pt(sel) : null} targets={targets} lastMove={last} check={checkPt} hint={hint ? { from: pt(hint.from), to: pt(hint.to) } : null} onPoint={onPoint} label={`Bàn cờ tướng, em cầm quân ${XQ_SIDE[me]}`} />
          <BoardAlerts moveKey={g.ucis.length} moveText={lastText} checkKey={checkKey} checkTitle={result?.reason === 'checkmate' ? 'CHIẾU BÍ!' : 'CHIẾU TƯỚNG!'} checkSub={result ? undefined : g.turn() === me ? 'Tướng của em đang bị chiếu — hãy cứu Tướng!' : 'Em đang chiếu Tướng của máy'} />
        </div>
        {card(orientation)}
      </div>
      <aside className="chs-side">
        <p className={`chs-status${result ? ' is-end' : ''}`} role="status" aria-live="polite">{status || ' '}</p>
        {note && <p className="chs-note">{note}</p>}
        <XqMoveList notes={notes} />
        <p className="xq-legend">Ghi nước: <b>.</b> tiến · <b>/</b> thoái · <b>-</b> bình (đi ngang). Số cột đếm từ phải sang của mỗi bên.</p>
        <div className="chs-tools">
          <button type="button" className="btn btn-outline btn-sm" onClick={askHint} disabled={!!result || thinking || g.turn() !== me}><Lightbulb aria-hidden="true" /> Gợi ý</button>
          {!timed && <button type="button" className="btn btn-outline btn-sm" onClick={undo} disabled={thinking || g.ucis.length === 0}><Undo2 aria-hidden="true" /> Đi lại</button>}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setFlip((f) => !f)}><RefreshCcw aria-hidden="true" /> Lật bàn</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={offerDraw} disabled={!!result || thinking}><Handshake aria-hidden="true" /> Xin hòa</button>
          <button type="button" className="btn btn-outline btn-sm is-danger" onClick={() => { if (!result) finish({ winner: bot, reason: 'resign' }); }} disabled={!!result}><Flag aria-hidden="true" /> Xin thua</button>
        </div>
        <div className="chs-tools">
          <SoundButton />
          <button type="button" className="btn btn-primary btn-sm" onClick={start}><RotateCcw aria-hidden="true" /> Ván mới</button>
          <button type="button" className="ct-link" onClick={() => { gen.current++; setPhase('setup'); }}>Đổi cài đặt</button>
        </div>
      </aside>

      {result && showResult && (
        <div className="chs-over" role="dialog" aria-modal="true" aria-label="Kết thúc ván">
          <div className={`chs-over-card ${result.winner === null ? 'is-draw' : result.winner === me ? 'is-win' : 'is-lose'}`}>
            <div className="chs-over-ic" aria-hidden="true">{result.winner === null ? <Handshake /> : <XqDiscIcon piece={{ side: result.winner === 'w' ? 'r' : 'b', kind: 'k' }} size={72} />}</div>
            <h2>{result.winner === null ? 'Hòa cờ' : result.winner === me ? 'Em thắng rồi!' : 'Máy thắng ván này'}</h2>
            <p>{reasonText(result.reason, 'xiangqi')} · {Math.ceil(g.ucis.length / 2)} nước</p>
            {result.winner !== me && result.winner !== null && <p className="chs-over-tip">Không sao cả! Thử bấm <b>Gợi ý</b> hoặc chọn mức dễ hơn nhé.</p>}
            <div className="chs-over-act">
              <button type="button" className="btn btn-primary" onClick={start}><RotateCcw aria-hidden="true" /> Chơi ván mới</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowResult(false)}>Xem lại bàn cờ</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
