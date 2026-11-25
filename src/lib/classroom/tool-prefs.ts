// Tuỳ chỉnh công cụ của thầy cô (lưu trên máy này): GHIM tối đa 6 công cụ hay dùng (hiện ở trang Hôm nay)
// và ẨN công cụ không dùng (ẩn khỏi menu; vẫn mở được bằng Ctrl+K). Đổi ở một tab thì các tab khác cập nhật theo.
import { useSyncExternalStore } from 'react';
import { TOOLS, type KhuKey, type ToolKey, khuOfGroup } from '@/lib/classroom/teacher-nav';

export const MAX_PINS = 6;
const PIN_KEY = 'gv-ghim';
const HIDE_KEY = 'gv-an';
const EVT = 'gv-tool-prefs';
/** Không cho ẩn: trang lớp (thêm học sinh, mã lớp) */
export const UNHIDEABLE: ToolKey[] = ['lop'];

export type ToolPrefs = { pins: ToolKey[]; hidden: ToolKey[] };
const EMPTY: ToolPrefs = { pins: [], hidden: [] };
const valid = new Set<string>(TOOLS.map((t) => t.key));

function readList(key: string): ToolKey[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(v) ? (v.filter((k) => typeof k === 'string' && valid.has(k)) as ToolKey[]) : [];
  } catch { return []; }
}

// useSyncExternalStore cần trả cùng một đối tượng khi dữ liệu không đổi
let cache: ToolPrefs = EMPTY;
let cacheRaw = '';
function snapshot(): ToolPrefs {
  let raw = '';
  try { raw = `${localStorage.getItem(PIN_KEY) ?? ''}|${localStorage.getItem(HIDE_KEY) ?? ''}`; } catch { return EMPTY; }
  if (raw !== cacheRaw) { cacheRaw = raw; cache = { pins: readList(PIN_KEY).slice(0, MAX_PINS), hidden: readList(HIDE_KEY).filter((k) => !UNHIDEABLE.includes(k)) }; }
  return cache;
}
function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === PIN_KEY || e.key === HIDE_KEY) cb(); };
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', onStorage); };
}

export function useToolPrefs(): ToolPrefs {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

function write(key: string, list: ToolKey[]) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* trình duyệt chặn lưu */ }
  window.dispatchEvent(new Event(EVT));
}

/** Ghim / bỏ ghim. Trả false khi đã đủ MAX_PINS. Ghim một công cụ đang ẩn thì hiện lại. */
export function togglePin(k: ToolKey): boolean {
  const { pins, hidden } = snapshot();
  if (pins.includes(k)) { write(PIN_KEY, pins.filter((x) => x !== k)); return true; }
  if (pins.length >= MAX_PINS) return false;
  write(PIN_KEY, [...pins, k]);
  if (hidden.includes(k)) write(HIDE_KEY, hidden.filter((x) => x !== k));
  return true;
}

/** Ẩn / hiện một công cụ (ẩn thì bỏ ghim luôn) */
export function toggleHidden(k: ToolKey) {
  if (UNHIDEABLE.includes(k)) return;
  const { pins, hidden } = snapshot();
  if (hidden.includes(k)) { write(HIDE_KEY, hidden.filter((x) => x !== k)); return; }
  write(HIDE_KEY, [...hidden, k]);
  if (pins.includes(k)) write(PIN_KEY, pins.filter((x) => x !== k));
}

/** Ẩn / hiện cả một khu (vd. giáo viên bộ môn không chủ nhiệm ẩn cả "Lớp chủ nhiệm") */
export function setKhuHidden(khu: KhuKey, hide: boolean) {
  const keys = TOOLS.filter((t) => !t.hidden && khuOfGroup(t.group) === khu && !UNHIDEABLE.includes(t.key)).map((t) => t.key);
  const { pins, hidden } = snapshot();
  const next = hide ? [...new Set([...hidden, ...keys])] : hidden.filter((k) => !keys.includes(k));
  write(HIDE_KEY, next);
  if (hide) write(PIN_KEY, pins.filter((k) => !keys.includes(k)));
}

export function resetToolPrefs() {
  write(PIN_KEY, []);
  write(HIDE_KEY, []);
}
