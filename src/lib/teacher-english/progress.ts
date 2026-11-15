'use client';

// Tiến độ luyện tiếng Anh sư phạm + "Câu của tôi" (migration 0056).
// Lưu lên Supabase (bảng riêng của từng giáo viên); luôn giữ bản sao trên máy để mở lại nhanh và
// vẫn dùng được khi chưa chạy migration / mất mạng (khi đó chỉ lưu trên máy này).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SECTIONS, type SectionKey } from './roadmap';

export type LessonProgress = { sections: SectionKey[]; rating: number | null; note: string; completedAt: string | null };
export type ProgressMap = Record<string, LessonProgress>;
export type SyncState = 'loading' | 'cloud' | 'local';

const P_KEY = 'gv-ta-tien-do';
const S_KEY = 'gv-ta-cau-cua-toi';
export const emptyProgress = (): LessonProgress => ({ sections: [], rating: null, note: '', completedAt: null });

function readLocal<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function writeLocal(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* bộ nhớ đầy / bị chặn: bỏ qua */ }
}

type Row = { lesson_id: string; sections: string[] | null; rating: number | null; note: string | null; completed_at: string | null };

export function useTeacherEnglish() {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [saved, setSaved] = useState<string[]>([]);
  const [sync, setSync] = useState<SyncState>('loading');
  const cloud = useRef(false);

  useEffect(() => {
    let alive = true;
    const localP = readLocal<ProgressMap>(P_KEY, {});
    const localS = readLocal<string[]>(S_KEY, []);
    setProgress(localP);
    setSaved(localS);
    (async () => {
      if (!supabase) { if (alive) setSync('local'); return; }
      const [{ data: p, error: e1 }, { data: s, error: e2 }] = await Promise.all([
        supabase.from('teacher_english_progress').select('lesson_id, sections, rating, note, completed_at'),
        supabase.from('teacher_english_saved').select('phrase_id'),
      ]);
      if (!alive) return;
      if (e1 || e2) { setSync('local'); return; }
      cloud.current = true;
      const valid = new Set<string>(SECTIONS.map((x) => x.key));
      const map: ProgressMap = {};
      for (const r of (p ?? []) as Row[]) {
        map[r.lesson_id] = { sections: (r.sections ?? []).filter((k) => valid.has(k)) as SectionKey[], rating: r.rating, note: r.note ?? '', completedAt: r.completed_at };
      }
      // Lần đầu bật đồng bộ: đẩy tiến độ đang có trên máy lên (bài nào trên mây chưa có)
      const pending = Object.entries(localP).filter(([id]) => !map[id]);
      for (const [id, v] of pending) map[id] = v;
      if (pending.length) {
        void supabase.from('teacher_english_progress').upsert(pending.map(([id, v]) => ({ lesson_id: id, sections: v.sections, rating: v.rating, note: v.note, completed_at: v.completedAt })), { onConflict: 'owner,lesson_id' });
      }
      const ids = new Set(((s ?? []) as { phrase_id: string }[]).map((r) => r.phrase_id));
      const extra = localS.filter((id) => !ids.has(id));
      if (extra.length) void supabase.from('teacher_english_saved').upsert(extra.map((phrase_id) => ({ phrase_id })), { onConflict: 'owner,phrase_id', ignoreDuplicates: true });
      for (const id of extra) ids.add(id);
      setProgress(map); writeLocal(P_KEY, map);
      const list = [...ids]; setSaved(list); writeLocal(S_KEY, list);
      setSync('cloud');
    })();
    return () => { alive = false; };
  }, [supabase]);

  const update = useCallback((lessonId: string, patch: Partial<LessonProgress>) => {
    setProgress((prev) => {
      const cur = { ...emptyProgress(), ...prev[lessonId], ...patch };
      // Đủ mọi phần thì tự ghi nhận hoàn thành; bỏ bớt phần thì huỷ
      const all = cur.sections.length >= SECTIONS.length;
      cur.completedAt = all ? (cur.completedAt ?? new Date().toISOString()) : null;
      const next = { ...prev, [lessonId]: cur };
      writeLocal(P_KEY, next);
      if (cloud.current && supabase) {
        void supabase.from('teacher_english_progress')
          .upsert({ lesson_id: lessonId, sections: cur.sections, rating: cur.rating, note: cur.note, completed_at: cur.completedAt, updated_at: new Date().toISOString() }, { onConflict: 'owner,lesson_id' });
      }
      return next;
    });
  }, [supabase]);

  const toggleSection = useCallback((lessonId: string, key: SectionKey) => {
    const cur = progress[lessonId] ?? emptyProgress();
    const on = cur.sections.includes(key);
    update(lessonId, { sections: on ? cur.sections.filter((k) => k !== key) : [...cur.sections, key] });
  }, [progress, update]);

  const toggleSaved = useCallback((phraseId: string) => {
    setSaved((prev) => {
      const on = prev.includes(phraseId);
      const next = on ? prev.filter((x) => x !== phraseId) : [...prev, phraseId];
      writeLocal(S_KEY, next);
      if (cloud.current && supabase) {
        if (on) void supabase.from('teacher_english_saved').delete().eq('phrase_id', phraseId);
        else void supabase.from('teacher_english_saved').upsert({ phrase_id: phraseId }, { onConflict: 'owner,phrase_id', ignoreDuplicates: true });
      }
      return next;
    });
  }, [supabase]);

  return { progress, saved, sync, update, toggleSection, toggleSaved };
}
