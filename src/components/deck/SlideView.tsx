'use client';

// Vẽ một trang thao giảng (khổ chuẩn 1600 × 900, co giãn theo khung). Ba chế độ:
//  - edit: chọn, kéo, đổi cỡ vật (trình soạn)
//  - play: chạy hiệu ứng, kích hoạt khi bấm, câu hỏi, kéo thả, cảnh 3D (trình chiếu)
//  - thumb: ảnh thu nhỏ tĩnh
import TeamAvatar from '@/components/classroom/TeamAvatar';
import dynamic from 'next/dynamic';
import SceneBg from './SceneBg';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import { FONTS, FX_BY_ID, SH, SW, bgCss, type El, type ShapeEl, type Slide, type SortEl } from '@/lib/deck/types';
import { fxEasing, fxFrames, planSlide, type Step } from '@/lib/deck/player';
import { playSound } from '@/lib/deck/sounds';

const Scene3DBox = dynamic(() => import('./Scene3DBox'), { ssr: false });

/** Khung giữ tỉ lệ 16:9, trả về tỉ lệ thu phóng cho nội dung 1600 × 900 */
export function SlideFrame({ children, className, style }: { children: (scale: number) => React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / SW));
    ro.observe(el); setScale(el.clientWidth / SW);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className={`dk-frame ${className ?? ''}`} style={style}>{scale > 0 && children(scale)}</div>;
}

export function ShapeSvg({ e }: { e: ShapeEl }) {
  const p = { fill: e.fill, stroke: e.stroke, strokeWidth: e.sw, vectorEffect: 'non-scaling-stroke' as const, strokeLinejoin: 'round' as const };
  const body = (() => {
    switch (e.shape) {
      case 'rect': return <rect x="0.5" y="0.5" width="99" height="99" {...p} />;
      case 'round': return <rect x="0.5" y="0.5" width="99" height="99" rx="12" ry="18" {...p} />;
      case 'circle': return <ellipse cx="50" cy="50" rx="49.5" ry="49.5" {...p} />;
      case 'star': return <polygon points="50,2 61.8,36 98,36.5 69,58 79.5,96 50,74 20.5,96 31,58 2,36.5 38.2,36" {...p} />;
      case 'heart': return <path d="M50 92 C 18 70 2 52 2 32 C 2 14 16 4 30 4 C 40 4 47 10 50 18 C 53 10 60 4 70 4 C 84 4 98 14 98 32 C 98 52 82 70 50 92 Z" {...p} />;
      case 'arrow': return <polygon points="1,32 62,32 62,6 99,50 62,94 62,68 1,68" {...p} />;
      case 'cloud': return <path d="M24 86 C 8 86 2 74 6 64 C 0 52 10 38 24 42 C 24 22 44 12 58 22 C 66 10 88 14 88 32 C 100 36 100 56 90 62 C 98 74 88 88 74 86 Z" {...p} />;
      case 'bubble': return <path d="M10 4 H90 Q98 4 98 12 V64 Q98 72 90 72 H40 L18 96 L24 72 H10 Q2 72 2 64 V12 Q2 4 10 4 Z" {...p} />;
    }
  })();
  return <svg className="dk-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{body}</svg>;
}

