'use client';

// Dữ liệu Xưởng video trên Supabase (migration 0064): thư viện nhân vật / bối cảnh dùng chung, dự án, ảnh tham chiếu.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LibItem } from './presets';
import type { VsProject } from './prompt';

export const BUCKET = 'video-refs';
export type LibKind = 'character' | 'setting';
export type ProjectRow = { id: string; title: string; owner: string; shared: boolean; updated_at: string };
type Row = { id: string; owner: string; kind: LibKind; name: string; note: string; anchor: string; refs: string[] | null; shared: boolean };

const toItem = (r: Row): LibItem => ({ id: r.id, name: r.name, note: r.note, anchor: r.anchor, refs: r.refs ?? [], owner: r.owner, shared: r.shared });

/** null = chưa chạy migration 0064 */
export async function loadLibrary(sb: SupabaseClient): Promise<{ characters: LibItem[]; settings: LibItem[] } | null> {
  const { data, error } = await sb.from('video_library').select('id, owner, kind, name, note, anchor, refs, shared').order('created_at');
  if (error) return null;
  const rows = (data ?? []) as Row[];
  return { characters: rows.filter((r) => r.kind === 'character').map(toItem), settings: rows.filter((r) => r.kind === 'setting').map(toItem) };
}

export async function saveLibItem(sb: SupabaseClient, kind: LibKind, it: LibItem): Promise<LibItem> {
  const row = { kind, name: it.name.trim().slice(0, 60), note: it.note.trim().slice(0, 200), anchor: it.anchor.trim().slice(0, 2000), refs: it.refs.slice(0, 4), shared: it.shared ?? true };
  const q = it.owner
    ? sb.from('video_library').update({ ...row, updated_at: new Date().toISOString() }).eq('id', it.id)
    : sb.from('video_library').insert(row);
  const { data, error } = await q.select('id, owner, kind, name, note, anchor, refs, shared').single();
  if (error) throw new Error(error.message);
  return toItem(data as Row);
}

export async function deleteLibItem(sb: SupabaseClient, it: LibItem) {
  const { error } = await sb.from('video_library').delete().eq('id', it.id);
  if (error) throw new Error(error.message);
  if (it.refs.length) await sb.storage.from(BUCKET).remove(it.refs);
}

/** Thu ảnh về cạnh dài tối đa 1280px, nén webp, tải lên thư mục của người dùng */
export async function uploadRef(sb: SupabaseClient, file: File): Promise<string> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error('Bạn cần đăng nhập.');
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('Không đọc được ảnh'))), 'image/webp', 0.88));
  const path = `${u.user.id}/${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/webp' });
  if (error) throw new Error(error.message);
  return path;
}

const signed = new Map<string, { url: string; until: number }>();
/** Đường dẫn ký (1 giờ) để xem / tải ảnh tham chiếu — nhớ tạm để không ký lại mỗi lần vẽ */
export async function signRefs(sb: SupabaseClient, paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const need = [...new Set(paths)].filter((p) => (signed.get(p)?.until ?? 0) <= now);
  if (need.length) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
    for (const d of data ?? []) if (d.path && d.signedUrl) signed.set(d.path, { url: d.signedUrl, until: now + 50 * 60_000 });
  }
  return Object.fromEntries(paths.flatMap((p) => (signed.get(p) ? [[p, signed.get(p)!.url]] : [])));
}

export async function listProjects(sb: SupabaseClient): Promise<ProjectRow[] | null> {
  const { data, error } = await sb.from('video_projects').select('id, title, owner, shared, updated_at').order('updated_at', { ascending: false }).limit(100);
  return error ? null : ((data ?? []) as ProjectRow[]);
}
export async function loadProject(sb: SupabaseClient, id: string): Promise<{ project: VsProject; owner: string; shared: boolean } | null> {
  const { data, error } = await sb.from('video_projects').select('id, owner, shared, data').eq('id', id).maybeSingle();
  if (error || !data) return null;
  const d = data as { id: string; owner: string; shared: boolean; data: VsProject };
  return { project: { ...d.data, id: d.id }, owner: d.owner, shared: d.shared };
}
export async function saveProject(sb: SupabaseClient, p: VsProject, shared: boolean): Promise<string> {
  const { id, ...data } = p;
  const row = { title: p.title.trim().slice(0, 120) || 'Video mới', data, shared, updated_at: new Date().toISOString() };
  const q = id ? sb.from('video_projects').update(row).eq('id', id) : sb.from('video_projects').insert(row);
  const { data: out, error } = await q.select('id').single();
  if (error) throw new Error(error.message);
  return (out as { id: string }).id;
}
export async function deleteProject(sb: SupabaseClient, id: string) {
  const { error } = await sb.from('video_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
