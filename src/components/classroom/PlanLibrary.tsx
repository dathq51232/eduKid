'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenCheck, FolderUp, Search, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { readDocx } from '@/lib/docx-read';
import { SUBJECT_NAMES, isPlan, type LessonPlan, type PlanSubject } from '@/lib/plans/generate';
import { splitLessonPlans, type LibraryMeta } from '@/lib/plans/library';

type Row = { id: string; source: string; subject: PlanSubject; extra: boolean; grade: number; week: number | null; lesson_no: number | null; periods: number[] | null; ppct: number | null; title: string; topic: string };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
const notReady = (m: string) => /function|does not exist|schema cache/i.test(m);
const HINT = 'Chưa bật kho giáo án: chạy supabase/migrations/0023_plan_library.sql trên Supabase.';
const toMeta = (r: Row): LibraryMeta => ({ id: r.id, source: r.source, subject: r.subject, extra: r.extra, grade: r.grade, week: r.week, lessonNo: r.lesson_no, periods: r.periods ?? [], ppct: r.ppct, title: r.title, topic: r.topic });
const subjLabel = (s: PlanSubject, extra: boolean) => `${SUBJECT_NAMES[s] ?? s}${extra ? ' (BS)' : ''}`;

/** đường dẫn hiển thị / khoá nguồn: bỏ thư mục gốc được chọn ("GIAO AN/TOÁN K1/x.docx" → "TOÁN K1/x.docx") */
const relPath = (f: File) => {
  const p = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
  const parts = p.split('/');
  return (parts.length > 1 ? parts.slice(1) : parts).join('/');
};

/**
 * Kho giáo án của trường: tải thư mục giáo án Word lên → app tách từng bài / tiết ngay trên máy (chỉ gửi phần chữ),
 * lưu dùng chung cho giáo viên cùng trường; khi tải lịch báo giảng, app lấy giáo án trong kho cho đúng tiết.
 */
