// Khối "Lớp mình" ở cột phải trang Hôm nay: sinh nhật tuần này, em cần để ý, phụ huynh, nhịp luyện bài 7 ngày.
// Chỉ hiển thị (server component); số liệu tính sẵn ở src/app/giao-vien/page.tsx.
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';

export type Birthday = { id: string; name: string; short: string; inDays: number; date: string; age: number };
type Watch = { id: string; name: string; text: string; tone: 'warn' | 'good' };

const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DOW_LONG = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const initials = (n: string) => n.trim().split(/\s+/).slice(-2).map((x) => x[0]).join('');

export type PulseKpi = { practiced: number; rate: number | null; delta: number | null; open: number; openFirst: { title: string; done: number; assigned: number } | null };

export default function ClassPulse({ base, births, birthsOn, watch, unread, pendingLeave, recentMsgs, contactGaps, spark, students, todayIso, planText, kpi }: {
  base: string; births: Birthday[]; birthsOn: boolean; watch: Watch[]; unread: number; pendingLeave: number; recentMsgs: number;
  contactGaps: number | null; spark: number[]; students: number; todayIso: string; planText: string | null; kpi: PulseKpi;
}) {
  const t0 = Date.parse(`${todayIso}T00:00:00Z`);
  const dowOf = (offset: number) => new Date(t0 + offset * 86_400_000).getUTCDay();
  const max = Math.max(1, ...spark);
  const total = spark.reduce((a, b) => a + b, 0);

  return (
    <section className="tdy-card tdy-pulse" aria-labelledby="tdy-pulse">
      <h2 id="tdy-pulse"><Users aria-hidden="true" /> Lớp mình</h2>

      {/* Số liệu học tập của lớp (trước đây là hàng 4 ô ở đầu trang) */}
      <ul className="tdy-kpis">
        <li><Link href={`${base}/giao-bai`}><small>Luyện bài 7 ngày</small><b>{kpi.practiced}<i>/{students} em</i></b></Link></li>
        <li><Link href={`${base}/lo-hong`}><small>Tỉ lệ đúng</small>
          {kpi.practiced >= 5 && kpi.rate !== null
            ? <b>{Math.round(kpi.rate * 100)}<i>%</i>{kpi.delta !== null && <em className={kpi.delta >= 0 ? 'is-good' : 'is-bad'}>{kpi.delta >= 0 ? '▲' : '▼'}{Math.abs(kpi.delta)}</em>}</b>
            : <b className="is-muted">—<i>khi ≥5 em luyện</i></b>}
        </Link></li>
        <li><Link href={`${base}/giao-bai`}><small>Bài đang giao</small>
          {kpi.openFirst
            ? <b title={kpi.openFirst.title}>{kpi.openFirst.done}<i>/{kpi.openFirst.assigned} đã nộp{kpi.open > 1 ? ` · +${kpi.open - 1}` : ''}</i></b>
            : <b className="is-muted">0<i>bài</i></b>}
        </Link></li>
      </ul>

      <div className="tdy-pulse-part">
        <h3>🎂 Sinh nhật tuần này</h3>
        {!birthsOn ? (
          <p className="tdy-line">Thêm ngày sinh để được nhắc sinh nhật các em. <Link href={`${base}?xem=ho-so`}>Mở Hồ sơ</Link></p>
        ) : births.length === 0 ? (
          <p className="tdy-line">Không có em nào sinh nhật trong 7 ngày tới.</p>
        ) : (
          <ul className="tdy-kids">
            {births.map((b) => (
              <li key={b.id}>
                <Link href={`${base}/hoc-sinh/${b.id}`} className={`tdy-kid${b.inDays === 0 ? ' is-today' : ''}`}>
                  <span className="tdy-kid-av is-bday" aria-hidden="true">{b.inDays === 0 ? '🎂' : initials(b.name)}</span>
                  <span><b>{b.name}</b><small>{b.inDays === 0 ? `Hôm nay · tròn ${b.age} tuổi` : b.inDays === 1 ? `Ngày mai · ${b.date}` : `${DOW_LONG[dowOf(b.inDays)]} · ${b.date}`}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tdy-pulse-part">
        <h3>👀 Cần để ý</h3>
        {watch.length === 0 ? <p className="tdy-line">Chưa có em nào cần để ý. 👍</p> : (
          <ul className="tdy-kids">
            {watch.map((w) => (
              <li key={w.id}>
                <Link href={`${base}/hoc-sinh/${w.id}`} className="tdy-kid">
                  <span className={`tdy-kid-av is-${w.tone}`} aria-hidden="true">{initials(w.name)}</span>
                  <span><b>{w.name}</b><small>{w.text}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tdy-pulse-part">
        <h3>💬 Phụ huynh</h3>
        <ul className="tdy-pulse-facts">
          <li>
            <Link href={`${base}/tin-nhan`}>
              {unread ? <><b className="is-warn">{unread} tin chưa đọc</b>{pendingLeave ? ` · ${pendingLeave} xin phép nghỉ` : ''}</> : recentMsgs ? `Không có tin mới · ${recentMsgs} tin gần đây` : 'Chưa có tin nhắn'}
              <ChevronRight aria-hidden="true" />
            </Link>
          </li>
          {contactGaps !== null && (
            <li>
              <Link href={`${base}/danh-ba`}>
                {contactGaps ? <><b>{contactGaps}/{students}</b>&nbsp;em chưa có số điện thoại</> : 'Đủ số điện thoại cả lớp ✓'}
                <ChevronRight aria-hidden="true" />
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="tdy-pulse-part">
        <h3>📈 Luyện bài 7 ngày <small>{total ? `${total} lượt em` : 'chưa em nào luyện'}</small></h3>
        {total > 0 && <div className="tdy-bars" role="img" aria-label={`Số em luyện bài mỗi ngày (cũ → mới): ${spark.join(', ')}`}>
          {spark.map((n, i) => (
            <div key={i} className={`tdy-bar${i === 6 ? ' is-today' : ''}`} title={`${DOW[dowOf(i - 6)]}: ${n}/${students} em luyện bài`}>
              <span className="tdy-bar-n">{n || ''}</span>
              <i style={{ height: `${n ? 8 + (n / max) * 92 : 3}%` }} />
              <span className="tdy-bar-d">{i === 6 ? 'Nay' : DOW[dowOf(i - 6)]}</span>
            </div>
          ))}
        </div>}
      </div>

      <p className="tdy-pulse-foot">
        {planText && <span>{planText}</span>}
        <Link href={base}>Học sinh &amp; mã lớp <ChevronRight aria-hidden="true" /></Link>
      </p>
    </section>
  );
}
