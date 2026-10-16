'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
    if (password !== again) return setError('Hai lần nhập mật khẩu chưa giống nhau.');
    setBusy(true);
    try {
      const { error: err } = await createClient().auth.updateUser({ password });
      if (err) {
        setError(/same|different/i.test(err.message) ? 'Mật khẩu mới phải khác mật khẩu cũ.' : /weak|password/i.test(err.message) ? 'Mật khẩu chưa đạt yêu cầu. Hãy dùng mật khẩu dài hơn.' : 'Chưa đổi được mật khẩu. Vui lòng gửi lại liên kết và thử lại.');
        return;
      }
      setDone(true);
      setTimeout(() => { router.replace('/sau-dang-nhap'); router.refresh(); }, 1200);
    } catch {
      setError('Chưa đổi được mật khẩu. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="adm-alert is-ok" role="status">Đã đổi mật khẩu. Đang chuyển vào trang của bạn…</p>;

  return (
    <form className="auth-form" onSubmit={submit}>
      <label className="adm-field"><span>Mật khẩu mới (ít nhất 8 ký tự)</span>
        <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="adm-field"><span>Nhập lại mật khẩu mới</span>
        <input type="password" autoComplete="new-password" required minLength={8} value={again} onChange={(e) => setAgain(e.target.value)} />
      </label>
      {error && <p className="adm-alert is-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
        <KeyRound aria-hidden="true" /> {busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
      </button>
    </form>
  );
}
