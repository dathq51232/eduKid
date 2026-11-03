// Xuất lịch báo giảng tuần: chọn mẫu (mẫu trường A4 dọc / trang ngang), rút gọn ND tích hợp khi cần, giãn hàng cho đầy trang;
// tự tìm cỡ chữ để lịch vừa đúng 1 trang; xuất thêm bản Excel theo mẫu trường (đã đặt "vừa 1 trang").
import type { LessonPlan } from './generate';
import { viDate } from './generate';
import type { ScheduleRow } from './schedule';
import { fitWeek, type FitResult } from './fit';
import { SCHOOL_COLS, WEEK_HEAD, dayName, sessionSpan, shortIntegration, weekDocument, weekEntries } from './word';
import { XS, range, type XCell, type XSheet } from '../xlsx';

export type WeekArgs = { monday: string; plans: LessonPlan[]; school: string; className: string; withPlans: boolean; skipped?: ScheduleRow[] };
export type WeekOpts = { layout: 'school' | 'land'; short: 'auto' | 'full'; stretch: boolean };
export const DEFAULT_WEEK_OPTS: WeekOpts = { layout: 'school', short: 'auto', stretch: true };

const KEY = 'edukid:week-opts';
export function loadWeekOpts(): WeekOpts {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<WeekOpts> | null; return { ...DEFAULT_WEEK_OPTS, ...(v ?? {}) }; } catch { return DEFAULT_WEEK_OPTS; }
}
export function saveWeekOpts(o: WeekOpts) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch { /* bỏ qua */ } }

const num = (n: number) => String(n).replace('.', ',');
/** "rút gọn khi cần": chỉ rút gọn nếu bản đầy đủ phải xuống dưới cỡ chữ này */
const SHORT_BELOW = 11;

/** Dựng văn bản xem trước / xuất Word cho tuần, cỡ chữ tự vừa 1 trang */
export function weekExport(a: WeekArgs, o: WeekOpts): { html: string; note: string; bad: boolean; font?: number } {
  const skipped = a.skipped ?? [];
  const build = (short: boolean) => (f: number, rowPt?: number) => weekDocument(a.monday, a.plans, a.school, a.className, false, skipped, { font: f, layout: o.layout, short, rowPt });
  const fit = (short: boolean) => fitWeek(build(short), { layout: o.layout, stretch: o.stretch });
  let short = false;
  let r: FitResult | null = fit(false);
  const longCells = weekEntries(a.monday, a.plans, skipped).byDay.flat().filter((p) => p.integration && shortIntegration(p.integration) !== p.integration.trim()).length;
  if (o.short === 'auto' && longCells && r && (!r.fits || r.font < SHORT_BELOW)) {
    const r2 = fit(true);
    if (r2 && (r2.font > r.font || (r2.fits && !r.fits) || (!r.fits && !r2.fits))) { r = r2; short = true; }
  }
  const html = weekDocument(a.monday, a.plans, a.school, a.className, a.withPlans, skipped, { font: r?.font, layout: o.layout, short, rowPt: r?.rowPt });
  if (!r) return { html, note: '', bad: false };
  const note = r.fits
    ? `Lịch vừa 1 trang${o.layout === 'school' ? ' A4 dọc' : ' ngang'} · cỡ chữ ${num(r.font)}${short ? ` · rút gọn ${longCells} ô tích hợp (bản đầy đủ vẫn ở giáo án)` : ''}${r.rowPt ? ' · đã giãn hàng cho đầy trang' : ''}`
    : `Lịch quá dài: ở cỡ chữ ${num(r.font)} vẫn tràn sang trang 2 — ${o.short === 'full' ? 'chọn "Rút gọn khi cần" hoặc ' : ''}bớt chữ ở cột ND tích hợp / tên bài`;
  return { html, note, bad: !r.fits, font: r.font };
}

/** Bản Excel lịch báo giảng theo mẫu trường: A4 dọc, lề 1 cm (trái 1,5 cm), in vừa đúng 1 trang */
export function weekSheet(a: WeekArgs, o: WeekOpts): XSheet {
  const { days, byDay, week } = weekEntries(a.monday, a.plans, a.skipped ?? []);
  const rows: XCell[][] = [];
  const merges: string[] = [];
  const heights: Record<number, number> = {};
  rows.push([{ v: `KẾ HOẠCH DẠY HỌC LỚP ${(a.className || '……').toUpperCase()}`, s: XS.title }]); merges.push(range(0, 0, 0, 7)); heights[0] = 20;
  rows.push([{ v: `Tuần: ${week || '……'}`, s: XS.boldLeft }, null, null, { v: `Từ ngày: ${viDate(days[0])}    Đến ngày: ${viDate(days[days.length - 1])}`, s: XS.boldLeft }]);
  merges.push(range(1, 0, 1, 2), range(1, 3, 1, 7)); heights[1] = 18;
  rows.push(WEEK_HEAD.map((t) => ({ v: t, s: XS.header }))); heights[2] = 32;
  // chiều cao hàng ước theo số dòng chữ của ô dài nhất (cỡ 11, ~1,1 ký tự mỗi đơn vị bề rộng cột)
  const lines = (t: string, col: number) => t.split('\n').reduce((s, l) => s + Math.max(1, Math.ceil(l.length / (SCHOOL_COLS[col] * 1.1))), 0);
  byDay.forEach((list, di) => {
    const r0 = rows.length;
    const dayCell = { v: `${dayName(days[di])}\n${viDate(days[di])}`, s: XS.header };
    if (!list.length) { rows.push([dayCell, { v: '', s: XS.center }, { v: '', s: XS.center }, { v: '', s: XS.text }, { v: '', s: XS.center }, { v: '', s: XS.text }, { v: '', s: XS.text }, { v: '', s: XS.text }]); heights[r0] = 18; return; }
    list.forEach((p, i) => {
      const integ = (o.short === 'auto' && p.integration ? shortIntegration(p.integration) : p.integration) ?? '';
      const t = p.red ? XS.red : XS.text;
      const span = sessionSpan(list, i);
      const r = rows.length;
      rows.push([
        i === 0 ? dayCell : { v: '', s: XS.header },
        span ? { v: p.session ?? '', s: XS.header } : { v: '', s: XS.header },
        { v: p.period || '', s: XS.center }, { v: p.subject, s: p.red ? XS.redBold : XS.boldText }, { v: p.ppct ?? '', s: XS.center },
        { v: p.title, s: t }, { v: integ, s: t }, { v: p.adjust ?? '', s: t },
      ]);
      if (span > 1) merges.push(range(r, 1, r + span - 1, 1));
      heights[r] = Math.max(17, 14 * Math.max(lines(p.title, 5), lines(integ, 6), lines(p.subject, 3), lines(p.adjust ?? '', 7)) + 3);
    });
    if (list.length > 1) merges.push(range(r0, 0, r0 + list.length - 1, 0));
  });
  return { name: `Tuan ${week || viDate(days[0]).replace(/\//g, '-')}`, rows, merges, heights, cols: SCHOOL_COLS, onePage: true, margins: [0.39, 0.39, 0.39, 0.59], center: true };
}
