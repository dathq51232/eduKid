import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { parsePeriod, type Insights } from '@/lib/admin/insights';
import { getStaffContext } from '@/lib/auth/staff';
import { createClient } from '@/lib/supabase/server';
import type { AdminLesson, LessonStatus } from '@/lib/admin/types';
import '@/styles/adm.css';

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

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
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

  const k = parsePeriod((await searchParams).k, 1);
  const [{ data: ov, error }, { data: reviewData }, { data: ins, error: insErr }, kn] = await Promise.all([
    supabase.rpc('admin_overview'),
    supabase.from('lessons').select(lessonSelect).eq('status', 'review').order('updated_at', { ascending: true }).limit(10),
    supabase.rpc('admin_insights', { p_days: k }),
    // cấp bài + đã có "Kiến thức cần nhớ" chưa (migration 0070; chưa chạy thì báo lỗi → thẻ hiện hướng dẫn)
    supabase.from('lessons').select('id,title,level,status,subjects(code,name,grade),lesson_knowledge(lesson_id)').neq('status', 'archived').range(0, 4999),
  ]);
  const insights = !insErr && ins ? (ins as Insights) : null;
  if (error || !ov) return <p className="adm-alert is-error">Không tải được số liệu: {error?.message}</p>;
  const o = ov as Overview;
  const review = (reviewData ?? []) as unknown as AdminLesson[];
  const cell = (prefix: string, grade: number) => o.coverage.find((c) => c.code === `${prefix}-${grade}`);

  return (
    <div className="adm-stack">
      {insights ? <AdminDashboard i={insights} k={k} name={ctx.displayName} /> : (
        <p className="adm-setup">Chưa có số liệu người dùng &amp; truy cập: hãy chạy migration <code>supabase/migrations/0049_admin_insights.sql</code> trên Supabase (SQL Editor) rồi tải lại trang.</p>
      )}
      <div className="adm-head">
        <div>
          <h2>Nội dung &amp; việc học</h2>
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

      <KnowledgeCard rows={kn.error ? null : (kn.data ?? []) as unknown as KnRow[]} />

      <LessonTable title="Bài đang chờ duyệt" lessons={review} empty="Không có bài nào chờ duyệt." />
    </div>
  );
}

// ---------- Cập nhật kiến thức: độ phủ Cơ bản / Nâng cao + bài thiếu "Kiến thức cần nhớ" (migration 0070) ----------
type KnRow = {
  id: string; title: string; level: 'co_ban' | 'nang_cao'; status: LessonStatus;
  subjects: { code: string; name: string; grade: number } | null;
  lesson_knowledge: { lesson_id: string } | { lesson_id: string }[] | null;
};
const hasKn = (r: KnRow) => (Array.isArray(r.lesson_knowledge) ? r.lesson_knowledge.length > 0 : Boolean(r.lesson_knowledge));

function KnowledgeCard({ rows }: { rows: KnRow[] | null }) {
  if (!rows) {
    return (
      <section className="adm-card">
        <div className="adm-card-head"><h2>Cập nhật kiến thức</h2></div>
        <p className="adm-setup">Chưa bật quy tắc kiến thức cơ bản / nâng cao: chạy migration <code>0070_lesson_knowledge.sql</code> và <code>0071_lesson_level_grant.sql</code> trên Supabase rồi tải lại trang.</p>
      </section>
    );
  }
  const cellOf = (prefix: string, grade: number, level: KnRow['level']) => {
    const list = rows.filter((r) => r.level === level && r.subjects?.code === `${prefix}-${grade}`);
    return { total: list.length, published: list.filter((r) => r.status === 'published').length, noKn: list.filter((r) => !hasKn(r)).length };
  };
  // bài đã xuất bản / chờ duyệt mà chưa có kiến thức: cần bổ sung trước
  const missing = rows.filter((r) => !hasKn(r) && (r.status === 'published' || r.status === 'review'));
  const nc = rows.filter((r) => r.level === 'nang_cao');
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>Cập nhật kiến thức</h2>
        <span className="adm-muted">Cơ bản (CB) · Nâng cao (NC): bài đã xuất bản / tổng số · <span className="adm-kn-miss">⚠ thiếu kiến thức cần nhớ</span></span>
      </div>
      <div className="adm-stats">
        <Stat label="Bài cơ bản" value={rows.length - nc.length} note={`${rows.filter((r) => r.level === 'co_ban' && r.status === 'published').length} đã xuất bản`} />
        <Stat label="Bài nâng cao" value={nc.length} note={`${nc.filter((r) => r.status === 'published').length} đã xuất bản`} />
        <Stat label="Thiếu kiến thức cần nhớ" value={rows.filter((r) => !hasKn(r)).length} note={`${missing.length} bài đang xuất bản / chờ duyệt`} />
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table adm-coverage adm-kn-cov">
          <thead>
            <tr><th scope="col">Môn</th>{[1, 2, 3, 4, 5].map((g) => <th key={g} scope="col">Lớp {g}</th>)}</tr>
          </thead>
          <tbody>
            {SUBJECTS.map((s) => (
              <tr key={s.prefix}>
                <th scope="row"><span className={`adm-dot ${s.tone}`} aria-hidden="true" /> {s.name}</th>
                {[1, 2, 3, 4, 5].map((g) => {
                  const cb = cellOf(s.prefix, g, 'co_ban'), ncv = cellOf(s.prefix, g, 'nang_cao');
                  return (
                    <td key={g}>
                      <Link href={`/quan-tri/bai-hoc?mon=${s.prefix}&lop=${g}`}>
                        <span className={cb.total ? '' : 'is-none'}>CB {cb.total ? `${cb.published}/${cb.total}` : '—'}</span>
                        <span className={ncv.total ? 'is-nc' : 'is-none'}>NC {ncv.total ? `${ncv.published}/${ncv.total}` : '—'}</span>
                        {cb.noKn + ncv.noKn > 0 && <span className="adm-kn-miss">⚠ {cb.noKn + ncv.noKn}</span>}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {missing.length > 0 && (
        <>
          <p className="adm-muted">Bổ sung “Kiến thức cần nhớ” cho các bài này trước (bài đang xuất bản / chờ duyệt):</p>
          <ul className="adm-rows">
            {missing.slice(0, 8).map((l) => (
              <li key={l.id}>
                <Link href={`/quan-tri/bai-hoc/${l.id}`} className="adm-row-link">
                  <span className="adm-row-title">{l.title}</span>
                  <span className="adm-muted">{l.subjects ? `${l.subjects.name} lớp ${l.subjects.grade}` : ''} · {l.level === 'nang_cao' ? 'Nâng cao' : 'Cơ bản'}</span>
                  <StatusBadge status={l.status} />
                </Link>
              </li>
            ))}
          </ul>
          {missing.length > 8 && <p className="adm-muted">… và {missing.length - 8} bài khác.</p>}
        </>
      )}
    </section>
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
