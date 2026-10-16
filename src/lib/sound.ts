// Âm thanh phản hồi tạo bằng Web Audio, không cần file mp3.

export type SoundName = 'correct' | 'wrong' | 'complete' | 'tick' | 'tickSoft' | 'tickUrgent' | 'warn' | 'timeout';

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
