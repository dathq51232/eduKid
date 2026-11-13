'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, BookOpen, CreditCard, LayoutDashboard, LineChart, ListTree, Megaphone, ScrollText, UserCheck, Users } from 'lucide-react';
import { useAdminUser } from './AdminContext';
import { FEATURES } from '@/lib/features';
import type { NavCounts } from '@/lib/admin/insights';

/** Menu quản trị (thanh bên trái; trên điện thoại nằm trong nút ☰). Số đỏ = việc chưa xử lý. */
export default function AdminNav({ counts }: { counts?: NavCounts | null }) {
  const pathname = usePathname();
  const { isAdmin } = useAdminUser();
  const items = [
    { href: '/quan-tri', label: 'Tổng quan', icon: LayoutDashboard, exact: true, show: true },
    { href: '/quan-tri/thong-bao', label: 'Thông báo', icon: Bell, exact: false, show: isAdmin, n: counts?.unread },
    { href: '/quan-tri/truy-cap', label: 'Truy cập', icon: LineChart, exact: false, show: isAdmin },
    { href: '/quan-tri/marketing', label: 'Marketing', icon: Megaphone, exact: false, show: isAdmin },
    { sep: true, show: isAdmin },
    { href: '/quan-tri/nguoi-dung', label: 'Người dùng', icon: Users, exact: false, show: isAdmin },
    { href: '/quan-tri/duyet-giao-vien', label: 'Duyệt giáo viên', icon: UserCheck, exact: false, show: isAdmin, n: counts?.teachers_pending },
    { href: '/quan-tri/giao-vien', label: 'Giáo viên', icon: UserCheck, exact: false, show: isAdmin },
    { href: '/quan-tri/bai-hoc', label: 'Bài học', icon: BookOpen, exact: false, show: true, n: isAdmin ? counts?.lessons_review : undefined },
    { href: '/quan-tri/chuong-trinh', label: 'Chương trình', icon: ListTree, exact: false, show: true },
    { href: '/quan-tri/thu-phi', label: 'Thu phí', icon: CreditCard, exact: false, show: isAdmin && FEATURES.billing, n: counts?.payments_pending },
    { href: '/quan-tri/nhat-ky', label: 'Nhật ký', icon: ScrollText, exact: false, show: isAdmin },
  ];

  // Bấm một mục trong menu ☰ (điện thoại) thì đóng menu
  const close = (e: React.MouseEvent) => (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');

  return (
    <nav className="adm-nav" aria-label="Quản trị">
      {items.filter((i) => i.show).map((it, i) => {
        if ('sep' in it) return <span key={`sep-${i}`} className="adm-nav-sep" aria-hidden="true" />;
        const { href, label, icon: Icon, exact, n } = it;
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="adm-nav-link" aria-current={active ? 'page' : undefined} onClick={close}>
            <Icon size={18} aria-hidden="true" /> {label}
            {n ? <span className="adm-nav-count" aria-label={`${n} việc chưa xử lý`}>{n > 99 ? '99+' : n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
