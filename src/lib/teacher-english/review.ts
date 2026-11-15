'use client';

// Ôn mỗi ngày theo lịch nhắc lại (spaced repetition, kiểu hộp Leitner) cho Tiếng Anh sư phạm.
// Thẻ lấy từ: từ vựng + mẫu câu của các bài cô đã bắt đầu học (chưa bắt đầu bài nào thì lấy Tuần 1) và "Câu của tôi".
// Nhớ → thẻ lên hộp cao hơn, lâu hơn mới gặp lại (1, 3, 7, 14, 30, 60, 120 ngày); quên → về hộp 0, ôn lại ngay trong buổi.
// Lưu lên Supabase (migration 0060), luôn giữ bản sao trên máy; chưa chạy migration thì chỉ lưu trên máy này.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LESSONS, type Lesson } from './roadmap';
import { PHRASES } from './classroom-bank';
import type { ProgressMap } from './progress';

export type Card = { id: string; kind: 'vocab' | 'expr' | 'phrase'; en: string; vi: string; ipa?: string; source: string };
export type CardState = { box: number; due: string; reps: number; lapses: number; updatedAt: string };
export type ReviewMap = Record<string, CardState>;
export type Grade = 'again' | 'good' | 'easy';

/** Số ngày chờ theo hộp (0 = đang học lại, 1…7) */
export const INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120] as const;
export const MAX_BOX = INTERVALS.length - 1;
/** Hộp từ mức này trở lên coi là "đã thuộc" */
export const MASTERED_BOX = 4;
export const NEW_PER_DAY = 10;
export const MAX_PER_SESSION = 60;

const R_KEY = 'gv-ta-on-tap';
const N_KEY = 'gv-ta-on-tap-moi'; // { day, n }: số thẻ mới đã học hôm nay

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD */
export const todayVN = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

function lessonCards(l: Lesson): Card[] {
  const src = `Tuần ${l.week}`;
  return [
    ...l.vocabulary.map((v) => ({ id: `v:${l.id}:${slug(v.word)}`, kind: 'vocab' as const, en: v.word, vi: v.vi, ipa: v.ipa, source: src })),
    ...l.expressions.map((e, i) => ({ id: `e:${l.id}:${i}`, kind: 'expr' as const, en: e[0], vi: e[1], source: src })),
  ];
}

/** Bộ thẻ của cô: các bài đã bắt đầu (chưa có thì Tuần 1) + Câu của tôi. Không trùng mã. */
export function buildDeck(progress: ProgressMap, saved: string[]): Card[] {
  const started = LESSONS.filter((l) => (progress[l.id]?.sections.length ?? 0) > 0);
  const lessons = started.length ? started : LESSONS.slice(0, 1);
  const out = new Map<string, Card>();
  for (const l of lessons) for (const c of lessonCards(l)) if (!out.has(c.id)) out.set(c.id, c);
  for (const id of saved) {
    const p = PHRASES.find((x) => x.id === id);
    if (p) out.set(`p:${p.id}`, { id: `p:${p.id}`, kind: 'phrase', en: p.en, vi: p.vi, source: 'Câu của tôi' });
  }
  return [...out.values()];
}

/** Lịch mới của thẻ sau khi chấm */
export function schedule(cur: CardState | undefined, grade: Grade, today = todayVN()): CardState {
  const box0 = cur?.box ?? 0;
  // Quên → hộp 0 (học lại): nhớ lại trong buổi thì lên hộp 1, hẹn ngày mai
  const box = grade === 'again' ? 0 : Math.min(MAX_BOX, box0 + (grade === 'easy' ? 2 : 1));
  return {
    box,
    due: grade === 'again' ? today : addDays(today, INTERVALS[box]),
    reps: (cur?.reps ?? 0) + 1,
    lapses: (cur?.lapses ?? 0) + (grade === 'again' && box0 > 0 ? 1 : 0),
    updatedAt: new Date().toISOString(),
  };
}

