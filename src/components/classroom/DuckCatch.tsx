'use client';

// Gọi tên kiểu "Bịt mắt bắt vịt": cậu bé chăn vịt đội nón lá, cầm roi trong sân tre; mỗi chú vịt mang tên một em.
// Vịt chạy né, thỉnh thoảng trêu "Thầy ơi em đây này!", bị vồ hụt kêu "Hụt rồi!". Hết giờ: bắt được đúng em được chọn.
// Toàn bộ là SVG vẽ tại chỗ (không tải ảnh ngoài); vị trí cập nhật trực tiếp qua ref nên không làm React vẽ lại mỗi khung hình.
import { useEffect, useRef, useState } from 'react';
import type { Student } from '@/lib/classroom/callon';

type Sfx = { quack: () => void; step: (x?: number, heavy?: boolean) => void; whoosh: () => void; cheer: () => void; whistle: () => void };
type P = { x: number; y: number; vx: number; vy: number; face: 1 | -1; miss: number };

const CX = 500, CY = 395, RX = 372, RY = 150; // sân đất trong hàng rào (toạ độ SVG 1000 × 600)
const LINES = ['Thầy ơi em đây này!', 'Cô ơi em đây này!', 'Quạc quạc!', 'Né nè!', 'Bên này nè!', 'Không bắt được đâu!', 'Em chưa học bài đâu!', 'Hì hì!'];
const inside = (x: number, y: number, k = 0.92) => ((x - CX) / RX) ** 2 + ((y - CY) / RY) ** 2 <= k;
const depth = (y: number) => 0.95 + 0.45 * ((y - (CY - RY)) / (2 * RY));
const short = (name: string) => name.trim().split(/\s+/).slice(-2).join(' ');

function seedPositions(n: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const r = (i % 2 ? 0.45 : 0.8) + Math.random() * 0.12;
    out.push({ x: CX + Math.cos(a) * RX * r, y: CY + Math.sin(a) * RY * r, vx: 0, vy: 0, face: Math.cos(a) > 0 ? -1 : 1, miss: 0 });
  }
  return out;
}

