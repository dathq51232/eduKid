'use client';

import { useMemo, useRef, useState } from 'react';
import { FileDown, FileSpreadsheet, Save, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/xlsx';
import { readXlsx } from '@/lib/xlsx-read';
import { addDays, mondayOf, viDate, weekdayVi, type LessonInfo, type LessonPlan } from '@/lib/plans/generate';
import { parseSchedule, plansFromSchedule, scheduleTemplate, withLibraryPlan, type RowPlan, type Schedule } from '@/lib/plans/schedule';
import { pickFromLibrary, type LibraryMeta } from '@/lib/plans/library';
import { isPlan } from '@/lib/plans/generate';
import { weekDocument } from '@/lib/plans/word';
import type { SubjectCode } from '@/lib/types';

type SavedLite = { teach_date: string | null; period: number | null; title: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const KIND_LABEL: Record<RowPlan['kind'], string> = { kho: 'Giáo án của trường', app: 'Theo bài trong app', review: 'Ôn tập / bổ sung', khung: 'Khung chung' };
const keyOf = (date: string, period: number, title: string) => `${date}|${period}|${title.trim().toLowerCase()}`;

/**
 * Tải lịch báo giảng (Excel theo mẫu của trường) → tự sinh giáo án cho từng tiết:
 * bài Toán / Tiếng Việt / Tiếng Anh có trong app dùng yêu cầu cần đạt, dạng bài, kiến thức của bài;
 * tiết ôn tập / bổ sung (BS) dùng khung ôn luyện theo bài trọng tâm của tuần; môn khác dùng khung chung của môn.
 */
export default function ScheduleImport({ classId, className, grade, school, weakForms, lessonsBySubject, saved, canSave, library, onOpen, onSaved, onPreview }: {
  classId: string; className: string; grade: number; school: string;
  weakForms: Record<SubjectCode, string[]>; lessonsBySubject: Record<SubjectCode, LessonInfo[]>;
  saved: SavedLite[]; canSave: boolean;
  /** danh mục kho giáo án của trường (không kèm nội dung) */
  library: LibraryMeta[];
  onOpen: (plan: LessonPlan) => void; onSaved: (monday: string) => void;
  onPreview: (p: { title: string; filename: string; html: string }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [sch, setSch] = useState<Schedule | null>(null);
  const [items, setItems] = useState<RowPlan[]>([]);
  const [pick, setPick] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [msg, setMsg] = useState<Msg>(null);

  const savedKeys = useMemo(() => new Set(saved.filter((s) => s.teach_date).map((s) => keyOf(s.teach_date!, s.period ?? 0, s.title))), [saved]);
  const exists = (r: RowPlan) => !!r.plan.date && savedKeys.has(keyOf(r.plan.date, r.plan.period, r.plan.title));

  const load = async (file: File) => {
    setMsg(null); setSch(null); setItems([]); setFileName(file.name);
    if (!/\.xlsx$/i.test(file.name)) return setMsg({ kind: 'error', text: 'Chỉ đọc được file .xlsx. Nếu là .xls, mở bằng Excel rồi “Lưu thành” Excel Workbook (.xlsx).' });
    if (file.size > 5_000_000) return setMsg({ kind: 'error', text: 'File quá lớn (tối đa 5 MB).' });
    try {
      const s = parseSchedule(await readXlsx(await file.arrayBuffer()));
      let list = plansFromSchedule(s, { grade, className, lessonsBySubject, weakForms });
      // ưu tiên giáo án trong kho của trường (đúng môn, khối, bài, tiết)
      if (library.length) {
        const g = s.grade ?? grade;
        const picks = pickFromLibrary(library, s.rows.map((r) => ({ subject: r.subject, extra: r.extra, grade: g, week: Number(s.week) || null, title: r.title, ppct: Number(r.ppct) || null, integration: r.integration })));
        const ids = [...new Set(picks.filter((x): x is LibraryMeta => !!x).map((x) => x.id))];
        if (ids.length) {
          const sb = createClient();
          const got = new Map<string, unknown>();
          for (let i = 0; i < ids.length; i += 25) {
            const { data } = await sb.rpc('library_get', { p_ids: ids.slice(i, i + 25) });
            for (const row of (data ?? []) as { id: string; data: unknown }[]) got.set(row.id, row.data);
          }
          list = list.map((rp, i) => { const m = picks[i]; const d = m ? got.get(m.id) : null; return m && isPlan(d) ? withLibraryPlan(rp, d, className) : rp; });
        }
      }
      setSch(s); setItems(list);
      setPick(list.map((r) => !(!!r.plan.date && savedKeys.has(keyOf(r.plan.date, r.plan.period, r.plan.title)))));
      if (s.grade !== null && s.grade !== grade) setMsg({ kind: 'info', text: `Lịch báo giảng là của khối ${s.grade}, lớp ${className} là khối ${grade}: giáo án dùng khung chung, không ghép bài của app. Kiểm tra lại file nếu nhầm.` });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không đọc được file.' });
    }
  };

  const chosen = items.filter((_, i) => pick[i]);
  const counts = useMemo(() => ({
    kho: items.filter((r) => r.kind === 'kho').length,
    app: items.filter((r) => r.kind === 'app').length, review: items.filter((r) => r.kind === 'review').length, khung: items.filter((r) => r.kind === 'khung').length,
  }), [items]);

  const saveAll = async () => {
    if (!chosen.length) return;
    setBusy(true); setMsg(null);
    const sb = createClient();
    let ok = 0, fail = 0, notMigrated = false;
    for (const r of chosen) {
      setProgress(`Đang lưu ${ok + fail + 1}/${chosen.length}…`);
      const p = r.plan;
      const { error } = await sb.rpc('teacher_save_plan', {
        p_plan: null, p_class: classId, p_title: p.title.trim().slice(0, 200), p_subject: p.subject, p_grade: p.grade,
        p_date: p.date || null, p_period: p.period || null, p_data: p,
      });
      if (error) { fail++; if (/subject_check|check constraint/i.test(error.message)) notMigrated = true; } else ok++;
    }
    setBusy(false); setProgress('');
    if (ok) { setPick(items.map(() => false)); onSaved(sch?.monday || mondayOf(chosen[0].plan.date)); }
    setMsg(fail
      ? { kind: 'error', text: `Đã lưu ${ok}/${chosen.length} giáo án. ${notMigrated ? 'Các môn ngoài Toán, Tiếng Việt, Tiếng Anh cần chạy supabase/migrations/0022_lesson_plans_subjects.sql trên Supabase.' : 'Một số giáo án chưa lưu được, thử lại sau.'}` }
      : { kind: 'ok', text: `Đã lưu ${ok} giáo án vào tuần ${sch?.week || ''}. Xem ở mục “Giáo án đã lưu”, mở từng tiết để sửa.` });
  };

  const exportWord = () => {
    if (!sch || !chosen.length) return;
    const monday = sch.monday || mondayOf(chosen[0].plan.date || new Date().toISOString().slice(0, 10));
    onPreview({ title: `Kế hoạch dạy học tuần ${sch.week || viDate(monday)} + ${chosen.length} giáo án`, filename: `ke-hoach-day-hoc-tuan-${sch.week || monday}`, html: weekDocument(monday, chosen.map((r) => r.plan), school, className, true) });
  };

  const template = () => {
    const today = new Date();
    const monday = mondayOf(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    downloadXlsx(`lich-bao-giang-mau-khoi-${grade}.xlsx`, [scheduleTemplate(grade, monday, '')]);
  };

  return (
    <section className="dash-section planner-card" aria-labelledby="pl-import">
      <h2 id="pl-import"><FileSpreadsheet aria-hidden="true" /> Tạo giáo án từ lịch báo giảng (Excel)</h2>
      <p className="dash-muted">Tải lên lịch báo giảng tuần theo mẫu của trường (cột Thứ/ngày · Buổi · Tiết TKB · Môn học · Tiết PPCT · Tên bài dạy · ND tích hợp/ĐDDH · Điều chỉnh). App tự soạn giáo án cho từng tiết: ưu tiên giáo án trong kho của trường (mục dưới) đúng môn, bài, tiết; còn lại bài Toán, Tiếng Việt, Tiếng Anh có trong app được soạn theo yêu cầu cần đạt và dạng bài của bài; tiết ôn tập, bổ sung (BS) theo bài trọng tâm của tuần; các môn khác theo khung chung của môn.</p>
      <div className="planner-actions">
        <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void load(f); }} />
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" /> Chọn file lịch báo giảng (.xlsx)</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={template}><FileDown aria-hidden="true" /> Tải file mẫu</button>
        {fileName && <span className="dash-muted">{fileName}</span>}
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}

      {sch && items.length > 0 && (
        <>
          <p className="planner-import-sum">
            <strong>{sch.week ? `Tuần ${sch.week}` : 'Lịch tuần'}</strong>
            {sch.monday && <> · {viDate(sch.monday)} – {viDate(addDays(sch.monday, 4))}</>}
            {sch.grade !== null && <> · Khối {sch.grade}</>} · {items.length} tiết: {counts.kho > 0 && <>{counts.kho} giáo án của trường, </>}{counts.app} theo bài trong app, {counts.review} ôn tập/bổ sung, {counts.khung} khung chung
          </p>
          {sch.warnings.map((w) => <p key={w} className="dash-muted">⚠ {w}</p>)}
          <div className="planner-week">
            <button type="button" className="mini-btn" onClick={() => setPick(items.map((r) => !exists(r)))}>Chọn tất cả</button>
            <button type="button" className="mini-btn" onClick={() => setPick(items.map(() => false))}>Bỏ chọn</button>
            <span className="planner-spacer" />
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || !chosen.length || !canSave} onClick={() => void saveAll()}><Save aria-hidden="true" /> {progress || `Lưu ${chosen.length} giáo án`}</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!chosen.length} onClick={exportWord}><FileDown aria-hidden="true" /> Xem trước &amp; tải Word: lịch + {chosen.length} giáo án</button>
          </div>
          <div className="table-scroll">
            <table className="roster-table planner-table planner-import">
              <thead><tr><th><span className="sr-only">Chọn</span></th><th>Thứ</th><th>Buổi</th><th>Tiết</th><th>Môn</th><th>Tên bài dạy</th><th>Giáo án</th><th><span className="sr-only">Xem</span></th></tr></thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={i} className={pick[i] ? 'is-on' : ''}>
                    <td><input type="checkbox" checked={!!pick[i]} aria-label={`Chọn ${r.plan.title}`} onChange={(e) => setPick((p) => p.map((x, k) => (k === i ? e.target.checked : x)))} /></td>
                    <td>{r.plan.date ? `${weekdayVi(r.plan.date).replace('Thứ ', '')} ${viDate(r.plan.date).slice(0, -5)}` : ''}</td>
                    <td>{r.row.session}</td>
                    <td>{r.row.period || ''}</td>
                    <td>{r.row.subjectLabel}</td>
                    <td className="planner-title">{r.plan.title}{r.row.integration && <span className="planner-int"> · Tích hợp: {r.row.integration.split('\n')[0]}</span>}</td>
                    <td><span className={`planner-kind is-${r.kind}`} title={r.lessonTitle || undefined}>{KIND_LABEL[r.kind]}</span>{r.lessonTitle && <span className="planner-int"> {r.lessonTitle}</span>}{exists(r) && <span className="planner-int"> · đã lưu</span>}</td>
                    <td><button type="button" className="mini-btn" onClick={() => onOpen(r.plan)}>Xem, sửa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dash-muted">“Xem, sửa” mở giáo án vào khung soạn phía dưới để chỉnh rồi lưu riêng từng tiết. Tiết đã lưu trước đó (cùng ngày, tiết, tên bài) được bỏ chọn sẵn để không lưu trùng.</p>
        </>
      )}
    </section>
  );
}
