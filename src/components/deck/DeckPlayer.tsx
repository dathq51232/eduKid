'use client';

// Trình chiếu bài thao giảng (11/2026).
//  - Màn hình của cô (mặc định): trang đang chiếu, trang tiếp theo, ghi chú, đồng hồ, công cụ lớp (bút vẽ, đèn chiếu,
//    che màn, gọi tên, đếm ngược, cộng sao).
//  - Màn hình chiếu (?man=chieu): cửa sổ riêng để kéo sang tivi / máy chiếu, đồng bộ với máy cô qua BroadcastChannel.
/* eslint-disable @next/next/no-img-element -- biểu tượng công cụ nhỏ có sẵn trong dự án */
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, MonitorUp, Volume2 } from 'lucide-react';
import { listAssets, type TeacherAsset } from '@/lib/assets/client';
import { SH, SW, type Deck } from '@/lib/deck/types';
import { loadPraiseFonts } from '@/lib/praise/render';
import { transFrames } from '@/lib/deck/player';
import { getVolume, playSound, setVolume, stopSounds } from '@/lib/deck/sounds';
import { createClient } from '@/lib/supabase/client';
import { SOURCE, TEAM_COLORS, normalizeTeams, teamTotals, vnDay, weekOf, type Point, type TeamsState } from '@/lib/classroom/class-tools';
import SlideView, { SlideFrame, type BoardTeam, type PlayAction, type PlayApi } from './SlideView';

type Tool = '' | 'pen' | 'spot';
type Stroke = { c: string; p: number[] };
type Show = { slide: number; step: number; nonce: number; black: '' | 'black' | 'white'; spot: [number, number] | null; ink: Record<number, Stroke[]>; name: string | null; timer: number | null; stars: number;
  /** thi đua tổ: điểm tuần này của các tổ (null = lớp chưa có tổ) và câu hỏi "cộng cho tổ nào?" đang hiện */
  teams: BoardTeam[] | null; ask: string | null; bump: number | null };
type Msg =
  | { type: 'hello' }
  | { type: 'state'; s: Show }
  | { type: 'act'; slide: number; a: PlayAction }
  | { type: 'cmd'; c: 'next' | 'prev' };