export default function DuckCatch({ ducks, target, runKey, seconds, caughtId, onCaught, sfx }: {
  ducks: Student[]; target: Student | null; runKey: number; seconds: number; caughtId: string | null;
  onCaught: (st: Student) => void; sfx: Sfx;
}) {
  const duckRefs = useRef<(SVGGElement | null)[]>([]);
  const kidRef = useRef<SVGGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const pos = useRef<P[]>(seedPositions(ducks.length));
  const kid = useRef({ x: CX, y: CY + 10, face: 1 as 1 | -1, walk: false, catch: false });
  const run = useRef<{ t0: number; T: number; targetIdx: number; goal: number; nextGoal: number; tf: number; from: { x: number; y: number } | null; dFrom: { x: number; y: number } | null; spot: { x: number; y: number } | null; done: boolean; nextStep: number } | null>(null);
  const bubbleRefs = useRef<(SVGGElement | null)[]>([]);
  const [bubbles, setBubbles] = useState<Record<number, string>>({});
  const bubbleTimers = useRef<number[]>([]);
  const sfxRef = useRef(sfx); sfxRef.current = sfx;
  const onCaughtRef = useRef(onCaught); onCaughtRef.current = onCaught;
  const ducksRef = useRef(ducks); ducksRef.current = ducks;

  const say = (i: number, text: string, ms = 1500, quack = true) => {
    setBubbles((b) => ({ ...b, [i]: text }));
    if (quack) sfxRef.current.quack();
    bubbleTimers.current.push(window.setTimeout(() => setBubbles((b) => { const n = { ...b }; if (n[i] === text) delete n[i]; return n; }), ms));
  };
  useEffect(() => () => bubbleTimers.current.forEach(clearTimeout), []);

  // đổi bộ vịt: xếp lại vị trí
  const key = ducks.map((d) => d.id).join(',');
  useEffect(() => { pos.current = seedPositions(ducks.length); setBubbles({}); kid.current = { x: CX, y: CY + 10, face: 1, walk: false, catch: false }; }, [key, ducks.length]);

  // bắt đầu một lượt bắt
  useEffect(() => {
    if (!runKey || !target) return;
    const ti = ducksRef.current.findIndex((d) => d.id === target.id);
    if (ti < 0) return;
    const T = Math.max(3, seconds);
    kid.current.catch = false;
    run.current = { t0: performance.now(), T, targetIdx: ti, goal: -1, nextGoal: 0, tf: Math.max(T * 0.72, T - 2.2), from: null, dFrom: null, spot: null, done: false, nextStep: 0 };
    setBubbles({});
    sfxRef.current.whistle();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi bấm bắt
  }, [runKey]);

  // vòng hoạt hình
  useEffect(() => {
    let raf = 0, last = performance.now(), chatter = performance.now() + 1500, frameNo = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; frameNo++;
      const P = pos.current, K = kid.current, R = run.current;
      const t = R ? (now - R.t0) / 1000 : 0;
      const live = R && !R.done;
      // --- người bắt (bịt mắt)
      if (live) {
        if (t < R.tf) {
          if (t >= R.nextGoal || R.goal < 0 || R.goal >= P.length) {
            const others = P.map((_, i) => i).filter((i) => i !== R.targetIdx);
            R.goal = others.length ? others[Math.floor(Math.random() * others.length)] : R.targetIdx;
            R.nextGoal = t + 1.1 + Math.random() * 0.8;
          }
          const g = P[R.goal];
          const wob = Math.sin(t * 5.3) * 0.6 + Math.sin(t * 2.1) * 0.5; // quờ quạng
          let dx = g.x - K.x, dy = g.y - K.y; const d = Math.hypot(dx, dy) || 1;
          dx /= d; dy /= d;
          const ang = Math.atan2(dy, dx) + wob * 0.6;
          const sp = 170;
          K.x += Math.cos(ang) * sp * dt; K.y += Math.sin(ang) * sp * 0.55 * dt;
          if (Math.abs(Math.cos(ang)) > 0.2) K.face = Math.cos(ang) > 0 ? 1 : -1;
          // vồ hụt
          P.forEach((p, i) => {
            if (i === R.targetIdx || t - p.miss < 1.2) return;
            if (Math.hypot(p.x - K.x, (p.y - K.y) * 1.6) < 60) {
              p.miss = t; const a = Math.atan2(p.y - K.y, p.x - K.x); p.vx = Math.cos(a) * 320; p.vy = Math.sin(a) * 180;
              say(i, 'Hụt rồi!', 1100, false); sfxRef.current.whoosh(); R.nextGoal = t;
            }
          });
        } else {
          // giai đoạn cuối: tiến chắc chắn tới em được chọn, tới nơi đúng lúc hết giờ
          // vịt được chọn chạy ra giữa sân phía trước (cả lớp nhìn rõ), người bắt tiến tới đúng lúc hết giờ
          const g = P[R.targetIdx];
          if (!R.from) { R.from = { x: K.x, y: K.y }; R.dFrom = { x: g.x, y: g.y }; R.spot = { x: CX + (g.x - CX) * 0.35, y: CY + 45 }; }
          const u = Math.min(1, (t - R.tf) / (R.T - R.tf)); const e = u * u * (3 - 2 * u);
          const side = R.from.x < R.spot!.x ? -1 : 1;
          g.x = R.dFrom!.x + (R.spot!.x - R.dFrom!.x) * e; g.y = R.dFrom!.y + (R.spot!.y - R.dFrom!.y) * e; g.vx = (R.spot!.x - R.dFrom!.x) * 0.5; g.vy = 0;
          K.x = R.from.x + (R.spot!.x + side * 92 - R.from.x) * e + Math.sin(t * 6) * 6 * (1 - u);
          K.y = R.from.y + (R.spot!.y + 4 - R.from.y) * e;
          K.face = side < 0 ? 1 : -1;
        }
        if (t >= R.nextStep) { sfxRef.current.step(Math.min(1, t / R.T)); R.nextStep = t + 0.32; }
        K.walk = true;
        if (t >= R.T) {
          R.done = true; K.walk = false; K.catch = true;
          const i = R.targetIdx; say(i, 'Ui, bị bắt rồi!', 2600, true); sfxRef.current.cheer();
          const st = ducksRef.current[i];
          window.setTimeout(() => { if (st) onCaughtRef.current(st); }, 1300);
        }
      } else K.walk = false;

      // --- vịt
      P.forEach((p, i) => {
        const isTarget = R && i === R.targetIdx;
        const caught = (R?.done && isTarget) || (!R && caughtId && ducksRef.current[i]?.id === caughtId);
        if (caught) { p.vx = 0; p.vy = 0; return; }
        if (live && isTarget && t >= R.tf) return; // đang được dẫn ra giữa sân
        // đi lang thang
        if (Math.random() < dt * 0.8) { const a = Math.random() * Math.PI * 2; p.vx += Math.cos(a) * 60; p.vy += Math.sin(a) * 30; }
        // né người bắt
        const dx = p.x - K.x, dy = (p.y - K.y) * 1.6, d = Math.hypot(dx, dy);
        const slow = live && isTarget && t >= R.tf ? Math.max(0.12, 1 - (t - R.tf) / (R.T - R.tf)) : 1;
        if (live && d < 170) { const f = (1 - d / 170) * 520 * slow; p.vx += (dx / (d || 1)) * f * dt; p.vy += (dy / (d || 1)) * f * 0.6 * dt; }
        // nhường chỗ cho màn bắt ở giữa sân
        if (R?.spot && !isTarget) { const sx = p.x - R.spot.x, sy = (p.y - R.spot.y) * 1.6, sd = Math.hypot(sx, sy); if (sd < 190) { p.vx += (sx / (sd || 1)) * 600 * dt; p.vy += (sy / (sd || 1)) * 360 * dt; } }
        // giới hạn tốc độ, ma sát
        const max = (live ? 230 : 70) * slow; const sp = Math.hypot(p.vx, p.vy);
        if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; }
        p.vx *= 1 - dt * 1.4; p.vy *= 1 - dt * 1.4;
        let nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
        if (!inside(nx, ny)) { p.vx = (CX - p.x) * 0.9; p.vy = (CY - p.y) * 0.9; nx = p.x; ny = p.y; }
        // tách nhau ra, không chồng lên nhau
        P.forEach((q, j) => { if (j === i) return; const ex = nx - q.x, ey = (ny - q.y) * 1.6, ed = Math.hypot(ex, ey); if (ed < 74 && ed > 0) { nx += (ex / ed) * 0.8; ny += (ey / ed) * 0.5; } });
        if (inside(nx, ny)) { p.x = nx; p.y = ny; }
        if (Math.abs(p.vx) > 6) p.face = p.vx > 0 ? 1 : -1;
      });

      // trêu chọc thỉnh thoảng
      if (now > chatter && P.length && !R?.done) {
        chatter = now + (live ? 1300 : 3200) + Math.random() * 1200;
        const i = Math.floor(Math.random() * P.length);
        if (!(R?.done && i === R.targetIdx)) say(i, LINES[Math.floor(Math.random() * LINES.length)], 1500, !!live && Math.random() < 0.6);
      }

      // --- vẽ
      P.forEach((p, i) => {
        const el = duckRefs.current[i]; if (!el) return;
        const s = depth(p.y);
        el.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${s.toFixed(3)})`);
        el.style.setProperty('--face', String(p.face));
        el.classList.toggle('is-move', Math.hypot(p.vx, p.vy) > 25);
        el.classList.toggle('is-got', !!R?.done && i === R.targetIdx);
        const b = bubbleRefs.current[i];
        if (b) b.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${s.toFixed(3)})`);
      });
      if (kidRef.current) {
        kidRef.current.setAttribute('transform', `translate(${K.x.toFixed(1)} ${K.y.toFixed(1)}) scale(${(depth(K.y) * 1.3).toFixed(3)})`);
        kidRef.current.style.setProperty('--face', String(K.face));
        kidRef.current.classList.toggle('is-walk', K.walk);
        kidRef.current.classList.toggle('is-catch', K.catch);
      }
      // xếp trước / sau theo chiều sâu
      if (frameNo % 8 === 0 && layerRef.current) {
        const items: [number, Element][] = P.map((p, i) => [p.y + (R?.spot && i === R.targetIdx ? 400 : 0), duckRefs.current[i] as Element]).filter(([, e]) => e) as [number, Element][];
        if (kidRef.current) items.push([K.y + 1, kidRef.current]);
        items.sort((a, b) => a[0] - b[0]).forEach(([, e]) => layerRef.current!.appendChild(e));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [caughtId]);

  // xong lượt (đóng kết quả) thì thả vịt ra lại
  useEffect(() => { if (!caughtId && run.current?.done) { run.current = null; kid.current.catch = false; } }, [caughtId]);

  return (
    <svg className="cd-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Sân chơi bịt mắt bắt vịt">
      <Yard />
      <g ref={layerRef}>
        {ducks.map((d, i) => (
          <g key={d.id} ref={(el) => { duckRefs.current[i] = el; }} className={`cd-duck${caughtId === d.id ? ' is-caught' : ''}`}>
            <ellipse cx="0" cy="2" rx="30" ry="8" fill="rgb(70 50 20 / .18)" />
            <g className="cd-flip"><g className="cd-waddle"><image href="/edu-icons/duck.webp" x="-41" y="-82" width="82" height="82" /></g></g>
            <g transform="translate(0 -92)">
              <rect x={-(short(d.name).length * 4.6 + 12)} y="-13" width={short(d.name).length * 9.2 + 24} height="24" rx="10" fill="#ffffff" stroke="#2457c5" strokeWidth="2.5" />
              <text x="0" y="4" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1b2a47">{short(d.name)}</text>
            </g>
          </g>
        ))}
        <g ref={kidRef} className="cd-kid"><g className="cd-flip"><Kid /></g></g>
      </g>
      <FenceFront />
      {/* lời trêu của vịt: luôn nằm trên cùng để không bị che */}
      <g>{ducks.map((d, i) => <g key={d.id} ref={(el) => { bubbleRefs.current[i] = el; }}>{bubbles[i] && <Bubble text={bubbles[i]} />}</g>)}</g>
    </svg>
  );
}

