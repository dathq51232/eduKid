'use client';

// Lịch dạy trên trang Hôm nay:
//  * <NowBar>: dải "Bây giờ" — tiết đang dạy / tiết kế tiếp (còn mấy phút) + nút dùng ngay trong tiết.
//  * <TodaySchedule>: dòng thời gian các tiết hôm nay; hết tiết thì tự chuyển sang "Ngày mai dạy".
// Nguồn: tiết đã lưu giáo án (máy chủ) + tiết trong lịch báo giảng vừa nạp nhưng chưa lưu (nhớ trên máy).
// Nhiều bài cùng một tiết gộp một dòng.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, Dices, MonitorPlay, NotebookPen, Timer } from 'lucide-react';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import { loadSched, type SchedSlot } from '@/lib/plans/sched-store';
import LessonIdeas from './LessonIdeas';
import { PICK_EVENT, loadPick } from '@/lib/plans/idea-bank';

export type SavedSlot = { id: string; subject: string; title: string; period: number | null };
type Row = { key: string; period: number; pm: boolean; subject: string; title: string; saved: boolean };
type Group = { key: string; period: number; pm: boolean; items: Row[] };
type When = 'past' | 'now' | 'next';
const isPm = (s?: string) => !!s && /chi[eề]u/i.test(s);
const norm = (t: string) => t.trim().toLowerCase();
// Giờ học tiểu học (phút trong ngày): sáng 7:00, mỗi tiết 35 phút, nghỉ 5 phút, ra chơi 20 phút sau tiết 2; chiều 14:00.
const AM = [[420, 455], [460, 495], [515, 550], [555, 590], [595, 630]];
const PM = [[840, 875], [880, 915], [935, 970], [975, 1010]];
function slotOf(period: number, pm: boolean) {
  if (!period) return null;
  if (pm) return PM[period - 1] ?? null;
  return AM[period - 1] ?? PM[period - 6] ?? null; // tiết 6–9 trong ngày = buổi chiều
}
const whenOf = (g: Group, min: number | null): When | null => {
  const t = slotOf(g.period, g.pm);
  if (!t || min === null) return null;
  return min >= t[1] ? 'past' : min >= t[0] - 5 ? 'now' : 'next';
};
const hhmm = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const periodLabel = (g: Group) => (g.period ? `${g.pm ? 'Chiều ' : ''}Tiết ${g.period}` : '—');

function groupsOf(saved: SavedSlot[], local: SchedSlot[]): { groups: Group[]; unsaved: number } {
  const have = new Set(saved.map((p) => `${p.period ?? 0}|${norm(p.title)}`));
  const haveTitle = new Set(saved.map((p) => norm(p.title)));
  const rows: Row[] = [
    ...saved.map((p) => ({ key: p.id, period: p.period ?? 0, pm: false, subject: SUBJECT_NAMES[p.subject as keyof typeof SUBJECT_NAMES] ?? p.subject, title: p.title, saved: true })),
    ...local.filter((s) => !have.has(`${s.period}|${norm(s.title)}`) && !haveTitle.has(norm(s.title)))
      .map((s, i) => ({ key: `l${i}`, period: s.period, pm: isPm(s.session), subject: s.label || SUBJECT_NAMES[s.subject as keyof typeof SUBJECT_NAMES] || s.subject, title: s.title, saved: false })),
  ].sort((a, b) => Number(a.pm) - Number(b.pm) || (a.period || 99) - (b.period || 99));
  const groups: Group[] = [];
  for (const r of rows) {
    const g = r.period ? groups.find((x) => x.period === r.period && x.pm === r.pm) : undefined;
    if (g) { if (!g.items.some((x) => norm(x.title) === norm(r.title))) g.items.push(r); }
    else groups.push({ key: r.key, period: r.period, pm: r.pm, items: [r] });
  }
  return { groups, unsaved: rows.filter((r) => !r.saved).length };
}

