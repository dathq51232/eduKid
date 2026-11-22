'use client';

// Đọc/ghi một công cụ của lớp trong class_tool_state (teacher_tool_get / teacher_tool_save).
// Lưu tự động sau khi ngừng gõ 800 ms; 'missing' = database chưa chạy migration có công cụ này.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useClassTool<T extends object>(classId: string, tool: string, empty: T, normalize: (raw: Partial<T> | null) => T) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [data, setData] = useState<T>(empty);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [save, setSave] = useState<SaveState>('idle');
  const timer = useRef<number | undefined>(undefined);
  const norm = useRef(normalize);

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    let live = true;
    void supabase.rpc('teacher_tool_get', { p_class: classId, p_tool: tool }).then(({ data: raw, error }) => {
      if (!live) return;
      if (error) setMissing(true); else setData(norm.current(raw as Partial<T> | null));
      setLoaded(true);
    }, () => { if (live) { setMissing(true); setLoaded(true); } });
    return () => { live = false; };
  }, [supabase, classId, tool]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setData((prev) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      if (supabase) {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(async () => {
          setSave('saving');
          const { error } = await supabase.rpc('teacher_tool_save', { p_class: classId, p_tool: tool, p_data: value });
          if (error?.message?.includes('invalid_tool')) setMissing(true);
          setSave(error ? 'error' : 'saved');
        }, 800);
      }
      return value;
    });
  }, [supabase, classId, tool]);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { data, update, loaded, missing, save };
}

export const saveLabel = (s: SaveState) => (s === 'saving' ? 'Đang lưu…' : s === 'saved' ? '✓ Đã lưu' : s === 'error' ? 'Chưa lưu được — thử lại' : '');
export const uid = () => Math.random().toString(36).slice(2, 10);
/** Năm học hiện tại theo lịch VN: từ tháng 8 tính sang năm học mới (vd 11/2026 → "2026–2027") */
export function schoolYear(d = new Date()) {
  const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}–${y + 1}`;
}