function Bubble({ text }: { text: string }) {
  const w = Math.max(70, text.length * 9.6 + 26);
  return (
    <g className="cd-bubble" transform="translate(34 -150)">
      <path d={`M0 0 h${w} a14 14 0 0 1 14 14 v20 a14 14 0 0 1 -14 14 h${-w + 34} l-22 18 l4 -18 h-16 a14 14 0 0 1 -14 -14 v-20 a14 14 0 0 1 14 -14z`} fill="#ffffff" stroke="#1b2a47" strokeWidth="2.5" />
      <text x={w / 2} y="30" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1b2a47">{text}</text>
    </g>
  );
}

/** Cậu bé chăn vịt phong cách tranh thiếu nhi: nón lá, áo bà ba, chân đất và cầm roi tre. */
function Kid() {
  return (
    <g>
      <ellipse cx="2" cy="2" rx="46" ry="9" fill="rgb(70 50 20 / .22)"/>
      {/* chân sau */}
      <g className="cd-leg1">
        <path d="M-7 -54 C-18 -43 -28 -32 -36 -22 L-25 -14 C-13 -24 -3 -34 8 -45 Z" fill="#39302a"/>
        <path d="M-35 -23 L-47 -7 L-39 -2 L-25 -15 Z" fill="#e8b48a"/>
        <path d="M-48 -7 Q-54 -3 -51 1 Q-40 4 -31 0 L-34 -6 Z" fill="#f0c19a"/>
        <path d="M-35 -22 l9 7" stroke="#a49a8d" strokeWidth="4" strokeLinecap="round"/>
      </g>
      {/* chân trước */}
      <g className="cd-leg2">
        <path d="M1 -54 C15 -47 31 -39 39 -28 L31 -18 C20 -25 6 -32 -9 -41 Z" fill="#45403a"/>
        <path d="M31 -23 L38 -27 L48 -7 L40 -3 Z" fill="#e8b48a"/>
        <path d="M40 -7 Q50 -10 59 -4 Q52 3 39 1 L35 -3 Z" fill="#f0c19a"/>
        <path d="M32 -21 l9 5" stroke="#a49a8d" strokeWidth="4" strokeLinecap="round"/>
      </g>
      {/* tay sau đưa ra chào đàn vịt */}
      <g className="cd-arm-back">
        <path d="M7 -98 C23 -103 39 -104 54 -101" stroke="#75543a" strokeWidth="13" strokeLinecap="round" fill="none"/>
        <path d="M49 -102 L65 -103" stroke="#f0c19a" strokeWidth="10" strokeLinecap="round"/>
        <path d="M63 -109 l2 -9 M67 -108 l5 -9 M70 -104 l8 -7 M71 -100 l10 -3 M69 -97 l8 1" stroke="#f0c19a" strokeWidth="3.5" strokeLinecap="round"/>
      </g>
      {/* thân áo bà ba */}
      <path d="M-17 -105 Q0 -114 19 -104 C25 -88 27 -69 25 -53 Q2 -46 -24 -54 C-24 -72 -23 -91 -17 -105 Z" fill="#79563a" stroke="#5d402e" strokeWidth="2"/>
      <path d="M-13 -101 Q0 -91 8 -77 L-1 -70 L-15 -84 M8 -77 Q17 -86 21 -99" fill="none" stroke="#a77c56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 -102 L5 -91 L11 -103" stroke="#e1c49b" strokeWidth="2" fill="none"/>
      <circle cx="7" cy="-84" r="1.8" fill="#e7cda6"/>
      <circle cx="9" cy="-72" r="1.8" fill="#e7cda6"/>
      {/* thắt lưng vải trắng ngà + nút buộc */}
      <path d="M-24 -59 Q0 -52 25 -60 L25 -52 Q0 -45 -24 -52 Z" fill="#eee5d1" stroke="#d5c7ac" strokeWidth="1.5"/>
      <path d="M-18 -55 Q-28 -44 -31 -34 L-24 -30 Q-18 -43 -9 -50 M-18 -54 Q-21 -43 -14 -34 L-8 -37 L-11 -52" fill="#eee5d1" stroke="#d5c7ac" strokeWidth="1.5"/>
      {/* Tay trước nắm roi tre chéo */}
      <g className="cd-arm-stick">
        <path d="M-38 -18 Q10 -57 76 -107" stroke="#79502b" strokeWidth="7" strokeLinecap="round" fill="none"/>
        <path d="M-38 -18 Q10 -57 76 -107" stroke="#e4c27e" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M10 -96 Q28 -92 44 -82" stroke="#79563a" strokeWidth="14" strokeLinecap="round" fill="none"/>
        <path d="M40 -84 Q51 -77 61 -70" stroke="#f0c19a" strokeWidth="11" strokeLinecap="round"/>
        <path d="M52 -78 Q61 -78 66 -71 M50 -74 Q59 -72 64 -66 M48 -70 Q57 -67 61 -61" stroke="#e8b48a" strokeWidth="3" strokeLinecap="round"/>
      </g>
      {/* đầu */}
      <ellipse cx="8" cy="-126" rx="28" ry="29" fill="#f1bd96" stroke="#bb8569" strokeWidth="1.5"/>
      <ellipse cx="-19" cy="-125" rx="5" ry="8" fill="#e8b48a" stroke="#bb8569" strokeWidth="1"/>
      <path d="M-19 -143 Q-12 -160 5 -155 Q14 -159 23 -152 Q34 -148 36 -136 Q28 -143 20 -140 Q14 -132 9 -141 Q3 -131 -3 -141 Q-12 -132 -18 -137 Z" fill="#38251c"/>
      <path d="M-9 -132 Q-4 -136 1 -132 M17 -132 Q22 -136 27 -132" stroke="#493024" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="-4" cy="-125" rx="5" ry="7" fill="#fff"/>
      <ellipse cx="21" cy="-125" rx="5" ry="7" fill="#fff"/>
      <circle cx="-2" cy="-124" r="2.8" fill="#33241c"/>
      <circle cx="23" cy="-124" r="2.8" fill="#33241c"/>
      <circle cx="-1" cy="-126" r="1" fill="#fff"/>
      <circle cx="24" cy="-126" r="1" fill="#fff"/>
      <ellipse cx="-11" cy="-115" rx="6" ry="3.5" fill="#ef8e7d" opacity=".55"/>
      <ellipse cx="29" cy="-115" rx="6" ry="3.5" fill="#ef8e7d" opacity=".55"/>
      {/* Nụ cười */}
      <path d="M4 -113 Q12 -104 22 -113" fill="#8c3d32"/>
      <path d="M6 -113 Q12 -107 20 -113" stroke="#fff1df" strokeWidth="2" fill="none"/>
      {/* nón lá */}
      <g transform="translate(0 4) rotate(-5 8 -148)">
        <path d="M-61 -133 Q-48 -151 8 -189 Q63 -150 75 -132 Q22 -126 -61 -133 Z" fill="#ead5a0" stroke="#a98248" strokeWidth="3"/>
        <path d="M-52 -134 Q7 -141 66 -133 M-35 -145 L8 -187 M-14 -139 L8 -187 M10 -137 L8 -187 M34 -136 L8 -187 M55 -134 L8 -187" stroke="#c2a067" strokeWidth="1.8" fill="none"/>
        <path d="M-40 -148 Q7 -137 51 -146 M-22 -160 Q8 -148 34 -158 M-4 -174 Q9 -170 21 -175" stroke="#c2a067" strokeWidth="1.5" fill="none"/>
        <path d="M-61 -133 Q5 -124 75 -132" stroke="#8f6c3e" strokeWidth="3" fill="none"/>
      </g>
    </g>
  );
}

