// Lưu / đọc dữ liệu tạo lịch báo giảng của khối (PPCT, lịch tuần, TKB các lớp).
// Có migration 0068 → dùng chung cả trường (lbg_get / lbg_save); chưa có → lưu tạm trên máy này.
import { createClient } from '@/lib/supabase/client';
import { emptyKhoi, emptyTkb, SLOTS, type KhoiData, type PpctItem, type Tkb } from './lbg';

export type KhoiLoad = { data: KhoiData; updatedAt: string | null; by: string | null; mode: 'cloud' | 'local' };
const LOCAL = (grade: number) => `edukid:lbg-khoi:${grade}`;
const missingFn = (msg: string) => /lbg_get|lbg_save|function .* does not exist|could not find the function|schema cache/i.test(msg);

/** Đưa dữ liệu đọc được về đúng dạng (bỏ dòng hỏng) */
export function normalizeKhoi(raw: unknown): KhoiData {
  const d = emptyKhoi();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<KhoiData>;
  if (Array.isArray(r.ppct)) d.ppct = r.ppct.filter((x): x is PpctItem => !!x && typeof x.s === 'string' && Number.isFinite(x.w) && Number.isFinite(x.n) && typeof x.t === 'string');
  if (typeof r.ppctSource === 'string') d.ppctSource = r.ppctSource;
  if (r.cal && typeof r.cal === 'object') d.cal = { start: typeof r.cal.start === 'string' ? r.cal.start : '', breaks: Array.isArray(r.cal.breaks) ? r.cal.breaks.filter((x) => typeof x === 'string') : [], days: r.cal.days === 6 ? 6 : 5 };
  if (r.tkb && typeof r.tkb === 'object') {
    for (const [k, v] of Object.entries(r.tkb)) {
      const t: Tkb = emptyTkb();
      const cells = (v as Tkb | undefined)?.cells;
      if (Array.isArray(cells)) for (let i = 0; i < 6; i++) for (let j = 0; j < SLOTS; j++) t.cells[i][j] = typeof cells[i]?.[j] === 'string' ? cells[i][j] : '';
      if (k.trim()) d.tkb[k.trim()] = t;
    }
  }
  if (typeof r.school === 'string') d.school = r.school;
  if (typeof r.agency === 'string') d.agency = r.agency;
  return d;
}

function readLocal(grade: number): KhoiData | null {
  try { const v = localStorage.getItem(LOCAL(grade)); return v ? normalizeKhoi(JSON.parse(v)) : null; } catch { return null; }
}

export async function loadKhoi(grade: number): Promise<KhoiLoad> {
  try {
    const { data, error } = await createClient().rpc('lbg_get', { p_grade: grade });
    if (error) throw error;
    const row = ((data ?? []) as { data: unknown; updated_at: string; updated_by_name: string | null }[])[0];
    return row ? { data: normalizeKhoi(row.data), updatedAt: row.updated_at, by: row.updated_by_name, mode: 'cloud' } : { data: emptyKhoi(), updatedAt: null, by: null, mode: 'cloud' };
  } catch (e) {
    // chưa chạy migration 0068 (hoặc không thuộc trường nào): dùng bản trên máy
    const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
    if (!missingFn(msg) && !/not_allowed/.test(msg)) console.warn('lbg_get', msg);
    return { data: readLocal(grade) ?? emptyKhoi(), updatedAt: null, by: null, mode: 'local' };
  }
}

export type SaveResult = { ok: true; updatedAt: string | null; mode: 'cloud' | 'local' } | { ok: false; reason: 'conflict' | 'too_large' | 'error'; message: string };

export async function saveKhoi(grade: number, data: KhoiData, expected: string | null, mode: 'cloud' | 'local'): Promise<SaveResult> {
  if (mode === 'cloud') {
    const { data: at, error } = await createClient().rpc('lbg_save', { p_grade: grade, p_data: data, p_expected: expected });
    if (!error) return { ok: true, updatedAt: (at as string | null) ?? null, mode: 'cloud' };
    if (/conflict/.test(error.message)) return { ok: false, reason: 'conflict', message: 'Có người vừa lưu dữ liệu khối này. Tải lại để xem bản mới rồi sửa tiếp.' };
    if (/too_large/.test(error.message)) return { ok: false, reason: 'too_large', message: 'Dữ liệu khối quá lớn để lưu (PPCT quá dài).' };
    if (!missingFn(error.message)) return { ok: false, reason: 'error', message: 'Chưa lưu được, thử lại sau.' };
  }
  try { localStorage.setItem(LOCAL(grade), JSON.stringify(data)); return { ok: true, updatedAt: null, mode: 'local' }; }
  catch { return { ok: false, reason: 'too_large', message: 'Trình duyệt không cho lưu (bộ nhớ đầy hoặc bị chặn).' }; }
}
