// Gửi kết quả lên máy chủ khi HỌC SINH đã đăng nhập. Khách (chưa đăng nhập) vẫn lưu trên trình duyệt như cũ;
// máy chủ trả 401/403 thì bỏ qua lặng lẽ. Máy chủ tự chấm lại, không tin điểm do trình duyệt gửi.
import type { AnswerValue } from './types';

const enabled = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export type SyncResult = { saved: boolean; score?: number; total?: number; points?: number };

export async function syncLessonResult(p: { lessonId: string; seed?: number; muc?: number; answers: { questionId: string; answer: AnswerValue; spentMs: number }[] }): Promise<SyncResult> {
  if (!enabled()) return { saved: false };
  try {
    const res = await fetch('/api/tien-do', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p), keepalive: true });
    return (await res.json()) as SyncResult;
  } catch {
    return { saved: false };
  }
}

export function syncGameResult(p: { gameId: 'pattern' | 'memory' | 'maze'; level: number; score: number; maxScore: number; details?: Record<string, number> }) {
  if (!enabled()) return;
  void fetch('/api/tien-do/game', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p), keepalive: true }).catch(() => undefined);
}