/** Nền: trời, cánh đồng, đình làng, rơm, cờ đuôi nheo, phần hàng rào phía sau và sân đất */
function Yard() {
  const posts = (front: boolean) => Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2; const s = Math.sin(a);
    if (front ? s < 0.05 : s >= 0.05) return null;
    const x = CX + Math.cos(a) * (RX + 34), y = CY + s * (RY + 24);
    return <g key={i}><rect x={x - 7} y={y - 46} width="14" height="50" rx="4" fill="#a8743f" /><ellipse cx={x} cy={y - 46} rx="7" ry="3" fill="#d6a46b" /></g>;
  });
  return (
    <g>
      <defs>
        <linearGradient id="cd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe9ff" /><stop offset="1" stopColor="#f2f8e9" /></linearGradient>
        <radialGradient id="cd-dirt" cx=".5" cy=".45" r=".6"><stop offset="0" stopColor="#e8cfa2" /><stop offset="1" stopColor="#d2b07c" /></radialGradient>
      </defs>
      <rect width="1000" height="600" fill="url(#cd-sky)" />
      <path d="M0 150 q250 -40 500 -10 t500 -6 v466 h-1000z" fill="#a7d07a" />
      <path d="M0 175 q300 -30 600 -6 t400 0 v431 h-1000z" fill="#8fc463" />
      {/* đình làng */}
      <g transform="translate(560 60)">
        <rect x="-150" y="70" width="300" height="20" fill="#d6c3a5" />
        {[-120, -60, 0, 60, 120].map((x) => <rect key={x} x={x - 6} y="30" width="12" height="42" fill="#8a3b1e" />)}
        <path d="M-180 34 L-140 -4 H140 L180 34z" fill="#c2410c" /><path d="M-180 34 H180" stroke="#7c2d12" strokeWidth="5" />
        <path d="M-140 -4 q-20 -12 -26 -4 M140 -4 q20 -12 26 -4" stroke="#c2410c" strokeWidth="6" fill="none" />
      </g>
      {/* rơm, bù nhìn, chum */}
      {[[110, 150, 1], [175, 165, 0.8], [880, 140, 1.1]].map(([x, y, s], i) => <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><path d="M-38 30 q0 -50 38 -60 q38 10 38 60z" fill="#e2b04a" /><path d="M-30 10 h60 M-34 22 h68" stroke="#c9952f" strokeWidth="3" /></g>)}
      <g transform="translate(60 120)"><rect x="-3" y="-10" width="6" height="70" fill="#7a5232" /><path d="M-30 0 h60" stroke="#7a5232" strokeWidth="5" /><path d="M-14 -4 h28 v40 h-28z" fill="#b45309" /><circle cx="0" cy="-16" r="10" fill="#f2c9a0" /><path d="M-22 -18 L0 -40 L22 -18z" fill="#e9d29a" /></g>
      {[[930, 230], [965, 250]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="26" ry="30" fill="#a0522d" /><ellipse cx={x} cy={y - 26} rx="16" ry="5" fill="#7a3a1d" /></g>)}
      {/* cờ đuôi nheo */}
      <path d="M40 70 Q300 110 520 72 T980 80" stroke="#7a5232" strokeWidth="2" fill="none" />
      {Array.from({ length: 16 }, (_, i) => { const x = 60 + i * 58; const y = 78 + Math.sin(i * 0.55) * 14 + (i < 8 ? i * 1.5 : (16 - i) * 1.5); const c = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7'][i % 5]; return <path key={i} d={`M${x - 13} ${y} L${x + 13} ${y} L${x} ${y + 26}z`} fill={c} />; })}
      {/* lá chuối hai bên */}
      <path d="M-20 600 q40 -170 120 -230 q-30 90 -40 230z" fill="#3f9a4f" /><path d="M1020 600 q-40 -170 -120 -230 q30 90 40 230z" fill="#3f9a4f" />
      {/* sân đất + hàng rào phía sau */}
      <ellipse cx={CX} cy={CY + 8} rx={RX + 30} ry={RY + 22} fill="#c49a62" />
      <ellipse cx={CX} cy={CY} rx={RX + 22} ry={RY + 14} fill="url(#cd-dirt)" />
      {posts(false)}
      <path d={`M${CX - RX - 34} ${CY - 18} A${RX + 34} ${RY + 24} 0 0 1 ${CX + RX + 34} ${CY - 18}`} stroke="#c8935a" strokeWidth="8" fill="none" />
      <path d={`M${CX - RX - 34} ${CY - 4} A${RX + 34} ${RY + 24} 0 0 1 ${CX + RX + 34} ${CY - 4}`} stroke="#b7834d" strokeWidth="7" fill="none" />
    </g>
  );
}
function FenceFront() {
  const posts = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2; const s = Math.sin(a);
    if (s < 0.05) return null;
    const x = CX + Math.cos(a) * (RX + 34), y = CY + s * (RY + 24);
    return <g key={i}><rect x={x - 9} y={y - 56} width="18" height="62" rx="5" fill="#b07a45" /><ellipse cx={x} cy={y - 56} rx="9" ry="4" fill="#dcae74" /></g>;
  });
  return (
    <g pointerEvents="none">
      <path d={`M${CX - RX - 34} ${CY - 18} A${RX + 34} ${RY + 24} 0 0 0 ${CX + RX + 34} ${CY - 18}`} stroke="#c8935a" strokeWidth="9" fill="none" transform="translate(0 6)" />
      {posts}
      <path d={`M${CX - RX - 34} ${CY - 2} A${RX + 34} ${RY + 24} 0 0 0 ${CX + RX + 34} ${CY - 2}`} stroke="#d4a066" strokeWidth="9" fill="none" transform="translate(0 4)" />
      <path d="M-30 600 q60 -120 150 -150 q-40 70 -50 150z" fill="#2f8f4e" opacity=".9" />
      <path d="M1030 600 q-60 -120 -150 -150 q40 70 50 150z" fill="#2f8f4e" opacity=".9" />
    </g>
  );
}
