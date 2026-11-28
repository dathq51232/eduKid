'use client';

// ĐẤU CẶP trong PHÒNG THI LỚP — phần của cô (migration 0073, docs/BAN-SAC-EDUCHAINKIDS.md mục 8.2).
// Mỗi vòng là một phòng thi (mã riêng, giờ mở – đóng); các em làm lúc nào cũng được trong giờ mở.
// Ở đây: sơ đồ nhánh từng vòng (kết quả từng cặp, ai thắng, vì sao), xử thắng cặp chưa phân định, bốc thăm mở vòng sau
// (máy cô sinh đề mới, khó hơn, từ cùng các bài), kết thúc. Tự tải lại mỗi 20 giây khi đang mở trang.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Crown, Gavel, Lock, Presentation, RefreshCw, Search, Shuffle, Trash2, X } from 'lucide-react';
import BattleShow from './BattleShow';
import { fold } from '@/lib/classroom/teacher-nav';
import { SUBJECT_NAME } from '@/lib/classroom/assignments';
import type { Matrix } from '@/lib/exams/matrix';
import { battleSets } from '@/lib/classroom/battle-build';
import { toLocalInput, whenLabel } from '@/lib/classroom/rooms';
import { REASON_LABEL, battleError, fmtMs, roundName, type WinReason } from '@/lib/classroom/battle';
import type { SubjectCode } from '@/lib/types';
import { unitIcon } from '@/lib/classroom/unit-icons';
import '@/styles/bt.css';

type R = { correct: number; ms: number | null } | null;
type Pair = { id: string; a: string; b: string | null; aName: string; bName: string | null; winner: string | null; reason: WinReason | null; ra: R; rb: R };
type Round = { round: number; room: { id: string; code: string; opens: string; closes: string; status: string } | null; pairs: Pair[] };
export type BattleView = {
  id: string; title: string; subject: SubjectCode; status: 'playing' | 'done' | 'closed'; round: number; minutes: number;
  plan: Partial<Matrix>; created_at: string; championName: string | null; rounds: Round[];
};

type Show = 'all' | 'wait' | 'done';
const STATUS: Record<string, string> = { playing: 'Đang đấu', done: 'Đã có vô địch', closed: 'Đã kết thúc' };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json' } });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(battleError((d as { error?: string }).error ?? ''));
  return d as T;
}

function endOfDay() { const d = new Date(); d.setHours(21, 0, 0, 0); if (d.getTime() < Date.now() + 30 * 60_000) d.setTime(Date.now() + 2 * 3600_000); return d; }

