// Hình ảnh của kho giáo án: lưu ở Supabase Storage (bucket "plan-library", thư mục theo trường),
// trong giáo án ghi là <img data-img="<sha1>.<đuôi>">. Chỉ chạy trên trình duyệt.

import { createClient } from '@/lib/supabase/client';
import type { DocImage } from '../docx-write';

export const BUCKET = 'plan-library';
export type LoadedImage = DocImage & { url: string };

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp' };
export const mimeOf = (name: string) => MIME[(name.split('.').pop() ?? '').toLowerCase()];

/** các khoá hình xuất hiện trong HTML */
export const imageKeys = (html: string) => [...new Set([...html.matchAll(/data-img="([^"]+)"/g)].map((m) => m[1]))];

let school: Promise<string | null> | null = null;
export function mySchool(): Promise<string | null> {
  school ??= (async () => {
    const { data, error } = await createClient().rpc('library_school');
    return error ? null : ((data as string | null) ?? null);
  })();
  return school;
}

const cache = new Map<string, Promise<LoadedImage | null>>();

/** Tải hình (có bộ nhớ đệm) — trả về map khoá → nội dung + đường dẫn blob để hiển thị */
export async function loadImages(keys: string[]): Promise<Map<string, LoadedImage>> {
  const out = new Map<string, LoadedImage>();
  if (!keys.length) return out;
  const sc = await mySchool();
  await Promise.all(keys.map(async (k) => {
    if (!cache.has(k)) cache.set(k, (async () => {
      if (!sc || !/^[0-9a-f]{40}\.[a-z]+$/.test(k)) return null;
      const { data, error } = await createClient().storage.from(BUCKET).download(`${sc}/${k}`);
      if (error || !data) return null;
      const bytes = new Uint8Array(await data.arrayBuffer());
      const mime = mimeOf(k) ?? data.type;
      return { bytes, mime, url: URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime })) };
    })());
    const v = await cache.get(k)!;
    if (v) out.set(k, v);
  }));
  return out;
}

const hexOf = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** Thu nhỏ hình lớn (> 300 KB hoặc cạnh > 1600 px) về JPEG để kho gọn; định dạng trình duyệt không hiển thị được (EMF, WMF, TIFF) thì bỏ */
export async function prepareImage(bytes: Uint8Array, name: string): Promise<{ bytes: Uint8Array; ext: string; mime: string } | null> {
  let ext = (name.split('.').pop() ?? '').toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  if (!['jpg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return null;
  const mime = MIME[ext];
  if (typeof createImageBitmap === 'undefined' || typeof document === 'undefined') return { bytes, ext, mime };
  try {
    const bmp = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
    const big = Math.max(bmp.width, bmp.height);
    if (bytes.length <= 300_000 && big <= 1600 && ext !== 'bmp' && ext !== 'webp') return { bytes, ext, mime };
    const k = Math.min(1, 1600 / big);
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext('2d')!;
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.85));
    if (!blob) return { bytes, ext, mime };
    const out = new Uint8Array(await blob.arrayBuffer());
    return out.length < bytes.length || ext === 'bmp' || ext === 'webp' ? { bytes: out, ext: 'jpg', mime: 'image/jpeg' } : { bytes, ext, mime };
  } catch {
    return null;
  }
}

/** Đưa hình lên kho, trả về khoá "<sha1>.<đuôi>" (trùng nội dung thì dùng lại) */
export async function uploadImage(img: { bytes: Uint8Array; ext: string; mime: string }): Promise<string | null> {
  const sc = await mySchool();
  if (!sc) return null;
  const key = `${hexOf(await crypto.subtle.digest('SHA-1', img.bytes as BufferSource))}.${img.ext}`;
  const { error } = await createClient().storage.from(BUCKET).upload(`${sc}/${key}`, img.bytes.buffer.slice(img.bytes.byteOffset, img.bytes.byteOffset + img.bytes.byteLength) as ArrayBuffer, { contentType: img.mime, upsert: true });
  if (error && !/exists|duplicate/i.test(error.message)) return null;
  cache.set(key, Promise.resolve({ bytes: img.bytes, mime: img.mime, url: URL.createObjectURL(new Blob([img.bytes as BlobPart], { type: img.mime })) }));
  return key;
}
