'use client';

// Lịch âm dương cho giáo viên: lịch tháng (ngày dương + ngày âm), ngày lễ / ngày của trường, sinh nhật học sinh
// (từ Hồ sơ học sinh — migration 0050), chi tiết một ngày (can chi, tiết khí, giờ hoàng đạo) và đổi ngày âm ↔ dương.
import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ToolIcon } from '@/components/classroom/tool-icons';
import {
  LUNAR_MONTH_NAME, WEEKDAYS, canChiDay, canChiMonth, canChiYear, conGiap, dayInfo, gioHoangDao, lunarToSolar, solarToLunar, tietKhi,
  type DayInfo,
} from '@/lib/utils/lunar';

type Student = { id: string; name: string };
type Bday = { id: string; name: string; d: number; m: number; y: number };
const HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const pad = (n: number) => String(n).padStart(2, '0');
const vnToday = () => { const t = new Date(Date.now() + 7 * 3600_000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const lunarText = (i: DayInfo) => `${i.lunar.day} tháng ${LUNAR_MONTH_NAME[i.lunar.month]}${i.lunar.leap ? ' nhuận' : ''} (${i.monthLen === 30 ? 'đủ' : 'thiếu'}) năm ${canChiYear(i.lunar.year)}`;

export default function TeacherCalendar({ classId, className, students }: { classId: string; className: string; students: Student[] }) {
  const today = useMemo(vnToday, []);
  const [cur, setCur] = useState({ y: today.y, m: today.m });
  const [sel, setSel] = useState(today);
  const [bdays, setBdays] = useState<Bday[]>([]);

  // Sinh nhật học sinh: đọc ngày sinh ở Hồ sơ học sinh (chưa chạy 0050 hoặc chưa nhập thì bỏ qua)
  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const { data, error } = await createClient().rpc('teacher_student_profiles', { p_class: classId });
        if (error || off) return;
        const prof = (data ?? {}) as Record<string, { birth: string | null }>;
        setBdays(students.flatMap((s) => {
          const b = prof[s.id]?.birth;
          if (!b) return [];
          const [y, m, d] = b.split('-').map(Number);
          return [{ id: s.id, name: s.name, d, m, y }];
        }));
      } catch { /* chưa cấu hình: lịch vẫn dùng được */ }
    })();
    return () => { off = true; };
  }, [classId, students]);

  // 6 hàng × 7 ngày, tuần bắt đầu từ thứ Hai
  const cells = useMemo(() => {
    const first = dayInfo(1, cur.m, cur.y);
    const lead = (first.weekday + 6) % 7;
    const out: DayInfo[] = [];
    const start = Date.UTC(cur.y, cur.m - 1, 1) - lead * 86_400_000;
    for (let i = 0; i < 42; i++) {
      const t = new Date(start + i * 86_400_000);
      out.push(dayInfo(t.getUTCDate(), t.getUTCMonth() + 1, t.getUTCFullYear()));
    }
    return out.slice(0, out[35].m !== cur.m ? 35 : 42);
  }, [cur]);
  const bdayOf = (d: number, m: number) => bdays.filter((b) => b.d === d && b.m === m);
  const info = useMemo(() => dayInfo(sel.d, sel.m, sel.y), [sel]);
  const midMonth = useMemo(() => dayInfo(15, cur.m, cur.y), [cur]);

  // Sắp tới: lễ + sinh nhật trong 45 ngày từ hôm nay
  const upcoming = useMemo(() => {
    const out: { key: string; when: string; inDays: number; text: string; tone: string }[] = [];
    const base = Date.UTC(today.y, today.m - 1, today.d);
    for (let i = 0; i <= 45; i++) {
      const t = new Date(base + i * 86_400_000);
      const d = t.getUTCDate(), m = t.getUTCMonth() + 1, y = t.getUTCFullYear();
      const di = dayInfo(d, m, y);
      const when = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${WEEKDAYS[di.weekday]} ${pad(d)}/${pad(m)}`;
      di.holidays.forEach((h) => out.push({ key: `${i}${h.name}`, when, inDays: i, text: h.name, tone: h.kind }));
      bdayOf(d, m).forEach((b) => out.push({ key: `${i}${b.id}`, when, inDays: i, text: `🎂 ${b.name} tròn ${y - b.y} tuổi`, tone: 'bday' }));
    }
    return out.slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bdayOf đổi theo bdays
  }, [today, bdays]);

  const move = (dm: number) => setCur((c) => { const t = c.m - 1 + dm; return { y: c.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 + 1 }; });
  const goToday = () => { setCur({ y: today.y, m: today.m }); setSel(today); };
  const pick = (i: DayInfo) => { setSel({ y: i.y, m: i.m, d: i.d }); if (i.m !== cur.m) setCur({ y: i.y, m: i.m }); };

  // Đổi ngày
  const [solarIn, setSolarIn] = useState(`${today.y}-${pad(today.m)}-${pad(today.d)}`);
  const [lun, setLun] = useState({ d: '1', m: '1', y: String(today.y + (today.m >= 3 ? 1 : 0)), leap: false });
  const solarOut = useMemo(() => {
    const [y, m, d] = solarIn.split('-').map(Number);
    if (!y || !m || !d) return null;
    const l = solarToLunar(d, m, y);
    return `${l.day}/${l.month}${l.leap ? ' (nhuận)' : ''} năm ${canChiYear(l.year)} · ngày ${canChiDay(dayInfo(d, m, y).jd)}`;
  }, [solarIn]);
  const lunarOut = useMemo(() => {
    const d = Number(lun.d), m = Number(lun.m), y = Number(lun.y);
    if (!(d >= 1 && d <= 30 && m >= 1 && m <= 12 && y >= 1900 && y <= 2199)) return 'Ngày âm chưa hợp lệ.';
    const r = lunarToSolar(d, m, y, lun.leap);
    if (!r) return lun.leap ? `Năm ${canChiYear(y)} không có tháng ${m} nhuận.` : `Tháng ${m} âm năm ${y} chỉ có 29 ngày.`;
    return `${WEEKDAYS[dayInfo(r[0], r[1], r[2]).weekday]}, ${pad(r[0])}/${pad(r[1])}/${r[2]}`;
  }, [lun]);

  const selBdays = bdayOf(info.d, info.m);
  const isToday = (i: DayInfo) => i.d === today.d && i.m === today.m && i.y === today.y;

  return (
    <div className="ct lc">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Tiện ích · Lớp {className}</p>
          <h1><ToolIcon k="lich" /> Lịch âm dương</h1>
        </div>
      </div>

      <div className="lc-cols">
        <section className="card lc-month" aria-label={`Lịch tháng ${cur.m}/${cur.y}`}>
          <div className="lc-bar">
            <button type="button" className="ct-week" onClick={() => move(-1)} aria-label="Tháng trước"><ChevronLeft aria-hidden="true" /></button>
            <div className="lc-title">
              <b>Tháng {cur.m}/{cur.y}</b>
              <small>Âm lịch: tháng {LUNAR_MONTH_NAME[midMonth.lunar.month]} năm {canChiYear(midMonth.lunar.year)} ({conGiap(midMonth.lunar.year)})</small>
            </div>
            <button type="button" className="ct-week" onClick={() => move(1)} aria-label="Tháng sau"><ChevronRight aria-hidden="true" /></button>
            <button type="button" className="btn btn-outline btn-sm lc-today" onClick={goToday}><CalendarDays aria-hidden="true" /> Hôm nay</button>
          </div>
          <div className="lc-grid" role="grid">
            {HEAD.map((h, i) => <span key={h} className={`lc-head${i === 5 ? ' is-sat' : i === 6 ? ' is-sun' : ''}`} role="columnheader">{h}</span>)}
            {cells.map((c) => {
              const out = c.m !== cur.m;
              const bd = bdayOf(c.d, c.m);
              const first = c.lunar.day === 1;
              const h = c.holidays[0];
              const cls = ['lc-day', out && 'is-out', isToday(c) && 'is-today', c.d === sel.d && c.m === sel.m && c.y === sel.y && 'is-sel',
                c.weekday === 0 && 'is-sun', c.weekday === 6 && 'is-sat', c.holidays.some((x) => x.off) && 'is-off'].filter(Boolean).join(' ');
              return (
                <button key={`${c.y}-${c.m}-${c.d}`} type="button" className={cls} onClick={() => pick(c)} role="gridcell"
                  aria-label={`${WEEKDAYS[c.weekday]} ${c.d}/${c.m}/${c.y}, âm lịch ${c.lunar.day}/${c.lunar.month}${h ? `, ${c.holidays.map((x) => x.name).join(', ')}` : ''}${bd.length ? `, sinh nhật ${bd.map((b) => b.name).join(', ')}` : ''}`}>
                  <span className="lc-solar">{c.d}</span>
                  <span className={`lc-lunar${first || c.lunar.day === 15 ? ' is-mark' : ''}`}>{first ? `${c.lunar.day}/${c.lunar.month}${c.lunar.leap ? 'N' : ''}` : c.lunar.day}</span>
                  {h && <span className={`lc-ev is-${h.kind}`}>{h.name}</span>}
                  {bd.length > 0 && <span className="lc-bday" title={bd.map((b) => b.name).join(', ')}>🎂{bd.length > 1 ? bd.length : ''}</span>}
                </button>
              );
            })}
          </div>
          <p className="lc-legend"><i className="is-le" /> Lễ, kỷ niệm <i className="is-truong" /> Ngày của ngành, trường <i className="is-am" /> Lễ âm lịch <span>🎂 Sinh nhật học sinh</span> <span><b>1/10</b> mùng 1 · <b>15</b> rằm</span></p>
        </section>

        <div className="lc-side">
          <section className="card lc-detail" aria-live="polite">
            <p className="lc-wd">{WEEKDAYS[info.weekday]}</p>
            <p className="lc-big">{info.d}</p>
            <p className="lc-sd">tháng {info.m} năm {info.y}</p>
            <div className="lc-lbox">
              <b>Âm lịch: {lunarText(info)}</b>
              <dl>
                <div><dt>Ngày</dt><dd>{canChiDay(info.jd)}</dd></div>
                <div><dt>Tháng</dt><dd>{canChiMonth(info.lunar)}</dd></div>
                <div><dt>Năm</dt><dd>{canChiYear(info.lunar.year)}</dd></div>
                <div><dt>Tiết khí</dt><dd>{tietKhi(info.jd)}</dd></div>
              </dl>
              <p className="lc-hd"><b>Giờ hoàng đạo:</b> {gioHoangDao(info.jd).join(', ')}</p>
            </div>
            {(info.holidays.length > 0 || selBdays.length > 0) && (
              <ul className="lc-evs">
                {info.holidays.map((h) => <li key={h.name} className={`is-${h.kind}`}>{h.name}{h.off ? ' · nghỉ lễ' : ''}</li>)}
                {selBdays.map((b) => <li key={b.id} className="is-bday">🎂 Sinh nhật {b.name} · tròn {info.y - b.y} tuổi</li>)}
              </ul>
            )}
          </section>

          <section className="card lc-up">
            <h2>Sắp tới</h2>
            {upcoming.length === 0 ? <p className="ct-hint">Không có ngày lễ hay sinh nhật trong 45 ngày tới.</p> : (
              <ul>
                {upcoming.map((u) => <li key={u.key} className={`is-${u.tone}`}><span>{u.when}</span><b>{u.text}</b></li>)}
              </ul>
            )}
            {bdays.length === 0 && <p className="ct-hint">Muốn thấy sinh nhật học sinh: nhập ngày sinh ở <a href={`/giao-vien/lop/${classId}?xem=ho-so`}>Hồ sơ học sinh</a>.</p>}
          </section>

          <section className="card lc-conv">
            <h2><ArrowRightLeft aria-hidden="true" /> Đổi ngày</h2>
            <label className="lc-row"><span>Dương → Âm</span>
              <input type="date" value={solarIn} onChange={(e) => setSolarIn(e.target.value)} />
            </label>
            <p className="lc-out">{solarOut ?? '—'}</p>
            <div className="lc-row"><span>Âm → Dương</span>
              <span className="lc-lin">
                <input inputMode="numeric" value={lun.d} onChange={(e) => setLun({ ...lun, d: e.target.value })} aria-label="Ngày âm" maxLength={2} />/
                <input inputMode="numeric" value={lun.m} onChange={(e) => setLun({ ...lun, m: e.target.value })} aria-label="Tháng âm" maxLength={2} />/
                <input inputMode="numeric" value={lun.y} onChange={(e) => setLun({ ...lun, y: e.target.value })} aria-label="Năm âm" maxLength={4} className="is-y" />
                <label className="lc-leap"><input type="checkbox" checked={lun.leap} onChange={(e) => setLun({ ...lun, leap: e.target.checked })} /> nhuận</label>
              </span>
            </div>
            <p className="lc-out">{lunarOut}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
