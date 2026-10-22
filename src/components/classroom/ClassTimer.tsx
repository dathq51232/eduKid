'use client';

// Hẹn giờ trên lớp: đồng hồ đếm ngược chiếu bảng với nhiều kiểu hoạt hình (báo thức, đồng hồ cát, ốc sên, tên lửa, vòng sáng),
// chuông khi hết giờ, tích tắc 10 giây cuối. Trạng thái lưu trên máy (localStorage) nên đồng hồ vẫn chạy khi chuyển trang:
// ô nhỏ ở góc màn hình (MiniTimer, gắn trong khung giáo viên) hiện giờ còn lại ở mọi trang.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Maximize, Minimize, Pause, Play, Plus, RotateCcw, Timer, X } from 'lucide-react';
import MiloMascot from '@/components/mascot/MiloMascot';
import {
  TIMER_BELLS, TIMER_KEY, TIMER_LABELS, TIMER_LOOKS, TIMER_PRESETS, addTime, defaultTimer, fmtClock, parseTimer, pauseTimer, resetTimer,
  startTimer, timerLeft, timerPhase, type TimerBell, type TimerLook, type TimerState,
} from '@/lib/classroom/class-tools';

/* ====================================================================== âm thanh (tự tạo bằng Web Audio, không tải file) */
let audio: AudioContext | null = null;
function ac(): AudioContext | null {
  try {
    if (!audio) audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audio.state === 'suspended') void audio.resume();
    return audio;
  } catch { return null; }
}
function tone(freq: number, at: number, dur: number, type: OscillatorType, vol: number, toFreq?: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}
export function playBell(kind: TimerBell) {
  if (kind === 'off') return;
  if (kind === 'keng') {
    // kẻng sắt: các họa âm lệch nhau, ngân dài, gõ 3 tiếng
    for (let i = 0; i < 3; i++) [1, 2.76, 5.4, 8.93].forEach((m, k) => tone(620 * m, i * 0.62, 1.5 - k * 0.25, 'sine', 0.22 / (k + 1)));
  } else if (kind === 'chuong') {
    // chuông báo thức reo: búa gõ nhanh giữa hai chuông, 2 hồi
    for (let i = 0; i < 40; i++) { const at = Math.floor(i / 20) * 1.6 + (i % 20) * 0.065; tone(i % 2 ? 1760 : 1480, at, 0.06, 'square', 0.045); tone(i % 2 ? 3520 : 2960, at, 0.05, 'sine', 0.02); }
  } else {
    // gà gáy "ò ó o o": các đoạn trượt cao độ
    [[0, 0.22, 420, 820], [0.26, 0.22, 640, 980], [0.52, 0.55, 980, 720], [1.1, 0.5, 760, 560]].forEach(([at, d, f, f2]) => {
      tone(f, at, d, 'sawtooth', 0.07, f2); tone(f * 2, at, d, 'sine', 0.035, f2 * 2);
    });
  }
}
export const playTick = (urgent: boolean) => { tone(urgent ? 1400 : 1000, 0, 0.05, 'square', 0.05); tone(urgent ? 2800 : 2000, 0, 0.03, 'sine', 0.02); };
/** cộng điểm: "ting ting" đi lên; trừ điểm: "bụp" trầm */
export const playPop = (up: boolean) => { if (up) { tone(880, 0, 0.12, 'sine', 0.12); tone(1320, 0.08, 0.2, 'sine', 0.1); } else tone(320, 0, 0.22, 'triangle', 0.14, 170); };
const playTing = () => { tone(1320, 0, 0.6, 'sine', 0.12); tone(2640, 0, 0.35, 'sine', 0.04); };

/* ====================================================================== trạng thái dùng chung (lưu trên máy, đồng bộ giữa các trang / tab) */
const EVT = 'gv-hen-gio';
function readTimer(): TimerState { try { return parseTimer(localStorage.getItem(TIMER_KEY)); } catch { return defaultTimer(); } }
function writeTimer(t: TimerState) {
  try { localStorage.setItem(TIMER_KEY, JSON.stringify(t)); } catch { /* chế độ riêng tư */ }
  window.dispatchEvent(new CustomEvent(EVT));
}
/** Đang mở trang Hẹn giờ đầy đủ thì ô nhỏ không phát tiếng (tránh kêu hai lần) */
let panelsOpen = 0;

