'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Crown, Puzzle, Trophy, Users, type LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Các đường dẫn cũng thuộc về mục này (để tô sáng đúng tab) */
  match: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/chon-bai', label: 'Học tập', icon: BookOpen, match: ['/chon-bai', '/lam-bai', '/ket-qua'] },
  { href: '/tro-choi', label: 'Game trí tuệ', icon: Puzzle, match: ['/tro-choi'] },
  { href: '/co', label: 'Đấu cờ', icon: Crown, match: ['/co'] },
  { href: '/thanh-tich', label: 'Thành tích', icon: Trophy, match: ['/thanh-tich'] },
  { href: '/phu-huynh', label: 'Phụ huynh', icon: Users, match: ['/phu-huynh'] },
];

const isActive = (pathname: string, item: NavItem) =>
  item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Thanh điều hướng chính: 5 tab, dùng trên trang chủ và các trang học / chơi. */
export default function MainNavigation({ className = '' }: { className?: string }) {
  const pathname = usePathname() ?? '/';
  return (
    <nav className={`main-nav ${className}`.trim()} aria-label="Điều hướng chính">
      <ul className="main-nav-list">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} className="main-nav-link" aria-current={active ? 'page' : undefined}>
                <Icon className="main-nav-icon" aria-hidden="true" strokeWidth={2.3} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
