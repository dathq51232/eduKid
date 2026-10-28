// "Kho của tôi" (migration 0043): ảnh / mô hình giáo viên tự tải lên — hoa văn góc vở, vật thể 3D, tranh trong cảnh 3D.
// File đã chuẩn hoá trên trình duyệt (xem image.ts, lesson3d/user-model.ts) rồi mới tải lên bucket riêng tư teacher-assets.
import { createClient } from '@/lib/supabase/client';

export type AssetKind = 'deco' | 'model' | 'image';
export type TeacherAsset = {
  id: string; kind: AssetKind; name: string; path: string; thumb_path: string | null; bytes: number;
  meta: Record<string, unknown>; created_at: string;
  /** đường dẫn đã ký (1 giờ) */
  url?: string | null; thumb?: string | null;
};

const BUCKET = 'teacher-assets';
export const ASSET_LIMIT = 100 * 1024 * 1024;

const isMissing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST205' || e.code === '42P01' || e.code === 'PGRST202' || /teacher_assets|does not exist|schema cache|Bucket not found/i.test(e.message ?? ''));

export function assetError(e: unknown): string {
  const err = e as { code?: string; message?: string; statusCode?: string } | null;
  if (isMissing(err)) return 'Máy chủ chưa có "Kho của tôi" — cần chạy migration 0043_teacher_assets.sql trên Supabase.';
  const m = err?.message ?? (e instanceof Error ? e.message : '');
  if (/quota/.test(m)) return 'Kho của cô đã đầy 100 MB — xoá bớt file cũ rồi tải lại.';
  if (/too_many/.test(m)) return 'Kho tối đa 300 file — xoá bớt file cũ nhé.';
  if (/row-level security|violates|not_allowed|Unauthorized|403/i.test(m)) return 'Chỉ tài khoản giáo viên mới tải file lên kho được.';
  if (/mime|type/i.test(m)) return 'Loại file này máy chủ chưa nhận.';
  if (/size|too large|413/i.test(m)) return 'File quá lớn (tối đa 20 MB sau khi nén).';
  return m && m.length < 160 ? m : 'Chưa tải lên được, thử lại sau.';
}

export async function listAssets(kinds: AssetKind[]): Promise<TeacherAsset[]> {
  const sb = createClient();
  const { data, error } = await sb.from('teacher_assets').select('id, kind, name, path, thumb_path, bytes, meta, created_at').in('kind', kinds).order('created_at', { ascending: false }).limit(300);
  if (error) throw error;
  const rows = (data ?? []) as TeacherAsset[];
  const paths = [...new Set(rows.flatMap((r) => [r.path, r.thumb_path].filter(Boolean) as string[]))];
  if (paths.length) {
    const { data: signed } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
    const map = new Map((signed ?? []).filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl]));
    rows.forEach((r) => { r.url = map.get(r.path); r.thumb = r.thumb_path ? map.get(r.thumb_path) : undefined; });
  }
  return rows;
}

export async function assetUsage(): Promise<{ files: number; bytes: number; limit: number } | null> {
  const { data, error } = await createClient().rpc('teacher_assets_usage');
  return error ? null : (data as { files: number; bytes: number; limit: number });
}

const rnd = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
const extOf = (type: string) => (type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'glb');

/** Tải file đã chuẩn hoá lên kho + ghi vào danh sách. Lỗi ghi danh sách thì xoá file vừa tải. */
export async function uploadAsset(kind: AssetKind, name: string, file: Blob, opts: { thumb?: Blob | null; meta?: Record<string, unknown> } = {}): Promise<TeacherAsset> {
  const sb = createClient();
  // thư mục = id người dùng (chính sách lưu trữ trên máy chủ vẫn kiểm tra lại)
  const { data: ses } = await sb.auth.getSession();
  const uid = ses.session?.user.id;
  if (!uid) throw new Error('Cô cần đăng nhập lại.');
  const id = rnd();
  const type = file.type || 'application/octet-stream';
  const path = `${uid}/${kind}-${id}.${extOf(type)}`;
  const thumbPath = opts.thumb ? `${uid}/${kind}-${id}-thumb.${extOf(opts.thumb.type)}` : null;
  const st = sb.storage.from(BUCKET);
  const up = await st.upload(path, file, { contentType: type, upsert: false });
  if (up.error) throw up.error;
  if (opts.thumb && thumbPath) {
    const t = await st.upload(thumbPath, opts.thumb, { contentType: opts.thumb.type, upsert: false });
    if (t.error) { await st.remove([path]); throw t.error; }
  }
  const bytes = file.size + (opts.thumb?.size ?? 0);
  const { data, error } = await sb.from('teacher_assets')
    .insert({ kind, name: name.slice(0, 80), path, thumb_path: thumbPath, bytes, meta: opts.meta ?? {} })
    .select('id, kind, name, path, thumb_path, bytes, meta, created_at').single();
  if (error) { await st.remove([path, ...(thumbPath ? [thumbPath] : [])]); throw error; }
  const row = data as TeacherAsset;
  const { data: signed } = await st.createSignedUrls([path, ...(thumbPath ? [thumbPath] : [])], 3600);
  row.url = signed?.[0]?.signedUrl; row.thumb = thumbPath ? signed?.[1]?.signedUrl : undefined;
  return row;
}

export async function renameAsset(id: string, name: string) {
  const { error } = await createClient().from('teacher_assets').update({ name: name.slice(0, 80) }).eq('id', id);
  if (error) throw error;
}

export async function deleteAsset(a: TeacherAsset) {
  const sb = createClient();
  const { error } = await sb.from('teacher_assets').delete().eq('id', a.id);
  if (error) throw error;
  await sb.storage.from(BUCKET).remove([a.path, ...(a.thumb_path ? [a.thumb_path] : [])]);
}

export const fmtMB = (b: number) => `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0).replace('.', ',')} MB`;
