// Chỉ cho chuyển hướng sau đăng nhập tới đường dẫn nội bộ (chặn //host, /\host, http://…).
export function safeNext(value: string | null | undefined, fallback = ''): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
