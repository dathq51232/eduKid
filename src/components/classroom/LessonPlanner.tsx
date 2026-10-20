'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Copy, FileDown, FilePlus2, NotebookPen, Save, Sparkles, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  SUBJECT_NAMES, addDays, blankPlan, generatePlan, isPlan, mondayOf, subjectNameOf, viDate, weekdayVi,
  type LessonInfo, type LessonPlan, type PlanActivity, type PlanSubject,
} from '@/lib/plans/generate';
import { plansDocument, weekDocument } from '@/lib/plans/word';
import type { SubjectCode } from '@/lib/types';
import ScheduleImport from './ScheduleImport';
import PlanLibrary from './PlanLibrary';
import DocPreview from './DocPreview';
import type { LibraryMeta } from '@/lib/plans/library';

type Saved = { id: string; class_id: string | null; class_name: string | null; subject: PlanSubject; grade: number; title: string; teach_date: string | null; period: number | null; updated_at: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const ALL_SUBJECTS: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];
const notReady = (m: string) => /function|does not exist|schema cache/i.test(m);
const MIGRATION_HINT = 'Chưa bật lưu giáo án: chạy supabase/migrations/0021_lesson_plans.sql và 0022_lesson_plans_subjects.sql trên Supabase. Vẫn soạn và tải Word được.';
const SUBJECT_HINT = 'Giáo án môn này cần chạy supabase/migrations/0022_lesson_plans_subjects.sql trên Supabase. Vẫn tải Word được.';
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Kế hoạch bài dạy: chọn bài → app soạn sẵn khung giáo án (yêu cầu cần đạt, đồ dùng, 4 hoạt động, đánh giá)
 * từ dữ liệu bài học và các dạng lớp còn hay sai; giáo viên sửa, lưu, nhân bản sang tiết khác, xuất Word,
 * tải lịch báo giảng cả tuần.
 */
