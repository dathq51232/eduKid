// Đọc dữ liệu Cộng đồng phía máy chủ (gọi các hàm community_* — migration 0079).
// Chưa chạy migration 0079: trả { ready: false } để trang hiện hướng dẫn thay vì báo lỗi.
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { CommunityTab, ResourceCard, ResourceKind } from './types';

export type ListFilter = { tab: CommunityTab; q: string; subject: string; grade: number | null; kind: ResourceKind | '' };
export type ListResult = { ready: true; items: ResourceCard[] } | { ready: false; reason: 'chua_cai' | 'loi' };

/** Hàm chưa có trong database (chưa chạy migration) */
const missingFn = (code?: string, msg?: string) => code === 'PGRST202' || code === '42883' || /could not find the function/i.test(msg ?? '');

export async function listResources(f: ListFilter): Promise<ListResult> {
  const sb = await createClient();
  const { data, error } = await sb.rpc('community_list', {
    p_tab: f.tab, p_q: f.q, p_subject: f.subject, p_grade: f.grade, p_kind: f.kind, p_limit: 48, p_offset: 0,
  });
  if (error) return { ready: false, reason: missingFn(error.code, error.message) ? 'chua_cai' : 'loi' };
  return { ready: true, items: (data ?? []) as ResourceCard[] };
}
