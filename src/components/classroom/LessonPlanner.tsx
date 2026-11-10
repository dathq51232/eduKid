'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Copy, FileDown, FileSpreadsheet, FilePlus2, MonitorPlay, Save, Sparkles, Trash2, Undo2, Maximize2, Minimize2, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  SUBJECT_NAMES, addDays, blankPlan, generatePlan, isPlan, mondayOf, subjectNameOf, viDate, weekdayVi,
  type LessonInfo, type LessonPlan, type PlanSubject,
} from '@/lib/plans/generate';
import { plansDocument } from '@/lib/plans/word';
import { weekExport, weekSheet, loadWeekOpts, saveWeekOpts, DEFAULT_WEEK_OPTS, type WeekArgs, type WeekOpts } from '@/lib/plans/week-export';
import { downloadXlsx } from '@/lib/xlsx';
import type { SubjectCode } from '@/lib/types';
import ScheduleImport from './ScheduleImport';
import PlanLibrary from './PlanLibrary';
import DocPreview from './DocPreview';
import PlanWorkspace from './PlanWorkspace';
import PlanWeekBoard from './PlanWeekBoard';
import type { DeckRow } from '@/components/deck/DeckHome';
import type { LibraryMeta } from '@/lib/plans/library';
import { ToolIcon } from '@/components/classroom/tool-icons';

