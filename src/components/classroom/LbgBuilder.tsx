'use client';
// Tạo lịch báo giảng cho cả khối (tổ trưởng): PPCT của khối + lịch tuần + TKB từng lớp → lịch tuần n của mỗi lớp,
// kèm cảnh báo (lệch số tiết, thiếu PPCT, tiết không liền). Dữ liệu dùng chung cả trường (migration 0068).
// Lịch của lớp đang mở chuyển thẳng sang "Tạo giáo án từ lịch báo giảng". Quy tắc: docs/LICH-BAO-GIANG-QUY-TAC.md
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Copy, FileDown, FileSpreadsheet, Plus, RefreshCw, Save, Trash2, Upload, Wand2, X } from 'lucide-react';
import { downloadXlsx } from '@/lib/xlsx';
import { readXlsxAll } from '@/lib/xlsx-read';
import { addDays, viDate } from '@/lib/plans/generate';
import type { Schedule } from '@/lib/plans/schedule';
import {
  DAY_NAMES, MORNING, SLOTS, buildWeek, checkPpct, emptyKhoi, emptyTkb, indexPpct, lbgSheet, mondayOfWeek, parseKhoiBook,
  subjectDisplay, subjectKey, tkbCounts, weekOfDate, type KhoiData, type Tkb,
} from '@/lib/plans/lbg';
import { loadKhoi, saveKhoi, type KhoiLoad } from '@/lib/plans/lbg-store';
import '@/styles/lbg.css';

type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const COMMON = ['Tiếng Việt', 'Toán', 'Đạo đức', 'TNXH', 'HĐTN', 'GDTC', 'Âm nhạc', 'Mĩ thuật', 'Tiếng Anh', 'Tin học', 'Công nghệ', 'Khoa học', 'Lịch sử và Địa lí', 'Tiếng Việt (BS)', 'Toán (BS)', 'Tăng cường'];
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const shortDate = (iso: string) => (iso ? viDate(iso).slice(0, -5) : '');

