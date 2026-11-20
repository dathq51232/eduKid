'use client';

// Ghi chú nhắc hẹn trên lịch (giáo viên + phụ huynh): mỗi người tự ghi việc quan trọng vào một ngày, chọn nhắc trước
// mấy ngày, có thể lặp lại. Lưu ở bảng calendar_notes (migration 0069, mỗi người chỉ thấy của mình);
// chưa chạy migration / chưa đăng nhập thì lưu trên máy này (localStorage) để vẫn dùng được.
// Ngày luôn là chuỗi 'YYYY-MM-DD' theo giờ Việt Nam.
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Repeat = 'none' | 'weekly' | 'monthly' | 'yearly';
export type CalendarNote = {
  id: string; day: string; at_time: string | null; title: string; note: string;
  remind_days: number; repeat: Repeat; done_until: string | null;
};
export type NoteInput = Pick<CalendarNote, 'day' | 'at_time' | 'title' | 'note' | 'remind_days' | 'repeat'>;
/** Một lần đến hạn của ghi chú (ghi chú lặp có nhiều lần) */
export type Occurrence = { note: CalendarNote; day: string; daysLeft: number; done: boolean };

export const REPEAT_LABEL: Record<Repeat, string> = { none: 'Không lặp', weekly: 'Hằng tuần', monthly: 'Hằng tháng', yearly: 'Hằng năm' };
export const REMIND_OPTIONS = [0, 1, 2, 3, 5, 7, 14] as const;
export const remindLabel = (n: number) => (n === 0 ? 'Đúng ngày' : `Trước ${n} ngày`);
/** "Sắp tới" chỉ xem trong 2 tuần — xa hơn thì chưa cần bận tâm */
export const UPCOMING_DAYS = 14;

const DAY = 86_400_000;
const WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const vnTodayIso = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const ms = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const addDays = (iso: string, n: number) => new Date(ms(iso) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((ms(b) - ms(a)) / DAY);
/** "Thứ Hai 24/11" */
export function dayLabel(iso: string): string {
  const d = new Date(ms(iso));
  return `${WD[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
/** "Hôm nay" · "Ngày mai" · "còn 5 ngày" */
export const leftLabel = (n: number) => (n === 0 ? 'Hôm nay' : n === 1 ? 'Ngày mai' : `còn ${n} ngày`);

/** Ghi chú có rơi vào ngày iso không (tính cả lặp lại) */
export function fallsOn(n: Pick<CalendarNote, 'day' | 'repeat'>, iso: string): boolean {
  if (iso < n.day) return false;
  if (n.repeat === 'none') return iso === n.day;
  if (n.repeat === 'weekly') return diffDays(n.day, iso) % 7 === 0;
  if (n.repeat === 'monthly') return iso.slice(8) === n.day.slice(8);
  return iso.slice(5) === n.day.slice(5);
}

/** Các lần đến hạn trong [from, to] (gồm cả hai đầu) */
export function occurrencesBetween(notes: CalendarNote[], from: string, to: string): Occurrence[] {
  const out: Occurrence[] = [];
  const span = diffDays(from, to);
  for (const n of notes) {
    for (let i = Math.max(0, diffDays(from, n.day)); i <= span; i++) {
      const day = addDays(from, i);
      if (fallsOn(n, day)) out.push({ note: n, day, daysLeft: i, done: Boolean(n.done_until && n.done_until >= day) });
      if (n.repeat === 'none') break;
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || (a.note.at_time ?? '99').localeCompare(b.note.at_time ?? '99'));
}

/** Việc đã tới lúc nhắc hôm nay: lần gần nhất của mỗi ghi chú, còn ≤ remind_days ngày (gồm cả việc đã đánh dấu xong) */
export function dueReminders(notes: CalendarNote[], today: string): Occurrence[] {
  const seen = new Set<string>();
  return occurrencesBetween(notes, today, addDays(today, 30)).filter((o) => {
    if (seen.has(o.note.id)) return false;
    seen.add(o.note.id);
    return o.daysLeft <= o.note.remind_days;
  });
}

// ---------- Lưu trữ ----------
const LOCAL_KEY = 'educhain-lich-ghi-chu-v1';
const EVT = 'educhain-lich-ghi-chu';
const COLS = 'id, day, at_time, title, note, remind_days, repeat, done_until';

function readLocal(): CalendarNote[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as CalendarNote[]; } catch { return []; }
}
function writeLocal(list: CalendarNote[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch { /* bộ nhớ bị chặn */ }
}
const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `n${Date.now()}${Math.random().toString(36).slice(2)}`);

/** Đọc / ghi ghi chú của người đang đăng nhập; các khối lịch trên cùng trang tự cập nhật theo nhau. */
export function useCalendarNotes() {
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [ready, setReady] = useState(false);
  const [local, setLocal] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const sb = createClient();
      // getSession đọc phiên trên máy (không gọi mạng) — việc nhắc hiện ngay khi mở trang; RLS vẫn kiểm tra ở máy chủ
      const { data: auth } = await sb.auth.getSession();
      if (!auth.session) throw new Error('chưa đăng nhập');
      const { data, error: e } = await sb.from('calendar_notes').select(COLS).order('day');
      if (e) throw e;
      setNotes((data ?? []) as CalendarNote[]);
      setLocal(false);
    } catch {
      setNotes(readLocal());
      setLocal(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
    const on = () => { void load(); };
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, [load]);

  const changed = () => window.dispatchEvent(new Event(EVT));

  const run = useCallback(async (cloud: () => PromiseLike<{ error: unknown }>, offline: (l: CalendarNote[]) => CalendarNote[]) => {
    setError('');
    if (local) { writeLocal(offline(readLocal())); changed(); return true; }
    const { error: e } = await cloud();
    if (e) { setError('Chưa lưu được — kiểm tra mạng rồi thử lại.'); return false; }
    changed();
    return true;
  }, [local]);

  const add = useCallback((input: NoteInput) => run(
    () => createClient().from('calendar_notes').insert(input),
    (l) => [...l, { ...input, id: newId(), done_until: null }],
  ), [run]);

  const update = useCallback((id: string, patch: Partial<NoteInput & { done_until: string | null }>) => run(
    () => createClient().from('calendar_notes').update(patch).eq('id', id),
    (l) => l.map((n) => (n.id === id ? { ...n, ...patch } : n)),
  ), [run]);

  const remove = useCallback((id: string) => run(
    () => createClient().from('calendar_notes').delete().eq('id', id),
    (l) => l.filter((n) => n.id !== id),
  ), [run]);

  /** Đánh dấu xong lần đến hạn `day` (bỏ đánh dấu: lùi về hôm trước) */
  const setDone = useCallback((o: Occurrence, done: boolean) => update(o.note.id, { done_until: done ? o.day : addDays(o.day, -1) }), [update]);

  return { notes, ready, local, error, add, update, remove, setDone };
}
