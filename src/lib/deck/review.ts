// Góp ý bài thao giảng theo trang (migration 0061): cô soạn bài bật link, đồng nghiệp trong tổ chuyên môn góp ý từng trang.
import type { SupabaseClient } from '@supabase/supabase-js';

export type DeckComment = { id: string; slide_id: string; author_name: string; body: string; resolved: boolean; created_at: string; mine: boolean };

export const reviewHref = (token: string) => `/gop-y/${token}`;

/** lỗi thường gặp → câu dễ hiểu cho cô */
export function reviewError(e: unknown): string {
  const er = e as { code?: string; message?: string } | null;
  const code = er?.code ?? '', m = er?.message ?? '';
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST202' || code === '42883' || /slide_deck_comments|deck_review|deck_comment_add|review_token/.test(m))
    return 'Chức năng góp ý chưa bật trên máy chủ (cần chạy migration 0061 trên Supabase).';
  if (code === '42501' || /not_allowed/.test(m)) return 'Không có quyền: link góp ý đã tắt hoặc tài khoản chưa là giáo viên.';
  if (code === 'P0003' || /too_many/.test(m)) return 'Bài đã có quá nhiều góp ý (tối đa 300). Cô soạn bài xoá bớt góp ý đã sửa.';
  if (code === 'P0004' || /rate_limited/.test(m)) return 'Hôm nay đã góp ý nhiều (tối đa 60 góp ý / ngày). Mai góp ý tiếp nhé.';
  return 'Chưa lưu được, kiểm tra mạng rồi thử lại.';
}

/** góp ý của bài (cô soạn bài đọc thẳng bảng — RLS chỉ cho người soạn) */
export async function ownerComments(sb: SupabaseClient, deckId: string): Promise<DeckComment[]> {
  const [{ data: u }, { data, error }] = await Promise.all([
    sb.auth.getUser(),
    sb.from('slide_deck_comments').select('id, slide_id, author, author_name, body, resolved, created_at').eq('deck_id', deckId).order('created_at'),
  ]);
  if (error) throw error;
  const me = u.user?.id;
  return ((data ?? []) as (Omit<DeckComment, 'mine'> & { author: string })[]).map(({ author, ...c }) => ({ ...c, mine: author === me }));
}

export async function reviewToken(sb: SupabaseClient, deckId: string): Promise<string | null> {
  const { data, error } = await sb.from('slide_decks').select('review_token').eq('id', deckId).maybeSingle();
  if (error) throw error;
  return (data as { review_token?: string | null } | null)?.review_token ?? null;
}

export async function setReviewLink(sb: SupabaseClient, deckId: string, on: boolean): Promise<string | null> {
  const { data, error } = await sb.rpc('deck_review_link', { p_deck: deckId, p_on: on });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function addComment(sb: SupabaseClient, deckId: string, slideId: string, body: string, token?: string): Promise<string> {
  const { data, error } = await sb.rpc('deck_comment_add', { p_deck: deckId, p_slide: slideId, p_body: body, p_token: token ?? null });
  if (error) throw error;
  return data as string;
}

export async function setResolved(sb: SupabaseClient, id: string, resolved: boolean) {
  const { error } = await sb.from('slide_deck_comments').update({ resolved }).eq('id', id);
  if (error) throw error;
}

export async function deleteComment(sb: SupabaseClient, id: string) {
  const { error } = await sb.from('slide_deck_comments').delete().eq('id', id);
  if (error) throw error;
}

export const timeAgo = (iso: string) => {
  const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
