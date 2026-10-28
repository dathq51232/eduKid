// Bộ sinh câu luyện tập lớp 2 (tách riêng để trang học chỉ tải đúng khối của em).
import { entry, type AnyPool, type Entry } from './core';
import { TOAN2_HK1, TOAN2_HK2 } from '../content/toan2';
import { T2_LESSONS, t2Id } from '../content/toan2-plan';
import { t2Context, t2Pool } from './toan2';
import { TV2_HK1, TV2_HK2, TV2_WEEKS, tv2Ctx } from '../content/tv2';
import { TV2G_POOL } from './tv2g';
import { TA2_HK1, TA2_HK2, TA2_SPECS, ta2SpecCtx } from '../content/ta2';
import { TA2G_POOL } from './ta2g';

export const ENTRIES_G2: Entry[] = [
  // Toán 2 — Bài 1–75
  ...T2_LESSONS.map((p) => entry([...TOAN2_HK1, ...TOAN2_HK2].find((l) => l.id === t2Id(p.no)), () => t2Context(p), t2Pool(p.topics) as unknown as AnyPool, 2000 + p.no)),
  // Tiếng Việt 2 — Tuần 1–35
  ...TV2_WEEKS.map((w) => entry([...TV2_HK1, ...TV2_HK2].find((l) => l.id === `tv2-kntt-t${String(w.week).padStart(2, '0')}`), () => tv2Ctx(w.week), TV2G_POOL as unknown as AnyPool, 2100 + w.week)),
  // Tiếng Anh 2 — Unit 1–16, Fun time 1–4, Review 1–4
  ...TA2_SPECS.map((sp) => entry([...TA2_HK1, ...TA2_HK2].find((l) => l.id === sp.id), () => ta2SpecCtx(sp), TA2G_POOL as unknown as AnyPool, sp.sortNo)),
];
