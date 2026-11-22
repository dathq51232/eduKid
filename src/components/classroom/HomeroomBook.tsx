'use client';

// Sổ chủ nhiệm: mục tiêu năm học, kế hoạch chủ nhiệm từng tháng (tháng 9 → tháng 5), theo dõi em cần quan tâm
// (vấn đề, biện pháp, nhật ký từng lần trao đổi). Lưu class_tool_state tool = 'chu-nhiem' (migration 0077).
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Plus, Printer, RotateCcw, Trash2, UserRoundSearch } from 'lucide-react';
import { saveLabel, schoolYear, uid, useClassTool } from '@/lib/classroom/use-class-tool';
import '@/styles/adm.css';
import '@/styles/btn.css';
import '@/styles/dash.css';
import '@/styles/mini.css';
import '@/styles/ct.css';
import '@/styles/hop.css';
import '@/styles/scn.css';

type Note = { id: string; date: string; text: string };
type Watch = { id: string; studentId: string; issue: string; steps: string; notes: Note[]; done: boolean };
type Book = { year: string; goals: string; months: Record<string, string>; watch: Watch[] };

const MONTHS = ['9', '10', '11', '12', '1', '2', '3', '4', '5'];
// Gợi ý theo nhịp năm học tiểu học — giáo viên sửa lại cho lớp mình
const HINT: Record<string, string> = {
  '9': 'Ổn định nề nếp, bầu ban cán sự lớp\nHọp phụ huynh đầu năm, lập danh bạ\nNắm hoàn cảnh từng em',
  '10': 'Rèn chữ viết, tư thế ngồi học\nTheo dõi em tiếp thu chậm, kèm thêm',
  '11': 'Thi đua chào mừng 20/11\nKiểm tra nề nếp, vở sạch chữ đẹp',
  '12': 'Ôn tập, kiểm tra cuối học kỳ I\nTrao đổi phụ huynh em cần hỗ trợ',
  '1': 'Họp phụ huynh cuối học kỳ I\nNhận xét học kỳ I, khen thưởng',
  '2': 'Ổn định sau Tết, nhắc nề nếp\nAn toàn giao thông, vệ sinh',
  '3': 'Thi đua chào mừng 8/3, 26/3\nĐọc sách, sinh hoạt tập thể',
  '4': 'Ôn tập cuối năm\nTheo dõi sát em chưa hoàn thành',
  '5': 'Kiểm tra cuối năm, nhận xét học bạ\nHọp phụ huynh cuối năm, dặn dò hè',
};
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (d: string) => d.split('-').reverse().join('/');
const norm = (raw: Partial<Book> | null): Book => ({
  year: raw?.year || schoolYear(),
  goals: raw?.goals ?? '',
  months: raw?.months && typeof raw.months === 'object' ? raw.months : {},
  watch: Array.isArray(raw?.watch) ? raw.watch.map((w: Partial<Watch>) => ({ id: w.id || uid(), studentId: w.studentId ?? '', issue: w.issue ?? '', steps: w.steps ?? '', done: !!w.done, notes: Array.isArray(w.notes) ? w.notes : [] })) : [],
});

