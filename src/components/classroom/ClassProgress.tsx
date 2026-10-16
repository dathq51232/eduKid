import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { fmtDateTime, lessonsOfClass, percent, subjectLabel, type LessonResult } from '@/lib/classroom/progress';

// Tiến độ theo bài của cả lớp (máy chủ dựng sẵn; dữ liệu đã được RLS giới hạn trong lớp của giáo viên).
export default function ClassProgress({ classId, className, results, names }: { classId: string; className: string; results: LessonResult[]; names: Map<string, string> }) {
  const rows = lessonsOfClass(results);
  const total = names.size;
  const csvRows = results.map((r) => [
    names.get(r.student_id) ?? '',
    r.lesson_title ?? r.lesson_code,
    subjectLabel(r.subject_code),
    r.score,
    r.total,
    percent(r.score, r.total),
    r.points,
    r.duration_ms ? Math.round(r.duration_ms / 1000) : null,
    fmtDateTime(r.created_at),
  ]);

  return (
    <section className="dash-section class-progress no-print" aria-labelledby="class-progress-title">
      <div className="dash-card-head">
        <h2 id="class-progress-title"><BarChart3 aria-hidden="true" /> Tiến độ theo bài</h2>
        <CsvButton
          filename={`ket-qua-lop-${className.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`}
          header={['Học sinh', 'Bài', 'Môn', 'Số câu đúng', 'Tổng số câu', '% đúng', 'Điểm', 'Thời gian (giây)', 'Lúc làm']}
          rows={csvRows}
        />
      </div>
      {rows.length === 0 ? (
        <p className="dash-muted">Chưa có bạn nào làm bài. Khi các em làm bài, kết quả sẽ hiện ở đây.</p>
      ) : (
        <div className="table-scroll">
          <table className="roster-table progress-table">
            <thead>
              <tr><th>Bài</th><th>Môn</th><th>Đã làm</th><th>Đúng TB</th><th>Cần hỗ trợ</th><th>Gần nhất</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.lesson_code}>
                  <th scope="row">{r.title}</th>
                  <td>{subjectLabel(r.subject)}</td>
                  <td>
                    <span className="progress-count">{r.students}/{total} bạn</span>
                    <span className="mini-bar" aria-hidden="true"><span style={{ width: `${total ? Math.round((r.students * 100) / total) : 0}%` }} /></span>
                  </td>
                  <td><span className={`score-chip ${r.avgBestPercent >= 80 ? 'is-good' : r.avgBestPercent >= 50 ? 'is-mid' : 'is-low'}`}>{r.avgBestPercent}%</span></td>
                  <td>
                    {r.lowStudents.length === 0 ? '—' : r.lowStudents.map((id, i) => (
                      <span key={id}>{i > 0 && ', '}<Link href={`/giao-vien/lop/${classId}/hoc-sinh/${id}`}>{names.get(id) ?? 'Học sinh'}</Link></span>
                    ))}
                  </td>
                  <td>{fmtDateTime(r.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="dash-muted">“Đúng TB” tính theo lần làm tốt nhất của mỗi bạn. “Cần hỗ trợ”: các bạn có lần tốt nhất dưới 50%.</p>
    </section>
  );
}
