'use client';

// Dải chào trên trang chủ khi đã đăng nhập: đưa thẳng về trang riêng (bài cô giao, chuỗi ngày học…).
// Trang chủ vẫn tĩnh; chỉ kiểm tra phiên đăng nhập trên trình duyệt.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function HomeWelcome() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setOn(Boolean(data.session))).catch(() => undefined);
  }, []);
  if (!on) return null;
  return (
    <div className="home-welcome wrap" role="region" aria-label="Tiếp tục học">
      <p><span aria-hidden="true">👋</span> <b>Chào mừng trở lại!</b> <span>Bài cô giao, chuỗi ngày học và kết quả của em ở trang riêng.</span></p>
      <Link href="/sau-dang-nhap" className="btn btn-yellow btn-sm">Vào trang của tôi <ArrowRight aria-hidden="true" /></Link>
    </div>
  );
}
