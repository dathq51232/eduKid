'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArrowDown, ArrowLeft, ArrowUp, Eye, FileUp, Pencil, Plus, Rocket, Send, Trash2, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { timeLimitOf, describeAnswer, draftFromRow, emptyDraft, errorText, payloadOf } from '@/lib/admin/questions';
import { BOOK_SERIES, TYPE_LABEL, type AdminLesson, type AdminQuestionRow, type LessonStatus, type QuestionDraft } from '@/lib/admin/types';
import { useCatalog } from '@/lib/admin/catalog';
import { LEVEL_LABEL, STAGE_LABEL } from '@/lib/curriculum/grade1';
import { useAdminUser } from './AdminContext';
import ConfirmButton from './ConfirmButton';
import CsvImport from './CsvImport';
import QuestionForm from './QuestionForm';
import QuestionPreview from './QuestionPreview';
import StatusBadge from './StatusBadge';

const LESSON_SELECT = 'id,title,status,book_series,semester,sort_order,created_by,updated_at,published_at,topic_id,subjects(id,code,name,grade)';
const QUESTION_SELECT = 'id,question_type,prompt,options,skill_code,difficulty,time_limit_sec,sort_order,status,form_id,outcome_id,question_keys(answer_key,explanation,solution)';

type Msg = { kind: 'ok' | 'error'; text: string } | null;

