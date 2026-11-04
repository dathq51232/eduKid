'use client';

import { Fragment, useMemo, useRef, useState } from 'react';
import { FileDown, FileSpreadsheet, Save, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/xlsx';
import { readXlsxAll } from '@/lib/xlsx-read';
import { addDays, mondayOf, viDate, weekdayVi, type LessonInfo, type LessonPlan } from '@/lib/plans/generate';
import { parseScheduleBook, plansFromSchedule, scheduleTemplate, schoolGroupLabel, sortSchoolOrder, adaptLibraryPlan, type RowPlan, type Schedule } from '@/lib/plans/schedule';
import { pickFromLibrary, rankLibrary, type LibraryMeta } from '@/lib/plans/library';
import { isPlan } from '@/lib/plans/generate';
import { weekSheet, loadWeekOpts, type WeekArgs } from '@/lib/plans/week-export';
import type { SubjectCode } from '@/lib/types';

type SavedLite = { teach_date: string | null; period: number | null; title: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
/** một tiết: giáo án đang dùng + giáo án app soạn (để quay lại) + giáo án kho đang dùng và những gì đã tự thay */
type Item = RowPlan & { base: RowPlan; libId?: string; changes?: string[] };
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
  onPreview: (p: { title: string; filename: string; week: WeekArgs }) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [sch, setSch] = useState<Schedule | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  // gợi ý kho trường cho từng tiết: tiết đang mở, nội dung giáo án kho đã tải
  const [kho, setKho] = useState<number | null>(null);
  const [libPlans, setLibPlans] = useState<Map<string, LessonPlan>>(new Map());
  const [pick, setPick] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [msg, setMsg] = useState<Msg>(null);

  const savedKeys = useMemo(() => new Set(saved.filter((s) => s.teach_date).map((s) => keyOf(s.teach_date!, s.period ?? 0, s.title))), [saved]);
  const exists = (r: RowPlan) => !!r.plan.date && savedKeys.has(keyOf(r.plan.date, r.plan.period, r.plan.title));

  const qOf = (r: Item) => ({ subject: r.row.subject, extra: r.row.extra, grade: sch?.grade ?? grade, week: Number(sch?.week) || null, title: r.row.title, ppct: Number(r.row.ppct) || null, integration: r.row.integration });
  /** mở gợi ý kho cho tiết i: tải nội dung các giáo án gợi ý (nếu chưa có) */
  const openKho = async (i: number) => {
    if (kho === i) return setKho(null);
    setKho(i);
    const need = rankLibrary(library, qOf(items[i])).map((m) => m.e.id).filter((id) => !libPlans.has(id));
    if (!need.length) return;
    const { data } = await createClient().rpc('library_get', { p_ids: need });
    setLibPlans((old) => { const m = new Map(old); for (const row of (data ?? []) as { id: string; data: unknown }[]) if (isPlan(row.data)) m.set(row.id, row.data); return m; });
  };
  const chooseLib = (i: number, id: string) => {
    const lib = libPlans.get(id);
    if (!lib) return;
    setItems((list) => list.map((r, k) => (k === i ? { ...adaptLibraryPlan(r.base, lib, className), base: r.base, libId: id } : r)));
  };
  const chooseBase = (i: number) => setItems((list) => list.map((r, k) => (k === i ? { ...r.base, base: r.base } : r)));

  const load = async (file: File) => {
    setMsg(null); setSch(null); setItems([]); setFileName(file.name);
    if (!/\.xlsx$/i.test(file.name)) return setMsg({ kind: 'error', text: 'Chỉ đọc được file .xlsx. Nếu là .xls, mở bằng Excel rồi “Lưu thành” Excel Workbook (.xlsx).' });
    if (file.size > 5_000_000) return setMsg({ kind: 'error', text: 'File quá lớn (tối đa 5 MB).' });
    try {
      const s = parseScheduleBook(await readXlsxAll(await file.arrayBuffer()));
      let list: Item[] = plansFromSchedule(s, { grade, className, lessonsBySubject, weakForms }).map((rp) => ({ ...rp, base: rp }));
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
          setLibPlans(new Map([...got].filter((x): x is [string, LessonPlan] => isPlan(x[1]))));
          list = list.map((rp, i) => { const m = picks[i]; const d = m ? got.get(m.id) : null; return m && isPlan(d) ? { ...adaptLibraryPlan(rp, d, className), base: rp.base, libId: m.id } : rp; });
        }
      }
      // thứ tự soạn theo mẫu nhà trường: TV → Toán → Đạo đức → TN&XH → HĐTN → TV tăng cường → Toán tăng cường → môn khác
      list = sortSchoolOrder(list, (r) => ({ subject: r.row.subject, extra: r.row.extra, label: r.row.subjectLabel, date: r.plan.date, session: r.row.session, period: r.row.period }));
      setSch(s); setItems(list); setKho(null);
      setPick(list.map((r) => !(!!r.plan.date && savedKeys.has(keyOf(r.plan.date, r.plan.period, r.plan.title)))));
      if (s.grade !== null && s.grade !== grade) setMsg({ kind: 'info', text: `Lịch báo giảng là của khối ${s.grade}, lớp ${className} là khối ${grade}: giáo án dùng khung chung, không ghép bài của app. Kiểm tra lại file nếu nhầm.` });
    } catch (e) {
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không đọc được file.' });
    }
  };

  const chosen = items.filter((_, i) => pick[i]);
  // tiết đã lưu trước đó không lưu lại (tránh trùng); vẫn đưa vào file Word
  const toSave = chosen.filter((r) => !exists(r));
  const counts = useMemo(() => ({
    kho: items.filter((r) => r.kind === 'kho').length,
    app: items.filter((r) => r.kind === 'app').length, review: items.filter((r) => r.kind === 'review').length, khung: items.filter((r) => r.kind === 'khung').length,
  }), [items]);

  const saveAll = async () => {
    if (!toSave.length) return;
    setBusy(true); setMsg(null);
    const sb = createClient();
    let ok = 0, fail = 0, notMigrated = false;
    for (const r of toSave) {
      setProgress(`Đang lưu ${ok + fail + 1}/${toSave.length}…`);
      const p = r.plan;
      const { error } = await sb.rpc('teacher_save_plan', {
        p_plan: null, p_class: classId, p_title: p.title.trim().slice(0, 200), p_subject: p.subject, p_grade: p.grade,
        p_date: p.date || null, p_period: p.period || null, p_data: p,
      });
      if (error) { fail++; if (/subject_check|check constraint/i.test(error.message)) notMigrated = true; } else ok++;
    }
    setBusy(false); setProgress('');
    if (ok) { setPick(items.map(() => false)); onSaved(sch?.monday || mondayOf(toSave[0].plan.date)); }
    setMsg(fail
      ? { kind: 'error', text: `Đã lưu ${ok}/${toSave.length} giáo án. ${notMigrated ? 'Các môn ngoài Toán, Tiếng Việt, Tiếng Anh cần chạy supabase/migrations/0022_lesson_plans_subjects.sql trên Supabase.' : 'Một số giáo án chưa lưu được, thử lại sau.'}` }
      : { kind: 'ok', text: `Đã lưu ${ok} giáo án vào tuần ${sch?.week || ''}. Xem ở mục “Giáo án đã lưu”, mở từng tiết để sửa.` });
  };

  const exportWord = () => {
    if (!sch || !chosen.length) return;
    const monday = sch.monday || mondayOf(chosen[0].plan.date || new Date().toISOString().slice(0, 10));
    onPreview({ title: `Kế hoạch dạy học tuần ${sch.week || viDate(monday)} + ${chosen.length} giáo án`, filename: `ke-hoach-day-hoc-tuan-${sch.week || monday}`, week: { monday, plans: chosen.map((r) => r.plan), school, className, withPlans: true, skipped: sch.skipped } });
  };

  const template = () => {
    const today = new Date();
    const monday = mondayOf(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    downloadXlsx(`lich-bao-giang-mau-khoi-${grade}.xlsx`, [scheduleTemplate(grade, monday, '')]);
  };

  return (
    <section className="dash-section planner-card" aria-labelledby="pl-import">
      <h2 id="pl-import"><FileSpreadsheet aria-hidden="true" /> Tạo giáo án từ lịch báo giảng (Excel)</h2>
      <p className="dash-muted">Tải lên lịch báo giảng / kế hoạch dạy học tuần theo mẫu bất kì của trường (file nhiều trang tính, chia buổi bằng cột hay bằng dòng “Buổi sáng / chiều”, tích hợp ghi cột riêng hay cuối tên bài…). App tự tìm trang lịch báo giảng và quy về mẫu chuẩn (Thứ/ngày · Buổi · Tiết TKB · Môn học · Tiết PPCT · Tên bài dạy · ND tích hợp/ĐDDH · Điều chỉnh) rồi mới sinh giáo án. App tự soạn giáo án cho từng tiết: ưu tiên giáo án trong kho của trường (mục dưới) đúng môn, bài, tiết; còn lại bài Toán, Tiếng Việt, Tiếng Anh có trong app được soạn theo yêu cầu cần đạt và dạng bài của bài; tiết ôn tập, bổ sung (BS) theo bài trọng tâm của tuần; các môn khác theo khung chung của môn.</p>
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
          {sch.source && (
            <div className="planner-norm" role="status">
              <p><b>✅ Đã quy về mẫu chuẩn</b> · đọc trang “{sch.source.sheet}” · {sch.source.form}</p>
              {sch.source.notes.length > 0 && <ul>{sch.source.notes.map((n) => <li key={n}>{n[0].toUpperCase() + n.slice(1)}</li>)}</ul>}
              <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadXlsx(`lich-bao-giang-mau-chuan-tuan-${sch.week || sch.monday}.xlsx`, [weekSheet({ monday: sch.monday || mondayOf(items[0].plan.date || new Date().toISOString().slice(0, 10)), plans: items.map((r) => r.plan), school, className, withPlans: false, skipped: sch.skipped }, { ...loadWeekOpts(), short: 'full' })])}>
                <FileSpreadsheet aria-hidden="true" /> Tải lịch theo mẫu chuẩn (Excel)
              </button>
            </div>
          )}
          {sch.skipped.length > 0 && (
            <p className="dash-muted planner-skipped">Bỏ qua {sch.skipped.length} tiết chữ đỏ (tiết trống, không soạn): {sch.skipped.map((r) => `${r.date ? weekdayVi(r.date).replace('Thứ ', '') : ''} tiết ${r.period || '?'} ${r.subjectLabel}`).join(' · ')}. Các tiết này vẫn ghi chữ đỏ trong bảng kế hoạch tuần khi xuất Word.</p>
          )}
          {sch.warnings.map((w) => <p key={w} className="dash-muted">⚠ {w}</p>)}
          <p className="dash-muted">Giáo án xếp theo thứ tự soạn của nhà trường: Tiếng Việt → Toán → Đạo đức → Tự nhiên và Xã hội → Hoạt động trải nghiệm → Tiếng Việt (tăng cường) → Toán (tăng cường); trong mỗi môn theo thứ tự dạy trong tuần.</p>
          <div className="planner-week">
            <button type="button" className="mini-btn" onClick={() => setPick(items.map(() => true))}>Chọn tất cả ({items.length})</button>
            {items.some(exists) && items.some((r) => !exists(r)) && <button type="button" className="mini-btn" onClick={() => setPick(items.map((r) => !exists(r)))}>Chọn tiết chưa lưu</button>}
            <button type="button" className="mini-btn" onClick={() => setPick(items.map(() => false))}>Bỏ chọn</button>
            <span className="planner-spacer" />
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || !toSave.length || !canSave} onClick={() => void saveAll()} title={chosen.length > toSave.length ? `${chosen.length - toSave.length} tiết đã lưu trước đó sẽ không lưu lại` : undefined}><Save aria-hidden="true" /> {progress || (chosen.length && !toSave.length ? 'Các tiết đã chọn đều đã lưu' : `Lưu ${toSave.length} giáo án`)}</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!chosen.length} onClick={exportWord}><FileDown aria-hidden="true" /> Xem trước &amp; tải Word: lịch + {chosen.length} giáo án</button>
          </div>
          <div className="table-scroll">
            <table className="roster-table planner-table planner-import">
              <thead><tr><th><span className="sr-only">Chọn</span></th><th>Thứ</th><th>Buổi</th><th>Tiết</th><th>Môn</th><th>Tên bài dạy</th><th>Giáo án</th><th><span className="sr-only">Xem</span></th></tr></thead>
              <tbody>
                {items.map((r, i) => {
                  const group = schoolGroupLabel(r.row.subject, r.row.extra) ?? r.row.subjectLabel.toUpperCase();
                  const prev = i ? schoolGroupLabel(items[i - 1].row.subject, items[i - 1].row.extra) ?? items[i - 1].row.subjectLabel.toUpperCase() : null;
                  return (<Fragment key={i}>
                  {group !== prev && <tr className="planner-group"><th colSpan={8} scope="colgroup">{group}</th></tr>}
                  <tr className={pick[i] ? 'is-on' : ''}>
                    <td><input type="checkbox" checked={!!pick[i]} aria-label={`Chọn ${r.plan.title}`} onChange={(e) => setPick((p) => p.map((x, k) => (k === i ? e.target.checked : x)))} /></td>
                    <td>{r.plan.date ? `${weekdayVi(r.plan.date).replace('Thứ ', '')} ${viDate(r.plan.date).slice(0, -5)}` : ''}</td>
                    <td>{r.row.session}</td>
                    <td>{r.row.period || ''}</td>
                    <td>{r.row.subjectLabel}</td>
                    <td className="planner-title">{r.plan.title}{r.row.integration && <span className="planner-int"> · Tích hợp: {r.row.integration.split('\n')[0]}</span>}</td>
                    <td><span className={`planner-kind is-${r.kind}`} title={r.lessonTitle || undefined}>{KIND_LABEL[r.kind]}</span>{r.lessonTitle && <span className="planner-int"> {r.lessonTitle}</span>}{exists(r) && <span className="planner-int"> · đã lưu</span>}</td>
                    <td className="planner-kho-cell">
                      <button type="button" className="mini-btn" onClick={() => onOpen(r.plan)}>Xem, sửa</button>
                      {library.length > 0 && <button type="button" className={`mini-btn planner-kho-btn${kho === i ? ' is-on' : ''}`} aria-expanded={kho === i} onClick={() => void openKho(i)}>📚 Kho trường</button>}
                    </td>
                  </tr>
                  {kho === i && (
                    <tr className="planner-kho-row"><td colSpan={8}>
                      <KhoPanel r={r} matches={rankLibrary(library, qOf(r))} libPlans={libPlans} className={className}
                        onUse={(id) => chooseLib(i, id)} onBase={() => chooseBase(i)} onOpen={(pl) => onOpen(pl)} />
                    </td></tr>
                  )}
                  </Fragment>);
                })}
              </tbody>
            </table>
          </div>
          <p className="dash-muted">“Xem, sửa” mở giáo án vào khung soạn phía dưới để chỉnh rồi lưu riêng từng tiết. Tiết đã lưu trước đó (cùng ngày, tiết, tên bài) được bỏ chọn sẵn; nếu chọn lại thì vẫn có trong file Word nhưng không lưu trùng.</p>
        </>
      )}
    </section>
  );
}