export default function BattlePanel({ classId, grade, refresh, onChanged }: { classId: string; grade: number; refresh: number; onChanged: () => void }) {
  const [list, setList] = useState<BattleView[] | null>(null);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const last = useRef('');
  const strip = useRef<HTMLDivElement>(null);
  const apply = useCallback((bs: BattleView[]) => { const j = JSON.stringify(bs); if (j !== last.current) { last.current = j; setList(bs); } }, []);
  const load = useCallback(async () => {
    try { apply((await api<{ battles: BattleView[] }>(`/api/giao-vien/dau-cap?classId=${classId}`)).battles); setErr(''); }
    catch (e) { setErr((e as Error).message); setList((l) => l ?? []); }
  }, [classId, apply]);
  useEffect(() => { void load(); }, [load, refresh]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 20_000);
    return () => clearInterval(t);
  }, [load]);

  const [busy, setBusy] = useState(false);
  /** Xoá đấu cặp đã kết thúc (kèm các phòng thi từng vòng) — một hoặc nhiều */
  const remove = async (ids: string[], ask: string) => {
    if (!ids.length || !window.confirm(ask)) return;
    setBusy(true); setErr('');
    try {
      for (const id of ids) await api(`/api/giao-vien/dau-cap/${id}`, { method: 'DELETE' });
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); setSel((x) => (x && ids.includes(x) ? null : x)); await load(); onChanged(); }
  };

  if (list === null) return null;
  if (!list.length && !err) return null;
  // Dải thẻ (đang đấu xếp trước); thẻ đang chọn — mặc định đấu cặp đang diễn ra đầu tiên — mở chi tiết ngay dưới dải. '' = cô đã thu gọn.
  const sorted = [...list].sort((a, b) => Number(b.status === 'playing') - Number(a.status === 'playing'));
  const ended = list.filter((b) => b.status !== 'playing');
  const curId = sel ?? sorted.find((b) => b.status === 'playing')?.id ?? null;
  const cur = list.find((b) => b.id === curId) ?? null;
  const slide = (dir: number) => { const el = strip.current; if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' }); };
  const short = (b: BattleView) => b.title.replace(/^Đấu cặp\s+.*?\s+–\s+/u, '');

  return (
    <section className="room-sec bt-panel" aria-labelledby="bt-h">
      <header className="room-sec-head">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh 3D nhỏ đã tối ưu sẵn (webp) */}
        <img src="/emoji/hd/trophy.webp" width={34} height={34} style={{ width: 34, height: 34 }} alt="" aria-hidden="true" className="ic3d" decoding="async" />
        <h2 id="bt-h">Đấu cặp của lớp</h2>
        <span className="room-sec-n">{list.length - ended.length} đang đấu · {ended.length} đã kết thúc</span>
        {ended.length > 1 && (
          <button type="button" className="mini-btn is-danger room-sec-act" disabled={busy}
            onClick={() => void remove(ended.map((b) => b.id), `Xoá cả ${ended.length} đấu cặp đã kết thúc? Phòng thi các vòng và bài làm trong đó cũng bị xoá, không hoàn tác được.`)}>
            <Trash2 aria-hidden="true" /> {busy ? 'Đang xoá…' : `Xoá ${ended.length} đấu cặp đã kết thúc`}
          </button>
        )}
      </header>
      {err && <p className="adm-alert is-error" role="alert">{err}</p>}
      <div className="bt-strip-wrap">
        <button type="button" className="bt-strip-nav is-prev" onClick={() => slide(-1)} aria-label="Xem đấu cặp trước"><ChevronLeft aria-hidden="true" /></button>
        <div className="bt-strip" ref={strip} role="list">
          {sorted.map((b) => (
            <div key={b.id} role="listitem" className={`bt-tile is-${b.status}${b.id === curId ? ' is-sel' : ''}`}>
              <button type="button" className="bt-tile-main" aria-pressed={b.id === curId} onClick={() => setSel(b.id === curId ? '' : b.id)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh 3D nhỏ đã tối ưu sẵn (webp) */}
                <img src={unitIcon(short(b), b.subject)} width={44} height={44} alt="" aria-hidden="true" className="ic3d bt-tile-ic" decoding="async" loading="lazy" />
                <span className="bt-tile-txt">
                  <b>Đấu cặp {SUBJECT_NAME[b.subject]}</b>
                  <span>{short(b)}</span>
                  <em className={`bt-st is-${b.status}`}>{b.championName ? <><Crown aria-hidden="true" /> {b.championName}</> : STATUS[b.status]}</em>
                </span>
              </button>
              {b.status !== 'playing' && (
                <button type="button" className="bt-tile-del" disabled={busy} aria-label={`Xoá đấu cặp ${b.title}`} title="Xoá đấu cặp"
                  onClick={() => void remove([b.id], `Xoá đấu cặp “${b.title}”? Phòng thi các vòng và bài làm trong đó cũng bị xoá, không hoàn tác được.`)}>
                  <Trash2 aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="bt-strip-nav is-next" onClick={() => slide(1)} aria-label="Xem đấu cặp sau"><ChevronRight aria-hidden="true" /></button>
      </div>
      {cur && (
        <BattleCard key={cur.id} b={cur} grade={grade} reload={load}
          onUpdate={(v) => { apply(list.map((x) => (x.id === v.id ? v : x))); onChanged(); }} />
      )}
    </section>
  );
}

function BattleCard({ b, grade, onUpdate, reload }: { b: BattleView; grade: number; onUpdate: (v: BattleView) => void; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [closes, setCloses] = useState(() => toLocalInput(endOfDay()));
  const [open, setOpen] = useState(true);
  const [showing, setShowing] = useState(false); // màn chiếu lên bảng (BattleShow)
  const cur = b.rounds.find((r) => r.round === b.round);
  const winners = useMemo(() => (cur?.pairs ?? []).filter((p) => p.winner).length, [cur]);
  const roundDone = !!cur && cur.pairs.every((p) => p.winner);
  const canNext = b.status === 'playing' && roundDone && winners >= 2;
  // Mỗi vòng là một mục thu gọn (mặc định chỉ mở vòng đang đấu); ô tìm theo tên (không dấu cũng được) + lọc trạng thái cặp
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('all');
  const [openRounds, setOpenRounds] = useState<Set<number>>(() => new Set([b.round]));
  useEffect(() => { setOpenRounds((s) => (s.has(b.round) ? s : new Set(s).add(b.round))); }, [b.round]);
  const toggleRound = (n: number) => setOpenRounds((s) => { const t = new Set(s); if (t.has(n)) t.delete(n); else t.add(n); return t; });
  const key = fold(q);
  const match = (p: Pair) => (show === 'all' || (show === 'done') === !!p.winner)
    && (!key || fold(p.aName).includes(key) || fold(p.bName ?? '').includes(key));

  const post = async (body: object, label: string) => {
    setBusy(label); setErr('');
    try {
      const v = await api<{ battles: BattleView[] }>(`/api/giao-vien/dau-cap/${b.id}`, { method: 'POST', body: JSON.stringify(body) });
      if (v.battles?.[0]) onUpdate(v.battles[0]); else await reload();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(''); }
  };
  const next = () => {
    const c = new Date(closes);
    if (Number.isNaN(c.getTime()) || c.getTime() <= Date.now()) { setErr('Giờ đóng của vòng mới phải sau bây giờ.'); return; }
    const sets = battleSets(b.plan, b.subject, grade, winners, Math.floor(winners / 2));
    if (!sets) { setErr(battleError('bad_sets')); return; }
    void post({ action: 'next', sets, opens: new Date().toISOString(), closes: c.toISOString() }, 'next');
  };
  const force = (p: Pair, sid: string, name: string) => { if (window.confirm(`Xử ${name} thắng cặp này?`)) void post({ action: 'force', pairId: p.id, winner: sid }, p.id); };

  return (
    <article className={`bt-battle is-${b.status}`}>
      <header className="bt-battle-head">
        <button type="button" className="bt-battle-title" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <b>{b.title}</b>
          <span>{SUBJECT_NAME[b.subject]} · {b.minutes} phút/vòng · vòng {b.round}</span>
        </button>
        <em className={`bt-st is-${b.status}`}>{STATUS[b.status]}</em>
        <button type="button" className="btn btn-outline btn-sm bt-show-btn" onClick={() => setShowing(true)}><Presentation aria-hidden="true" /> Chiếu lên bảng</button>
      </header>
      {showing && <BattleShow b={b} onClose={() => setShowing(false)} onRefresh={() => void reload()} />}
      {b.championName && <p className="bt-champ"><Crown aria-hidden="true" /> Nhà vô địch: <b>{b.championName}</b> 🎉</p>}
      {open && (
        <>
          <div className="bt-tools">
            <label className="bt-search">
              <Search aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên em…" aria-label="Tìm em trong đấu cặp" />
              {q && <button type="button" onClick={() => setQ('')} aria-label="Xoá ô tìm"><X aria-hidden="true" /></button>}
            </label>
            <select value={show} onChange={(e) => setShow(e.target.value as Show)} aria-label="Lọc cặp đấu">
              <option value="all">Tất cả cặp</option>
              <option value="wait">Chưa phân định</option>
              <option value="done">Đã phân định</option>
            </select>
          </div>
          <div className="bt-rounds" aria-label="Sơ đồ nhánh">
            {[...b.rounds].reverse().map((r) => {
              const alive = r.pairs.reduce((n, p) => n + (p.b ? 2 : 1), 0);
              const decided = r.pairs.filter((p) => p.winner).length;
              const pairs = r.pairs.filter(match);
              const filtering = !!key || show !== 'all';
              if (filtering && !pairs.length) return null;
              const isOpen = filtering || openRounds.has(r.round);
              return (
                <section key={r.round} className={`bt-round${isOpen ? ' is-open' : ''}`}>
                  <button type="button" className="bt-round-head" aria-expanded={isOpen} disabled={filtering} onClick={() => toggleRound(r.round)}>
                    <ChevronDown aria-hidden="true" className="bt-chev" />
                    <b>Vòng {r.round} · {roundName(alive)}</b>
                    <span className="bt-round-meta">
                      {r.room && <>Mã <code>{r.room.code}</code> · đóng {whenLabel(r.room.closes)} · </>}
                      {filtering ? `${pairs.length} cặp khớp` : `${decided}/${r.pairs.length} cặp đã phân định`}
                    </span>
                  </button>
                  {isOpen && (
                    <ol className="bt-pairs">
                      {pairs.map((p) => (
                        <li key={p.id} className={`bt-match${p.winner ? ' is-done' : ' is-playing'}`}>
                          {!p.b ? <p className="bt-line is-win"><span>{p.aName}</span><em>🎟️ vé đi tiếp</em></p> : (
                            <>
                              <Line name={p.aName} r={p.ra} win={p.winner === p.a} done={!!p.winner} />
                              <Line name={p.bName ?? ''} r={p.rb} win={p.winner === p.b} done={!!p.winner} />
                              {p.reason && <small className="bt-why">{REASON_LABEL[p.reason]}</small>}
                              {!p.winner && r.round === b.round && b.status === 'playing' && (
                                <div className="bt-match-tools">
                                  <button type="button" className="mini-btn" disabled={!!busy} onClick={() => force(p, p.a, p.aName)}><Gavel aria-hidden="true" /> {p.aName.split(' ').pop()} thắng</button>
                                  <button type="button" className="mini-btn" disabled={!!busy} onClick={() => force(p, p.b!, p.bName ?? '')}><Gavel aria-hidden="true" /> {(p.bName ?? '').split(' ').pop()} thắng</button>
                                </div>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              );
            })}
            {(!!key || show !== 'all') && !b.rounds.some((r) => r.pairs.some(match)) && <p className="dash-muted">Không có cặp nào khớp.</p>}
          </div>
          {b.status === 'playing' && (
            <div className="bt-next">
              {canNext ? (
                <>
                  <label className="adm-field"><span>Vòng {b.round + 1} đóng lúc</span><input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} /></label>
                  <button type="button" className="btn btn-yellow" disabled={!!busy} onClick={next}>
                    <Shuffle aria-hidden="true" /> {busy === 'next' ? 'Đang bốc thăm…' : `Bốc thăm & mở vòng ${b.round + 1} · ${roundName(winners)} (${winners} em)`}
                  </button>
                </>
              ) : !roundDone ? (
                <p className="dash-muted">Vòng {b.round}: {cur?.pairs.filter((p) => p.winner).length ?? 0}/{cur?.pairs.length ?? 0} cặp đã phân định. Cặp tự phân định khi cả hai em nộp bài; hết giờ phòng mà một em chưa làm thì bạn kia thắng. Cả hai không làm: cô bấm xử thắng.</p>
              ) : null}
              <button type="button" className="mini-btn" disabled={!!busy} onClick={() => void reload()}><RefreshCw aria-hidden="true" /> Làm mới</button>
              <button type="button" className="mini-btn" disabled={!!busy} onClick={() => { if (window.confirm('Kết thúc đấu cặp này? Không mở được vòng sau nữa.')) void post({ action: 'close' }, 'close'); }}><Lock aria-hidden="true" /> Kết thúc</button>
            </div>
          )}
          {err && <p className="adm-alert is-error" role="alert">{err}</p>}
        </>
      )}
    </article>
  );
}

function Line({ name, r, win, done }: { name: string; r: R; win: boolean; done: boolean }) {
  return (
    <p className={`bt-line${done ? (win ? ' is-win' : ' is-stop') : ''}`}>
      <span>{win && '🏅 '}{name}</span>
      <em>{r ? `${r.correct} câu · ${fmtMs(r.ms)}` : 'chưa nộp'}</em>
    </p>
  );
}