type Saved = { id: string; class_id: string | null; class_name: string | null; subject: PlanSubject; grade: number; title: string; teach_date: string | null; period: number | null; updated_at: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const ALL_SUBJECTS: SubjectCode[] = ['toan', 'tieng-viet', 'tieng-anh'];
const notReady = (m: string) => /function|does not exist|schema cache/i.test(m);
const MIGRATION_HINT = 'Chưa bật lưu giáo án: chạy supabase/migrations/0021_lesson_plans.sql và 0022_lesson_plans_subjects.sql trên Supabase. Vẫn soạn và tải Word được.';
const SUBJECT_HINT = 'Giáo án môn này cần chạy supabase/migrations/0022_lesson_plans_subjects.sql trên Supabase. Vẫn tải Word được.';
// Bài giảng & 3D đã tách thành mục riêng (/giao-vien/lop/[id]/bai-giang-3d), cùng cấp Kế hoạch bài dạy.
type Tab = 'tuan' | 'kho' | 'da-luu' | 'mau';
const TABS: Tab[] = ['tuan', 'kho', 'da-luu', 'mau'];
const LEAD: Record<Tab, string> = {
  tuan: 'Mỗi tiết trong tuần là một thẻ: bấm để soạn giáo án, tạo bài giảng, mở phiếu của tiết đó.',
  kho: 'Giáo án Word của trường, tách sẵn từng tiết — khi nạp lịch báo giảng, tiết nào có trong kho được dùng ngay.',
  'da-luu': 'Mọi giáo án đã lưu, kể cả của lớp cũ — mở, nhân bản cho lớp mới.',
  mau: 'Cách in lịch báo giảng tuần cho vừa 1 trang.',
};
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Kế hoạch bài dạy: chọn bài → app soạn sẵn khung giáo án (yêu cầu cần đạt, đồ dùng, 4 hoạt động, đánh giá)
 * từ dữ liệu bài học và các dạng lớp còn hay sai; giáo viên sửa, lưu, nhân bản sang tiết khác, xuất Word,
 * tải lịch báo giảng cả tuần.
 */
export default function LessonPlanner({ classId, className, grade, school, weakForms, lessonsBySubject, decks, initialTab }: {
  classId: string; className: string; grade: number; school: string; weakForms: Record<SubjectCode, string[]>;
  lessonsBySubject: Record<SubjectCode, LessonInfo[]>;
  /** bài thao giảng đã gắn giáo án (hiện trên thẻ tiết ở Tuần dạy) */
  decks: DeckRow[];
  /** mở sẵn mục (?tab=) */
  initialTab?: string;
}) {
  const [tab, setTab] = useState<Tab>(() => (TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'tuan'));
  const go = (t: Tab) => { setTab(t); try { const u = new URL(window.location.href); u.searchParams.set('tab', t); window.history.replaceState(null, '', u); } catch { /* bỏ qua */ } };
  const router = useRouter();
  /** Tạo bài thao giảng từ giáo án → mở mục Bài giảng & 3D */
  const deckHref = (planId: string) => `/giao-vien/lop/${classId}/bai-giang-3d?plan=${planId}`;
  const [importOpen, setImportOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [drafts, setDrafts] = useState<LessonPlan[]>([]);
  const [details, setDetails] = useState<Map<string, LessonPlan>>(new Map());
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
  const [scope, setScope] = useState<'week' | 'all'>('all');
  const editorRef = useRef<HTMLElement>(null);
  const [library, setLibrary] = useState<LibraryMeta[]>([]);
  const [preview, setPreview] = useState<{ title: string; filename: string; html?: string; single?: boolean; week?: WeekArgs } | null>(null);
  // lịch báo giảng: mẫu trường A4 dọc / trang ngang, rút gọn ND tích hợp, giãn hàng — nhớ lựa chọn trên máy
  const [wopts, setWopts] = useState<WeekOpts>(DEFAULT_WEEK_OPTS);
  useEffect(() => { setWopts(loadWeekOpts()); }, []);
  const setWo = (p: Partial<WeekOpts>) => setWopts((o) => { const n = { ...o, ...p }; saveWeekOpts(n); return n; });
  const weekBuilt = useMemo(() => (preview?.week ? weekExport(preview.week, wopts) : null), [preview, wopts]);

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
  // nội dung giáo án của tuần (buổi, PPCT, kho) cho lưới Tuần dạy
  const weekIds = inWeek.map((x) => `${x.id}@${x.updated_at}`).join(',');
  useEffect(() => {
    const need = inWeek.filter((x) => !details.has(x.id) || (details.get(x.id) as LessonPlan & { _u?: string })._u !== x.updated_at);
    if (!need.length) return;
    let live = true;
    const sb = createClient();
    void Promise.all(need.map((x) => sb.rpc('teacher_get_plan', { p_plan: x.id }).then((g) => [x, ((g.data ?? []) as { data: unknown }[])[0]?.data] as const))).then((got) => {
      if (!live) return;
      setDetails((old) => { const m = new Map(old); for (const [x, d] of got) if (isPlan(d)) m.set(x.id, Object.assign(d, { _u: x.updated_at })); return m; });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekIds]);
  const exportWeek = async (withPlans: boolean) => {
    if (!inWeek.length) return setMsg({ kind: 'error', text: 'Tuần này chưa có giáo án nào có ngày dạy.' });
    setBusy(true);
    const sb = createClient();
    const got = await Promise.all(inWeek.map((s) => sb.rpc('teacher_get_plan', { p_plan: s.id })));
    setBusy(false);
    const plans = got.map((g) => ((g.data ?? []) as { data: unknown }[])[0]?.data).filter(isPlan);
    setPreview({ title: `Kế hoạch dạy học tuần ${viDate(week)}${withPlans ? ` + ${plans.length} giáo án` : ''}`, filename: `ke-hoach-day-hoc-tuan-${week}`, week: { monday: week, plans, school, className, withPlans } });
  };

  const MENU: [Tab, string, number | null][] = [
    ['tuan', '📅 Tuần dạy', null], ['kho', '📚 Kho giáo án', library.length],
    ['da-luu', '🗂 Đã lưu (tất cả)', saved.length], ['mau', '⚙️ Mẫu in lịch báo giảng', null],
  ];
  return (
    <div className="planner kh">
      <nav className="kh-side" aria-label="Kế hoạch bài dạy">
        <p className="kh-side-k">Lớp {className} · Khối {grade}</p>
        {MENU.map(([k, label, n]) => (
          <button key={k} type="button" className={tab === k ? 'is-on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>
            <span>{label}</span>{n !== null && <small>{n}</small>}
          </button>
        ))}
      </nav>

      <div className="kh-main">
        <header className="kh-head">
          <div>
            <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
            <h1><ToolIcon k="ke-hoach" /> Kế hoạch bài dạy</h1>
            <p className="dash-muted kh-lead">{LEAD[tab]}</p>
          </div>
          {tab === 'tuan' && (
            <div className="kh-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setImportOpen(true)}><Upload aria-hidden="true" /> Nạp lịch báo giảng</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setNewOpen(true)}><FilePlus2 aria-hidden="true" /> Soạn tiết lẻ</button>
              <details className="kh-menu">
                <summary className="btn btn-outline btn-sm"><FileDown aria-hidden="true" /> Xuất Word tuần ▾</summary>
                <div>
                  <button type="button" disabled={busy} onClick={(e) => { (e.currentTarget.closest('details') as HTMLDetailsElement).open = false; void exportWeek(false); }}>Lịch báo giảng tuần</button>
                  <button type="button" disabled={busy} onClick={(e) => { (e.currentTarget.closest('details') as HTMLDetailsElement).open = false; void exportWeek(true); }}>Lịch + giáo án cả tuần</button>
                </div>
              </details>
            </div>
          )}
        </header>

        {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}

        {tab === 'tuan' && (
          <PlanWeekBoard classId={classId} week={week} setWeek={setWeek} saved={inWeek} details={details} drafts={drafts} decks={decks} busy={busy}
            weak={Object.values(weakForms).flat()}
            onOpen={(id) => void open(id)} onOpenDraft={openDraft} onRemove={(id) => void remove(id)}
            onPreviewPlan={(pl) => setPreview({ title: pl.title || 'Giáo án', filename: `giao-an-${pl.title || 'bai-hoc'}`, html: plansDocument([pl], school) })}
            onExportWeek={(w) => void exportWeek(w)} onImport={() => setImportOpen(true)} onMakeDeck={(id) => router.push(deckHref(id))} />
        )}

        {/* kho luôn gắn sẵn (để gợi ý giáo án từ kho khi nạp lịch), chỉ hiện ở mục Kho giáo án */}
        <div hidden={tab !== 'kho'}><PlanLibrary grade={grade} className={className} onOpen={openDraft} onChange={setLibrary} /></div>

        {tab === 'da-luu' && (
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
        )}

        {tab === 'mau' && (
          <section className="dash-section planner-card">
            <h2>Mẫu in lịch báo giảng</h2>
            <p className="dash-muted">Lựa chọn dùng khi xem trước và tải lịch báo giảng tuần (Word, Excel). App nhớ trên máy này.</p>
            <div className="kh-opts">
              <label className="adm-field"><span>Mẫu</span><select value={wopts.layout} onChange={(e) => setWo({ layout: e.target.value as WeekOpts['layout'] })}><option value="school">Mẫu trường (A4 dọc, 8 cột)</option><option value="land">Trang ngang có quốc hiệu</option></select></label>
              <label className="adm-field"><span>ND tích hợp</span><select value={wopts.short} onChange={(e) => setWo({ short: e.target.value as WeekOpts['short'] })}><option value="auto">Rút gọn khi cần (vừa 1 trang)</option><option value="full">Đầy đủ</option></select></label>
              <label className="pv-chk kh-chk"><input type="checkbox" checked={wopts.stretch} onChange={(e) => setWo({ stretch: e.target.checked })} /> Tuần ít tiết: giãn hàng cho đầy trang</label>
            </div>
            <div className="planner-actions">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void exportWeek(false)}><FileDown aria-hidden="true" /> Xem trước lịch tuần {viDate(week)}</button>
            </div>
          </section>
        )}

        {/* Nạp lịch báo giảng: cửa sổ riêng, giữ kết quả khi đóng / mở lại */}
        <div className="kh-modal" hidden={!importOpen} role="dialog" aria-modal="true" aria-label="Nạp lịch báo giảng">
          <div className="kh-modal-box">
            <button type="button" className="kh-x" aria-label="Đóng" onClick={() => setImportOpen(false)}><X aria-hidden="true" /></button>
            <ScheduleImport classId={classId} className={className} grade={grade} school={school} weakForms={weakForms} lessonsBySubject={lessonsBySubject}
              saved={saved} canSave={canSave} library={library} onItems={setDrafts}
              onOpen={(p) => { setImportOpen(false); openDraft(p); }} onPreview={(p) => { setPreview(p); }}
              onSaved={(m) => { setWeek(m); setScope('week'); void refresh(); }} />
          </div>
        </div>
        {newOpen && (
          <div className="kh-modal" role="dialog" aria-modal="true" aria-label="Soạn tiết lẻ">
            <div className="kh-modal-box is-small">
              <button type="button" className="kh-x" aria-label="Đóng" onClick={() => setNewOpen(false)}><X aria-hidden="true" /></button>
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
          <button type="button" className="btn btn-primary btn-sm" disabled={!lessonId || busy} onClick={() => { setNewOpen(false); create(false); }}><Sparkles aria-hidden="true" /> Soạn giáo án gợi ý</button>
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => { setNewOpen(false); create(true); }}>Giáo án trống (bài tự nhập)</button>
        </div>
      </section>

            </div>
          </div>
        )}

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
                ? <Link className="btn btn-outline btn-sm" href={deckHref(planId)}><MonitorPlay aria-hidden="true" /> Tạo bài thao giảng</Link>
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

      {preview && (
        <DocPreview title={preview.title} filename={preview.filename} html={weekBuilt?.html ?? preview.html ?? ''} onClose={() => setPreview(null)}
          below={preview.week && weekBuilt ? (
            <div className="pv-opts">
              <label>Mẫu <select value={wopts.layout} onChange={(e) => setWo({ layout: e.target.value as WeekOpts['layout'] })}><option value="school">Mẫu trường (A4 dọc)</option><option value="land">Trang ngang có quốc hiệu</option></select></label>
              <label>ND tích hợp <select value={wopts.short} onChange={(e) => setWo({ short: e.target.value as WeekOpts['short'] })}><option value="auto">Rút gọn khi cần</option><option value="full">Đầy đủ</option></select></label>
              <label className="pv-chk"><input type="checkbox" checked={wopts.stretch} onChange={(e) => setWo({ stretch: e.target.checked })} /> Giãn hàng cho đầy trang</label>
              <span className={`pv-fit${weekBuilt.bad ? ' is-bad' : ''}`}>{weekBuilt.bad ? '⚠️' : '✅'} {weekBuilt.note}</span>
              <span className="planner-spacer" />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => preview.week && downloadXlsx(`${preview.filename}.xlsx`, [weekSheet(preview.week, wopts)])}><FileSpreadsheet aria-hidden="true" /> Tải Excel lịch báo giảng</button>
            </div>
          ) : undefined}
          onSaveOrig={preview.single && plan?.orig ? (h) => { edit((p) => ({ ...p, orig: { html: h } })); setPreview(null); setMsg({ kind: 'info', text: 'Đã cập nhật bản gốc của giáo án theo phần sửa trên bản xem trước. Bấm Lưu để lưu lại.' }); } : undefined} />
      )}
      </div>
    </div>
  );
}
