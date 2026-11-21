// Trộn 3 mức khi thầy cô sinh câu (Kho câu hỏi > Sinh câu): theo số câu từng mức hoặc theo % trên tổng số câu.
import type { Muc } from '@/lib/exams/matrix';

export type MucPlan = Record<Muc, number>;
export type MucMix = { by: 'count' | 'pct'; count: MucPlan; pct: MucPlan; total: number };

export const MUCS: Muc[] = [1, 2, 3];
/** Tối đa mỗi mức một lần sinh (AI nhận tối đa 10 câu một lượt) và tổng một lần bấm */
export const MAX_PER_MUC = 10;
export const MAX_TOTAL = 20;

export const DEFAULT_MIX: MucMix = { by: 'count', count: { 1: 2, 2: 2, 3: 1 }, pct: { 1: 40, 2: 40, 3: 20 }, total: 10 };

/** Chia tổng số câu theo % (làm tròn theo phần dư lớn nhất để cộng lại đúng bằng tổng) */
export function planFromPct(total: number, pct: MucPlan): MucPlan {
  const sum = MUCS.reduce((s, m) => s + Math.max(0, pct[m]), 0);
  if (sum <= 0 || total <= 0) return { 1: 0, 2: 0, 3: 0 };
  const raw = MUCS.map((m) => (total * Math.max(0, pct[m])) / sum);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => ({ i, rest: r - Math.floor(r) })).sort((a, b) => b.rest - a.rest);
  for (let k = 0; out.reduce((s, x) => s + x, 0) < total; k++) out[order[k % 3].i] += 1;
  return { 1: Math.min(out[0], MAX_PER_MUC), 2: Math.min(out[1], MAX_PER_MUC), 3: Math.min(out[2], MAX_PER_MUC) };
}

/** Số câu từng mức sẽ sinh */
export function mixPlan(mix: MucMix): MucPlan {
  if (mix.by === 'pct') return planFromPct(Math.min(mix.total, MAX_TOTAL), mix.pct);
  return { 1: clamp(mix.count[1]), 2: clamp(mix.count[2]), 3: clamp(mix.count[3]) };
}
const clamp = (n: number) => Math.max(0, Math.min(MAX_PER_MUC, Math.round(Number.isFinite(n) ? n : 0)));

export const planTotal = (p: MucPlan) => p[1] + p[2] + p[3];
export const pctSum = (p: MucPlan) => p[1] + p[2] + p[3];
