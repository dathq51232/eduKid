// Bộ sinh câu luyện tập lớp 3 (tách riêng để trang học chỉ tải đúng khối của em).
import { entry, type AnyPool, type Entry } from './core';
import { TOAN3_HK1, TOAN3_HK2 } from '../content/toan3';
import { T3_LESSONS, t3Id } from '../content/toan3-plan';
import { t3Context, t3Pool } from './toan3';
import { TV3_HK1, TV3_HK2, TV3_WEEKS, tv3Ctx, tv3WeekPool } from '../content/tv3';
import { TA3_HK1, TA3_HK2, TA3_SPECS, ta3SpecCtx } from '../content/ta3';
import { TA3G_POOL } from './ta3g';

export const ENTRIES_G3: Entry[] = [
  ...T3_LESSONS.map((p) => entry([...TOAN3_HK1, ...TOAN3_HK2].find((l) => l.id === t3Id(p.no)), () => t3Context(p), t3Pool(p.topics) as unknown as AnyPool, 3000 + p.no)),
  ...TV3_WEEKS.map((w) => entry([...TV3_HK1, ...TV3_HK2].find((l) => l.id === `tv3-kntt-t${String(w.week).padStart(2, '0')}`), () => tv3Ctx(w.week), tv3WeekPool(w.week) as unknown as AnyPool, 3100 + w.week)),
  ...TA3_SPECS.map((sp) => entry([...TA3_HK1, ...TA3_HK2].find((l) => l.id === sp.id), () => ta3SpecCtx(sp), TA3G_POOL as unknown as AnyPool, sp.sortNo)),
];
