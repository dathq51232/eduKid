// Hàng tab chung của nhánh Cộng đồng: Kho chia sẻ · Đã đăng · Đã lưu · Tin nhắn
import Link from 'next/link';
import { TAB_LABEL, type CommunityTab } from '@/lib/community/types';
import '@/styles/cdg.css';

const TABS: CommunityTab[] = ['kho', 'da_dang', 'da_luu'];
export const tabHref = (t: CommunityTab) => (t === 'kho' ? '/giao-vien/cong-dong' : `/giao-vien/cong-dong?tab=${t}`);

export default function CommunityTabs({ on }: { on: CommunityTab | 'tin_nhan' }) {
  return (
    <nav className="cdg-tabs" aria-label="Mục Cộng đồng">
      {TABS.map((t) => (
        <Link key={t} href={tabHref(t)} className={t === on ? 'is-on' : ''} aria-current={t === on ? 'page' : undefined}>{TAB_LABEL[t]}</Link>
      ))}
      <Link href="/giao-vien/cong-dong/tin-nhan" className={on === 'tin_nhan' ? 'is-on' : ''} aria-current={on === 'tin_nhan' ? 'page' : undefined}>Tin nhắn</Link>
    </nav>
  );
}
