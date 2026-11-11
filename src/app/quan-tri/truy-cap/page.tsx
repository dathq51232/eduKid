import { redirect } from 'next/navigation';
import { Clock3, Eye, MonitorSmartphone, Users } from 'lucide-react';
import { BarList, HeatGrid, TrafficColumns } from '@/components/admin/AdminCharts';
import { Kpi, PeriodChips, onlineTotal } from '@/components/admin/AdminDashboard';
import ExportCsv from '@/components/admin/ExportCsv';
import { getStaffContext } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';
import { pathLabel } from '@/lib/analytics/path';
import { ROLE_SERIES, SUBJECT_LABEL, delta, fillSeries, fmt, parsePeriod, roleValue, seriesLabel, type Insights } from '@/lib/admin/insights';

export const metadata = { title: 'Truy cập — Quản trị EduChain Kids' };
export const dynamic = 'force-dynamic';

const WORD = { 1: 'hôm nay', 7: '7 ngày', 30: '30 ngày', 365: '1 năm' } as const;

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const ctx = await getStaffContext();
  if (ctx.state !== 'ok') return null;
  if (!ctx.isAdmin) redirect('/quan-tri');
  const k = parsePeriod((await searchParams).k, 7);
  const { data, error } = await (await createClient()).rpc('admin_insights', { p_days: k });
  if (error || !data) {
    return (
      <div className="adm-stack">
        <h1>📈 Truy cập</h1>
        <p className="adm-setup">Chưa có số liệu: hãy chạy migration <code>supabase/migrations/0049_admin_insights.sql</code> trên Supabase rồi tải lại trang. Sau đó lượt truy cập được ghi tự động (ẩn danh, gộp theo giờ).</p>
      </div>
    );
  }
  const i = data as Insights;
  const dev = i.by_device;
  const devTotal = (dev.mobile ?? 0) + (dev.desktop ?? 0);
  const pct = (n: number | undefined) => (devTotal ? Math.round(((n ?? 0) / devTotal) * 100) : 0);
  const rows = fillSeries(i.series, k);
  const csv: (string | number)[][] = [
    [k === 1 ? 'Giờ' : 'Ngày', ...ROLE_SERIES.map((s) => s.label), 'Tổng'],
    ...rows.map((r) => [seriesLabel(r.k, k), ...ROLE_SERIES.map((s) => roleValue(r, s.key)), ROLE_SERIES.reduce((a, s) => a + roleValue(r, s.key), 0)]),
    [],
    ['Trang', 'Lượt xem'],
    ...i.top_paths.map((p) => [`${pathLabel(p.path)} (${p.path})`, p.v]),
  ];

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>📈 Truy cập</h1>
          <p>Lượt xem trang được đếm ẩn danh, gộp theo giờ (không lưu IP, tên hay đường dẫn có mã cá nhân).</p>
        </div>
        <PeriodChips k={k} base="/quan-tri/truy-cap" options={[1, 7, 30, 365]} />
      </div>

      <div className="adm-kpis">
        <Kpi icon={<Eye size={16} aria-hidden="true" />} label={`Lượt xem trang ${WORD[k]}`} value={fmt(i.views)} d={delta(i.views, i.views_prev)} note="so với kỳ trước" />
        <Kpi icon={<Users size={16} aria-hidden="true" />} label="Lượt khách (mỗi ngày tính một lần)" value={fmt(i.visitors)} d={delta(i.visitors, i.visitors_prev)} note="so với kỳ trước" />
        <Kpi icon={<Clock3 size={16} aria-hidden="true" />} label="Thời gian làm bài TB / học sinh" value={i.study_minutes === null ? '—' : `${fmt(i.study_minutes)} phút`} note={`${fmt(i.attempts)} lượt làm bài`} />
        <Kpi icon={<span className="adm-live" aria-hidden="true" />} label="Đang online" value={fmt(onlineTotal(i))} note="hoạt động trong 5 phút gần nhất" />
        <Kpi icon={<MonitorSmartphone size={16} aria-hidden="true" />} label="Thiết bị" value={`📱 ${pct(dev.mobile)}%`} note={`💻 máy tính ${pct(dev.desktop)}%`} />
      </div>

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Lượt xem theo {k === 1 ? 'giờ' : k === 365 ? 'tuần' : 'ngày'}</h2>
          <ExportCsv name={`truy-cap-${WORD[k].replace(/\s+/g, '-')}`} rows={csv} />
        </div>
        <TrafficColumns rows={i.series} days={k} height={240} />
      </section>

      <div className="adm-grid-half">
        <section className="adm-card">
          <h2>Giờ cao điểm (7 ngày gần nhất)</h2>
          <HeatGrid cells={i.heat} />
        </section>
        <section className="adm-card">
          <h2>Học sinh theo khối lớp</h2>
          <BarList items={[1, 2, 3, 4, 5].map((g) => ({ label: `Lớp ${g}`, v: i.by_grade[String(g)] ?? 0 }))} />
        </section>
      </div>

      <div className="adm-grid-half">
        <section className="adm-card">
          <h2>Trang được xem nhiều</h2>
          <BarList items={i.top_paths.map((p) => ({ label: pathLabel(p.path), v: p.v, note: p.path === '/' ? '' : p.path }))} />
        </section>
        <section className="adm-card">
          <h2>Môn học được làm bài nhiều</h2>
          <BarList unit="lượt làm bài" items={i.subjects.map((s) => ({ label: SUBJECT_LABEL[s.s] ?? s.s, v: s.n }))} />
        </section>
      </div>
    </div>
  );
}
