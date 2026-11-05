'use client';

// Ô "Hôm nay dạy" trên trang Hôm nay: tiết đã lưu giáo án (từ máy chủ) + tiết trong lịch báo giảng
// vừa nạp nhưng chưa lưu (nhớ trên máy). Tiết chưa lưu có nút "Soạn" dẫn về Giáo án.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import { loadSched, type SchedSlot } from '@/lib/plans/sched-store';

export type SavedSlot = { id: string; subject: string; title: string; period: number | null };
type Row = { key: string; period: number; pm: boolean; subject: string; title: string; saved: boolean };
const isPm = (s?: string) => !!s && /chi[eề]u/i.test(s);
const norm = (t: string) => t.trim().toLowerCase();

export default function TodaySchedule({ classId, day, base, saved }: { classId: string; day: string; base: string; saved: SavedSlot[] }) {
  const [local, setLocal] = useState<SchedSlot[]>([]);
  useEffect(() => { setLocal(loadSched(classId).filter((s) => s.date === day)); }, [classId, day]);

  const have = new Set(saved.map((p) => `${p.period ?? 0}|${norm(p.title)}`));
  const haveTitle = new Set(saved.map((p) => norm(p.title)));
  const rows: Row[] = [
    ...saved.map((p) => ({ key: p.id, period: p.period ?? 0, pm: false, subject: SUBJECT_NAMES[p.subject as keyof typeof SUBJECT_NAMES] ?? p.subject, title: p.title, saved: true })),
    ...local.filter((s) => !have.has(`${s.period}|${norm(s.title)}`) && !haveTitle.has(norm(s.title)))
      .map((s, i) => ({ key: `l${i}`, period: s.period, pm: isPm(s.session), subject: s.label || SUBJECT_NAMES[s.subject as keyof typeof SUBJECT_NAMES] || s.subject, title: s.title, saved: false })),
  ].sort((a, b) => Number(a.pm) - Number(b.pm) || (a.period || 99) - (b.period || 99));

  if (!rows.length) return <p className="tdy-line">Chưa có tiết nào cho hôm nay. <Link href={`${base}/ke-hoach`}>Nạp lịch báo giảng</Link></p>;
  const todo = rows.filter((r) => !r.saved).length;
  return (
    <>
      <ul className="tdy-slots">
        {rows.map((r) => (
          <li key={r.key} className="tdy-slot">
            <span className="tdy-slot-t">{r.period ? `${r.pm ? 'Chiều ' : ''}Tiết ${r.period}` : '—'}</span>
            <span className="tdy-slot-s"><b>{r.subject}</b><span>{r.title}</span></span>
            {r.saved
              ? <Link href={`${base}/goi-ten`} className="tdy-chip is-blue" title="Gọi tên dò bài cũ">🎡 Dò bài</Link>
              : <Link href={`${base}/ke-hoach`} className="tdy-chip is-amber" title="Tiết này chưa lưu giáo án">✏️ Soạn</Link>}
          </li>
        ))}
      </ul>
      {todo > 0 && <p className="tdy-line">{todo} tiết chưa lưu giáo án. <Link href={`${base}/ke-hoach`}>Lưu ở Giáo án</Link></p>}
    </>
  );
}
