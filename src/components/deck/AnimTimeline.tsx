'use client';

// Dòng thời gian hiệu ứng của một trang (kiểu Canva / PowerPoint): mỗi hiệu ứng là một vạch màu.
// Kéo cả vạch = đổi lúc bắt đầu (chờ trước); kéo mép phải = đổi thời lượng; bước 0,1 giây.
// Nhóm: Tự chạy khi vào trang · Bấm 1, 2, 3… · 🎯 Khi bấm vào vật. ▶ chạy thử ngay trên trang đang soạn.
import { useRef, useState } from 'react';
import type React from 'react';
import { Play } from 'lucide-react';
import { FX_BY_ID, elLabel, type Anim, type Slide } from '@/lib/deck/types';
import { animIterations, animSpan, fxEasing, fxFrames, planSlide, type Step } from '@/lib/deck/player';
import { playSound } from '@/lib/deck/sounds';

const PPS = 70; // điểm ảnh mỗi giây
const GROUP_COLOR = { in: '#22c55e', em: '#f59e0b', out: '#ef4444' } as const;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** chạy thử một nhóm hiệu ứng trên trang đang soạn (không đổi dữ liệu) */
export function previewCues(cues: Step, root: ParentNode | null) {
  for (const c of cues) {
    window.setTimeout(() => {
      const n = root?.querySelector<HTMLElement>(`.dk-el[data-id="${c.anim.el}"] .dk-a`);
      playSound(c.anim.sound);
      n?.animate(fxFrames(c.anim.fx), { duration: c.anim.dur * 1000, easing: fxEasing(c.anim.fx, c.anim.ease), iterations: Math.min(3, animIterations(c.anim)) });
    }, c.at * 1000);
  }
}

export default function AnimTimeline({ slide, sel, onSelect, onPatch, onCommit, stage }: {
  slide: Slide; sel: string | null; onSelect: (a: Anim) => void;
  /** sửa tạm khi đang kéo (không ghi lịch sử) */ onPatch: (id: string, p: Partial<Anim>) => void;
  /** thả chuột: ghi một bước hoàn tác */ onCommit: () => void;
  /** khung trang đang soạn (để chạy thử) */ stage: () => ParentNode | null;
}) {
  const plan = planSlide(slide);
  const byId = new Map(slide.els.map((e) => [e.id, e]));
  const drag = useRef<{ id: string; kind: 'move' | 'dur'; sx: number; d0: number; u0: number; rep: number } | null>(null);
  const [live, setLive] = useState<{ id: string; text: string } | null>(null);

  const groups: { key: string; label: string; cues: Step }[] = [
    ...(plan.auto.length ? [{ key: 'auto', label: 'Tự chạy khi vào trang', cues: plan.auto }] : []),
    ...plan.steps.map((cues, i) => ({ key: `s${i}`, label: `Bấm ${i + 1}`, cues })),
    ...Object.entries(plan.triggers).map(([el, cues]) => ({ key: `t${el}`, label: `🎯 Khi bấm: ${byId.get(el) ? elLabel(byId.get(el)!) : '?'}`, cues })),
  ];
  if (!groups.length) return <p className="tl-empty">Trang chưa có hiệu ứng. Chọn một vật rồi bấm hiệu ứng ở thẻ <b>Hiệu ứng</b> — hoặc bấm <b>✨ Hiệu ứng cả trang</b>.</p>;
  const end = Math.max(4, ...groups.flatMap((g) => g.cues.map((c) => c.at + animSpan(c.anim))));
  const width = Math.ceil(end + 1.5) * PPS;

  const down = (ev: React.PointerEvent, a: Anim, kind: 'move' | 'dur') => {
    ev.stopPropagation(); ev.preventDefault();
    (ev.currentTarget as Element).setPointerCapture?.(ev.pointerId);
    onSelect(a);
    drag.current = { id: a.id, kind, sx: ev.clientX, d0: a.delay, u0: a.dur, rep: Math.max(1, a.rep ?? 1) };
  };
  const move = (ev: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dt = (ev.clientX - d.sx) / PPS;
    if (d.kind === 'move') { const v = r1(Math.min(30, Math.max(0, d.d0 + dt))); onPatch(d.id, { delay: v }); setLive({ id: d.id, text: `chờ ${v.toFixed(1)} s` }); }
    else { const v = r1(Math.min(10, Math.max(0.2, d.u0 + dt / d.rep))); onPatch(d.id, { dur: v }); setLive({ id: d.id, text: `${v.toFixed(1)} s` }); }
  };
  const up = () => { if (drag.current) { drag.current = null; setLive(null); onCommit(); } };

  return (
    <div className="tl" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div className="tl-head">
        <b>Dòng thời gian</b><small>kéo vạch để đổi lúc bắt đầu · kéo mép phải để đổi thời lượng</small>
        <button type="button" className="mini-btn" onClick={() => { let t = 0; const all: Step = []; for (const g of groups) { if (g.key.startsWith('t')) continue; for (const c of g.cues) all.push({ ...c, at: t + c.at }); t += Math.max(...g.cues.map((c) => c.at + animSpan(c.anim))) + 0.4; } previewCues(all, stage()); }}><Play aria-hidden="true" /> Chạy thử cả trang</button>
      </div>
      <div className="tl-scroll">
        <div className="tl-inner" style={{ width: width + 170 }}>
          <div className="tl-ruler" style={{ marginLeft: 170, width }}>{Array.from({ length: Math.ceil(end + 1.5) + 1 }, (_, i) => <span key={i} style={{ left: i * PPS }}>{i}s</span>)}</div>
          {groups.map((g) => (
            <div key={g.key} className="tl-grp">
              <div className="tl-gh"><span>{g.label}</span><button type="button" className="tl-play" aria-label={`Chạy thử: ${g.label}`} onClick={() => previewCues(g.cues, stage())}><Play aria-hidden="true" /></button></div>
              {g.cues.map((c) => {
                const a = c.anim, e = byId.get(a.el), fx = FX_BY_ID[a.fx];
                const w = Math.max(14, animSpan(a) * PPS);
                return (
                  <div key={a.id} className={`tl-row${sel === a.id ? ' is-on' : ''}`}>
                    <button type="button" className="tl-name" onClick={() => onSelect(a)} title={e ? elLabel(e) : ''}>{fx.icon} {e ? elLabel(e) : '?'}</button>
                    <div className="tl-track" style={{ width }}>
                      <div className="tl-bar" style={{ left: c.at * PPS, width: w, background: GROUP_COLOR[fx.group] }} onPointerDown={(ev) => down(ev, a, 'move')}
                        title={`${fx.label} · bắt đầu ${c.at.toFixed(1)} s · ${a.dur} s${(a.rep ?? 1) !== 1 ? ` × ${a.rep === 0 ? '∞' : a.rep}` : ''}`}>
                        <span>{live?.id === a.id ? live.text : `${fx.label} ${a.dur}s${a.rep === 0 ? ' ∞' : (a.rep ?? 1) > 1 ? ` ×${a.rep}` : ''}`}</span>
                        <i className="tl-grip" onPointerDown={(ev) => down(ev, a, 'dur')} aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
