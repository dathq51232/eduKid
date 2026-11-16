'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogIn, UserRound } from 'lucide-react';
import { KidAvatar } from '@/components/home/HomeArt';
import { hasSessionCookie } from '@/lib/supabase/session-hint';
import '@/styles/account.css';

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function useSignedIn(): boolean | null {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    if (!configured) return;
    // Khách chưa đăng nhập (không có cookie phiên): biết ngay, KHÔNG tải thư viện Supabase (~65 KB) cho trang chủ / trang công khai
    if (!hasSessionCookie()) { setSignedIn(false); return; }
    let stop = () => {};
    let alive = true;
    void import('@/lib/supabase/client').then(({ createClient }) => {
      if (!alive) return;
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => { if (alive) setSignedIn(Boolean(data.session)); });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
      stop = () => sub.subscription.unsubscribe();
    });
    return () => { alive = false; stop(); };
  }, []);
  return signedIn;
}

/** Nút tài khoản trên thanh trên cùng (chỉ để điều hướng; quyền thật kiểm tra ở máy chủ). */
export default function AccountLink({ variant = 'button' }: { variant?: 'button' | 'avatar' }) {
  const signedIn = useSignedIn();
  if (variant === 'avatar') {
    const href = !configured ? '/thanh-tich' : signedIn ? '/sau-dang-nhap' : '/dang-nhap';
    const label = !configured ? 'Thành tích của em' : signedIn ? 'Trang của tôi' : 'Đăng nhập';
    return <Link href={href} className="kid-avatar" aria-label={label} title={label}><KidAvatar /></Link>;
  }
  if (!configured) return null;
  if (signedIn === null) return <span className="account-link is-loading" aria-hidden="true" />;
  return signedIn
    ? <Link href="/sau-dang-nhap" className="account-link"><UserRound aria-hidden="true" /> <span>Trang của tôi</span></Link>
    : (
      <>
        <Link href="/dang-nhap" className="account-link"><LogIn aria-hidden="true" /> <span>Đăng nhập</span></Link>
        <Link href="/dang-ky?vai=phu-huynh" className="account-cta">Dùng thử miễn phí</Link>
      </>
    );
}