/** Gợi ý giáo án gần nhất trong kho cho một tiết: % khớp, lí do, những gì sẽ tự thay; dùng / quay về khung của app */
function KhoPanel({ r, matches, libPlans, className, onUse, onBase, onOpen }: {
  r: Item; matches: ReturnType<typeof rankLibrary<LibraryMeta>>; libPlans: Map<string, LessonPlan>; className: string;
  onUse: (id: string) => void; onBase: () => void; onOpen: (plan: LessonPlan) => void;
}) {
  if (!matches.length) return <p className="dash-muted">Kho trường chưa có giáo án khớp tiết này (cùng môn, khối, bài). App soạn theo khung của app.</p>;
  return (
    <div className="kho">
      <p className="kho-h">Giáo án gần nhất trong kho cho <b>{r.row.title}</b>{r.row.ppct ? ` · PPCT ${r.row.ppct}` : ''}{r.row.integration ? ` · tích hợp: ${r.row.integration.split('\n')[0]}` : ''}</p>
      <div className="kho-list">
        {matches.map((m) => {
          const lib = libPlans.get(m.e.id);
          const on = r.libId === m.e.id && r.kind === 'kho';
          const preview = lib ? adaptLibraryPlan(r.base, lib, className) : null;
          return (
            <div key={m.e.id} className={`kho-card${on ? ' is-on' : ''}`}>
              <div className="kho-t"><b>{m.e.title}</b><span className={`kho-pct ${m.pct >= 80 ? 'is-hi' : m.pct >= 55 ? 'is-mid' : ''}`}>Khớp {m.pct}%</span></div>
              <small>{m.e.source}{m.e.week ? ` · tuần ${m.e.week}` : ''}</small>
              <div className="kho-why">{m.why.map((w) => <span key={w.label} className={w.ok ? 'is-ok' : 'is-no'}>{w.ok ? '✓' : '✗'} {w.label}</span>)}</div>
              {preview ? <ul className="kho-swap">{preview.changes.map((c) => <li key={c}>{c}</li>)}</ul> : <p className="dash-muted">Đang tải giáo án…</p>}
              <div className="kho-btns">
                {on ? <span className="tag-ok">Đang dùng</span> : <button type="button" className="btn btn-primary btn-sm" disabled={!lib} onClick={() => onUse(m.e.id)}>Dùng giáo án này{preview ? ` (tự thay ${preview.changes.length} mục)` : ''}</button>}
                <button type="button" className="btn btn-outline btn-sm" disabled={!preview} onClick={() => preview && onOpen(preview.plan)}>Xem, sửa</button>
              </div>
            </div>
          );
        })}
        <div className={`kho-card is-base${r.kind !== 'kho' ? ' is-on' : ''}`}>
          <div className="kho-t"><b>Không dùng kho — soạn theo khung của app</b></div>
          <small>{KIND_LABEL[r.base.kind]}{r.base.lessonTitle ? ` · ${r.base.lessonTitle}` : ''}</small>
          <div className="kho-btns">{r.kind !== 'kho' ? <span className="tag-ok">Đang dùng</span> : <button type="button" className="btn btn-outline btn-sm" onClick={onBase}>Dùng khung của app</button>}</div>
        </div>
      </div>
      <p className="dash-muted kho-note">Giáo án gốc giữ nguyên chữ, bảng, màu; app chỉ thay ngày, lớp, tiết và chèn nội dung tích hợp của tuần này.</p>
    </div>
  );
}