type Pick = { i: number; ok: boolean };
/** Trạng thái trò Sắp xếp: slots[i] = chỉ số thẻ (trong items) đặt ở ô i; bad = các ô vừa đặt sai (nháy đỏ) */
type SortSt = { slots: (number | null)[]; bad: number[]; ok: boolean };
const sortInit = (e: SortEl): SortSt => ({ slots: e.items.map(() => null), bad: [], ok: false });
function hashStr(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Xáo thẻ theo id vật (hai cửa sổ chiếu xáo giống nhau), bảo đảm không trùng thứ tự đúng */
export function sortShuffle(e: SortEl): number[] {
  const idx = e.items.map((_, i) => i); let h = hashStr(e.id) || 1;
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (idx.length > 1 && idx.every((v, i) => e.items[v] === e.items[i])) idx.push(idx.shift()!);
  return idx;
}
function SortBody({ e, mode, st, onTile }: { e: SortEl; mode: 'edit' | 'play' | 'thumb'; st?: SortSt; onTile?: (tile: number) => void }) {
  const n = e.items.length, long = Math.max(...e.items.map((t) => t.length), 1);
  const fs = Math.max(24, Math.min(60, e.w / Math.max(n * Math.max(long, 3) * 0.62, 10), (e.h - 120) / 4.2));
  const s = st ?? sortInit(e);
  const order = sortShuffle(e);
  const used = new Set(s.slots.filter((x): x is number => x !== null));
  const shown = mode === 'edit' ? e.items.map((_, i) => i) : null; // khi soạn: hiện thứ tự đúng ở ô
  const tile = (i: number, cls: string, key: string | number) => (
    <button key={key} type="button" className={`dk-tile${cls}`} style={{ fontSize: fs }} disabled={mode !== 'play' || s.ok}
      onPointerDown={(ev) => { if (mode === 'play') ev.stopPropagation(); }}
      onClick={(ev) => { if (mode !== 'play') return; ev.stopPropagation(); onTile?.(i); }}>{e.items[i]}</button>
  );
  return (
    <div className={`dk-sort${s.ok ? ' is-ok' : ''}`}>
      {e.prompt && <div className="dk-sort-q" style={{ fontSize: Math.min(54, fs * 1.05) }}>{e.prompt}</div>}
      <div className="dk-sort-slots">
        {e.items.map((_, k) => {
          const v = shown ? shown[k] : s.slots[k];
          return <div key={k} className={`dk-slot${s.bad.includes(k) ? ' is-bad' : ''}`} style={{ minHeight: fs * 1.9, minWidth: fs * 2.2 }}>
            <i>{k + 1}</i>{v !== null && v !== undefined ? tile(v, s.ok ? ' is-ok' : s.bad.includes(k) ? ' is-bad' : '', 'p' + k) : null}
          </div>;
        })}
      </div>
      {mode !== 'edit' && <div className="dk-sort-pool">{order.filter((i) => !used.has(i)).map((i) => tile(i, '', i))}</div>}
    </div>
  );
}
function ElBody({ e, mode, assetUrl, pick, onPick, sort, onTile, board }: { e: El; mode: 'edit' | 'play' | 'thumb'; assetUrl?: (p: string) => string | undefined; pick?: Pick; onPick?: (i: number) => void; sort?: SortSt; onTile?: (t: number) => void; board?: BoardTeam[] }) {
  switch (e.kind) {
    case 'text': {
      const f = FONTS[e.font] ?? FONTS.baloo;
      return (
        <div className="dk-text" style={{ fontFamily: f.css, fontWeight: f.weight, fontSize: e.size, color: e.color, textAlign: e.align, fontStyle: e.italic ? 'italic' : undefined,
          background: e.bg || undefined, padding: e.bg ? '10px 22px' : undefined, borderRadius: e.bg ? 24 : undefined,
          WebkitTextStroke: e.stroke ? `${e.strokeW ?? 10}px ${e.stroke}` : undefined, paintOrder: e.stroke ? 'stroke fill' : undefined, textShadow: e.shadow ? '0 8px 0 rgba(0,0,0,.18), 0 2px 14px rgba(0,0,0,.12)' : undefined, justifyContent: e.align === 'center' ? 'center' : e.align === 'right' ? 'flex-end' : 'flex-start' }}>
          <span>{e.text}</span>
        </div>
      );
    }
    case 'img': {
      const src = e.asset ? assetUrl?.(e.src) : e.src;
      // eslint-disable-next-line @next/next/no-img-element -- hình dán / ảnh của cô, kích thước tự do
      return src ? <img className="dk-img" src={src} alt={e.name ?? ''} draggable={false} /> : <div className="dk-img-wait">🖼</div>;
    }
    case 'shape': return (
      <>
        <ShapeSvg e={e} />
        {e.text && <div className="dk-shape-text" style={{ color: e.color ?? '#1f2937', fontSize: e.size ?? 40, fontFamily: FONTS.baloo.css, fontWeight: 800 }}>{e.text}</div>}
      </>
    );
    case 'quiz': {
      const qs = Math.max(26, Math.min(64, e.w / 16)), os = Math.max(22, Math.min(54, e.w / (e.cols === 2 ? 22 : 18)));
      const COL = ['#ef4444', '#2563eb', '#f59e0b', '#16a34a', '#9333ea', '#0891b2'];
      return (
        <div className="dk-quiz">
          <div className="dk-quiz-q" style={{ fontSize: qs }}>{e.q}</div>
          <div className="dk-quiz-opts" style={{ gridTemplateColumns: e.cols === 2 ? '1fr 1fr' : '1fr' }}>
            {e.opts.map((o, i) => {
              const st = pick && pick.i === i ? (pick.ok ? ' is-ok' : ' is-bad') : pick?.ok && i === e.a ? '' : '';
              return (
                <button key={i} type="button" className={`dk-opt${st}${mode === 'edit' && i === e.a ? ' is-key' : ''}`} style={{ fontSize: os }}
                  disabled={mode !== 'play' || !!pick?.ok}
                  onPointerDown={(ev) => { if (mode === 'play') ev.stopPropagation(); }}
                  onClick={(ev) => { if (mode !== 'play') return; ev.stopPropagation(); onPick?.(i); }}>
                  <b style={{ background: COL[i % COL.length] }}>{String.fromCharCode(65 + i)}</b><span>{o}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    case 'sort': return <SortBody e={e} mode={mode} st={sort} onTile={onTile} />;
    case 'teams': return <TeamsBoard title={e.title} teams={board?.length ? board : SAMPLE_BOARD} live={mode === 'play'} />;
    case 'drop': return <div className="dk-drop" style={{ borderColor: e.color, color: e.color }}><span>{e.label}</span></div>;
    case 'scene3d':
      return mode === 'play' && e.lesson ? <Scene3DBox lessonId={e.lesson} title={e.title} />
        : <div className="dk-scene-ph"><span>🧊</span><b>{e.title || 'Cảnh 3D'}</b><small>{mode === 'edit' ? 'Xoay, phóng to được khi trình chiếu' : ''}</small></div>;
  }
}

export type PlayAction = { t: 'step' } | { t: 'back' } | { t: 'trigger'; el: string } | { t: 'quiz'; el: string; i: number } | { t: 'drop'; el: string; x: number; y: number } | { t: 'sort'; el: string; tile: number };
/** điểm một tổ cho Bảng thi đua tổ */
export type BoardTeam = { name: string; emoji: string; color: string; score: number };
const SAMPLE_BOARD: BoardTeam[] = [['Tổ 1', '🚀', '#2457c5', 7], ['Tổ 2', '🌻', '#15803d', 9], ['Tổ 3', '⚡', '#c2410c', 6], ['Tổ 4', '🌈', '#6d3fe0', 8]].map(([name, emoji, color, score]) => ({ name, emoji, color, score } as BoardTeam));
function TeamsBoard({ title, teams, live }: { title: string; teams: BoardTeam[]; live: boolean }) {
  const max = Math.max(1, ...teams.map((t) => t.score)), top = Math.max(...teams.map((t) => t.score));
  return (
    <div className={`dk-board${live ? ' is-live' : ''}`}>
      {title && <div className="dk-board-t">{title}</div>}
      <div className="dk-board-cols">{teams.map((t, i) => (
        <div key={i} className="dk-board-c">
          <div className="dk-board-bar" style={{ height: `${Math.max(12, (Math.max(0, t.score) / max) * 100)}%`, background: t.color, animationDelay: `${i * 0.15}s` }}>
            {t.score === top && top > 0 && <span className="dk-board-cup">🏆</span>}<b>{t.score}</b>
          </div>
          <span className="dk-board-n"><TeamAvatar emoji={t.emoji} size={54} className="team-av-in" /> {t.name}</span>
        </div>
      ))}</div>
    </div>
  );
}
export type PlayApi = { apply: (a: PlayAction) => boolean; stepsLeft: () => number; stepIndex: () => number };

type Props = {
  slide: Slide; mode: 'edit' | 'play' | 'thumb'; scale: number;
  assetUrl?: (path: string) => string | undefined;
  /* soạn */
  sel?: string | null; onSelect?: (id: string | null) => void;
  onChange?: (id: string, patch: Partial<El>, record: boolean) => void;
  onEditText?: (id: string) => void;
  /* chiếu */
  onAction?: (a: PlayAction) => void;
  onLink?: (n: number) => void;
  /** chạy sẵn đến bước số mấy (khi mở lại trang / cửa sổ chiếu mới mở) */
  startStep?: number;
  /** lớp trả lời đúng / làm xong trò chơi (để cô cộng điểm thi đua tổ) */
  onWin?: (what: string) => void;
  /** điểm các tổ cho Bảng thi đua tổ */
  board?: BoardTeam[];
};

const SlideView = forwardRef<PlayApi, Props>(function SlideView({ slide, mode, scale, assetUrl, sel, onSelect, onChange, onEditText, onAction, onLink, startStep = 0, onWin, board }, ref) {
  const winRef = useRef(onWin); winRef.current = onWin;
  const plan = useMemo(() => planSlide(slide), [slide]);
  const play = mode === 'play';
  const [hidden, setHidden] = useState<Set<string>>(() => (play ? new Set(plan.hidden) : new Set()));
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const [done, setDone] = useState<Set<string>>(new Set()); // vật đã kéo đúng ô
  const [sorts, setSorts] = useState<Record<string, SortSt>>({});
  const sortsRef = useRef(sorts); sortsRef.current = sorts;
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const step = useRef(0);
  const fired = useRef(new Set<string>());
  const timers = useRef<number[]>([]);
  const hiddenRef = useRef(hidden); hiddenRef.current = hidden;

  const show = useCallback((id: string, v: boolean) => {
    const n = nodes.current.get(id); if (n) n.style.visibility = v ? '' : 'hidden';
    setHidden((h) => { if (v ? !h.has(id) : h.has(id)) return h; const s = new Set(h); if (v) s.delete(id); else s.add(id); return s; });
  }, []);

  const run = useCallback((cues: Step, instant = false) => {
    for (const c of cues) {
      const go = () => {
        const n = nodes.current.get(c.anim.el)?.querySelector<HTMLElement>('.dk-a');
        const g = FX_BY_ID[c.anim.fx].group;
        if (g === 'in') show(c.anim.el, true);
        if (instant) { if (g === 'out') show(c.anim.el, false); return; }
        playSound(c.anim.sound);
        const a = n?.animate(fxFrames(c.anim.fx), { duration: c.anim.dur * 1000, easing: fxEasing(c.anim.fx), iterations: c.anim.fx === 'spin' ? 1 : 1 });
        if (g === 'out') { if (a) a.onfinish = () => show(c.anim.el, false); else show(c.anim.el, false); }
      };
      if (instant || c.at <= 0) go(); else timers.current.push(window.setTimeout(go, c.at * 1000));
    }
  }, [show]);

  // vào trang: chạy nhóm tự chạy + âm thanh của trang, rồi chạy nhanh đến bước đã đi (khi đồng bộ)
  useEffect(() => {
    if (!play) return;
    playSound(slide.sound);
    run(plan.auto, startStep > 0);
    for (let i = 0; i < startStep && i < plan.steps.length; i++) run(plan.steps[i], true);
    step.current = Math.min(startStep, plan.steps.length);
    const t = timers.current;
    return () => { t.forEach((x) => clearTimeout(x)); t.length = 0; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoneAt = (x: number, y: number) => slide.els.find((z) => z.kind === 'drop' && x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) as Extract<El, { kind: 'drop' }> | undefined;
  const apply = useCallback((a: PlayAction): boolean => {
    switch (a.t) {
      case 'step': {
        if (step.current >= plan.steps.length) return false;
        run(plan.steps[step.current]); step.current++; return true;
      }
      case 'back': return false;
      case 'trigger': {
        const cues = plan.triggers[a.el]; if (!cues) return false;
        fired.current.add(a.el); run(cues);
        // mở miếng che đáp án (âm "đúng rồi") → hỏi cô cộng điểm cho tổ nào
        if (cues.some((c) => c.anim.sound === 'ding')) window.setTimeout(() => winRef.current?.('Mở đáp án'), 800);
        return true;
      }
      case 'quiz': {
        const q = slide.els.find((x) => x.id === a.el); if (!q || q.kind !== 'quiz') return false;
        const ok = a.i === q.a;
        setPicks((p) => ({ ...p, [a.el]: { i: a.i, ok } }));
        playSound(ok ? 'tada' : 'wrong');
        if (ok) { const n = nodes.current.get(a.el); n?.querySelector<HTMLElement>('.dk-a')?.animate(fxFrames('pulse'), { duration: 700 }); burst(n); window.setTimeout(() => winRef.current?.('Trả lời đúng'), 900); }
        return true;
      }
      case 'drop': {
        const e = slide.els.find((x) => x.id === a.el); if (!e) return false;
        const cx = a.x + e.w / 2, cy = a.y + e.h / 2, z = zoneAt(cx, cy);
        if (z && z.accept.includes(e.id)) {
          setPos((p) => ({ ...p, [e.id]: { x: Math.round(Math.min(Math.max(cx, z.x + e.w / 2), z.x + z.w - e.w / 2) - e.w / 2), y: Math.round(Math.min(Math.max(cy, z.y + e.h / 2), z.y + z.h - e.h / 2) - e.h / 2) } }));
          setDone((d) => { const nd = new Set(d).add(e.id); if (slide.els.filter((x) => x.drag).every((x) => nd.has(x.id))) window.setTimeout(() => winRef.current?.('Kéo thả đúng hết'), 900); return nd; }); playSound('ding'); burst(nodes.current.get(e.id));
        } else if (z) {
          setPos((p) => { const n = { ...p }; delete n[e.id]; return n; }); playSound('wrong');
          nodes.current.get(e.id)?.querySelector<HTMLElement>('.dk-a')?.animate(fxFrames('shake'), { duration: 500 });
        } else setPos((p) => ({ ...p, [e.id]: { x: a.x, y: a.y } }));
        return true;
      }
      case 'sort': {
        const e = slide.els.find((x) => x.id === a.el); if (!e || e.kind !== 'sort') return false;
        const cur = sortsRef.current[e.id] ?? sortInit(e);
        if (cur.ok) return false;
        const slots = [...cur.slots];
        const at = slots.indexOf(a.tile);
        if (at >= 0) { slots[at] = null; playSound('whoosh'); }
        else { const k = slots.indexOf(null); if (k < 0) return false; slots[k] = a.tile; playSound('pop'); }
        let next: SortSt = { slots, bad: [], ok: false };
        if (!slots.includes(null)) {
          const bad = slots.map((v, k) => (e.items[v!] === e.items[k] ? -1 : k)).filter((k) => k >= 0);
          if (!bad.length) {
            next = { slots, bad: [], ok: true }; playSound('tada'); window.setTimeout(() => winRef.current?.('Sắp xếp đúng'), 1100);
            const n = nodes.current.get(e.id); window.setTimeout(() => burst(n), 50);
          } else {
            next = { slots, bad, ok: false }; playSound('wrong');
            timers.current.push(window.setTimeout(() => setSorts((m) => {
              const c = m[e.id]; if (!c) return m;
              return { ...m, [e.id]: { slots: c.slots.map((v, k) => (bad.includes(k) ? null : v)), bad: [], ok: false } };
            }), 900));
          }
        }
        sortsRef.current = { ...sortsRef.current, [e.id]: next };
        setSorts(sortsRef.current);
        return true;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, run, slide.els]);
  useImperativeHandle(ref, () => ({ apply, stepsLeft: () => plan.steps.length - step.current, stepIndex: () => step.current }), [apply, plan]);

  /* ---------- kéo khi trình chiếu ---------- */
  const playDrag = useRef<{ id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const toSlide = (ev: { clientX: number; clientY: number }, root: HTMLElement) => { const r = root.getBoundingClientRect(); return [(ev.clientX - r.left) / scale, (ev.clientY - r.top) / scale]; };
  const rootRef = useRef<HTMLDivElement>(null);

  /* ---------- soạn: kéo / đổi cỡ ---------- */
  const edit = useRef<{ id: string; kind: 'move' | 'size'; sx: number; sy: number; x0: number; y0: number; w0: number; h0: number; ratio: boolean; moved: boolean } | null>(null);

  const onElDown = (e: El, ev: React.PointerEvent, kind: 'move' | 'size' = 'move') => {
    if (mode === 'thumb') return;
    if (mode === 'edit') {
      ev.stopPropagation();
      onSelect?.(e.id);
      if (e.lock && kind === 'move') return;
      (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
      edit.current = { id: e.id, kind, sx: ev.clientX, sy: ev.clientY, x0: e.x, y0: e.y, w0: e.w, h0: e.h, ratio: e.kind === 'img' || (e.kind === 'shape' && (e.shape === 'circle' || e.shape === 'star' || e.shape === 'heart')), moved: false };
      return;
    }
    // chiếu
    if (e.drag && !done.has(e.id)) {
      ev.stopPropagation();
      (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
      const p = pos[e.id] ?? { x: e.x, y: e.y };
      const [x, y] = toSlide(ev, rootRef.current!);
      playDrag.current = { id: e.id, ox: x - p.x, oy: y - p.y, sx: ev.clientX, sy: ev.clientY, moved: false };
    }
  };
  const onElMove = (ev: React.PointerEvent) => {
    const d = edit.current;
    if (d) {
      const dx = (ev.clientX - d.sx) / scale, dy = (ev.clientY - d.sy) / scale;
      if (!d.moved && Math.hypot(dx, dy) < 2) return;
      d.moved = true;
      if (d.kind === 'move') onChange?.(d.id, { x: Math.round(d.x0 + dx), y: Math.round(d.y0 + dy) }, false);
      else {
        let w = Math.max(30, d.w0 + dx), h = Math.max(24, d.h0 + dy);
        if (d.ratio || ev.shiftKey) { const k = Math.max(w / d.w0, h / d.h0); w = d.w0 * k; h = d.h0 * k; }
        onChange?.(d.id, { w: Math.round(w), h: Math.round(h) }, false);
      }
      return;
    }
    const p = playDrag.current;
    if (p && rootRef.current) {
      const [x, y] = toSlide(ev, rootRef.current);
      if (!p.moved && Math.hypot(ev.clientX - p.sx, ev.clientY - p.sy) < 4) return;
      p.moved = true;
      setPos((s) => ({ ...s, [p.id]: { x: Math.round(x - p.ox), y: Math.round(y - p.oy) } }));
    }
  };
  const onElUp = (e: El) => {
    const d = edit.current; edit.current = null;
    if (d) { if (d.moved) onChange?.(d.id, {}, true); return; }
    const p = playDrag.current; playDrag.current = null;
    if (p) {
      if (p.moved) { const q = pos[p.id] ?? { x: e.x, y: e.y }; const a: PlayAction = { t: 'drop', el: p.id, x: q.x, y: q.y }; apply(a); onAction?.(a); return; }
      click(e);
    }
  };
  // bấm vào vật khi chiếu: kích hoạt / chuyển trang
  const click = (e: El) => {
    if (!play) return;
    if (plan.triggers[e.id]) { const a: PlayAction = { t: 'trigger', el: e.id }; apply(a); onAction?.(a); return; }
    if (e.link) onLink?.(e.link);
  };

  return (
    <div ref={rootRef} className={`dk-slide is-${mode}`} style={{ width: SW, height: SH, transform: `scale(${scale})`, background: bgCss(slide.bg) }}
      onPointerDown={() => { if (mode === 'edit') onSelect?.(null); }}>
      {slide.scene && <SceneBg id={slide.scene} />}
      {slide.els.map((e) => {
        const p = play ? pos[e.id] : undefined;
        const clickable = play && (!!plan.triggers[e.id] || !!e.link || (!!e.drag && !done.has(e.id)));
        return (
          <div key={e.id} data-id={e.id} ref={(n) => { if (n) nodes.current.set(e.id, n); else nodes.current.delete(e.id); }}
            className={`dk-el k-${e.kind}${sel === e.id ? ' is-sel' : ''}${clickable ? ' is-click' : ''}${play && e.drag && !done.has(e.id) ? ' is-drag' : ''}${done.has(e.id) ? ' is-done' : ''}`}
            style={{ left: p?.x ?? e.x, top: p?.y ?? e.y, width: e.w, height: e.h, transform: e.rot ? `rotate(${e.rot}deg)` : undefined, visibility: play && hidden.has(e.id) ? 'hidden' : undefined, zIndex: play && playDrag.current?.id === e.id ? 50 : undefined }}
            onPointerDown={(ev) => onElDown(e, ev)} onPointerMove={onElMove} onPointerUp={() => onElUp(e)}
            onClick={(ev) => { if (play && !e.drag) { ev.stopPropagation(); click(e); } }}
            onDoubleClick={() => { if (mode === 'edit' && (e.kind === 'text' || e.kind === 'shape' || e.kind === 'quiz' || e.kind === 'sort')) onEditText?.(e.id); }}>
            <div className="dk-a"><ElBody e={e} mode={mode} assetUrl={assetUrl} pick={picks[e.id]} onPick={(i) => { const a: PlayAction = { t: 'quiz', el: e.id, i }; apply(a); onAction?.(a); }}
              board={board} sort={sorts[e.id]} onTile={(tile) => { const a: PlayAction = { t: 'sort', el: e.id, tile }; if (apply(a)) onAction?.(a); }} /></div>
            {mode === 'edit' && sel === e.id && !e.lock && <span className="dk-size" onPointerDown={(ev) => onElDown(e, ev, 'size')} onPointerMove={onElMove} onPointerUp={() => onElUp(e)} />}
            {mode === 'edit' && <AnimBadges slide={slide} id={e.id} />}
          </div>
        );
      })}
    </div>
  );
});
export default memo(SlideView);

/** Số thứ tự hiệu ứng / dấu kích hoạt hiện trên vật khi soạn */
function AnimBadges({ slide, id }: { slide: Slide; id: string }) {
  const idx: string[] = [];
  slide.anims.forEach((a, i) => { if (a.el === id) idx.push(a.trigger ? `🎯${i + 1}` : String(i + 1)); });
  const isTrig = slide.anims.some((a) => a.trigger === id);
  if (!idx.length && !isTrig) return null;
  return (
    <span className="dk-badges">
      {isTrig && <i className="is-trg" title="Bấm vào vật này để chạy hiệu ứng">🎯</i>}
      {idx.slice(0, 4).map((t, i) => <i key={i} className={t.startsWith('🎯') ? 'is-trg2' : ''}>{t.replace('🎯', '')}</i>)}
    </span>
  );
}

/** Pháo giấy nhỏ quanh vật (khi trả lời đúng / kéo đúng) */
function burst(n?: HTMLElement | null) {
  if (!n) return;
  const host = n.parentElement; if (!host) return;
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const cx = n.offsetLeft + n.offsetWidth / 2, cy = n.offsetTop + n.offsetHeight / 2;
  for (let i = 0; i < 26; i++) {
    const d = document.createElement('i');
    d.className = 'dk-confetti';
    d.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i % colors.length]}`;
    host.appendChild(d);
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 220;
    d.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r + 120}px) rotate(${Math.random() * 720}deg) scale(.6)`, opacity: 0 }], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => d.remove();
  }
}