/** Lịch hôm nay + ngày mai (máy chủ + lịch báo giảng trên máy) và phút hiện tại (đổi mỗi phút) */
function useSlots(classId: string, day: string, tomorrow: string, saved: SavedSlot[], savedTomorrow: SavedSlot[]) {
  const [local, setLocal] = useState<SchedSlot[]>([]);
  const [min, setMin] = useState<number | null>(null);
  useEffect(() => { setLocal(loadSched(classId).filter((s) => s.date === day || s.date === tomorrow)); }, [classId, day, tomorrow]);
  useEffect(() => {
    const tick = () => { const d = new Date(); setMin(d.getHours() * 60 + d.getMinutes()); };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const today = useMemo(() => groupsOf(saved, local.filter((s) => s.date === day)), [saved, local, day]);
  const next = useMemo(() => groupsOf(savedTomorrow, local.filter((s) => s.date === tomorrow)), [savedTomorrow, local, tomorrow]);
  const allPast = min !== null && today.groups.length > 0 && today.groups.every((g) => whenOf(g, min) === 'past');
  return { today, next, min, allPast };
}

type Props = { classId: string; day: string; tomorrow: string; base: string; saved: SavedSlot[]; savedTomorrow: SavedSlot[] };

/** ① Dải "Bây giờ": tiết đang dạy hoặc tiết kế tiếp, kèm nút dùng ngay trong tiết */
export function NowBar(p: Props) {
  const { today, next, min, allPast } = useSlots(p.classId, p.day, p.tomorrow, p.saved, p.savedTomorrow);
  if (min === null) return <section className="tdy-now-bar is-idle" aria-busy="true"><span className="tdy-now-ic"><Clock3 aria-hidden="true" /></span><div><small>Bây giờ</small><b>Đang xem lịch dạy…</b></div></section>;
  const now = today.groups.find((g) => whenOf(g, min) === 'now');
  const upcoming = today.groups.find((g) => whenOf(g, min) === 'next');
  const g = now ?? upcoming;
  const desc = (x: Group) => x.items.map((r) => `${r.subject} – ${r.title}`).join(' · ');
  if (g) {
    const t = slotOf(g.period, g.pm)!;
    const left = now ? t[1] - min : t[0] - min;
    return (
      <section className={`tdy-now-bar${now ? ' is-live' : ''}`} aria-label="Bây giờ">
        <span className="tdy-now-ic">{now ? <span className="tdy-live-dot" aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span>
        <div className="tdy-now-txt">
          <small>{now ? `Đang dạy · ${periodLabel(g)} · còn ${left} phút` : `Tiết kế tiếp · ${periodLabel(g)} lúc ${hhmm(t[0])} · còn ${left} phút`}</small>
          <b title={desc(g)}>{desc(g)}</b>
        </div>
        <div className="tdy-now-acts">
          <Link href={`${p.base}/bai-giang-3d`} className="tdy-now-btn is-main"><MonitorPlay aria-hidden="true" /> Mở bài giảng</Link>
          {now
            ? <><Link href={`${p.base}/goi-ten`} className="tdy-now-btn"><Dices aria-hidden="true" /> Dò bài</Link><Link href={`${p.base}/hen-gio`} className="tdy-now-btn"><Timer aria-hidden="true" /> Hẹn giờ</Link></>
            : <Link href={`${p.base}/ke-hoach`} className="tdy-now-btn"><NotebookPen aria-hidden="true" /> Xem giáo án</Link>}
        </div>
      </section>
    );
  }
  // hết tiết hôm nay (hoặc hôm nay không có tiết)
  const n = next.groups.length;
  return (
    <section className="tdy-now-bar is-idle" aria-label="Bây giờ">
      <span className="tdy-now-ic"><CalendarDays aria-hidden="true" /></span>
      <div className="tdy-now-txt">
        <small>{allPast ? 'Đã dạy xong các tiết hôm nay' : 'Hôm nay chưa có tiết nào trong lịch'}</small>
        <b>{n ? `Ngày mai có ${n} tiết${next.unsaved ? ` · ${next.unsaved} tiết chưa lưu giáo án` : ' · đã soạn đủ'}` : 'Ngày mai chưa có lịch dạy'}</b>
      </div>
      <div className="tdy-now-acts">
        <Link href={`${p.base}/ke-hoach`} className="tdy-now-btn is-main"><NotebookPen aria-hidden="true" /> {n && !next.unsaved ? 'Xem giáo án' : 'Soạn giáo án'}</Link>
      </div>
    </section>
  );
}

/** ② Dòng thời gian các tiết; hết tiết hôm nay thì chuyển sang "Ngày mai dạy" */
export default function TodaySchedule(p: Props & { headingId: string }) {
  const { today, next, min, allPast } = useSlots(p.classId, p.day, p.tomorrow, p.saved, p.savedTomorrow);
  const [pick, setPick] = useState<Row | null>(null);
  const [ver, setVer] = useState(0); // đổi khi lựa chọn gợi ý thay đổi → vẽ lại dấu ✓
  useEffect(() => {
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
  const showTomorrow = allPast || (min !== null && !today.groups.length && next.groups.length > 0);
  const view = showTomorrow ? next : today;

  return (
    <>
      <h2 id={p.headingId}><CalendarDays aria-hidden="true" /> {showTomorrow ? 'Ngày mai dạy' : 'Hôm nay dạy'}
        {allPast && <span className="tdy-prog is-all">Hôm nay đã dạy xong</span>}
        <Link href={`${p.base}/ke-hoach`}>Giáo án</Link>
      </h2>
      {!view.groups.length ? (
        <p className="tdy-line">{showTomorrow ? 'Ngày mai chưa có tiết nào.' : 'Chưa có tiết nào cho hôm nay.'} <Link href={`${p.base}/ke-hoach`}>Nạp lịch báo giảng</Link></p>
      ) : (
        <ul className="tdy-slots">
          {view.groups.map((g) => {
            const w = showTomorrow ? null : whenOf(g, min);
            const allSaved = g.items.every((r) => r.saved);
            const t = slotOf(g.period, g.pm);
            return (
              <li key={g.key} className={`tdy-slot${w ? ` is-${w}` : ''}`}>
                <span className="tdy-slot-t">{periodLabel(g)}{t && <small>{hhmm(t[0])}</small>}{w === 'now' && <em className="tdy-now">Đang dạy</em>}</span>
                <span className="tdy-slot-list">
                  {g.items.map((r) => (
                    <button key={r.key} type="button" className="tdy-slot-s is-btn" onClick={() => onRow(r)} title="Bấm để xem gợi ý cách dạy tiết này">
                      <b>{r.subject} <i className="tdy-slot-ic" aria-hidden="true">{hasPick(r) ? '✅' : '💡'}</i></b><span>{r.title}</span>
                    </button>
                  ))}
                </span>
                {!allSaved && w !== 'past'
                  ? <Link href={`${p.base}/ke-hoach`} className="tdy-chip is-amber" title="Tiết này chưa lưu giáo án">✏️ Soạn</Link>
                  : w === 'past' ? <span className="tdy-chip is-done">✓ Đã dạy</span>
                  : w === 'now' ? <Link href={`${p.base}/goi-ten`} className="tdy-chip is-blue" title="Gọi tên dò bài cũ đầu tiết">🎡 Dò bài</Link>
                  : <Link href={`${p.base}/ke-hoach`} className="tdy-chip is-ghost" title="Xem lại giáo án">📖 Giáo án</Link>}
              </li>
            );
          })}
        </ul>
      )}
      {pick && <LessonIdeas subject={pick.subject} title={pick.title} saved={pick.saved} onClose={() => setPick(null)} />}
      {view.groups.length > 0 && <p className="tdy-legend">💡 Bấm tên môn để xem gợi ý cách dạy · ✅ đã chọn gợi ý{view.unsaved ? ` · ${view.unsaved} tiết chưa lưu giáo án` : ''}</p>}
    </>
  );
}