function useClassTimer(soundOwner: () => boolean) {
  const [t, setT] = useState<TimerState>(defaultTimer);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const lastSec = useRef<number | null>(null);
  const warned = useRef(false);

  useEffect(() => {
    const load = () => setT(readTimer());
    load(); setLoaded(true);
    const onStorage = (e: StorageEvent) => { if (e.key === TIMER_KEY) load(); };
    window.addEventListener(EVT, load);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener(EVT, load); window.removeEventListener('storage', onStorage); };
  }, []);

  const update = useCallback((fn: (x: TimerState) => TimerState) => {
    const next = fn(readTimer());
    setT(next); writeTimer(next);
  }, []);

  // nhịp đồng hồ: 10 lần/giây khi đang chạy
  useEffect(() => {
    if (!t.endsAt) { setNow(Date.now()); return; }
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [t.endsAt]);

  // âm thanh và kết thúc
  const left = timerLeft(t, now);
  useEffect(() => {
    if (!t.endsAt) { lastSec.current = null; warned.current = false; return; }
    const sec = Math.ceil(left);
    const owner = soundOwner();
    if (left <= 0) {
      // hết giờ lúc trang đang mở thì reo; mở lại trang sau khi đã hết giờ lâu rồi thì chỉ dừng, không reo
      const fresh = Date.now() - t.endsAt < 5000;
      if (owner && fresh) playBell(t.bell);
      if (fresh) setJustDone(true);
      update((x) => (x.endsAt === t.endsAt ? { ...x, endsAt: null, left: 0 } : x));
      return;
    }
    if (lastSec.current !== sec) {
      const ph = timerPhase(left, t.total);
      if (owner && ph === 'warn' && !warned.current && t.total >= 30) { warned.current = true; playTing(); }
      if (owner && ph === 'last' && t.tick && lastSec.current !== null) playTick(sec <= 3);
      lastSec.current = sec;
    }
  }, [left, t, update, soundOwner]);

  return { t, left, loaded, update, justDone, clearDone: () => setJustDone(false) };
}

