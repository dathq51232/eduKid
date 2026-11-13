// Âm thanh cho bài thao giảng: thư viện âm tạo trực tiếp bằng Web Audio (không cần tải file, không bản quyền)
// + âm thanh cô tự ghi / tải lên (lưu trong Kho của tôi, phát qua đường dẫn ký).
import { createClient } from '@/lib/supabase/client';

export const SOUNDS: { id: string; icon: string; label: string }[] = [
  { id: 'clap', icon: '👏', label: 'Vỗ tay' }, { id: 'ding', icon: '✅', label: 'Đúng rồi' }, { id: 'wrong', icon: '❌', label: 'Thử lại' },
  { id: 'tada', icon: '🎉', label: 'Ta-da' }, { id: 'drum', icon: '🥁', label: 'Trống' }, { id: 'boing', icon: '🦘', label: 'Boing' },
  { id: 'pop', icon: '🫧', label: 'Bóp' }, { id: 'whoosh', icon: '💨', label: 'Vút' }, { id: 'bell', icon: '🔔', label: 'Chuông' },
  { id: 'magic', icon: '🪄', label: 'Phép màu' }, { id: 'tick', icon: '⏱', label: 'Tích tắc' }, { id: 'star', icon: '⭐', label: 'Sao thưởng' },
];
export const soundLabel = (s?: string) => (!s ? '' : s.startsWith('asset:') ? '🎙 Âm thanh của cô' : (SOUNDS.find((x) => x.id === s)?.label ?? s));

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.8;
function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C(); master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
export function setVolume(v: number) { volume = Math.min(1, Math.max(0, v)); if (master) master.gain.value = volume; audios.forEach((a) => { a.volume = volume; }); }
export const getVolume = () => volume;

function tone(c: AudioContext, t: number, f0: number, f1: number, dur: number, type: OscillatorType = 'sine', g = 0.3) {
  const o = c.createOscillator(), a = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.01); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(a).connect(master!); o.start(t); o.stop(t + dur + 0.02);
}
function noise(c: AudioContext, t: number, dur: number, g = 0.3, hp = 800, lp = 8000) {
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = c.createBufferSource(), a = c.createGain(), h = c.createBiquadFilter(), l = c.createBiquadFilter();
  s.buffer = buf; h.type = 'highpass'; h.frequency.value = hp; l.type = 'lowpass'; l.frequency.value = lp; a.gain.value = g;
  s.connect(h).connect(l).connect(a).connect(master!); s.start(t);
}

const audios = new Set<HTMLAudioElement>();
const signed = new Map<string, string>();
/** Chiếu khi mất mạng: âm thanh của cô lấy từ tệp đã lưu trên máy thay vì đường dẫn ký */
let localResolver: ((path: string) => string | undefined) | null = null;
export function setLocalSoundResolver(fn: ((path: string) => string | undefined) | null) { localResolver = fn; }
async function urlOf(path: string): Promise<string | null> {
  const local = localResolver?.(path);
  if (local) return local;
  if (signed.has(path)) return signed.get(path)!;
  const { data } = await createClient().storage.from('teacher-assets').createSignedUrl(path, 3600);
  if (data?.signedUrl) signed.set(path, data.signedUrl);
  return data?.signedUrl ?? null;
}

/** Phát một âm thanh (tên trong thư viện hoặc "asset:<đường dẫn>") */
export function playSound(id?: string) {
  if (!id) return;
  if (id.startsWith('asset:')) {
    void urlOf(id.slice(6)).then((u) => { if (!u) return; const a = new Audio(u); a.volume = volume; audios.add(a); a.onended = () => audios.delete(a); void a.play().catch(() => audios.delete(a)); });
    return;
  }
  const c = ac(); if (!c || !master) return;
  const t = c.currentTime + 0.01;
  switch (id) {
    case 'clap': for (let i = 0; i < 9; i++) noise(c, t + i * 0.11 + Math.random() * 0.04, 0.09, 0.45, 900, 6000); break;
    case 'ding': tone(c, t, 880, 880, 0.18, 'triangle', 0.3); tone(c, t + 0.12, 1318, 1318, 0.45, 'triangle', 0.3); break;
    case 'wrong': tone(c, t, 220, 180, 0.22, 'square', 0.12); tone(c, t + 0.22, 180, 140, 0.32, 'square', 0.12); break;
    case 'tada': [523, 659, 784, 1046].forEach((f, i) => tone(c, t + i * 0.09, f, f, i === 3 ? 0.7 : 0.16, 'triangle', 0.25)); break;
    case 'drum': for (let i = 0; i < 14; i++) noise(c, t + i * 0.06, 0.07, 0.25 + i * 0.02, 60, 900); noise(c, t + 0.9, 0.4, 0.6, 40, 2500); break;
    case 'boing': tone(c, t, 160, 620, 0.45, 'sine', 0.35); break;
    case 'pop': tone(c, t, 900, 200, 0.08, 'sine', 0.4); break;
    case 'whoosh': noise(c, t, 0.45, 0.35, 400, 3000); break;
    case 'bell': tone(c, t, 1046, 1040, 1.2, 'sine', 0.3); tone(c, t, 2093, 2090, 0.8, 'sine', 0.08); break;
    case 'magic': for (let i = 0; i < 8; i++) tone(c, t + i * 0.06, 1200 + i * 180, 1400 + i * 180, 0.25, 'sine', 0.12); break;
    case 'tick': for (let i = 0; i < 4; i++) tone(c, t + i * 0.5, i % 2 ? 1500 : 1900, 1500, 0.05, 'square', 0.08); break;
    case 'star': tone(c, t, 1318, 1318, 0.12, 'triangle', 0.25); tone(c, t + 0.1, 1760, 1760, 0.12, 'triangle', 0.25); tone(c, t + 0.2, 2637, 2637, 0.4, 'triangle', 0.2); break;
  }
}
export function stopSounds() { audios.forEach((a) => a.pause()); audios.clear(); }
