'use client';

// "Nạp tài liệu & Ngân hàng của tôi" (migration 0044) — dùng trong Ra đề kiểm tra và Phiếu bài tập:
//  1) Nạp file Word / Excel hoặc văn bản dán vào → tách thành từng câu (bản nháp) → cô sửa, chọn bài, mức → lưu;
//  2) Sinh câu nâng cao bằng AI (API key của chính cô), có thể dựa vào tài liệu vừa nạp → duyệt từng câu → lưu;
//  3) Xem / xoá câu trong ngân hàng. Câu đã lưu được trộn vào ma trận đề cùng ngân hàng của app.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookUp, Check, Copy, Cpu, FileUp, Library, Lock, Sparkles, Trash2, TriangleAlert, X } from 'lucide-react';
import { autoLocked, makeVariants, promptNumbers } from '@/lib/bank/variants';
import { MUC_NAME, type BookLesson, type Muc } from '@/lib/exams/matrix';
import { ACCEPT_DOCS, checkMath, draftId, draftProblem, extractFile, extractedText, parseExtracted, parseText, type Draft, type DraftType, type Extracted } from '@/lib/bank/parse';
import { bankError, deleteMine, generateWithAi, machineDrafts, saveDrafts, type MyQuestion } from '@/lib/bank/client';
import type { SubjectCode } from '@/lib/types';

type Tab = 'nap' | 'ai' | 'kho';
const TYPE_NAME: Record<DraftType, string> = { single_choice: 'Trắc nghiệm 1 đáp án', multiple_choice: 'Trắc nghiệm nhiều đáp án', true_false: 'Đúng / Sai', fill_blank: 'Tự luận / điền đáp án' };
const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const ansText = (q: MyQuestion) => {
  const a = q.answer as { correct?: string | string[]; accepted?: string[] };
  return Array.isArray(a.accepted) ? a.accepted.join(' / ') : Array.isArray(a.correct) ? a.correct.join(', ') : a.correct ?? '';
};

/** Câu tương tự (Toán): bấm số để giữ cố định, rồi tạo 3 câu đổi số — máy tự tính lại đáp án */
function VariantRow({ d, onMake }: { d: Draft; onMake: (locked: number[]) => void }) {
  const nums = promptNumbers(d.prompt);
  const [locked, setLocked] = useState<number[]>(() => autoLocked(d.prompt));
  useEffect(() => { setLocked(autoLocked(d.prompt)); }, [d.prompt]);
  if (!nums.length) return null;
  return (
    <div className="mb-var">
      <span>Câu tương tự:</span>
      {nums.map((v, i) => (
        <button key={i} type="button" className={locked.includes(i) ? 'is-lock' : ''} aria-pressed={locked.includes(i)} title={locked.includes(i) ? 'Đang giữ cố định — bấm để cho đổi' : 'Bấm để giữ cố định số này'}
          onClick={() => setLocked((l) => (l.includes(i) ? l.filter((x) => x !== i) : [...l, i]))}>{locked.includes(i) && <Lock aria-hidden="true" />}{v}</button>
      ))}
      <button type="button" className="mini-btn" onClick={() => onMake(locked)}><Copy aria-hidden="true" /> Tạo 3 câu đổi số</button>
    </div>
  );
}

