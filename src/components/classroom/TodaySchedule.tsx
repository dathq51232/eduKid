'use client';

// Ô "Hôm nay dạy" trên trang Hôm nay: tiết đã lưu giáo án (từ máy chủ) + tiết trong lịch báo giảng
// vừa nạp nhưng chưa lưu (nhớ trên máy). Tiết chưa lưu có nút "Soạn" dẫn về Giáo án.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import { loadSched, type SchedSlot } from '@/lib/plans/sched-store';
import LessonIdeas from './LessonIdeas';
import { PICK_EVENT, loadPick } from '@/lib/plans/idea-bank';

export type SavedSlot = { id: string; subject: string; title: string; period: number | null };
type Row = { key: string; period: number; pm: boolean; subject: string; title: string; saved: boolean };
const isPm = (s?: string) => !!s && /chi[eề]u/i.test(s);
const norm = (t: string) => t.trim().toLowerCase();

export default function TodaySchedule({ classId, day, base, saved }: { classId: string; day: string; base: string; saved: SavedSlot[] }) {
  const [local, setLocal] = useState<SchedSlot[]>([]);
  const [pick, setPick] = useState<Row | null>(null);
  const [ver, setVer] = useState(0); // đổi khi lựa chọn gợi ý thay đổi → vẽ lại dấu ✓
  useEffect(() => {
    // ô bên cạnh bấm "Sửa" → mở lại bảng gợi ý của tiết đó
    const f = (e: Event) => {
      const d = (e as CustomEvent<{ subject: string; title: string; open?: boolean }>).detail;
      if (d.open) setPick({ key: 'x', period: 0, pm: false, subject: d.subject, title: d.title, saved: false });
      else setVer((v) => v + 1);
    };
    addEventListener(PICK_EVENT, f); return () => removeEventListener(PICK_EVENT, f);
  }, []);
  const hasPick = (r: Row) => ver >= 0 && !!loadPick(r.subject, r.title);
  const onRow = (r: Row) => {
    if (hasPick(r)) dispatchEvent(new CustomEvent(PICK_EVENT, { detail: { subject: r.subject, title: r.title, show: true } }));
    else setPick(r);
  };
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
            <button type="button" className="tdy-slot-s is-btn" onClick={() => onRow(r)} title="Gợi ý ý tưởng dạy tiết này"><b>{r.subject} {hasPick(r) ? '✅' : '💡'}</b><span>{r.title}</span></button>
            {r.saved
              ? <Link href={`${base}/goi-ten`} className="tdy-chip is-blue" title="Gọi tên dò bài cũ">🎡 Dò bài</Link>
              : <Link href={`${base}/ke-hoach`} className="tdy-chip is-amber" title="Tiết này chưa lưu giáo án">✏️ Soạn</Link>}
          </li>
        ))}
      </ul>
      {pick && <LessonIdeas subject={pick.subject} title={pick.title} saved={pick.saved} onClose={() => setPick(null)} />}
      {todo > 0 && <p className="tdy-line">{todo} tiết chưa lưu giáo án. <Link href={`${base}/ke-hoach`}>Lưu ở Giáo án</Link></p>}
    </>
  );
}