export default function LessonPlanner({ classId, className, grade, school, weakForms, lessonsBySubject }: {
  classId: string; className: string; grade: number; school: string; weakForms: Record<SubjectCode, string[]>;
  lessonsBySubject: Record<SubjectCode, LessonInfo[]>;
}) {
  const [subject, setSubject] = useState<SubjectCode>('toan');
  const lessons = useMemo(() => lessonsBySubject[subject] ?? [], [lessonsBySubject, subject]);
  const [lessonId, setLessonId] = useState('');
  const [date, setDate] = useState(todayIso);
  const [period, setPeriod] = useState(1);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [canSave, setCanSave] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [week, setWeek] = useState(() => mondayOf(todayIso()));
  const [scope, setScope] = useState<'week' | 'all'>('week');
  const editorRef = useRef<HTMLElement>(null);
  const [library, setLibrary] = useState<LibraryMeta[]>([]);
  const [preview, setPreview] = useState<{ title: string; filename: string; html: string; single?: boolean } | null>(null);

  useEffect(() => { setLessonId((cur) => (lessons.some((l) => l.id === cur) ? cur : lessons[0]?.id ?? '')); }, [lessons]);

  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_list_plans', { p_class: null });
    if (error) { setCanSave(!notReady(error.message)); if (notReady(error.message)) setMsg({ kind: 'info', text: MIGRATION_HINT }); return; }
    setSaved((data ?? []) as Saved[]);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const edit = (fn: (p: LessonPlan) => LessonPlan) => { setPlan((p) => (p ? fn(p) : p)); setDirty(true); };
  const setAct = (i: number, patch: Partial<PlanActivity>) => edit((p) => ({ ...p, activities: p.activities.map((a, k) => (k === i ? { ...a, ...patch } : a)) }));

  const confirmDiscard = () => !dirty || window.confirm('Giáo án đang soạn chưa lưu. Bỏ thay đổi?');

  const create = (blank = false) => {
    if (!confirmDiscard()) return;
    const base = blank ? blankPlan(subject, grade, className)
      : (() => { const i = lessons.findIndex((l) => l.id === lessonId); return generatePlan({ subject, grade, className, lesson: lessons[i] ?? null, prevTitle: i > 0 ? lessons[i - 1].title : '', weakForms: weakForms[subject], date, period }); })();
    setPlan({ ...base, date, period });
    setPlanId(null);
    setDirty(true);
    setMsg({ kind: 'info', text: blank ? 'Đã tạo giáo án trống. Nhập tên bài và nội dung rồi bấm Lưu.' : 'Đã soạn sẵn giáo án gợi ý. Thầy cô đọc, sửa theo lớp mình rồi bấm Lưu.' });
  };

  const open = async (id: string) => {
    if (!confirmDiscard()) return;
    setBusy(true);
    const { data, error } = await createClient().rpc('teacher_get_plan', { p_plan: id });
    setBusy(false);
    const row = ((data ?? []) as { data: unknown }[])[0];
    if (error || !row || !isPlan(row.data)) return setMsg({ kind: 'error', text: 'Không mở được giáo án này.' });
    setPlan(row.data);
    setPlanId(id);
    setDirty(false);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (asNew = false) => {
    if (!plan) return;
    if (plan.title.trim().length < 2) return setMsg({ kind: 'error', text: 'Nhập tên bài trước khi lưu.' });
    setBusy(true);
    const { data, error } = await createClient().rpc('teacher_save_plan', {
      p_plan: asNew ? null : planId, p_class: classId, p_title: plan.title.trim().slice(0, 200), p_subject: plan.subject, p_grade: plan.grade,
      p_date: plan.date || null, p_period: plan.period || null, p_data: plan,
    });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : /subject_check/i.test(error.message) ? SUBJECT_HINT : 'Chưa lưu được. Thử lại sau.' });
    setPlanId(data as string);
    setDirty(false);
    setMsg({ kind: 'ok', text: asNew ? 'Đã lưu thành giáo án mới.' : 'Đã lưu giáo án.' });
    void refresh();
  };

  /** Nhân bản: dùng lại giáo án cũ cho ngày/tiết khác (giữ nội dung, bỏ phần điều chỉnh sau bài dạy) */
  const duplicate = () => {
    if (!plan) return;
    const next = addDays(plan.date || todayIso(), 7);
    setPlan({ ...plan, date: next, className, adjust: '' });
    setPlanId(null);
    setDirty(true);
    setMsg({ kind: 'info', text: `Đã nhân bản sang ${weekdayVi(next)} ${viDate(next)}. Sửa ngày, tiết, nội dung rồi bấm Lưu.` });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Xoá giáo án này? Không khôi phục được.')) return;
    const { error } = await createClient().rpc('teacher_delete_plan', { p_plan: id });
    if (error) return setMsg({ kind: 'error', text: 'Chưa xoá được.' });
    if (id === planId) { setPlan(null); setPlanId(null); setDirty(false); }
    void refresh();
  };

  /** Mở một giáo án sinh từ lịch báo giảng vào khung soạn (chưa lưu) */
  const openDraft = (p: LessonPlan) => {
    if (!confirmDiscard()) return;
    setPlan(p);
    setPlanId(null);
    setDirty(true);
    setMsg({ kind: 'info', text: `Giáo án “${p.title}” (từ lịch báo giảng). Sửa rồi bấm Lưu.` });
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const exportPlan = () => plan && setPreview({ title: plan.title || 'Giáo án', filename: `giao-an-${plan.title || 'bai-hoc'}`, html: plansDocument([plan], school), single: true });

  const weekEnd = addDays(week, 6);
  const inWeek = saved.filter((s) => s.teach_date && s.teach_date >= week && s.teach_date <= weekEnd);
  const shown = scope === 'week' ? inWeek : saved;
  const exportWeek = async (withPlans: boolean) => {
    if (!inWeek.length) return setMsg({ kind: 'error', text: 'Tuần này chưa có giáo án nào có ngày dạy.' });
    setBusy(true);
    const sb = createClient();
    const got = await Promise.all(inWeek.map((s) => sb.rpc('teacher_get_plan', { p_plan: s.id })));
    setBusy(false);
    const plans = got.map((g) => ((g.data ?? []) as { data: unknown }[])[0]?.data).filter(isPlan);
    setPreview({ title: `Kế hoạch dạy học tuần ${viDate(week)}${withPlans ? ` + ${plans.length} giáo án` : ''}`, filename: `ke-hoach-day-hoc-tuan-${week}`, html: weekDocument(week, plans, school, className, withPlans) });
  };

  return (
    <div className="planner">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><NotebookPen aria-hidden="true" /> Kế hoạch bài dạy</h1>
          <p className="dash-muted">Chọn bài, app soạn sẵn khung giáo án: yêu cầu cần đạt, đồ dùng, 4 hoạt động (khởi động – khám phá – luyện tập – vận dụng) và đánh giá; phần luyện tập có sẵn các dạng lớp còn hay sai. Thầy cô sửa theo lớp mình, lưu, nhân bản cho tiết sau và tải Word để chỉnh theo mẫu của trường.</p>
        </div>
      </header>

      <ScheduleImport classId={classId} className={className} grade={grade} school={school} weakForms={weakForms} lessonsBySubject={lessonsBySubject}
        saved={saved} canSave={canSave} library={library} onOpen={openDraft} onPreview={setPreview} onSaved={(m) => { setWeek(m); setScope('week'); void refresh(); }} />

      <PlanLibrary grade={grade} className={className} onOpen={openDraft} onChange={setLibrary} />

      <section className="dash-section planner-card" aria-labelledby="pl-new">
        <h2 id="pl-new"><FilePlus2 aria-hidden="true" /> Soạn giáo án mới</h2>
        <div className="planner-new">
          <label className="adm-field"><span>Môn</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectCode)}>
              {ALL_SUBJECTS.filter((s) => (lessonsBySubject[s] ?? []).length).map((s) => <option key={s} value={s}>{SUBJECT_NAMES[s]} {grade}</option>)}
            </select>
          </label>
          <label className="adm-field planner-lesson"><span>Bài</span>
            <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Ngày dạy</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="adm-field planner-period"><span>Tiết</span><input type="number" min={1} max={10} value={period} onChange={(e) => setPeriod(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} /></label>
        </div>
        {weakForms[subject]?.length > 0 && (
          <p className="dash-muted planner-weak">Dạng {SUBJECT_NAMES[subject]} lớp còn hay sai (30 ngày): {weakForms[subject].slice(0, 3).join('; ')} — sẽ đưa vào phần Luyện tập.</p>
        )}
        <div className="planner-actions">
          <button type="button" className="btn btn-primary btn-sm" disabled={!lessonId || busy} onClick={() => create(false)}><Sparkles aria-hidden="true" /> Soạn giáo án gợi ý</button>
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => create(true)}>Giáo án trống (bài tự nhập)</button>
        </div>
      </section>

      {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}

      {plan && (
        <section ref={editorRef} className="dash-section planner-card planner-editor" aria-labelledby="pl-edit">
          <div className="planner-edit-head">
            <h2 id="pl-edit">{planId ? 'Sửa giáo án' : 'Giáo án mới'} · {subjectNameOf(plan)}{dirty && <span className="planner-dirty"> · chưa lưu</span>}</h2>
            <div className="planner-actions">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy || !canSave} onClick={() => void save(false)}><Save aria-hidden="true" /> Lưu</button>
              {planId && <button type="button" className="btn btn-outline btn-sm" disabled={busy || !canSave} onClick={() => void save(true)}>Lưu thành bản mới</button>}
              <button type="button" className="btn btn-outline btn-sm" onClick={duplicate}><Copy aria-hidden="true" /> Nhân bản cho tiết khác</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={exportPlan}><FileDown aria-hidden="true" /> Xem trước &amp; tải Word</button>
            </div>
          </div>

          <div className="planner-grid">
            <label className="adm-field planner-wide"><span>Tên bài</span><input value={plan.title} maxLength={200} onChange={(e) => edit((p) => ({ ...p, title: e.target.value }))} /></label>
            <label className="adm-field"><span>Ngày dạy</span><input type="date" value={plan.date} onChange={(e) => edit((p) => ({ ...p, date: e.target.value }))} /></label>
            <label className="adm-field"><span>Tiết</span><input type="number" min={1} max={10} value={plan.period || ''} onChange={(e) => edit((p) => ({ ...p, period: Math.max(0, Math.min(10, Number(e.target.value) || 0)) }))} /></label>
            <label className="adm-field"><span>Tuần</span><input value={plan.week} maxLength={10} placeholder="vd: 7" onChange={(e) => edit((p) => ({ ...p, week: e.target.value }))} /></label>
            <label className="adm-field"><span>Thời lượng (phút)</span><input type="number" min={20} max={90} value={plan.minutes} onChange={(e) => edit((p) => ({ ...p, minutes: Number(e.target.value) || 35 }))} /></label>
            <label className="adm-field"><span>Buổi</span><select value={plan.session ?? ''} onChange={(e) => edit((p) => ({ ...p, session: e.target.value }))}><option value="">—</option><option>Sáng</option><option>Chiều</option></select></label>
            <label className="adm-field"><span>Tiết PPCT</span><input value={plan.ppct ?? ''} maxLength={10} onChange={(e) => edit((p) => ({ ...p, ppct: e.target.value }))} /></label>
          </div>

          <h3>I. Yêu cầu cần đạt</h3>
          {plan.source && <p className="dash-muted">Từ kho giáo án của trường: {plan.source}</p>}
          {plan.orig && (
            <div className="planner-orig" role="group" aria-label="Bản xuất Word">
              <p>Giáo án có <b>bản gốc của trường</b>: giữ nguyên chữ, bảng tô màu, hình ảnh như file Word đã nạp. Bản xem trước và file Word xuất ra dùng:</p>
              <label><input type="radio" name="pl-orig" checked={plan.useOrig !== false} onChange={() => edit((p) => ({ ...p, useOrig: true }))} /> Bản gốc của trường (sửa trực tiếp trên bản xem trước)</label>
              <label><input type="radio" name="pl-orig" checked={plan.useOrig === false} onChange={() => edit((p) => ({ ...p, useOrig: false }))} /> Khung soạn bên dưới</label>
              <button type="button" className="mini-btn" onClick={exportPlan}><FileDown aria-hidden="true" /> Xem bản gốc</button>
            </div>
          )}
          <label className="adm-field"><span>1. {plan.goalLabels?.[0] ?? 'Kiến thức, kĩ năng'}</span><textarea rows={4} value={plan.goals.knowledge} onChange={(e) => edit((p) => ({ ...p, goals: { ...p.goals, knowledge: e.target.value } }))} /></label>
          <label className="adm-field"><span>2. {plan.goalLabels?.[1] ?? 'Năng lực'}</span><textarea rows={2} value={plan.goals.competence} onChange={(e) => edit((p) => ({ ...p, goals: { ...p.goals, competence: e.target.value } }))} /></label>
          <label className="adm-field"><span>3. {plan.goalLabels?.[2] ?? 'Phẩm chất'}</span><textarea rows={2} value={plan.goals.quality} onChange={(e) => edit((p) => ({ ...p, goals: { ...p.goals, quality: e.target.value } }))} /></label>
          <label className="adm-field"><span>4. Nội dung tích hợp (nếu có)</span><textarea rows={2} value={plan.integration ?? ''} placeholder="vd: GDĐP, Quyền con người, Bảo vệ môi trường…" onChange={(e) => edit((p) => ({ ...p, integration: e.target.value }))} /></label>

          <h3>II. Đồ dùng dạy học</h3>
          <div className="planner-two">
            <label className="adm-field"><span>Giáo viên</span><textarea rows={2} value={plan.materials.teacher} onChange={(e) => edit((p) => ({ ...p, materials: { ...p.materials, teacher: e.target.value } }))} /></label>
            <label className="adm-field"><span>Học sinh</span><textarea rows={2} value={plan.materials.student} onChange={(e) => edit((p) => ({ ...p, materials: { ...p.materials, student: e.target.value } }))} /></label>
          </div>

          <h3>III. Các hoạt động dạy học chủ yếu</h3>
          {plan.activities.map((a, i) => (
            <fieldset key={i} className="planner-act">
              <legend><input className="planner-act-title" value={a.title} aria-label="Tên hoạt động" onChange={(e) => setAct(i, { title: e.target.value })} /> <input className="planner-min" type="number" min={0} max={60} value={a.minutes} aria-label={`Số phút: ${a.title}`} onChange={(e) => setAct(i, { minutes: Number(e.target.value) || 0 })} /> phút</legend>
              <label className="adm-field"><span>Mục tiêu</span><textarea rows={a.goal.length > 120 ? 3 : 1} value={a.goal} onChange={(e) => setAct(i, { goal: e.target.value })} /></label>
              <div className="planner-two">
                <label className="adm-field"><span>Hoạt động của giáo viên</span><textarea rows={Math.min(16, Math.max(6, a.teacher.split('\n').length + 1))} value={a.teacher} onChange={(e) => setAct(i, { teacher: e.target.value })} /></label>
                <label className="adm-field"><span>Hoạt động của học sinh</span><textarea rows={Math.min(16, Math.max(6, a.student.split('\n').length + 1))} value={a.student} onChange={(e) => setAct(i, { student: e.target.value })} /></label>
              </div>
            </fieldset>
          ))}
          <p className="dash-muted">Tổng thời gian: {plan.activities.reduce((n, a) => n + (a.minutes || 0), 0)}/{plan.minutes} phút.</p>
          <label className="adm-field"><span>Đánh giá</span><textarea rows={2} value={plan.assessment} onChange={(e) => edit((p) => ({ ...p, assessment: e.target.value }))} /></label>
          <h3>IV. Điều chỉnh sau bài dạy</h3>
          <label className="adm-field"><span>Ghi lại sau khi dạy (để lần sau dùng lại giáo án tốt hơn)</span><textarea rows={3} value={plan.adjust} onChange={(e) => edit((p) => ({ ...p, adjust: e.target.value }))} /></label>
          {plan.lessonId && (plan.subject === 'toan' || plan.subject === 'tieng-viet' || plan.subject === 'tieng-anh') && <p className="dash-muted">Bài luyện của học sinh: <Link href={`/lam-bai?lessonId=${plan.lessonId}&subject=${plan.subject}&grade=${plan.grade}`}>mở “{plan.title}” trên app</Link>.</p>}
        </section>
      )}

      <section className="dash-section planner-card" aria-labelledby="pl-saved">
        <div className="planner-edit-head">
          <h2 id="pl-saved"><CalendarDays aria-hidden="true" /> Giáo án đã lưu</h2>
          <div className="praise-seg" role="radiogroup" aria-label="Phạm vi">
            <button type="button" role="radio" aria-checked={scope === 'week'} className={scope === 'week' ? 'is-on' : ''} onClick={() => setScope('week')}>Theo tuần</button>
            <button type="button" role="radio" aria-checked={scope === 'all'} className={scope === 'all' ? 'is-on' : ''} onClick={() => setScope('all')}>Tất cả ({saved.length})</button>
          </div>
        </div>
        {scope === 'week' && (
          <div className="planner-week">
            <button type="button" className="mini-btn" onClick={() => setWeek(addDays(week, -7))}>‹ Tuần trước</button>
            <strong>{viDate(week)} – {viDate(addDays(week, 4))}</strong>
            <button type="button" className="mini-btn" onClick={() => setWeek(addDays(week, 7))}>Tuần sau ›</button>
            <span className="planner-spacer" />
            <button type="button" className="mini-btn" disabled={busy} onClick={() => void exportWeek(false)}><FileDown aria-hidden="true" /> Xem trước lịch báo giảng</button>
            <button type="button" className="mini-btn" disabled={busy} onClick={() => void exportWeek(true)}><FileDown aria-hidden="true" /> Xem trước lịch + giáo án cả tuần</button>
          </div>
        )}
        {shown.length === 0 ? (
          <p className="dash-muted">{scope === 'week' ? 'Tuần này chưa có giáo án nào. Soạn ở mục trên rồi bấm Lưu.' : 'Chưa có giáo án nào được lưu.'}</p>
        ) : (
          <div className="table-scroll">
            <table className="roster-table planner-table">
              <thead><tr><th>Ngày</th><th>Tiết</th><th>Môn</th><th>Tên bài</th><th>Lớp</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id} className={s.id === planId ? 'is-on' : ''}>
                    <td>{s.teach_date ? `${weekdayVi(s.teach_date)} ${viDate(s.teach_date)}` : '—'}</td>
                    <td>{s.period ?? ''}</td>
                    <td>{SUBJECT_NAMES[s.subject] ?? s.subject} {s.grade}</td>
                    <td className="planner-title">{s.title}</td>
                    <td>{s.class_name ?? ''}</td>
                    <td className="planner-row-actions">
                      <button type="button" className="mini-btn" onClick={() => void open(s.id)}>Mở</button>
                      <button type="button" className="mini-btn is-danger" aria-label={`Xoá ${s.title}`} onClick={() => void remove(s.id)}><Trash2 aria-hidden="true" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="dash-muted">Giáo án thuộc về thầy cô: lớp cũ đã lưu trữ vẫn mở lại được để dùng cho lớp mới (Mở → Nhân bản → Lưu).</p>
      </section>
      {preview && (
        <DocPreview title={preview.title} filename={preview.filename} html={preview.html} onClose={() => setPreview(null)}
          onSaveOrig={preview.single && plan?.orig ? (h) => { edit((p) => ({ ...p, orig: { html: h } })); setPreview(null); setMsg({ kind: 'info', text: 'Đã cập nhật bản gốc của giáo án theo phần sửa trên bản xem trước. Bấm Lưu để lưu lại.' }); } : undefined} />
      )}
    </div>
  );
}
