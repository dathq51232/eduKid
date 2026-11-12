'use client';

// Lịch âm dương dùng chung (giáo viên + phụ huynh), phong cách kính mờ.
// Dương lịch = số lớn màu mực/xanh; Âm lịch = viên màu cam riêng → nhìn là phân biệt.
// Giáo viên: truyền classId + students để hiện sinh nhật học sinh (Hồ sơ học sinh, migration 0050).
import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  LUNAR_MONTH_NAME, WEEKDAYS, canChiDay, canChiMonth, canChiYear, conGiap, dayInfo, gioHoangDao, lunarToSolar, solarToLunar, tietKhi,
  type DayInfo,
} from '@/lib/utils/lunar';

type Student = { id: string; name: string };
type Bday = { id: string; name: string; d: number; m: number; y: number };
type YMD = { y: number; m: number; d: number };
const HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const pad = (n: number) => String(n).padStart(2, '0');
const vnToday = (): YMD => { const t = new Date(Date.now() + 7 * 3600_000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const same = (a: YMD, b: YMD) => a.d === b.d && a.m === b.m && a.y === b.y;

export default function LunarCalendar({ title, subtitle, icon, classId, students = [], profileHref }: {
  title: string; subtitle: string; icon?: React.ReactNode; classId?: string; students?: Student[]; profileHref?: string;
}) {
  const today = useMemo(vnToday, []);
  const [cur, setCur] = useState({ y: today.y, m: today.m });
  const [sel, setSel] = useState<YMD>(today);
  const [bdays, setBdays] = useState<Bday[]>([]);

  useEffect(() => {
    if (!classId || !students.length) return;
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

  const cells = useMemo(() => {
    const first = dayInfo(1, cur.m, cur.y);
    const lead = (first.weekday + 6) % 7;
    const start = Date.UTC(cur.y, cur.m - 1, 1) - lead * 86_400_000;
    const out: DayInfo[] = [];
    for (let i = 0; i < 42; i++) {
      const t = new Date(start + i * 86_400_000);
      out.push(dayInfo(t.getUTCDate(), t.getUTCMonth() + 1, t.getUTCFullYear()));
    }
    return out[35].m !== cur.m ? out.slice(0, 35) : out;
  }, [cur]);
  const info = useMemo(() => dayInfo(sel.d, sel.m, sel.y), [sel]);
  const mid = useMemo(() => dayInfo(15, cur.m, cur.y), [cur]);

  const upcoming = useMemo(() => {
    const out: { key: string; when: string; text: string; tone: string }[] = [];
    const base = Date.UTC(today.y, today.m - 1, today.d);
    for (let i = 0; i <= 45 && out.length < 8; i++) {
      const t = new Date(base + i * 86_400_000);
      const d = t.getUTCDate(), m = t.getUTCMonth() + 1, y = t.getUTCFullYear();
      const di = dayInfo(d, m, y);
      const when = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${WEEKDAYS[di.weekday]} ${pad(d)}/${pad(m)} · còn ${i} ngày`;
      di.holidays.forEach((h) => out.push({ key: `${i}${h.name}`, when, text: h.name, tone: h.kind }));
      bdays.filter((b) => b.d === d && b.m === m).forEach((b) => out.push({ key: `${i}${b.id}`, when, text: `🎂 ${b.name} tròn ${y - b.y} tuổi`, tone: 'bday' }));
    }
    return out.slice(0, 8);
  }, [today, bdays]);

  const move = (dm: number) => setCur((c) => { const t = c.m - 1 + dm; return { y: c.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 + 1 }; });
  const goToday = () => { setCur({ y: today.y, m: today.m }); setSel(today); };
  const pick = (i: DayInfo) => { setSel({ y: i.y, m: i.m, d: i.d }); if (i.m !== cur.m) setCur({ y: i.y, m: i.m }); };

  const [solarIn, setSolarIn] = useState(`${today.y}-${pad(today.m)}-${pad(today.d)}`);
  const [lun, setLun] = useState({ d: '1', m: '1', y: String(today.y + (today.m >= 3 ? 1 : 0)), leap: false });
  const solarOut = useMemo(() => {
    const [y, m, d] = solarIn.split('-').map(Number);
    if (!y || !m || !d) return null;
    const l = solarToLunar(d, m, y);
    return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''} năm ${canChiYear(l.year)} · ngày ${canChiDay(dayInfo(d, m, y).jd)}`;
  }, [solarIn]);
  const lunarOut = useMemo(() => {
    const d = Number(lun.d), m = Number(lun.m), y = Number(lun.y);
    if (!(d >= 1 && d <= 30 && m >= 1 && m <= 12 && y >= 1900 && y <= 2199)) return 'Ngày âm chưa hợp lệ.';
    const r = lunarToSolar(d, m, y, lun.leap);
    if (!r) return lun.leap ? `Năm ${canChiYear(y)} không có tháng ${m} nhuận.` : `Tháng ${m} âm năm ${y} chỉ có 29 ngày.`;
    return `${WEEKDAYS[dayInfo(r[0], r[1], r[2]).weekday]}, ${pad(r[0])}/${pad(r[1])}/${r[2]}`;
  }, [lun]);

  const selBdays = bdays.filter((b) => b.d === info.d && b.m === info.m);

  return (
    <div className="lg">
      <div className="lg-head">
        <div>
          <p className="lg-kicker">{subtitle}</p>
          <h1>{icon}{title}</h1>
        </div>
        <p className="lg-key" aria-label="Chú thích">
          <span className="lg-key-s"><Sun aria-hidden="true" /> Dương lịch</span>
          <span className="lg-key-l"><Moon aria-hidden="true" /> Âm lịch</span>
        </p>
      </div>

      <div className="lg-cols">
        <section className="lg-glass lg-month" aria-label={`Lịch tháng ${cur.m}/${cur.y}`}>
          <div className="lg-bar">
            <div className="lg-mtitle">
              <b>Tháng {cur.m}<span>/{cur.y}</span></b>
              <small><Moon aria-hidden="true" /> tháng {LUNAR_MONTH_NAME[mid.lunar.month]} · năm {canChiYear(mid.lunar.year)} ({conGiap(mid.lunar.year)})</small>
            </div>
            <div className="lg-nav">
              <button type="button" onClick={() => move(-1)} aria-label="Tháng trước"><ChevronLeft aria-hidden="true" /></button>
              <button type="button" className="lg-todaybtn" onClick={goToday}>Hôm nay</button>
              <button type="button" onClick={() => move(1)} aria-label="Tháng sau"><ChevronRight aria-hidden="true" /></button>
            </div>
          </div>
          <div className="lg-grid" role="grid">
            {HEAD.map((h, i) => <span key={h} className={`lg-wd${i === 5 ? ' is-sat' : i === 6 ? ' is-sun' : ''}`} role="columnheader">{h}</span>)}
            {cells.map((c) => {
              const bd = bdays.filter((b) => b.d === c.d && b.m === c.m);
              const h = c.holidays[0];
              const mark = c.lunar.day === 1 || c.lunar.day === 15;
              const cls = ['lg-day', c.m !== cur.m && 'is-out', same(c, today) && 'is-today', same(c, sel) && 'is-sel',
                c.weekday === 0 && 'is-sun', c.weekday === 6 && 'is-sat', c.holidays.some((x) => x.off) && 'is-off'].filter(Boolean).join(' ');
              return (
                <button key={`${c.y}-${c.m}-${c.d}`} type="button" className={cls} onClick={() => pick(c)} role="gridcell"
                  aria-label={`${WEEKDAYS[c.weekday]} ${c.d}/${c.m}/${c.y}, âm lịch ${c.lunar.day}/${c.lunar.month}${c.holidays.length ? `, ${c.holidays.map((x) => x.name).join(', ')}` : ''}${bd.length ? `, sinh nhật ${bd.map((b) => b.name).join(', ')}` : ''}`}>
                  <span className="lg-s">{c.d}</span>
                  {bd.length > 0 && <span className="lg-bd" title={bd.map((b) => b.name).join(', ')}>🎂{bd.length > 1 ? bd.length : ''}</span>}
                  {h && <span className={`lg-ev is-${h.kind}`}>{h.name}</span>}
                  <span className={`lg-l${mark ? ' is-mark' : ''}`}>{c.lunar.day === 1 ? `1/${c.lunar.month}${c.lunar.leap ? 'N' : ''}` : c.lunar.day}</span>
                </button>
              );
            })}
          </div>
          <p className="lg-legend">
            <span><i className="is-le" /> Lễ, kỷ niệm</span><span><i className="is-truong" /> Ngày của ngành, trường</span><span><i className="is-am" /> Lễ âm lịch</span>
            <span><b className="lg-l is-mark">1/10</b> mùng 1 · <b className="lg-l is-mark">15</b> rằm</span>
            {classId && <span>🎂 Sinh nhật học sinh</span>}
          </p>
        </section>

        <div className="lg-side">
          <section className="lg-glass lg-detail" aria-live="polite">
            <div className="lg-faces">
              <div className="lg-face is-s">
                <small><Sun aria-hidden="true" /> Dương lịch</small>
                <b>{info.d}</b>
                <span>{WEEKDAYS[info.weekday]}</span>
                <span>tháng {info.m}/{info.y}</span>
              </div>
              <div className="lg-face is-l">
                <small><Moon aria-hidden="true" /> Âm lịch</small>
                <b>{info.lunar.day}</b>
                <span>tháng {LUNAR_MONTH_NAME[info.lunar.month]}{info.lunar.leap ? ' nhuận' : ''} ({info.monthLen === 30 ? 'đủ' : 'thiếu'})</span>
                <span>năm {canChiYear(info.lunar.year)}</span>
              </div>
            </div>
            <dl className="lg-cc">
              <div><dt>Ngày</dt><dd>{canChiDay(info.jd)}</dd></div>
              <div><dt>Tháng</dt><dd>{canChiMonth(info.lunar)}</dd></div>
              <div><dt>Năm</dt><dd>{canChiYear(info.lunar.year)}</dd></div>
              <div><dt>Tiết khí</dt><dd>{tietKhi(info.jd)}</dd></div>
            </dl>
            <p className="lg-hd"><b>Giờ hoàng đạo</b> {gioHoangDao(info.jd).join(' · ')}</p>
            {(info.holidays.length > 0 || selBdays.length > 0) && (
              <ul className="lg-evs">
                {info.holidays.map((h) => <li key={h.name} className={`is-${h.kind}`}>{h.name}{h.off ? ' · nghỉ lễ' : ''}</li>)}
                {selBdays.map((b) => <li key={b.id} className="is-bday">🎂 Sinh nhật {b.name} · tròn {info.y - b.y} tuổi</li>)}
              </ul>
            )}
          </section>

          <section className="lg-glass lg-up">
            <h2>Sắp tới</h2>
            {upcoming.length === 0 ? <p className="lg-muted">Không có ngày lễ hay sinh nhật trong 45 ngày tới.</p> : (
              <ul>{upcoming.map((u) => <li key={u.key} className={`is-${u.tone}`}><span>{u.when}</span><b>{u.text}</b></li>)}</ul>
            )}
            {classId && bdays.length === 0 && profileHref && <p className="lg-muted">Muốn thấy sinh nhật học sinh: nhập ngày sinh ở <a href={profileHref}>Hồ sơ học sinh</a>.</p>}
          </section>

          <section className="lg-glass lg-conv">
            <h2><ArrowRightLeft aria-hidden="true" /> Đổi ngày</h2>
            <label className="lg-row"><span className="lg-key-s"><Sun aria-hidden="true" /> Dương → Âm</span>
              <input type="date" value={solarIn} onChange={(e) => setSolarIn(e.target.value)} />
            </label>
            <p className="lg-out is-l">{solarOut ?? '—'}</p>
            <div className="lg-row"><span className="lg-key-l"><Moon aria-hidden="true" /> Âm → Dương</span>
              <span className="lg-lin">
                <input inputMode="numeric" value={lun.d} onChange={(e) => setLun({ ...lun, d: e.target.value })} aria-label="Ngày âm" maxLength={2} />/
                <input inputMode="numeric" value={lun.m} onChange={(e) => setLun({ ...lun, m: e.target.value })} aria-label="Tháng âm" maxLength={2} />/
                <input inputMode="numeric" value={lun.y} onChange={(e) => setLun({ ...lun, y: e.target.value })} aria-label="Năm âm" maxLength={4} className="is-y" />
                <label className="lg-leap"><input type="checkbox" checked={lun.leap} onChange={(e) => setLun({ ...lun, leap: e.target.checked })} /> nhuận</label>
              </span>
            </div>
            <p className="lg-out is-s">{lunarOut}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
