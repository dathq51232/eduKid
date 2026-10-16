'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { createClient } from '@/lib/supabase/client';

const LINK_ERRORS: Record<string, string> = {
  'lien-ket-het-han': 'Liên kết đặt lại mật khẩu đã hết hạn hoặc đã dùng rồi. Bạn gửi lại liên kết mới nhé.',
  'lien-ket-sai': 'Liên kết không hợp lệ. Bạn gửi lại liên kết mới nhé.',
};

// Quên mật khẩu — chỉ dành cho tài khoản người lớn (thầy cô, phụ huynh).
// Học sinh quên PIN thì nhờ thầy cô bấm "Đặt PIN mới".
function ForgotPassword() {
  const params = useSearchParams();
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(LINK_ERRORS[params.get('loi') ?? ''] ?? '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { error: err } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/xac-nhan?next=/dat-lai-mat-khau`,
      });
      // Không cho biết email có tồn tại hay không; chỉ báo lỗi khi bị giới hạn số lần gửi.
      if (err && /rate|too many|seconds/i.test(err.message)) {
        setError('Bạn vừa yêu cầu gần đây. Vui lòng đợi một lát rồi thử lại.');
        return;
      }
      setSent(true);
    } catch {
      setError('Không gửi được yêu cầu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand auth-brand" aria-label="EduChain Kids - Trang chủ"><BrandLogo size={40} /></Link>
        <h1>Quên mật khẩu</h1>
        <p className="auth-sub">Dành cho thầy cô và phụ huynh. Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt mật khẩu mới.</p>
        {!configured && <p className="adm-alert is-warn">Chưa kết nối Supabase. Xem docs/AUTH-SETUP.md.</p>}
        {sent ? (
          <p className="adm-alert is-ok" role="status">
            Nếu email <b>{email.trim()}</b> đã đăng ký, thư hướng dẫn đặt lại mật khẩu sẽ đến trong vài phút.
            Hãy kiểm tra cả mục Thư rác (Spam). Liên kết chỉ dùng được một lần.
          </p>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label className="adm-field">
              <span>Email</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="adm-alert is-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy || !configured}>
              <Mail aria-hidden="true" /> {busy ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
            </button>
          </form>
        )}
        <p className="auth-switch">Học sinh quên PIN? Em nhờ thầy cô đặt PIN mới nhé.</p>
        <Link href="/dang-nhap?vai=nguoi-lon" className="auth-back"><ArrowLeft size={16} aria-hidden="true" /> Quay lại đăng nhập</Link>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPassword />
    </Suspense>
  );
}
