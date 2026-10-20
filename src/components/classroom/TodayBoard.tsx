import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import type { TodayItem } from '@/lib/classroom/today';

/** Ô "Việc hôm nay" ở trang Giáo viên */
export default function TodayBoard({ className, items }: { className: string; items: TodayItem[] }) {
  return (
    <section className="dash-section today-board" aria-labelledby="today-title">
      <h2 id="today-title"><CalendarCheck aria-hidden="true" /> Việc hôm nay · Lớp {className}</h2>
      {items.length === 0 ? (
        <p className="dash-muted">Không có việc gấp. Bài giao, giáo án và kỳ kiểm tra đều ổn.</p>
      ) : (
        <ul className="today-list">
          {items.map((t, i) => (
            <li key={i} className={`today-item is-${t.tone}`}>
              <div><strong>{t.title}</strong><span>{t.detail}</span></div>
              <Link href={t.href} className="btn btn-outline btn-sm">{t.cta}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
