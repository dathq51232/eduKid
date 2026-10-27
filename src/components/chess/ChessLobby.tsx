'use client';

// Sảnh "Đấu với bạn": gửi lời mời cho cả trường hoặc thách riêng một bạn cùng lớp, nhận lời mời của bạn khác,
// xem các ván của mình và bảng điểm của trường (cờ vua hoặc cờ tướng). Tự tải lại vài giây một lần; khi có bạn nhận lời thì tự vào ván.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, Loader2, LogIn, Send, Swords, Trophy, X } from 'lucide-react';
import { PieceIcon } from './ChessPieces';
import { XqDiscIcon } from '@/components/xiangqi/XiangqiBoard';
import type { Variant } from '@/lib/chess/online-rules';
import { ERROR_TEXT, ONLINE_TCS } from '@/lib/chess/online-rules';
import { reasonText } from '@/lib/chess/game';

type Who = { name: string; cls: string };
type Lobby = {
  me: { id: string; name: string; cls: string; rating: number; stats: { games: number; wins: number; draws: number; losses: number } };
  mySeek: { id: string; variant: Variant; base: number; inc: number; color: 'w' | 'b' | 'r'; created_at: string; to: Who | null } | null;
  seeks: { id: string; base: number; inc: number; color: 'w' | 'b' | 'r'; created_at: string; by: Who; personal: boolean }[];
  games: { id: string; color: 'w' | 'b'; opp: Who; status: 'active' | 'finished' | 'aborted'; result: string | null; reason: string | null; base: number; inc: number; ply: number; myTurn: boolean; created_at: string }[];
  top: { rank: number; name: string; cls: string; rating: number; games: number; wins: number; isMe: boolean }[];
  mates: { id: string; name: string; cls: string }[];
};

const tcLabel = (base: number, inc: number) => ONLINE_TCS.find((t) => t.base === base && t.inc === inc)?.label ?? `${base / 60} phút + ${inc} giây`;
const SIDE = { chess: { w: 'Trắng', b: 'Đen' }, xiangqi: { w: 'Đỏ', b: 'Đen' } } as const;
const BASE = { chess: '/co/vua', xiangqi: '/co/tuong' } as const;
const NAME = { chess: 'cờ vua', xiangqi: 'cờ tướng' } as const;
/** Hình quân đại diện cho một bên: Vua cờ vua hoặc Tướng cờ tướng */
function SideIcon({ v, c, size }: { v: Variant; c: 'w' | 'b'; size: number }) {
  return v === 'xiangqi' ? <XqDiscIcon piece={{ side: c === 'w' ? 'r' : 'b', kind: 'k' }} size={size} /> : <PieceIcon type="k" color={c} size={size} />;
}
const initials = (n: string) => n.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() ?? '?';

