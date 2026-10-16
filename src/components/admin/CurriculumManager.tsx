'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Power } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { errorText } from '@/lib/admin/questions';
import { TYPE_LABEL, type CatalogForm } from '@/lib/admin/types';
import { LEVEL_LABEL, STAGE_LABEL } from '@/lib/curriculum/grade1';
import { QUESTION_TYPES, type DbQuestionType } from '@/lib/types';
import { useAdminUser } from './AdminContext';

type Row = {
  topic_id: string; topic_code: string; topic_title: string; topic_core: boolean; topic_status: string;
  outcome_id: string | null; outcome_code: string | null; outcome_text: string | null; stage: number | null;
  outcome_core: boolean | null; outcome_status: string | null;
  lessons_total: number; lessons_published: number; questions_published: number; level1: number; level2: number; level3: number; level4?: number; level5?: number;
};
type TopicGroup = { id: string; code: string; title: string; core: boolean; status: string; outcomes: Row[] };
type TopicInfo = { id: string; description: string; sort_order: number };

const SUBJECTS = [
  { code: 'toan', name: 'Toán', tone: 'math' },
  { code: 'tieng-viet', name: 'Tiếng Việt', tone: 'viet' },
  { code: 'tieng-anh', name: 'Tiếng Anh', tone: 'english' },
];
const CODE_RE = /^[A-Z0-9][A-Z0-9_.-]{1,39}$/;

