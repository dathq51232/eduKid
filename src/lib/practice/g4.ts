// Bộ sinh câu luyện tập lớp 4 (tách riêng để trang học chỉ tải đúng khối của em).
import { entry, type AnyPool, type Entry } from './core';
import { TOAN4_HK1, TOAN4_HK2 } from '../content/toan4';
import { T4_LESSONS, t4Id } from '../content/toan4-plan';
import { t4Context, t4Pool } from './toan4';
import { TV4_HK1, TV4_HK2, TV4_WEEKS, tv4Ctx, tv4WeekPool } from '../content/tv4';
import { TA4_HK1, TA4_HK2, TA4_SPECS, ta4SpecCtx } from '../content/ta4';
import { TA4G_POOL } from './ta4g';

export const ENTRIES_G4: Entry[] = [
  ...T4_LESSONS.map((p) => entry([...TOAN4_HK1, ...TOAN4_HK2].find((l) => l.id === t4Id(p.no)), () => t4Context(p), t4Pool(p.topics) as unknown as AnyPool, 4000 + p.no)),
  ...TV4_WEEKS.map((w) => entry([...TV4_HK1, ...TV4_HK2].find((l) => l.id === `tv4-kntt-t${String(w.week).padStart(2, '0')}`), () => tv4Ctx(w.week), tv4WeekPool(w.week) as unknown as AnyPool, 4100 + w.week)),
  ...TA4_SPECS.map((sp) => entry([...TA4_HK1, ...TA4_HK2].find((l) => l.id === sp.id), () => ta4SpecCtx(sp), TA4G_POOL as unknown as AnyPool, sp.sortNo)),
];