function DraftCard({ d, n, lessons, subject, onChange, onRemove, onVariants }: { d: Draft; n: number; lessons: BookLesson[]; subject: SubjectCode; onChange: (d: Draft) => void; onRemove: () => void; onVariants?: (locked: number[]) => void }) {
  const set = (p: Partial<Draft>) => onChange({ ...d, ...p });
  const choice = d.type === 'single_choice' || d.type === 'multiple_choice';
  const problem = draftProblem(d);
  const math = subject === 'toan' ? checkMath(d) : undefined;
  const warn = problem ?? math ?? (d.warn && !d.correct.length ? d.warn : undefined);
  const setType = (t: DraftType) => {
    if (t === 'single_choice' || t === 'multiple_choice') set({ type: t, options: d.options.length >= 2 ? d.options : ['', '', '', ''], correct: t === 'single_choice' ? d.correct.slice(0, 1) : d.correct });
    else if (t === 'true_false') set({ type: t, correct: [d.correct[0] === 'Sai' ? 'Sai' : 'Đúng'] });
    else set({ type: t, correct: choice ? d.correct.slice(0, 1) : d.correct });
  };
  return (
    <article className={`mb-card${d.include ? '' : ' is-off'}${warn ? ' has-warn' : ''}`}>
      <header>
        <label className="mb-inc"><input type="checkbox" checked={d.include} onChange={(e) => set({ include: e.target.checked })} /> <b>Câu {n}</b></label>
        <select value={d.type} onChange={(e) => setType(e.target.value as DraftType)} aria-label="Dạng câu">{(Object.keys(TYPE_NAME) as DraftType[]).map((t) => <option key={t} value={t}>{TYPE_NAME[t]}</option>)}</select>
        <select value={d.muc} onChange={(e) => set({ muc: Number(e.target.value) as Muc })} aria-label="Mức">{([1, 2, 3] as Muc[]).map((m) => <option key={m} value={m}>{MUC_NAME[m]}</option>)}</select>
        <select className="mb-lesson" value={d.lessonId} onChange={(e) => set({ lessonId: e.target.value })} aria-label="Bài">{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
        {d.source === 'AI' && <span className="mb-ai"><Sparkles aria-hidden="true" /> AI</span>}
        <button type="button" className="mb-x" onClick={onRemove} aria-label={`Bỏ câu ${n}`}><X aria-hidden="true" /></button>
      </header>
      <textarea className="mb-prompt" rows={Math.min(5, Math.max(2, Math.ceil(d.prompt.length / 80)))} value={d.prompt} onChange={(e) => set({ prompt: e.target.value })} aria-label="Nội dung câu hỏi" />
      {choice && (
        <div className="mb-opts">
          {d.options.map((o, i) => (
            <label key={i} className={d.correct.includes(o) && o ? 'is-ok' : ''}>
              <input type={d.type === 'single_choice' ? 'radio' : 'checkbox'} name={`ok-${d.id}`} checked={!!o && d.correct.includes(o)} title="Đáp án đúng"
                onChange={(e) => set({ correct: d.type === 'single_choice' ? [o] : e.target.checked ? [...d.correct, o] : d.correct.filter((c) => c !== o) })} />
              <span>{'ABCDEFGH'[i]}.</span>
              <input value={o} onChange={(e) => { const v = e.target.value; const opts = d.options.map((x, k) => (k === i ? v : x)); set({ options: opts, correct: d.correct.map((c) => (c === o ? v : c)) }); }} aria-label={`Phương án ${'ABCDEFGH'[i]}`} />
            </label>
          ))}
          {d.options.length < 6 && <button type="button" className="mini-btn" onClick={() => set({ options: [...d.options, ''] })}>+ Phương án</button>}
        </div>
      )}
      {d.type === 'true_false' && (
        <div className="mb-tf">Đáp án: {(['Đúng', 'Sai'] as const).map((v) => <label key={v}><input type="radio" name={`tf-${d.id}`} checked={d.correct[0] === v} onChange={() => set({ correct: [v] })} /> {v}</label>)}</div>
      )}
      {d.type === 'fill_blank' && (
        <label className="mb-fill"><span>Đáp án / hướng dẫn chấm <small>(nhiều đáp án cách nhau bằng dấu ;)</small></span>
          <input value={d.correct.join('; ')} onChange={(e) => set({ correct: e.target.value.split(';').map((x) => x.trim()).filter(Boolean) })} /></label>
      )}
      <details className="mb-sol" open={!!d.explanation}>
        <summary>Lời giải / giải thích</summary>
        <textarea rows={2} value={d.explanation} onChange={(e) => set({ explanation: e.target.value })} aria-label="Lời giải" />
      </details>
      {warn && <p className="mb-warn"><TriangleAlert aria-hidden="true" /> {warn}</p>}
      {subject === 'toan' && onVariants && d.type !== 'true_false' && <VariantRow d={d} onMake={onVariants} />}
    </article>
  );
}

export default function MyBankPanel({ subject, grade, lessons, defaultLessonId, mine, onSaved, onDeleted, onClose }: {
  subject: SubjectCode; grade: number; lessons: BookLesson[]; defaultLessonId: string; mine: MyQuestion[] | null;
  onSaved: (rows: MyQuestion[]) => void; onDeleted: (ids: string[]) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>('nap');
  const [lessonId, setLessonId] = useState(defaultLessonId || lessons[0]?.id || '');
  const [doc, setDoc] = useState<Extracted | null>(null);
  const [paste, setPaste] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [ai, setAi] = useState({ muc: 3 as Muc, count: 5, kind: 'mix' as 'choice' | 'open' | 'mix', useDoc: true, note: '' });
  const [filter, setFilter] = useState('');
  const [pick, setPick] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const titleOf = (id: string) => lessons.find((l) => l.id === id)?.title ?? '';
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [busy, onClose]);

  const onFile = async (f: File) => {
    setBusy('Đang đọc tài liệu…'); setMsg(null);
    try {
      const e = await extractFile(f);
      setDoc(e);
      const ds = parseExtracted(e, lessons, lessonId);
      setDrafts((cur) => [...cur, ...ds]);
      setMsg(ds.length
        ? { kind: 'ok', text: `Đã tách ${ds.length} câu từ “${f.name}”. Xem lại từng câu (đáp án, mức, bài) rồi bấm “Lưu vào ngân hàng”.` }
        : { kind: 'info', text: `Không thấy câu hỏi dạng “Câu 1… A. B. C. D.” trong “${f.name}”. Tài liệu vẫn dùng được làm nguồn cho mục “Sinh câu bằng AI”.` });
    } catch (e) { setMsg({ kind: 'error', text: e instanceof Error ? e.message : 'Không đọc được file.' }); }
    finally { setBusy(''); if (fileRef.current) fileRef.current.value = ''; }
  };
  const onPaste = () => {
    const lines = paste.split(/\r?\n/);
    const ds = parseText(lines, lessons, lessonId, 'Dán vào');
    setDoc({ kind: 'text', lines, name: 'Nội dung dán vào' });
    setDrafts((cur) => [...cur, ...ds]);
    setMsg(ds.length ? { kind: 'ok', text: `Đã tách ${ds.length} câu.` } : { kind: 'info', text: 'Chưa thấy câu hỏi nào — nội dung vẫn dùng được làm nguồn cho AI.' });
  };
  const runAi = async () => {
    setBusy('AI đang soạn câu hỏi… (10–40 giây)'); setMsg(null);
    try {
      const source = ai.useDoc && doc ? extractedText(doc).slice(0, 14000) : '';
      const ds = await generateWithAi({ subject, grade, lessonId, lessonTitle: titleOf(lessonId), muc: ai.muc, count: ai.count, kind: ai.kind, source, note: ai.note });
      setDrafts((cur) => [...ds, ...cur]);
      setMsg({ kind: 'ok', text: `AI đã soạn ${ds.length} câu. Cô đọc kỹ, sửa nếu cần rồi lưu — đặc biệt kiểm tra đáp án.` });
    } catch (e) { setMsg({ kind: 'error', text: `${e instanceof Error ? e.message : 'AI chưa trả lời được.'} Trong lúc chờ, bấm “Sinh bằng máy (miễn phí)” để lấy câu từ bộ sinh câu của app.` }); }
    finally { setBusy(''); }
  };
  const runMachine = () => {
    const skip = new Set([...drafts.map((d) => d.prompt.trim().toLowerCase()), ...(mine ?? []).map((q) => q.prompt.trim().toLowerCase())]);
    const ds = machineDrafts(lessonId, ai.muc, ai.count, skip);
    setDrafts((cur) => [...ds, ...cur]);
    setMsg(ds.length
      ? { kind: 'ok', text: `Máy đã sinh ${ds.length} câu ${MUC_NAME[ai.muc]} cho bài “${titleOf(lessonId)}” (miễn phí, không cần AI). Bấm lần nữa để có câu khác.` }
      : { kind: 'info', text: `Bộ sinh câu của app chưa có thêm câu ${MUC_NAME[ai.muc]} cho bài này — thử mức khác, bài khác hoặc dùng AI.` });
  };
  const chosen = drafts.filter((d) => d.include);
  const bad = chosen.filter((d) => draftProblem(d));
  const save = async () => {
    if (!chosen.length) return;
    if (bad.length) { setMsg({ kind: 'error', text: `Còn ${bad.length} câu thiếu nội dung / đáp án — sửa hoặc bỏ chọn trước khi lưu.` }); return; }
    setBusy('Đang lưu…');
    try {
      const rows = await saveDrafts(subject, grade, chosen, titleOf);
      onSaved(rows);
      setDrafts((cur) => cur.filter((d) => !d.include));
      setMsg({ kind: 'ok', text: `Đã lưu ${rows.length} câu vào Ngân hàng của tôi. Câu sẽ được chọn khi ra đề / phiếu bài tập của bài tương ứng.` });
    } catch (e) { setMsg({ kind: 'error', text: bankError(e) }); }
    finally { setBusy(''); }
  };
  // câu tương tự: chèn ngay sau câu gốc
  const variantsOf = (d: Draft, locked?: number[]) => {
    const r = makeVariants(d, 3, grade, locked);
    if (!r.drafts.length) { setMsg({ kind: 'info', text: r.reason ?? 'Chưa tạo được câu tương tự.' }); return; }
    setDrafts((ds) => { const i = ds.findIndex((x) => x.id === d.id); const out = [...ds]; out.splice(i < 0 ? 0 : i + 1, 0, ...r.drafts); return out; });
    setMsg({ kind: 'ok', text: `Đã tạo ${r.drafts.length} câu tương tự (đổi số, máy tự tính lại đáp án) ngay dưới câu gốc — xem lại rồi lưu.` });
  };
  const variantsFromSaved = () => {
    const src = (mine ?? []).filter((q) => pick.has(q.id));
    let made = 0, skipped = 0;
    const out: Draft[] = [];
    for (const q of src) {
      const a = q.answer as { correct?: string | string[]; accepted?: string[] };
      const correct = Array.isArray(a.accepted) ? a.accepted : Array.isArray(a.correct) ? a.correct : a.correct ? [a.correct] : [];
      const d: Draft = { id: draftId(), type: q.type, prompt: q.prompt, options: q.options ?? [], correct, muc: q.muc, lessonId: q.lesson_id ?? lessonId, explanation: q.explanation, source: q.source, include: true };
      const r = makeVariants(d, 3, grade);
      if (r.drafts.length) { made += r.drafts.length; out.push(...r.drafts); } else skipped++;
    }
    setDrafts((ds) => [...out, ...ds]);
    setTab('nap');
    setMsg(made
      ? { kind: 'ok', text: `Đã tạo ${made} câu tương tự từ ${src.length - skipped} câu${skipped ? ` (${skipped} câu không có phép tính nên bỏ qua)` : ''}. Xem lại rồi bấm “Lưu vào ngân hàng”.` }
      : { kind: 'info', text: 'Các câu đã chọn chưa có phép tính trong đề hoặc lời giải (dạng “6 x 5 = 30”) nên máy chưa đổi số được.' });
  };
  const del = async () => {
    const ids = [...pick];
    if (!ids.length || !window.confirm(`Xoá ${ids.length} câu khỏi ngân hàng?`)) return;
    setBusy('Đang xoá…');
    try { await deleteMine(ids); onDeleted(ids); setPick(new Set()); } catch (e) { setMsg({ kind: 'error', text: bankError(e) }); }
    finally { setBusy(''); }
  };
  const shown = useMemo(() => (mine ?? []).filter((q) => !filter || q.lesson_id === filter), [mine, filter]);
  const byLesson = useMemo(() => { const m = new Map<string, number>(); (mine ?? []).forEach((q) => { if (q.lesson_id) m.set(q.lesson_id, (m.get(q.lesson_id) ?? 0) + 1); }); return m; }, [mine]);
  const lessonSelect = (
    <label className="mb-f"><span>Bài (câu nào không rõ bài sẽ gắn vào bài này)</span>
      <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
    </label>
  );

  return (
    <div className="mb-scrim" role="dialog" aria-modal="true" aria-label="Nạp tài liệu và ngân hàng của tôi" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="mb">
        <header className="mb-head">
          <h2><Library aria-hidden="true" /> Ngân hàng của tôi · {SUBJECT_NAME[subject]} lớp {grade}</h2>
          <button type="button" className="mb-x" onClick={onClose} aria-label="Đóng"><X aria-hidden="true" /></button>
        </header>
        <nav className="gm-tabs mb-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'nap'} className={tab === 'nap' ? 'is-on' : ''} onClick={() => setTab('nap')}><FileUp aria-hidden="true" /> Nạp tài liệu</button>
          <button type="button" role="tab" aria-selected={tab === 'ai'} className={tab === 'ai' ? 'is-on' : ''} onClick={() => setTab('ai')}><Sparkles aria-hidden="true" /> Sinh câu nâng cao (AI)</button>
          <button type="button" role="tab" aria-selected={tab === 'kho'} className={tab === 'kho' ? 'is-on' : ''} onClick={() => setTab('kho')}><BookUp aria-hidden="true" /> Đã lưu ({mine?.length ?? 0})</button>
        </nav>

        <div className="mb-body">
          {tab === 'nap' && (
            <section className="mb-sec">
              {lessonSelect}
              <input ref={fileRef} type="file" accept={ACCEPT_DOCS} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }} />
              <button type="button" className="mb-drop" disabled={!!busy} onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onFile(f); }}>
                <FileUp aria-hidden="true" /><b>Chọn hoặc kéo thả file vào đây</b>
                <small>Word (.docx) hoặc Excel (.xlsx) — đọc ngay trên máy cô, file không gửi lên máy chủ. File PDF: mở bằng Word để chuyển sang .docx trước.</small>
              </button>
              <details className="mb-help"><summary>Đề nên viết thế nào để app tách đúng?</summary>
                <ul>
                  <li><b>Câu 1:</b> nội dung… (ghi <b>(M1)</b>, <b>(M2)</b>, <b>(M3)</b> để đặt mức)</li>
                  <li><b>A.</b> … <b>B.</b> … <b>C.</b> … <b>D.</b> … — cùng một dòng hoặc mỗi dòng một phương án; <b>*B.</b> hoặc “(đúng)” đánh dấu đáp án</li>
                  <li><b>Đáp án:</b> B &nbsp;/&nbsp; <b>Đáp số:</b> 30 quả cam &nbsp;/&nbsp; <b>Lời giải:</b> … ngay dưới câu; hoặc bảng <b>ĐÁP ÁN</b> cuối đề: 1-B, 2-C…</li>
                  <li>Excel: dòng đầu là tiêu đề cột <b>Câu hỏi | A | B | C | D | Đáp án | Mức | Bài | Giải thích</b></li>
                </ul>
              </details>
              <label className="mb-f"><span>Hoặc dán nội dung đề</span><textarea rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Câu 1: 6 x 7 = ?\nA. 36   B. 42   C. 48   D. 54\nĐáp án: B'} /></label>
              <button type="button" className="btn btn-outline btn-sm" disabled={!paste.trim() || !!busy} onClick={onPaste}>Tách câu từ nội dung dán</button>
              {doc && <p className="dash-muted">Tài liệu đang mở: <b>{doc.name}</b> ({extractedText(doc).length.toLocaleString('vi-VN')} ký tự) — dùng được làm nguồn cho mục Sinh câu bằng AI.</p>}
            </section>
          )}

          {tab === 'ai' && (
            <section className="mb-sec">
              {lessonSelect}
              <div className="mb-grid">
                <label className="mb-f"><span>Mức</span><select value={ai.muc} onChange={(e) => setAi({ ...ai, muc: Number(e.target.value) as Muc })}>{([1, 2, 3] as Muc[]).map((m) => <option key={m} value={m}>{MUC_NAME[m]}</option>)}</select></label>
                <label className="mb-f"><span>Số câu</span><select value={ai.count} onChange={(e) => setAi({ ...ai, count: Number(e.target.value) })}>{[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} câu</option>)}</select></label>
                <label className="mb-f"><span>Dạng câu</span><select value={ai.kind} onChange={(e) => setAi({ ...ai, kind: e.target.value as typeof ai.kind })}><option value="mix">Trộn trắc nghiệm + tự luận</option><option value="choice">Trắc nghiệm</option><option value="open">Tự luận / bài toán có lời văn</option></select></label>
              </div>
              <label className="mb-check"><input type="checkbox" checked={ai.useDoc && !!doc} disabled={!doc} onChange={(e) => setAi({ ...ai, useDoc: e.target.checked })} />
                {doc ? <>Dựa vào tài liệu đã nạp: <b>{doc.name}</b></> : <>Chưa nạp tài liệu (mục “Nạp tài liệu”) — AI soạn theo tên bài</>}</label>
              <label className="mb-f"><span>Yêu cầu thêm <small>(không bắt buộc)</small></span><input value={ai.note} maxLength={500} onChange={(e) => setAi({ ...ai, note: e.target.value })} placeholder="VD: bài toán về tiền Việt Nam; ngữ liệu về mùa thu; không dùng số quá 1000" /></label>
              <div className="mb-row">
                <button type="button" className="btn btn-primary btn-sm" disabled={!!busy || !lessonId} onClick={() => void runAi()}><Sparkles aria-hidden="true" /> Sinh câu bằng AI</button>
                <button type="button" className="btn btn-outline btn-sm" disabled={!!busy || !lessonId} onClick={runMachine} title="Lấy câu từ bộ sinh câu tự động của app — không cần API key, không tốn lượt"><Cpu aria-hidden="true" /> Sinh bằng máy (miễn phí)</button>
              </div>
              <p className="dash-muted mb-note">Dùng API key Gemini / OpenAI của cô (nối ở Trợ lý AI). AI có thể sai: app tự tính lại phép tính môn Toán và đánh dấu câu nghi sai, cô vẫn cần đọc kỹ trước khi lưu. Chỉ nạp tài liệu cô được phép dùng.</p>
            </section>
          )}

          {tab === 'kho' && (
            <section className="mb-sec">
              <div className="mb-row">
                <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc theo bài">
                  <option value="">Tất cả bài ({mine?.length ?? 0} câu)</option>
                  {lessons.filter((l) => byLesson.has(l.id)).map((l) => <option key={l.id} value={l.id}>{l.title} ({byLesson.get(l.id)})</option>)}
                </select>
                {subject === 'toan' && <button type="button" className="mini-btn" disabled={!pick.size || !!busy} onClick={variantsFromSaved} title="Đổi số trong câu, máy tự tính lại đáp án — không cần AI"><Copy aria-hidden="true" /> Tạo câu tương tự {pick.size || ''}</button>}
                <button type="button" className="mini-btn is-danger" disabled={!pick.size || !!busy} onClick={() => void del()}><Trash2 aria-hidden="true" /> Xoá {pick.size || ''}</button>
              </div>
              {!mine?.length && <p className="dash-muted">Chưa có câu nào. Nạp tài liệu hoặc sinh câu bằng AI rồi lưu lại.</p>}
              {subject === 'toan' && !!mine?.length && <p className="dash-muted mb-note">Đánh dấu các câu mẫu rồi bấm <b>Tạo câu tương tự</b>: máy đổi số trong câu và tự tính lại đáp án (cần có phép tính trong đề hoặc lời giải dạng “6 x 5 = 30”). Không cần AI.</p>}
              <ul className="mb-list">
                {shown.slice(0, 300).map((q) => (
                  <li key={q.id}>
                    <input type="checkbox" checked={pick.has(q.id)} onChange={(e) => setPick((s) => { const n = new Set(s); if (e.target.checked) n.add(q.id); else n.delete(q.id); return n; })} aria-label="Chọn câu" />
                    <span className={`mb-m m${q.muc}`}>M{q.muc}</span>
                    <span className="mb-q"><b>{q.prompt}</b><small>{q.options.length ? `${q.options.join(' · ')} — ` : ''}Đáp án: {ansText(q) || '—'} · {q.lesson_title || 'chưa gắn bài'}{q.source ? ` · ${q.source}` : ''}</small></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {busy && <p className="adm-alert is-info" role="status">{busy}</p>}
          {msg && <p className={`adm-alert is-${msg.kind}`} role="status">{msg.text}</p>}

          {tab !== 'kho' && drafts.length > 0 && (
            <section className="mb-drafts" aria-label="Câu chờ duyệt">
              <div className="mb-row mb-sticky">
                <b>{drafts.length} câu chờ duyệt · đã chọn {chosen.length}{bad.length ? ` · ${bad.length} câu cần sửa` : ''}</b>
                <button type="button" className="mini-btn" onClick={() => setDrafts((ds) => ds.map((d) => ({ ...d, include: chosen.length !== ds.length })))}>{chosen.length === drafts.length ? 'Bỏ chọn hết' : 'Chọn hết'}</button>
                <button type="button" className="mini-btn" onClick={() => setDrafts([])}>Xoá danh sách</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={!chosen.length || !!busy} onClick={() => void save()}><Check aria-hidden="true" /> Lưu {chosen.length} câu vào ngân hàng</button>
              </div>
              {drafts.map((d, i) => (
                <DraftCard key={d.id} d={d} n={i + 1} lessons={lessons} subject={subject} onVariants={(lk) => variantsOf(d, lk)}
                  onChange={(nd) => setDrafts((ds) => ds.map((x) => (x.id === d.id ? nd : x)))} onRemove={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))} />
              ))}
              <button type="button" className="mini-btn" onClick={() => setDrafts((ds) => [...ds, { id: draftId(), type: 'single_choice', prompt: '', options: ['', '', '', ''], correct: [], muc: 2, lessonId, explanation: '', source: 'Tự soạn', include: true }])}>+ Thêm câu tự soạn</button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
