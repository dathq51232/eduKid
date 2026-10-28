'use client';

// Thẻ "Phòng triển lãm của lớp" trên trang học sinh / phụ huynh: số tác phẩm, số tác phẩm mới từ lần xem trước, lối vào Luyện chữ.
// Máy chủ chưa chạy migration 0039 thì không hiện gì.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GalleryHorizontalEnd, PenLine, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SEEN_KEY } from '@/lib/gallery/types';

type Info = { classId: string; className: string; total: number; mine: number; fresh: number; hearts: number };

export default function GalleryTeaser({ variant = 'student' }: { variant?: 'student' | 'parent' }) {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const sb = createClient();
      const { data: cls, error } = await sb.rpc('gallery_my_classes');
      const first = !error ? (cls as { class_id: string; class_name: string }[] | null)?.[0] : undefined;
      if (!first) return;
      const { data, error: e2 } = await sb.rpc('gallery_list', { p_class: first.class_id });
      if (e2 || !live) return;
      const d = data as { mine: string[]; items: { status: string; student_id: string | null; created_at: string; hearts: number }[] };
      let seen = '';
      try { seen = localStorage.getItem(`${SEEN_KEY}:${first.class_id}`) ?? ''; } catch { /* bỏ qua */ }
      const shown = d.items.filter((i) => i.status === 'shown');
      const mine = shown.filter((i) => i.student_id && d.mine.includes(i.student_id));
      setInfo({
        classId: first.class_id, className: first.class_name, total: shown.length, mine: mine.length,
        fresh: seen ? shown.filter((i) => i.created_at > seen).length : shown.length,
        hearts: mine.reduce((s, i) => s + i.hearts, 0),
      });
    })().catch(() => undefined);
    return () => { live = false; };
  }, []);
  if (!info) return null;
  return (
    <section className={`gt is-${variant}`} aria-labelledby="gt-h">
      <span className="gt-ic" aria-hidden="true"><GalleryHorizontalEnd /></span>
      <div className="gt-body">
        <h2 id="gt-h">Phòng triển lãm lớp {info.className}</h2>
        <p>
          {info.total ? `${info.total} tác phẩm trên tường` : 'Chưa có tác phẩm'}
          {info.mine ? ` · ${variant === 'parent' ? 'của con' : 'của em'}: ${info.mine}` : ''}
          {info.hearts ? ` · ${info.hearts} lượt khen` : ''}
        </p>
        {info.fresh > 0 && info.total > 0 && <p className="gt-new"><Sparkles aria-hidden="true" /> {info.fresh} tác phẩm mới</p>}
      </div>
      <div className="gt-act">
        <Link href="/trien-lam" className="btn btn-primary btn-sm">Vào xem</Link>
        <Link href="/luyen-chu" className="btn btn-outline btn-sm"><PenLine aria-hidden="true" /> Luyện chữ</Link>
      </div>
    </section>
  );
}
