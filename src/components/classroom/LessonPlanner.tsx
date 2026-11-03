'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Copy, FileDown, FilePlus2, MonitorPlay, Save, Sparkles, Trash2, Undo2, Maximize2, Minimize2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  SUBJECT_NAMES, addDays, blankPlan, generatePlan, isPlan, mondayOf, subjectNameOf, viDate, weekdayVi,
  type LessonInfo, type LessonPlan, type PlanSubject,
} from '@/lib/plans/generate';
import { plansDocument, weekDocument } from '@/lib/plans/word';
import { fitWeekFont } from '@/lib/plans/fit';
import type { SubjectCode } from '@/lib/types';
import ScheduleImport from './ScheduleImport';
import PlanLibrary from './PlanLibrary';
import DocPreview from './DocPreview';
import PlanWorkspace from './PlanWorkspace';
import type { LibraryMeta } from '@/lib/plans/library';
import { ToolIcon } from '@/components/classroom/tool-icons';

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
  const [preview, setPreview] = useState<{ title: string; filename: string; html: string; single?: boolean; note?: string } | null>(null);

  useEffect(() => { setLessonId((cur) => (lessons.some((l) => l.id === cur) ? cur : lessons[0]?.id ?? '')); }, [lessons]);

  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_list_plans', { p_class: null });
    if (error) { setCanSave(!notReady(error.message)); if (notReady(error.message)) setMsg({ kind: 'info', text: MIGRATION_HINT }); return; }
    setSaved((data ?? []) as Saved[]);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  // hoàn tác: lưu trạng thái trước mỗi đợt sửa (gộp các lần gõ liên tiếp trong 1 giây)
  const history = useRef<LessonPlan[]>([]);
  const lastPush = useRef(0);
  const [, bump] = useState(0);
  const edit = useCallback((fn: (p: LessonPlan) => LessonPlan) => {
    setPlan((p) => {
      if (!p) return p;
      if (Date.now() - lastPush.current > 1000) { history.current = [...history.current.slice(-49), p]; lastPush.current = Date.now(); bump((x) => x + 1); }
      return fn(p);
    });
    setDirty(true);
  }, []);
  const undo = () => { const prev = history.current.pop(); if (prev) { setPlan(prev); setDirty(true); lastPush.current = 0; bump((x) => x + 1); } };
  const [view, setView] = useState<'split' | 'form'>(() => { try { return localStorage.getItem('edukid:plan-view') === 'form' ? 'form' : 'split'; } catch { return 'split'; } });
  const pickView = (v: 'split' | 'form') => { setView(v); try { localStorage.setItem('edukid:plan-view', v); } catch { /* bỏ qua */ } };
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  // soạn toàn màn hình (3 cột rộng rãi); Esc để thu nhỏ
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [full]);

  const confirmDiscard = () => !dirty || window.confirm('Giáo án đang soạn chưa lưu. Bỏ thay đổi?');

  const create = (blank = false) => {
    if (!confirmDiscard()) return;
    const base = blank ? blankPlan(subject, grade, className)
      : (() => { const i = lessons.findIndex((l) => l.id === lessonId); return generatePlan({ subject, grade, className, lesson: lessons[i] ?? null, prevTitle: i > 0 ? lessons[i - 1].title : '', weakForms: weakForms[subject], date, period }); })();
    setPlan({ ...base, date, period });
    setPlanId(null);
    setDirty(true);
    history.current = []; setFull(true);
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
    history.current = []; setFull(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (asNew = false, silent = false) => {
    if (!plan) return;
    if (plan.title.trim().length < 2) { if (!silent) setMsg({ kind: 'error', text: 'Nhập tên bài trước khi lưu.' }); return; }
    if (!silent) setBusy(true);
    const { data, error } = await createClient().rpc('teacher_save_plan', {
      p_plan: asNew ? null : planId, p_class: classId, p_title: plan.title.trim().slice(0, 200), p_subject: plan.subject, p_grade: plan.grade,
      p_date: plan.date || null, p_period: plan.period || null, p_data: plan,
    });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? MIGRATION_HINT : /subject_check/i.test(error.message) ? SUBJECT_HINT : 'Chưa lưu được. Thử lại sau.' });
    setPlanId(data as string);
    setDirty(false);
    setSavedAt(new Date());
    if (silent) return;
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
    history.current = []; setFull(true);
    setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // tự lưu: giáo án đã lưu một lần thì 4 giây sau lần sửa cuối tự lưu lại
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    if (!dirty || !planId || !canSave || busy) return;
    const t = setTimeout(() => void saveRef.current(false, true), 4000);
    return () => clearTimeout(t);
  }, [plan, dirty, planId, canSave, busy]);

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
    const fit = fitWeekFont((f) => weekDocument(week, plans, school, className, false, [], { font: f }));
    setPreview({ title: `Kế hoạch dạy học tuần ${viDate(week)}${withPlans ? ` + ${plans.length} giáo án` : ''}`, filename: `ke-hoach-day-hoc-tuan-${week}`, html: weekDocument(week, plans, school, className, withPlans, [], { font: fit?.font }), note: fit ? (fit.fits ? `Lịch tuần vừa 1 trang (cỡ chữ bảng ${String(fit.font).replace('.', ',')})` : 'Lịch tuần quá dài: ở cỡ chữ 8 vẫn tràn sang trang 2 — rút gọn cột ND tích hợp / tên bài') : undefined });
  };

  return (
    <div className="planner">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><ToolIcon k="ke-hoach" /> Kế hoạch bài dạy</h1>
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
        <section ref={editorRef} className={`dash-section planner-card planner-editor${full ? ' is-full' : ''}`} aria-labelledby="pl-edit">
          <div className="planner-edit-head">
            <h2 id="pl-edit">{planId ? 'Sửa giáo án' : 'Giáo án mới'} · {subjectNameOf(plan)}{dirty ? <span className="planner-dirty"> · {planId ? 'đang lưu tự động…' : 'chưa lưu'}</span> : savedAt ? <span className="pw-saved"> · ✓ đã lưu {savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span> : null}</h2>
            <div className="planner-actions">
              <div className="praise-seg" role="radiogroup" aria-label="Cách hiển thị">
                <button type="button" role="radio" aria-checked={view === 'split'} className={view === 'split' ? 'is-on' : ''} onClick={() => pickView('split')}>◫ Cạnh nhau</button>
                <button type="button" role="radio" aria-checked={view === 'form'} className={view === 'form' ? 'is-on' : ''} onClick={() => pickView('form')}>Chỉ khung soạn</button>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setFull(!full)}>{full ? <><Minimize2 aria-hidden="true" /> Thu nhỏ</> : <><Maximize2 aria-hidden="true" /> Toàn màn hình</>}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={undo} disabled={!history.current.length} title="Hoàn tác"><Undo2 aria-hidden="true" /> Hoàn tác</button>
              {planId && plan.date
                ? <Link className="btn btn-outline btn-sm" href={`/giao-vien/lop/${classId}/bai-giang-3d?tab=tg&plan=${planId}`}><MonitorPlay aria-hidden="true" /> Tạo bài thao giảng</Link>
                : <button type="button" className="btn btn-outline btn-sm" disabled title="Lưu giáo án (có ngày dạy) trước"><MonitorPlay aria-hidden="true" /> Tạo bài thao giảng</button>}
              <button type="button" className="btn btn-primary btn-sm" disabled={busy || !canSave} onClick={() => void save(false)}><Save aria-hidden="true" /> Lưu</button>
              {planId && <button type="button" className="btn btn-outline btn-sm" disabled={busy || !canSave} onClick={() => void save(true)}>Lưu thành bản mới</button>}
              <button type="button" className="btn btn-outline btn-sm" onClick={duplicate}><Copy aria-hidden="true" /> Nhân bản cho tiết khác</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={exportPlan}><FileDown aria-hidden="true" /> Xem trước &amp; tải Word</button>
            </div>
          </div>

          <PlanWorkspace plan={plan} edit={edit} school={school} weak={(weakForms as Record<string, string[]>)[plan.subject] ?? []} view={view} />
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
          extra={preview.note ? <span className={`pv-fit${/tràn/.test(preview.note) ? ' is-bad' : ''}`}>{/tràn/.test(preview.note) ? '⚠️' : '✅'} {preview.note}</span> : undefined}
          onSaveOrig={preview.single && plan?.orig ? (h) => { edit((p) => ({ ...p, orig: { html: h } })); setPreview(null); setMsg({ kind: 'info', text: 'Đã cập nhật bản gốc của giáo án theo phần sửa trên bản xem trước. Bấm Lưu để lưu lại.' }); } : undefined} />
      )}
    </div>
  );
}
