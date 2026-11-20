'use client';

// Khối "Lịch hôm nay" cho dashboard giáo viên / phụ huynh: hôm nay (dương + âm), dải 7 ngày của tuần, ngày lễ sắp tới.
// Tính trên máy (giờ Việt Nam); bấm để mở lịch đầy đủ.
// Ghi chú nhắc hẹn (migration 0069): 📝 trên dải tuần; việc đã tới lúc nhắc đứng đầu danh sách, tô nổi.
// Danh sách chỉ xem trong 2 tuần tới (UPCOMING_DAYS).
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import { LUNAR_MONTH_NAME, WEEKDAYS, canChiDay, canChiYear, dayInfo, type DayInfo } from '@/lib/utils/lunar';
import { UPCOMING_DAYS, addDays, leftLabel, occurrencesBetween, useCalendarNotes } from '@/lib/calendar-notes';
import '@/styles/uw.css';

const SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MAX_ITEMS = 4;
type Item = { key: string; i: number; when: string; name: string; kind: string; href?: string };
type Data = { today: DayInfo; todayIso: string; week: DayInfo[]; holidays: Item[] };
const isoOf = (d: DayInfo) => `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
const whenOf = (d: DayInfo, i: number) => (i <= 1 ? leftLabel(i) : `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')} · còn ${i} ngày`);

function build(): Data {
  const t = new Date(Date.now() + 7 * 3600_000);
  const base = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const at = (i: number) => { const x = new Date(base + i * 86_400_000); return dayInfo(x.getUTCDate(), x.getUTCMonth() + 1, x.getUTCFullYear()); };
  const today = at(0);
  const lead = (today.weekday + 6) % 7; // tuần bắt đầu thứ Hai
  const week = Array.from({ length: 7 }, (_, i) => at(i - lead));
  const holidays: Item[] = [];
  for (let i = 0; i <= UPCOMING_DAYS; i++) {
    const d = at(i);
    d.holidays.forEach((h) => holidays.push({ key: `${i}${h.name}`, i, when: whenOf(d, i), name: h.name, kind: h.kind }));
  }
  return { today, todayIso: isoOf(today), week, holidays };
}

/** compact: bỏ 2 thẻ ngày lớn (khi ngày âm/dương đã hiện ở đầu trang) — chỉ còn dải tuần + lễ sắp tới */
export default function MiniCalendar({ href, compact = false, title = '📅 Lịch hôm nay' }: { href: string; compact?: boolean; title?: string }) {
  // tính sau khi gắn vào trang để ngày luôn theo đồng hồ máy (tránh lệch giữa máy chủ và trình duyệt)
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { setData(build()); }, []);
  const cal = useCalendarNotes();

  const { next, noteDays } = useMemo(() => {
    if (!data) return { next: [] as Item[], noteDays: new Set<string>() };
    const noteDays = new Set(occurrencesBetween(cal.notes, isoOf(data.week[0]), isoOf(data.week[6])).map((o) => o.day));
    // việc đã tới lúc nhắc lên đầu, sau đó theo ngày; lễ và ghi chú trộn chung, tối đa MAX_ITEMS dòng
    const occ = occurrencesBetween(cal.notes, data.todayIso, addDays(data.todayIso, UPCOMING_DAYS));
    const notes: Item[] = occ.filter((o) => !o.done).map((o) => ({
      key: `n${o.note.id}${o.day}`, i: o.daysLeft, kind: o.daysLeft <= o.note.remind_days ? 'nhac' : 'note',
      name: `📝 ${o.note.title}`, href: `${href}?ngay=${o.day}`,
      when: `${o.daysLeft <= 1 ? leftLabel(o.daysLeft) : `${o.day.slice(8)}/${o.day.slice(5, 7)} · còn ${o.daysLeft} ngày`}${o.note.at_time ? ` · ${o.note.at_time}` : ''}`,
    }));
    const rank = (x: Item) => (x.kind === 'nhac' ? 0 : 1);
    const next = [...notes, ...data.holidays].sort((a, b) => rank(a) - rank(b) || a.i - b.i).slice(0, MAX_ITEMS);
    return { next, noteDays };
  }, [data, cal.notes, href]);

  if (!data) return <section className="uw uw-cal" aria-busy="true"><p className="uw-muted">Đang tải lịch…</p></section>;
  const { today: t, week } = data;

  return (
    <section className="uw uw-cal" aria-labelledby="uw-cal-h">
      <div className="uw-hd">
        <h2 id="uw-cal-h">{title}</h2>
        <Link href={href} className="uw-more">Mở lịch <ChevronRight aria-hidden="true" /></Link>
      </div>
      {!compact && <div className="uw-faces">
        <div className="uw-face is-s">
          <small><Sun aria-hidden="true" /> {WEEKDAYS[t.weekday]}</small>
          <b>{t.d}</b>
          <span>tháng {t.m}/{t.y}</span>
        </div>
        <div className="uw-face is-l">
          <small><Moon aria-hidden="true" /> Âm lịch</small>
          <b>{t.lunar.day}</b>
          <span>tháng {LUNAR_MONTH_NAME[t.lunar.month]}{t.lunar.leap ? ' nhuận' : ''} · {canChiYear(t.lunar.year)}</span>
        </div>
      </div>}
      <p className="uw-cc">Ngày {canChiDay(t.jd)}{t.holidays.length ? ` · ${t.holidays.map((h) => h.name).join(', ')}` : ''}</p>
      <ol className="uw-week" aria-label="Tuần này">
        {week.map((d) => {
          const isToday = d.d === t.d && d.m === t.m;
          return (
            <li key={`${d.m}-${d.d}`} className={`${isToday ? 'is-today' : ''}${d.weekday === 0 ? ' is-sun' : ''}${d.holidays.length ? ' has-ev' : ''}${noteDays.has(isoOf(d)) ? ' has-note' : ''}`} title={[...d.holidays.map((h) => h.name), noteDays.has(isoOf(d)) ? 'Có ghi chú' : ''].filter(Boolean).join(', ') || undefined}>
              <small>{SHORT[d.weekday]}</small>
              <b>{d.d}</b>
              <span className={d.lunar.day === 1 || d.lunar.day === 15 ? 'is-mark' : ''}>{d.lunar.day === 1 ? `1/${d.lunar.month}` : d.lunar.day}</span>
            </li>
          );
        })}
      </ol>
      {next.length > 0 && (
        <ul className="uw-next">
          {next.map((n) => (
            <li key={n.key} className={`is-${n.kind}`}>
              {n.href ? <Link href={n.href}><b>{n.name}</b><span>{n.when}</span></Link> : <><b>{n.name}</b><span>{n.when}</span></>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
