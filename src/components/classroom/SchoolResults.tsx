'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award as AwardIcon, GraduationCap, Plus, Save, Trash2 } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { createClient } from '@/lib/supabase/client';
import { schoolYearOf } from '@/lib/classroom/comments';
import {
  AWARD_SCOPE_NAME, EXAM_NAME, SCORE_SUBJECT_NAME, examKey, examsFor, parseScore, showScore, subjectsFor,
  type Award, type AwardScope, type ExamCode,
} from '@/lib/classroom/school';

type Student = { id: string; name: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const notReady = (m: string) => /function|does not exist|schema cache/i.test(m);
const MIGRATION_HINT = 'Chưa bật tính năng: hãy chạy supabase/migrations/0014_school_results.sql trên Supabase.';

/** Quản lý kết quả học tập trên trường: điểm kiểm tra định kỳ + khen thưởng, thành tích. */
export default function SchoolResults({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
  const [tab, setTab] = useState<'scores' | 'awards'>('scores');
  return (
    <div className="school-results">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><GraduationCap aria-hidden="true" /> Kết quả học tập trên trường</h1>
          <p className="dash-muted">Thầy cô nhập điểm kiểm tra định kỳ và khen thưởng của từng em. Các số liệu này được dùng để gợi ý mức đạt và lời nhận xét cuối kỳ, cuối năm. Chỉ thầy cô dạy lớp xem được.</p>
        </div>
      </header>
      <div className="auth-tabs sr-tabs no-print" role="tablist" aria-label="Chọn mục">
        <button type="button" role="tab" aria-selected={tab === 'scores'} className="auth-tab" onClick={() => setTab('scores')}><GraduationCap aria-hidden="true" /> Điểm kiểm tra</button>
        <button type="button" role="tab" aria-selected={tab === 'awards'} className="auth-tab" onClick={() => setTab('awards')}><AwardIcon aria-hidden="true" /> Khen thưởng</button>
      </div>
      {tab === 'scores' ? <Scores classId={classId} className={className} grade={grade} students={students} /> : <Awards classId={classId} className={className} students={students} />}
    </div>
  );
}

// ------------------------------------------------------------------ Điểm kiểm tra định kỳ
function Scores({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
  const year = useMemo(() => schoolYearOf(), []);
  const exams = examsFor(grade);
  const [exam, setExam] = useState<ExamCode>(exams.includes('ck1') ? 'ck1' : exams[0]);
  const subjects = subjectsFor(grade, exam);
  const key = examKey(exam, year);
  const [cells, setCells] = useState<Record<string, string>>({}); // `${sid}:${subj}` -> chuỗi đang nhập
  const [orig, setOrig] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const { data, error } = await createClient().rpc('teacher_get_scores', { p_class: classId, p_period: key });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Không tải được điểm. Thử tải lại trang.' });
    const m: Record<string, string> = {};
    for (const r of (data ?? []) as { student_id: string; subject: string; score: number | null }[]) m[`${r.student_id}:${r.subject}`] = showScore(r.score);
    setCells(m);
    setOrig(m);
  }, [classId, key]);
  useEffect(() => { void load(); }, [load]);

  const changed = Object.keys({ ...cells, ...orig }).filter((k) => (cells[k] ?? '') !== (orig[k] ?? ''));
  const invalid = new Set(Object.entries(cells).filter(([, v]) => parseScore(v) === 'invalid').map(([k]) => k));

  const save = async () => {
    if (invalid.size) return setMsg({ kind: 'error', text: 'Có ô điểm không hợp lệ (chỉ nhận 0 đến 10, ví dụ 8 hoặc 8,5).' });
    if (!changed.length) return setMsg({ kind: 'info', text: 'Không có thay đổi để lưu.' });
    const rows = changed.map((k) => { const [student_id, subject] = k.split(':'); return { student_id, subject, score: parseScore(cells[k] ?? '') as number | null, note: '' }; });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_save_scores', { p_class: classId, p_period: key, p_rows: rows });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Chưa lưu được. Thử lại sau.' });
    setOrig({ ...cells });
    setMsg({ kind: 'ok', text: `Đã lưu ${rows.length} ô điểm ${EXAM_NAME[exam]} ${year}–${year + 1}.` });
  };

  const stats = subjects.map((subj) => {
    const vals = students.map((s) => parseScore(cells[`${s.id}:${subj}`] ?? '')).filter((v): v is number => typeof v === 'number');
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { subj, n: vals.length, avg, t: vals.filter((v) => v >= 9).length, h: vals.filter((v) => v >= 5 && v < 9).length, c: vals.filter((v) => v < 5).length };
  });

  const csvHeader = ['STT', 'Học sinh', ...subjects.map((s) => SCORE_SUBJECT_NAME[s])];
  const csvRows = students.map((s, i) => [i + 1, s.name, ...subjects.map((subj) => cells[`${s.id}:${subj}`] ?? '')]);

  return (
    <section className="dash-section sr-scores" aria-label="Điểm kiểm tra định kỳ">
      <div className="comments-toolbar no-print">
        <label className="adm-field comments-period">
          <span>Bài kiểm tra · năm học {year}–{year + 1}</span>
          <select value={exam} onChange={(e) => setExam(e.target.value as ExamCode)} disabled={busy || changed.length > 0} title={changed.length ? 'Lưu trước khi đổi kỳ' : undefined}>
            {exams.map((x) => <option key={x} value={x}>{EXAM_NAME[x]}</option>)}
          </select>
        </label>
        <div className="comments-actions">
          <CsvButton filename={`diem-${className.replace(/[^\p{L}\p{N}]+/gu, '-')}-${key}.csv`} header={csvHeader} rows={csvRows} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang xử lý…' : `Lưu${changed.length ? ` (${changed.length})` : ''}`}</button>
        </div>
        {msg && <p className={`adm-alert is-${msg.kind === 'ok' ? 'ok' : msg.kind === 'error' ? 'error' : 'info'}`} role="status">{msg.text}</p>}
        <p className="dash-muted">Nhập điểm thang 10 (ví dụ 9 hoặc 8,5). Để trống nếu em chưa kiểm tra hoặc trường không kiểm tra môn đó. Xoá số rồi lưu để xoá điểm.</p>
      </div>
      {students.length === 0 ? <p className="dash-muted">Lớp chưa có học sinh.</p> : (
        <div className="table-scroll">
          <table className="roster-table sr-table">
            <thead>
              <tr><th>STT</th><th>Học sinh</th>{subjects.map((s) => <th key={s}>{SCORE_SUBJECT_NAME[s]}</th>)}</tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="sr-name">{s.name}</td>
                  {subjects.map((subj) => {
                    const k = `${s.id}:${subj}`;
                    return (
                      <td key={subj}>
                        <input inputMode="decimal" className={`sr-input${invalid.has(k) ? ' is-invalid' : ''}${(cells[k] ?? '') !== (orig[k] ?? '') ? ' is-dirty' : ''}`}
                          aria-label={`Điểm ${SCORE_SUBJECT_NAME[subj]} của ${s.name}`} value={cells[k] ?? ''} maxLength={5}
                          onChange={(e) => setCells((c) => ({ ...c, [k]: e.target.value }))} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th colSpan={2}>Điểm trung bình lớp</th>{stats.map((x) => <td key={x.subj}>{x.avg == null ? '—' : x.avg.toFixed(2).replace('.', ',')}</td>)}</tr>
              <tr><th colSpan={2}>Số em ≥ 9 / 5–8,75 / &lt; 5</th>{stats.map((x) => <td key={x.subj}>{x.n ? `${x.t} / ${x.h} / ${x.c}` : '—'}</td>)}</tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Khen thưởng / thành tích
function Awards({ classId, className, students }: { classId: string; className: string; students: Student[] }) {
  const names = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const [list, setList] = useState<Award[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [form, setForm] = useState({ student: students[0]?.id ?? '', title: '', scope: 'lop' as AwardScope, date: new Date().toISOString().slice(0, 10), note: '' });

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_list_awards', { p_class: classId });
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Không tải được danh sách khen thưởng.' });
    setList((data ?? []) as Award[]);
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student || form.title.trim().length < 2) return setMsg({ kind: 'error', text: 'Chọn học sinh và nhập tên khen thưởng.' });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_add_award', { p_class: classId, p_student: form.student, p_title: form.title.trim(), p_scope: form.scope, p_date: form.date || null, p_note: form.note.trim() });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Chưa thêm được. Thử lại sau.' });
    setMsg({ kind: 'ok', text: `Đã ghi khen thưởng cho ${names.get(form.student) ?? 'em'}.` });
    setForm((f) => ({ ...f, title: '', note: '' }));
    void load();
  };

  const remove = async (a: Award) => {
    if (!window.confirm(`Xoá "${a.title}" của ${names.get(a.student_id) ?? 'em'}?`)) return;
    const { error } = await createClient().rpc('teacher_delete_award', { p_award: a.id });
    if (error) return setMsg({ kind: 'error', text: 'Chưa xoá được.' });
    void load();
  };

  const fmtDate = (d: string) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const csvRows = list.map((a, i) => [i + 1, names.get(a.student_id) ?? '', a.title, AWARD_SCOPE_NAME[a.scope], fmtDate(a.awarded_on), a.note]);

  return (
    <section className="dash-section sr-awards" aria-label="Khen thưởng và thành tích">
      <form className="sr-award-form no-print" onSubmit={add}>
        <label className="adm-field"><span>Học sinh</span>
          <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="adm-field sr-award-title"><span>Khen thưởng / thành tích</span>
          <input maxLength={200} placeholder="Ví dụ: Giải Nhì Trạng nguyên Tiếng Việt, Học sinh xuất sắc…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="adm-field"><span>Cấp</span>
          <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as AwardScope })}>
            {(Object.keys(AWARD_SCOPE_NAME) as AwardScope[]).map((k) => <option key={k} value={k}>{AWARD_SCOPE_NAME[k]}</option>)}
          </select>
        </label>
        <label className="adm-field"><span>Ngày</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="adm-field sr-award-note"><span>Ghi chú (không bắt buộc)</span>
          <input maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || students.length === 0}><Plus aria-hidden="true" /> Thêm</button>
      </form>
      {msg && <p className={`adm-alert is-${msg.kind === 'ok' ? 'ok' : msg.kind === 'error' ? 'error' : 'info'}`} role="status">{msg.text}</p>}
      <div className="dash-card-head">
        <h2>Danh sách ({list.length})</h2>
        <CsvButton filename={`khen-thuong-${className.replace(/[^\p{L}\p{N}]+/gu, '-')}.csv`} header={['STT', 'Học sinh', 'Khen thưởng / thành tích', 'Cấp', 'Ngày', 'Ghi chú']} rows={csvRows} />
      </div>
      {list.length === 0 ? <p className="dash-muted">Chưa có khen thưởng nào.</p> : (
        <div className="table-scroll">
          <table className="roster-table">
            <thead><tr><th>Ngày</th><th>Học sinh</th><th>Khen thưởng / thành tích</th><th>Cấp</th><th>Ghi chú</th><th className="no-print"><span className="sr-only">Xoá</span></th></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>{fmtDate(a.awarded_on)}</td>
                  <td>{names.get(a.student_id) ?? '—'}</td>
                  <td>{a.title}</td>
                  <td>{AWARD_SCOPE_NAME[a.scope]}</td>
                  <td>{a.note}</td>
                  <td className="no-print"><button type="button" className="mini-btn" onClick={() => void remove(a)} aria-label={`Xoá ${a.title}`}><Trash2 aria-hidden="true" /> Xoá</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
