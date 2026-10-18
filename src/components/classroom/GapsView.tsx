import Link from 'next/link';
import { AlertTriangle, ArrowLeft, FileText, Radar, Send, Users } from 'lucide-react';
import { SUBJECT_NAME } from '@/lib/classroom/assignments';
import type { computeGaps } from '@/lib/classroom/gaps';
import { compareViName } from '@/lib/classroom/names';

export const GAP_PERIODS = [{ d: 7, label: '7 ngày' }, { d: 30, label: '30 ngày' }, { d: 120, label: 'Học kỳ (120 ngày)' }];
const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
const tone = (r: number | null) => (r === null ? '' : r < 0.6 ? ' is-low' : r < 0.8 ? ' is-mid' : ' is-good');
const fmtDate = (s: string | null) => { if (!s) return '—'; const d = new Date(s); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; };

/** Phần hiển thị trang "Lỗ hổng kiến thức" (dữ liệu đã tính ở máy chủ bằng computeGaps) */
export default function GapsView({ id, c, students, days, g, failed }: {
  id: string; c: { name: string; grade: number }; students: { id: string; name: string }[]; days: number;
  g: ReturnType<typeof computeGaps>; failed: boolean;
}) {
  const attention = [...g.students].sort((a, b) => (a.rate ?? -1) - (b.rate ?? -1) || compareViName(a.name, b.name));
  const idle = g.students.filter((s) => s.n === 0);
  return (
    <>
      <main className="dash wrap gaps-page">
        <Link href={`/giao-vien/lop/${id}`} className="dash-back no-print"><ArrowLeft aria-hidden="true" /> Lớp {c.name}</Link>
        <header className="dash-head">
          <div>
            <p className="dash-kicker">Lớp {c.name} · Khối {c.grade} · {students.length} học sinh</p>
            <h1><Radar aria-hidden="true" /> Lớp đang hổng chỗ nào?</h1>
            <p className="dash-muted">Tổng hợp từ từng câu các em đã làm trên app: dạng bài nhiều em sai nhất, em nào cần kèm thêm. Bấm “Giao bài ôn” để giao ngay cho đúng những em đó.</p>
          </div>
        </header>
        <nav className="gaps-periods no-print" aria-label="Khoảng thời gian">
          {GAP_PERIODS.map((p) => <Link key={p.d} href={`?d=${p.d}`} className={`mini-btn${p.d === days ? ' is-on' : ''}`} aria-current={p.d === days ? 'page' : undefined}>{p.label}</Link>)}
        </nav>
        {failed && <p className="adm-alert is-error">Không tải được kết quả học tập. Thử lại sau.</p>}

        <ul className="stat-row">
          <li className="stat-tile tone-blue"><span>Câu đã làm</span><strong>{g.answers}</strong></li>
          {g.subjects.map((s) => (
            <li key={s.subject} className="stat-tile tone-green"><span>{SUBJECT_NAME[s.subject]} · {s.students} em</span><strong>{pct(s.rate)} đúng</strong></li>
          ))}
          <li className="stat-tile tone-yellow"><span>Chưa luyện tập</span><strong>{idle.length} em</strong></li>
        </ul>

        <section className="dash-section" aria-label="Dạng bài lớp hay sai">
          <h2><AlertTriangle aria-hidden="true" /> Dạng bài lớp hay sai</h2>
          {g.gaps.length === 0 ? (
            <p className="dash-muted">{g.answers < 30 ? 'Chưa đủ dữ liệu: các em cần làm thêm bài trên app (giao bài về nhà để có số liệu).' : 'Chưa thấy dạng bài nào dưới 80% đúng — lớp đang làm tốt!'}</p>
          ) : (
            <ol className="gap-list">
              {g.gaps.map((x) => {
                const ids = x.weak.map((w) => w.id);
                return (
                  <li key={x.key} className={`gap-card${tone(x.rate)}`}>
                    <div className="gap-rate"><strong>{pct(x.rate)}</strong><span>đúng</span></div>
                    <div className="gap-body">
                      <h3>{x.formName}</h3>
                      <p className="gap-lesson">{SUBJECT_NAME[x.subject]} · {x.lessonTitle}</p>
                      {x.outcome && <p className="dash-muted">Yêu cầu cần đạt: {x.outcome}</p>}
                      <p className="dash-muted">{x.n} lượt trả lời · {x.studentCount} em đã làm</p>
                      {x.weak.length > 0 && (
                        <p className="gap-weak"><Users aria-hidden="true" /> Cần kèm ({x.weak.length}): {x.weak.slice(0, 10).map((w) => `${w.name} (${w.ok}/${w.n})`).join(', ')}{x.weak.length > 10 ? '…' : ''}</p>
                      )}
                      <div className="comments-actions no-print">
                        <Link className="btn btn-primary btn-sm" href={`/giao-vien/lop/${id}/giao-bai?lesson=${encodeURIComponent(x.lessonCode)}${ids.length ? `&hs=${ids.join(',')}` : ''}`}>
                          <Send aria-hidden="true" /> {ids.length ? `Giao bài ôn cho ${ids.length} em` : 'Giao bài ôn cả lớp'}
                        </Link>
                        <Link className="btn btn-outline btn-sm" href={`/giao-vien/lop/${id}/phieu-bai-tap?lesson=${encodeURIComponent(x.lessonCode)}`}><FileText aria-hidden="true" /> Phiếu bài tập in</Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="dash-section" aria-label="Từng học sinh">
          <h2><Users aria-hidden="true" /> Từng học sinh ({days} ngày)</h2>
          <p className="dash-muted">Xếp từ em chưa luyện tập, rồi tỉ lệ đúng thấp đến cao. Dưới 60% tô đỏ, 60–79% tô vàng.</p>
          <div className="table-scroll">
            <table className="roster-table">
              <thead><tr><th>Học sinh</th><th>Câu đã làm</th><th>Tỉ lệ đúng</th><th>Số bài</th><th>Gần nhất</th></tr></thead>
              <tbody>
                {attention.map((s) => (
                  <tr key={s.id} className={s.n === 0 ? 'is-missing' : ''}>
                    <th scope="row"><Link href={`/giao-vien/lop/${id}/hoc-sinh/${s.id}`}>{s.name}</Link></th>
                    <td>{s.n || 'Chưa làm'}</td>
                    <td><span className={`gap-pill${tone(s.rate)}`}>{pct(s.rate)}</span></td>
                    <td>{s.lessons || '—'}</td>
                    <td>{fmtDate(s.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
