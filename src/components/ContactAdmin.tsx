import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ADMIN_CONTACT } from '@/lib/contact';

/** Khung liên hệ quản trị (thêm học sinh vượt gói miễn phí, hỗ trợ…) */
export default function ContactAdmin({ title = 'Liên hệ quản trị để thêm học sinh', note, compact = false }: { title?: string; note?: string; compact?: boolean }) {
  const c = ADMIN_CONTACT;
  const subject = encodeURIComponent('EduChain Kids - Đăng ký thêm học sinh');
  return (
    <aside className={`contact-admin${compact ? ' is-compact' : ''}`} aria-label={title}>
      <h3>{title}</h3>
      {note && <p className="dash-muted">{note}</p>}
      <ul>
        <li><Phone aria-hidden="true" /> <a href={`tel:${c.phone}`}>{c.phoneDisplay}</a></li>
        <li><MessageCircle aria-hidden="true" /> Zalo: <a href={`https://zalo.me/${c.zalo}`} target="_blank" rel="noopener noreferrer">{c.phoneDisplay}</a></li>
        <li><Mail aria-hidden="true" /> <a href={`mailto:${c.email}?subject=${subject}`}>{c.email}</a></li>
        {!compact && <li><MapPin aria-hidden="true" /> {c.address}</li>}
      </ul>
    </aside>
  );
}
