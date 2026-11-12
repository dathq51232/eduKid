'use client';

// Khối "Lịch hôm nay" cho dashboard giáo viên / phụ huynh: hôm nay (dương + âm), dải 7 ngày của tuần, ngày lễ sắp tới.
// Tính trên máy (giờ Việt Nam); bấm để mở lịch đầy đủ.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import { LUNAR_MONTH_NAME, WEEKDAYS, canChiDay, canChiYear, dayInfo, type DayInfo } from '@/lib/utils/lunar';

const SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
type Data = { today: DayInfo; week: DayInfo[]; next: { when: string; name: string; kind: string }[] };

function build(): Data {
  const t = new Date(Date.now() + 7 * 3600_000);
  const base = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const at = (i: number) => { const x = new Date(base + i * 86_400_000); return dayInfo(x.getUTCDate(), x.getUTCMonth() + 1, x.getUTCFullYear()); };
  const today = at(0);
  const lead = (today.weekday + 6) % 7; // tuần bắt đầu thứ Hai
  const week = Array.from({ length: 7 }, (_, i) => at(i - lead));
  const next: Data['next'] = [];
  for (let i = 0; i <= 60 && next.length < 3; i++) {
    const d = at(i);
    d.holidays.forEach((h) => next.length < 3 && next.push({ when: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')} · còn ${i} ngày`, name: h.name, kind: h.kind }));
  }
  return { today, week, next };
}

export default function MiniCalendar({ href }: { href: string }) {
  // tính sau khi gắn vào trang để ngày luôn theo đồng hồ máy (tránh lệch giữa máy chủ và trình duyệt)
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { setData(build()); }, []);
  if (!data) return <section className="uw uw-cal" aria-busy="true"><p className="uw-muted">Đang tải lịch…</p></section>;
  const { today: t, week, next } = data;

  return (
    <section className="uw uw-cal" aria-labelledby="uw-cal-h">
      <div className="uw-hd">
        <h2 id="uw-cal-h">📅 Lịch hôm nay</h2>
        <Link href={href} className="uw-more">Mở lịch <ChevronRight aria-hidden="true" /></Link>
      </div>
      <div className="uw-faces">
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
      </div>
      <p className="uw-cc">Ngày {canChiDay(t.jd)}{t.holidays.length ? ` · ${t.holidays.map((h) => h.name).join(', ')}` : ''}</p>
      <ol className="uw-week" aria-label="Tuần này">
        {week.map((d) => {
          const isToday = d.d === t.d && d.m === t.m;
          return (
            <li key={`${d.m}-${d.d}`} className={`${isToday ? 'is-today' : ''}${d.weekday === 0 ? ' is-sun' : ''}${d.holidays.length ? ' has-ev' : ''}`} title={d.holidays.map((h) => h.name).join(', ') || undefined}>
              <small>{SHORT[d.weekday]}</small>
              <b>{d.d}</b>
              <span className={d.lunar.day === 1 || d.lunar.day === 15 ? 'is-mark' : ''}>{d.lunar.day === 1 ? `1/${d.lunar.month}` : d.lunar.day}</span>
            </li>
          );
        })}
      </ol>
      {next.length > 0 && (
        <ul className="uw-next">
          {next.map((n) => <li key={n.when + n.name} className={`is-${n.kind}`}><b>{n.name}</b><span>{n.when}</span></li>)}
        </ul>
      )}
    </section>
  );
}