export default function PlanLibrary({ grade, className, onOpen, onChange }: {
  grade: number; className: string;
  onOpen: (plan: LessonPlan) => void;
  onChange: (items: LibraryMeta[]) => void;
}) {
  const dirRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [ready, setReady] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  const [fails, setFails] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [showFiles, setShowFiles] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await createClient().rpc('library_list', { p_grade: null });
    if (error) { setReady(!notReady(error.message)); if (notReady(error.message)) setMsg({ kind: 'info', text: HINT }); return; }
    const list = (data ?? []) as Row[];
    setRows(list);
    onChange(list.map(toMeta));
  }, [onChange]);
  useEffect(() => { void refresh(); }, [refresh]);

  const importFiles = async (files: File[]) => {
    const docs = files.filter((f) => /\.docx$/i.test(f.name) && !f.name.startsWith('~$'));
    const skipped = files.length - docs.length;
    if (!docs.length) return setMsg({ kind: 'error', text: 'Không có file Word .docx nào trong lựa chọn (file .doc cũ: mở bằng Word rồi “Lưu thành” .docx).' });
    setBusy(true); setMsg(null); setFails([]);
    const sb = createClient();
    let plans = 0, ok = 0;
    const bad: string[] = [];
    for (let i = 0; i < docs.length; i++) {
      const f = docs[i], path = relPath(f);
      setProgress(`Đang đọc ${i + 1}/${docs.length}: ${f.name}`);
      try {
        if (f.size > 40_000_000) throw new Error('file quá lớn');
        const items = splitLessonPlans(await readDocx(await f.arrayBuffer()), path);
        if (!items.length) { bad.push(`${path} — không thấy giáo án (cần có mục “I. Yêu cầu cần đạt”)`); continue; }
        const { data, error } = await sb.rpc('library_import', { p_source: path.slice(0, 300), p_items: items.slice(0, 300) });
        if (error) {
          if (notReady(error.message)) { setReady(false); setMsg({ kind: 'error', text: HINT }); break; }
          bad.push(`${path} — ${/library_full/.test(error.message) ? 'kho đã đầy (20 000 giáo án)' : 'chưa lưu được'}`);
          continue;
        }
        plans += Number(data) || 0; ok++;
      } catch (e) {
        bad.push(`${path} — ${e instanceof Error ? e.message : 'không đọc được'}`);
      }
    }
    setBusy(false); setProgress(''); setFails(bad);
    if (ok) setMsg({ kind: 'ok', text: `Đã nạp ${plans} giáo án từ ${ok} file vào kho của trường${skipped ? ` (bỏ qua ${skipped} file không phải .docx)` : ''}${bad.length ? `; ${bad.length} file chưa nạp được (xem bên dưới)` : ''}.` });
    else if (bad.length) setMsg({ kind: 'error', text: 'Chưa nạp được file nào — xem lí do bên dưới.' });
    void refresh();
  };

  const removeSource = async (source: string | null) => {
    if (!window.confirm(source ? `Xoá các giáo án của file “${source}” khỏi kho?` : 'Xoá TOÀN BỘ kho giáo án của trường? Giáo viên khác cũng không dùng được nữa.')) return;
    const { error } = await createClient().rpc('library_delete', { p_source: source });
    if (error) return setMsg({ kind: 'error', text: 'Chưa xoá được.' });
    void refresh();
  };

  const open = async (id: string) => {
    const { data, error } = await createClient().rpc('library_get', { p_ids: [id] });
    const d = ((data ?? []) as { data: unknown }[])[0]?.data;
    if (error || !isPlan(d)) return setMsg({ kind: 'error', text: 'Không mở được giáo án này.' });
    onOpen({ ...d, className });
  };

  const mine = rows.filter((r) => r.grade === grade);
  const bySubject = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) { const k = `Khối ${r.grade} · ${subjLabel(r.subject, r.extra)}`; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()];
  }, [rows]);
  const sources = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.source, (m.get(r.source) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi', { numeric: true }));
  }, [rows]);
  const found = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!f) return [];
    return mine.filter((r) => `${r.title} ${subjLabel(r.subject, r.extra)} tuần ${r.week ?? ''}`.toLowerCase().includes(f)).slice(0, 30);
  }, [q, mine]);

  return (
    <section className="dash-section planner-card" aria-labelledby="pl-lib">
      <h2 id="pl-lib"><BookOpenCheck aria-hidden="true" /> Kho giáo án của trường</h2>
      <p className="dash-muted">Tải thư mục giáo án Word (.docx) của trường lên một lần: app tách từng bài, từng tiết (I. Yêu cầu cần đạt · II. Đồ dùng · III. Hoạt động · IV. Điều chỉnh) ngay trên máy này, chỉ lưu phần chữ, dùng chung cho giáo viên cùng trường. Khi tải lịch báo giảng, tiết nào có giáo án trong kho sẽ được soạn sẵn theo đúng giáo án đó. Nạp lại cùng một file thì giáo án cũ của file đó được thay mới.</p>
      <div className="planner-actions">
        <input ref={dirRef} type="file" multiple hidden {...{ webkitdirectory: '', directory: '' }}
          onChange={(e) => { const el = e.currentTarget; const fs = [...(el.files ?? [])]; if (fs.length) void importFiles(fs).finally(() => { el.value = ''; }); }} />
        <input ref={fileRef} type="file" multiple accept=".docx" hidden
          onChange={(e) => { const el = e.currentTarget; const fs = [...(el.files ?? [])]; if (fs.length) void importFiles(fs).finally(() => { el.value = ''; }); }} />
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || !ready} onClick={() => dirRef.current?.click()}><FolderUp aria-hidden="true" /> Tải cả thư mục giáo án</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy || !ready} onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" /> Chọn file .docx</button>
        {progress && <span className="dash-muted" role="status">{progress}</span>}
      </div>
      {msg && <p className={`adm-alert is-${msg.kind}`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}
      {fails.length > 0 && (
        <details className="planner-lib-fails"><summary>{fails.length} file chưa nạp được</summary><ul>{fails.map((f) => <li key={f}>{f}</li>)}</ul></details>
      )}

      {rows.length > 0 && (
        <>
          <p className="planner-import-sum"><strong>{rows.length} giáo án</strong> từ {sources.length} file · khối {grade}: {mine.length} giáo án</p>
          <div className="planner-lib-chips">{bySubject.map(([k, n]) => <span key={k} className="planner-kind is-app">{k}: {n}</span>)}</div>
          <label className="adm-field planner-lib-search"><span><Search aria-hidden="true" /> Tìm giáo án khối {grade} (tên bài, môn, “tuần 5”…)</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="vd: so sánh số" />
          </label>
          {found.length > 0 && (
            <div className="table-scroll">
              <table className="roster-table planner-table planner-import">
                <thead><tr><th>Môn</th><th>Tuần</th><th>Tên bài</th><th>File</th><th><span className="sr-only">Mở</span></th></tr></thead>
                <tbody>{found.map((r) => (
                  <tr key={r.id}><td>{subjLabel(r.subject, r.extra)}</td><td>{r.week ?? ''}</td><td className="planner-title">{r.title}</td><td className="planner-int">{r.source}</td>
                    <td><button type="button" className="mini-btn" onClick={() => void open(r.id)}>Mở để soạn</button></td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {q.trim() && !found.length && <p className="dash-muted">Không thấy giáo án khối {grade} phù hợp.</p>}
          <div className="planner-week">
            <button type="button" className="mini-btn" onClick={() => setShowFiles((v) => !v)}>{showFiles ? 'Ẩn danh sách file' : `Xem ${sources.length} file trong kho`}</button>
            <span className="planner-spacer" />
            <button type="button" className="mini-btn is-danger" onClick={() => void removeSource(null)}><Trash2 aria-hidden="true" /> Xoá cả kho</button>
          </div>
          {showFiles && (
            <ul className="planner-lib-files">{sources.map(([s, n]) => (
              <li key={s}><span>{s}</span><span className="planner-int">{n} giáo án</span>
                <button type="button" className="mini-btn is-danger" aria-label={`Xoá ${s}`} onClick={() => void removeSource(s)}><Trash2 aria-hidden="true" /></button></li>
            ))}</ul>
          )}
        </>
      )}
      {ready && !rows.length && !busy && <p className="dash-muted">Kho đang trống.</p>}
    </section>
  );
}
