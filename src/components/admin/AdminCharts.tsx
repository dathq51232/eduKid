'use client';

// Biểu đồ của trang Quản trị (HTML/CSS thuần, không thư viện): cột chồng theo nhóm người xem, bản đồ nhiệt giờ cao điểm,
// thanh ngang xếp hạng. Màu theo thứ tự cố định (.adm-viz trong globals.css), luôn có chú giải + bảng số liệu, có tooltip khi rê chuột.

import { useState } from 'react';
import { ROLE_SERIES, fillSeries, fmt, roleValue, seriesLabel, type Period, type SeriesRow } from '@/lib/admin/insights';

export function TrafficColumns({ rows, days, height = 200 }: { rows: SeriesRow[]; days: Period; height?: number }) {
  const data = fillSeries(rows, days);
  const totals = data.map((r) => ROLE_SERIES.reduce((s, x) => s + roleValue(r, x.key), 0));
  const max = Math.max(1, ...totals);
  const [hover, setHover] = useState<number | null>(null);
  const step = data.length > 16 ? Math.ceil(data.length / 8) : 1; // thưa nhãn trục khi nhiều cột
  const nice = niceMax(max);
  return (
    <div className="adm-viz">
      <div className="viz-legend" aria-hidden="true">
        {ROLE_SERIES.map((s, i) => <span key={s.key}><i className={`viz-sw s${i + 1}`} />{s.label}</span>)}
      </div>
      <div className="viz-cols" style={{ height }} role="img" aria-label={`Lượt xem trang: tổng ${fmt(totals.reduce((a, b) => a + b, 0))}`}>
        <div className="viz-grid" aria-hidden="true"><span>{fmt(nice)}</span><span>{fmt(Math.round(nice / 2))}</span><span>0</span></div>
        {data.map((r, i) => (
          <div key={r.k} className={`viz-col${hover === i ? ' is-hover' : ''}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}>
            <div className="viz-stack" style={{ height: `${(totals[i] / nice) * 100}%` }}>
              {ROLE_SERIES.map((s, si) => {
                const v = roleValue(r, s.key);
                return v > 0 ? <span key={s.key} className={`viz-seg s${si + 1}`} style={{ flexGrow: v }} /> : null;
              })}
            </div>
            {i % step === 0 && <span className="viz-x">{seriesLabel(r.k, days)}</span>}
            {hover === i && (
              <div className={`viz-tip${i > data.length / 2 ? ' is-left' : ''}`} role="tooltip">
                <b>{seriesLabel(r.k, days)}{days === 365 ? ' (tuần)' : ''}</b>
                {ROLE_SERIES.map((s, si) => <span key={s.key}><i className={`viz-sw s${si + 1}`} />{s.label}: {fmt(roleValue(r, s.key))}</span>)}
                <span className="viz-tip-total">Tổng: {fmt(totals[i])}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <details className="viz-table">
        <summary>Xem dạng bảng</summary>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th scope="col">{days === 1 ? 'Giờ' : 'Ngày'}</th>{ROLE_SERIES.map((s) => <th key={s.key} scope="col">{s.label}</th>)}<th scope="col">Tổng</th></tr></thead>
            <tbody>{data.map((r, i) => <tr key={r.k}><th scope="row">{seriesLabel(r.k, days)}</th>{ROLE_SERIES.map((s) => <td key={s.key}>{fmt(roleValue(r, s.key))}</td>)}<td>{fmt(totals[i])}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
/** Giờ cao điểm 7 ngày: hàng = thứ, cột = giờ; một sắc độ xanh, đậm dần theo lượt xem */
export function HeatGrid({ cells }: { cells: { d: number; h: number; v: number }[] }) {
  const map = new Map(cells.map((c) => [`${c.d}-${c.h}`, c.v]));
  const max = Math.max(1, ...cells.map((c) => c.v));
  const [tip, setTip] = useState<string | null>(null);
  return (
    <div className="adm-viz">
      <div className="viz-heat" role="img" aria-label="Lượt xem theo thứ và giờ trong 7 ngày">
        <span />
        {Array.from({ length: 24 }, (_, h) => <span key={h} className="viz-heat-x">{h % 4 === 0 ? `${h}h` : ''}</span>)}
        {DOW.map((name, di) => (
          <div key={name} className="viz-heat-row">
            <span className="viz-heat-y">{name}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const v = map.get(`${di + 1}-${h}`) ?? 0;
              const lvl = v === 0 ? 0 : Math.min(5, 1 + Math.floor((v / max) * 4.999));
              const label = `${name} ${h}h–${h + 1}h: ${fmt(v)} lượt`;
              return <span key={h} className={`viz-cell l${lvl}`} title={label} onMouseEnter={() => setTip(label)} onMouseLeave={() => setTip(null)} />;
            })}
          </div>
        ))}
      </div>
      <div className="viz-heat-foot">
        <span className="adm-muted">{tip ?? 'Rê chuột lên ô để xem số lượt.'}</span>
        <span className="viz-ramp" aria-hidden="true">Ít {[1, 2, 3, 4, 5].map((l) => <i key={l} className={`viz-cell l${l}`} />)} Nhiều</span>
      </div>
    </div>
  );
}

/** Thanh ngang xếp hạng (một màu: độ dài mang ý nghĩa, nhãn và số luôn hiện) */
export function BarList({ items, unit = 'lượt' }: { items: { label: string; v: number; note?: string }[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.v));
  const total = items.reduce((s, i) => s + i.v, 0);
  if (!items.length) return <p className="adm-muted">Chưa có số liệu.</p>;
  return (
    <ul className="adm-viz viz-bars">
      {items.map((it) => (
        <li key={it.label} title={`${it.label}: ${fmt(it.v)} ${unit}`}>
          <span className="viz-bar-label">{it.label}{it.note && <small> {it.note}</small>}</span>
          <span className="viz-bar-track"><span className="viz-bar" style={{ width: `${(it.v / max) * 100}%` }} /></span>
          <span className="viz-bar-v">{fmt(it.v)}<small> · {total ? Math.round((it.v / total) * 100) : 0}%</small></span>
        </li>
      ))}
    </ul>
  );
}
