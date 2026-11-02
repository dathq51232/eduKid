'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  /** nhãn ngắn trên điện thoại (thanh 5 ô) */
  short?: string;
  /** biểu tượng 3D (public/emoji/nav, Fluent Emoji – MIT) */
  icon: string;
  /** Các đường dẫn cũng thuộc về mục này (để tô sáng đúng tab) */
  match: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/chon-bai', label: 'Học tập', icon: 'hoc-tap', match: ['/chon-bai', '/lam-bai', '/ket-qua'] },
  { href: '/tro-choi', label: 'Game trí tuệ', short: 'Game', icon: 'game', match: ['/tro-choi'] },
  { href: '/co', label: 'Đấu cờ', icon: 'dau-co', match: ['/co'] },
  { href: '/thanh-tich', label: 'Thành tích', icon: 'thanh-tich', match: ['/thanh-tich'] },
  { href: '/phu-huynh', label: 'Phụ huynh', short: 'Bố mẹ', icon: 'phu-huynh', match: ['/phu-huynh'] },
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
          return (
            <li key={item.href}>
              <Link href={item.href} className="main-nav-link" aria-current={active ? 'page' : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ 128px, đã tối ưu sẵn (webp) */}
                <img src={`/emoji/nav/${item.icon}.webp`} width={36} height={36} alt="" aria-hidden="true" className="main-nav-icon main-nav-3d" decoding="async" />
                <span className={item.short ? 'nav-long' : undefined}>{item.label}</span>
                {item.short && <span className="nav-short">{item.short}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
