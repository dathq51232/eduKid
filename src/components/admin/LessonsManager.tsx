'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { errorText } from '@/lib/admin/questions';
import { BOOK_SERIES, STATUS_LABEL, type AdminLesson, type LessonStatus } from '@/lib/admin/types';
import { useAdminUser } from './AdminContext';
import StatusBadge from './StatusBadge';

const SUBJECTS = [
  { code: 'toan', name: 'Toán' },
  { code: 'tieng-viet', name: 'Tiếng Việt' },
  { code: 'tieng-anh', name: 'Tiếng Anh' },
];
const SELECT = 'id,title,status,book_series,semester,sort_order,created_by,updated_at,published_at,topic_id,subjects!inner(code,name,grade),curriculum_topics(code,title),questions(count)';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function LessonsManager() {
  const router = useRouter();
  const params = useSearchParams();
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);

  const mon = params.get('mon') ?? '';
  const lop = params.get('lop') ?? '';
  const tt = (params.get('tt') ?? '') as LessonStatus | '';
  const q = params.get('q') ?? '';
  const [showCreate, setShowCreate] = useState(params.get('tao') === '1');

  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(q);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('tao');
    router.replace(`/quan-tri/bai-hoc?${next.toString()}`, { scroll: false });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    let query = supabase.from('lessons').select(SELECT).order('updated_at', { ascending: false }).limit(300);
    if (tt) query = query.eq('status', tt);
    else query = query.neq('status', 'archived');
    if (mon && lop) query = query.eq('subjects.code', `${mon}-${lop}`);
    else if (mon) query = query.like('subjects.code', `${mon}-%`);
    else if (lop) query = query.eq('subjects.grade', Number(lop));
    if (q) query = query.ilike('title', `%${q}%`);
    const { data, error: err } = await query;
    if (err) setError(errorText(err));
    setLessons((data ?? []) as unknown as AdminLesson[]);
    setLoading(false);
  }, [supabase, tt, mon, lop, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Bài học</h1>
          <p>{me.isAdmin ? 'Tất cả bài học trên hệ thống.' : 'Bài của bạn và các bài đã xuất bản.'}</p>
        </div>
        <button type="button" className="adm-btn is-primary" onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate}>
          {showCreate ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />} {showCreate ? 'Đóng' : 'Tạo bài mới'}
        </button>
      </div>

      {showCreate && <CreateLesson defaultSubject={mon} defaultGrade={lop} onCreated={(id) => router.push(`/quan-tri/bai-hoc/${id}`)} />}

      <section className="adm-card">
        <div className="adm-filters">
          <label className="adm-field is-inline">
            <span>Môn</span>
            <select value={mon} onChange={(e) => setFilter('mon', e.target.value)}>
              <option value="">Tất cả</option>
              {SUBJECTS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </label>
          <label className="adm-field is-inline">
            <span>Lớp</span>
            <select value={lop} onChange={(e) => setFilter('lop', e.target.value)}>
              <option value="">Tất cả</option>
              {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          </label>
          <label className="adm-field is-inline">
            <span>Trạng thái</span>
            <select value={tt} onChange={(e) => setFilter('tt', e.target.value)}>
              <option value="">Đang dùng (trừ lưu trữ)</option>
              {(Object.keys(STATUS_LABEL) as LessonStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <form
            className="adm-search"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter('q', search.trim());
            }}
          >
            <input type="search" placeholder="Tìm theo tên bài" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm theo tên bài" />
            <button type="submit" className="adm-btn" aria-label="Tìm"><Search size={18} aria-hidden="true" /></button>
          </form>
        </div>

        {error && <p className="adm-alert is-error">{error}</p>}

        {loading ? (
          <p className="adm-muted">Đang tải...</p>
        ) : lessons.length === 0 ? (
          <p className="adm-muted">Không có bài nào khớp bộ lọc.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th scope="col">Tên bài</th>
                  <th scope="col">Môn · Lớp</th>
                  <th scope="col">Số câu</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href={`/quan-tri/bai-hoc/${l.id}`} className="adm-row-title">{l.title}</Link>
                      <div className="adm-muted">
                        {[l.curriculum_topics?.title ?? 'Chưa gắn chủ đề', l.book_series, l.semester ? `HK${l.semester}` : ''].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td>{l.subjects ? `${l.subjects.name} ${l.subjects.grade}` : '—'}</td>
                    <td>{l.questions?.[0]?.count ?? 0}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td className="adm-muted">{formatDate(l.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CreateLesson({ defaultSubject, defaultGrade, onCreated }: { defaultSubject: string; defaultGrade: string; onCreated: (id: string) => void }) {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [subject, setSubject] = useState(defaultSubject || 'toan');
  const [grade, setGrade] = useState(defaultGrade || '1');
  const [title, setTitle] = useState('');
  const [book, setBook] = useState(BOOK_SERIES[0]);
  const [semester, setSemester] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Chưa nhập tên bài.');
    setBusy(true);
    setError('');
    const { data: subj, error: e1 } = await supabase.from('subjects').select('id').eq('code', `${subject}-${grade}`).maybeSingle();
    if (e1 || !subj) {
      setBusy(false);
      return setError(e1 ? errorText(e1) : 'Không tìm thấy môn học. Đã chạy migration 0002 chưa?');
    }
    const { data, error: e2 } = await supabase
      .from('lessons')
      .insert({ subject_id: subj.id, title: title.trim(), book_series: book || null, semester: semester ? Number(semester) : null, created_by: me.userId })
      .select('id')
      .single();
    setBusy(false);
    if (e2 || !data) return setError(errorText(e2));
    onCreated(data.id);
  };

  return (
    <form className="adm-card adm-create" onSubmit={submit}>
      <h2>Tạo bài mới</h2>
      <div className="adm-grid">
        <label className="adm-field">
          <span>Môn</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span>Lớp</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
          </select>
        </label>
        <label className="adm-field">
          <span>Bộ sách</span>
          <select value={book} onChange={(e) => setBook(e.target.value)}>
            {BOOK_SERIES.map((b) => <option key={b} value={b}>{b}</option>)}
            <option value="">Không theo bộ sách</option>
          </select>
        </label>
        <label className="adm-field">
          <span>Học kỳ</span>
          <select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
            <option value="">Không ghi</option>
          </select>
        </label>
        <label className="adm-field is-wide">
          <span>Tên bài</span>
          <input value={title} maxLength={180} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Phép cộng trong phạm vi 10" />
        </label>
      </div>
      {error && <p className="adm-alert is-error">{error}</p>}
      <div className="adm-actions">
        <button type="submit" className="adm-btn is-primary" disabled={busy}>{busy ? 'Đang tạo...' : 'Tạo và soạn câu hỏi'}</button>
      </div>
    </form>
  );
}
