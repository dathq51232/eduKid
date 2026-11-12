import Link from 'next/link';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/brand/ThemeToggle';
import AccountLink from '@/components/brand/AccountLink';
import MainNavigation from '@/components/navigation/MainNavigation';
import HeaderOffset from '@/components/navigation/HeaderOffset';

type Props = {
  studentName?: string;
  avatar?: string;
};

// Thanh trên cùng của các trang học, cùng bộ nhận diện với trang chủ EduChain Kids.
export default function LearnHeader({ studentName, avatar }: Props) {
  return (
    <header className="learn-top">
      <div className="learn-top-inner wrap">
        <Link href="/" className="brand" aria-label="EduChain Kids - Trang chủ">
          <BrandLogo size={38} />
        </Link>

        <MainNavigation className="main-nav-learn" />

        <div className="learn-tools">
          <Link href="/phu-huynh" className="parent-top-link" title="Góc phụ huynh" aria-label="Góc phụ huynh">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ đã tối ưu sẵn */}
            <img src="/emoji/nav/phu-huynh.webp" width={20} height={20} alt="" aria-hidden="true" decoding="async" />
            <span>Phụ huynh</span>
          </Link>
          <ThemeToggle />
          <AccountLink />
        </div>

        {studentName && (
          <p className="learn-user">
            <span className="learn-avatar" aria-hidden="true">{avatar || '🐰'}</span>
            <span>{studentName}</span>
          </p>
        )}
      </div>
      <HeaderOffset />
    </header>
  );
}
