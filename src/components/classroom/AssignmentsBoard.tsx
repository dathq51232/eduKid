'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, ClipboardCopy, Clock, Lock, LockOpen, Send, Trash2 } from 'lucide-react';
import CsvButton from '@/components/classroom/CsvButton';
import { createClient } from '@/lib/supabase/client';
import {
  MUC_NAME, SUBJECT_NAME, assignError, defaultDueInput, dueInfo, itemStats,
  type AssignmentRow, type DetailRow, type ExamItem,
} from '@/lib/classroom/assignments';
import type { SubjectCode } from '@/lib/types';

export type LessonOption = { id: string; subject: SubjectCode; title: string; group: string };
type Student = { id: string; name: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const alertCls = (m: NonNullable<Msg>) => `adm-alert is-${m.kind === 'ok' ? 'ok' : m.kind === 'error' ? 'error' : 'info'}`;
const two = (n: number) => String(n).padStart(2, '0');
const fmtTime = (s: string | null) => { if (!s) return '—'; const d = new Date(s); return `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`; };
const fmtNum = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Giao bài luyện tập có hạn nộp + theo dõi em nào đã làm / chưa làm; xem kết quả đề đã giao làm trên app. */
export default function AssignmentsBoard({ classId, className, students, lessons, preset }: {
  classId: string; className: string; students: Student[]; lessons: LessonOption[];
  preset?: { lessonId?: string; studentIds?: string[] };
}) {
  const subjects = (['toan', 'tieng-viet', 'tieng-anh'] as SubjectCode[]).filter((s) => lessons.some((l) => l.subject === s));
  const presetLesson = lessons.find((l) => l.id === preset?.lessonId);
  const presetIds = (preset?.studentIds ?? []).filter((id) => students.some((s) => s.id === id));
  const [subject, setSubject] = useState<SubjectCode>(presetLesson?.subject ?? subjects[0] ?? 'toan');
  const [lessonId, setLessonId] = useState(presetLesson?.id ?? lessons.find((l) => l.subject === (subjects[0] ?? 'toan'))?.id ?? '');
  const [muc, setMuc] = useState<1 | 2 | 3>(1);
  const [due, setDue] = useState(() => defaultDueInput(presetIds.length ? 2 : 3));
  const [target, setTarget] = useState<'all' | 'some'>(presetIds.length ? 'some' : 'all');
  const [picked, setPicked] = useState<Set<string>>(new Set(presetIds));
  const [list, setList] = useState<AssignmentRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(presetLesson ? { kind: 'info', text: `Đã chọn sẵn bài "${presetLesson.title}"${presetIds.length ? ` cho ${presetIds.length} em cần ôn` : ''}. Kiểm tra hạn nộp rồi bấm Giao bài.` } : null);
  const [openId, setOpenId] = useState<string | null>(null);

  const subjectLessons = useMemo(() => lessons.filter((l) => l.subject === subject), [lessons, subject]);
  const groups = useMemo(() => {
    const m = new Map<string, LessonOption[]>();
    for (const l of subjectLessons) m.set(l.group, [...(m.get(l.group) ?? []), l]);
    return [...m.entries()];
  }, [subjectLessons]);
  const lesson = lessons.find((l) => l.id === lessonId);

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_list_assignments', { p_class: classId });
    if (error) return setMsg({ kind: 'error', text: assignError(error.message) });
    setList((data ?? []) as AssignmentRow[]);
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson) return setMsg({ kind: 'error', text: 'Chọn bài cần giao.' });
    if (target === 'some' && !picked.size) return setMsg({ kind: 'error', text: 'Chọn ít nhất một em.' });
    const dueAt = new Date(due);
    if (Number.isNaN(dueAt.getTime())) return setMsg({ kind: 'error', text: 'Chọn hạn nộp.' });
    setBusy(true);
    const { error } = await createClient().rpc('teacher_create_assignment', {
      p_class: classId, p_kind: 'lesson', p_title: lesson.title.slice(0, 200), p_subject: lesson.subject, p_lesson: lesson.id, p_muc: muc,
      p_questions: null, p_minutes: null, p_due: dueAt.toISOString(), p_students: target === 'some' ? [...picked] : null,
    });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: assignError(error.message) });
    setMsg({ kind: 'ok', text: `Đã giao "${lesson.title}" (${MUC_NAME[muc]}) cho ${target === 'all' ? 'cả lớp' : `${picked.size} em`}. Các em thấy bài ở trang của mình khi đăng nhập.` });
    void load();
  };

  const setStatus = async (a: AssignmentRow, open: boolean) => {
    const { error } = await createClient().rpc('teacher_set_assignment_status', { p_assignment: a.id, p_open: open });
    if (error) return setMsg({ kind: 'error', text: assignError(error.message) });
    void load();
  };
  const remove = async (a: AssignmentRow) => {
    if (!window.confirm(`Xoá bài giao "${a.title}"? ${a.kind === 'exam' ? 'Bài nộp của các em cũng bị xoá.' : 'Kết quả luyện tập của các em vẫn giữ.'}`)) return;
    const { error } = await createClient().rpc('teacher_delete_assignment', { p_assignment: a.id });
    if (error) return setMsg({ kind: 'error', text: assignError(error.message) });
    if (openId === a.id) setOpenId(null);
    void load();
  };

  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const open = list.filter((a) => a.status === 'open');
  const closed = list.filter((a) => a.status === 'closed');

  return (
    <div className="assign-board">
      <section className="dash-card no-print" aria-label="Giao bài mới">
        <h2><Send aria-hidden="true" /> Giao bài luyện tập</h2>
        <form className="assign-form" onSubmit={create}>
          <label className="adm-field"><span>Môn</span>
            <select value={subject} onChange={(e) => { const s = e.target.value as SubjectCode; setSubject(s); setLessonId(lessons.find((l) => l.subject === s)?.id ?? ''); }}>
              {subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]}</option>)}
            </select>
          </label>
          <label className="adm-field assign-lesson"><span>Bài</span>
            <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              {groups.map(([g, ls]) => (
                <optgroup key={g} label={g}>{ls.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</optgroup>
              ))}
            </select>
          </label>
          <label className="adm-field"><span>Mức</span>
            <select value={muc} onChange={(e) => setMuc(Number(e.target.value) as 1 | 2 | 3)}>
              {([1, 2, 3] as const).map((m) => <option key={m} value={m}>{MUC_NAME[m]}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Hạn nộp</span>
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} required />
          </label>
          <fieldset className="assign-target">
            <legend>Giao cho</legend>
            <label className="check-line"><input type="radio" name="target" checked={target === 'all'} onChange={() => setTarget('all')} /> <span>Cả lớp ({students.length} em)</span></label>
            <label className="check-line"><input type="radio" name="target" checked={target === 'some'} onChange={() => setTarget('some')} /> <span>Một nhóm em{target === 'some' ? ` (đã chọn ${picked.size})` : ''}</span></label>
          </fieldset>
          {target === 'some' && (
            <div className="assign-pick">
              <div className="comments-actions">
                <button type="button" className="mini-btn" onClick={() => setPicked(new Set(students.map((s) => s.id)))}>Chọn tất cả</button>
                <button type="button" className="mini-btn" onClick={() => setPicked(new Set())}>Bỏ chọn</button>
              </div>
              <ul>
                {students.map((s) => (
                  <li key={s.id}><label className="check-line"><input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} /> <span>{s.name}</span></label></li>
                ))}
              </ul>
            </div>
          )}
          <div className="comments-actions">
            <button type="submit" className="btn btn-primary" disabled={busy || !students.length}><Send aria-hidden="true" /> {busy ? 'Đang giao…' : 'Giao bài'}</button>
          </div>
        </form>
        <p className="dash-muted">Đề kiểm tra và phiếu bài tập làm trên app được giao từ trang <strong>Ma trận và đề kiểm tra</strong> hoặc <strong>Phiếu bài tập</strong>; kết quả hiện ở danh sách dưới đây.</p>
        {msg && <p className={alertCls(msg)} role="status">{msg.text}</p>}
      </section>

      <section className="dash-section" aria-label="Bài đã giao">
        <h2>Bài đang mở ({open.length})</h2>
        {open.length === 0 ? <p className="dash-muted">Chưa có bài nào đang mở.</p> : (
          <ul className="assign-list">
            {open.map((a) => <AssignmentItem key={a.id} a={a} className={className} expanded={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} onStatus={setStatus} onRemove={remove} />)}
          </ul>
        )}
        {closed.length > 0 && (
          <>
            <h2>Đã đóng ({closed.length})</h2>
            <ul className="assign-list is-closed">
              {closed.map((a) => <AssignmentItem key={a.id} a={a} className={className} expanded={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} onStatus={setStatus} onRemove={remove} />)}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function AssignmentItem({ a, className, expanded, onToggle, onStatus, onRemove }: {
  a: AssignmentRow; className: string; expanded: boolean; onToggle: () => void;
  onStatus: (a: AssignmentRow, open: boolean) => void; onRemove: (a: AssignmentRow) => void;
}) {
  const d = dueInfo(a.due_at);
  const pct = a.assigned ? Math.round((a.done * 100) / a.assigned) : 0;
  return (
    <li className={`assign-item${d.overdue && a.status === 'open' ? ' is-overdue' : ''}`}>
      <div className="assign-head">
        <div className="assign-title">
          <span className={`assign-kind kind-${a.kind}`}>{a.kind === 'exam' ? 'Đề trên app' : 'Luyện tập'}</span>
          <strong>{a.title}</strong>
          <span className="dash-muted">
            {a.subject ? SUBJECT_NAME[a.subject] : ''}{a.kind === 'lesson' && a.muc ? ` · ${MUC_NAME[a.muc]}` : ''}{a.kind === 'exam' ? ` · ${a.n_questions} câu · ${a.minutes ?? '—'} phút` : ''}
            {' · '}{a.student_ids ? `${a.assigned} em` : 'Cả lớp'}
          </span>
        </div>
        <span className={`assign-due${d.overdue ? ' is-over' : d.soon ? ' is-soon' : ''}`}><Clock aria-hidden="true" /> Hạn {d.label}{d.overdue ? ' (đã qua)' : ''}</span>
        <div className="assign-progress" aria-label={`Đã làm ${a.done} trên ${a.assigned} em`}>
          <span className="assign-bar"><span style={{ width: `${pct}%` }} /></span>
          <span><strong>{a.done}</strong>/{a.assigned} em đã làm</span>
        </div>
        <div className="assign-actions">
          <button type="button" className="mini-btn" onClick={onToggle} aria-expanded={expanded}>{expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />} Chi tiết</button>
          {a.status === 'open'
            ? <button type="button" className="mini-btn" onClick={() => onStatus(a, false)} title="Đóng: học sinh không nộp đề được nữa"><Lock aria-hidden="true" /> Đóng</button>
            : <button type="button" className="mini-btn" onClick={() => onStatus(a, true)}><LockOpen aria-hidden="true" /> Mở lại</button>}
          <button type="button" className="mini-btn" onClick={() => onRemove(a)} aria-label={`Xoá ${a.title}`}><Trash2 aria-hidden="true" /></button>
        </div>
      </div>
      {expanded && <AssignmentDetail a={a} className={className} />}
    </li>
  );
}

function AssignmentDetail({ a, className }: { a: AssignmentRow; className: string }) {
  const [rows, setRows] = useState<DetailRow[] | null>(null);
  const [items, setItems] = useState<ExamItem[]>([]);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const sb = createClient();
    void (async () => {
      const [d, q] = await Promise.all([
        sb.rpc('teacher_assignment_detail', { p_assignment: a.id }),
        a.kind === 'exam' ? sb.rpc('teacher_assignment_questions', { p_assignment: a.id }) : Promise.resolve({ data: [], error: null }),
      ]);
      if (d.error) return setErr(assignError(d.error.message));
      setRows((d.data ?? []) as DetailRow[]);
      setItems(((q.data ?? []) as ExamItem[]));
    })();
  }, [a.id, a.kind]);

  if (err) return <p className="adm-alert is-error">{err}</p>;
  if (!rows) return <p className="dash-muted">Đang tải…</p>;
  const notDone = rows.filter((r) => !r.done);
  const doneRows = rows.filter((r) => r.done);
  const due = new Date(a.due_at).getTime();
  const avg10 = a.kind === 'exam' && doneRows.length
    ? doneRows.reduce((s, r) => s + (r.max_score ? (Number(r.score) * 10) / Number(r.max_score) : 0), 0) / doneRows.length : null;
  const stats = a.kind === 'exam' ? itemStats(items.length, rows) : [];

  const copy = async () => {
    const text = `Các em chưa làm "${a.title}" (hạn ${dueInfo(a.due_at).label}) — lớp ${className}: ${notDone.map((r) => r.display_name).join(', ')}.`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Chép nội dung:', text); }
  };
  const csvHeader = a.kind === 'exam'
    ? ['STT', 'Học sinh', 'Trạng thái', 'Điểm', 'Điểm tối đa', 'Số câu đúng', 'Số câu', 'Nộp lúc']
    : ['STT', 'Học sinh', 'Trạng thái', 'Số lần làm', 'Đúng (lần tốt nhất)', 'Số câu', 'Lần gần nhất'];
  const csvRows = rows.map((r, i) => a.kind === 'exam'
    ? [i + 1, r.display_name, r.done ? 'Đã nộp' : 'Chưa nộp', r.score ?? '', r.max_score ?? '', r.correct ?? '', r.total ?? '', fmtTime(r.finished_at)]
    : [i + 1, r.display_name, r.done ? 'Đã làm' : 'Chưa làm', r.attempts, r.correct ?? '', r.total ?? '', fmtTime(r.finished_at)]);

  return (
    <div className="assign-detail">
      <p className="assign-summary">
        <CheckCircle2 aria-hidden="true" /> {doneRows.length}/{rows.length} em đã {a.kind === 'exam' ? 'nộp' : 'làm'}
        {avg10 !== null && <> · điểm trung bình <strong>{fmtNum(avg10)}</strong>/10</>}
      </p>
      <div className="comments-actions">
        {notDone.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={() => void copy()}><ClipboardCopy aria-hidden="true" /> {copied ? 'Đã chép!' : `Chép tên ${notDone.length} em chưa làm`}</button>}
        <CsvButton filename={`giao-bai-${className}-${a.title}.csv`} header={csvHeader} rows={csvRows} />
      </div>
      <div className="table-scroll">
        <table className="roster-table assign-table">
          <thead>
            <tr><th>Học sinh</th><th>Trạng thái</th>{a.kind === 'exam' ? <><th>Điểm</th><th>Câu đúng</th><th>Nộp lúc</th></> : <><th>Số lần</th><th>Lần tốt nhất</th><th>Gần nhất</th></>}</tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const late = r.finished_at && new Date(r.finished_at).getTime() > due;
              return (
                <tr key={r.student_id} className={r.done ? '' : 'is-missing'}>
                  <th scope="row">{r.display_name}</th>
                  <td>{r.done ? <span className="tag-ok">{a.kind === 'exam' ? 'Đã nộp' : 'Đã làm'}</span> : <span className="tag-miss">Chưa {a.kind === 'exam' ? 'nộp' : 'làm'}</span>}</td>
                  {a.kind === 'exam' ? (
                    <><td>{r.done ? `${fmtNum(Number(r.score))}/${fmtNum(Number(r.max_score))}` : '—'}</td><td>{r.done ? `${r.correct}/${r.total}` : '—'}</td><td>{fmtTime(r.finished_at)}{late ? ' (muộn)' : ''}</td></>
                  ) : (
                    <><td>{r.attempts || '—'}</td><td>{r.done ? `${r.correct}/${r.total} câu` : '—'}</td><td>{fmtTime(r.finished_at)}{late ? ' (sau hạn)' : ''}</td></>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {a.kind === 'exam' && items.length > 0 && (
        <>
          <h3>Thống kê từng câu</h3>
          <div className="table-scroll">
            <table className="roster-table assign-items">
              <thead><tr><th>Câu</th><th>Nội dung</th><th>Tỉ lệ đúng</th><th>Câu trả lời sai hay gặp</th></tr></thead>
              <tbody>
                {stats.map((s) => {
                  const q = items[s.i];
                  const pct = s.rate === null ? null : Math.round(s.rate * 100);
                  return (
                    <Fragment key={s.i}>
                      <tr className={pct !== null && pct < 50 ? 'is-weak' : ''}>
                        <th scope="row">{s.i + 1}{q?.muc ? <span className={`exam-muc m${q.muc}`}>M{q.muc}</span> : null}</th>
                        <td className="assign-q">{(q?.prompt ?? '').replace(/^Đọc bài "([^"]+)":[\s\S]*?\n\n/, 'Đọc "$1": ').slice(0, 140)}</td>
                        <td>{pct === null ? '—' : <span className="assign-rate"><span className="assign-bar"><span style={{ width: `${pct}%` }} /></span> {pct}% ({s.ok}/{s.n})</span>}</td>
                        <td>{s.wrong.length ? s.wrong.map(([w, c]) => `${w} (${c})`).join(' · ') : '—'}</td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="dash-muted">Câu dưới 50% em đúng được tô màu — nên chữa lại trên lớp.</p>
        </>
      )}
    </div>
  );
}
