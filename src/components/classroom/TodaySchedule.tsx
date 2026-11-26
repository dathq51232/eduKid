'use client';

// Lịch dạy trên trang Hôm nay:
//  * <NowBar>: dải "Bây giờ" — tiết đang dạy / tiết kế tiếp (còn mấy phút) + nút dùng ngay trong tiết.
//  * <TodaySchedule>: dòng thời gian các tiết hôm nay; hết tiết thì tự chuyển sang "Ngày mai dạy".
// Nguồn: tiết đã lưu giáo án (máy chủ) + tiết trong lịch báo giảng vừa nạp nhưng chưa lưu (nhớ trên máy).
// Nhiều bài cùng một tiết gộp một dòng.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calculator, CalendarDays, ChevronLeft, ChevronRight, Clock3, Dices, MonitorPlay, NotebookPen, Play, Timer, UsersRound } from 'lucide-react';
import { addDaysIso, mondayOf, schoolWeek } from '@/lib/classroom/school-week';
import { DashIcon } from '@/components/classroom/dash-icons';
import { createClient } from '@/lib/supabase/client';
import { FEATURES } from '@/lib/features';
import { SUBJECT_NAMES } from '@/lib/plans/generate';
import { loadSched, type SchedSlot } from '@/lib/plans/sched-store';
import LessonIdeas from './LessonIdeas';
import { PICK_EVENT, loadPick } from '@/lib/plans/idea-bank';
import '@/styles/tdy.css';

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
    // Giáo án đã lưu không ghi buổi: lấy buổi (sáng/chiều) từ lịch báo giảng cùng tên bài, để tiết chiều không gộp vào tiết sáng
    ...saved.map((p) => ({ key: p.id, period: p.period ?? 0, pm: isPm((local.find((s) => norm(s.title) === norm(p.title) && s.period === (p.period ?? 0)) ?? local.find((s) => norm(s.title) === norm(p.title)))?.session), subject: SUBJECT_NAMES[p.subject as keyof typeof SUBJECT_NAMES] ?? p.subject, title: p.title, saved: true })),
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

