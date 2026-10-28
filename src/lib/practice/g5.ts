// Bộ sinh câu luyện tập lớp 5 (tách riêng để trang học chỉ tải đúng khối của em).
import { entry, type AnyPool, type Entry } from './core';
import { TOAN5_HK1, TOAN5_HK2 } from '../content/toan5';
import { T5_LESSONS, t5Id } from '../content/toan5-plan';
import { t5Context, t5Pool } from './toan5';
import { TV5_HK1, TV5_HK2, TV5_WEEKS, tv5Ctx, tv5WeekPool } from '../content/tv5';
import { TA5_HK1, TA5_HK2, TA5_SPECS, ta5SpecCtx } from '../content/ta5';
import { TA5G_POOL } from './ta5g';

export const ENTRIES_G5: Entry[] = [
  ...T5_LESSONS.map((p) => entry([...TOAN5_HK1, ...TOAN5_HK2].find((l) => l.id === t5Id(p.no)), () => t5Context(p), t5Pool(p.topics) as unknown as AnyPool, 5000 + p.no)),
  ...TV5_WEEKS.map((w) => entry([...TV5_HK1, ...TV5_HK2].find((l) => l.id === `tv5-kntt-t${String(w.week).padStart(2, '0')}`), () => tv5Ctx(w.week), tv5WeekPool(w.week) as unknown as AnyPool, 5100 + w.week)),
  ...TA5_SPECS.map((sp) => entry([...TA5_HK1, ...TA5_HK2].find((l) => l.id === sp.id), () => ta5SpecCtx(sp), TA5G_POOL as unknown as AnyPool, sp.sortNo)),
];
