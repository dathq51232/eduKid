import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client quyền cao (service_role) — CHỈ dùng ở máy chủ, cho các việc RLS cố ý không cho phép từ trình duyệt:
//   tạo tài khoản học sinh, đặt/đổi PIN, đọc mã lớp khi học sinh đăng nhập, ghi kết quả đã chấm lại.
// Khóa SUPABASE_SERVICE_ROLE_KEY không bao giờ đặt trong biến NEXT_PUBLIC_*.
export function hasServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY (chỉ đặt ở máy chủ). Xem docs/AUTH-SETUP.md.');
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