/** "còn 45 phút" / "còn 6 giờ 53 phút" — dễ đọc hơn số phút lớn */
const leftLabel = (m: number) => (m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ${m % 60 ? ` ${m % 60} phút` : ''}`);

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

/** ① Dải "Bây giờ": tiết đang dạy hoặc tiết kế tiếp, kèm nút dùng ngay trong tiết.
 *  side: việc hằng ngày của cả buổi (Điểm danh, Giao bài) — gộp vào cùng dải để trang chỉ có một hàng nút. */
export function NowBar(p: Props & { side?: React.ReactNode }) {
  const { today, next, min, allPast } = useSlots(p.classId, p.day, p.tomorrow, p.saved, p.savedTomorrow);
  const side = p.side ? <div className="tdy-now-side" data-tour="viec-nhanh">{p.side}</div> : null;
  if (min === null) return <section className="tdy-now-bar is-idle" aria-busy="true"><span className="tdy-now-ic"><Clock3 aria-hidden="true" /></span><div className="tdy-now-txt"><small>Bây giờ</small><b>Đang xem lịch dạy…</b></div>{side}</section>;
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
          <small>{now ? `Đang dạy · ${periodLabel(g)} · còn ${left} phút` : `Tiết kế tiếp · ${periodLabel(g)} lúc ${hhmm(t[0])} · còn ${leftLabel(left)}`}</small>
          <b title={desc(g)}>{desc(g)}</b>
        </div>
        <div className="tdy-now-acts">
          <Link href={`${p.base}/bai-giang-3d`} className="tdy-now-btn is-main"><MonitorPlay aria-hidden="true" /> Mở bài giảng</Link>
          {now
            ? <><Link href={`${p.base}/goi-ten`} className="tdy-now-btn"><Dices aria-hidden="true" /> Dò bài</Link><Link href={`${p.base}/hen-gio`} className="tdy-now-btn"><Timer aria-hidden="true" /> Hẹn giờ</Link></>
            : <><Link href={`${p.base}/ke-hoach`} className="tdy-now-btn"><NotebookPen aria-hidden="true" /> Xem giáo án</Link><Link href={`${p.base}/goi-ten`} className="tdy-now-btn is-opt"><Dices aria-hidden="true" /> Gọi tên</Link></>}
        </div>
        {side}
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
        <Link href={`${p.base}/goi-ten`} className="tdy-now-btn is-opt"><Dices aria-hidden="true" /> Gọi tên</Link>
      </div>
      {side}
    </section>
  );
}

/** ② Dòng thời gian các tiết; hết tiết hôm nay thì chuyển sang "Ngày mai dạy" */
export default function TodaySchedule(p: Props & { headingId: string; grade?: number }) {
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
  // tiết đã dạy thu gọn thành một dòng (bấm để xem lại) — khối ngắn lại, tiết đang / sắp dạy nổi lên
  const [showPast, setShowPast] = useState(false);
  const past = showTomorrow ? [] : view.groups.filter((g) => whenOf(g, min) === 'past');
  const shown = showPast ? view.groups : view.groups.filter((g) => !past.includes(g));
  // "Đồng nghiệp đã soạn": số bài đồng nghiệp đăng trên Cộng đồng cho từng tiết (hàm community_peer_counts, migration 0081)
  const titles = useMemo(() => [...new Set(view.groups.flatMap((g) => g.items.map((r) => r.title)))].slice(0, 20), [view]);
  const titleKey = titles.join('|');
  const [peers, setPeers] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!FEATURES.community || !titles.length) return;
    let live = true;
    let sb: ReturnType<typeof createClient> | null = null;
    try { sb = createClient(); } catch { return; }
    void sb.rpc('community_peer_counts', { p_grade: p.grade ?? null, p_titles: titles }).then(({ data, error }) => { if (live && !error) setPeers((data ?? {}) as Record<string, number>); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ hỏi lại khi danh sách tên bài đổi
  }, [titleKey, p.grade]);
  const peerHref = (title: string) => `/giao-vien/cong-dong?q=${encodeURIComponent(title.slice(0, 80))}${p.grade ? `&khoi=${p.grade}` : ''}`;

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
          {past.length > 0 && (
            <li className="tdy-slot-past">
              <button type="button" onClick={() => setShowPast((v) => !v)} aria-expanded={showPast}>
                <span className="tdy-chip is-done">✓ Đã dạy</span>
                <span>{past.map((g) => `${periodLabel(g)} · ${g.items.map((r) => r.subject).join(', ')}`).join(' — ')}</span>
                <small>{showPast ? 'Ẩn' : 'Xem lại'}</small>
              </button>
            </li>
          )}
          {shown.map((g) => {
            const w = showTomorrow ? null : whenOf(g, min);
            const allSaved = g.items.every((r) => r.saved);
            const t = slotOf(g.period, g.pm);
            return (
              <li key={g.key} className={`tdy-slot${w ? ` is-${w}` : ''}`}>
                <span className="tdy-slot-t">{periodLabel(g)}{t && <small>{hhmm(t[0])}</small>}{w === 'now' && <em className="tdy-now">Đang dạy</em>}</span>
                <span className="tdy-slot-list">
                  {g.items.map((r) => (
                    <span key={r.key} className="tdy-slot-item">
                      <button type="button" className="tdy-slot-s is-btn" onClick={() => onRow(r)} title="Bấm để xem gợi ý cách dạy tiết này">
                        <b>{r.subject} <i className="tdy-slot-ic" aria-hidden="true">{hasPick(r) ? '✅' : '💡'}</i></b><span>{r.title}</span>
                      </button>
                      {peers[r.title] > 0 && <Link href={peerHref(r.title)} className="tdy-peer" title="Bài đồng nghiệp đã chia sẻ cho bài này trên Cộng đồng"><UsersRound aria-hidden="true" /> {peers[r.title]} bài đồng nghiệp đã soạn</Link>}
                    </span>
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

/* ================= Trang chủ giáo viên (bố cục dashboard 11/2026) ================= */

/** Thẻ lớn "Tiết học tiếp theo": nhãn giờ, tên bài, tiết · lớp, nút Mở bài giảng. Hết tiết thì nhắc soạn cho ngày mai. */
export function NextLessonCard(p: Props & { className: string }) {
  const { today, next, min, allPast } = useSlots(p.classId, p.day, p.tomorrow, p.saved, p.savedTomorrow);
  const now = min === null ? undefined : today.groups.find((g) => whenOf(g, min) === 'now');
  const upcoming = min === null ? undefined : today.groups.find((g) => whenOf(g, min) === 'next');
  const g = now ?? upcoming;
  const desc = (x: Group) => x.items.map((r) => `${r.subject} – ${r.title}`).join(' · ');
  let pill: string, title: string, sub: string, cta: { href: string; label: string };
  if (min === null) {
    pill = 'Tiết học tiếp theo'; title = 'Đang xem lịch dạy…'; sub = `Lớp ${p.className}`;
    cta = { href: `${p.base}/bai-giang-3d`, label: 'Mở bài giảng' };
  } else if (g) {
    const t = slotOf(g.period, g.pm)!;
    pill = now ? `Đang dạy · còn ${t[1] - min} phút` : `Tiết học tiếp theo · ${hhmm(t[0])}`;
    title = desc(g); sub = `${periodLabel(g)} · Lớp ${p.className}`;
    cta = { href: `${p.base}/bai-giang-3d`, label: 'Mở bài giảng' };
  } else {
    const n = next.groups.length;
    pill = allPast ? 'Đã dạy xong hôm nay' : 'Hôm nay chưa có tiết';
    title = n ? `Ngày mai có ${n} tiết` : 'Ngày mai chưa có lịch dạy';
    sub = n ? (next.unsaved ? `${next.unsaved} tiết chưa lưu giáo án` : 'Đã soạn đủ giáo án') : `Lớp ${p.className} · nạp lịch báo giảng để xem tiết dạy`;
    cta = { href: `${p.base}/ke-hoach`, label: n && !next.unsaved ? 'Xem giáo án' : 'Soạn giáo án' };
  }
  return (
    <section className={`tdy-next${now ? ' is-live' : ''}`} aria-label="Tiết học tiếp theo">
      <span className="tdy-next-pill">{now ? <span className="tdy-live-dot" aria-hidden="true" /> : <CalendarDays aria-hidden="true" />}{pill}</span>
      <h2 className="tdy-next-title" title={title}>{title}</h2>
      <p className="tdy-next-sub"><UsersRound aria-hidden="true" /> {sub}</p>
      <div className="tdy-next-acts">
        <Link href={cta.href} className="tdy-next-go"><Play aria-hidden="true" /> {cta.label} <ArrowRight aria-hidden="true" className="tdy-next-arrow" /></Link>
        {now && <Link href={`${p.base}/goi-ten`} className="tdy-next-alt"><Dices aria-hidden="true" /> Gọi tên</Link>}
      </div>
    </section>
  );
}

/** Số tiết hôm nay (máy chủ + lịch báo giảng trên máy) — dùng trong ô số liệu */
export function TodayLessonCount(p: { classId: string; day: string; saved: SavedSlot[] }) {
  const { today, min } = useSlots(p.classId, p.day, p.day, p.saved, []);
  return <>{min === null ? '…' : today.groups.length}</>;
}

const DOW_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "Lịch tuần": dải 7 ngày (T2–CN, đổi tuần bằng ‹ ›), bấm một ngày để xem các tiết của ngày đó */
export function WeekSchedule(p: { classId: string; base: string; day: string; savedByDay: Record<string, SavedSlot[]> }) {
  const [local, setLocal] = useState<SchedSlot[]>([]);
  const [min, setMin] = useState<number | null>(null);
  const [off, setOff] = useState(0);
  const [pick, setPick] = useState(p.day);
  useEffect(() => { setLocal(loadSched(p.classId)); }, [p.classId]);
  useEffect(() => {
    const tick = () => { const d = new Date(); setMin(d.getHours() * 60 + d.getMinutes()); };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const monday = addDaysIso(mondayOf(p.day), off * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDaysIso(monday, i));
  const sel = days.includes(pick) ? pick : off === 0 ? p.day : days[0];
  const { groups } = useMemo(() => groupsOf(p.savedByDay[sel] ?? [], local.filter((s) => s.date === sel)), [p.savedByDay, local, sel]);
  const has = (d: string) => (p.savedByDay[d]?.length ?? 0) > 0 || local.some((s) => s.date === d);
  const week = schoolWeek(monday);
  const isToday = sel === p.day;
  return (
    <section className="tdy-card tdy-week-card" aria-labelledby="tdy-week-h">
      <h2 id="tdy-week-h">
        <DashIcon name="h-week" h={26} /> Lịch tuần
        <span className="tdy-wk-nav">
          <button type="button" onClick={() => setOff((o) => o - 1)} aria-label="Tuần trước"><ChevronLeft aria-hidden="true" /></button>
          <button type="button" className="tdy-wk-lbl" onClick={() => { setOff(0); setPick(p.day); }} title="Về tuần này">{week ? `Tuần ${week}` : 'Tuần này'}</button>
          <button type="button" onClick={() => setOff((o) => o + 1)} aria-label="Tuần sau"><ChevronRight aria-hidden="true" /></button>
        </span>
      </h2>
      <ol className="tdy-wk-days">
        {days.map((d) => {
          const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
          return (
            <li key={d}>
              <button type="button" onClick={() => setPick(d)} aria-pressed={d === sel}
                className={`${d === sel ? 'is-sel' : ''}${d === p.day ? ' is-today' : ''}${dow === 0 ? ' is-sun' : ''}`}>
                <small>{DOW_SHORT[dow]}</small><b>{+d.slice(8)}</b>{has(d) && <i aria-label="có tiết dạy" />}
              </button>
            </li>
          );
        })}
      </ol>
      {groups.length === 0 ? (
        <p className="tdy-wk-empty">Chưa có tiết nào trong lịch ngày này. <Link href={`${p.base}/ke-hoach`}>Nạp lịch báo giảng</Link></p>
      ) : (
        <ul className="tdy-wk-list">
          {groups.map((g) => {
            const t = slotOf(g.period, g.pm);
            const w = isToday ? whenOf(g, min) : null;
            const math = g.items.some((r) => /toán/i.test(r.subject));
            const Icon = math ? Calculator : BookOpen;
            return (
              <li key={g.key} className={`tdy-wk-row${w === 'now' ? ' is-now' : ''}${w === 'past' ? ' is-past' : ''}`}>
                <span className="tdy-wk-t">{t ? hhmm(t[0]) : '—'}</span>
                <Icon aria-hidden="true" />
                <span className="tdy-wk-s" title={g.items.map((r) => `${r.subject} – ${r.title}`).join(' · ')}>{g.items.map((r) => `${r.subject} – ${r.title}`).join(' · ')}</span>
                <span className="tdy-wk-p">({periodLabel(g)})</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
