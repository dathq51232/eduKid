'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award as AwardIcon, BookOpenCheck, GraduationCap, HeartHandshake, Plus, Save, Trash2, Wand2 } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { createClient } from '@/lib/supabase/client';
import { schoolYearOf } from '@/lib/classroom/comments';
import {
  AWARD_SCOPE_NAME, EXAMS, EXAM_NAME, MAX_STUDENTS, QUALITY_GROUP_NAME, QUALITY_LEVEL_NAME, SCHOOL_SUBJECT_NAME, SUBJECT_LEVEL_NAME, SUBJECT_SHORT,
  examKey, isScored, levelFromScore, parseScore, qualitiesFor, schoolSubjects, showScore,
  type Award, type AwardScope, type ExamCode, type QualityItem, type QualityLevel, type SchoolSubject, type SubjectLevel,
} from '@/lib/classroom/school';

type Student = { id: string; name: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const notReady = (m: string) => /function|does not exist|schema cache|check constraint|column/i.test(m);
const MIGRATION_HINT = 'Chưa bật đủ tính năng: hãy chạy supabase/migrations/0014_school_results.sql và 0016_class_rules_full_subjects.sql trên Supabase.';
const alertCls = (m: NonNullable<Msg>) => `adm-alert is-${m.kind === 'ok' ? 'ok' : m.kind === 'error' ? 'error' : 'info'}`;

/** Kỳ mặc định theo tháng hiện tại */
function currentExam(): ExamCode {
  const m = new Date().getMonth() + 1;
  return m >= 8 && m <= 10 ? 'gk1' : m === 11 || m === 12 || m === 1 ? 'ck1' : m >= 2 && m <= 3 ? 'gk2' : 'ck2';
}

/** Sổ theo dõi kết quả học tập trên trường: mức đạt + điểm các môn, phẩm chất – năng lực, khen thưởng. */
export default function SchoolResults({ classId, className, grade, students }: { classId: string; className: string; grade: number; students: Student[] }) {
  const [tab, setTab] = useState<'subjects' | 'qualities' | 'awards'>('subjects');
  const year = useMemo(() => schoolYearOf(), []);
  const [exam, setExam] = useState<ExamCode>(currentExam());
  const [locked, setLocked] = useState(false); // đang có thay đổi chưa lưu -> khoá đổi kỳ
  return (
    <div className="school-results">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade} · {students.length}/{MAX_STUDENTS} học sinh</p>
          <h1><GraduationCap aria-hidden="true" /> Kết quả học tập trên trường</h1>
          <p className="dash-muted">Sổ theo dõi theo kỳ: mức đạt và điểm kiểm tra của <strong>tất cả các môn</strong>, phẩm chất – năng lực, khen thưởng. Đây là số liệu để hệ thống tự viết nhận xét cho từng em. Chỉ thầy cô dạy lớp xem được.</p>
        </div>
      </header>
      <div className="sr-top no-print">
        <div className="auth-tabs sr-tabs" role="tablist" aria-label="Chọn mục">
          <button type="button" role="tab" aria-selected={tab === 'subjects'} className="auth-tab" onClick={() => setTab('subjects')}><BookOpenCheck aria-hidden="true" /> Môn học</button>
          <button type="button" role="tab" aria-selected={tab === 'qualities'} className="auth-tab" onClick={() => setTab('qualities')}><HeartHandshake aria-hidden="true" /> Phẩm chất – Năng lực</button>
          <button type="button" role="tab" aria-selected={tab === 'awards'} className="auth-tab" onClick={() => setTab('awards')}><AwardIcon aria-hidden="true" /> Khen thưởng</button>
        </div>
        {tab !== 'awards' && (
          <label className="adm-field comments-period"><span>Kỳ đánh giá · năm học {year}–{year + 1}</span>
            <select value={exam} onChange={(e) => setExam(e.target.value as ExamCode)} disabled={locked} title={locked ? 'Lưu trước khi đổi kỳ' : undefined}>
              {EXAMS.map((x) => <option key={x} value={x}>{EXAM_NAME[x]}</option>)}
            </select>
          </label>
        )}
      </div>
      {tab === 'subjects' && <Subjects classId={classId} className={className} grade={grade} students={students} periodKey={examKey(exam, year)} exam={exam} onDirty={setLocked} />}
      {tab === 'qualities' && <Qualities classId={classId} className={className} grade={grade} students={students} periodKey={examKey(exam, year)} onDirty={setLocked} />}
      {tab === 'awards' && <Awards classId={classId} className={className} students={students} />}
    </div>
  );
}

