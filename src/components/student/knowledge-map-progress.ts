// Tính tiến độ "Bản đồ kiến thức" Toán (lớp 1–5) từ bài em đã làm (lesson_results), chạy ở máy chủ trên trang của em.
// Mỗi bài Toán (toanN-kntt-bNN) có các mảng kiến thức; bài thuộc trạm nào thì kết quả tính cho trạm đó.
// Toán 1 chưa có mảng kiến thức theo bài nên dùng số bài ("b1", "b2"…) làm mảng kiến thức.
import { T2_LESSONS, t2Id } from '@/lib/content/toan2-plan';
import { T3_LESSONS, t3Id } from '@/lib/content/toan3-plan';
import { T4_LESSONS, t4Id } from '@/lib/content/toan4-plan';
import { T5_LESSONS, t5Id } from '@/lib/content/toan5-plan';
import { lessonHref } from '@/lib/classroom/assignments';
import { MAPS } from './knowledge-maps';
import type { MapDef, MapState } from './knowledge-map-types';

export type MapResult = { lesson_code: string; muc: number | null; score: number; total: number; created_at: string };
type PlanLesson = { id: string; topics: string[] };

const t1Id = (no: number) => `toan1-kntt-b${String(no).padStart(2, '0')}`;
/** bài của từng khối theo thứ tự sách */
const LESSONS: Record<number, PlanLesson[]> = {
  1: Array.from({ length: 41 }, (_, i) => ({ id: t1Id(i + 1), topics: [`b${i + 1}`] })),
  2: T2_LESSONS.map((l) => ({ id: t2Id(l.no), topics: l.topics })),
  3: T3_LESSONS.map((l) => ({ id: t3Id(l.no), topics: l.topics })),
  4: T4_LESSONS.map((l) => ({ id: t4Id(l.no), topics: l.topics })),
  5: T5_LESSONS.map((l) => ({ id: t5Id(l.no), topics: l.topics })),
};

/** bản đồ đã soạn cho khối này (Toán 1–5), không có thì null */
export function mapOfGrade(grade: number): MapDef | null {
  return MAPS[grade] && LESSONS[grade] ? MAPS[grade] : null;
}

function index(def: MapDef) {
  const lessons = LESSONS[def.grade];
  const nodesOf = new Map<string, string[]>();
  for (const l of lessons) nodesOf.set(l.id, def.nodes.filter((n) => n.topics.some((t) => l.topics.includes(t))).map((n) => n.id));
  return { lessons, nodesOf: (code: string) => nodesOf.get(code) ?? [] };
}

/**
 * Mức của trạm (gần với L1–L5):
 * chưa làm → 0 · đúng dưới 50% → L1 · dưới 80% → L2 · từ 80% ở mức Cơ bản → L3 · ở mức Khá → L4 · ở mức Giỏi → L5.
 * "Cần ôn": lần làm gần nhất đúng dưới 60%. "Đang học": trạm của bài làm gần nhất (bài chỉ thuộc một trạm), chưa vững và không phải cần ôn.
 * `results` xếp mới nhất trước; bài của khối khác tự bị bỏ qua.
 */
export function mapState(def: MapDef, results: MapResult[]): MapState {
  const { nodesOf } = index(def);
  const state: MapState = Object.fromEntries(def.nodes.map((n) => [n.id, { level: 0 }]));
  const latestSeen = new Set<string>();
  for (const r of results) {
    if (!r.total) continue;
    const ratio = r.score / r.total;
    const lv = ratio < 0.5 ? 1 : ratio < 0.8 ? 2 : r.muc === 3 ? 5 : r.muc === 2 ? 4 : 3;
    for (const id of nodesOf(r.lesson_code)) {
      const s = state[id];
      s.level = Math.max(s.level, lv);
      if (!latestSeen.has(id)) { latestSeen.add(id); if (ratio < 0.6) s.weak = true; }
    }
  }
  const last = results.find((r) => nodesOf(r.lesson_code).length > 0);
  if (last) {
    const ids = nodesOf(last.lesson_code);
    if (ids.length === 1 && state[ids[0]].level < 3 && !state[ids[0]].weak) state[ids[0]].current = true;
  }
  return state;
}

/**
 * Bài để luyện mỗi trạm:
 * - trạm "cần ôn" → làm lại đúng bài gần nhất của trạm, mức Cơ bản;
 * - còn lại → bài đầu tiên (theo thứ tự sách) của riêng trạm mà em chưa đạt 80% ở mức Cơ bản; đã vững hết thì bài đầu tiên ở mức cao hơn.
 * "Bài của riêng trạm" = bài chỉ thuộc trạm này (bỏ Luyện tập chung / Ôn tập nhiều trạm); không có thì lấy bài có liên quan.
 */
export function mapHrefs(def: MapDef, state: MapState, results: MapResult[]): Record<string, string> {
  const { lessons, nodesOf } = index(def);
  const bestBasic = new Map<string, number>();
  for (const r of results) if (r.total && (r.muc ?? 1) === 1) bestBasic.set(r.lesson_code, Math.max(bestBasic.get(r.lesson_code) ?? 0, r.score / r.total));
  const out: Record<string, string> = {};
  for (const n of def.nodes) {
    const s = state[n.id] ?? { level: 0 };
    if (s.weak) {
      const last = results.find((r) => nodesOf(r.lesson_code).includes(n.id));
      if (last) { out[n.id] = lessonHref(last.lesson_code, 'toan', def.grade, 1); continue; }
    }
    let own = lessons.filter((l) => { const ids = nodesOf(l.id); return ids.length === 1 && ids[0] === n.id; });
    if (!own.length) own = lessons.filter((l) => nodesOf(l.id).includes(n.id));
    if (!own.length) continue;
    const todo = own.find((l) => (bestBasic.get(l.id) ?? 0) < 0.8);
    out[n.id] = todo
      ? lessonHref(todo.id, 'toan', def.grade, 1)
      : lessonHref(own[0].id, 'toan', def.grade, s.level >= 4 ? 3 : 2);
  }
  return out;
}
