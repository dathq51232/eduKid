import Link from 'next/link';
import { BookUser, MessageSquareHeart } from 'lucide-react';

/** "Liên lạc phụ huynh": hai thẻ Tin nhắn ↔ Danh bạ (hai trang riêng, chung một mục trong menu) */
export default function ParentLinkTabs({ classId, on }: { classId: string; on: 'tin-nhan' | 'danh-ba' }) {
  const base = `/giao-vien/lop/${classId}`;
  return (
    <nav className="ct-seg ct-seg-links" aria-label="Liên lạc phụ huynh">
      <Link href={`${base}/tin-nhan`} className={on === 'tin-nhan' ? 'is-on' : ''} aria-current={on === 'tin-nhan' ? 'page' : undefined}><MessageSquareHeart aria-hidden="true" /> Tin nhắn & xin nghỉ</Link>
      <Link href={`${base}/danh-ba`} className={on === 'danh-ba' ? 'is-on' : ''} aria-current={on === 'danh-ba' ? 'page' : undefined}><BookUser aria-hidden="true" /> Danh bạ</Link>
    </nav>
  );
}
