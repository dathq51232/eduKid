'use client';
// Gọi Supabase cho Phòng triển lãm: đọc danh sách, ký đường dẫn ảnh, tải file lên, thêm / sửa / xoá, thả tim.
import { createClient } from '@/lib/supabase/client';
import type { GalleryData, GalleryItem, GalleryKind, HeartEmoji, NameMode, ThemeKey } from './types';

export const BUCKET = 'class-gallery';

const ERR: Record<string, string> = {
  not_allowed: 'Không có quyền với phòng triển lãm này.',
  too_many: 'Hôm nay em đã nộp nhiều bài rồi, mai nộp tiếp nhé.',
  gallery_full: 'Phòng triển lãm đã đầy, cô xoá bớt tác phẩm cũ nhé.',
  invalid_path: 'Đường dẫn file không hợp lệ.',
  not_in_class: 'Học sinh không thuộc lớp này.',
};
export function galleryError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e ?? '');
  for (const k of Object.keys(ERR)) if (m.includes(k)) return ERR[k];
  if (/gallery_(list|add)|function .* does not exist|schema cache/i.test(m)) return 'Máy chủ chưa có Phòng triển lãm: chạy migration 0039_class_gallery.sql trên Supabase rồi thử lại.';
  if (/bucket/i.test(m)) return 'Chưa có kho ảnh "class-gallery": chạy migration 0039 trên Supabase.';
  return m || 'Có lỗi, thử lại sau.';
}

/** Đọc danh sách + ký đường dẫn ảnh / tiếng (1 giờ) */
export async function loadGallery(classId: string): Promise<GalleryData> {
  const sb = createClient();
  const { data, error } = await sb.rpc('gallery_list', { p_class: classId });
  if (error) throw new Error(galleryError(error));
  const d = data as GalleryData;
  await signItems(d.items);
  return d;
}

export async function signItems(items: GalleryItem[]) {
  const paths = [...new Set(items.flatMap((i) => [i.path, i.audio_path]).filter((p): p is string => !!p))];
  if (!paths.length) return;
  const sb = createClient();
  const urls = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 100) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(paths.slice(i, i + 100), 3600);
    for (const r of data ?? []) if (r.path && r.signedUrl) urls.set(r.path, r.signedUrl);
  }
  for (const it of items) {
    it.url = urls.get(it.path);
    if (it.audio_path) it.audio_url = urls.get(it.audio_path);
  }
}

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
const extOf = (type: string) => (type.includes('webp') ? 'webp' : type.includes('png') ? 'png' : type.includes('jpeg') ? 'jpg' : type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : type.includes('mpeg') ? 'mp3' : 'webm');

/** Tải một file lên; học sinh tự nộp thì vào thư mục riêng s-<id>. Trả về đường dẫn trong bucket. */
export async function uploadFile(classId: string, blob: Blob, ownStudent?: string | null): Promise<string> {
  const type = (blob.type || 'image/webp').split(';')[0];
  const path = `${classId}/${ownStudent ? `s-${ownStudent}/` : ''}${rid()}.${extOf(type)}`;
  const { error } = await createClient().storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw new Error(galleryError(error));
  return path;
}

export type NewItem = { student: string | null; kind: GalleryKind; title: string; note: string; image: Blob; w: number; h: number; audio?: Blob | null; taken?: string | null };
/** Tải ảnh (+ tiếng) rồi ghi vào phòng triển lãm. ownStudent: học sinh tự nộp (chờ cô duyệt). */
export async function addItem(classId: string, it: NewItem, ownStudent?: string | null): Promise<string> {
  const path = await uploadFile(classId, it.image, ownStudent);
  let audio: string | null = null;
  try {
    if (it.audio) audio = await uploadFile(classId, it.audio, ownStudent);
    const { data, error } = await createClient().rpc('gallery_add', {
      p_class: classId, p_student: it.student, p_kind: it.kind, p_title: it.title, p_note: it.note,
      p_path: path, p_w: Math.round(it.w), p_h: Math.round(it.h), p_audio: audio, p_taken: it.taken ?? null,
    });
    if (error) throw new Error(galleryError(error));
    return data as string;
  } catch (e) {
    // ghi lỗi: dọn file vừa tải (giáo viên mới có quyền xoá; học sinh thì để đó, không ảnh hưởng)
    void createClient().storage.from(BUCKET).remove([path, ...(audio ? [audio] : [])]);
    throw e;
  }
}

export async function updateItem(id: string, patch: { status?: string; title?: string; note?: string; audio?: string | null; clearAudio?: boolean }) {
  const { error } = await createClient().rpc('gallery_update', {
    p_id: id, p_status: patch.status ?? null, p_title: patch.title ?? null, p_note: patch.note ?? null,
    p_audio: patch.audio ?? null, p_clear_audio: !!patch.clearAudio,
  });
  if (error) throw new Error(galleryError(error));
}

export async function deleteItem(id: string) {
  const sb = createClient();
  const { data, error } = await sb.rpc('gallery_delete', { p_id: id });
  if (error) throw new Error(galleryError(error));
  const paths = (data as string[] | null) ?? [];
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);
}

export async function toggleHeart(id: string, emoji: HeartEmoji): Promise<{ hearts: number; my_heart: HeartEmoji | null }> {
  const { data, error } = await createClient().rpc('gallery_heart', { p_id: id, p_emoji: emoji });
  if (error) throw new Error(galleryError(error));
  return data as { hearts: number; my_heart: HeartEmoji | null };
}

export async function saveSettings(classId: string, nameMode: NameMode, theme: ThemeKey) {
  const { error } = await createClient().rpc('gallery_set_settings', { p_class: classId, p_name_mode: nameMode, p_theme: theme });
  if (error) throw new Error(galleryError(error));
}

/** Kích thước ảnh của một Blob */
export async function imageSize(blob: Blob): Promise<{ w: number; h: number }> {
  const bmp = await createImageBitmap(blob);
  const r = { w: bmp.width, h: bmp.height };
  bmp.close();
  return r;
}

/** Canvas → Blob ảnh WebP (trình duyệt không hỗ trợ thì JPEG) */
export function canvasToImage(c: HTMLCanvasElement, quality = 0.86): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => {
    if (b && b.type === 'image/webp') return resolve(b);
    c.toBlob((j) => (j ? resolve(j) : reject(new Error('Không tạo được ảnh.'))), 'image/jpeg', quality);
  }, 'image/webp', quality));
}