export default function CurriculumManager() {
  const me = useAdminUser();
  const supabase = useMemo(() => createClient(), []);
  const [grade, setGrade] = useState(1);
  const [family, setFamily] = useState('toan');
  const subjectCode = `${family}-${grade}`;

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [topicInfo, setTopicInfo] = useState<Record<string, TopicInfo>>({});
  const [forms, setForms] = useState<CatalogForm[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // 'topic:new' | 'topic:<id>' | 'outcome:new:<topicId>' | 'outcome:<id>' | 'form:new' | 'form:<id>'
  const [coreOnly, setCoreOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: subj } = await supabase.from('subjects').select('id').eq('code', subjectCode).maybeSingle();
    setSubjectId(subj?.id ?? null);
    const [cov, topics, f] = await Promise.all([
      supabase.rpc('curriculum_coverage', { p_subject_code: subjectCode }),
      subj ? supabase.from('curriculum_topics').select('id,description,sort_order').eq('subject_id', subj.id) : Promise.resolve({ data: [] }),
      supabase.from('exercise_forms').select('*').eq('subject_family', family).order('sort_order'),
    ]);
    if (cov.error) setMsg({ kind: 'error', text: errorText(cov.error) });
    setRows((cov.data ?? []) as Row[]);
    setTopicInfo(Object.fromEntries(((topics.data ?? []) as TopicInfo[]).map((t) => [t.id, t])));
    setForms((f.data ?? []) as CatalogForm[]);
    setLoading(false);
  }, [supabase, subjectCode, family]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, TopicGroup>();
    for (const r of rows) {
      if (!map.has(r.topic_id)) map.set(r.topic_id, { id: r.topic_id, code: r.topic_code, title: r.topic_title, core: r.topic_core, status: r.topic_status, outcomes: [] });
      if (r.outcome_id) map.get(r.topic_id)!.outcomes.push(r);
    }
    return [...map.values()];
  }, [rows]);

  const all = rows.filter((r) => r.outcome_id && r.outcome_status === 'active');
  const covered = all.filter((r) => r.questions_published > 0).length;
  const noLesson = all.filter((r) => r.lessons_total === 0).length;

  const run = async (fn: () => PromiseLike<{ error: { message?: string } | null }>, ok: string) => {
    setMsg(null);
    const { error } = await fn();
    if (error) {
      setMsg({ kind: 'error', text: errorText(error) });
      return false;
    }
    setMsg({ kind: 'ok', text: ok });
    setEditing(null);
    await load();
    return true;
  };

  return (
    <div className="adm-stack">
      <div className="adm-head">
        <div>
          <h1>Chương trình</h1>
          <p>Lớp → Môn → Chủ đề → Yêu cầu cần đạt → Bài học → Dạng bài. {me.isAdmin ? '' : 'Chỉ quản trị viên được sửa danh mục.'}</p>
        </div>
        <div className="adm-filters">
          <label className="adm-field is-inline">
            <span>Lớp</span>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="adm-tabs" role="tablist" aria-label="Môn học">
        {SUBJECTS.map((s) => (
          <button key={s.code} type="button" role="tab" aria-selected={family === s.code} className={`adm-tab ${s.tone}`} onClick={() => { setFamily(s.code); setEditing(null); }}>
            <span className="adm-dot" aria-hidden="true" /> {s.name} {grade}
          </button>
        ))}
      </div>

      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      {loading ? (
        <p className="adm-muted">Đang tải...</p>
      ) : (
        <>
          <div className="adm-stats">
            <div className="adm-stat"><span className="adm-stat-label">Chủ đề</span><strong className="adm-stat-value">{groups.length}</strong></div>
            <div className="adm-stat"><span className="adm-stat-label">Yêu cầu cần đạt</span><strong className="adm-stat-value">{all.length}</strong></div>
            <div className="adm-stat"><span className="adm-stat-label">YCCĐ đã có câu hỏi xuất bản</span><strong className="adm-stat-value">{covered}/{all.length}</strong></div>
            <div className="adm-stat"><span className="adm-stat-label">YCCĐ chưa có bài học</span><strong className="adm-stat-value">{noLesson}</strong></div>
          </div>

          <div className="adm-actions">
            <label className="adm-check">
              <input type="checkbox" checked={coreOnly} onChange={(e) => setCoreOnly(e.target.checked)} /> Chỉ hiện nội dung cốt lõi
            </label>
            <span className="adm-spacer" />
            {me.isAdmin && subjectId && (
              <button type="button" className="adm-btn is-primary" onClick={() => setEditing('topic:new')}><Plus size={16} aria-hidden="true" /> Thêm chủ đề</button>
            )}
          </div>

          {editing === 'topic:new' && subjectId && (
            <TopicForm
              initial={{ code: '', title: '', description: '', is_core: true, sort_order: groups.length + 1 }}
              onCancel={() => setEditing(null)}
              onSave={(v) => run(() => supabase.from('curriculum_topics').insert({ ...v, subject_id: subjectId }), 'Đã thêm chủ đề.')}
            />
          )}

          {groups.length === 0 && <p className="adm-alert is-info">Lớp {grade} môn này chưa có danh mục. {me.isAdmin ? 'Bấm “Thêm chủ đề” để bắt đầu.' : ''}</p>}

          {groups
            .filter((g) => !coreOnly || g.core)
            .map((g) => (
              <section key={g.id} className={`adm-card adm-topic${g.status !== 'active' ? ' is-off' : ''}`}>
                {editing === `topic:${g.id}` ? (
                  <TopicForm
                    initial={{ code: g.code, title: g.title, description: topicInfo[g.id]?.description ?? '', is_core: g.core, sort_order: topicInfo[g.id]?.sort_order ?? 0 }}
                    onCancel={() => setEditing(null)}
                    onSave={(v) => run(() => supabase.from('curriculum_topics').update(v).eq('id', g.id), 'Đã lưu chủ đề.')}
                  />
                ) : (
                  <div className="adm-card-head">
                    <div>
                      <p className="adm-muted">{g.code}</p>
                      <h2>{g.title} {!g.core && <span className="adm-tag is-ext">Mở rộng</span>} {g.status !== 'active' && <span className="adm-tag is-soft">Đã tắt</span>}</h2>
                      {topicInfo[g.id]?.description && <p className="adm-muted">{topicInfo[g.id].description}</p>}
                    </div>
                    <div className="adm-actions">
                      <Link className="adm-link" href={`/quan-tri/bai-hoc?mon=${family}&lop=${grade}`}>Bài học</Link>
                      {me.isAdmin && (
                        <>
                          <button type="button" className="adm-icon" aria-label={`Sửa chủ đề ${g.title}`} onClick={() => setEditing(`topic:${g.id}`)}><Pencil size={16} aria-hidden="true" /></button>
                          <button
                            type="button"
                            className="adm-icon"
                            aria-label={g.status === 'active' ? `Tắt chủ đề ${g.title}` : `Bật chủ đề ${g.title}`}
                            onClick={() => run(() => supabase.from('curriculum_topics').update({ status: g.status === 'active' ? 'inactive' : 'active' }).eq('id', g.id), 'Đã cập nhật trạng thái.')}
                          >
                            <Power size={16} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="adm-table-wrap">
                  <table className="adm-table adm-outcome-table">
                    <thead>
                      <tr>
                        <th scope="col">Mã</th>
                        <th scope="col">Yêu cầu cần đạt</th>
                        <th scope="col">Giai đoạn</th>
                        <th scope="col" title="Bài đã xuất bản / tổng số bài gắn YCCĐ này">Bài học</th>
                        <th scope="col" title={([1, 2, 3, 4, 5] as const).map((l) => LEVEL_LABEL[l]).join(' / ')}>Câu hỏi (L1/L2/L3/L4/L5)</th>
                        {me.isAdmin && <th scope="col"><span className="sr-only">Thao tác</span></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {g.outcomes
                        .filter((o) => !coreOnly || o.outcome_core)
                        .map((o) =>
                          editing === `outcome:${o.outcome_id}` ? (
                            <tr key={o.outcome_id}>
                              <td colSpan={6}>
                                <OutcomeForm
                                  initial={{ code: o.outcome_code ?? '', description: o.outcome_text ?? '', stage: (o.stage ?? 1) as 1 | 2 | 3, is_core: Boolean(o.outcome_core) }}
                                  onCancel={() => setEditing(null)}
                                  onSave={(v) => run(() => supabase.from('learning_outcomes').update(v).eq('id', o.outcome_id!), 'Đã lưu YCCĐ.')}
                                />
                              </td>
                            </tr>
                          ) : (
                            <tr key={o.outcome_id} className={o.outcome_status !== 'active' ? 'is-off' : o.questions_published === 0 ? 'is-gap' : ''}>
                              <td className="adm-outcome-code">{o.outcome_code}</td>
                              <td>
                                {o.outcome_text} {!o.outcome_core && <span className="adm-tag is-ext">Mở rộng</span>}
                                {o.outcome_status !== 'active' && <span className="adm-tag is-soft">Đã tắt</span>}
                              </td>
                              <td>{STAGE_LABEL[(o.stage ?? 1) as 1 | 2 | 3]}</td>
                              <td>{o.lessons_published}/{o.lessons_total}</td>
                              <td>
                                {o.questions_published === 0 ? (
                                  <span className="adm-tag is-warn">Chưa có</span>
                                ) : (
                                  <span className="adm-levels">{o.level1} / {o.level2} / {o.level3} / {o.level4 ?? 0} / {o.level5 ?? 0}</span>
                                )}
                              </td>
                              {me.isAdmin && (
                                <td className="adm-row-tools">
                                  <button type="button" className="adm-icon" aria-label={`Sửa ${o.outcome_code}`} onClick={() => setEditing(`outcome:${o.outcome_id}`)}><Pencil size={16} aria-hidden="true" /></button>
                                  <button
                                    type="button"
                                    className="adm-icon"
                                    aria-label={o.outcome_status === 'active' ? `Tắt ${o.outcome_code}` : `Bật ${o.outcome_code}`}
                                    onClick={() => run(() => supabase.from('learning_outcomes').update({ status: o.outcome_status === 'active' ? 'inactive' : 'active' }).eq('id', o.outcome_id!), 'Đã cập nhật trạng thái.')}
                                  >
                                    <Power size={16} aria-hidden="true" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ),
                        )}
                    </tbody>
                  </table>
                </div>

                {me.isAdmin &&
                  (editing === `outcome:new:${g.id}` ? (
                    <OutcomeForm
                      initial={{ code: `${g.code}.${String(g.outcomes.length + 1).padStart(2, '0')}`, description: '', stage: 1, is_core: g.core }}
                      onCancel={() => setEditing(null)}
                      onSave={(v) => run(() => supabase.from('learning_outcomes').insert({ ...v, topic_id: g.id, sort_order: g.outcomes.length + 1 }), 'Đã thêm YCCĐ.')}
                    />
                  ) : (
                    <div>
                      <button type="button" className="adm-btn is-ghost" onClick={() => setEditing(`outcome:new:${g.id}`)}><Plus size={16} aria-hidden="true" /> Thêm yêu cầu cần đạt</button>
                    </div>
                  ))}
              </section>
            ))}

          {/* Dạng bài */}
          <section className="adm-card">
            <div className="adm-card-head">
              <div>
                <h2>Dạng bài — {SUBJECTS.find((s) => s.code === family)?.name}</h2>
                <p className="adm-muted">Dùng chung cho mọi lớp của môn. Mỗi câu hỏi được gắn một dạng bài; cột “Kiểu câu” là giao diện mặc định khi chọn dạng bài.</p>
              </div>
              {me.isAdmin && <button type="button" className="adm-btn" onClick={() => setEditing('form:new')}><Plus size={16} aria-hidden="true" /> Thêm dạng bài</button>}
            </div>
            {editing === 'form:new' && (
              <FormForm
                initial={{ code: '', name: '', description: '', default_question_type: 'single_choice' }}
                onCancel={() => setEditing(null)}
                onSave={(v) => run(() => supabase.from('exercise_forms').insert({ ...v, subject_family: family, sort_order: forms.length + 1 }), 'Đã thêm dạng bài.')}
              />
            )}
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th scope="col">Mã</th>
                    <th scope="col">Dạng bài</th>
                    <th scope="col">Kiểu câu</th>
                    {me.isAdmin && <th scope="col"><span className="sr-only">Thao tác</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {forms.map((f) =>
                    editing === `form:${f.id}` ? (
                      <tr key={f.id}>
                        <td colSpan={4}>
                          <FormForm
                            initial={{ code: f.code, name: f.name, description: f.description, default_question_type: f.default_question_type }}
                            onCancel={() => setEditing(null)}
                            onSave={(v) => run(() => supabase.from('exercise_forms').update(v).eq('id', f.id), 'Đã lưu dạng bài.')}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={f.id} className={f.status !== 'active' ? 'is-off' : ''}>
                        <td className="adm-outcome-code">{f.code}</td>
                        <td>
                          <div className="adm-row-title">{f.name}</div>
                          <div className="adm-muted">{f.description}</div>
                        </td>
                        <td>{TYPE_LABEL[f.default_question_type]}</td>
                        {me.isAdmin && (
                          <td className="adm-row-tools">
                            <button type="button" className="adm-icon" aria-label={`Sửa dạng bài ${f.name}`} onClick={() => setEditing(`form:${f.id}`)}><Pencil size={16} aria-hidden="true" /></button>
                            <button type="button" className="adm-icon" aria-label={f.status === 'active' ? `Tắt ${f.name}` : `Bật ${f.name}`} onClick={() => run(() => supabase.from('exercise_forms').update({ status: f.status === 'active' ? 'inactive' : 'active' }).eq('id', f.id), 'Đã cập nhật trạng thái.')}>
                              <Power size={16} aria-hidden="true" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ---- Các form nhỏ ----

type TopicValues = { code: string; title: string; description: string; is_core: boolean; sort_order: number };
function TopicForm({ initial, onSave, onCancel }: { initial: TopicValues; onSave: (v: TopicValues) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  const codeOk = CODE_RE.test(v.code);
  return (
    <form className="adm-inline-form" onSubmit={(e) => { e.preventDefault(); if (codeOk && v.title.trim()) onSave({ ...v, title: v.title.trim(), description: v.description.trim() }); }}>
      <div className="adm-grid">
        <label className="adm-field"><span>Mã chủ đề</span><input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} placeholder="T1.SO" aria-invalid={!codeOk} /></label>
        <label className="adm-field"><span>Thứ tự</span><input type="number" min={0} value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: Number(e.target.value) })} /></label>
        <label className="adm-field is-wide"><span>Tên chủ đề</span><input value={v.title} maxLength={180} onChange={(e) => setV({ ...v, title: e.target.value })} /></label>
        <label className="adm-field is-wide"><span>Mô tả</span><textarea rows={2} maxLength={1000} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
      </div>
      <div className="adm-actions">
        <label className="adm-check"><input type="checkbox" checked={v.is_core} onChange={(e) => setV({ ...v, is_core: e.target.checked })} /> Nội dung cốt lõi</label>
        <span className="adm-spacer" />
        {!codeOk && <span className="adm-muted">Mã: chữ IN HOA, số, dấu chấm/gạch</span>}
        <button type="button" className="adm-btn is-ghost" onClick={onCancel}>Hủy</button>
        <button type="submit" className="adm-btn is-primary" disabled={!codeOk || !v.title.trim()}>Lưu chủ đề</button>
      </div>
    </form>
  );
}

type OutcomeValues = { code: string; description: string; stage: 1 | 2 | 3; is_core: boolean };
function OutcomeForm({ initial, onSave, onCancel }: { initial: OutcomeValues; onSave: (v: OutcomeValues) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  const codeOk = CODE_RE.test(v.code);
  return (
    <form className="adm-inline-form" onSubmit={(e) => { e.preventDefault(); if (codeOk && v.description.trim()) onSave({ ...v, description: v.description.trim() }); }}>
      <div className="adm-grid">
        <label className="adm-field"><span>Mã YCCĐ</span><input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} aria-invalid={!codeOk} /></label>
        <label className="adm-field">
          <span>Giai đoạn</span>
          <select value={v.stage} onChange={(e) => setV({ ...v, stage: Number(e.target.value) as 1 | 2 | 3 })}>
            {([1, 2, 3] as const).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="adm-field is-wide"><span>Yêu cầu cần đạt</span><textarea rows={2} maxLength={500} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
      </div>
      <div className="adm-actions">
        <label className="adm-check"><input type="checkbox" checked={v.is_core} onChange={(e) => setV({ ...v, is_core: e.target.checked })} /> Nội dung cốt lõi</label>
        <span className="adm-spacer" />
        <button type="button" className="adm-btn is-ghost" onClick={onCancel}>Hủy</button>
        <button type="submit" className="adm-btn is-primary" disabled={!codeOk || !v.description.trim()}>Lưu YCCĐ</button>
      </div>
    </form>
  );
}

type FormValues = { code: string; name: string; description: string; default_question_type: DbQuestionType };
function FormForm({ initial, onSave, onCancel }: { initial: FormValues; onSave: (v: FormValues) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  const codeOk = CODE_RE.test(v.code);
  return (
    <form className="adm-inline-form" onSubmit={(e) => { e.preventDefault(); if (codeOk && v.name.trim()) onSave({ ...v, name: v.name.trim(), description: v.description.trim() }); }}>
      <div className="adm-grid">
        <label className="adm-field"><span>Mã dạng bài</span><input value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} placeholder="TOAN.TINH" aria-invalid={!codeOk} /></label>
        <label className="adm-field">
          <span>Kiểu câu mặc định</span>
          <select value={v.default_question_type} onChange={(e) => setV({ ...v, default_question_type: e.target.value as DbQuestionType })}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="adm-field is-wide"><span>Tên dạng bài</span><input value={v.name} maxLength={120} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
        <label className="adm-field is-wide"><span>Mô tả</span><input value={v.description} maxLength={500} onChange={(e) => setV({ ...v, description: e.target.value })} /></label>
      </div>
      <div className="adm-actions">
        <span className="adm-spacer" />
        <button type="button" className="adm-btn is-ghost" onClick={onCancel}>Hủy</button>
        <button type="submit" className="adm-btn is-primary" disabled={!codeOk || !v.name.trim()}>Lưu dạng bài</button>
      </div>
    </form>
  );
}
