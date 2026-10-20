'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy, FileSpreadsheet, MessageSquareHeart, Printer, RotateCcw } from 'lucide-react';
import { downloadXlsx, XS } from '@/lib/xlsx';
import { nd30HeaderHtml, nd30SignHtml } from '@/lib/doc-style';
import { SUBJECT_VI, buildReport, reportRanges, reportText, type CompactResult, type Range, type StudentReport } from '@/lib/classroom/report';

type Student = { id: string; name: string };
type Draft = { text: string; ok: boolean };
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;

const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`);
const isoDay = (ms: number) => { const d = new Date(ms + 7 * 3600_000); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
const fromIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - 7 * 3600_000 : NaN; };

async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

/**
 * Phiếu báo tiến bộ: chọn khoảng thời gian → mỗi em một lời nhắn cho phụ huynh viết sẵn từ bài luyện trên app
 * (bài đã làm, tỉ lệ đúng, so với kỳ trước, điểm mạnh, dạng còn sai, gợi ý ở nhà). Giáo viên sửa, đánh dấu “Đã duyệt”,
 * rồi sao chép từng em / tất cả đã duyệt để dán vào Zalo, in (mỗi em một trang) hoặc tải Excel.
 * Bản nháp lưu trên máy của thầy cô (không gửi đi đâu).
 */
export default function ProgressReports({ classId, className, students, rows, teacherName, failed, school = '' }: {
  classId: string; className: string; students: Student[]; rows: CompactResult[]; teacherName: string; failed: boolean; school?: string;
}) {
  const ranges = useMemo(() => reportRanges(), []);
  const [key, setKey] = useState(ranges[1].key); // mặc định: tuần trước (tuần đã trọn vẹn)
  const [custom, setCustom] = useState({ from: isoDay(ranges[4].from), to: isoDay(ranges[4].to - 1) });
  const range: Range = useMemo(() => {
    if (key !== 'tuy-chon') return ranges.find((r) => r.key === key) ?? ranges[1];
    const from = fromIso(custom.from), to = fromIso(custom.to) + 86400_000;
    const ok = Number.isFinite(from) && Number.isFinite(to) && to > from;
    return ok ? { key: 'tuy-chon', label: `Từ ${custom.from.split('-').reverse().join('/')} đến ${custom.to.split('-').reverse().join('/')}`, from, to } : ranges[1];
  }, [key, custom, ranges]);
  const [teacher, setTeacher] = useState(teacherName);
  // Địa danh in ở góc phải bản in (thể thức NĐ30), nhớ trên máy
  const [place, setPlace] = useState('');
  useEffect(() => { try { setPlace(localStorage.getItem('edukid:dia-danh') ?? ''); } catch { /* bỏ qua */ } }, []);
  const savePlace = (v: string) => { setPlace(v); try { localStorage.setItem('edukid:dia-danh', v); } catch { /* bỏ qua */ } };
  const todayIso = isoDay(Date.now());

  const byStudent = useMemo(() => {
    const m = new Map<number, CompactResult[]>();
    for (const r of rows) { const a = m.get(r.s) ?? []; a.push(r); m.set(r.s, a); }
    return m;
  }, [rows]);
  const reports: StudentReport[] = useMemo(() => students.map((_, i) => buildReport(byStudent.get(i) ?? [], range)), [students, byStudent, range]);

  // Bản nháp theo lớp + khoảng thời gian, lưu trên máy
  const storeKey = `edukid:phieu-tien-bo:${classId}:${range.from}-${range.to}`;
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  useEffect(() => {
    let saved: Record<string, Draft> = {};
    try { saved = JSON.parse(localStorage.getItem(storeKey) ?? '{}') as Record<string, Draft>; } catch { /* bỏ qua */ }
    const next: Record<string, Draft> = {};
    students.forEach((st, i) => { next[st.id] = saved[st.id] ?? { text: reportText(st.name, className, range.label, reports[i], teacher), ok: false }; });
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeKey, students, className]);
  const persist = (next: Record<string, Draft>) => { setDrafts(next); try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* bỏ qua */ } };
  const setDraft = (id: string, patch: Partial<Draft>) => persist({ ...drafts, [id]: { ...drafts[id], ...patch } });

  const [msg, setMsg] = useState<Msg>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'none' | 'weak'>('all');
  const regen = (i: number) => setDraft(students[i].id, { text: reportText(students[i].name, className, range.label, reports[i], teacher), ok: false });
  const regenAll = () => {
    if (!window.confirm('Viết lại lời nhắn cho tất cả các em? Những chỗ thầy cô đã sửa sẽ mất.')) return;
    const next: Record<string, Draft> = {};
    students.forEach((st, i) => { next[st.id] = { text: reportText(st.name, className, range.label, reports[i], teacher), ok: false }; });
    persist(next);
  };

  const approved = students.filter((s) => drafts[s.id]?.ok);
  const copyOne = async (st: Student) => setMsg((await copyText(drafts[st.id]?.text ?? '')) ? { kind: 'ok', text: `Đã sao chép lời nhắn của ${st.name}. Dán vào Zalo / tin nhắn để gửi phụ huynh.` } : { kind: 'error', text: 'Trình duyệt chặn sao chép. Bôi đen nội dung rồi bấm Ctrl+C.' });
  const copyApproved = async () => {
    if (!approved.length) return setMsg({ kind: 'error', text: 'Chưa có em nào được đánh dấu “Đã duyệt”.' });
    const ok = await copyText(approved.map((s) => drafts[s.id].text).join('\n\n———\n\n'));
    setMsg(ok ? { kind: 'ok', text: `Đã sao chép ${approved.length} lời nhắn đã duyệt.` } : { kind: 'error', text: 'Trình duyệt chặn sao chép.' });
  };
  const exportXlsx = () => downloadXlsx(`phieu-tien-bo-lop-${className}.xlsx`, [{
    name: 'Phiếu báo tiến bộ', cols: [5, 28, 10, 10, 12, 90, 10],
    rows: [
      [{ v: `PHIẾU BÁO TIẾN BỘ — LỚP ${className} — ${range.label}`, s: XS.title }],
      [],
      ['STT', 'Họ và tên', 'Số bài', 'Tỉ lệ đúng', 'Kỳ trước', 'Lời nhắn gửi phụ huynh', 'Đã duyệt'].map((v) => ({ v, s: XS.header })),
      ...students.map((st, i) => [
        { v: i + 1, s: XS.center }, { v: st.name, s: XS.text }, { v: reports[i].lessons, s: XS.center }, { v: pct(reports[i].rate), s: XS.center },
        { v: pct(reports[i].prevRate), s: XS.center }, { v: drafts[st.id]?.text ?? '', s: XS.text }, { v: drafts[st.id]?.ok ? 'x' : '', s: XS.center },
      ]),
    ],
    merges: ['A1:G1'], landscape: true,
  }]);

  const visible = students.map((st, i) => ({ st, i })).filter(({ i }) => {
    const r = reports[i];
    if (filter === 'active') return r.attempts > 0;
    if (filter === 'none') return r.attempts === 0;
    if (filter === 'weak') return r.weak.length > 0 || (r.rate != null && r.rate < 0.6);
    return true;
  });
  const activeCount = reports.filter((r) => r.attempts > 0).length;

  return (
    <div className="progress-report">
      <style>{'@media print { @page { size: A4 portrait; margin: 20mm 15mm 20mm 30mm; } }'}</style>
      <header className="dash-head no-print">
        <div>
          <p className="dash-kicker">Lớp {className}</p>
          <h1><MessageSquareHeart aria-hidden="true" /> Phiếu báo tiến bộ</h1>
          <p className="dash-muted">Mỗi em một lời nhắn cho phụ huynh, viết sẵn từ bài luyện trên app: bài đã làm, tỉ lệ đúng, so với kỳ trước, điểm mạnh, dạng còn sai và gợi ý ở nhà. Thầy cô đọc, sửa, đánh dấu <strong>Đã duyệt</strong>, rồi sao chép để gửi qua Zalo, in hoặc tải Excel. App không tự gửi tin cho phụ huynh.</p>
        </div>
      </header>
      {failed && <p className="adm-alert is-error no-print">Không tải được kết quả học tập. Thử tải lại trang.</p>}

      <section className="dash-section planner-card no-print" aria-label="Chọn khoảng thời gian">
        <div className="report-bar">
          <label className="adm-field"><span>Khoảng thời gian</span>
            <select value={key} onChange={(e) => setKey(e.target.value)}>
              {ranges.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              <option value="tuy-chon">Tự chọn…</option>
            </select>
          </label>
          {key === 'tuy-chon' && (
            <>
              <label className="adm-field"><span>Từ ngày</span><input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
              <label className="adm-field"><span>Đến ngày</span><input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
            </>
          )}
          <label className="adm-field"><span>Ký tên</span><input value={teacher} maxLength={60} onChange={(e) => setTeacher(e.target.value)} placeholder="Tên giáo viên" /></label>
          <label className="adm-field"><span>Địa danh (in trên phiếu)</span><input value={place} maxLength={60} onChange={(e) => savePlace(e.target.value)} placeholder="Phường / xã" /></label>
        </div>
        <p className="dash-muted">{activeCount}/{students.length} em có luyện bài trong khoảng này · {approved.length} lời nhắn đã duyệt.</p>
        <div className="planner-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void copyApproved()}><ClipboardCopy aria-hidden="true" /> Sao chép {approved.length} lời nhắn đã duyệt</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer aria-hidden="true" /> In / lưu PDF (đã duyệt)</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={exportXlsx}><FileSpreadsheet aria-hidden="true" /> Tải Excel</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={regenAll}><RotateCcw aria-hidden="true" /> Viết lại tất cả</button>
        </div>
        <div className="praise-seg" role="radiogroup" aria-label="Lọc">
          {([['all', 'Tất cả'], ['active', 'Có luyện bài'], ['none', 'Chưa luyện'], ['weak', 'Cần hỗ trợ']] as const).map(([k, label]) => (
            <button key={k} type="button" role="radio" aria-checked={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </section>
      {msg && <p className={`adm-alert is-${msg.kind} no-print`} role={msg.kind === 'error' ? 'alert' : 'status'}>{msg.text}</p>}

      {students.length === 0 ? <p className="dash-muted">Lớp chưa có học sinh.</p> : (
        <ul className="report-list no-print">
          {visible.map(({ st, i }) => {
            const r = reports[i];
            const d = drafts[st.id];
            if (!d) return null;
            const trend = r.rate != null && r.prevRate != null ? r.rate - r.prevRate : null;
            return (
              <li key={st.id} className={`report-card${d.ok ? ' is-ok' : ''}`}>
                <div className="report-head">
                  <strong>{st.name}</strong>
                  <span className="report-chips">
                    <span className="report-chip">{r.lessons} bài · {r.activeDays} ngày</span>
                    <span className={`report-chip${r.rate != null && r.rate < 0.6 ? ' is-low' : ''}`}>Đúng {pct(r.rate)}</span>
                    {trend != null && <span className={`report-chip ${trend >= 0.05 ? 'is-up' : trend <= -0.08 ? 'is-low' : ''}`}>{trend >= 0 ? '▲' : '▼'} {Math.abs(Math.round(trend * 100))}% so với kỳ trước</span>}
                    {r.bySubject.map((b) => <span key={b.subject} className="report-chip is-soft">{SUBJECT_VI[b.subject]} {pct(b.ok / b.n)}</span>)}
                  </span>
                </div>
                <textarea rows={6} value={d.text} aria-label={`Lời nhắn cho phụ huynh em ${st.name}`} onChange={(e) => setDraft(st.id, { text: e.target.value, ok: false })} />
                <div className="planner-actions">
                  <label className="report-ok"><input type="checkbox" checked={d.ok} onChange={(e) => setDraft(st.id, { ok: e.target.checked })} /> <Check aria-hidden="true" /> Đã duyệt</label>
                  <button type="button" className="mini-btn" onClick={() => void copyOne(st)}><ClipboardCopy aria-hidden="true" /> Sao chép</button>
                  <button type="button" className="mini-btn" onClick={() => regen(i)}><RotateCcw aria-hidden="true" /> Viết lại gợi ý</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bản in: mỗi em đã duyệt một trang */}
      <div className="report-print" aria-hidden="true">
        {approved.map((st) => (
          <article key={st.id} className="report-page">
            {/* Thể thức NĐ30: góc trái tên trường, góc phải Quốc hiệu – Tiêu ngữ, địa danh ngày tháng (nội dung đã được escape) */}
            <div dangerouslySetInnerHTML={{ __html: nd30HeaderHtml({ school, place, dateIso: todayIso }) }} />
            <h2>PHIẾU BÁO TIẾN BỘ</h2>
            <p className="report-page-sub">Lớp {className} · {range.label}</p>
            <p><strong>Học sinh:</strong> {st.name}</p>
            {drafts[st.id].text.split('\n').map((line, k, all) => <p key={k} className="report-line">{k === all.length - 1 ? line.replace(/\s*GVCN .*$/, '') : line}</p>)}
            <div dangerouslySetInnerHTML={{ __html: nd30SignHtml('Giáo viên chủ nhiệm', teacher) }} />
          </article>
        ))}
      </div>
    </div>
  );
}