const INK = ['#ef4444', '#2563eb', '#16a34a', '#f59e0b', '#111827', '#ffffff'];
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function DeckPlayer({ classId, deckId, deck, students, start = 0, audience = false }: {
  classId: string; deckId: string; deck: Deck; students: { id: string; name: string }[]; start?: number; audience?: boolean;
}) {
  const n = deck.slides.length;
  const [show, setShow] = useState<Show>({ slide: Math.min(Math.max(0, start), n - 1), step: 0, nonce: 0, black: '', spot: null, ink: {}, name: null, timer: null, stars: 0, teams: null, ask: null, bump: null });
  const [tool, setTool] = useState<Tool>('');
  const [color, setColor] = useState(INK[0]);
  const [mine, setMine] = useState<TeacherAsset[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [t0, setT0] = useState(() => Date.now());
  const [vol, setVol] = useState(getVolume());
  const [left, setLeft] = useState(0);
  const api = useRef<PlayApi>(null);
  const ch = useRef<BroadcastChannel | null>(null);
  const showRef = useRef(show); showRef.current = show;
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drawing = useRef<Stroke | null>(null);
  const [, force] = useState(0);
  const slide = deck.slides[show.slide];

  useEffect(() => { void listAssets(['image', 'audio']).then(setMine, () => setMine([])); }, []);
  useEffect(() => { void loadPraiseFonts(); }, []); // phông chữ tròn / chữ viết tay dùng trên trang
  const urls = useMemo(() => new Map(mine.filter((a) => a.url).map((a) => [a.path, a.url!])), [mine]);
  const assetUrl = useCallback((p: string) => urls.get(p), [urls]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  useEffect(() => () => stopSounds(), []);

  /* ---------- đồng bộ hai cửa sổ ---------- */
  const send = useCallback((m: Msg) => { try { ch.current?.postMessage(m); } catch { /* bỏ qua */ } }, []);
  const publish = useCallback((s: Show) => { setShow(s); showRef.current = s; send({ type: 'state', s }); }, [send]);
  const nextRef = useRef<() => void>(() => {});
  const prevRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const c = new BroadcastChannel(`edukid-deck-${deckId}`);
    ch.current = c;
    c.onmessage = (ev: MessageEvent<Msg>) => {
      const m = ev.data;
      if (m.type === 'hello' && !audience) send({ type: 'state', s: showRef.current });
      if (m.type === 'state' && audience) {
        const cur = showRef.current;
        setShow(m.s); showRef.current = m.s;
        if (m.s.slide !== cur.slide || m.s.nonce !== cur.nonce) return; // trang mới: SlideView dựng lại với bước m.s.step
        // cùng trang, bước tăng (phòng khi lỡ tin "act")
        for (let i = api.current?.stepIndex() ?? m.s.step; i < m.s.step; i++) api.current?.apply({ t: 'step' });
      }
      if (m.type === 'act' && m.slide === showRef.current.slide) {
        if (m.a.t === 'step' && audience) { api.current?.apply(m.a); return; }
        if (m.a.t !== 'step') api.current?.apply(m.a);
      }
      if (m.type === 'cmd' && !audience) { if (m.c === 'next') nextRef.current(); else prevRef.current(); }
    };
    if (audience) c.postMessage({ type: 'hello' } satisfies Msg);
    return () => { c.close(); ch.current = null; };
  }, [deckId, audience, send]);

  /* ---------- chuyển bước / trang ---------- */
  const animateIn = useCallback((i: number) => {
    const f = transFrames(deck.slides[i]?.trans ?? 'none');
    if (f) frameRef.current?.animate(f, { duration: 550, easing: 'cubic-bezier(.2,.8,.3,1)' });
  }, [deck.slides]);
  const go = useCallback((i: number, step = 0) => {
    if (i < 0 || i >= n) return;
    stopSounds();
    publish({ ...showRef.current, slide: i, step, nonce: showRef.current.nonce + 1, spot: null });
    requestAnimationFrame(() => animateIn(i));
  }, [n, publish, animateIn]);
  const next = useCallback(() => {
    if (audience) { send({ type: 'cmd', c: 'next' }); return; }
    if (api.current?.apply({ t: 'step' })) {
      const s = { ...showRef.current, step: showRef.current.step + 1 };
      setShow(s); showRef.current = s;
      send({ type: 'act', slide: s.slide, a: { t: 'step' } }); send({ type: 'state', s });
      setLeft(api.current.stepsLeft());
      return;
    }
    if (showRef.current.slide < n - 1) go(showRef.current.slide + 1);
  }, [audience, send, n, go]);
  const prev = useCallback(() => {
    if (audience) { send({ type: 'cmd', c: 'prev' }); return; }
    if (showRef.current.slide > 0) go(showRef.current.slide - 1, 999);
  }, [audience, send, go]);
  nextRef.current = next; prevRef.current = prev;
  useEffect(() => { const t = setTimeout(() => setLeft(api.current?.stepsLeft() ?? 0), 50); return () => clearTimeout(t); }, [show.slide, show.nonce]);

  const onAction = (a: PlayAction) => { send({ type: 'act', slide: showRef.current.slide, a }); setLeft(api.current?.stepsLeft() ?? 0); };

  /* ---------- phím tắt ---------- */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if ([' ', 'ArrowRight', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
      else if (!audience && e.key.toLowerCase() === 'b') publish({ ...showRef.current, black: showRef.current.black === 'black' ? '' : 'black' });
      else if (!audience && e.key.toLowerCase() === 'w') publish({ ...showRef.current, black: showRef.current.black === 'white' ? '' : 'white' });
      else if (e.key === 'Escape') setTool('');
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [next, prev, publish, audience]);

  /* ---------- bút vẽ / đèn chiếu ---------- */
  const toSlide = (e: { clientX: number; clientY: number }) => {
    const r = stageRef.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * SW), Math.round(((e.clientY - r.top) / r.height) * SH)] as [number, number];
  };
  const spotRaf = useRef(0);
  const onOvDown = (e: React.PointerEvent) => {
    if (tool !== 'pen') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = { c: color, p: toSlide(e) }; force((x) => x + 1);
  };
  const onOvMove = (e: React.PointerEvent) => {
    if (tool === 'spot') {
      const p = toSlide(e);
      cancelAnimationFrame(spotRaf.current);
      spotRaf.current = requestAnimationFrame(() => publish({ ...showRef.current, spot: p }));
      return;
    }
    const d = drawing.current; if (!d) return;
    const [x, y] = toSlide(e); d.p.push(x, y); force((v) => v + 1);
  };
  const onOvUp = () => {
    const d = drawing.current; drawing.current = null;
    if (!d || d.p.length < 4) { force((v) => v + 1); return; }
    const s = showRef.current, list = [...(s.ink[s.slide] ?? []), d];
    publish({ ...s, ink: { ...s.ink, [s.slide]: list } });
  };
  const pathOf = (p: number[]) => p.reduce((a, v, i) => a + (i % 2 ? `${v} ` : `${i ? 'L' : 'M'}${v} `), '');

  /* ---------- công cụ lớp ---------- */
  const callName = () => {
    if (!students.length) { publish({ ...showRef.current, name: 'Lớp chưa có học sinh' }); return; }
    playSound('drum');
    const pick = students[Math.floor(Math.random() * students.length)].name;
    let k = 0;
    const roll = setInterval(() => {
      k++;
      publish({ ...showRef.current, name: students[Math.floor(Math.random() * students.length)].name });
      if (k >= 12) { clearInterval(roll); publish({ ...showRef.current, name: `★ ${pick}` }); playSound('tada'); }
    }, 90);
  };
  const timerLeft = show.timer ? Math.max(0, Math.ceil((show.timer - now) / 1000)) : 0;
  const rang = useRef<number | null>(null);
  useEffect(() => { if (!audience && show.timer && timerLeft === 0 && rang.current !== show.timer) { rang.current = show.timer; playSound('bell'); } }, [timerLeft, show.timer, audience]);
  /* ---------- thi đua tổ (điểm lưu vào Thi đua tổ của lớp, lý do ghi nguồn "📽 Thao giảng") ---------- */
  const [tErr, setTErr] = useState('');
  useEffect(() => {
    if (audience) return;
    let off = false;
    void (async () => {
      try {
        const sb = createClient();
        const wk = weekOf(vnDay());
        const [t, p] = await Promise.all([sb.rpc('teacher_tool_get', { p_class: classId, p_tool: 'teams' }), sb.rpc('teacher_team_points', { p_class: classId, p_from: wk.from, p_to: wk.to })]);
        if (off || t.error || !t.data) return;
        const ts = normalizeTeams(t.data as Partial<TeamsState>, students);
        const { total } = teamTotals((p.data ?? []) as Point[], ts.teams.length);
        publish({ ...showRef.current, teams: ts.teams.map((x, i) => ({ name: x.name, emoji: x.emoji, color: TEAM_COLORS[i % TEAM_COLORS.length], score: total[i] ?? 0 })) });
      } catch { /* chưa có tổ: dùng Cộng sao như cũ */ }
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience, classId]);
  const award = async (i: number, delta: 1 | -1, why: string) => {
    const cur = showRef.current; if (!cur.teams) return;
    playSound(delta > 0 ? 'star' : 'wrong');
    publish({ ...cur, ask: null, bump: delta > 0 ? i : null, teams: cur.teams.map((t, k) => (k === i ? { ...t, score: t.score + delta } : t)) });
    window.setTimeout(() => { if (showRef.current.bump === i) publish({ ...showRef.current, bump: null }); }, 1200);
    const reason = `${SOURCE.tg.prefix}${why} · ${deck.title}`.slice(0, 80);
    const { error } = await createClient().rpc('teacher_team_point', { p_class: classId, p_team: i + 1, p_delta: delta, p_reason: reason });
    if (error) { setTErr('Chưa lưu được điểm tổ (kiểm tra mạng).'); publish({ ...showRef.current, teams: (showRef.current.teams ?? []).map((t, k) => (k === i ? { ...t, score: t.score - delta } : t)) }); }
  };
  const onWin = (what: string) => { if (!audience && showRef.current.teams) publish({ ...showRef.current, ask: what }); };
  const addStar = () => { playSound('star'); publish({ ...showRef.current, stars: showRef.current.stars + 1 }); };

  const openAudience = () => {
    const u = `/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${deckId}/trinh-chieu?man=chieu&trang=${show.slide + 1}`;
    window.open(u, `edukid-chieu-${deckId}`, 'popup,width=1280,height=760');
  };
  const fullStage = () => { const el = audience ? document.documentElement : stageRef.current?.closest('.dp-stagebox'); if (document.fullscreenElement) void document.exitFullscreen(); else void (el as HTMLElement | null)?.requestFullscreen?.(); };

  /* ---------- trang đang chiếu (dùng chung 2 chế độ) ---------- */
  const strokes = show.ink[show.slide] ?? [];
  const stage = (
    <div className="dp-stagebox">
      <SlideFrame className="dp-frame">{(k) => (
        <div className="dp-stage" ref={(el) => { stageRef.current = el; frameRef.current = el; }} style={{ width: SW * k, height: SH * k }}>
          <SlideView key={`${slide.id}-${show.nonce}`} ref={api} slide={slide} mode="play" scale={k} assetUrl={assetUrl} startStep={show.step}
            onAction={onAction} onLink={(i) => { if (!audience) go(i - 1); }} onWin={onWin} board={show.teams ?? undefined} />
          <svg className={`dp-ink${tool === 'pen' || tool === 'spot' ? ' is-on' : ''}`} viewBox={`0 0 ${SW} ${SH}`} style={{ cursor: tool === 'pen' ? 'crosshair' : tool === 'spot' ? 'none' : undefined }}
            onPointerDown={onOvDown} onPointerMove={onOvMove} onPointerUp={onOvUp} onPointerLeave={() => { if (tool === 'spot') publish({ ...showRef.current, spot: null }); }}>
            {[...strokes, ...(drawing.current ? [drawing.current] : [])].map((s, i) => <path key={i} d={pathOf(s.p)} fill="none" stroke={s.c} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />)}
          </svg>
          {show.spot && <div className="dp-spot" style={{ background: `radial-gradient(circle at ${(show.spot[0] / SW) * 100}% ${(show.spot[1] / SH) * 100}%, transparent 0, transparent ${150 * k}px, rgba(0,0,0,.78) ${170 * k}px)` }} />}
          {show.black && <div className={`dp-black is-${show.black}`} />}
          {show.name && <button type="button" className="dp-name" onClick={() => { if (!audience) publish({ ...showRef.current, name: null }); }}><small>Mời bạn</small><b>{show.name.replace('★ ', '')}</b>{show.name.startsWith('★') && <span>🎉</span>}</button>}
          {show.timer && <div className={`dp-timer${timerLeft <= 10 ? ' is-low' : ''}`}>⏱ {fmt(timerLeft)}</div>}
          {show.stars > 0 && <div className="dp-stars">⭐ × {show.stars}</div>}
          {show.teams && !slide.els.some((e) => e.kind === 'teams') && <div className="dp-tstrip">{show.teams.map((t, i) => <b key={i} className={show.bump === i ? 'is-bump' : ''} style={{ background: t.color }}>{t.emoji} {t.name} · {t.score}</b>)}</div>}
          {show.teams && show.ask && (
            <div className="dp-ask"><p>🎉 {show.ask}! Cộng điểm cho tổ nào?</p>
              <div>{show.teams.map((t, i) => <button key={i} type="button" disabled={audience} style={{ background: t.color }} onClick={() => void award(i, 1, `Trang ${show.slide + 1}: ${show.ask}`)}>{t.emoji} {t.name}</button>)}
                <button type="button" className="is-skip" disabled={audience} onClick={() => publish({ ...showRef.current, ask: null })}>Bỏ qua</button></div>
            </div>
          )}
        </div>
      )}</SlideFrame>
      {!audience && <div className="dp-float"><button type="button" onClick={prev} aria-label="Lùi">◀</button><span>{show.slide + 1}/{n}</span><button type="button" onClick={next} aria-label="Tiếp">▶</button></div>}
    </div>
  );

  if (audience) {
    return (
      <div className="dp-aud" onDoubleClick={fullStage}>
        {stage}
        <p className="dp-aud-hint">Nháy đúp để toàn màn hình · phím cách / mũi tên để chuyển trang</p>
      </div>
    );
  }

  const nextSlide = deck.slides[show.slide + 1];
  return (
    <div className="dp">
      <header className="dp-top">
        <Link href={`/giao-vien/lop/${classId}/bai-giang-3d/thao-giang/${deckId}`} className="dp-exit"><ArrowLeft aria-hidden="true" /> Thoát</Link>
        <b className="dp-title">▶ {deck.title}</b>
        <span className="dp-pg">Trang {show.slide + 1} / {n}{left > 0 ? ` · còn ${left} hiệu ứng` : ''}</span>
        <button type="button" className="dp-btn is-main" onClick={openAudience}><MonitorUp aria-hidden="true" /> Mở màn hình chiếu</button>
        <button type="button" className="dp-btn" onClick={fullStage}><Expand aria-hidden="true" /> Toàn màn hình trang</button>
        <label className="dp-vol"><Volume2 aria-hidden="true" /><input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => { setVol(Number(e.target.value)); setVolume(Number(e.target.value)); }} aria-label="Âm lượng" /></label>
        <button type="button" className="dp-clock" onClick={() => setT0(Date.now())} title="Bấm để đặt lại đồng hồ">{fmt((now - t0) / 1000)}</button>
      </header>
      <div className="dp-main">
        {stage}
        <aside className="dp-side">
          <section className="dp-card"><h4>Trang tiếp theo</h4>
            {nextSlide ? <button type="button" className="dp-next" onClick={() => go(show.slide + 1)}><SlideFrame>{(k) => <SlideView slide={nextSlide} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame></button> : <p className="dp-muted">Đây là trang cuối.</p>}
          </section>
          <section className="dp-card"><h4>Ghi chú của cô</h4>
            <p className="dp-notes">{slide.notes || <span className="dp-muted">Trang này chưa có ghi chú.</span>}</p>
            {slide.anims.some((a) => a.trigger) && <p className="dp-trg">🎯 Trang có hiệu ứng chờ bấm vào vật (vật có viền vàng nhấp nháy).</p>}
          </section>
          {show.teams && (
            <section className="dp-card"><h4>Thi đua tổ <small>· lưu vào Thi đua tổ của lớp</small></h4>
              <div className="dp-teams">{show.teams.map((t, i) => (
                <div key={i} style={{ background: t.color }}>
                  <span>{t.emoji} {t.name}</span><b>{t.score}</b>
                  <button type="button" aria-label={`Trừ 1 điểm ${t.name}`} onClick={() => void award(i, -1, `Trang ${show.slide + 1}`)}>−</button>
                  <button type="button" aria-label={`Cộng 1 điểm ${t.name}`} onClick={() => void award(i, 1, `Trang ${show.slide + 1}`)}>+1</button>
                </div>
              ))}</div>
              {tErr && <p className="dp-trg">{tErr}</p>}
            </section>
          )}
          <section className="dp-card"><h4>Công cụ trên lớp</h4>
            <div className="dp-tools">
              <button type="button" className={tool === 'pen' ? 'is-on' : ''} onClick={() => setTool(tool === 'pen' ? '' : 'pen')}><span>✏️</span>Bút vẽ</button>
              <button type="button" className={tool === 'spot' ? 'is-on' : ''} onClick={() => { setTool(tool === 'spot' ? '' : 'spot'); if (tool === 'spot') publish({ ...showRef.current, spot: null }); }}><span>🔦</span>Đèn chiếu</button>
              <button type="button" className={show.black === 'black' ? 'is-on' : ''} onClick={() => publish({ ...show, black: show.black === 'black' ? '' : 'black' })}><span>⬛</span>Che màn</button>
              <button type="button" onClick={() => publish({ ...show, ink: { ...show.ink, [show.slide]: [] } })} disabled={!strokes.length}><span>🧽</span>Xoá nét vẽ</button>
              <button type="button" onClick={callName}><img src="/emoji/tool/goi-ten.webp" alt="" />Gọi tên</button>
              <button type="button" onClick={() => publish({ ...show, timer: show.timer ? null : Date.now() + 60_000 })} className={show.timer ? 'is-on' : ''}><img src="/emoji/tool/hen-gio.webp" alt="" />{show.timer ? 'Tắt giờ' : 'Đếm 1 phút'}</button>
              {!show.teams && <button type="button" onClick={addStar}><img src="/emoji/tool/thi-dua.webp" alt="" />Cộng sao</button>}
              <button type="button" onClick={() => publish({ ...show, stars: 0, name: null })} disabled={!show.stars && !show.name}><span>↺</span>Đặt lại</button>
            </div>
            {tool === 'pen' && <div className="dp-inks">{INK.map((c) => <button key={c} type="button" aria-label={`Mực ${c}`} className={color === c ? 'is-on' : ''} style={{ background: c }} onClick={() => setColor(c)} />)}</div>}
            {show.timer && <div className="dp-inks">{[1, 2, 3, 5].map((m) => <button key={m} type="button" className="dp-min" onClick={() => publish({ ...show, timer: Date.now() + m * 60_000 })}>{m} phút</button>)}</div>}
          </section>
          <p className="dp-keys">Phím: cách / → tiếp · ← lùi · B che màn đen · W màn trắng · Esc tắt công cụ</p>
        </aside>
      </div>
      <footer className="dp-strip">
        <div className="dp-thumbs">
          {deck.slides.map((s, i) => (
            <button key={s.id} type="button" className={i === show.slide ? 'is-on' : ''} onClick={() => go(i)} aria-label={`Trang ${i + 1}`}>
              <SlideFrame>{(k) => <SlideView slide={s} mode="thumb" scale={k} assetUrl={assetUrl} />}</SlideFrame><i>{i + 1}</i>
            </button>
          ))}
        </div>
        <button type="button" className="dp-nav" onClick={prev} disabled={show.slide === 0}><ChevronLeft aria-hidden="true" /> Lùi</button>
        <button type="button" className="dp-nav is-go" onClick={next} disabled={show.slide >= n - 1 && left === 0}>Tiếp <ChevronRight aria-hidden="true" /> <small>(phím cách)</small></button>
      </footer>
    </div>
  );
}
