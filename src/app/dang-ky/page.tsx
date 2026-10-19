'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import { createClient } from '@/lib/supabase/client';
import { ADMIN_CONTACT, FREE_STUDENT_LIMIT } from '@/lib/contact';

type Role = 'teacher';

function signupError(message: string): string {
  if (/already registered|already exists/i.test(message)) return 'Email này đã có tài khoản. Bạn hãy đăng nhập.';
  if (/password/i.test(message)) return 'Mật khẩu chưa đạt yêu cầu (ít nhất 8 ký tự).';
  if (/rate|too many/i.test(message)) return 'Thử quá nhiều lần. Vui lòng đợi vài phút.';
  return 'Không đăng ký được. Vui lòng thử lại.';
}

// Đăng ký tài khoản NGƯỜI LỚN. Học sinh không tự đăng ký: thầy cô tạo tài khoản cho cả lớp.
export default function SignupPage() {
  const router = useRouter();
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const role: Role = 'teacher'; // chỉ còn tài khoản giáo viên (đã bỏ mục phụ huynh)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
    if (role === 'teacher' && school.trim().length < 2) return setError('Vui lòng nhập tên trường.');
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Chỉ là thông tin hiển thị; vai trò KHÔNG lấy từ đây (cấp qua hàm request_teacher_role — gói miễn phí)
          data: { display_name: name.trim().slice(0, 100), wants_teacher: role === 'teacher', school_name: school.trim().slice(0, 180) },
          emailRedirectTo: `${window.location.origin}/auth/xac-nhan?next=/sau-dang-nhap`,
        },
      });
      if (err) return setError(signupError(err.message));
      if (!data.session) {
        setDone('Đã gửi thư xác nhận tới email của bạn. Mở thư, bấm xác nhận rồi đăng nhập.' + (role === 'teacher' ? ' Sau khi đăng nhập, vào mục Giáo viên bấm “Bắt đầu dùng miễn phí” là dùng được ngay.' : ''));
        return;
      }
      if (role === 'teacher') {
        const { error: reqErr } = await supabase.rpc('request_teacher_role', { p_school_name: school.trim(), p_note: null });
        if (reqErr) return setError('Đã tạo tài khoản nhưng chưa bật được quyền giáo viên. Bạn vào mục Giáo viên bấm “Bắt đầu dùng miễn phí”.');
      }
      router.replace('/sau-dang-nhap');
      router.refresh();
    } catch {
      setError('Không đăng ký được. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="brand auth-brand" aria-label="EduChain Kids - Trang chủ"><BrandLogo size={40} /></Link>
        <h1>Đăng ký</h1>
        <p className="auth-sub">Dành cho thầy cô. Tài khoản học sinh do thầy cô tạo trong mục Quản lý lớp.</p>
        {!configured && <p className="adm-alert is-warn">Chưa kết nối Supabase nên chưa đăng ký được. Xem docs/AUTH-SETUP.md.</p>}
        {done ? (
          <p className="adm-alert is-ok" role="status">{done}</p>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label className="adm-field"><span>Họ tên</span>
              <input autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="adm-field"><span>Email</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="adm-field"><span>Mật khẩu (ít nhất 8 ký tự)</span>
              <input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {role === 'teacher' && (
              <label className="adm-field"><span>Trường đang dạy</span>
                <input required maxLength={180} placeholder="Trường Tiểu học …" value={school} onChange={(e) => setSchool(e.target.value)} />
              </label>
            )}
            {role === 'teacher' ? (
              <p className="adm-alert is-info">Giáo viên đăng ký <strong>miễn phí</strong>, dùng được ngay: 1 lớp, tối đa {FREE_STUDENT_LIMIT} học sinh. Cần thêm học sinh, liên hệ quản trị {ADMIN_CONTACT.phoneDisplay} (Zalo) — {ADMIN_CONTACT.email}.</p>
            ) : (
              <p className="adm-alert is-info">Sau khi đăng ký, nhập mã mời do thầy cô gửi để xem tiến độ của con.</p>
            )}
            <label className="check-line">
              <input type="checkbox" required checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>Tôi đồng ý dùng EduChain Kids đúng mục đích học tập và bảo vệ thông tin của học sinh.</span>
            </label>
            {error && <p className="adm-alert is-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary auth-submit" disabled={busy || !configured || !agree}>
              <UserPlus aria-hidden="true" /> {busy ? 'Đang đăng ký…' : 'Đăng ký'}
            </button>
          </form>
        )}
        <p className="auth-switch">Đã có tài khoản? <Link href="/dang-nhap?vai=nguoi-lon">Đăng nhập</Link></p>
        <Link href="/" className="auth-back"><ArrowLeft size={16} aria-hidden="true" /> Về trang chủ</Link>
      </div>
    </main>
  );
}