/* ====================================================================== mặt đồng hồ hoạt hình */
const pt = (cx: number, cy: number, r: number, deg: number) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
/** Hình quạt phần thời gian còn lại: từ kim (đã chạy) quay về số 12 */
function wedge(cx: number, cy: number, r: number, frac: number) {
  if (frac >= 0.999) return `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  if (frac <= 0) return '';
  const a = 360 * (1 - frac);
  const [x1, y1] = pt(cx, cy, r, a), [x2, y2] = pt(cx, cy, r, 360);
  return `M${cx},${cy}L${x1},${y1}A${r},${r} 0 ${frac > 0.5 ? 1 : 0},1 ${x2},${y2}Z`;
}

export function TimerFace({ look, left, total, running }: { look: TimerLook; left: number; total: number; running: boolean }) {
  const f = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const ph = timerPhase(left, total);
  const cls = `tf tf-${look} is-${ph}${running ? ' is-running' : ''}`;

  if (look === 'alarm') {
    const [hx, hy] = pt(200, 230, 92, 360 * (1 - f));
    const worried = ph === 'last' || ph === 'done';
    return (
      <svg className={cls} viewBox="0 0 400 420" role="img" aria-label={`Đồng hồ báo thức, còn ${fmtClock(left)}`}>
        <g className="tf-shake">
          <path d="M120 360 L92 404 M280 360 L308 404" stroke="#1e2b4a" strokeWidth="16" strokeLinecap="round" />
          <g className="tf-bell-l"><path d="M60 118 A62 62 0 0 1 150 52 Z" fill="#ffc83d" stroke="#1e2b4a" strokeWidth="9" strokeLinejoin="round" /></g>
          <g className="tf-bell-r"><path d="M340 118 A62 62 0 0 0 250 52 Z" fill="#ffc83d" stroke="#1e2b4a" strokeWidth="9" strokeLinejoin="round" /></g>
          <path d="M200 60 V82" stroke="#1e2b4a" strokeWidth="12" strokeLinecap="round" />
          <circle cx="200" cy="54" r="12" fill="#1e2b4a" />
          <circle cx="200" cy="230" r="158" fill="#ff6b6b" stroke="#1e2b4a" strokeWidth="10" />
          <circle cx="200" cy="230" r="124" fill="#fff" stroke="#1e2b4a" strokeWidth="6" />
          <path d={wedge(200, 230, 112, f)} className="tf-left" />
          {Array.from({ length: 12 }, (_, i) => { const [x1, y1] = pt(200, 230, 112, i * 30), [x2, y2] = pt(200, 230, i % 3 ? 102 : 94, i * 30); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e2b4a" strokeWidth={i % 3 ? 4 : 7} strokeLinecap="round" />; })}
          <g className="tf-eyes">
            <ellipse cx="160" cy="200" rx="15" ry="20" fill="#1e2b4a" /><ellipse cx="240" cy="200" rx="15" ry="20" fill="#1e2b4a" />
            <circle cx="165" cy="193" r="5" fill="#fff" /><circle cx="245" cy="193" r="5" fill="#fff" />
          </g>
          <circle cx="132" cy="246" r="14" fill="#ff9fb0" opacity=".8" /><circle cx="268" cy="246" r="14" fill="#ff9fb0" opacity=".8" />
          {worried ? <ellipse cx="200" cy="270" rx="16" ry="20" fill="#1e2b4a" /> : <path d="M168 258 Q200 292 232 258" fill="none" stroke="#1e2b4a" strokeWidth="9" strokeLinecap="round" />}
          <line x1="200" y1="230" x2={hx} y2={hy} stroke="#1e2b4a" strokeWidth="9" strokeLinecap="round" className="tf-hand" />
          <circle cx="200" cy="230" r="12" fill="#ffc83d" stroke="#1e2b4a" strokeWidth="5" />
        </g>
      </svg>
    );
  }

  if (look === 'sand') {
    const topY = 78 + (1 - f) * 120, botH = (1 - f) * 118;
    return (
      <svg className={cls} viewBox="0 0 300 420" role="img" aria-label={`Đồng hồ cát, còn ${fmtClock(left)}`}>
        <defs>
          <clipPath id="tf-top"><path d="M62 66 H238 Q238 150 158 206 H142 Q62 150 62 66 Z" /></clipPath>
          <clipPath id="tf-bot"><path d="M142 214 H158 Q238 270 238 354 H62 Q62 270 142 214 Z" /></clipPath>
        </defs>
        <g className="tf-shake">
          <rect x="34" y="30" width="232" height="34" rx="14" fill="#c2410c" stroke="#1e2b4a" strokeWidth="8" />
          <rect x="34" y="356" width="232" height="34" rx="14" fill="#c2410c" stroke="#1e2b4a" strokeWidth="8" />
          <path d="M50 64 V356 M250 64 V356" stroke="#9a3412" strokeWidth="12" strokeLinecap="round" />
          <rect x="0" y={topY} width="300" height="140" clipPath="url(#tf-top)" className="tf-sand" />
          <path d={`M62 354 H238 V${354 - botH} Q150 ${354 - botH - 26 * (1 - f)} 62 ${354 - botH} Z`} clipPath="url(#tf-bot)" className="tf-sand" />
          {f > 0 && f < 1 && <line x1="150" y1="206" x2="150" y2={350 - botH} className="tf-stream" />}
          <path d="M62 66 H238 Q238 150 158 206 V214 Q238 270 238 354 H62 Q62 270 142 214 V206 Q62 150 62 66 Z" fill="rgb(180 220 255 / .25)" stroke="#1e2b4a" strokeWidth="8" strokeLinejoin="round" />
          <path d="M84 84 Q86 140 128 178" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity=".7" />
        </g>
      </svg>
    );
  }

  if (look === 'snail') {
    const x = 30 + (1 - f) * 330;
    return (
      <svg className={cls} viewBox="0 0 520 300" role="img" aria-label={`Ốc sên về đích, còn ${fmtClock(left)}`}>
        <rect x="0" y="196" width="520" height="104" rx="26" fill="#86d97a" />
        <rect x="18" y="210" width="484" height="44" rx="22" fill="#e9d8b8" stroke="#1e2b4a" strokeWidth="5" />
        <rect x="40" y="226" width={Math.max(0, x - 10)} height="12" rx="6" fill="#bfe3ff" opacity=".9" />
        <g transform="translate(452 112)">
          <path d="M0 0 V140" stroke="#1e2b4a" strokeWidth="7" strokeLinecap="round" />
          {Array.from({ length: 12 }, (_, i) => <rect key={i} x={(i % 4) * 14} y={Math.floor(i / 4) * 14} width="14" height="14" fill={(i + Math.floor(i / 4)) % 2 ? '#fff' : '#1e2b4a'} />)}
          <rect x="0" y="0" width="56" height="42" fill="none" stroke="#1e2b4a" strokeWidth="4" />
        </g>
        <image href="/emoji/mushroom.png" x="300" y="150" width="54" height="54" />
        <image href="/emoji/blossom.png" x="150" y="168" width="34" height="34" />
        <image href="/emoji/star.png" x="70" y="30" width="36" height="36" className="tf-twinkle" />
        <image href="/emoji/sun-with-face.png" x="380" y="8" width="70" height="70" />
        <g transform={`translate(${x} 130)`}><g className="tf-crawl"><image href="/emoji/snail.png" x="0" y="0" width="96" height="96" transform="translate(96 0) scale(-1 1)" /></g></g>
      </svg>
    );
  }

  if (look === 'rocket') {
    const y = 300 - (1 - f) * 236;
    return (
      <svg className={cls} viewBox="0 0 360 420" role="img" aria-label={`Tên lửa lên mặt trăng, còn ${fmtClock(left)}`}>
        <rect width="360" height="420" rx="28" fill="#14203b" />
        {[[40, 60], [300, 90], [80, 200], [320, 250], [190, 140], [60, 330], [280, 360]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={i % 2 ? 3 : 4} fill="#fff" className="tf-twinkle" style={{ animationDelay: `${i * 0.3}s` }} />)}
        <image href="/emoji/crescent-moon.png" x="236" y="14" width="96" height="96" />
        <path d="M-20 420 Q180 340 380 420 Z" fill="#2f8f5b" />
        <rect x="174" y={y + 112} width="12" height={Math.max(0, 352 - y - 112)} rx="6" fill="#ffffff" opacity=".18" />
        <g transform={`translate(180 ${y})`}>
          <g className="tf-flame"><path d="M-20 106 Q0 170 20 106 Z" fill="#ff9f1c" /><path d="M-10 106 Q0 146 10 106 Z" fill="#ffe08a" /></g>
          <path d="M-34 80 L-56 116 L-26 104 Z M34 80 L56 116 L26 104 Z" fill="#ff6b6b" stroke="#1e2b4a" strokeWidth="5" strokeLinejoin="round" />
          <path d="M0 -8 Q38 30 32 108 H-32 Q-38 30 0 -8 Z" fill="#f4f7fc" stroke="#1e2b4a" strokeWidth="6" strokeLinejoin="round" />
          <circle cx="0" cy="48" r="15" fill="#6bb6ff" stroke="#1e2b4a" strokeWidth="5" />
          <path d="M-14 6 Q0 -8 14 6" fill="#ff6b6b" stroke="#1e2b4a" strokeWidth="5" />
        </g>
      </svg>
    );
  }

  // vòng sáng
  const C = 2 * Math.PI * 170;
  return (
    <svg className={cls} viewBox="0 0 400 400" role="img" aria-label={`Còn ${fmtClock(left)}`}>
      <circle cx="200" cy="200" r="170" fill="none" className="tf-track" strokeWidth="30" />
      <circle cx="200" cy="200" r="170" fill="none" className="tf-ring" strokeWidth="30" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - f)} transform="rotate(-90 200 200)" />
    </svg>
  );
}

/* ====================================================================== trang Hẹn giờ đầy đủ */
export default function ClassTimer({ className }: { className: string }) {
  useEffect(() => { panelsOpen++; return () => { panelsOpen--; }; }, []);
  const { t, left, loaded, update, justDone, clearDone } = useClassTimer(useCallback(() => true, []));
  const root = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [custom, setCustom] = useState(false);
  const [mm, setMm] = useState('5');
  const [ss, setSs] = useState('00');
  const running = !!t.endsAt;
  const ph = timerPhase(left, t.total);
  const done = !running && left <= 0;

  const toggle = useCallback(() => { ac(); clearDone(); update((x) => (x.endsAt ? pauseTimer(x) : startTimer(x))); }, [update, clearDone]);
  const reset = useCallback(() => { clearDone(); update((x) => resetTimer(x)); }, [update, clearDone]);
  const choose = (sec: number) => { clearDone(); setCustom(false); update((x) => resetTimer(x, sec)); };
  const goFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void root.current?.requestFullscreen?.().catch(() => setFull((v) => !v));
  }, []);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  // phím tắt: cách = chạy/dừng, R = làm lại, F = toàn màn hình, +/= thêm 1 phút
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === ' ') { e.preventDefault(); toggle(); }
      else if (e.key === 'r' || e.key === 'R') reset();
      else if (e.key === 'f' || e.key === 'F') goFull();
      else if (e.key === '+' || e.key === '=') update((x) => addTime(x, 60));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, reset, goFull, update]);

  const applyCustom = () => {
    const sec = Math.min(99 * 60 + 59, Math.max(5, (parseInt(mm, 10) || 0) * 60 + (parseInt(ss, 10) || 0)));
    choose(sec);
  };
  const elapsed = Math.max(0, t.total - left);

  return (
    <div ref={root} className={`tmr${full ? ' is-full' : ''} is-${ph}${done ? ' is-done' : ''}`}>
      <div className="tmr-stage">
        <div className="tmr-top">
          <span><Timer aria-hidden="true" /> Hẹn giờ · Lớp {className}</span>
          <span className="tmr-keys">Phím cách: chạy / dừng · R: làm lại · F: toàn màn hình</span>
        </div>
        <input className="tmr-label" value={t.label} maxLength={60} aria-label="Tên hoạt động" placeholder="Tên hoạt động…" list="tmr-labels"
          onChange={(e) => update((x) => ({ ...x, label: e.target.value }))} />
        <datalist id="tmr-labels">{TIMER_LABELS.map((l) => <option key={l} value={l} />)}</datalist>
        <div className={`tmr-face look-${t.look}`}>
          {loaded && <TimerFace look={t.look} left={left} total={t.total} running={running} />}
          <div className="tmr-digits" aria-live="off"><b>{fmtClock(left)}</b>{!done && <span>{running ? 'còn lại' : left < t.total ? 'đang tạm dừng' : 'sẵn sàng'} · {fmtClock(elapsed)} / {fmtClock(t.total)}</span>}</div>
        </div>
        {done && justDone && (
          <div className="tmr-done" role="alert">
            <MiloMascot size={150} />
            <div><b>Hết giờ rồi!</b><span>{t.label || 'Cả lớp'} dừng tay nhé 👏</span></div>
            <button type="button" className="btn btn-primary" onClick={reset}><RotateCcw aria-hidden="true" /> Đặt lại</button>
          </div>
        )}
        <div className="tmr-presets" role="group" aria-label="Chọn thời gian">
          {TIMER_PRESETS.map((sec) => <button key={sec} type="button" className={!custom && t.total === sec ? 'is-on' : ''} onClick={() => choose(sec)} disabled={running}>{sec / 60} phút</button>)}
          <button type="button" className={custom || !TIMER_PRESETS.includes(t.total) ? 'is-on' : ''} onClick={() => { setCustom((v) => !v); setMm(String(Math.floor(t.total / 60))); setSs(String(t.total % 60).padStart(2, '0')); }} disabled={running}>✏️ Tuỳ chỉnh</button>
        </div>
        {custom && !running && (
          <form className="tmr-custom" onSubmit={(e) => { e.preventDefault(); applyCustom(); }}>
            <label><input inputMode="numeric" value={mm} onChange={(e) => setMm(e.target.value.replace(/\D/g, '').slice(0, 2))} aria-label="Số phút" /> phút</label>
            <label><input inputMode="numeric" value={ss} onChange={(e) => setSs(e.target.value.replace(/\D/g, '').slice(0, 2))} aria-label="Số giây" /> giây</label>
            <button type="submit" className="btn btn-primary btn-sm">Đặt</button>
          </form>
        )}
        <div className="tmr-ctl">
          <button type="button" onClick={reset}><RotateCcw aria-hidden="true" /> Làm lại</button>
          <button type="button" className="tmr-go" onClick={toggle}>{running ? <><Pause aria-hidden="true" /> Tạm dừng</> : <><Play aria-hidden="true" /> {left < t.total && left > 0 ? 'Chạy tiếp' : 'Bắt đầu'}</>}</button>
          <button type="button" onClick={() => update((x) => addTime(x, 60))} aria-label="Thêm 1 phút"><Plus aria-hidden="true" /> 1 phút</button>
          <button type="button" onClick={goFull} aria-pressed={full}>{full ? <><Minimize aria-hidden="true" /> Thu nhỏ</> : <><Maximize aria-hidden="true" /> Toàn màn hình</>}</button>
        </div>
      </div>

      <div className="tmr-settings">
        <div className="tmr-looks" role="radiogroup" aria-label="Kiểu đồng hồ">
          {TIMER_LOOKS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={t.look === l.id} className={t.look === l.id ? 'is-on' : ''} onClick={() => update((x) => ({ ...x, look: l.id }))}>
              <span className="tmr-thumb"><TimerFace look={l.id} left={l.id === 'snail' || l.id === 'rocket' ? 140 : 200} total={300} running={false} /></span>{l.label}
            </button>
          ))}
        </div>
        <div className="tmr-sound">
          <label><Bell aria-hidden="true" /> Chuông hết giờ
            <select value={t.bell} onChange={(e) => update((x) => ({ ...x, bell: e.target.value as TimerBell }))}>
              {TIMER_BELLS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => playBell(t.bell === 'off' ? 'keng' : t.bell)}>🔊 Nghe thử</button>
          <label className="tmr-check"><input type="checkbox" checked={t.tick} onChange={(e) => update((x) => ({ ...x, tick: e.target.checked }))} /> Tích tắc 10 giây cuối</label>
          <p className="dash-muted">Đồng hồ vẫn chạy khi thầy cô chuyển sang trang khác — xem ở ô nhỏ góc dưới màn hình.</p>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== ô nhỏ góc màn hình (mọi trang giáo viên) */
export function MiniTimer({ href, hidden }: { href: string | null; hidden: boolean }) {
  const { t, left, loaded, update, justDone, clearDone } = useClassTimer(useCallback(() => panelsOpen === 0, []));
  const running = !!t.endsAt;
  const paused = !running && left > 0 && left < t.total;
  const done = !running && left <= 0;
  if (!loaded || hidden || !(running || paused || (done && justDone))) return null;
  const ph = timerPhase(left, t.total);
  const look = TIMER_LOOKS.find((l) => l.id === t.look);
  const close = () => { clearDone(); update((x) => resetTimer(x)); };
  return (
    <div className={`tmr-mini is-${ph}${done ? ' is-done' : ''}`} role="timer" aria-label={`Hẹn giờ ${t.label}: còn ${fmtClock(left)}`}>
      <span className="tmr-mini-ic" aria-hidden="true">{look?.emoji ?? '⏱️'}</span>
      {href ? <Link href={href} className="tmr-mini-txt"><span>{done ? 'Hết giờ!' : t.label || 'Hẹn giờ'}</span><b>{fmtClock(left)}</b></Link>
        : <span className="tmr-mini-txt"><span>{done ? 'Hết giờ!' : t.label || 'Hẹn giờ'}</span><b>{fmtClock(left)}</b></span>}
      {!done && <button type="button" onClick={() => { ac(); update((x) => (x.endsAt ? pauseTimer(x) : startTimer(x))); }} aria-label={running ? 'Tạm dừng' : 'Chạy tiếp'}>{running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>}
      <button type="button" onClick={close} aria-label="Tắt hẹn giờ"><X aria-hidden="true" /></button>
    </div>
  );
}
