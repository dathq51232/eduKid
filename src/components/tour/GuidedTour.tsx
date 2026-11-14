'use client';

// Hướng dẫn từng bước lần đầu đăng nhập: làm tối màn hình, chừa sáng đúng phần tử đang giới thiệu (data-tour="…"),
// thẻ mô tả đặt cạnh, bấm "Tiếp theo" sang bước kế. Nội dung ở src/lib/tour/steps.ts.
// Đã xem: lưu ở profiles.tours (migration 0055, hàm my_tours / mark_tour) và localStorage dự phòng.
// Hiệu năng: vị trí vùng sáng / thẻ ghi thẳng vào style (không setState theo khung hình khi cuộn).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, Sparkles, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TOURS, type TourId, type TourStep } from '@/lib/tour/steps';

const LOCAL = 'gt-da-xem';
const SNOOZE = 'gt-de-sau:';
const START = 'gt:start';
const GAP = 12;

function readLocal(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LOCAL) ?? '{}') as Record<string, string>; } catch { return {}; }
}
function markLocal(id: string) {
  try { localStorage.setItem(LOCAL, JSON.stringify({ ...readLocal(), [id]: new Date().toISOString() })); } catch { /* bỏ qua */ }
}

/** Phần tử data-tour đang hiện trên màn hình (bỏ qua bản bị ẩn, ví dụ menu trái đã thu vào ngăn kéo trên điện thoại) */
function findTarget(name: string): HTMLElement | null {
  const vw = window.innerWidth;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour~="${name}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.right <= 0 || r.left >= vw) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    return el;
  }
  return null;
}

/** Mở lại hướng dẫn của trang đang xem */
export function startTour() { window.dispatchEvent(new Event(START)); }

/** Nút "?" xem lại hướng dẫn; cũng là đích của bước cuối (data-tour="huong-dan") */
export function TourHelpButton({ className = 'gt-help', label }: { className?: string; label?: string }) {
  return (
    <button type="button" data-tour="huong-dan" className={className} onClick={startTour} aria-label="Xem hướng dẫn sử dụng" title="Xem hướng dẫn sử dụng">
      <CircleHelp aria-hidden="true" />{label && <span>{label}</span>}
    </button>
  );
}

