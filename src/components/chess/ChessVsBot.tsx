'use client';

// Chơi cờ vua với máy: chọn bên, mức máy, kiểu đồng hồ; luật FIDE đầy đủ (chess.js làm trọng tài);
// gợi ý nước, đi lại (khi không tính giờ), xin hòa, xin thua, lật bàn, danh sách nước đi.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type PieceSymbol } from 'chess.js';
import { Bot, Flag, Handshake, Lightbulb, Play, RefreshCcw, RotateCcw, Undo2, User } from 'lucide-react';
import ChessBoard, { type BoardMove } from './ChessBoard';
import { PieceIcon } from './ChessPieces';
import { MoveList } from './ChessParts';
import { BOT_LEVELS, Board, pickMove, type BotLevel, type BotMove } from '@/lib/chess/bot';
import { REASON_TEXT, SIDE_NAME, TIME_CONTROLS, boardResult, captured, fmtClock, timeoutResult, type GameResult } from '@/lib/chess/game';
import { playSound } from '@/lib/sound';

type Pick = 'w' | 'b' | 'r';
type Setup = { pick: Pick; level: BotLevel; tc: string };
const KEY = 'chess-bot-setup';
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

function useBotWorker() {
  const ref = useRef<Worker | null>(null);
  const seq = useRef(0);
  const waiters = useRef(new Map<number, (m: BotMove | null) => void>());
  useEffect(() => {
    try {
      const w = new Worker(new URL('../../lib/chess/bot.worker.ts', import.meta.url));
      w.onmessage = (e: MessageEvent<{ id: number; move: BotMove | null }>) => { const f = waiters.current.get(e.data.id); waiters.current.delete(e.data.id); f?.(e.data.move); };
      ref.current = w;
    } catch { ref.current = null; }
    const waiting = waiters.current;
    return () => { ref.current?.terminate(); ref.current = null; waiting.clear(); };
  }, []);
  return useCallback((fen: string, level: BotLevel, ms?: number) => new Promise<BotMove | null>((resolve) => {
    const id = ++seq.current;
    if (ref.current) { waiters.current.set(id, resolve); ref.current.postMessage({ id, fen, level, ms }); }
    else setTimeout(() => resolve(pickMove(fen, level, Math.random, ms ? { ms } : undefined)), 30);
  }), []);
}

