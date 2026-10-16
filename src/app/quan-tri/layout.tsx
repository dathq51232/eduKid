import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/brand/ThemeToggle';
import { redirect } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';
import AdminNav from '@/components/admin/AdminNav';
import { AdminProvider } from '@/components/admin/AdminContext';
import { getStaffContext } from '@/lib/auth/staff';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quản trị — EduChain Kids', robots: { index: false, follow: false } };

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>{title}</h1>
        {children}
      </div>
    </main>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getStaffContext();

  if (ctx.state === 'not_configured') {
    return (
      <Notice title="Chưa kết nối Supabase">
        <p className="auth-sub">Trang quản trị cần Supabase. Điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY vào file .env.local, chạy các migration 0001 → 0004 rồi khởi động lại npm run dev.</p>
        <Link href="/" className="button button-yellow">Về trang chủ</Link>
      </Notice>
    );
  }
  if (ctx.state === 'signed_out') redirect('/dang-nhap?next=/quan-tri');
  if (ctx.state === 'forbidden') {
    return (
      <Notice title="Chưa có quyền truy cập">
        <p className="auth-sub">Tài khoản {ctx.email} chưa được cấp vai trò giáo viên hoặc quản trị. Hãy nhờ quản trị viên cấp quyền.</p>
        <form action="/dang-xuat" method="post">
          <button type="submit" className="button button-white">Đăng xuất</button>
        </form>
      </Notice>
    );
  }

  const user = { userId: ctx.userId, email: ctx.email, displayName: ctx.displayName, isAdmin: ctx.isAdmin, isTeacher: ctx.isTeacher };

  return (
    <AdminProvider value={user}>
      <div className="adm">
        <header className="adm-top">
          <div className="adm-top-inner">
            <Link href="/quan-tri" className="brand adm-brand">
              <BrandLogo size={34} />
              <span className="adm-brand-tag">Quản trị</span>
            </Link>
            <div className="adm-user">
              <ThemeToggle />
              <Link href="/" className="adm-top-link" target="_blank">
                <ExternalLink size={16} aria-hidden="true" /> <span>Trang học sinh</span>
              </Link>
              <span className="adm-user-name">
                {ctx.displayName}
                <small>{ctx.isAdmin ? 'Quản trị hệ thống' : 'Giáo viên'}</small>
              </span>
              <form action="/dang-xuat" method="post">
                <button type="submit" className="adm-top-link" aria-label="Đăng xuất">
                  <LogOut size={16} aria-hidden="true" /> <span>Đăng xuất</span>
                </button>
              </form>
            </div>
          </div>
          <div className="adm-top-inner">
            <AdminNav />
          </div>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </AdminProvider>
  );
}
