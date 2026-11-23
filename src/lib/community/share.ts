// Chia sẻ lên Cộng đồng từ trình soạn (bài giảng, giáo án) và "Sao chép về sửa" (migration 0079–0081). Chạy ở trình duyệt.
//  • Bài giảng: ảnh / âm thanh riêng của cô (kho teacher-assets, chỉ cô đọc được) được chép sang community-files/tai-lieu/<mã cô>/…
//    để đồng nghiệp xem được; bản chụp = { deck, assets }. Khi đồng nghiệp sao chép về, các file này lại được chép vào kho riêng
//    của người đó (teacher-assets) → bài chép về là của họ hoàn toàn, sửa thoải mái.
//  • Giáo án: bản chụp = { plan }; sao chép về → mở trong Kế hoạch bài dạy như giáo án mới (chưa lưu).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Deck } from '@/lib/deck/types';
import type { LessonPlan } from '@/lib/plans/generate';
import { uploadAsset } from '@/lib/assets/client';
import { FILE_BUCKET, safeName } from './files';
import type { License, Visibility } from './types';

export type ShareForm = {
  title: string; summary: string; subject: string; grade: number | null; lessonRef: string; license: License; visibility: Visibility;
};
export type DeckSnapshot = { deck: Deck; assets?: string[] };
export type PlanSnapshot = { plan: LessonPlan };

const ASSET_SOUND = 'asset:';
/** Đường dẫn kho riêng mà bài giảng dùng: ảnh của cô + âm thanh thu / tải lên */
export function deckAssets(deck: Deck): string[] {
  const s = new Set<string>();
  for (const sl of deck.slides) {
    for (const e of sl.els) if (e.kind === 'img' && e.asset && e.src) s.add(e.src);
    if (sl.sound?.startsWith(ASSET_SOUND)) s.add(sl.sound.slice(ASSET_SOUND.length));
    for (const a of sl.anims) if (a.sound?.startsWith(ASSET_SOUND)) s.add(a.sound.slice(ASSET_SOUND.length));
  }
  return [...s];
}
/** Bản sao bài giảng với đường dẫn file đổi theo bảng map (cũ → mới) */
export function remapDeck(deck: Deck, map: Map<string, string>): Deck {
  const snd = (v?: string) => (v?.startsWith(ASSET_SOUND) && map.has(v.slice(ASSET_SOUND.length)) ? ASSET_SOUND + map.get(v.slice(ASSET_SOUND.length)) : v);
  return {
    ...deck,
    slides: deck.slides.map((sl) => ({
      ...sl,
      sound: snd(sl.sound),
      els: sl.els.map((e) => (e.kind === 'img' && e.asset && map.has(e.src) ? { ...e, src: map.get(e.src)! } : e)),
      anims: sl.anims.map((a) => (a.sound ? { ...a, sound: snd(a.sound) } : a)),
    })),
  };
}

const rpcArgs = (f: ShareForm) => ({
  p_title: f.title.trim(), p_summary: f.summary.trim(), p_subject: f.subject, p_grade: f.grade, p_book: '',
  p_lesson_ref: f.lessonRef.trim(), p_license: f.license, p_visibility: f.visibility,
});