export default function LbgBuilder({ grade, className, onUse }: {
  grade: number; className: string;
  /** dùng lịch tuần của lớp đang mở để soạn giáo án */
  onUse: (schedule: Schedule, label: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [load, setLoad] = useState<KhoiLoad | null>(null);
  const [data, setData] = useState<KhoiData>(emptyKhoi());
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [conflict, setConflict] = useState(false);
  const [cls, setCls] = useState(className);
  const [week, setWeek] = useState(1);
  const [newCls, setNewCls] = useState('');
  const [breakDate, setBreakDate] = useState('');

  const reload = async () => {
    setBusy(true); setConflict(false);
    const l = await loadKhoi(grade);
    setLoad(l); setData(l.data); setDirty(false); setBusy(false);
    const w = weekOfDate(l.data.cal, todayIso());
    setWeek(w || 1);
  };
  useEffect(() => { void reload(); }, [grade]); // eslint-disable-line react-hooks/exhaustive-deps -- tải lại khi đổi khối

  const update = (fn: (d: KhoiData) => KhoiData) => { setData((d) => fn(structuredClone(d))); setDirty(true); };

  const save = async (next: KhoiData = data) => {
    if (!load) return;
    setBusy(true); setMsg(null);
    const r = await saveKhoi(grade, next, load.updatedAt, load.mode);
    setBusy(false);
    if (!r.ok) { setMsg({ kind: 'error', text: r.message }); if (r.reason === 'conflict') setConflict(true); return; }
    setLoad({ ...load, data: next, updatedAt: r.updatedAt, mode: r.mode, by: r.mode === 'cloud' ? 'bạn' : null });
    setDirty(false);
    setMsg({ kind: 'ok', text: r.mode === 'cloud' ? `Đã lưu dữ liệu khối ${grade} — cả trường dùng chung.` : 'Đã lưu trên máy này (chưa dùng chung được: cần chạy supabase/migrations/0068_lbg_khoi.sql).' });
  };

  const importFile = async (file: File) => {
    setMsg(null);
    if (!/\.xlsx$/i.test(file.name)) return setMsg({ kind: 'error', text: 'Chỉ đọc được file .xlsx. File .xls: mở bằng Excel rồi “Lưu thành” Excel Workbook (.xlsx).' });
    if (file.size > 8_000_000) return setMsg({ kind: 'error', text: 'File quá lớn (tối đa 8 MB).' });
    setBusy(true);
    try {
      const book = parseKhoiBook(await readXlsxAll(await file.arrayBuffer(), 40));
      const pp = book.ppct.find((p) => p.grade === grade) ?? (book.ppct.length === 1 && book.ppct[0].grade === null ? book.ppct[0] : null);
      const got: string[] = [];
      const next = structuredClone(data);
      if (pp) { next.ppct = pp.items; next.ppctSource = `${file.name} · trang “${pp.sheet}”`; got.push(`PPCT ${pp.items.length} tiết`); }
      if (book.cal) { next.cal = { ...book.cal, days: next.cal.days ?? book.cal.days }; got.push(`lịch tuần (tuần 1 từ ${viDate(book.cal.start)}${book.cal.breaks.length ? `, ${book.cal.breaks.length} tuần nghỉ` : ''})`); }
      if (book.tkb) { next.tkb[cls] = book.tkb; got.push(`TKB → lớp ${cls}`); }
      if (book.school) next.school = book.school;
      if (book.agency) next.agency = book.agency;
      setBusy(false);
      if (!got.length) {
        const other = book.ppct.map((p) => p.grade).filter(Boolean);
        return setMsg({ kind: 'error', text: other.length ? `File có PPCT khối ${other.join(', ')}, không có khối ${grade}.` : 'Không tìm thấy trang PPCT, TKB hay Lịch tuần theo mẫu (cột Phân môn · Tuần · Tiết thứ/tuần · PPCT · Tên bài).' });
      }
      setData(next); setDirty(true);
      const w = weekOfDate(next.cal, todayIso()); if (w) setWeek(w);
      await save(next);
      setMsg((m) => ({ kind: m?.kind === 'error' ? 'error' : 'ok', text: `Đã nạp từ “${file.name}”: ${got.join(', ')}. ${m?.text ?? ''}` }));
    } catch (e) {
      setBusy(false);
      setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không đọc được file.' });
    }
  };

  const idx = useMemo(() => indexPpct(data.ppct), [data.ppct]);
  const ppctWarn = useMemo(() => checkPpct(data.ppct), [data.ppct]);
  const subjects = useMemo(() => [...idx.subjects].map(([key, s]) => {
    const per = [...s.perWeek.values()];
    const mode = per.sort((a, b) => per.filter((x) => x === b).length - per.filter((x) => x === a).length)[0] ?? 0;
    return { key, label: subjectDisplay(s.label), perWeek: mode, total: s.total, maxWeek: s.maxWeek };
  }), [idx]);
  const maxWeek = Math.max(35, ...subjects.map((s) => s.maxWeek));
  const classes = useMemo(() => [...new Set([className, ...Object.keys(data.tkb)])].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })), [className, data.tkb]);
  const tkb: Tkb = data.tkb[cls] ?? emptyTkb();
  const days = data.cal.days ?? 5;
  const built = useMemo(() => buildWeek(data, grade, cls, week, idx), [data, grade, cls, week, idx]);
  const counts = useMemo(() => tkbCounts(tkb, days), [tkb, days]);
  const allWarn = useMemo(() => classes.filter((c) => data.tkb[c]).map((c) => ({ c, n: buildWeek(data, grade, c, week, idx).warnings.length })), [classes, data, grade, week, idx]);
  const subjectOptions = useMemo(() => [...new Set([...subjects.map((s) => s.label), ...COMMON])], [subjects]);

  const setCell = (d: number, k: number, v: string) => update((x) => { const t = x.tkb[cls] ?? emptyTkb(); t.cells[d][k] = v; x.tkb[cls] = t; return x; });
  const addClass = () => {
    const name = newCls.trim().toUpperCase().slice(0, 20);
    if (!name) return;
    update((x) => { if (!x.tkb[name]) x.tkb[name] = emptyTkb(); return x; });
    setCls(name); setNewCls('');
  };
  const copyFrom = (from: string) => update((x) => { if (x.tkb[from]) x.tkb[cls] = structuredClone(x.tkb[from]); return x; });
  const removeClass = () => { if (cls === className) return; update((x) => { delete x.tkb[cls]; return x; }); setCls(className); };

  const exportOne = () => downloadXlsx(`lich-bao-giang-${cls}-tuan-${week}.xlsx`, [lbgSheet(built, { className: cls, grade, school: data.school, agency: data.agency, days })]);
  const exportAll = () => {
    const list = classes.filter((c) => data.tkb[c] && Object.values(data.tkb[c].cells).flat().some(Boolean));
    if (!list.length) return setMsg({ kind: 'error', text: 'Chưa có lớp nào có thời khoá biểu.' });
    downloadXlsx(`lich-bao-giang-khoi-${grade}-tuan-${week}.xlsx`, list.map((c) => lbgSheet(buildWeek(data, grade, c, week, idx), { className: c, grade, school: data.school, agency: data.agency, days })));
  };

  const monday = mondayOfWeek(data.cal, week);
  const hasPpct = data.ppct.length > 0;

  return (
    <div className="lbg">
      <section className="dash-section planner-card lbg-bar" aria-label="Dữ liệu khối">
        <div>
          <h2><Wand2 aria-hidden="true" /> Tạo lịch báo giảng · Khối {grade}</h2>
          <p className="dash-muted">
            {load === null ? 'Đang tải…' : load.mode === 'cloud'
              ? <>Dữ liệu khối dùng chung cả trường{load.updatedAt ? <> · cập nhật {new Date(load.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}{load.by ? ` bởi ${load.by}` : ''}</> : ' · chưa có ai nạp'}.</>
              : <>Đang lưu trên máy này (chưa chạy <code>supabase/migrations/0068_lbg_khoi.sql</code> nên chưa dùng chung được với giáo viên khác).</>}
            {dirty && <b className="lbg-dirty"> · Có thay đổi chưa lưu</b>}
          </p>
        </div>
        <div className="lbg-bar-actions">
          <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importFile(f); }} />
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" /> Nạp file Excel của tổ</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={() => void save()}><Save aria-hidden="true" /> Lưu cho cả khối</button>
          {conflict && <button type="button" className="btn btn-outline btn-sm" onClick={() => void reload()}><RefreshCw aria-hidden="true" /> Tải lại bản mới</button>}
        </div>
        {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
      </section>

      <div className="lbg-grid">
        {/* 1. PPCT */}
        <section className="dash-section planner-card" aria-labelledby="lbg-ppct">
          <h3 id="lbg-ppct"><span className="lbg-step">1</span> Phân phối chương trình khối {grade}</h3>
          {!hasPpct ? (
            <p className="dash-muted">Chưa có PPCT. Bấm <b>Nạp file Excel của tổ</b>: app đọc trang <i>PPCT</i> (cột Phân môn · Tuần · Tiết thứ/tuần · PPCT · Tên bài), trang <i>Thời khoá biểu</i> và <i>Lịch tuần</i> nếu có.</p>
          ) : (
            <>
              <p className="dash-muted lbg-src">{data.ppct.length} tiết · {data.ppctSource ?? 'đã nạp'}</p>
              <table className="lbg-mini">
                <thead><tr><th>Môn</th><th>Tiết/tuần</th><th>Cả năm</th></tr></thead>
                <tbody>{subjects.map((s) => <tr key={s.key}><td>{s.label}</td><td>{s.perWeek}</td><td>{s.total}</td></tr>)}</tbody>
                <tfoot><tr><td>Cộng</td><td>{subjects.reduce((a, s) => a + s.perWeek, 0)}</td><td>{data.ppct.length}</td></tr></tfoot>
              </table>
              {ppctWarn.length > 0 && (
                <details className="lbg-warn-box">
                  <summary><AlertTriangle aria-hidden="true" /> {ppctWarn.length} chỗ cần xem lại trong PPCT</summary>
                  <ul>{ppctWarn.map((w) => <li key={w}>{w}</li>)}</ul>
                </details>
              )}
            </>
          )}
        </section>

        {/* 2. Lịch tuần */}
        <section className="dash-section planner-card" aria-labelledby="lbg-cal">
          <h3 id="lbg-cal"><span className="lbg-step">2</span> Lịch tuần</h3>
          <div className="lbg-cal-row">
            <label className="adm-field"><span>Thứ Hai của tuần 1</span>
              <input type="date" value={data.cal.start} onChange={(e) => update((x) => ({ ...x, cal: { ...x.cal, start: e.target.value } }))} />
            </label>
            <label className="adm-field"><span>Học trong tuần</span>
              <select value={days} onChange={(e) => update((x) => ({ ...x, cal: { ...x.cal, days: Number(e.target.value) === 6 ? 6 : 5 } }))}>
                <option value={5}>Thứ 2 → Thứ 6</option><option value={6}>Thứ 2 → Thứ 7</option>
              </select>
            </label>
          </div>
          {data.cal.start && new Date(`${data.cal.start}T12:00:00`).getDay() !== 1 && <p className="adm-alert is-error">Ngày tuần 1 phải là Thứ Hai.</p>}
          <p className="lbg-label">Tuần nghỉ (Tết, nghỉ dài) — không tính là tuần dạy</p>
          <div className="lbg-chips">
            {data.cal.breaks.map((b) => (
              <span key={b} className="lbg-chip">{viDate(b)} – {viDate(addDays(b, 6))}
                <button type="button" aria-label={`Bỏ tuần nghỉ ${viDate(b)}`} onClick={() => update((x) => ({ ...x, cal: { ...x.cal, breaks: x.cal.breaks.filter((y) => y !== b) } }))}><X aria-hidden="true" /></button>
              </span>
            ))}
            <span className="lbg-chip-add">
              <input type="date" value={breakDate} aria-label="Ngày trong tuần nghỉ" onChange={(e) => setBreakDate(e.target.value)} />
              <button type="button" className="mini-btn" disabled={!breakDate} onClick={() => {
                const d = new Date(`${breakDate}T12:00:00`); const mon = addDays(breakDate, -((d.getDay() + 6) % 7));
                update((x) => ({ ...x, cal: { ...x.cal, breaks: [...new Set([...x.cal.breaks, mon])].sort() } })); setBreakDate('');
              }}><Plus aria-hidden="true" /> Thêm</button>
            </span>
          </div>
          {data.cal.start && <p className="dash-muted">Hôm nay là {weekOfDate(data.cal, todayIso()) ? <b>tuần {weekOfDate(data.cal, todayIso())}</b> : 'ngoài tuần dạy (tuần nghỉ / chưa vào năm học)'}.</p>}
        </section>
      </div>

      {/* 3. TKB */}
      <section className="dash-section planner-card" aria-labelledby="lbg-tkb">
        <h3 id="lbg-tkb"><span className="lbg-step">3</span> Thời khoá biểu</h3>
        <div className="lbg-classes" role="tablist" aria-label="Lớp trong khối">
          {classes.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={c === cls} className={c === cls ? 'is-on' : ''} onClick={() => setCls(c)}>
              {c}{c === className && <small> (lớp này)</small>}
            </button>
          ))}
          <span className="lbg-chip-add">
            <input value={newCls} placeholder="Thêm lớp, vd 1A2" aria-label="Tên lớp mới" maxLength={20} onChange={(e) => setNewCls(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addClass(); }} />
            <button type="button" className="mini-btn" disabled={!newCls.trim()} onClick={addClass}><Plus aria-hidden="true" /> Thêm</button>
          </span>
        </div>
        <div className="lbg-tkb-tools">
          {classes.length > 1 && (
            <label className="lbg-inline"><Copy aria-hidden="true" /> Chép TKB từ
              <select value="" onChange={(e) => { if (e.target.value) copyFrom(e.target.value); }}>
                <option value="">— chọn lớp —</option>
                {classes.filter((c) => c !== cls && data.tkb[c]).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          )}
          <button type="button" className="mini-btn" onClick={() => update((x) => { x.tkb[cls] = emptyTkb(); return x; })}><Trash2 aria-hidden="true" /> Xoá trắng TKB</button>
          {cls !== className && <button type="button" className="mini-btn" onClick={removeClass}><X aria-hidden="true" /> Bỏ lớp {cls}</button>}
        </div>
        <datalist id="lbg-subjects">{subjectOptions.map((s) => <option key={s} value={s} />)}</datalist>
        <div className="table-scroll">
          <table className="lbg-tkb">
            <thead><tr><th scope="col">Tiết</th>{DAY_NAMES.slice(0, days).map((d) => <th key={d} scope="col">{d}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: SLOTS }, (_, k) => (
                <tr key={k} className={k === MORNING ? 'is-pm' : ''}>
                  <th scope="row">{k < MORNING ? `S${k + 1}` : `C${k - MORNING + 1}`}</th>
                  {Array.from({ length: days }, (_, d) => {
                    const v = tkb.cells[d]?.[k] ?? '';
                    const known = !v || idx.subjects.has(subjectKey(v));
                    return (
                      <td key={d}>
                        <input list="lbg-subjects" value={v} className={known ? '' : 'is-unknown'} aria-label={`${DAY_NAMES[d]} tiết ${k + 1}`} title={known ? undefined : 'Môn này không có trong PPCT của khối'}
                          onChange={(e) => setCell(d, k, e.target.value)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {counts.size > 0 && (
          <ul className="lbg-counts" aria-label={`Số tiết mỗi môn so với PPCT tuần ${week}`}>
            {[...counts].map(([key, c]) => {
              const need = idx.week(week, key).length;
              const ok = idx.subjects.has(key) && need === c.n;
              return <li key={key} className={ok ? 'is-ok' : 'is-bad'} title={idx.subjects.has(key) ? `PPCT tuần ${week}: ${need} tiết` : 'Không có trong PPCT'}>{subjectDisplay(c.label)} <b>{c.n}</b>{!ok && <small>/{idx.subjects.has(key) ? need : '?'}</small>}</li>;
            })}
            <li className="lbg-total">Cộng <b>{[...counts.values()].reduce((a, c) => a + c.n, 0)}</b> tiết</li>
          </ul>
        )}
      </section>

      {/* 4. Lịch báo giảng tuần n */}
      <section className="dash-section planner-card" aria-labelledby="lbg-week">
        <div className="lbg-week-head">
          <h3 id="lbg-week"><span className="lbg-step">4</span> Lịch báo giảng lớp {cls}</h3>
          <div className="lbg-stepper" role="group" aria-label="Chọn tuần">
            <button type="button" className="mini-btn" disabled={week <= 1} aria-label="Tuần trước" onClick={() => setWeek((w) => Math.max(1, w - 1))}><ChevronLeft aria-hidden="true" /></button>
            <label>Tuần <input type="number" min={1} max={maxWeek} value={week} onChange={(e) => setWeek(Math.min(maxWeek, Math.max(1, Number(e.target.value) || 1)))} /></label>
            <button type="button" className="mini-btn" disabled={week >= maxWeek} aria-label="Tuần sau" onClick={() => setWeek((w) => Math.min(maxWeek, w + 1))}><ChevronRight aria-hidden="true" /></button>
            {monday && <span className="dash-muted"><CalendarDays aria-hidden="true" /> {viDate(monday)} – {viDate(addDays(monday, days - 1))}</span>}
          </div>
        </div>

        {built.warnings.length > 0 ? (
          <div className="lbg-warn-box is-open" role="status">
            <p><AlertTriangle aria-hidden="true" /> <b>{built.warnings.length} cảnh báo</b> cho tổ trưởng xem trước khi duyệt:</p>
            <ul>{built.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        ) : built.schedule.rows.length > 0 && <p className="lbg-okline">✅ Đủ tiết, khớp PPCT tuần {week}, tiết PPCT nối tiếp tuần trước.</p>}

        <div className="planner-actions">
          {cls === className && (
            <button type="button" className="btn btn-primary btn-sm" disabled={!built.schedule.rows.length || !hasPpct}
              onClick={() => onUse(built.schedule, `Lịch tạo từ TKB + PPCT · lớp ${cls} · tuần ${week}`)}><Wand2 aria-hidden="true" /> Soạn giáo án tuần {week} từ lịch này</button>
          )}
          <button type="button" className="btn btn-outline btn-sm" disabled={!built.schedule.rows.length} onClick={exportOne}><FileDown aria-hidden="true" /> Tải Excel lớp {cls}</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={exportAll}><FileSpreadsheet aria-hidden="true" /> Tải Excel cả khối (mỗi lớp một trang)</button>
        </div>
        {allWarn.length > 1 && (
          <p className="dash-muted lbg-allwarn">Cả khối tuần {week}: {allWarn.map((x) => <button key={x.c} type="button" className={`lbg-cls-pill${x.n ? ' is-bad' : ''}`} onClick={() => setCls(x.c)}>{x.c}{x.n ? ` · ${x.n} cảnh báo` : ' ✓'}</button>)}</p>
        )}

        {built.schedule.rows.length > 0 && (
          <div className="table-scroll">
            <table className="roster-table planner-table lbg-out">
              <thead><tr><th>Thứ</th><th>Buổi</th><th>Tiết</th><th>Môn</th><th>PPCT</th><th>Tên bài dạy</th><th>ND tích hợp</th></tr></thead>
              <tbody>
                {built.schedule.rows.map((r, i) => {
                  const first = i === 0 || built.schedule.rows[i - 1].day !== r.day;
                  return (
                    <tr key={i} className={first ? 'is-day' : ''}>
                      <td>{first ? <>{DAY_NAMES[r.day].replace('Thứ ', 'T.')}<small> {shortDate(r.date)}</small></> : ''}</td>
                      <td>{first || built.schedule.rows[i - 1].session !== r.session ? r.session : ''}</td>
                      <td>{r.period}</td>
                      <td>{r.subjectLabel}</td>
                      <td>{r.ppct}</td>
                      <td className={r.ppct ? '' : 'lbg-missing'}>{r.title}</td>
                      <td className="lbg-int">{r.integration.replace(/\n/g, '; ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
