'use client';

// Ôn mỗi ngày theo lịch nhắc lại (spaced repetition, kiểu hộp Leitner) cho Tiếng Anh sư phạm.
// Thẻ lấy từ: từ vựng + mẫu câu của các bài cô đã bắt đầu học (chưa bắt đầu bài nào thì lấy Giai đoạn 1),
// "Câu của tôi" và toàn bộ câu sư phạm của Ngân hàng mẫu câu. Thẻ mới mỗi ngày được xáo ngẫu nhiên theo ngày
// (cùng ngày giữ nguyên, sang ngày khác đổi) và trộn cả từ vựng lẫn câu sư phạm, để không ngày nào cũng gặp một nhóm thẻ.
// Nhớ → thẻ lên hộp cao hơn, lâu hơn mới gặp lại (1, 3, 7, 14, 30, 60, 120 ngày); quên → về hộp 0, ôn lại ngay trong buổi.
// Lưu lên Supabase (migration 0060), luôn giữ bản sao trên máy; chưa chạy migration thì chỉ lưu trên máy này.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LESSONS, type Lesson } from './roadmap';
import { PHRASES } from './classroom-bank';
import { keywordImage, phraseImage } from './phrase-images';
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

/** Bộ thẻ của cô: các bài đã bắt đầu (chưa có thì Giai đoạn 1) + Câu của tôi + câu sư phạm của Ngân hàng mẫu câu. Không trùng mã. */
export function buildDeck(progress: ProgressMap, saved: string[]): Card[] {
  const started = LESSONS.filter((l) => (progress[l.id]?.sections.length ?? 0) > 0);
  const lessons = started.length ? started : LESSONS.filter((l) => l.stage === 1);
  const out = new Map<string, Card>();
  for (const l of lessons) for (const c of lessonCards(l)) if (!out.has(c.id)) out.set(c.id, c);
  const mine = new Set(saved);
  for (const id of saved) {
    const p = PHRASES.find((x) => x.id === id);
    if (p) out.set(`p:${p.id}`, { id: `p:${p.id}`, kind: 'phrase', en: p.en, vi: p.vi, source: 'Câu của tôi' });
  }
  for (const p of PHRASES) {
    if (mine.has(p.id)) continue;
    out.set(`p:${p.id}`, { id: `p:${p.id}`, kind: 'phrase', en: p.en, vi: p.vi, source: p.grade ? `Câu sư phạm lớp ${p.grade}` : 'Câu sư phạm' });
  }
  return [...out.values()];
}

/* ───────── Xáo theo ngày ───────── */
/** Băm chuỗi (FNV-1a) rồi trộn thêm bit để các mã gần giống nhau vẫn ra số rất khác nhau */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}
/**
 * Xáo danh sách theo ngày: khoá xếp chỉ phụ thuộc (ngày, mã thẻ), nên trong một ngày thứ tự cố định —
 * tải lại trang hay chấm bớt vài thẻ thì các thẻ còn lại vẫn giữ thứ tự; sang ngày khác thứ tự mới.
 */
export function shuffleForDay<T extends { id: string }>(list: T[], day: string): T[] {
  return list.map((x) => ({ x, k: hash(`${day}|${x.id}`) })).sort((a, b) => a.k - b.k).map((o) => o.x);
}

