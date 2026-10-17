// Gửi kết quả lên máy chủ khi HỌC SINH đã đăng nhập. Khách (chưa đăng nhập) vẫn lưu trên trình duyệt như cũ;
// máy chủ trả 401/403 thì bỏ qua lặng lẽ. Máy chủ tự chấm lại, không tin điểm do trình duyệt gửi.
import type { AnswerValue } from './types';

const enabled = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export type SyncResult = { saved: boolean; reason?: string; score?: number; total?: number; points?: number };

/** Trạng thái lưu của bài vừa làm, để trang Kết quả báo cho học sinh biết bài đã tới thầy cô chưa. */
export const SYNC_KEY = 'edukid:last-sync';
export const SYNC_EVENT = 'edukid-sync';
export type SyncStatus = SyncResult & { lessonId: string; pending?: boolean };

export function writeSyncStatus(s: SyncStatus) {
  try { sessionStorage.setItem(SYNC_KEY, JSON.stringify(s)); } catch { /* bỏ qua */ }
  try { window.dispatchEvent(new Event(SYNC_EVENT)); } catch { /* bỏ qua */ }
}
export function readSyncStatus(): SyncStatus | null {
  try { const v = sessionStorage.getItem(SYNC_KEY); return v ? (JSON.parse(v) as SyncStatus) : null; } catch { return null; }
}
export const syncEnabled = () => enabled();

export async function syncLessonResult(p: { lessonId: string; seed?: number; muc?: number; answers: { questionId: string; answer: AnswerValue; spentMs: number }[] }): Promise<SyncResult> {
  if (!enabled()) return { saved: false };
  try {
    const res = await fetch('/api/tien-do', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p), keepalive: true });
    const data = (await res.json().catch(() => ({ saved: false, reason: `http_${res.status}` }))) as SyncResult;
    return data;
  } catch {
    return { saved: false, reason: 'network' };
  }
}

export function syncGameResult(p: { gameId: 'pattern' | 'memory' | 'maze'; level: number; score: number; maxScore: number; details?: Record<string, number> }) {
  if (!enabled()) return;
  void fetch('/api/tien-do/game', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p), keepalive: true }).catch(() => undefined);
}
