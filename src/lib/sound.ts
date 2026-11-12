// Âm thanh phản hồi tạo bằng Web Audio, không cần file mp3.

export type SoundName = 'correct' | 'wrong' | 'complete' | 'tick' | 'tickSoft' | 'tickUrgent' | 'warn' | 'timeout' | 'move' | 'capture' | 'check' | 'turn';

type Note = { freq: number; at: number; dur: number; gain?: number; wave?: OscillatorType };

const NOTES: Record<SoundName, Note[]> = {
  correct: [
    { freq: 660, at: 0, dur: 0.12 },
    { freq: 880, at: 0.12, dur: 0.18 },
  ],
  wrong: [
    { freq: 300, at: 0, dur: 0.15 },
    { freq: 240, at: 0.15, dur: 0.22 },
  ],
  // Đồng hồ đếm ngược: "tích" nhẹ mỗi giây, "tích" rõ ở 10 giây cuối, "tít" cao ở 3 giây cuối
  tickSoft: [{ freq: 820, at: 0, dur: 0.05, gain: 0.07, wave: 'triangle' }],
  tick: [{ freq: 1000, at: 0, dur: 0.07, gain: 0.2, wave: 'triangle' }],
  tickUrgent: [
    { freq: 1400, at: 0, dur: 0.07, gain: 0.28, wave: 'square' },
    { freq: 1400, at: 0.12, dur: 0.07, gain: 0.22, wave: 'square' },
  ],
  // Chuông báo còn 10 giây
  warn: [
    { freq: 784, at: 0, dur: 0.16, gain: 0.25 },
    { freq: 988, at: 0.18, dur: 0.22, gain: 0.25 },
  ],
  timeout: [
    { freq: 440, at: 0, dur: 0.15 },
    { freq: 330, at: 0.17, dur: 0.15 },
    { freq: 262, at: 0.34, dur: 0.25 },
  ],
  // Cờ: tiếng đặt quân, ăn quân, chiếu tướng
  move: [{ freq: 220, at: 0, dur: 0.06, gain: 0.35, wave: 'triangle' }],
  capture: [
    { freq: 180, at: 0, dur: 0.05, gain: 0.4, wave: 'triangle' },
    { freq: 320, at: 0.05, dur: 0.07, gain: 0.3, wave: 'triangle' },
  ],
  check: [
    { freq: 880, at: 0, dur: 0.09, gain: 0.25 },
    { freq: 660, at: 0.1, dur: 0.12, gain: 0.25 },
  ],
  // Cờ: tới lượt em (sau khi đối thủ đi)
  turn: [
    { freq: 587, at: 0, dur: 0.1, gain: 0.22, wave: 'triangle' },
    { freq: 880, at: 0.11, dur: 0.16, gain: 0.22, wave: 'triangle' },
  ],
  complete: [
    { freq: 523, at: 0, dur: 0.14 },
    { freq: 659, at: 0.14, dur: 0.14 },
    { freq: 784, at: 0.28, dur: 0.14 },
    { freq: 1047, at: 0.42, dur: 0.3 },
  ],
};

let ctx: AudioContext | null = null;

export function playSound(name: SoundName) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    ctx = ctx ?? new AudioCtor();
    // Safari/iPad và một số bản Chrome tạo AudioContext ở trạng thái "suspended": phải resume mới có tiếng
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime + 0.02;
    // Cờ: tiếng gỗ thật (đặt quân "cộc", ăn quân đập mạnh "CỘC" + nảy) thay cho nốt nhạc
    if (name === 'move') { woodHit(ctx, now, 0.55, 1); return; }
    if (name === 'capture') { woodHit(ctx, now, 1, 0.82); woodHit(ctx, now + 0.075, 0.32, 1.15); return; }
    for (const note of NOTES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.wave ?? 'sine';
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(0.0001, now + note.at);
      // Sóng vuông nghe to hơn: giảm âm lượng để không chói tai
      const peak = (note.gain ?? 0.25) * (note.wave === 'square' ? 0.45 : 1);
      gain.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + note.at);
      osc.stop(now + note.at + note.dur + 0.02);
    }
  } catch {
    // Trình duyệt chặn âm thanh: bỏ qua, không ảnh hưởng bài làm.
  }
}