export default function LessonEditor({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);

  const [lesson, setLesson] = useState<AdminLesson | null>(null);
  const [rows, setRows] = useState<AdminQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  // Form câu hỏi: 'new' = thêm mới, id = đang sửa câu đó
  const [editing, setEditing] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [previewDraft, setPreviewDraft] = useState<QuestionDraft | null>(null);
  const [showCsv, setShowCsv] = useState(false);

  const [meta, setMeta] = useState({ title: '', book_series: '', semester: '', topic_id: '' });
  const [lessonOutcomes, setLessonOutcomes] = useState<string[]>([]); // đã lưu
  const [pickedOutcomes, setPickedOutcomes] = useState<string[]>([]); // đang chọn
  const catalog = useCatalog(lesson?.subjects?.id, lesson?.subjects?.code);

  const load = useCallback(async () => {
    const [{ data: l, error: e1 }, { data: q, error: e2 }, { data: lo }] = await Promise.all([
      supabase.from('lessons').select(LESSON_SELECT).eq('id', lessonId).maybeSingle(),
      supabase.from('questions').select(QUESTION_SELECT).eq('lesson_id', lessonId).neq('status', 'archived').order('sort_order'),
      supabase.from('lesson_outcomes').select('outcome_id').eq('lesson_id', lessonId),
    ]);
    const ids = ((lo ?? []) as { outcome_id: string }[]).map((x) => x.outcome_id).sort();
    setLessonOutcomes(ids);
    setPickedOutcomes(ids);
    if (e1 || e2) setMsg({ kind: 'error', text: errorText(e1 ?? e2) });
    const lessonRow = (l ?? null) as unknown as AdminLesson | null;
    setLesson(lessonRow);
    if (lessonRow)
      setMeta({
        title: lessonRow.title,
        book_series: lessonRow.book_series ?? '',
        semester: lessonRow.semester ? String(lessonRow.semester) : '',
        topic_id: lessonRow.topic_id ?? '',
      });
    setRows((q ?? []) as unknown as AdminQuestionRow[]);
    setLoading(false);
  }, [supabase, lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  const drafts = useMemo(() => rows.map(draftFromRow), [rows]);
  // YCCĐ được chọn cho câu hỏi: của bài nếu bài đã gắn, nếu chưa thì toàn bộ YCCĐ của môn
  const allowedOutcomes = useMemo(
    () => (lessonOutcomes.length ? catalog.outcomes.filter((o) => lessonOutcomes.includes(o.id)) : catalog.outcomes),
    [catalog.outcomes, lessonOutcomes],
  );
  const formName = (id: string | null) => catalog.forms.find((f) => f.id === id)?.name;
  const outcomeOf = (id: string | null) => catalog.outcomes.find((o) => o.id === id);

  if (loading) return <p className="adm-muted">Đang tải bài học...</p>;
  if (!lesson) {
    return (
      <div className="adm-stack">
        <p className="adm-alert is-error">Không tìm thấy bài học hoặc bạn không có quyền xem.</p>
        <Link href="/quan-tri/bai-hoc" className="adm-link"><ArrowLeft size={16} aria-hidden="true" /> Về danh sách bài</Link>
      </div>
    );
  }

  const isOwner = lesson.created_by === me.userId;
  const status = lesson.status;
  const editable = (status === 'draft' || status === 'review') && (me.isAdmin || isOwner);
  const outcomesDirty = [...pickedOutcomes].sort().join() !== lessonOutcomes.join();
  const metaDirty =
    meta.title.trim() !== lesson.title ||
    meta.book_series !== (lesson.book_series ?? '') ||
    meta.semester !== (lesson.semester ? String(lesson.semester) : '') ||
    meta.topic_id !== (lesson.topic_id ?? '') ||
    outcomesDirty;

  // Chạy một thao tác, báo kết quả, tải lại dữ liệu
  const act = async (fn: () => PromiseLike<{ error: { message?: string } | null }>, okText: string) => {
    setBusy(true);
    setMsg(null);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      setMsg({ kind: 'error', text: errorText(error) });
      return false;
    }
    setMsg({ kind: 'ok', text: okText });
    await load();
    return true;
  };

  const setStatus = (s: LessonStatus, okText: string) => act(() => supabase.rpc('set_lesson_status', { p_lesson: lesson.id, p_status: s }), okText);

  const saveMeta = () =>
    act(async () => {
      const r1 = await supabase
        .from('lessons')
        .update({
          title: meta.title.trim(),
          book_series: meta.book_series || null,
          semester: meta.semester ? Number(meta.semester) : null,
          topic_id: meta.topic_id || null,
        })
        .eq('id', lesson.id);
      if (r1.error || !outcomesDirty) return r1;
      return supabase.rpc('set_lesson_outcomes', { p_lesson: lesson.id, p_outcomes: pickedOutcomes });
    }, 'Đã lưu thông tin bài, chủ đề và yêu cầu cần đạt.');

  const saveQuestion = async (d: QuestionDraft) => {
    setBusy(true);
    setFormError('');
    const { error } = await supabase.rpc('save_question', payloadOf(lesson.id, d));
    setBusy(false);
    if (error) return setFormError(errorText(error));
    setEditing(null);
    setMsg({ kind: 'ok', text: d.id ? 'Đã lưu câu hỏi.' : 'Đã thêm câu hỏi.' });
    await load();
  };

  const importDrafts = async (list: QuestionDraft[]) => {
    let ok = 0;
    const failed: { index: number; message: string }[] = [];
    for (let i = 0; i < list.length; i++) {
      const { error } = await supabase.rpc('save_question', payloadOf(lesson.id, list[i]));
      if (error) failed.push({ index: i, message: errorText(error) });
      else ok++;
    }
    await load();
    return { ok, failed };
  };

  const reorder = (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return;
    const ids = rows.map((r) => r.id);
    const [x] = ids.splice(from, 1);
    ids.splice(to, 0, x);
    act(() => supabase.rpc('reorder_questions', { p_lesson: lesson.id, p_ids: ids }), 'Đã đổi thứ tự.');
  };

  return (
    <div className="adm-stack">
      <Link href="/quan-tri/bai-hoc" className="adm-link"><ArrowLeft size={16} aria-hidden="true" /> Danh sách bài học</Link>

      {/* Thông tin bài và thao tác trạng thái */}
      <section className="adm-card">
        <div className="adm-lesson-head">
          <div>
            <p className="adm-muted">{lesson.subjects ? `${lesson.subjects.name} · Lớp ${lesson.subjects.grade}` : ''}</p>
            <h1 className="adm-lesson-title">{lesson.title}</h1>
          </div>
          <StatusBadge status={status} />
        </div>

        {!editable && (
          <p className="adm-alert is-info">
            {status === 'published'
              ? 'Bài đang xuất bản — học sinh đang thấy bài này nên không sửa trực tiếp được. Chuyển về nháp để sửa, sửa xong xuất bản lại.'
              : status === 'archived'
                ? 'Bài đã lưu trữ. Khôi phục về nháp nếu muốn dùng lại.'
                : 'Bạn chỉ có quyền xem bài này.'}
          </p>
        )}

        <div className="adm-grid">
          <label className="adm-field is-wide">
            <span>Tên bài</span>
            <input value={meta.title} maxLength={180} disabled={!editable} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </label>
          <label className="adm-field">
            <span>Bộ sách</span>
            <select value={meta.book_series} disabled={!editable} onChange={(e) => setMeta({ ...meta, book_series: e.target.value })}>
              {BOOK_SERIES.map((b) => <option key={b} value={b}>{b}</option>)}
              {meta.book_series && !BOOK_SERIES.includes(meta.book_series) && (
                <option value={meta.book_series}>{meta.book_series}</option>
              )}
              <option value="">Không theo bộ sách</option>
            </select>
          </label>
          <label className="adm-field">
            <span>Học kỳ</span>
            <select value={meta.semester} disabled={!editable} onChange={(e) => setMeta({ ...meta, semester: e.target.value })}>
              <option value="1">Học kỳ 1</option>
              <option value="2">Học kỳ 2</option>
              <option value="">Không ghi</option>
            </select>
          </label>
        </div>

        <div className="adm-grid">
          <label className="adm-field is-wide">
            <span>Chủ đề</span>
            <select value={meta.topic_id} disabled={!editable} onChange={(e) => setMeta({ ...meta, topic_id: e.target.value })}>
              <option value="">— Chưa gắn chủ đề —</option>
              {catalog.topics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}{t.is_core ? '' : ' (mở rộng)'}</option>
              ))}
            </select>
          </label>
        </div>

        {catalog.topics.length > 0 && (
          <fieldset className="adm-fieldset adm-outcomes" disabled={!editable}>
            <legend>Yêu cầu cần đạt của bài ({pickedOutcomes.length} đã chọn)</legend>
            {catalog.topics
              .filter((t) => !meta.topic_id || t.id === meta.topic_id || t.learning_outcomes.some((o) => pickedOutcomes.includes(o.id)))
              .map((t) => (
                <div key={t.id} className="adm-outcome-group">
                  <p className="adm-outcome-topic">{t.title}</p>
                  {t.learning_outcomes.map((o) => (
                    <label key={o.id} className={`adm-outcome${o.status !== 'active' ? ' is-off' : ''}`}>
                      <input
                        type="checkbox"
                        checked={pickedOutcomes.includes(o.id)}
                        onChange={(e) => setPickedOutcomes((prev) => (e.target.checked ? [...prev, o.id] : prev.filter((x) => x !== o.id)))}
                      />
                      <span className="adm-outcome-code">{o.code}</span>
                      <span>{o.description}</span>
                      <span className="adm-tag is-soft">{STAGE_LABEL[o.stage as 1 | 2 | 3]}</span>
                      {!o.is_core && <span className="adm-tag is-ext">Mở rộng</span>}
                    </label>
                  ))}
                </div>
              ))}
            {meta.topic_id && <p className="adm-muted">Đang hiện YCCĐ của chủ đề đã chọn. Bỏ chọn chủ đề để xem tất cả.</p>}
          </fieldset>
        )}

        <div className="adm-actions">
          {editable && metaDirty && (
            <button type="button" className="adm-btn is-primary" disabled={busy || !meta.title.trim()} onClick={saveMeta}>Lưu thông tin bài</button>
          )}
          <span className="adm-spacer" />

          {status === 'draft' && !me.isAdmin && isOwner && (
            <button type="button" className="adm-btn is-primary" disabled={busy || rows.length === 0} onClick={() => setStatus('review', 'Đã gửi bài cho quản trị viên duyệt.')}>
              <Send size={16} aria-hidden="true" /> Gửi duyệt
            </button>
          )}
          {status === 'review' && !me.isAdmin && isOwner && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => setStatus('draft', 'Đã rút bài về nháp.')}>
              <Undo2 size={16} aria-hidden="true" /> Rút về nháp
            </button>
          )}
          {me.isAdmin && (status === 'draft' || status === 'review') && (
            <ConfirmButton
              className="adm-btn is-primary"
              disabled={busy || rows.length === 0}
              confirmLabel={`Xuất bản ${rows.length} câu cho học sinh?`}
              onConfirm={() => act(() => supabase.rpc('publish_lesson', { p_lesson: lesson.id }), 'Đã xuất bản. Học sinh đã thấy bài này.')}
            >
              <Rocket size={16} aria-hidden="true" /> Xuất bản
            </ConfirmButton>
          )}
          {me.isAdmin && status === 'review' && (
            <button type="button" className="adm-btn" disabled={busy} onClick={() => setStatus('draft', 'Đã trả bài về nháp.')}>
              <Undo2 size={16} aria-hidden="true" /> Trả về nháp
            </button>
          )}
          {me.isAdmin && (status === 'published' || status === 'archived') && (
            <ConfirmButton className="adm-btn" disabled={busy} confirmLabel="Học sinh sẽ không thấy bài nữa. Xác nhận?" onConfirm={() => setStatus('draft', 'Đã chuyển về nháp.')}>
              <Undo2 size={16} aria-hidden="true" /> {status === 'published' ? 'Gỡ xuống để sửa' : 'Khôi phục về nháp'}
            </ConfirmButton>
          )}
          {me.isAdmin && status !== 'archived' && (
            <ConfirmButton className="adm-btn is-danger" disabled={busy} confirmLabel="Lưu trữ bài này?" onConfirm={() => setStatus('archived', 'Đã lưu trữ bài.')}>
              <Archive size={16} aria-hidden="true" /> Lưu trữ
            </ConfirmButton>
          )}
          {status === 'draft' && editable && (
            <ConfirmButton
              className="adm-btn is-danger"
              disabled={busy}
              confirmLabel="Xóa vĩnh viễn bài và mọi câu hỏi?"
              onConfirm={async () => {
                const ok = await act(() => supabase.rpc('delete_lesson', { p_lesson: lesson.id }), 'Đã xóa bài.');
                if (ok) router.push('/quan-tri/bai-hoc');
              }}
            >
              <Trash2 size={16} aria-hidden="true" /> Xóa bài
            </ConfirmButton>
          )}
        </div>

        {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}
      </section>

      {/* Danh sách câu hỏi */}
      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Câu hỏi ({rows.length})</h2>
          {editable && (
            <div className="adm-actions">
              <button type="button" className="adm-btn" onClick={() => setShowCsv((v) => !v)} aria-expanded={showCsv}>
                <FileUp size={16} aria-hidden="true" /> Nhập CSV
              </button>
              <button type="button" className="adm-btn is-primary" disabled={editing !== null} onClick={() => { setFormError(''); setEditing('new'); }}>
                <Plus size={16} aria-hidden="true" /> Thêm câu hỏi
              </button>
            </div>
          )}
        </div>

        {showCsv && editable && <CsvImport forms={catalog.forms} outcomes={catalog.outcomes} onImport={importDrafts} onClose={() => setShowCsv(false)} />}

        {editing === 'new' && (
          <div className="adm-qslot">
            <h3>Câu hỏi mới</h3>
            <QuestionForm initial={emptyDraft()} forms={catalog.forms} outcomes={allowedOutcomes} saving={busy} serverError={formError} onSave={saveQuestion} onCancel={() => setEditing(null)} />
          </div>
        )}

        {rows.length === 0 && editing !== 'new' ? (
          <p className="adm-muted">Bài chưa có câu hỏi. {editable ? 'Bấm “Thêm câu hỏi” hoặc “Nhập CSV”.' : ''}</p>
        ) : (
          <ol className="adm-qlist">
            {drafts.map((d, i) =>
              editing === d.id ? (
                <li key={d.id} className="adm-qslot">
                  <h3>Sửa câu {i + 1}</h3>
                  <QuestionForm initial={d} forms={catalog.forms} outcomes={allowedOutcomes} saving={busy} serverError={formError} onSave={saveQuestion} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={d.id} className="adm-qitem">
                  <div className="adm-qnum">{i + 1}</div>
                  <div className="adm-qbody">
                    <div className="adm-qmeta">
                      <span className="adm-tag">{formName(d.formId) ?? TYPE_LABEL[d.type]}</span>
                      <span className={`adm-tag is-level${d.difficulty}`}>{LEVEL_LABEL[d.difficulty]}</span>
                      <span className="adm-tag is-soft" title="Thời gian làm câu này">⏱ {timeLimitOf(d)} giây</span>
                      {d.outcomeId && <span className="adm-tag is-soft" title={outcomeOf(d.outcomeId)?.description}>{outcomeOf(d.outcomeId)?.code ?? 'YCCĐ'}</span>}
                      {d.skillCode && <span className="adm-tag is-soft">{d.skillCode}</span>}
                      {!d.outcomeId && <span className="adm-tag is-warn">Chưa gắn YCCĐ</span>}
                    </div>
                    <p className="adm-qprompt">{d.prompt}</p>
                    {(d.type === 'single_choice' || d.type === 'multiple_choice') && (
                      <ul className="adm-qopts">
                        {d.options.map((o) => {
                          const right = d.type === 'single_choice' ? o === d.correct : d.correctMany.includes(o);
                          return <li key={o} className={right ? 'is-correct' : ''}>{right && <span className="sr-only">Đáp án đúng: </span>}{o}</li>;
                        })}
                      </ul>
                    )}
                    <p className="adm-qanswer"><strong>Đáp án:</strong> {describeAnswer(d)}</p>
                    {d.explanation && <p className="adm-muted">{d.explanation}</p>}
                    {d.solution && (
                      <details className="adm-solution">
                        <summary>Lời giải</summary>
                        <p>{d.solution}</p>
                      </details>
                    )}
                  </div>
                  <div className="adm-qtools">
                    <button type="button" className="adm-icon" aria-label={`Xem thử câu ${i + 1}`} onClick={() => setPreviewDraft(d)}><Eye size={18} aria-hidden="true" /></button>
                    {editable && (
                      <>
                        <button type="button" className="adm-icon" aria-label={`Sửa câu ${i + 1}`} disabled={editing !== null} onClick={() => { setFormError(''); setEditing(d.id ?? null); }}><Pencil size={18} aria-hidden="true" /></button>
                        <button type="button" className="adm-icon" aria-label={`Đưa câu ${i + 1} lên`} disabled={busy || i === 0} onClick={() => reorder(i, i - 1)}><ArrowUp size={18} aria-hidden="true" /></button>
                        <button type="button" className="adm-icon" aria-label={`Đưa câu ${i + 1} xuống`} disabled={busy || i === rows.length - 1} onClick={() => reorder(i, i + 1)}><ArrowDown size={18} aria-hidden="true" /></button>
                        <ConfirmButton className="adm-icon is-danger" confirmLabel="Xóa?" disabled={busy} onConfirm={() => act(() => supabase.rpc('delete_question', { p_question: d.id }), 'Đã xóa câu hỏi.')}>
                          <Trash2 size={18} aria-label={`Xóa câu ${i + 1}`} />
                        </ConfirmButton>
                      </>
                    )}
                  </div>
                </li>
              ),
            )}
          </ol>
        )}
      </section>

      {previewDraft && <QuestionPreview draft={previewDraft} onClose={() => setPreviewDraft(null)} />}
    </div>
  );
}
