// Nhạc nền vui cho MÀN CHIẾU Đấu tổ / Đấu cặp — tạo bằng Web Audio, không cần file mp3.
// Vòng hợp âm C – Am – F – G, nhịp 124: trống “bùm” mỗi phách, “xì” nhẹ ở nửa phách, bass, và giai điệu rải ngắn.
// Lịch phát dùng cách “nhìn trước” (mỗi 50 ms xếp các nốt của 0,2 giây tới) — không đụng tới React state.
// duck(true) hạ nhỏ nhạc khi đang đọc đề.

let ac: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let nextT = 0;
let step = 0;
let ducked = false;

const BPM = 124;
const EIGHTH = 60 / BPM / 2;
const VOL = 0.11;
// hợp âm (số MIDI): C, Am, F, G — mỗi hợp âm một ô nhịp (8 nốt móc đơn)
const CHORDS = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];
// giai điệu: chỉ số nốt trong hợp âm (lên một quãng tám), -1 = nghỉ
const MELODY = [1, 2, 3, 2, 1, -1, 3, 2, 3, 2, 1, 2, -1, 1, 2, 3];
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  if (!ac) { ac = new C(); master = ac.createGain(); master.gain.value = 0.0001; master.connect(ac.destination); }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}

function tone(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master!); o.start(at); o.stop(at + dur + 0.02);
}
function kick(c: AudioContext, at: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(140, at); o.frequency.exponentialRampToValueAtTime(45, at + 0.12);
  g.gain.setValueAtTime(0.9, at); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  o.connect(g).connect(master!); o.start(at); o.stop(at + 0.18);
}
let noiseBuf: AudioBuffer | null = null;
function hat(c: AudioContext, at: number, vol: number) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.05), c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  }
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = vol;
  s.connect(f).connect(g).connect(master!); s.start(at);
}

function schedule() {
  const c = ac; if (!c) return;
  while (nextT < c.currentTime + 0.2) {
    const bar = Math.floor(step / 8) % CHORDS.length, beat = step % 8, ch = CHORDS[bar];
    if (beat % 2 === 0) kick(c, nextT); else hat(c, nextT, 0.35);
    if (beat === 0 || beat === 3 || beat === 6) tone(c, hz(ch[0]), nextT, EIGHTH * 1.6, 'triangle', 0.5);
    const mi = MELODY[step % MELODY.length];
    if (mi >= 0) tone(c, hz(ch[mi] + 12), nextT, EIGHTH * 0.9, 'square', 0.12);
    nextT += EIGHTH; step++;
  }
}

/** Bật nhạc (gọi sau một lần bấm của cô — trình duyệt chặn âm thanh tự phát) */
export function startMusic() {
  const c = ctx(); if (!c || !master) return;
  if (timer !== null) return;
  nextT = c.currentTime + 0.05;
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.setTargetAtTime(ducked ? VOL * 0.25 : VOL, c.currentTime, 0.15);
  timer = window.setInterval(schedule, 50);
  schedule();
}
/** Tắt nhạc (giảm dần trong ~0,3 giây) */
export function stopMusic() {
  if (timer !== null) { clearInterval(timer); timer = null; }
  if (ac && master) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.08); }
}
/** Hạ nhỏ nhạc khi đang đọc đề */
export function duckMusic(on: boolean) {
  ducked = on;
  if (ac && master && timer !== null) master.gain.setTargetAtTime(on ? VOL * 0.25 : VOL, ac.currentTime, 0.12);
}
