import Link from 'next/link';
import { ArrowRight, CreditCard, Eye, FileClock, Radio, UserCheck, UserPlus, Wallet } from 'lucide-react';
import { BarList, TrafficColumns } from '@/components/admin/AdminCharts';
import { pathLabel } from '@/lib/analytics/path';
import { FEATURES } from '@/lib/features';
import { KIND_LABEL, PERIODS, ago, delta, fmt, money, type Insights, type Period } from '@/lib/admin/insights';

const PERIOD_WORD: Record<Period, string> = { 1: 'hôm nay', 7: '7 ngày', 30: '30 ngày', 365: '1 năm' };
const PREV_WORD: Record<Period, string> = { 1: 'hôm qua', 7: '7 ngày trước đó', 30: '30 ngày trước đó', 365: 'năm trước' };

export function PeriodChips({ k, base, options = [1, 7, 30] }: { k: Period; base: string; options?: Period[] }) {
  return (
    <nav className="adm-periods" aria-label="Khoảng thời gian">
      {PERIODS.filter((p) => options.includes(p.k)).map((p) => (
        <Link key={p.k} href={`${base}?k=${p.k}`} className="adm-chip" aria-pressed={p.k === k} aria-current={p.k === k ? 'page' : undefined}>{p.label}</Link>
      ))}
    </nav>
  );
}

export function Kpi({ icon, label, value, note, d }: { icon?: React.ReactNode; label: string; value: React.ReactNode; note?: React.ReactNode; d?: { text: string; up: boolean } | null }) {
  return (
    <div className="adm-kpi">
      <span className="adm-kpi-label">{icon}{label}</span>
      <strong className="adm-kpi-value">{value}</strong>
      <span className="adm-kpi-note">
        {d && <span className={d.up ? 'is-up' : 'is-down'}>{d.text}</span>} {note}
      </span>
    </div>
  );
}

export const onlineTotal = (i: Insights) => Object.values(i.online).reduce((s, n) => s + (n ?? 0), 0);

/** Trang Tổng quan cho quản trị hệ thống: số liệu người dùng & truy cập, việc cần xử lý, người dùng mới */
export default function AdminDashboard({ i, k, name }: { i: Insights; k: Period; name: string }) {
  const on = i.online;
  const hour = new Date(Date.now() + 7 * 3600_000).getUTCHours();
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const tasks = [
    { n: i.tasks.teachers_pending, label: 'giáo viên chờ duyệt', href: '/quan-tri/duyet-giao-vien', icon: <UserCheck size={20} aria-hidden="true" />, cta: 'Duyệt' },
    { n: i.tasks.lessons_review, label: 'bài chờ duyệt', href: '/quan-tri/bai-hoc', icon: <FileClock size={20} aria-hidden="true" />, cta: 'Xem' },
    ...(FEATURES.billing ? [{ n: i.tasks.payments_pending, label: 'thanh toán chờ xác nhận', href: '/quan-tri/thu-phi', icon: <CreditCard size={20} aria-hidden="true" />, cta: 'Xem' }] : []),
  ];
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{hello}, {name} 👋</h1>
          <p>Người dùng và lượt truy cập {PERIOD_WORD[k]}; việc đang chờ bạn xử lý.</p>
        </div>
        <PeriodChips k={k} base="/quan-tri" />
      </div>

      <div className="adm-kpis">
        <Kpi icon={<span className="adm-live" aria-hidden="true" />} label="Đang online" value={fmt(onlineTotal(i))}
          note={`HS ${fmt(on.student)} · GV ${fmt((on.teacher ?? 0) + (on.admin ?? 0))} · PH ${fmt(on.parent)} · khách ${fmt(on.guest)}`} />
        <Kpi icon={<Eye size={16} aria-hidden="true" />} label={`Lượt xem trang ${PERIOD_WORD[k]}`} value={fmt(i.views)} d={delta(i.views, i.views_prev)} note={`so với ${PREV_WORD[k]}`} />
        <Kpi icon={<UserPlus size={16} aria-hidden="true" />} label={`Người dùng mới ${PERIOD_WORD[k]}`} value={fmt(i.new_users)} d={delta(i.new_users, i.new_users_prev)} note={`${PREV_WORD[k]}: ${fmt(i.new_users_prev)}`} />
        <Kpi icon={<Radio size={16} aria-hidden="true" />} label={`Lượt làm bài ${PERIOD_WORD[k]}`} value={fmt(i.attempts)} note={i.accuracy === null ? 'Chưa có bài làm' : `Tỉ lệ đúng ${i.accuracy}%`} />
        {FEATURES.billing && <Kpi icon={<Wallet size={16} aria-hidden="true" />} label="Doanh thu tháng này" value={money(i.revenue_month)} note={`${fmt(i.paid_month)} gói đã xác nhận`} />}
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>Lượt truy cập {PERIOD_WORD[k]}</h2>
            <Link href={`/quan-tri/truy-cap?k=${k}`} className="adm-link">Chi tiết <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <TrafficColumns rows={i.series} days={k} />
        </section>
        <section className="adm-card">
          <h2>⚡ Việc cần xử lý</h2>
          <ul className="adm-tasks">
            {tasks.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className={`adm-task${t.n ? '' : ' is-zero'}`}>
                  {t.icon}<b>{fmt(t.n)}</b><span>{t.label}</span>
                  <span className="adm-link">{t.cta} <ArrowRight size={14} aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head">
            <h2>🆕 Người dùng mới</h2>
            <Link href="/quan-tri/nguoi-dung?moi=7" className="adm-link">Xem tất cả <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          {i.recent_users.length === 0 ? <p className="adm-muted">Chưa có người dùng nào.</p> : (
            <ul className="adm-people">
              {i.recent_users.map((u, idx) => (
                <li key={`${u.name}-${u.at}-${idx}`}>
                  <span className="adm-avatar" aria-hidden="true">{u.name.trim().split(/\s+/).pop()?.[0]?.toUpperCase() ?? '?'}</span>
                  <span className="adm-people-main">
                    <b>{u.name}</b>
                    <span className="adm-muted">{KIND_LABEL[u.kind]}{u.grade ? ` · lớp ${u.grade}` : ''}{u.by ? ` · do ${u.by} tạo` : ''}</span>
                  </span>
                  {u.pending && <span className="adm-pill is-wait">⏳ chờ duyệt</span>}
                  <span className="adm-muted">{ago(u.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="adm-card">
          <h2>🔥 Trang được xem nhiều</h2>
          <BarList items={i.top_paths.slice(0, 5).map((p) => ({ label: pathLabel(p.path), v: p.v, note: p.path === '/' ? '' : p.path }))} />
        </section>
      </div>
    </>
  );
}