/** Số ngày chờ sẽ hiện trên nút chấm (để cô biết bao lâu gặp lại) */
export function nextGapLabel(cur: CardState | undefined, grade: Grade) {
  if (grade === 'again') return 'ôn lại ngay';
  const d = INTERVALS[Math.min(MAX_BOX, (cur?.box ?? 0) + (grade === 'easy' ? 2 : 1))];
  return d === 1 ? 'mai' : d < 30 ? `${d} ngày` : `${Math.round(d / 30)} tháng`;
}

function readLocal<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function writeLocal(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* bộ nhớ đầy / bị chặn: bỏ qua */ }
}

type Row = { card_id: string; box: number; due: string; reps: number; lapses: number; updated_at: string };
export type ReviewSync = 'loading' | 'cloud' | 'local';

export function useReview() {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [map, setMap] = useState<ReviewMap>({});
  const [newToday, setNewToday] = useState(0);
  const [sync, setSync] = useState<ReviewSync>('loading');
  const cloud = useRef(false);

  useEffect(() => {
    let alive = true;
    const local = readLocal<ReviewMap>(R_KEY, {});
    setMap(local);
    const n = readLocal<{ day: string; n: number }>(N_KEY, { day: '', n: 0 });
    setNewToday(n.day === todayVN() ? n.n : 0);
    (async () => {
      if (!supabase) { if (alive) setSync('local'); return; }
      const { data, error } = await supabase.from('teacher_english_review').select('card_id, box, due, reps, lapses, updated_at');
      if (!alive) return;
      if (error) { setSync('local'); return; }
      cloud.current = true;
      const merged: ReviewMap = {};
      for (const r of (data ?? []) as Row[]) merged[r.card_id] = { box: r.box, due: r.due, reps: r.reps, lapses: r.lapses, updatedAt: r.updated_at };
      // Bản trên máy mới hơn (hoặc chưa có trên mây) thì đẩy lên
      const push = Object.entries(local).filter(([id, v]) => !merged[id] || merged[id].updatedAt < v.updatedAt);
      for (const [id, v] of push) merged[id] = v;
      if (push.length) {
        void supabase.from('teacher_english_review').upsert(
          push.map(([id, v]) => ({ card_id: id, box: v.box, due: v.due, reps: v.reps, lapses: v.lapses, updated_at: v.updatedAt })),
          { onConflict: 'owner,card_id' },
        );
      }
      setMap(merged); writeLocal(R_KEY, merged);
      setSync('cloud');
    })();
    return () => { alive = false; };
  }, [supabase]);

  // Đọc bản mới nhất qua ref để chấm thẻ không phụ thuộc lần vẽ lại (không đặt việc ghi vào trong hàm cập nhật state)
  const mapRef = useRef(map); mapRef.current = map;
  const newRef = useRef(newToday); newRef.current = newToday;
  const grade = useCallback((cardId: string, g: Grade) => {
    const prev = mapRef.current;
    const st = schedule(prev[cardId], g);
    const next = { ...prev, [cardId]: st };
    mapRef.current = next;
    setMap(next); writeLocal(R_KEY, next);
    if (!prev[cardId]) {
      const v = newRef.current + 1; newRef.current = v;
      setNewToday(v); writeLocal(N_KEY, { day: todayVN(), n: v });
    }
    if (cloud.current && supabase) {
      void supabase.from('teacher_english_review').upsert(
        { card_id: cardId, box: st.box, due: st.due, reps: st.reps, lapses: st.lapses, updated_at: st.updatedAt },
        { onConflict: 'owner,card_id' },
      );
    }
  }, [supabase]);

  return { map, newToday, sync, grade };
}

/** Danh sách thẻ cần ôn hôm nay: thẻ đến hạn trước (hạn cũ nhất trước), rồi thẻ mới (tối đa NEW_PER_DAY/ngày) */
export function todayQueue(deck: Card[], map: ReviewMap, newToday: number, today = todayVN()) {
  const due = deck.filter((c) => map[c.id] && map[c.id].due <= today).sort((a, b) => map[a.id].due.localeCompare(map[b.id].due));
  const fresh = deck.filter((c) => !map[c.id]).slice(0, Math.max(0, NEW_PER_DAY - newToday));
  return { due, fresh, queue: [...due, ...fresh].slice(0, MAX_PER_SESSION) };
}
