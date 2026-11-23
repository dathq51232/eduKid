// Thẻ "Cộng đồng" ở góc phải trang Hôm nay: 5 tài nguyên đồng nghiệp mới đăng + số tin nhắn chưa đọc.
// Máy chủ dựng (bọc Suspense ở trang để không chặn phần còn lại). Chưa chạy migration 0079/0080: không hiện gì.
import Link from 'next/link';
import { BookOpen, ChevronRight, ClipboardList, FileQuestion, FileText, MessageCircle, Paperclip, Presentation, UsersRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { KIND_LABEL, type ResourceCard, type ResourceKind } from '@/lib/community/types';
import '@/styles/cdg.css';

const KIND_ICON: Record<ResourceKind, typeof BookOpen> = {
  bai_giang: Presentation, giao_an: FileText, de_kiem_tra: ClipboardList, phieu: BookOpen, cau_hoi: FileQuestion, tai_lieu: Paperclip,
};
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return m <= 1 ? 'vừa xong' : `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} ngày trước` : new Date(iso).toLocaleDateString('vi-VN');
};

export default async function CommunityFeedCard() {
  const sb = await createClient();
  const [list, unread] = await Promise.all([
    sb.rpc('community_list', { p_tab: 'kho', p_limit: 5, p_offset: 0 }),
    sb.rpc('chat_unread_total'),
  ]);
  if (list.error) return null;
  const items = (list.data ?? []) as ResourceCard[];
  const n = unread.error ? 0 : Number(unread.data ?? 0);
  return (
    <section className="tdy-card cdg-feed" aria-labelledby="cdg-feed-h">
      <h2 id="cdg-feed-h"><UsersRound aria-hidden="true" /> Cộng đồng <Link href="/giao-vien/cong-dong">Kho chia sẻ <ChevronRight aria-hidden="true" /></Link></h2>
      {items.length ? (
        <ul className="cdg-feed-list">
          {items.map((r) => {
            const Icon = KIND_ICON[r.kind] ?? FileText;
            return (
              <li key={r.id}>
                <Link href={`/giao-vien/cong-dong?q=${encodeURIComponent(r.title.slice(0, 60))}`}>
                  <span className="cdg-feed-ic" aria-hidden="true"><Icon /></span>
                  <span className="cdg-feed-txt"><b>{r.title}</b><small>{KIND_LABEL[r.kind]}{r.grade ? ` · Lớp ${r.grade}` : ''} · {r.mine ? 'Thầy cô' : r.author.name} · {ago(r.createdAt)}</small></span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p className="cdg-feed-empty">Chưa có tài liệu nào. Thầy cô đăng tài liệu hay đầu tiên cho đồng nghiệp nhé!</p>}
      <Link href="/giao-vien/cong-dong/tin-nhan" className="cdg-feed-msg">
        <MessageCircle aria-hidden="true" /> {n ? 'Tin nhắn đồng nghiệp mới' : 'Nhắn đồng nghiệp cùng trường'}
        {n > 0 && <span className="cdg-unread" aria-label={`${n} tin chưa đọc`}>{n > 99 ? '99+' : n}</span>}
      </Link>
    </section>
  );
}
