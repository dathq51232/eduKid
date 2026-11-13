import 'server-only';
import { createAdminClient, hasServiceRole } from '@/lib/supabase/admin';

// Giới hạn số lần gọi theo khóa (thường là IP) trong bộ nhớ của tiến trình máy chủ.
// Chỉ là lớp chống dò nhanh; bộ đếm nhập sai PIN thật nằm trong database (student_login_guards).
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

let sharedMissing = false;

/** Xem khoá đã vượt giới hạn trong bộ nhớ chưa, không cộng thêm */
function peek(key: string, limit: number): boolean {
  const b = buckets.get(key);
  return !b || b.reset < Date.now() || b.count < limit;
}

/** Giới hạn DÙNG CHUNG cho mọi bản máy chủ (đếm trong database, migration 0054). Chặn nhanh bằng bộ nhớ trước;
 *  database lỗi hoặc chưa chạy migration thì chỉ dựa vào bộ nhớ (không chặn nhầm người dùng). */
export async function rateLimitShared(key: string, limit: number, windowMs: number, opts: { peek?: boolean } = {}): Promise<boolean> {
  if (opts.peek ? !peek(key, limit) : !rateLimit(key, limit, windowMs)) return false;
  if (sharedMissing || !hasServiceRole()) return true;
  try {
    const { data, error } = await createAdminClient().rpc('rate_hit', { p_key: key, p_limit: limit, p_window_seconds: Math.ceil(windowMs / 1000), p_count: !opts.peek });
    if (error) {
      if (/PGRST202|42883/.test(error.code ?? '')) { sharedMissing = true; console.warn('[rate-limit] Chưa chạy migration 0054_rate_limits: dùng bộ đếm trong bộ nhớ.'); }
      return true;
    }
    return data !== false;
  } catch {
    return true;
  }
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'local';
}
