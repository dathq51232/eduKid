// Chạy hiệu ứng của một trang khi trình chiếu: chia hiệu ứng thành các "bước" (mỗi lần bấm Tiếp chạy 1 bước),
// nhóm kích hoạt (bấm vào vật nào thì chạy nhóm của vật đó) và vật ẩn lúc đầu (có hiệu ứng xuất hiện).
import { FX_BY_ID, type Anim, type Fx, type Slide } from './types';

export type Cue = { anim: Anim; at: number };
export type Step = Cue[];
export type Plan = { auto: Step; steps: Step[]; triggers: Record<string, Step>; hidden: Set<string> };

function timeline(list: Anim[]): Step {
  const out: Cue[] = [];
  let prevStart = 0, prevEnd = 0;
  list.forEach((a, i) => {
    const at = i === 0 ? a.delay : a.start === 'with' ? prevStart + a.delay : prevEnd + a.delay;
    out.push({ anim: a, at });
    prevStart = at; prevEnd = Math.max(prevEnd, at + a.dur);
  });
  return out;
}

export function planSlide(s: Slide): Plan {
  const main = s.anims.filter((a) => !a.trigger);
  const groups: Anim[][] = [];
  let auto: Anim[] = [];
  for (const a of main) {
    if (a.start === 'click') groups.push([a]);
    else if (groups.length) groups[groups.length - 1].push(a);
    else auto.push(a);
  }
  const trig: Record<string, Anim[]> = {};
  for (const a of s.anims) if (a.trigger) (trig[a.trigger] ??= []).push(a);
  const hidden = new Set<string>();
  const seen = new Set<string>();
  for (const a of s.anims) {
    if (seen.has(a.el)) continue;
    seen.add(a.el);
    if (FX_BY_ID[a.fx].group === 'in') hidden.add(a.el);
  }
  auto = auto.length ? auto : [];
  return { auto: timeline(auto), steps: groups.map(timeline), triggers: Object.fromEntries(Object.entries(trig).map(([k, v]) => [k, timeline(v)])), hidden };
}

/** Khung hình (Web Animations) của từng hiệu ứng */
export function fxFrames(fx: Fx): Keyframe[] {
  switch (fx) {
    case 'fade': return [{ opacity: 0 }, { opacity: 1 }];
    case 'fly-left': return [{ transform: 'translateX(-120vw)', opacity: 0 }, { transform: 'translateX(4%)', opacity: 1, offset: 0.85 }, { transform: 'none', opacity: 1 }];
    case 'fly-right': return [{ transform: 'translateX(120vw)', opacity: 0 }, { transform: 'translateX(-4%)', opacity: 1, offset: 0.85 }, { transform: 'none', opacity: 1 }];
    case 'fly-up': return [{ transform: 'translateY(110vh)', opacity: 0 }, { transform: 'translateY(-5%)', opacity: 1, offset: 0.85 }, { transform: 'none', opacity: 1 }];
    case 'fly-down': return [{ transform: 'translateY(-110vh)', opacity: 0 }, { transform: 'translateY(4%)', opacity: 1, offset: 0.8 }, { transform: 'none', opacity: 1 }];
    case 'pop': return [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.18)', opacity: 1, offset: 0.6 }, { transform: 'scale(.94)', offset: 0.8 }, { transform: 'none', opacity: 1 }];
    case 'zoom': return [{ transform: 'scale(0)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'spin-in': return [{ transform: 'rotate(-540deg) scale(0)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'drop': return [{ transform: 'translateY(-80vh)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: 0.55 }, { transform: 'translateY(-12%)', offset: 0.72 }, { transform: 'translateY(0)', offset: 0.86 }, { transform: 'translateY(-4%)', offset: 0.93 }, { transform: 'none', opacity: 1 }];
    case 'pulse': return [{ transform: 'none' }, { transform: 'scale(1.15)' }, { transform: 'none' }, { transform: 'scale(1.15)' }, { transform: 'none' }];
    case 'shake': return [0, -14, 14, -10, 10, -6, 6, 0].map((v) => ({ transform: `translateX(${v}px)` }));
    case 'wiggle': return [0, -12, 12, -9, 9, -4, 0].map((v) => ({ transform: `rotate(${v}deg)` }));
    case 'blink': return [{ opacity: 1 }, { opacity: 0.1 }, { opacity: 1 }, { opacity: 0.1 }, { opacity: 1 }];
    case 'grow': return [{ transform: 'none' }, { transform: 'scale(1.35)', offset: 0.5 }, { transform: 'none' }];
    case 'spin': return [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }];
    case 'jump': return [{ transform: 'none' }, { transform: 'translateY(-30%)', offset: 0.3 }, { transform: 'none', offset: 0.55 }, { transform: 'translateY(-14%)', offset: 0.75 }, { transform: 'none' }];
    case 'fade-out': return [{ opacity: 1 }, { opacity: 0 }];
    case 'fly-out': return [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-110vh) rotate(-20deg)', opacity: 0 }];
    case 'zoom-out': return [{ transform: 'none', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }];
  }
}
export const fxEasing = (fx: Fx) => (['fly-left', 'fly-right', 'fly-up', 'fly-down', 'drop', 'pop'].includes(fx) ? 'cubic-bezier(.2,.8,.3,1)' : 'ease-in-out');

/** Hiệu ứng chuyển trang (áp lên khung trang mới) */
export function transFrames(t: string): Keyframe[] | null {
  switch (t) {
    case 'fade': return [{ opacity: 0 }, { opacity: 1 }];
    case 'slide': return [{ transform: 'translateX(100%)' }, { transform: 'none' }];
    case 'zoom': return [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'flip': return [{ transform: 'perspective(1600px) rotateY(80deg)', opacity: 0.3 }, { transform: 'none', opacity: 1 }];
    default: return null;
  }
}