export default function GuidedTour({ id, auto = true }: { id: TourId; auto?: boolean }) {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [i, setI] = useState(0);
  const veil = useRef<HTMLDivElement>(null);
  const spot = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const backTo = useRef<HTMLElement | null>(null);

  const begin = useCallback(() => {
    const list = TOURS[id].filter((s) => !s.target || findTarget(s.target));
    if (!list.length) return;
    backTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setI(0);
    setSteps(list);
  }, [id]);

  const close = useCallback((mode: 'done' | 'later') => {
    setSteps(null);
    if (mode === 'done') {
      markLocal(id);
      try { void createClient().rpc('mark_tour', { p_key: id }).then(() => undefined); } catch { /* chưa cấu hình Supabase */ }
    } else {
      try { sessionStorage.setItem(SNOOZE + id, '1'); } catch { /* bỏ qua */ }
    }
    backTo.current?.focus?.({ preventScroll: true });
  }, [id]);

  // Lần đầu: tự mở nếu chưa xem (máy này hoặc tài khoản) và chưa bấm "Để sau" trong phiên này
  useEffect(() => {
    if (!auto || readLocal()[id]) return;
    try { if (sessionStorage.getItem(SNOOZE + id)) return; } catch { /* bỏ qua */ }
    let stop = false;
    let timer = 0;
    void (async () => {
      let seen = false;
      try {
        const { data, error } = await createClient().rpc('my_tours');
        seen = !error && !!data && typeof data === 'object' && id in (data as Record<string, unknown>);
      } catch { /* chưa chạy migration 0055 / chưa cấu hình: dùng localStorage */ }
      if (stop) return;
      if (seen) { markLocal(id); return; }
      timer = window.setTimeout(() => { if (!stop) begin(); }, 700); // chờ trang vẽ xong
    })();
    return () => { stop = true; window.clearTimeout(timer); };
  }, [auto, id, begin]);

  useEffect(() => {
    const f = () => begin();
    window.addEventListener(START, f);
    return () => window.removeEventListener(START, f);
  }, [begin]);

  const step = steps?.[i];
  const n = steps?.length ?? 0;
  const first = i === 0;
  const last = i === n - 1;
  const next = useCallback(() => { if (last) close('done'); else setI((k) => k + 1); }, [last, close]);
  const prev = useCallback(() => setI((k) => Math.max(0, k - 1)), []);

  // Đặt vùng sáng + thẻ theo phần tử của bước hiện tại; theo dõi cuộn / đổi cỡ (gom theo requestAnimationFrame)
  useLayoutEffect(() => {
    if (!step) return;
    const el = step.target ? findTarget(step.target) : null;
    const place = () => {
      const v = veil.current, s = spot.current, c = card.current;
      if (!v || !s || !c) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const cw = c.offsetWidth, ch = c.offsetHeight;
      const clampX = (x: number) => Math.max(GAP, Math.min(x, vw - cw - GAP));
      const clampY = (y: number) => Math.max(GAP, Math.min(y, vh - ch - GAP));
      let x = (vw - cw) / 2, y = (vh - ch) / 2;
      if (el) {
        const r = el.getBoundingClientRect();
        const pad = 6;
        const b = { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
        s.style.transform = `translate(${b.x}px, ${b.y}px)`;
        s.style.width = `${b.w}px`;
        s.style.height = `${b.h}px`;
        s.style.opacity = '1';
        v.classList.remove('is-dim');
        const below = vh - (b.y + b.h), above = b.y, right = vw - (b.x + b.w), left = b.x;
        const midX = b.x + b.w / 2 - cw / 2, midY = b.y + b.h / 2 - ch / 2;
        const narrowLeft = b.x + b.w < vw * 0.35; // mục ở cột menu trái: đặt thẻ bên phải
        if (vw < 600) { x = (vw - cw) / 2; y = b.y + b.h / 2 > vh / 2 ? GAP : vh - ch - GAP; }
        else if (narrowLeft && right >= cw + GAP * 2) { x = b.x + b.w + GAP; y = midY; }
        else if (below >= ch + GAP * 2) { x = midX; y = b.y + b.h + GAP; }
        else if (above >= ch + GAP * 2) { x = midX; y = b.y - ch - GAP; }
        else if (right >= cw + GAP * 2) { x = b.x + b.w + GAP; y = midY; }
        else if (left >= cw + GAP * 2) { x = b.x - cw - GAP; y = midY; }
        else { x = (vw - cw) / 2; y = vh - ch - GAP; }
      } else {
        s.style.opacity = '0';
        v.classList.add('is-dim');
      }
      c.style.transform = `translate(${Math.round(clampX(x))}px, ${Math.round(clampY(y))}px)`;
      if (!c.dataset.on) requestAnimationFrame(() => { c.dataset.on = '1'; s.dataset.on = '1'; }); // bật chuyển động sau lần đặt đầu
    };
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 64 || r.bottom > window.innerHeight - 24) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    place();
    let raf = 0;
    const queue = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; place(); }); };
    window.addEventListener('scroll', queue, { capture: true, passive: true });
    window.addEventListener('resize', queue);
    const ro = new ResizeObserver(queue);
    if (el) ro.observe(el);
    if (card.current) ro.observe(card.current);
    primary.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', queue, { capture: true });
      window.removeEventListener('resize', queue);
      ro.disconnect();
    };
  }, [step]);

  // Bàn phím: Esc thoát, ← → qua lại, Tab chỉ đi trong thẻ
  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(first && !last ? 'later' : 'done'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Tab' && card.current) {
        const f = [...card.current.querySelectorAll<HTMLElement>('button')];
        if (!f.length) return;
        const at = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, first, last, next, prev, close]);

  if (!step || !steps) return null;
  return createPortal(
    <div className="gt">
      <div ref={veil} className="gt-veil" aria-hidden="true" />
      <div ref={spot} className="gt-spot" aria-hidden="true" />
      <div ref={card} className="gt-card" role="dialog" aria-modal="true" aria-labelledby="gt-title" aria-describedby="gt-body">
        <button type="button" className="gt-x" aria-label="Đóng hướng dẫn" onClick={() => close(first && !last ? 'later' : 'done')}><X aria-hidden="true" /></button>
        {first && <span className="gt-badge" aria-hidden="true"><Sparkles /></span>}
        <p className="gt-count">{first && n > 1 ? `Khoảng 1 phút · ${n - 1} bước` : `Bước ${i} / ${n - 1}`}</p>
        <h2 id="gt-title">{step.title}</h2>
        <p id="gt-body" className="gt-body" aria-live="polite">{step.body}</p>
        {n > 1 && (
          <div className="gt-dots" aria-hidden="true">
            {steps.slice(1).map((_, k) => <i key={k} className={k + 1 === i ? 'is-on' : k + 1 < i ? 'is-done' : ''} />)}
          </div>
        )}
        <div className="gt-btns">
          {first && !last ? (
            <>
              <button type="button" className="gt-ghost" onClick={() => close('later')}>Để sau</button>
              <button ref={primary} type="button" className="gt-next" onClick={next}>Bắt đầu xem</button>
            </>
          ) : (
            <>
              {!last && <button type="button" className="gt-skip" onClick={() => close('done')}>Bỏ qua</button>}
              <span className="gt-sp" />
              {!first && <button type="button" className="gt-ghost" onClick={prev}>Quay lại</button>}
              <button ref={primary} type="button" className="gt-next" onClick={next}>{last ? 'Xong, bắt đầu thôi!' : 'Tiếp theo'}</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