/**
 * Tiếng gỗ gõ vào gỗ (tổng hợp, không cần file): tiếng "cạch" của mặt gỗ (nhiễu trắng qua lọc dải ~1,4–2 kHz, tắt rất nhanh)
 * + tiếng "cộc" thân gỗ (sóng sin trầm ~150 Hz hạ dần). force: 0–1 độ mạnh, pitch: >1 cao hơn (quân nhỏ / nảy lại).
 */
function woodHit(ac: AudioContext, at: number, force: number, pitch: number) {
  const len = Math.floor(ac.sampleRate * 0.09);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const noise = ac.createBufferSource(); noise.buffer = buf;
  const band = ac.createBiquadFilter(); band.type = 'bandpass'; band.frequency.value = 1500 * pitch; band.Q.value = 2.2;
  const ng = ac.createGain(); ng.gain.value = 0.9 * force;
  noise.connect(band).connect(ng).connect(ac.destination);
  noise.start(at); noise.stop(at + 0.1);
  // Thân gỗ cộng hưởng
  const body = ac.createOscillator(); body.type = 'sine';
  body.frequency.setValueAtTime(190 * pitch, at); body.frequency.exponentialRampToValueAtTime(110 * pitch, at + 0.12);
  const bg = ac.createGain();
  bg.gain.setValueAtTime(0.0001, at); bg.gain.exponentialRampToValueAtTime(0.55 * force, at + 0.004); bg.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  body.connect(bg).connect(ac.destination); body.start(at); body.stop(at + 0.18);
  // Tiếng "tách" cao của mép gỗ
  const click = ac.createOscillator(); click.type = 'triangle'; click.frequency.value = 2600 * pitch;
  const cg = ac.createGain();
  cg.gain.setValueAtTime(0.0001, at); cg.gain.exponentialRampToValueAtTime(0.18 * force, at + 0.002); cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
  click.connect(cg).connect(ac.destination); click.start(at); click.stop(at + 0.04);
}

// ---------------------------------------------------------------------------
// Cài đặt âm thanh đồng hồ đếm ngược (lưu trên trình duyệt của em)
// ---------------------------------------------------------------------------
export type TimerSoundMode = 'off' | 'last10' | 'every';
export const TIMER_SOUND_MODES: { id: TimerSoundMode; label: string; hint: string }[] = [
  { id: 'last10', label: '10 giây cuối', hint: 'Chuông báo khi còn 10 giây, rồi tiếng tích mỗi giây' },
  { id: 'every', label: 'Mỗi giây', hint: 'Tiếng tích nhẹ suốt thời gian làm câu' },
  { id: 'off', label: 'Tắt', hint: 'Chỉ có tiếng báo khi hết giờ' },
];
const TIMER_KEY = 'educhain-timer-sound';
export function readTimerSound(): TimerSoundMode {
  try {
    const v = window.localStorage.getItem(TIMER_KEY);
    return v === 'off' || v === 'every' || v === 'last10' ? v : 'last10';
  } catch {
    return 'last10';
  }
}
export function saveTimerSound(mode: TimerSoundMode) {
  try {
    window.localStorage.setItem(TIMER_KEY, mode);
  } catch {
    // Không lưu được (chế độ riêng tư): chỉ dùng cho lượt này
  }
}

/** Âm thanh cho giây vừa chuyển sang `sec` (số giây còn lại) */
export function timerSoundFor(sec: number, mode: TimerSoundMode): SoundName | null {
  if (mode === 'off' || sec < 1) return null;
  if (sec <= 3) return 'tickUrgent';
  if (sec === 10) return 'warn';
  if (sec < 10) return 'tick';
  return mode === 'every' ? 'tickSoft' : null;
}