/* ───────── Hình minh hoạ ───────── */
/** Hình cho từ vựng của lộ trình (Fluent 3D trong public/emoji/f3d) */
const VOCAB_IMG: Record<string, string> = {
  ship: 'ship', sheep: 'ewe', full: 'bowl-with-spoon', fool: 'performing-arts', cat: 'cat', cut: 'scissors', pen: 'pen', pan: 'cooking',
  books: 'books', pens: 'pen', boxes: 'package', played: 'soccer-ball', watched: 'television', wanted: 'wrapped-gift', three: 'abacus',
  very: 'star', banana: 'banana', elephant: 'elephant', computer: 'laptop', activity: 'puzzle-piece', exercise: 'notebook',
  understand: 'light-bulb', favourite: 'red-heart', together: 'raised-hand', 'primary school': 'school', 'homeroom teacher': 'woman-teacher',
  colleague: 'teacher', experience: 'sports-medal', hobby: 'artist-palette', hometown: 'house-with-garden', grade: 'school', subject: 'books',
  parents: 'houses', siblings: 'boy', principal: 'office-building', 'staff room': 'couch-and-lamp', timetable: 'spiral-calendar',
  workload: 'package', meeting: 'speech-balloon', 'lesson plan': 'notebook', 'get up': 'alarm-clock', 'have breakfast': 'bread',
  'go to work': 'person-walking', 'mark homework': 'pencil', 'quarter past': 'mantelpiece-clock', 'half past': 'mantelpiece-clock',
  usually: 'calendar', weekend: 'party-popper', 'tall / short': 'person-standing', 'curly hair': 'person-getting-haircut',
  friendly: 'waving-hand', round: 'orange-circle', square: 'blue-square', 'next to': 'right-arrow', 'in front of': 'right-arrow',
  behind: 'right-arrow', clarify: 'red-question-mark', repeat: 'speaking-head', confirm: 'light-bulb', 'follow-up question': 'red-question-mark',
  actually: 'light-bulb', 'by the way': 'speech-balloon', exactly: 'star', 'i see': 'eyes', register: 'ledger', present: 'raised-hand',
  absent: 'door', 'settle down': 'person-in-lotus-position', quiet: 'person-in-lotus-position', ready: 'triangular-flag',
  "today's lesson": 'open-book', next: 'right-arrow', step: 'running-shoe', 'first / then / finally': 'abacus', match: 'puzzle-piece',
  circle: 'red-circle', tick: 'pencil', 'fill in': 'writing-hand', demonstrate: 'teacher', check: 'eyes', partner: 'speech-balloon',
  'group leader': 'triangular-flag', reporter: 'microphone', 'take turns': 'game-die', swap: 'right-arrow', share: 'speech-balloon',
  'on your own': 'person', 'report back': 'microphone', excellent: 'star', brilliant: 'sports-medal', almost: 'slightly-smiling-face',
  mistake: 'pencil', 'pay attention': 'eyes', rule: 'ledger', behave: 'raised-hand', effort: 'person-running', 'pencil case': 'pencil',
  ruler: 'straight-ruler', 'rubber / eraser': 'pencil', 'school bag': 'backpack', crayon: 'crayon', purple: 'purple-square',
  orange: 'orange-circle', twenty: 'abacus', grandparents: 'old-woman', cousin: 'girl', 'best friend': 'waving-hand', rabbit: 'rabbit',
  parrot: 'parrot', goldfish: 'tropical-fish', noodles: 'steaming-bowl', 'orange juice': 'beverage-box', 't-shirt': 't-shirt',
  jacket: 'coat', 'teddy bear': 'teddy-bear', kite: 'kite', sunny: 'sun', rainy: 'cloud-with-rain', windy: 'wind-face',
  'brush my teeth': 'tooth', 'ride a bike': 'person-biking', skip: 'person-cartwheeling', badminton: 'badminton', swim: 'person-swimming',
  'turn left': 'right-arrow', 'go straight': 'right-arrow', opposite: 'right-arrow', 'post office': 'post-office', elicit: 'red-question-mark',
  realia: 'basket', flashcard: 'framed-picture', mime: 'performing-arts', drill: 'speaking-head', chorus: 'musical-notes', model: 'teacher',
  context: 'framed-picture', 'once upon a time': 'open-book', suddenly: 'fireworks', 'in the end': 'triangular-flag', character: 'performing-arts',
  predict: 'red-question-mark', chant: 'musical-notes', rhyme: 'musical-note', clap: 'raised-hand', team: 'sports-medal', point: 'star',
  winner: 'sports-medal', turn: 'game-die', 'role card': 'performing-arts', shopkeeper: 'shopping-bags', customer: 'shopping-cart',
  'fair play': 'red-heart', scaffolding: 'construction-worker', 'sentence frame': 'framed-picture', 'word bank': 'books',
  'challenge card': 'game-die', survey: 'ledger', outcome: 'sports-medal', 'mixed-ability': 'puzzle-piece', support: 'raised-hand',
  upset: 'red-heart', argue: 'speech-balloon', 'feel sick': 'pill', toilet: 'soap', forget: 'red-question-mark',
  'calm down': 'person-in-lotus-position', sorry: 'red-heart', 'lesson aim': 'triangular-flag', stage: 'performing-arts',
  'lead-in': 'light-bulb', consolidation: 'books', timing: 'alarm-clock', materials: 'scissors', interaction: 'speech-balloon',
  'teacher talking time': 'speaking-head', 'pupil talking time': 'raised-hand', rehearse: 'studio-microphone', pace: 'person-walking',
  transition: 'right-arrow', 'board work': 'framed-picture', 'eye contact': 'eyes', 'wrap up': 'wrapped-gift', strength: 'sports-medal',
  'area to improve': 'seedling', feedback: 'speech-balloon', reflect: 'mirror', 'action plan': 'spiral-calendar', goal: 'triangular-flag',
  progress: 'seedling', confident: 'grinning-face-with-smiling-eyes',
};
const phraseById = new Map(PHRASES.map((p) => [`p:${p.id}`, p]));
/** Tên hình 3D minh hoạ cho thẻ (luôn có một hình) */
export function cardImage(c: Card): string {
  if (c.kind === 'vocab') return VOCAB_IMG[c.en.toLowerCase()] ?? keywordImage(c.en) ?? 'open-book';
  const p = phraseById.get(c.id);
  if (p) return phraseImage(p);
  return keywordImage(c.en) ?? 'speech-balloon';
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

/** Tỉ lệ thẻ mới mỗi ngày dành cho câu sư phạm (phần còn lại là từ vựng, mẫu câu của bài và Câu của tôi) */
const PHRASE_SHARE = 0.4;

/**
 * Danh sách thẻ cần ôn hôm nay: thẻ đến hạn trước (hạn cũ trước, cùng hạn thì xáo theo ngày), rồi thẻ mới
 * (tối đa NEW_PER_DAY/ngày): xáo theo ngày, khoảng 60% thẻ của bài / Câu của tôi + 40% câu sư phạm.
 */
export function todayQueue(deck: Card[], map: ReviewMap, newToday: number, today = todayVN()) {
  const due = shuffleForDay(deck.filter((c) => map[c.id] && map[c.id].due <= today), today)
    .sort((a, b) => map[a.id].due.localeCompare(map[b.id].due));
  const room = Math.max(0, NEW_PER_DAY - newToday);
  const unseen = shuffleForDay(deck.filter((c) => !map[c.id]), today);
  const isBank = (c: Card) => c.kind === 'phrase' && c.source !== 'Câu của tôi';
  const lesson = unseen.filter((c) => !isBank(c));
  const bank = unseen.filter(isBank);
  // Câu của tôi ưu tiên trước trong phần thẻ của bài
  lesson.sort((a, b) => Number(b.source === 'Câu của tôi') - Number(a.source === 'Câu của tôi'));
  const nBank = Math.min(bank.length, room, Math.max(Math.round(room * PHRASE_SHARE), room - lesson.length));
  const pick = [...lesson.slice(0, room - nBank), ...bank.slice(0, nBank)];
  const fresh = shuffleForDay(pick, `${today}#mix`);
  return { due, fresh, queue: [...due, ...fresh].slice(0, MAX_PER_SESSION) };
}
