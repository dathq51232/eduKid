import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { safeNext } from '@/lib/auth/safe-next';

const OTP_TYPES: EmailOtpType[] = ['signup', 'recovery', 'invite', 'magiclink', 'email', 'email_change'];

// Đích của các liên kết trong email (xác nhận đăng ký, đặt lại mật khẩu).
// Đổi mã một lần trong liên kết lấy phiên đăng nhập (lưu cookie), rồi chuyển tới trang nội bộ `next`.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'), '/sau-dang-nhap');
  const fail = (reason: string) => NextResponse.redirect(new URL(`/quen-mat-khau?loi=${reason}`, url));
  if (!hasSupabaseEnv()) return NextResponse.redirect(new URL('/dang-nhap', url));

  const supabase = await createClient();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail('lien-ket-het-han');
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail('lien-ket-het-han');
  } else {
    return fail('lien-ket-sai');
  }
  return NextResponse.redirect(new URL(next, url));
}