export default function ChessVsBot() {
  const [setup, setSetup] = useState<Setup>({ pick: 'w', level: 1, tc: 'free' });
  const [phase, setPhase] = useState<'setup' | 'play'>('setup');
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Setup | null; if (s && BOT_LEVELS.some((l) => l.id === s.level)) setSetup(s); } catch { /* bỏ qua */ } }, []);
  const save = (s: Setup) => { setSetup(s); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bỏ qua */ } };

  const [me, setMe] = useState<Color>('w');
  const [flip, setFlip] = useState(false);
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [sans, setSans] = useState<string[]>([]);
  const [last, setLast] = useState<{ from: string; to: string } | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<{ from: string; to: string } | null>(null);
  const [note, setNote] = useState('');
  const tc = TIME_CONTROLS.find((t) => t.id === setup.tc) ?? TIME_CONTROLS[0];
  const timed = tc.base > 0;
  const clock = useRef({ w: 0, b: 0, since: 0 });
  const [, force] = useState(0);
  const ask = useBotWorker();
  const gen = useRef(0); // đổi ván thì bỏ qua nước máy của ván cũ

  const bot = other(me);
  const g = gameRef.current;

  const finish = useCallback((r: GameResult) => {
    setResult(r); setShowResult(true); setThinking(false); setHint(null); setNote('');
    playSound(r.winner === null ? 'complete' : r.winner === me ? 'complete' : 'timeout');
  }, [me]);

  const apply = useCallback((m: BoardMove) => {
    const game = gameRef.current;
    let mv;
    try { mv = game.move(m); } catch { return false; }
    if (timed) {
      const now = Date.now(); const c = clock.current;
      c[mv.color] = c[mv.color] - (now - c.since) + tc.inc * 1000; c.since = now;
    }
    setFen(game.fen()); setSans(game.history()); setLast({ from: mv.from, to: mv.to }); setHint(null); setNote('');
    playSound(game.inCheck() ? 'check' : mv.captured ? 'capture' : 'move');
    const r = boardResult(game);
    if (r) finish(r);
    return true;
  }, [timed, tc.inc, finish]);

  // Máy đi khi tới lượt
  useEffect(() => {
    if (phase !== 'play' || result || g.turn() !== bot) return;
    const my = gen.current; setThinking(true);
    const wait = setup.level === 1 ? 500 : 250; // để em kịp nhìn nước vừa đi
    const t = setTimeout(() => {
      void ask(g.fen(), setup.level).then((m) => {
        if (gen.current !== my) return;
        setThinking(false);
        if (m) apply(m);
      });
    }, wait);
    return () => clearTimeout(t);
  }, [fen, phase, result, bot, setup.level, ask, apply, g]);

  // Đồng hồ
  useEffect(() => {
    if (phase !== 'play' || !timed || result) return;
    const id = setInterval(() => {
      const c = clock.current; const side = gameRef.current.turn();
      const left = c[side] - (Date.now() - c.since);
      if (left <= 0) { c[side] = 0; c.since = Date.now(); finish(timeoutResult(gameRef.current, side)); }
      force((n) => n + 1);
    }, 100);
    return () => clearInterval(id);
  }, [phase, timed, result, finish]);

  const start = () => {
    gen.current++;
    const color: Color = setup.pick === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : setup.pick;
    gameRef.current = new Chess();
    clock.current = { w: tc.base * 1000, b: tc.base * 1000, since: Date.now() };
    setMe(color); setFlip(false); setFen(gameRef.current.fen()); setSans([]); setLast(null); setResult(null); setShowResult(false); setHint(null); setNote(''); setThinking(false);
    setPhase('play');
  };

  const undo = () => {
    if (timed || thinking) return;
    gen.current++;
    const game = gameRef.current;
    game.undo(); if (game.turn() !== me) game.undo();
    const h = game.history({ verbose: true }); const lm = h[h.length - 1];
    setFen(game.fen()); setSans(game.history()); setLast(lm ? { from: lm.from, to: lm.to } : null); setResult(null); setShowResult(false); setHint(null); setNote('');
  };
  const askHint = () => {
    if (thinking || result || g.turn() !== me) return;
    const my = gen.current; setNote('Đang tìm nước hay…');
    void ask(g.fen(), 3, 900).then((m) => { if (gen.current !== my || !m) return; setHint({ from: m.from, to: m.to }); setNote('Gợi ý: đi theo mũi tên màu cam.'); });
  };
  const offerDraw = () => {
    if (result || thinking) return;
    // Máy đồng ý hòa khi máy đang kém, hoặc ván đã dài mà hai bên ngang nhau
    const e = new Board(g.fen()).evaluate() * (g.turn() === bot ? 1 : -1);
    if (e <= -150 || (sans.length >= 60 && Math.abs(e) < 60)) finish({ winner: null, reason: 'agreement' });
    else setNote('Máy chưa đồng ý hòa. Em cứ đánh tiếp nhé!');
  };
  const resign = () => { if (!result) finish({ winner: bot, reason: 'resign' }); };

  const cap = useMemo(() => captured(new Chess(fen)), [fen]);
  const orientation: Color = flip ? other(me) : me;
  const timeLeft = (c: Color) => { const k = clock.current; return c === g.turn() && !result ? k[c] - (Date.now() - k.since) : k[c]; };
  const levelInfo = BOT_LEVELS.find((l) => l.id === setup.level)!;
  const status = result
    ? (result.winner === null ? `Hòa · ${REASON_TEXT[result.reason]}` : `${result.winner === me ? 'Em thắng' : 'Máy thắng'} · ${REASON_TEXT[result.reason]}`)
    : thinking ? 'Máy đang nghĩ…' : g.turn() === me ? (g.inCheck() ? 'Vua của em đang bị chiếu!' : 'Đến lượt em') : '';

  if (phase === 'setup') {
    return (
      <section className="chs-setup" aria-label="Chuẩn bị ván cờ">
        <div className="chs-setup-card">
          <h2>Chơi với máy</h2>
          <fieldset><legend>Em cầm quân</legend>
            <div className="chs-opts">
              {([['w', 'Trắng', 'Đi trước'], ['b', 'Đen', 'Đi sau'], ['r', 'Ngẫu nhiên', 'Máy chọn giúp']] as const).map(([id, l, n]) => (
                <button key={id} type="button" aria-pressed={setup.pick === id} onClick={() => save({ ...setup, pick: id })}>
                  <span className="chs-opt-ic">{id === 'r' ? <><PieceIcon type="k" color="w" size={26} /><PieceIcon type="k" color="b" size={26} /></> : <PieceIcon type="k" color={id} size={34} />}</span>
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
            <div className="chs-chips">
              {TIME_CONTROLS.map((t) => <button key={t.id} type="button" aria-pressed={setup.tc === t.id} onClick={() => save({ ...setup, tc: t.id })}>{t.label}</button>)}
            </div>
          </fieldset>
          <button type="button" className="btn btn-primary chs-go" onClick={start}><Play aria-hidden="true" /> Bắt đầu ván cờ</button>
        </div>
        <aside className="chs-rules">
          <h3>Luật thi đấu</h3>
          <ul>
            <li>Luật cờ vua quốc tế (FIDE): nhập thành, bắt tốt qua đường, phong cấp.</li>
            <li><b>Thắng</b> khi chiếu hết vua đối phương, đối phương xin thua hoặc hết giờ.</li>
            <li><b>Hòa</b> khi hết nước đi mà không bị chiếu (pat), lặp lại thế cờ 3 lần, 50 nước không ăn quân và không đi tốt, hoặc không đủ quân chiếu hết.</li>
            <li>Có tính giờ thì mỗi nước được cộng thêm vài giây.</li>
          </ul>
        </aside>
      </section>
    );
  }

  const Card = ({ side }: { side: Color }) => {
    const isMe = side === me; const active = !result && g.turn() === side;
    const caps = side === 'w' ? cap.w : cap.b; const adv = side === 'w' ? cap.diff : -cap.diff;
    return (
      <div className={`chs-card${active ? ' is-active' : ''}`}>
        <span className="chs-av" aria-hidden="true">{isMe ? <User /> : <Bot />}</span>
        <div className="chs-who">
          <b>{isMe ? 'Em' : `Máy · ${levelInfo.label}`} <small>({SIDE_NAME[side]})</small></b>
          <span className="chs-caps">{caps.map((t: PieceSymbol, i) => <PieceIcon key={i} type={t} color={other(side)} size={18} />)}{adv > 0 && <em>+{adv}</em>}</span>
        </div>
        {!isMe && thinking && <span className="chs-think" aria-hidden="true"><i /><i /><i /></span>}
        {timed && <span className={`chs-clock${active ? ' is-on' : ''}${timeLeft(side) < 20000 ? ' is-low' : ''}`}>{fmtClock(timeLeft(side))}</span>}
      </div>
    );
  };


  return (
    <section className="chs-play">
      <div className="chs-main">
        <Card side={orientation === 'w' ? 'b' : 'w'} />
        <ChessBoard fen={fen} orientation={orientation} movable={result || thinking ? null : me} lastMove={last} hint={hint} onMove={(m) => { apply(m); }} label={`Bàn cờ, em cầm quân ${SIDE_NAME[me]}`} />
        <Card side={orientation} />
      </div>
      <aside className="chs-side">
        <p className={`chs-status${result ? ' is-end' : ''}`} role="status" aria-live="polite">{status || ' '}</p>
        {note && <p className="chs-note">{note}</p>}
        <MoveList sans={sans} />
        <div className="chs-tools">
          <button type="button" className="btn btn-outline btn-sm" onClick={askHint} disabled={!!result || thinking || g.turn() !== me}><Lightbulb aria-hidden="true" /> Gợi ý</button>
          {!timed && <button type="button" className="btn btn-outline btn-sm" onClick={undo} disabled={thinking || sans.length === 0}><Undo2 aria-hidden="true" /> Đi lại</button>}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setFlip((f) => !f)}><RefreshCcw aria-hidden="true" /> Lật bàn</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={offerDraw} disabled={!!result || thinking}><Handshake aria-hidden="true" /> Xin hòa</button>
          <button type="button" className="btn btn-outline btn-sm is-danger" onClick={resign} disabled={!!result}><Flag aria-hidden="true" /> Xin thua</button>
        </div>
        <div className="chs-tools">
          <button type="button" className="btn btn-primary btn-sm" onClick={start}><RotateCcw aria-hidden="true" /> Ván mới</button>
          <button type="button" className="ct-link" onClick={() => { gen.current++; setPhase('setup'); }}>Đổi cài đặt</button>
        </div>
      </aside>

      {result && showResult && (
        <div className="chs-over" role="dialog" aria-modal="true" aria-label="Kết thúc ván">
          <div className={`chs-over-card ${result.winner === null ? 'is-draw' : result.winner === me ? 'is-win' : 'is-lose'}`}>
            <div className="chs-over-ic" aria-hidden="true">{result.winner === null ? <Handshake /> : <PieceIcon type="k" color={result.winner} size={64} />}</div>
            <h2>{result.winner === null ? 'Hòa cờ' : result.winner === me ? 'Em thắng rồi!' : 'Máy thắng ván này'}</h2>
            <p>{REASON_TEXT[result.reason]} · {Math.ceil(sans.length / 2)} nước</p>
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
