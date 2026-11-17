// Danh sách bài thao giảng của giáo viên (thẻ ở Kế hoạch bài dạy, Bài giảng & 3D) — chỉ đọc các cột nhỏ.
import 'server-only';
import type { createClient } from '@/lib/supabase/server';
import type { DeckRow } from '@/components/deck/DeckHome';

type Sb = Awaited<ReturnType<typeof createClient>>;
type Raw = { id: string; title: string; grade: number; updated_at: string; slide_count?: number | null; slides?: unknown; plan: string | null };

/** Đọc số trang từ cột slide_count (migration 0065). Chưa chạy migration thì lùi về cách cũ (tải mảng slides để đếm). */
export async function listDecks(supabase: Sb, limit = 200): Promise<{ rows: DeckRow[]; error: boolean }> {
  const base = 'id, title, grade, updated_at, plan:data->src->>plan';
  const q = (cols: string) => supabase.from('slide_decks').select(cols).order('updated_at', { ascending: false }).limit(limit);
  let res: { data: unknown[] | null; error: unknown } = await q(`${base}, slide_count`);
  if (res.error) res = await q(`${base}, slides:data->slides`);
  const rows = ((res.data ?? []) as Raw[]).map((d) => ({
    id: d.id, title: d.title, grade: d.grade, updated_at: d.updated_at,
    slides: typeof d.slide_count === 'number' ? d.slide_count : Array.isArray(d.slides) ? d.slides.length : undefined,
    plan: d.plan ?? undefined,
  }));
  return { rows, error: Boolean(res.error) };
}
