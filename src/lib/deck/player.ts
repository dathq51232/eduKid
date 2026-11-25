// Chạy hiệu ứng của một trang khi trình chiếu: chia hiệu ứng thành các "bước" (mỗi lần bấm Tiếp chạy 1 bước),
// nhóm kích hoạt (bấm vào vật nào thì chạy nhóm của vật đó) và vật ẩn lúc đầu (có hiệu ứng xuất hiện).
import { FX_BY_ID, type Anim, type Ease, type El, type Fx, type Slide, type Trans } from './types';

export type Cue = { anim: Anim; at: number };
export type Step = Cue[];
export type Plan = { auto: Step; steps: Step[]; triggers: Record<string, Step>; hidden: Set<string> };

/** thời gian một hiệu ứng chiếm trên dòng thời gian (tính cả số lần lặp; lặp mãi tính 1 lần) */
export const animSpan = (a: Anim) => a.dur * Math.max(1, a.rep ?? 1);
/** số lần chạy khi trình chiếu */
export const animIterations = (a: Anim) => (a.rep === 0 && FX_BY_ID[a.fx].group === 'em' ? Infinity : Math.max(1, a.rep ?? 1));

export function timeline(list: Anim[]): Step {
  const out: Cue[] = [];
  let prevStart = 0, prevEnd = 0;
  list.forEach((a, i) => {
    const at = i === 0 ? a.delay : a.start === 'with' ? prevStart + a.delay : prevEnd + a.delay;
    out.push({ anim: a, at });
    prevStart = at; prevEnd = Math.max(prevEnd, at + animSpan(a));
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

/** Khung hình (Web Animations) của từng hiệu ứng — vào trang êm, ít nảy, chỉ transform / opacity */
export function fxFrames(fx: Fx): Keyframe[] {
  switch (fx) {
    case 'fade': return [{ opacity: 0 }, { opacity: 1 }];
    case 'float': return [{ transform: 'translateY(14%)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'fly-left': return [{ transform: 'translateX(-110vw)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'fly-right': return [{ transform: 'translateX(110vw)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'fly-up': return [{ transform: 'translateY(100vh)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'fly-down': return [{ transform: 'translateY(-100vh)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'pop': return [{ transform: 'scale(.5)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.65 }, { transform: 'none', opacity: 1 }];
    case 'zoom': return [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'spin-in': return [{ transform: 'rotate(-180deg) scale(.3)', opacity: 0 }, { transform: 'none', opacity: 1 }];
    case 'drop': return [{ transform: 'translateY(-70vh)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: 0.6 }, { transform: 'translateY(-6%)', offset: 0.78 }, { transform: 'translateY(0)', offset: 0.9 }, { transform: 'translateY(-1.5%)', offset: 0.95 }, { transform: 'none', opacity: 1 }];
    case 'pulse': return [{ transform: 'none' }, { transform: 'scale(1.1)' }, { transform: 'none' }, { transform: 'scale(1.1)' }, { transform: 'none' }];
    case 'shake': return [0, -12, 12, -8, 8, -4, 4, 0].map((v) => ({ transform: `translateX(${v}px)` }));
    case 'wiggle': return [0, -10, 10, -7, 7, -3, 0].map((v) => ({ transform: `rotate(${v}deg)` }));
    case 'blink': return [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }];
    case 'grow': return [{ transform: 'none' }, { transform: 'scale(1.25)', offset: 0.5 }, { transform: 'none' }];
    case 'spin': return [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }];
    case 'jump': return [{ transform: 'none' }, { transform: 'translateY(-20%)', offset: 0.3 }, { transform: 'none', offset: 0.55 }, { transform: 'translateY(-8%)', offset: 0.75 }, { transform: 'none' }];
    case 'fade-out': return [{ opacity: 1 }, { opacity: 0 }];
    case 'fly-out': return [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100vh) rotate(-12deg)', opacity: 0 }];
    case 'zoom-out': return [{ transform: 'none', opacity: 1 }, { transform: 'scale(.3)', opacity: 0 }];
  }
}
/** đường cong chuẩn: vào trang = chậm dần (ease-out), nhấn mạnh = êm hai đầu, ra = nhanh dần */
export const EASE_OUT = 'cubic-bezier(.16,1,.3,1)';
export const EASE_INOUT = 'cubic-bezier(.65,0,.35,1)';
const EASING: Record<Exclude<Ease, 'auto'>, string> = { linear: 'linear', smooth: 'cubic-bezier(.45,0,.2,1)', bounce: 'cubic-bezier(.34,1.56,.64,1)', elastic: 'cubic-bezier(.68,-.6,.32,1.6)' };
export const fxEasing = (fx: Fx, ease?: Ease) => {
  if (ease && ease !== 'auto') return EASING[ease];
  const g = FX_BY_ID[fx].group;
  return g === 'in' ? (fx === 'drop' ? 'cubic-bezier(.3,.7,.4,1)' : EASE_OUT) : g === 'out' ? 'cubic-bezier(.7,0,.84,0)' : 'ease-in-out';
};

/* ---------- Chuyển trang (kiểu PowerPoint) ----------
   Trang cũ được giữ lại thành một lớp "bóng" phía trên trang mới rồi rời đi, nên không còn chớp nền:
   - Mờ dần (Fade): bóng mờ đi, lộ trang mới bên dưới.
   - Đẩy sang (Push): hai trang cùng trượt, trang mới đẩy trang cũ ra.
   - Phóng to (Zoom): trang cũ phóng nhẹ và mờ đi, trang mới thu từ 94% về 100%.
   - Lật trang (Flip): nửa đầu trang cũ lật đi, nửa sau trang mới lật vào.
   - Biến hình (Morph): vật có mặt ở cả hai trang trượt / đổi cỡ / xoay sang chỗ mới; vật chỉ có ở trang cũ mờ đi, vật mới hiện dần. */
/** thời lượng mặc định (giây) của từng kiểu chuyển trang */
export const TRANS_DUR: Record<Trans, number> = { none: 0, fade: 0.5, morph: 0.9, slide: 0.65, zoom: 0.55, flip: 0.8 };
export const transDur = (s?: Slide) => (s && s.trans !== 'none' ? s.transDur ?? TRANS_DUR[s.trans] ?? 0.5 : 0);

/** khoá ghép cặp vật giữa 2 trang cho Biến hình: cùng id → cùng vai trò (duy nhất) → cùng nội dung (duy nhất) */
// chữ chỉ ghép khi cùng nội dung (chữ khác nhau thì hoà trộn); hình / khối ghép theo vai trò dù đổi màu, đổi tư thế
const roleKey = (e: El) => (e.role && e.kind !== 'text' && e.role !== 'accent' ? `${e.kind}:r:${e.role}` : null);
export const contentKey = (e: El) => {
  switch (e.kind) {
    case 'text': return e.text.trim() ? `text:${e.text.trim()}` : null;
    case 'img': return `img:${e.src}`;
    case 'shape': return `shape:${e.shape}:${e.text?.trim() ?? ''}:${e.fill}`;
    case 'quiz': return `quiz:${e.q}`;
    default: return null;
  }
};
/** cặp vật (id vật trang mới → vật trang cũ) dùng cho Biến hình */
export function morphPairs(from: Slide, to: Slide): Map<string, El> {
  const pairs = new Map<string, El>();
  const usedOld = new Set<string>();
  const live = (s: Slide) => s.els.filter((e) => !e.hide);
  const A = live(from), B = live(to);
  const byId = new Map(A.map((e) => [e.id, e]));
  for (const e of B) { const o = byId.get(e.id); if (o && o.kind === e.kind) { pairs.set(e.id, o); usedOld.add(o.id); } }
  for (const key of [roleKey, contentKey]) {
    const count = (list: El[]) => { const m = new Map<string, El[]>(); for (const e of list) { const k = key(e); if (k) m.set(k, [...(m.get(k) ?? []), e]); } return m; };
    const oldM = count(A.filter((e) => !usedOld.has(e.id))), newM = count(B.filter((e) => !pairs.has(e.id)));
    for (const [k, list] of newM) { const o = oldM.get(k); if (list.length === 1 && o?.length === 1) { pairs.set(list[0].id, o[0]); usedOld.add(o[0].id); } }
  }
  return pairs;
}
