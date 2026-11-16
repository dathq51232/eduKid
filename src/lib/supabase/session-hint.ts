/** Có cookie phiên Supabase trên máy không (chỉ để quyết định có cần tải thư viện Supabase hay không — KHÔNG dùng để xác thực). */
export function hasSessionCookie(): boolean {
  return typeof document !== 'undefined' && /(?:^|;\s*)sb-[^=]*-auth-token/.test(document.cookie);
}
