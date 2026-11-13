// Lưu một bài thao giảng / bài giảng 3D để chiếu khi mất mạng:
// 1. Bật bộ nhớ đệm (public/sw.js); 2. tải ảnh / âm thanh / mô hình riêng của cô (đường dẫn ký) về thành Blob;
// 3. ghi vào IndexedDB; 4. mở trang /chieu-offline ẩn để trình duyệt giữ sẵn mã chạy, mô hình 3D, hình có sẵn của app.
import { createClient } from '@/lib/supabase/client';
import type { Deck } from '@/lib/deck/types';
import type { Lesson3D } from '@/lib/lesson3d/types';
import type { TeacherAsset } from '@/lib/assets/client';
import { offlineKey, putOffline, type OfflineItem } from './store';

const BUCKET = 'teacher-assets';
export const OFFLINE_PAGE = '/chieu-offline';
type Progress = (text: string) => void;

/** Đường dẫn kho của cô dùng trong bài thao giảng (ảnh, ảnh trong câu hỏi, âm thanh "asset:") + hình có sẵn của app (/stickers, /emoji…) */
export function deckRefs(deck: Deck): { assets: string[]; statics: string[] } {
  const assets = new Set<string>(), statics = new Set<string>();
  const walk = (v: unknown) => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    const o = v as Record<string, unknown>;
    if (o.asset === true && typeof o.src === 'string') assets.add(o.src);
    if (o.imageAsset && typeof o.image === 'string') assets.add(o.image);
    for (const x of Object.values(o)) {
      if (typeof x === 'string') {
        if (x.startsWith('asset:')) assets.add(x.slice(6));
        else if (/^\/[\w./-]+\.(?:webp|png|svg|jpg|jpeg|gif)$/i.test(x)) statics.add(x);
      } else walk(x);
    }
  };
  walk(deck);
  statics.forEach((s) => { if (assets.has(s)) statics.delete(s); });
  return { assets: [...assets], statics: [...statics] };
}

export async function ensureServiceWorker(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(r, 8000))]);
    return Boolean(navigator.serviceWorker.controller || (await navigator.serviceWorker.getRegistration())?.active);
  } catch { return false; }
}

async function download(paths: string[], progress: Progress): Promise<Record<string, Blob>> {
  const out: Record<string, Blob> = {};
  if (!paths.length) return out;
  const { data, error } = await createClient().storage.from(BUCKET).createSignedUrls(paths, 600);
  if (error) throw new Error('Chưa lấy được ảnh / âm thanh trong Kho của tôi. Kiểm tra mạng rồi thử lại.');
  let i = 0;
  for (const s of data ?? []) {
    i++; progress(`Đang tải tệp ${i}/${paths.length}…`);
    if (!s.signedUrl || !s.path) continue;
    const r = await fetch(s.signedUrl);
    if (!r.ok) throw new Error('Có tệp trong Kho của tôi chưa tải về được. Thử lại nhé.');
    out[s.path] = await r.blob();
  }
  return out;
}

/** Mở /chieu-offline?warm=<khoá> trong khung ẩn: trang dựng bài một lần để bộ nhớ đệm giữ mã chạy, mô hình, hình */
function warm(key: string, statics: string[]): Promise<void> {
  return new Promise((resolve) => {
    void Promise.all(statics.map((u) => fetch(u).catch(() => null)));
    const f = document.createElement('iframe');
    f.src = `${OFFLINE_PAGE}?warm=${encodeURIComponent(key)}`;
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    Object.assign(f.style, { position: 'fixed', left: '-10000px', top: '0', width: '1280px', height: '720px', opacity: '0', pointerEvents: 'none' });
    let done = false;
    const finish = () => { if (done) return; done = true; window.removeEventListener('message', onMsg); f.remove(); resolve(); };
    const onMsg = (e: MessageEvent) => { if (e.origin === location.origin && e.data === `edk-warm:${key}`) finish(); };
    window.addEventListener('message', onMsg);
    setTimeout(finish, 25000);
    document.body.appendChild(f);
  });
}

const size = (blobs: Record<string, Blob>, data: unknown) => Object.values(blobs).reduce((n, b) => n + b.size, 0) + new Blob([JSON.stringify(data)]).size;

async function finishSave(item: OfflineItem, statics: string[], progress: Progress) {
  progress('Đang lưu vào máy…');
  await putOffline(item);
  progress('Đang chuẩn bị để chiếu khi mất mạng…');
  await warm(item.key, statics);
}

async function roster(classId: string): Promise<{ id: string; name: string }[]> {
  const { data } = await createClient().rpc('teacher_class_roster', { p_class: classId });
  return ((data ?? []) as { student_id: string; display_name: string; membership_status: string }[])
    .filter((r) => r.membership_status === 'active').map((r) => ({ id: r.student_id, name: r.display_name }));
}

export async function saveDeckOffline(a: { deck: Deck; deckId: string; classId: string; className?: string }, progress: Progress): Promise<OfflineItem> {
  progress('Đang bật chế độ chiếu khi mất mạng…');
  if (!(await ensureServiceWorker())) throw new Error('Trình duyệt này chưa hỗ trợ chiếu khi mất mạng. Dùng Chrome hoặc Edge bản mới nhé.');
  const { assets, statics } = deckRefs(a.deck);
  const [blobs, students] = await Promise.all([download(assets, progress), roster(a.classId).catch(() => [])]);
  const item: OfflineItem = { key: offlineKey('deck', a.deckId), kind: 'deck', id: a.deckId, classId: a.classId, className: a.className ?? '', title: a.deck.title,
    savedAt: Date.now(), bytes: size(blobs, a.deck), deck: a.deck, students, blobs };
  await finishSave(item, statics, progress);
  return item;
}

export async function saveLesson3DOffline(a: { lesson: Lesson3D; lessonId: string; classId: string; className?: string }, progress: Progress): Promise<OfflineItem> {
  progress('Đang bật chế độ chiếu khi mất mạng…');
  if (!(await ensureServiceWorker())) throw new Error('Trình duyệt này chưa hỗ trợ chiếu khi mất mạng. Dùng Chrome hoặc Edge bản mới nhé.');
  const ids = [...new Set(a.lesson.objects.map((o) => o.type).filter((t) => t.startsWith('u-')).map((t) => t.slice(2)))];
  let rows: TeacherAsset[] = [];
  if (ids.length) {
    const { data, error } = await createClient().from('teacher_assets').select('id, kind, name, path, thumb_path, bytes, meta, created_at').in('id', ids);
    if (error) throw new Error('Chưa đọc được Vật thể của tôi. Kiểm tra mạng rồi thử lại.');
    rows = (data ?? []) as TeacherAsset[];
  }
  const blobs = await download(rows.map((r) => r.path), progress);
  const item: OfflineItem = { key: offlineKey('l3d', a.lessonId), kind: 'l3d', id: a.lessonId, classId: a.classId, className: a.className ?? '', title: a.lesson.title,
    savedAt: Date.now(), bytes: size(blobs, a.lesson), lesson: a.lesson, assets: rows, blobs };
  await finishSave(item, [], progress);
  return item;
}