export default function ChessLobby({ variant = 'chess' }: { variant?: Variant }) {
  const base = BASE[variant]; const loai = variant === 'xiangqi' ? 'tuong' : 'vua'; const SN = SIDE[variant];
  const router = useRouter();
  const [data, setData] = useState<Lobby | null>(null);
  const [err, setErr] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [tc, setTc] = useState(2);
  const [color, setColor] = useState<'w' | 'b' | 'r'>('r');
  const [to, setTo] = useState('');
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/co-vua/sanh?loai=${loai}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? 'server'); return; }
      const d = j as Lobby;
      // Có ván mới đang chơi mà trước đó chưa thấy → bạn vừa nhận lời mời của em: vào ván luôn
      if (known.current) {
        const fresh = d.games.find((g) => g.status === 'active' && !known.current!.has(g.id));
        if (fresh) { router.push(`${base}/van/${fresh.id}`); return; }
      }
      known.current = new Set(d.games.map((g) => g.id));
      setErr(''); setData(d);
    } catch { setErr('offline'); }
  }, [router, base, loai]);

  useEffect(() => {
    void load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 3000);
    return () => clearInterval(id);
  }, [load]);

  const post = async (body: object, key: string) => {
    setBusy(key); setNote('');
    try {
      const res = await fetch('/api/co-vua/sanh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, loai }) });
      const j = await res.json();
      if (!res.ok) { setNote(ERROR_TEXT[j.error] ?? 'Chưa làm được, thử lại nhé.'); return null; }
      return j as { ok: true; gameId?: string };
    } finally { setBusy(''); }
  };
  const sendSeek = async () => { const t = ONLINE_TCS[tc]; if (await post({ action: 'seek', base: t.base, inc: t.inc, color, to: to || undefined }, 'seek')) void load(); };
  const cancel = async () => { if (await post({ action: 'cancel' }, 'cancel')) void load(); };
  const accept = async (id: string) => { const r = await post({ action: 'accept', id }, id); if (r?.gameId) router.push(`${base}/van/${r.gameId}`); else void load(); };

  if (err && !data) {
    const signin = err === 'signed_out';
    return (
      <section className="chl-empty">
        {variant === 'xiangqi' ? <XqDiscIcon piece={{ side: 'r', kind: 'h' }} size={72} /> : <PieceIcon type="n" color="w" size={72} />}
        <h2>{signin ? 'Đăng nhập để đấu với bạn cùng trường' : 'Chưa vào sảnh đấu được'}</h2>
        <p>{signin ? 'Em đăng nhập bằng tài khoản học sinh thầy cô đã cấp. Trong lúc chờ, em có thể luyện với máy.' : ERROR_TEXT[err] ?? 'Mạng chập chờn, đang thử lại…'}</p>
        <div className="chl-empty-act">
          {signin && <Link href={`/dang-nhap?next=${base}/ban`} className="btn btn-primary"><LogIn aria-hidden="true" /> Đăng nhập</Link>}
          <Link href={base} className="btn btn-outline">Chơi với máy</Link>
        </div>
      </section>
    );
  }
  if (!data) return <p className="chl-loading"><Loader2 className="spin" aria-hidden="true" /> Đang vào sảnh…</p>;

  const active = data.games.filter((g) => g.status === 'active');
  const done = data.games.filter((g) => g.status !== 'active').slice(0, 6);
  const st = data.me.stats;

  return (
    <div className="chl">
      <div className="chl-main">
        {active.length > 0 && (
          <section className="chl-card chl-live">
            <h2><Swords aria-hidden="true" /> Ván đang chơi</h2>
            <ul>{active.map((g) => (
              <li key={g.id}>
                <SideIcon v={variant} c={g.color} size={30} />
                <div><b>Em đấu với {g.opp.name}</b><small>{g.opp.cls && `Lớp ${g.opp.cls} · `}{tcLabel(g.base, g.inc)}</small></div>
                {g.myTurn && <span className="chl-badge is-turn">Đến lượt em</span>}
                <Link href={`${base}/van/${g.id}`} className="btn btn-primary btn-sm">Vào ván</Link>
              </li>
            ))}</ul>
          </section>
        )}

        <section className="chl-card">
          <h2><Send aria-hidden="true" /> Mời bạn đấu</h2>
          {data.mySeek ? (
            <div className="chl-wait">
              <span className="chl-pulse" aria-hidden="true">{data.mySeek.variant === 'xiangqi' ? <XqDiscIcon piece={{ side: 'r', kind: 'h' }} size={40} /> : <PieceIcon type="n" color="w" size={40} />}</span>
              <div>
                <b>{data.mySeek.variant !== variant ? `Em đang có lời mời đấu ${NAME[data.mySeek.variant]}. Hủy lời mời đó để mời đấu ${NAME[variant]}.` : data.mySeek.to ? `Đang chờ ${data.mySeek.to.name} nhận lời…` : 'Đang chờ bạn trong trường nhận lời…'}</b>
                <small>{tcLabel(data.mySeek.base, data.mySeek.inc)} · {data.mySeek.color === 'r' ? 'màu ngẫu nhiên' : data.mySeek.color === 'w' ? `em cầm ${SIDE[data.mySeek.variant].w}` : 'em cầm Đen'}</small>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => void cancel()} disabled={busy === 'cancel'}><X aria-hidden="true" /> Hủy lời mời</button>
            </div>
          ) : (
            <>
              <p className="chl-label">Đồng hồ</p>
              <div className="chs-chips">{ONLINE_TCS.map((t, i) => <button key={t.label} type="button" aria-pressed={tc === i} onClick={() => setTc(i)}>{t.label}</button>)}</div>
              <p className="chl-label">Em cầm quân</p>
              <div className="chs-chips">
                {([['w', SN.w], ['b', SN.b], ['r', 'Ngẫu nhiên']] as const).map(([c, l]) => <button key={c} type="button" aria-pressed={color === c} onClick={() => setColor(c)}>{c !== 'r' && <SideIcon v={variant} c={c} size={22} />} {l}</button>)}
              </div>
              <p className="chl-label">Mời ai?</p>
              <select className="chl-select" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Mời ai">
                <option value="">Cả trường (bạn nào nhận trước thì đấu)</option>
                {data.mates.length > 0 && <optgroup label={`Bạn cùng lớp ${data.me.cls}`}>{data.mates.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>}
              </select>
              <button type="button" className="btn btn-primary chl-send" onClick={() => void sendSeek()} disabled={busy === 'seek'}><Send aria-hidden="true" /> {busy === 'seek' ? 'Đang gửi…' : 'Gửi lời mời'}</button>
            </>
          )}
          {note && <p className="chs-note" role="alert">{note}</p>}
        </section>

        <section className="chl-card">
          <h2><Swords aria-hidden="true" /> Lời mời đang chờ <span className="chl-count">{data.seeks.length}</span></h2>
          {data.seeks.length === 0 ? <p className="dash-muted">Chưa có bạn nào mời. Em gửi lời mời trước nhé!</p> : (
            <ul className="chl-seeks">{data.seeks.map((s) => (
              <li key={s.id} className={s.personal ? 'is-personal' : undefined}>
                <span className="chl-av" aria-hidden="true">{initials(s.by.name)}</span>
                <div><b>{s.by.name}{s.by.cls && <small> · {s.by.cls}</small>}</b><small>{tcLabel(s.base, s.inc)} · {s.color === 'r' ? 'Màu ngẫu nhiên' : `Bạn ấy cầm ${SN[s.color]}`}</small></div>
                {s.personal && <span className="chl-badge">Thách em</span>}
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void accept(s.id)} disabled={!!busy}>{busy === s.id ? 'Đang vào…' : 'Nhận lời'}</button>
              </li>
            ))}</ul>
          )}
        </section>
      </div>

      <aside className="chl-side">
        <section className="chl-card chl-me">
          <span className="chl-av is-me" aria-hidden="true">{initials(data.me.name)}</span>
          <div><b>{data.me.name}</b><small>Lớp {data.me.cls}</small></div>
          <div className="chl-elo"><Crown aria-hidden="true" /><b>{data.me.rating}</b><small>điểm</small></div>
          <p className="chl-stats"><span><b>{st.games}</b> ván</span><span className="is-w"><b>{st.wins}</b> thắng</span><span><b>{st.draws}</b> hòa</span><span className="is-l"><b>{st.losses}</b> thua</span></p>
        </section>
        <section className="chl-card">
          <h2><Trophy aria-hidden="true" /> Bảng điểm {NAME[variant]} của trường</h2>
          {data.top.length === 0 ? <p className="dash-muted">Chưa có ván nào được tính điểm.</p> : (
            <ol className="chl-top">{data.top.map((t) => <li key={t.rank} className={t.isMe ? 'is-me' : undefined}><span>{t.rank}</span><b>{t.name}{t.cls && <small> · {t.cls}</small>}</b><em>{t.rating}</em></li>)}</ol>
          )}
          <p className="chl-hint">Thắng bạn có điểm cao hơn được cộng nhiều điểm hơn. Mọi em bắt đầu từ 1000 điểm.</p>
        </section>
        {done.length > 0 && (
          <section className="chl-card">
            <h2>Ván gần đây</h2>
            <ul className="chl-done">{done.map((g) => {
              const win = (g.result === '1-0' && g.color === 'w') || (g.result === '0-1' && g.color === 'b');
              const draw = g.result === '1/2-1/2';
              return (
                <li key={g.id}>
                  <span className={`chl-res ${g.status === 'aborted' ? 'is-x' : win ? 'is-w' : draw ? 'is-d' : 'is-l'}`}>{g.status === 'aborted' ? 'Hủy' : win ? 'Thắng' : draw ? 'Hòa' : 'Thua'}</span>
                  <Link href={`${base}/van/${g.id}`}>với {g.opp.name}</Link>
                  <small>{reasonText(g.reason, variant)}</small>
                </li>
              );
            })}</ul>
          </section>
        )}
      </aside>
    </div>
  );
}
