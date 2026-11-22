import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import ClassResultsCsv from '@/components/classroom/ClassResultsCsv';
import { fmtDateTime, subjectLabel, type ClassLessonRow } from '@/lib/classroom/progress';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/score.css';

// Tiến độ theo bài của cả lớp. rows do database tổng hợp sẵn (teacher_class_lesson_stats, migration 0078);
// CSV chi tiết chỉ tải khi cô bấm nút.
export default function ClassProgress({ classId, className, rows, names }: { classId: string; className: string; rows: ClassLessonRow[]; names: Map<string, string> }) {
  const total = names.size;

  return (
    <section className="dash-section class-progress no-print" aria-labelledby="class-progress-title">
      <div className="dash-card-head">
        <h2 id="class-progress-title"><BarChart3 aria-hidden="true" /> Tiến độ theo bài</h2>
        <ClassResultsCsv
          filename={`ket-qua-lop-${className.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`}
          students={[...names].map(([id, name]) => ({ id, name }))}
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
