'use client';

// Hành trình nét chữ: đặt bài viết đầu tiên cạnh bài mới nhất của một em, kèm dải các bài theo thời gian.
import { useMemo, useState } from 'react';
import { PenLine, TrendingUp } from 'lucide-react';
import { fmtDate, type GalleryItem } from '@/lib/gallery/types';

export default function WritingJourney({ items, students, initial, onOpen }: {
  items: GalleryItem[]; students: { id: string; name: string }[]; initial?: string | null; onOpen?: (id: string) => void;
}) {
  const writers = useMemo(() => students.filter((s) => items.some((i) => i.kind === 'writing' && i.student_id === s.id)), [students, items]);
  const [sid, setSid] = useState<string>(initial && students.some((s) => s.id === initial) ? initial : writers[0]?.id ?? students[0]?.id ?? '');
  const list = useMemo(() => items.filter((i) => i.kind === 'writing' && i.student_id === sid && i.status !== 'hidden')
    .sort((a, b) => a.taken_on.localeCompare(b.taken_on) || a.created_at.localeCompare(b.created_at)), [items, sid]);
  const first = list[0], last = list[list.length - 1];
  const days = first && last ? Math.round((Date.parse(last.taken_on) - Date.parse(first.taken_on)) / 86400_000) : 0;
  const name = students.find((s) => s.id === sid)?.name ?? '';

  return (
    <section className="wj" aria-labelledby="wj-h">
      <div className="wj-head">
        <h2 id="wj-h"><TrendingUp aria-hidden="true" /> Hành trình nét chữ{name ? ` của ${name}` : ''}</h2>
        {students.length > 1 && (
          <select value={sid} onChange={(e) => setSid(e.target.value)} aria-label="Chọn học sinh">
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}{writers.some((w) => w.id === s.id) ? '' : ' (chưa có bài)'}</option>)}
          </select>
        )}
      </div>
      {!list.length && (
        <p className="dash-muted"><PenLine aria-hidden="true" /> Chưa có bài viết nào. Bài luyện chữ trên màn hình (mục Luyện chữ) hoặc ảnh chụp vở được cô duyệt sẽ hiện ở đây.</p>
      )}
      {list.length === 1 && first && (
        <div className="wj-pair is-one"><Card it={first} label="Bài đầu tiên" onOpen={onOpen} /><p className="dash-muted">Thêm bài mới để so sánh tiến bộ nhé!</p></div>
      )}
      {list.length > 1 && first && last && (
        <>
          <div className="wj-pair">
            <Card it={first} label="Bài đầu tiên" onOpen={onOpen} />
            <div className="wj-arrow" aria-hidden="true">→</div>
            <Card it={last} label="Bài mới nhất" onOpen={onOpen} />
          </div>
          <p className="wj-sum">{list.length} bài trong {days > 0 ? `${days} ngày` : 'cùng một ngày'}. Cùng nhìn lại xem nét chữ đã tiến bộ thế nào!</p>
          <ol className="wj-strip" aria-label="Các bài theo thời gian">
            {list.map((it) => (
              <li key={it.id}>
                <button type="button" onClick={() => onOpen?.(it.id)} aria-label={`${it.title || 'Bài viết'} ngày ${fmtDate(it.taken_on)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.url && <img src={it.url} alt="" loading="lazy" />}
                  <small>{fmtDate(it.taken_on)}</small>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

function Card({ it, label, onOpen }: { it: GalleryItem; label: string; onOpen?: (id: string) => void }) {
  return (
    <figure className="wj-card">
      <figcaption><b>{label}</b> · {fmtDate(it.taken_on)}</figcaption>
      <button type="button" onClick={() => onOpen?.(it.id)} aria-label={`Xem lớn ${label}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {it.url && <img src={it.url} alt={it.title || label} />}
      </button>
      {it.title && <p>{it.title}{it.note ? ` — ${it.note}` : ''}</p>}
    </figure>
  );
}
