import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import { getStaffContext } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';
import type { AdminLesson, LessonStatus } from '@/lib/admin/types';

type Overview = {
  lessons: Partial<Record<LessonStatus, number>>;
  questions_published: number;
  students: number;
  classes: number;
  schools: number;
  attempts_7d: number;
  attempts_done: number;
  accuracy_7d: number | null;
  outcomes_total: number;
  outcomes_covered: number;
  coverage: { code: string; name: string; grade: number; published: number; total: number }[];
};

const SUBJECTS = [
  { prefix: 'toan', name: 'Toán', tone: 'math' },
  { prefix: 'tieng-viet', name: 'Tiếng Việt', tone: 'viet' },
  { prefix: 'tieng-anh', name: 'Tiếng Anh', tone: 'english' },
];

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="adm-stat">
      <span className="adm-stat-label">{label}</span>
      <strong className="adm-stat-value">{value}</strong>
      {note && <span className="adm-stat-note">{note}</span>}
    </div>
  );
}

export default async function AdminHome() {
  const ctx = await getStaffContext();
  if (ctx.state !== 'ok') return null;
  const supabase = await createClient();

  const lessonSelect = 'id,title,status,book_series,semester,sort_order,created_by,updated_at,published_at,subjects(code,name,grade),questions(count)';

  if (!ctx.isAdmin) {
    const { data } = await supabase.from('lessons').select(lessonSelect).eq('created_by', ctx.userId).order('updated_at', { ascending: false }).limit(8);
    const mine = (data ?? []) as unknown as AdminLesson[];
    const count = (s: LessonStatus) => mine.filter((l) => l.status === s).length;
    return (
      <div className="adm-stack">
        <div className="adm-head">
          <div>
            <h1>Chào {ctx.displayName}</h1>
            <p>Soạn bài, gửi duyệt và theo dõi trạng thái bài của bạn.</p>
          </div>
          <Link href="/quan-tri/bai-hoc?tao=1" className="adm-btn is-primary"><Plus size={18} aria-hidden="true" /> Tạo bài mới</Link>
        </div>
        <div className="adm-stats">
          <Stat label="Nháp" value={count('draft')} />
          <Stat label="Chờ duyệt" value={count('review')} />
          <Stat label="Đã xuất bản" value={count('published')} />
        </div>
        <LessonTable title="Bài gần đây của bạn" lessons={mine} />
      </div>
    );
  }

  const [{ data: ov, error }, { data: reviewData }] = await Promise.all([
    supabase.rpc('admin_overview'),
    supabase.from('lessons').select(lessonSelect).eq('status', 'review').order('updated_at', { ascending: true }).limit(10),
  ]);
  if (error || !ov) return <p className="adm-alert is-error">Không tải được số liệu: {error?.message}</p>;
  const o = ov as Overview;
  const review = (reviewData ?? []) as unknown as AdminLesson[];
  const cell = (prefix: string, grade: number) => o.coverage.find((c) => c.code === `${prefix}-${grade}`);

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Tổng quan</h1>
          <p>Tình hình nội dung và việc học trên toàn hệ thống.</p>
        </div>
        <Link href="/quan-tri/bai-hoc?tao=1" className="adm-btn is-primary"><Plus size={18} aria-hidden="true" /> Tạo bài mới</Link>
      </div>

      <div className="adm-stats">
        <Stat label="Bài đã xuất bản" value={o.lessons.published ?? 0} note={`${o.questions_published} câu hỏi`} />
        <Stat label="Chờ duyệt" value={o.lessons.review ?? 0} note={`${o.lessons.draft ?? 0} bài nháp`} />
        <Stat label="Lượt làm bài 7 ngày" value={o.attempts_7d} note={o.accuracy_7d === null ? 'Chưa có câu trả lời' : `Tỉ lệ đúng ${o.accuracy_7d}%`} />
        <Stat label="YCCĐ đã có câu hỏi" value={`${o.outcomes_covered}/${o.outcomes_total}`} note="Xem chi tiết ở trang Chương trình" />
        <Stat label="Học sinh" value={o.students} note={`${o.classes} lớp · ${o.schools} trường`} />
      </div>

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Độ phủ nội dung</h2>
          <span className="adm-muted">Số bài đã xuất bản / tổng số bài (không tính lưu trữ)</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table adm-coverage">
            <thead>
              <tr>
                <th scope="col">Môn</th>
                {[1, 2, 3, 4, 5].map((g) => <th key={g} scope="col">Lớp {g}</th>)}
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((s) => (
                <tr key={s.prefix}>
                  <th scope="row"><span className={`adm-dot ${s.tone}`} aria-hidden="true" /> {s.name}</th>
                  {[1, 2, 3, 4, 5].map((g) => {
                    const c = cell(s.prefix, g);
                    const empty = !c || c.total === 0;
                    return (
                      <td key={g} className={empty ? 'is-empty' : c.published === 0 ? 'is-thin' : ''}>
                        <Link href={`/quan-tri/bai-hoc?mon=${s.prefix}&lop=${g}`}>
                          {empty ? '—' : `${c.published} / ${c.total}`}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <LessonTable title="Bài đang chờ duyệt" lessons={review} empty="Không có bài nào chờ duyệt." />
    </div>
  );
}

function LessonTable({ title, lessons, empty = 'Chưa có bài nào.' }: { title: string; lessons: AdminLesson[]; empty?: string }) {
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>{title}</h2>
        <Link href="/quan-tri/bai-hoc" className="adm-link">Tất cả bài học <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
      {lessons.length === 0 ? (
        <p className="adm-muted">{empty}</p>
      ) : (
        <ul className="adm-rows">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link href={`/quan-tri/bai-hoc/${l.id}`} className="adm-row-link">
                <span className="adm-row-title">{l.title}</span>
                <span className="adm-muted">{l.subjects ? `${l.subjects.name} lớp ${l.subjects.grade}` : ''} · {l.questions?.[0]?.count ?? 0} câu</span>
                <StatusBadge status={l.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
