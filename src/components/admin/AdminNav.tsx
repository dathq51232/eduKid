'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, CreditCard, LayoutDashboard, ListTree, ScrollText, UserCheck, Users } from 'lucide-react';
import { useAdminUser } from './AdminContext';

export default function AdminNav() {
  const pathname = usePathname();
  const { isAdmin } = useAdminUser();
  const items = [
    { href: '/quan-tri', label: 'Tổng quan', icon: LayoutDashboard, exact: true, show: true },
    { href: '/quan-tri/chuong-trinh', label: 'Chương trình', icon: ListTree, exact: false, show: true },
    { href: '/quan-tri/bai-hoc', label: 'Bài học', icon: BookOpen, exact: false, show: true },
    { href: '/quan-tri/nguoi-dung', label: 'Người dùng', icon: Users, exact: false, show: isAdmin },
    { href: '/quan-tri/duyet-giao-vien', label: 'Duyệt giáo viên', icon: UserCheck, exact: false, show: isAdmin },
    { href: '/quan-tri/thu-phi', label: 'Thu phí', icon: CreditCard, exact: false, show: isAdmin },
    { href: '/quan-tri/nhat-ky', label: 'Nhật ký', icon: ScrollText, exact: false, show: isAdmin },
  ];

  return (
    <nav className="adm-nav" aria-label="Quản trị">
      {items
        .filter((i) => i.show)
        .map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="adm-nav-link" aria-current={active ? 'page' : undefined}>
              <Icon size={18} aria-hidden="true" /> {label}
            </Link>
          );
        })}
    </nav>
  );
}