// ------------------------------------------------------------------ Môn học: mức đạt + điểm
type SubjCell = { score: string; level: SubjectLevel | '' };
function Subjects({ classId, className, grade, students, periodKey, exam, onDirty }: { classId: string; className: string; grade: number; students: Student[]; periodKey: string; exam: ExamCode; onDirty: (d: boolean) => void }) {
  const subjects = schoolSubjects(grade);
  const [cells, setCells] = useState<Record<string, SubjCell>>({});
  const [orig, setOrig] = useState<Record<string, SubjCell>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const { data, error } = await createClient().rpc('teacher_get_scores', { p_class: classId, p_period: periodKey });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Không tải được dữ liệu.' });
    const m: Record<string, SubjCell> = {};
    for (const r of (data ?? []) as { student_id: string; subject: string; score: number | null; level: SubjectLevel | null }[]) {
      m[`${r.student_id}:${r.subject}`] = { score: showScore(r.score), level: r.level ?? '' };
    }
    setCells(m);
    setOrig(m);
  }, [classId, periodKey]);
  useEffect(() => { void load(); }, [load]);

  const keyOf = (sid: string, s: SchoolSubject) => `${sid}:${s}`;
  const get = (k: string): SubjCell => cells[k] ?? { score: '', level: '' };
  const same = (a?: SubjCell, b?: SubjCell) => (a?.score ?? '') === (b?.score ?? '') && (a?.level ?? '') === (b?.level ?? '');
  const changed = Object.keys({ ...cells, ...orig }).filter((k) => !same(cells[k], orig[k]));
  const invalid = new Set(Object.entries(cells).filter(([, v]) => parseScore(v.score) === 'invalid').map(([k]) => k));
  useEffect(() => { onDirty(changed.length > 0); }, [changed.length, onDirty]);

  const setScore = (k: string, raw: string) => setCells((c) => {
    const cur = c[k] ?? { score: '', level: '' };
    const n = parseScore(raw);
    const prevAuto = cur.level === '' || (typeof parseScore(cur.score) === 'number' && cur.level === levelFromScore(parseScore(cur.score) as number));
    // mức tự theo điểm khi thầy cô chưa chọn mức khác
    return { ...c, [k]: { score: raw, level: typeof n === 'number' && prevAuto ? levelFromScore(n) : cur.level } };
  });
  const setLevel = (k: string, level: SubjectLevel | '') => setCells((c) => ({ ...c, [k]: { ...(c[k] ?? { score: '' }), level } }));
  const fillColumn = (s: SchoolSubject, level: SubjectLevel) => setCells((c) => {
    const n = { ...c };
    for (const st of students) { const k = keyOf(st.id, s); if (!(n[k]?.level)) n[k] = { score: n[k]?.score ?? '', level }; }
    return n;
  });

  const save = async () => {
    if (invalid.size) return setMsg({ kind: 'error', text: 'Có ô điểm không hợp lệ (chỉ nhận 0 đến 10, ví dụ 8 hoặc 8,5).' });
    if (!changed.length) return setMsg({ kind: 'info', text: 'Không có thay đổi để lưu.' });
    const rows = changed.map((k) => { const [student_id, subject] = k.split(':'); const c = get(k); return { student_id, subject, score: parseScore(c.score) as number | null, level: c.level || null, note: '' }; });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_save_scores', { p_class: classId, p_period: periodKey, p_rows: rows });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Chưa lưu được. Thử lại sau.' });
    setOrig({ ...cells });
    setMsg({ kind: 'ok', text: `Đã lưu ${rows.length} ô — ${EXAM_NAME[exam]}.` });
  };

  const stat = (s: SchoolSubject) => {
    const lv = students.map((st) => get(keyOf(st.id, s)).level).filter(Boolean);
    const sc = students.map((st) => parseScore(get(keyOf(st.id, s)).score)).filter((v): v is number => typeof v === 'number');
    return { T: lv.filter((x) => x === 'T').length, H: lv.filter((x) => x === 'H').length, C: lv.filter((x) => x === 'C').length, avg: sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null, missing: students.length - lv.length };
  };
  const totalMissing = subjects.reduce((a, s) => a + stat(s).missing, 0);

  const csvHeader = ['STT', 'Học sinh', ...subjects.flatMap((s) => (isScored(grade, exam, s) ? [`${SCHOOL_SUBJECT_NAME[s]} - Mức`, `${SCHOOL_SUBJECT_NAME[s]} - Điểm`] : [`${SCHOOL_SUBJECT_NAME[s]} - Mức`]))];
  const csvRows = students.map((st, i) => [i + 1, st.name, ...subjects.flatMap((s) => { const c = get(keyOf(st.id, s)); return isScored(grade, exam, s) ? [c.level, c.score] : [c.level]; })]);

  return (
    <section className="dash-section" aria-label="Mức đạt và điểm các môn">
      <div className="comments-toolbar no-print">
        <div className="comments-actions">
          <CsvButton filename={`ket-qua-mon-${className}-${periodKey}.csv`} header={csvHeader} rows={csvRows} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang xử lý…' : `Lưu${changed.length ? ` (${changed.length})` : ''}`}</button>
        </div>
        {msg && <p className={alertCls(msg)} role="status">{msg.text}</p>}
        <p className="dash-muted">
          Mỗi ô: <strong>mức đạt</strong> (T Hoàn thành tốt · H Hoàn thành · C Chưa hoàn thành) và <strong>điểm</strong> ở môn có bài kiểm tra định kỳ kỳ này.
          Nhập điểm thì mức tự gợi ý (≥ 9 → T, 5–8,75 → H, &lt; 5 → C), thầy cô đổi được. Dưới mỗi cột có nút điền nhanh cho ô còn trống.
          {totalMissing > 0 && <> Còn <strong>{totalMissing}</strong> ô chưa có mức.</>}
        </p>
      </div>
      {students.length === 0 ? <p className="dash-muted">Lớp chưa có học sinh.</p> : (
        <div className="table-scroll sr-scroll">
          <table className="roster-table sr-table sr-wide">
            <thead>
              <tr><th className="sr-sticky">Học sinh</th>{subjects.map((s) => <th key={s} title={SCHOOL_SUBJECT_NAME[s]}>{SUBJECT_SHORT[s]}{isScored(grade, exam, s) && <span className="sr-scored">điểm</span>}</th>)}</tr>
            </thead>
            <tbody>
              {students.map((st, i) => (
                <tr key={st.id}>
                  <td className="sr-name sr-sticky">{i + 1}. {st.name}</td>
                  {subjects.map((s) => {
                    const k = keyOf(st.id, s);
                    const c = get(k);
                    const dirty = !same(cells[k], orig[k]);
                    return (
                      <td key={s} className={dirty ? 'is-dirty' : undefined}>
                        <div className="sr-cell">
                          {isScored(grade, exam, s) && (
                            <input inputMode="decimal" className={`sr-input${invalid.has(k) ? ' is-invalid' : ''}`} aria-label={`Điểm ${SCHOOL_SUBJECT_NAME[s]} của ${st.name}`}
                              value={c.score} maxLength={5} placeholder="điểm" onChange={(e) => setScore(k, e.target.value)} />
                          )}
                          <select className={`sr-level lv-${c.level || 'none'}`} aria-label={`Mức ${SCHOOL_SUBJECT_NAME[s]} của ${st.name}`} value={c.level} onChange={(e) => setLevel(k, e.target.value as SubjectLevel | '')}>
                            <option value="">–</option><option value="T">T</option><option value="H">H</option><option value="C">C</option>
                          </select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th className="sr-sticky">T / H / C</th>{subjects.map((s) => { const x = stat(s); return <td key={s}>{x.T}/{x.H}/{x.C}{x.avg != null && <span className="sr-avg">TB {x.avg.toFixed(2).replace('.', ',')}</span>}</td>; })}</tr>
              <tr className="no-print"><th className="sr-sticky">Điền ô trống</th>{subjects.map((s) => (
                <td key={s}><div className="sr-fill">{(['T', 'H'] as SubjectLevel[]).map((l) => <button key={l} type="button" className="mini-btn" onClick={() => fillColumn(s, l)} title={`Điền ${SUBJECT_LEVEL_NAME[l]} cho ô trống cột ${SCHOOL_SUBJECT_NAME[s]}`}>{l}</button>)}</div></td>
              ))}</tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Phẩm chất – năng lực
function Qualities({ classId, className, grade, students, periodKey, onDirty }: { classId: string; className: string; grade: number; students: Student[]; periodKey: string; onDirty: (d: boolean) => void }) {
  const items = qualitiesFor(grade);
  const [cells, setCells] = useState<Record<string, QualityLevel | ''>>({});
  const [orig, setOrig] = useState<Record<string, QualityLevel | ''>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const { data, error } = await createClient().rpc('teacher_get_qualities', { p_class: classId, p_period: periodKey });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Không tải được dữ liệu.' });
    const m: Record<string, QualityLevel> = {};
    for (const r of (data ?? []) as { student_id: string; item: QualityItem; level: QualityLevel }[]) m[`${r.student_id}:${r.item}`] = r.level;
    setCells(m);
    setOrig(m);
  }, [classId, periodKey]);
  useEffect(() => { void load(); }, [load]);

  const changed = Object.keys({ ...cells, ...orig }).filter((k) => (cells[k] ?? '') !== (orig[k] ?? ''));
  useEffect(() => { onDirty(changed.length > 0); }, [changed.length, onDirty]);
  const fill = (filter: (it: QualityItem) => boolean, level: QualityLevel) => setCells((c) => {
    const n = { ...c };
    for (const st of students) for (const q of items) { const k = `${st.id}:${q.item}`; if (filter(q.item) && !n[k]) n[k] = level; }
    return n;
  });

  const save = async () => {
    if (!changed.length) return setMsg({ kind: 'info', text: 'Không có thay đổi để lưu.' });
    const rows = changed.map((k) => { const [student_id, item] = k.split(':'); return { student_id, item, level: cells[k] || null }; });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_save_qualities', { p_class: classId, p_period: periodKey, p_rows: rows });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : 'Chưa lưu được. Thử lại sau.' });
    setOrig({ ...cells });
    setMsg({ kind: 'ok', text: `Đã lưu ${rows.length} ô phẩm chất – năng lực.` });
  };

  const csvRows = students.map((st, i) => [i + 1, st.name, ...items.map((q) => { const v = cells[`${st.id}:${q.item}`]; return v === 'D' ? 'Đ' : v ?? ''; })]);
  const missing = students.length * items.length - students.reduce((a, st) => a + items.filter((q) => cells[`${st.id}:${q.item}`]).length, 0);
  const groups = [...new Set(items.map((q) => q.group))];

  return (
    <section className="dash-section" aria-label="Phẩm chất và năng lực">
      <div className="comments-toolbar no-print">
        <div className="comments-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fill(() => true, 'D')}><Wand2 aria-hidden="true" /> Điền “Đạt” cho ô trống</button>
          <CsvButton filename={`pham-chat-nang-luc-${className}-${periodKey}.csv`} header={['STT', 'Học sinh', ...items.map((q) => q.name)]} rows={csvRows} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={busy}><Save aria-hidden="true" /> {busy ? 'Đang xử lý…' : `Lưu${changed.length ? ` (${changed.length})` : ''}`}</button>
        </div>
        {msg && <p className={alertCls(msg)} role="status">{msg.text}</p>}
        <p className="dash-muted">Mức: <strong>T</strong> Tốt · <strong>Đ</strong> Đạt · <strong>C</strong> Cần cố gắng. Thường điền “Đạt” cho cả lớp trước rồi sửa các em Tốt / Cần cố gắng.{missing > 0 && <> Còn <strong>{missing}</strong> ô trống.</>}</p>
      </div>
      {students.length === 0 ? <p className="dash-muted">Lớp chưa có học sinh.</p> : (
        <div className="table-scroll sr-scroll">
          <table className="roster-table sr-table sr-wide">
            <thead>
              <tr><th className="sr-sticky" rowSpan={2}>Học sinh</th>{groups.map((g) => <th key={g} colSpan={items.filter((q) => q.group === g).length} className="sr-group">{QUALITY_GROUP_NAME[g]}</th>)}</tr>
              <tr>{items.map((q) => <th key={q.item} title={q.name}>{q.short}</th>)}</tr>
            </thead>
            <tbody>
              {students.map((st, i) => (
                <tr key={st.id}>
                  <td className="sr-name sr-sticky">{i + 1}. {st.name}</td>
                  {items.map((q) => {
                    const k = `${st.id}:${q.item}`;
                    const v = cells[k] ?? '';
                    return (
                      <td key={q.item} className={(cells[k] ?? '') !== (orig[k] ?? '') ? 'is-dirty' : undefined}>
                        <select className={`sr-level lv-${v || 'none'}`} aria-label={`${q.name} của ${st.name}`} value={v} onChange={(e) => setCells((c) => ({ ...c, [k]: e.target.value as QualityLevel | '' }))}>
                          <option value="">–</option><option value="T">T</option><option value="D">Đ</option><option value="C">C</option>
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th className="sr-sticky">T / Đ / C</th>{items.map((q) => {
                const vals = students.map((st) => cells[`${st.id}:${q.item}`]);
                return <td key={q.item}>{vals.filter((v) => v === 'T').length}/{vals.filter((v) => v === 'D').length}/{vals.filter((v) => v === 'C').length}</td>;
              })}</tr>
              <tr className="no-print"><th className="sr-sticky">Điền ô trống</th>{items.map((q) => (
                <td key={q.item}><div className="sr-fill">{(['T', 'D'] as QualityLevel[]).map((l) => <button key={l} type="button" className="mini-btn" title={`Điền ${QUALITY_LEVEL_NAME[l]} cho ô trống cột ${q.name}`} onClick={() => fill((it) => it === q.item, l)}>{l === 'D' ? 'Đ' : l}</button>)}</div></td>
              ))}</tr>
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
