import 'server-only';
import { createHmac, randomInt } from 'node:crypto';

// Tài khoản học sinh: không có email thật. Máy chủ dùng email nội bộ (tên miền .invalid không bao giờ nhận thư)
// và mật khẩu = HMAC(bí mật máy chủ, mã học sinh + PIN). Vì bí mật chỉ ở máy chủ, không ai dò PIN trực tiếp
// qua API đăng nhập của Supabase được; mọi lần đăng nhập học sinh phải qua /api/hoc-sinh/dang-nhap (có mã lớp
// và bộ đếm nhập sai).
export const STUDENT_EMAIL_DOMAIN = 'students.educhain.invalid';
export const MAX_PIN_FAILS = 5;
export const LOCK_MINUTES = 15;

export function studentEmail(studentId: string) {
  return `s-${studentId}@${STUDENT_EMAIL_DOMAIN}`;
}

function pepper(): string {
  const p = process.env.STUDENT_PIN_PEPPER;
  if (!p || p.length < 32) throw new Error('Thiếu STUDENT_PIN_PEPPER (ít nhất 32 ký tự, chỉ đặt ở máy chủ). Xem docs/AUTH-SETUP.md.');
  return p;
}

export function hasStudentLoginConfig(): boolean {
  const p = process.env.STUDENT_PIN_PEPPER;
  return Boolean(p && p.length >= 32 && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function studentPassword(studentId: string, pin: string): string {
  return 'p1.' + createHmac('sha256', pepper()).update(`${studentId}:${pin}`).digest('base64url');
}

const WEAK = new Set(['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '123456', '654321', '012345', '098765', '121212']);
/** PIN 6 số ngẫu nhiên (bỏ các dãy quá dễ đoán) */
export function generatePin(): string {
  for (;;) {
    const pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
    if (!WEAK.has(pin)) return pin;
  }
}

export const isPin = (v: unknown): v is string => typeof v === 'string' && /^\d{6}$/.test(v);
export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Chuẩn hóa mã lớp: "abc 123", "ABC123" -> "ABC-123"; sai dạng -> null */
export function normalizeClassCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const m = s.match(/^([A-HJ-NP-Z]{3})([0-9]{3})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}
