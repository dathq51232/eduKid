'use client';

// Ô "Hôm nay dạy" trên trang Hôm nay: tiết đã lưu giáo án (từ máy chủ) + tiết trong lịch báo giảng
// vừa nạp nhưng chưa lưu (nhớ trên máy). Tiết chưa lưu có nút "Soạn" dẫn về Giáo án.
// Nhiều bài cùng một tiết gộp một dòng; tiết đang dạy (theo giờ máy) được làm nổi, tiết đã dạy làm mờ.
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
type Group = { key: string; period: number; pm: boolean; items: Row[] };
type When = 'past' | 'now' | 'next';
// Giờ học tiểu học (phút trong ngày): sáng 7:00, mỗi tiết 35 phút, nghỉ 5 phút, ra chơi 20 phút sau tiết 2; chiều 14:00.
const AM = [[420, 455], [460, 495], [515, 550], [555, 590], [595, 630]];
const PM = [[840, 875], [880, 915], [935, 970], [975, 1010]];
function slotOf(period: number, pm: boolean) {
  if (!period) return null;
  if (pm) return PM[period - 1] ?? null;
  return AM[period - 1] ?? PM[period - 6] ?? null; // tiết 6–9 trong ngày = buổi chiều
}
function whenOf(g: Group, min: number | null): When | null {
  const t = slotOf(g.period, g.pm);
  if (!t || min === null) return null;
  return min >= t[1] ? 'past' : min >= t[0] - 5 ? 'now' : 'next';
}

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
  // phút hiện tại trong ngày: cập nhật mỗi phút (chỉ đổi state khi sang phút mới)
  const [min, setMin] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => { const d = new Date(); setMin(d.getHours() * 60 + d.getMinutes()); };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const have = new Set(saved.map((p) => `${p.period ?? 0}|${norm(p.title)}`));
  const haveTitle = new Set(saved.map((p) => norm(p.title)));
  const rows: Row[] = [
    ...saved.map((p) => ({ key: p.id, period: p.period ?? 0, pm: false, subject: SUBJECT_NAMES[p.subject as keyof typeof SUBJECT_NAMES] ?? p.subject, title: p.title, saved: true })),
    ...local.filter((s) => !have.has(`${s.period}|${norm(s.title)}`) && !haveTitle.has(norm(s.title)))
      .map((s, i) => ({ key: `l${i}`, period: s.period, pm: isPm(s.session), subject: s.label || SUBJECT_NAMES[s.subject as keyof typeof SUBJECT_NAMES] || s.subject, title: s.title, saved: false })),
  ].sort((a, b) => Number(a.pm) - Number(b.pm) || (a.period || 99) - (b.period || 99));

  if (!rows.length) return <p className="tdy-line">Chưa có tiết nào cho hôm nay. <Link href={`${base}/ke-hoach`}>Nạp lịch báo giảng</Link></p>;
  // gộp các bài cùng một tiết (ví dụ tiết 3 có "Ôn tập" và "Bài 45") thành một dòng
  const groups: Group[] = [];
  for (const r of rows) {
    const g = r.period ? groups.find((x) => x.period === r.period && x.pm === r.pm) : undefined;
    if (g) { if (!g.items.some((x) => norm(x.title) === norm(r.title))) g.items.push(r); }
    else groups.push({ key: r.key, period: r.period, pm: r.pm, items: [r] });
  }
  const todo = rows.filter((r) => !r.saved).length;
  return (
    <>
      <ul className="tdy-slots">
        {groups.map((g) => {
          const w = whenOf(g, min);
          const allSaved = g.items.every((r) => r.saved);
          return (
            <li key={g.key} className={`tdy-slot${w ? ` is-${w}` : ''}`}>
              <span className="tdy-slot-t">{g.period ? `${g.pm ? 'Chiều ' : ''}Tiết ${g.period}` : '—'}{w === 'now' && <em className="tdy-now">Đang dạy</em>}</span>
              <span className="tdy-slot-list">
                {g.items.map((r) => (
                  <button key={r.key} type="button" className="tdy-slot-s is-btn" onClick={() => onRow(r)} title="Bấm để xem gợi ý cách dạy tiết này">
                    <b>{r.subject} <span aria-hidden="true">{hasPick(r) ? '✅' : '💡'}</span></b><span>{r.title}</span>
                  </button>
                ))}
              </span>
              {!allSaved && w !== 'past'
                ? <Link href={`${base}/ke-hoach`} className="tdy-chip is-amber" title="Tiết này chưa lưu giáo án">✏️ Soạn</Link>
                : w === 'past' ? <span className="tdy-chip is-done">✓ Đã dạy</span>
                : w === 'now' ? <Link href={`${base}/goi-ten`} className="tdy-chip is-blue" title="Gọi tên dò bài cũ đầu tiết">🎡 Dò bài</Link>
                : <Link href={`${base}/ke-hoach`} className="tdy-chip is-ghost" title="Xem lại giáo án">📖 Giáo án</Link>}
            </li>
          );
        })}
      </ul>
      {pick && <LessonIdeas subject={pick.subject} title={pick.title} saved={pick.saved} onClose={() => setPick(null)} />}
      <p className="tdy-legend">💡 Bấm tên môn để xem gợi ý cách dạy · ✅ đã chọn gợi ý</p>
      {todo > 0 && <p className="tdy-line">{todo} tiết chưa lưu giáo án. <Link href={`${base}/ke-hoach`}>Lưu ở Giáo án</Link></p>}
    </>
  );
}
