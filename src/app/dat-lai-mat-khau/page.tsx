import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import ResetPasswordForm from '@/components/classroom/ResetPasswordForm';
import { getViewer } from '@/lib/auth/viewer';

export const metadata: Metadata = { title: 'Đặt mật khẩu mới · EduChain Kids' };
export const dynamic = 'force-dynamic';

// Mở từ liên kết trong email (qua /auth/xac-nhan đã tạo phiên). Không có phiên = liên kết hết hạn.
export default async function ResetPasswordPage() {
  const viewer = await getViewer();
  if (viewer.state === 'ok' && viewer.isStudent) redirect('/hoc-sinh'); // học sinh dùng PIN, không đổi mật khẩu ở đây

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand auth-brand" aria-label="EduChain Kids - Trang chủ"><BrandLogo size={40} /></Link>
        <h1>Đặt mật khẩu mới</h1>
        {viewer.state === 'ok' ? (
          <>
            <p className="auth-sub">Tài khoản: <b>{viewer.email}</b></p>
            <ResetPasswordForm />
          </>
        ) : (
          <>
            <p className="adm-alert is-error" role="alert">
              {viewer.state === 'not_configured' ? 'Chưa kết nối Supabase.' : 'Liên kết đã hết hạn hoặc chưa mở từ email. Bạn gửi lại liên kết mới nhé.'}
            </p>
            <Link href="/quen-mat-khau" className="btn btn-primary auth-submit">Gửi lại liên kết</Link>
          </>
        )}
        <Link href="/dang-nhap?vai=nguoi-lon" className="auth-back"><ArrowLeft size={16} aria-hidden="true" /> Về trang đăng nhập</Link>
      </div>
    </main>
  );
}