export async function publishDeck(sb: SupabaseClient, uid: string, deckId: string, deck: Deck, f: ShareForm, onStep?: (t: string) => void): Promise<string> {
  const paths = deckAssets(deck);
  const map = new Map<string, string>();
  for (const [i, p] of paths.entries()) {
    onStep?.(`Đang chép ảnh, âm thanh của bài (${i + 1}/${paths.length})…`);
    const { data, error } = await sb.storage.from('teacher-assets').download(p);
    if (error || !data) continue; // file đã xoá khỏi kho: bỏ qua, trang đó hiện khung trống
    const to = `tai-lieu/${uid}/${safeName(p.split('/').pop() ?? 'tep')}`;
    const up = await sb.storage.from(FILE_BUCKET).upload(to, data, { contentType: data.type || undefined });
    if (up.error) throw new Error(up.error.message);
    map.set(p, to);
  }
  onStep?.('Đang đăng…');
  const snapshot: DeckSnapshot = { deck: remapDeck(deck, map), assets: [...map.values()] };
  const { data, error } = await sb.rpc('community_publish', { p_kind: 'bai_giang', ...rpcArgs(f), p_snapshot: snapshot, p_source_table: 'slide_decks', p_source_id: deckId });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function publishPlan(sb: SupabaseClient, planId: string, plan: LessonPlan, f: ShareForm): Promise<string> {
  // bản gốc Word của trường có hình nằm trong kho giáo án riêng của trường: chia sẻ ra ngoài trường thì dùng khung soạn của app
  const outside = f.visibility === 'giao_vien' && /data-img=/.test(plan.orig?.html ?? '');
  const snapshot: PlanSnapshot = { plan: outside ? { ...plan, orig: undefined, useOrig: false } : plan };
  const { data, error } = await sb.rpc('community_publish', { p_kind: 'giao_an', ...rpcArgs(f), p_snapshot: snapshot, p_source_table: 'lesson_plans', p_source_id: planId });
  if (error) throw new Error(error.message);
  return data as string;
}

type Taken = { kind: 'bai_giang' | 'giao_an'; title: string; snapshot: DeckSnapshot | PlanSnapshot };
export async function takeCopy(sb: SupabaseClient, resourceId: string): Promise<Taken> {
  const { data, error } = await sb.rpc('community_take_copy', { p_id: resourceId });
  if (error) throw new Error(error.message);
  return data as Taken;
}

/** Chép bài giảng về kho của mình (gắn lớp classId) → trả mã bài mới để mở trình soạn */
export async function copyDeckToMine(sb: SupabaseClient, resourceId: string, classId: string, onStep?: (t: string) => void): Promise<string> {
  const t = await takeCopy(sb, resourceId);
  const snap = t.snapshot as DeckSnapshot;
  if (t.kind !== 'bai_giang' || !snap.deck) throw new Error('not_deck');
  const map = new Map<string, string>();
  for (const [i, p] of (snap.assets ?? []).entries()) {
    onStep?.(`Đang chép ảnh, âm thanh về kho của thầy cô (${i + 1}/${snap.assets!.length})…`);
    const { data } = await sb.storage.from(FILE_BUCKET).download(p);
    if (!data) continue;
    const kind = data.type.startsWith('audio/') ? 'audio' : 'image';
    const a = await uploadAsset(kind, p.split('/').pop()?.replace(/^[a-z0-9]+-/, '') ?? 'tep', data);
    map.set(p, a.path);
  }
  const deck = remapDeck(snap.deck, map);
  const { data, error } = await sb.from('slide_decks')
    .insert({ title: deck.title.slice(0, 120) || t.title.slice(0, 120), grade: deck.grade, class_id: classId, data: deck, remixed_from: resourceId })
    .select('id').single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

/** Lỗi máy chủ → câu tiếng Việt cho thầy cô */
export function shareError(m: string): string {
  if (/rate_limited/.test(m)) return 'Thầy cô đăng nhiều quá trong một giờ, thử lại sau nhé.';
  if (/bad_link/.test(m)) return 'Liên kết chưa hợp lệ: chỉ nhận liên kết https của Google Drive, OneDrive, YouTube hoặc Canva.';
  if (/not_owner/.test(m)) return 'Chỉ chia sẻ được bài của chính thầy cô.';
  if (/not_allowed/.test(m)) return 'Tác giả không cho sao chép tài liệu này.';
  if (/too_many/.test(m)) return 'Kho bài giảng của thầy cô đã đầy (tối đa 200 bài).';
  if (/quota|exceed|storage/i.test(m)) return 'Kho ảnh, âm thanh của thầy cô đã đầy, xoá bớt rồi thử lại.';
  if (/bucket not found|could not find the function|PGRST202|community_resources_kind_check/i.test(m)) return 'Tính năng chưa được bật trên máy chủ (cần chạy migration 0080, 0081).';
  return `Chưa thực hiện được: ${m}`;
}
