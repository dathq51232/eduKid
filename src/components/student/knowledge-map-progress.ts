// Tính tiến độ "Bản đồ kiến thức" Toán 4 từ bài em đã làm (lesson_results), chạy ở máy chủ trên trang của em.
// Mỗi bài Toán 4 (toan4-kntt-bNN) có các mảng kiến thức; bài thuộc trạm nào thì kết quả tính cho trạm đó.
import { T4_LESSONS, t4Id } from '@/lib/content/toan4-plan';
import { lessonHref } from '@/lib/classroom/assignments';
import { NODES, type MapState } from './knowledge-map-toan4';

export type MapResult = { lesson_code: string; muc: number | null; score: number; total: number; created_at: string };

const LESSON_NO = new Map(T4_LESSONS.map((l) => [t4Id(l.no), l]));

/** các trạm mà một bài Toán 4 thuộc về */
function nodesOfLesson(code: string): string[] {
  const l = LESSON_NO.get(code);
  if (!l) return [];
  return NODES.filter((n) => n.topics.some((t) => l.topics.includes(t))).map((n) => n.id);
}

/**
 * Mức của trạm (gần với L1–L5):
 * chưa làm → 0 · đúng dưới 50% → L1 · dưới 80% → L2 · từ 80% ở mức Cơ bản → L3 · ở mức Khá → L4 · ở mức Giỏi → L5.
 * "Cần ôn": lần làm gần nhất đúng dưới 60%. "Đang học": trạm của bài làm gần nhất, chưa vững và không phải cần ôn.
 * `results` xếp mới nhất trước.
 */
export function toan4MapState(results: MapResult[]): MapState {
  const state: MapState = Object.fromEntries(NODES.map((n) => [n.id, { level: 0 }]));
  const latestSeen = new Set<string>();
  for (const r of results) {
    if (!r.total) continue;
    const ratio = r.score / r.total;
    const lv = ratio < 0.5 ? 1 : ratio < 0.8 ? 2 : r.muc === 3 ? 5 : r.muc === 2 ? 4 : 3;
    for (const id of nodesOfLesson(r.lesson_code)) {
      const s = state[id];
      s.level = Math.max(s.level, lv);
      if (!latestSeen.has(id)) { latestSeen.add(id); if (ratio < 0.6) s.weak = true; }
    }
  }
  const last = results.find((r) => nodesOfLesson(r.lesson_code).length > 0);
  if (last) {
    const ids = nodesOfLesson(last.lesson_code);
    const cur = ids.find((id) => state[id].level < 3 && !state[id].weak);
    if (cur && ids.length === 1) state[cur].current = true;
  }
  return state;
}

/**
 * Bài để luyện mỗi trạm:
 * - trạm "cần ôn" → làm lại đúng bài gần nhất của trạm, mức Cơ bản;
 * - còn lại → bài đầu tiên (theo thứ tự sách) của trạm mà em chưa đạt 80% ở mức Cơ bản; đã vững hết thì bài đầu tiên ở mức cao hơn.
 * Chỉ xét bài gồm riêng kiến thức của trạm (bỏ bài "Luyện tập chung"/ôn tập nhiều trạm), không có thì lấy bài có liên quan.
 */
export function toan4MapHrefs(state: MapState, grade: number, results: MapResult[]): Record<string, string> {
  const bestBasic = new Map<string, number>();
  for (const r of results) if (r.total && (r.muc ?? 1) === 1) bestBasic.set(r.lesson_code, Math.max(bestBasic.get(r.lesson_code) ?? 0, r.score / r.total));
  const out: Record<string, string> = {};
  for (const n of NODES) {
    const s = state[n.id] ?? { level: 0 };
    if (s.weak) {
      const last = results.find((r) => nodesOfLesson(r.lesson_code).includes(n.id));
      if (last) { out[n.id] = lessonHref(last.lesson_code, 'toan', grade, 1); continue; }
    }
    let own = T4_LESSONS.filter((l) => l.topics.every((t) => n.topics.includes(t)));
    if (!own.length) own = T4_LESSONS.filter((l) => l.topics.some((t) => n.topics.includes(t)));
    if (!own.length) continue;
    const todo = own.find((l) => (bestBasic.get(t4Id(l.no)) ?? 0) < 0.8);
    out[n.id] = todo
      ? lessonHref(t4Id(todo.no), 'toan', grade, 1)
      : lessonHref(t4Id(own[0].no), 'toan', grade, s.level >= 4 ? 3 : 2);
  }
  return out;
}