export default function HomeroomBook({ classId, className, students }: { classId: string; className: string; students: { id: string; name: string }[] }) {
  const { data: b, update, loaded, missing, save } = useClassTool<Book>(classId, 'chu-nhiem', norm(null), norm);
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [pick, setPick] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [showDone, setShowDone] = useState(false);
  const [printing, setPrinting] = useState(false);
  const nameOf = (id: string) => students.find((s) => s.id === id)?.name ?? '(em đã rời lớp)';
  const setW = (id: string, patch: Partial<Watch>) => update((x) => ({ ...x, watch: x.watch.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  const open = b.watch.filter((w) => !w.done);
  const shown = showDone ? b.watch.filter((w) => w.done) : open;
  const m = MONTHS.includes(month) ? month : '9';

  const addWatch = () => {
    if (!pick) return;
    update((x) => ({ ...x, watch: [{ id: uid(), studentId: pick, issue: '', steps: '', notes: [], done: false }, ...x.watch] }));
    setPick(''); setShowDone(false);
  };
  const addNote = (w: Watch) => {
    const text = (draft[w.id] ?? '').trim();
    if (!text) return;
    setW(w.id, { notes: [{ id: uid(), date: today(), text }, ...w.notes] });
    setDraft((d) => ({ ...d, [w.id]: '' }));
  };
  const print = () => { setPrinting(true); window.setTimeout(() => { window.print(); setPrinting(false); }, 60); };

  return (
    <div className="ct hop scn">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Lớp {className} · {students.length} em</p>
          <h1>Sổ chủ nhiệm</h1>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={print} disabled={!loaded}><Printer aria-hidden="true" /> In / lưu PDF</button>
        <span className={`ct-save is-${save}`} aria-live="polite">{saveLabel(save)}</span>
      </div>
      {missing && <p className="adm-alert is-warn">Chưa chạy migration <code>0077_hop_ph_chu_nhiem_len_lop.sql</code> trên Supabase nên chưa lưu lại được.</p>}

      {!loaded ? <p className="dash-muted">Đang tải…</p> : (
        <>
          <section className="dash-card scn-sec">
            <div className="scn-row">
              <h2>Mục tiêu năm học</h2>
              <label className="scn-year">Năm học<input value={b.year} maxLength={20} onChange={(e) => update((x) => ({ ...x, year: e.target.value }))} /></label>
            </div>
            <textarea rows={4} value={b.goals} maxLength={4000} aria-label="Mục tiêu năm học"
              placeholder={'Vd: 100% em đọc thông viết thạo cuối năm\nLớp đạt danh hiệu Lớp tiên tiến\nKhông em nào bỏ học'}
              onChange={(e) => update((x) => ({ ...x, goals: e.target.value }))} />
          </section>

          <section className="dash-card scn-sec">
            <div className="scn-row">
              <h2>Kế hoạch từng tháng</h2>
              <button type="button" className="mini-btn" onClick={() => update((x) => ({ ...x, months: Object.fromEntries(MONTHS.map((k) => [k, x.months[k]?.trim() ? x.months[k] : HINT[k]])) }))}>Điền gợi ý cho tháng còn trống</button>
            </div>
            <div className="scn-months" role="tablist" aria-label="Chọn tháng">
              {MONTHS.map((k) => (
                <button key={k} type="button" role="tab" aria-selected={k === m} className={`${k === m ? 'is-on' : ''} ${b.months[k]?.trim() ? 'has' : ''}`} onClick={() => setMonth(k)}>T{k}</button>
              ))}
            </div>
            <textarea rows={6} value={b.months[m] ?? ''} maxLength={4000} aria-label={`Kế hoạch tháng ${m}`} placeholder={HINT[m]}
              onChange={(e) => update((x) => ({ ...x, months: { ...x.months, [m]: e.target.value } }))} />
          </section>

          <section className="dash-card scn-sec">
            <div className="scn-row">
              <h2><UserRoundSearch aria-hidden="true" /> Em cần quan tâm ({open.length})</h2>
              <button type="button" className="mini-btn" onClick={() => setShowDone((v) => !v)}>{showDone ? 'Xem em đang theo dõi' : `Đã ổn (${b.watch.length - open.length})`}</button>
            </div>
            <div className="scn-add">
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Chọn học sinh">
                <option value="">— Chọn em cần theo dõi —</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" className="btn btn-primary btn-sm" disabled={!pick} onClick={addWatch}><Plus aria-hidden="true" /> Thêm</button>
            </div>
            {!shown.length && <p className="dash-muted">{showDone ? 'Chưa có em nào được đánh dấu đã ổn.' : 'Chưa theo dõi em nào. Chọn em hay vắng, học chậm, hoàn cảnh khó khăn… để ghi lại biện pháp và từng lần trao đổi.'}</p>}
            <div className="scn-cards">
              {shown.map((w) => (
                <article key={w.id} className={`scn-card ${w.done ? 'is-done' : ''}`}>
                  <header><b>{nameOf(w.studentId)}</b>
                    {w.done
                      ? <button type="button" className="mini-btn" onClick={() => setW(w.id, { done: false })}><RotateCcw aria-hidden="true" /> Theo dõi lại</button>
                      : <button type="button" className="mini-btn" onClick={() => setW(w.id, { done: true })}><CheckCircle2 aria-hidden="true" /> Đã ổn</button>}
                    <button type="button" className="mini-btn is-danger" aria-label={`Xoá theo dõi ${nameOf(w.studentId)}`} onClick={() => window.confirm('Xoá hồ sơ theo dõi này?') && update((x) => ({ ...x, watch: x.watch.filter((y) => y.id !== w.id) }))}><Trash2 aria-hidden="true" /></button>
                  </header>
                  <label>Vấn đề<input value={w.issue} maxLength={300} placeholder="Vd: hay nghỉ học, đọc còn đánh vần" onChange={(e) => setW(w.id, { issue: e.target.value })} /></label>
                  <label>Biện pháp<textarea rows={2} value={w.steps} maxLength={1500} placeholder="Vd: kèm 15 phút đầu giờ, nhắn PH mỗi tuần" onChange={(e) => setW(w.id, { steps: e.target.value })} /></label>
                  <div className="scn-note">
                    <input value={draft[w.id] ?? ''} maxLength={500} placeholder="Ghi nhanh hôm nay (đã gọi PH, tiến bộ…)" aria-label="Ghi chú mới"
                      onChange={(e) => setDraft((d) => ({ ...d, [w.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') addNote(w); }} />
                    <button type="button" className="mini-btn" onClick={() => addNote(w)}>Ghi</button>
                  </div>
                  {w.notes.length > 0 && (
                    <ul className="scn-log">{w.notes.slice(0, 6).map((n) => <li key={n.id}><time>{fmt(n.date)}</time> {n.text}</li>)}</ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {printing && createPortal(
        <article className="hop-print hop-doc">
          <h2>SỔ CHỦ NHIỆM LỚP {className.toUpperCase()}</h2>
          <p className="hop-c">Năm học {b.year}</p>
          <p><b>I. Mục tiêu năm học</b></p>
          <p className="hop-pre">{b.goals || '……………………'}</p>
          <p><b>II. Kế hoạch từng tháng</b></p>
          {MONTHS.map((k) => <p key={k} className="hop-pre"><b>Tháng {k}:</b> {b.months[k]?.trim() || '……………………'}</p>)}
          <p><b>III. Theo dõi học sinh cần quan tâm</b></p>
          {b.watch.length ? b.watch.map((w) => (
            <div key={w.id} className="scn-pw">
              <p><b>{nameOf(w.studentId)}</b>{w.done ? ' (đã ổn)' : ''} — {w.issue || '…'}</p>
              {w.steps && <p className="hop-pre">Biện pháp: {w.steps}</p>}
              {w.notes.map((n) => <p key={n.id}>• {fmt(n.date)}: {n.text}</p>)}
            </div>
          )) : <p>Không có.</p>}
        </article>, document.body,
      )}
    </div>
  );
}
