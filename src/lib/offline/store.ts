// Kho bài giảng lưu trên máy để chiếu khi mất mạng (IndexedDB của trình duyệt).
// Mỗi bài: dữ liệu bài + danh sách học sinh (gọi tên) + ảnh / âm thanh / mô hình riêng của cô (dạng Blob).
import type { Deck } from '@/lib/deck/types';
import type { Lesson3D } from '@/lib/lesson3d/types';
import type { TeacherAsset } from '@/lib/assets/client';

export type OfflineDeck = { key: string; kind: 'deck'; id: string; classId: string; className: string; title: string; savedAt: number; bytes: number;
  deck: Deck; students: { id: string; name: string }[]; blobs: Record<string, Blob> };
export type OfflineLesson3D = { key: string; kind: 'l3d'; id: string; classId: string; className: string; title: string; savedAt: number; bytes: number;
  lesson: Lesson3D; assets: Omit<TeacherAsset, 'url' | 'thumb'>[]; blobs: Record<string, Blob> };
export type OfflineItem = OfflineDeck | OfflineLesson3D;
export type OfflineSummary = Pick<OfflineItem, 'key' | 'kind' | 'id' | 'title' | 'className' | 'savedAt' | 'bytes'>;

const DB = 'edk-offline';
const STORE = 'items';
export const offlineKey = (kind: OfflineItem['kind'], id: string) => `${kind}:${id}`;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('Trình duyệt này không lưu được bài trên máy.')); return; }
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'key' }); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error ?? new Error('Không mở được kho trên máy.'));
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error ?? new Error('Lỗi kho trên máy.'));
      t.onabort = () => reject(t.error ?? new Error('Hết dung lượng lưu trên máy.'));
    });
  } finally { db.close(); }
}

export const putOffline = (item: OfflineItem) => tx('readwrite', (s) => s.put(item)).then(() => undefined);
export const getOffline = (key: string) => tx<OfflineItem | undefined>('readonly', (s) => s.get(key) as IDBRequest<OfflineItem | undefined>);
export const deleteOffline = (key: string) => tx('readwrite', (s) => s.delete(key)).then(() => undefined);
export async function listOffline(): Promise<OfflineSummary[]> {
  const all = await tx<OfflineItem[]>('readonly', (s) => s.getAll() as IDBRequest<OfflineItem[]>);
  return all.map(({ key, kind, id, title, className, savedAt, bytes }) => ({ key, kind, id, title, className, savedAt, bytes })).sort((a, b) => b.savedAt - a.savedAt);
}
