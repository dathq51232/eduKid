import Link from 'next/link';
import { BookOpen, CalendarDays, Users } from 'lucide-react';
import BrandLogo from '@/components/brand/BrandLogo';
import ThemeToggle from '@/components/brand/ThemeToggle';
import SignOutButton from '@/components/classroom/SignOutButton';
import { TourHelpButton } from '@/components/tour/GuidedTour';

// Thanh trên của Góc phụ huynh: không có tab Học tập / Game trí tuệ (đó là góc của bé).
export default function ParentHeader({ childCorner = false, signedIn = true }: { childCorner?: boolean; signedIn?: boolean }) {
  return (
    <header className="ph-top">
      <div className="ph-top-in wrap">
        <Link href="/phu-huynh" className="brand" aria-label="EduChain Kids - Góc phụ huynh"><BrandLogo size={36} /></Link>
        <span className="ph-pill"><Users aria-hidden="true" /> Góc phụ huynh</span>
        <span className="ph-top-sp" />
        {signedIn && <Link href="/phu-huynh/tien-ich" className="ph-ghost"><CalendarDays aria-hidden="true" /> <span>Tiện ích</span></Link>}
        {childCorner && <Link href="/hoc-sinh" className="ph-ghost ph-child-switch"><BookOpen aria-hidden="true" /> <span>Cho con vào học</span></Link>}
        <ThemeToggle />
        {childCorner && <TourHelpButton className="ph-ghost" label="Hướng dẫn" />}
        {signedIn && <SignOutButton className="ph-ghost" />}
      </div>
    </header>
  );
}
