'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileDown, FilePlus2, FolderOpen, Library, Printer, RefreshCw, Save, Shuffle, Table2, Trash2 } from 'lucide-react';
import MyBankPanel from './MyBankPanel';
import { useMyBank } from './useMyBank';
import { createClient } from '@/lib/supabase/client';
import AssignPaperForm from '@/components/classroom/AssignPaperForm';
import type { ExamItem } from '@/lib/classroom/assignments';
import { schoolYearOf } from '@/lib/classroom/comments';
import { EXAM_NAME, examsFor, type ExamCode } from '@/lib/classroom/school';
import {
  MUCS, MUC_DESC, MUC_NAME, available, bookLessons, buildPaper, defaultMatrix, outcomesIn, replaceSlot, shufflePaper, totals,
  type BookLesson, type Matrix, type Muc, type Paper,
} from '@/lib/exams/matrix';
import { answerText, downloadDoc, examDocument, printDoc } from '@/lib/exams/word';
import { findOutcomeAny } from '@/lib/curriculum';
import type { SubjectCode } from '@/lib/types';

type Saved = { id: string; title: string; subject: SubjectCode; exam_code: string; updated_at: string };
type ExamKind = ExamCode | 'khac';
type Msg = { kind: 'ok' | 'error' | 'info'; text: string } | null;
type MixMode = 'khac' | 'tron';
type Data = { school: string; minutes: number; fromId: string; toId: string; total: number; nPapers: number; mode?: MixMode; matrix: Matrix; papers: Paper[] };
const CODES = 'ABCD';

const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const KIND_NAME: Record<ExamKind, string> = { ...EXAM_NAME, khac: 'Kiểm tra khác' };
const SCHOOL_KEY = 'edukid:exam-school';
const notReady = (m: string) => /function|does not exist|schema cache/i.test(m);
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Phạm vi bài mặc định theo loại bài kiểm tra */
function defaultRange(lessons: BookLesson[], kind: ExamKind): [string, string] {
  const s1 = lessons.filter((l) => l.semester === 1);
  const s2 = lessons.filter((l) => l.semester === 2);
  const half = (a: BookLesson[]) => a.slice(0, Math.max(1, Math.ceil(a.length / 2)));
  const pick = kind === 'gk1' ? half(s1) : kind === 'ck1' ? s1 : kind === 'gk2' ? half(s2) : kind === 'ck2' ? s2 : lessons;
  const list = pick.length ? pick : lessons;
  return [list[0]?.id ?? '', list[list.length - 1]?.id ?? ''];
}

export default function ExamBuilder({ classId, className, grade }: { classId: string; className: string; grade: number }) {
  const year = useMemo(() => schoolYearOf(), []);
  const kinds: ExamKind[] = [...examsFor(grade), 'khac'];
  const subjects = (['toan', 'tieng-viet', 'tieng-anh'] as SubjectCode[]).filter((s) => bookLessons(s, grade).length > 0);

  const [saved, setSaved] = useState<Saved[]>([]);
  const [examId, setExamId] = useState<string | null>(null);
  const [subject, setSubject] = useState<SubjectCode>(subjects[0] ?? 'toan');
  const [kind, setKind] = useState<ExamKind>(kinds.includes('ck1') ? 'ck1' : kinds[0]);
  const [title, setTitle] = useState('');
  const [school, setSchool] = useState('');
  const [minutes, setMinutes] = useState(40);
  const lessons = useMemo(() => bookLessons(subject, grade), [subject, grade]);
  const [range, setRange] = useState<[string, string]>(() => defaultRange(bookLessons(subjects[0] ?? 'toan', grade), kinds.includes('ck1') ? 'ck1' : kinds[0]));
  const [total, setTotal] = useState(10);
  const [nPapers, setNPapers] = useState(2);
  const [mode, setMode] = useState<MixMode>('khac');
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  // Ngân hàng của tôi (câu nạp từ tài liệu / sinh bằng AI) — trộn vào kho chọn câu
  const bank = useMyBank(subject, grade);
  const [bankOpen, setBankOpen] = useState(false);
  useEffect(() => { setMatrix((m) => (m ? { ...m } : m)); }, [bank.ver]);

  useEffect(() => { try { setSchool(localStorage.getItem(SCHOOL_KEY) ?? ''); } catch { /* bỏ qua */ } }, []);
  useEffect(() => { try { localStorage.setItem(SCHOOL_KEY, school); } catch { /* bỏ qua */ } }, [school]);

  const autoTitle = `Bài kiểm tra ${KIND_NAME[kind].charAt(0).toLowerCase()}${KIND_NAME[kind].slice(1)} – ${SUBJECT_NAME[subject]}`;
  const chosen = useMemo(() => {
    const a = lessons.findIndex((l) => l.id === range[0]);
    const b = lessons.findIndex((l) => l.id === range[1]);
    if (a < 0 || b < 0) return [];
    return lessons.slice(Math.min(a, b), Math.max(a, b) + 1);
  }, [lessons, range]);

  const loadList = useCallback(async () => {
    const { data, error } = await createClient().rpc('teacher_list_exams', { p_class: classId });
    if (error) { if (notReady(error.message)) setMsg({ kind: 'info', text: 'Chưa bật lưu đề: chạy supabase/migrations/0015_exam_papers.sql trên Supabase. Vẫn tạo và tải đề Word được.' }); return; }
    setSaved((data ?? []) as Saved[]);
  }, [classId]);
  useEffect(() => { void loadList(); }, [loadList]);

  const resetFor = (s: SubjectCode, k: ExamKind) => {
    setRange(defaultRange(bookLessons(s, grade), k));
    setMatrix(null);
    setPapers([]);
    setExamId(null);
    setTitle('');
  };

  const makeMatrix = () => {
    if (!chosen.length) return setMsg({ kind: 'error', text: 'Chọn phạm vi bài cho đề.' });
    setMatrix(defaultMatrix(chosen, total));
    setPapers([]);
    setMsg({ kind: 'info', text: 'Đã lập ma trận gợi ý (tỉ lệ 50% · 30% · 20%). Thầy cô chỉnh số câu, điểm từng mức rồi bấm "Tạo đề".' });
  };

  const avail = useMemo(() => matrix?.rows.map((r) => available(r.lessonIds, matrix.exclude)) ?? [], [matrix]);
  // Yêu cầu cần đạt trong phạm vi đề: giáo viên bỏ chọn YCCĐ không muốn kiểm tra
  const outcomeList = useMemo(() => (matrix ? outcomesIn(matrix.rows.flatMap((r) => r.lessonIds)) : [])
    .map((o) => ({ ...o, text: findOutcomeAny(subject, o.code)?.outcome.text ?? o.code })), [matrix, subject]);
  const outcomeText = useMemo(() => Object.fromEntries(outcomeList.map((o) => [o.code, o.text])), [outcomeList]);
  const toggleOutcome = (code: string, on: boolean) => {
    setMatrix((m) => {
      if (!m) return m;
      const exclude = on ? (m.exclude ?? []).filter((c) => c !== code) : [...(m.exclude ?? []), code];
      // giảm số câu ô nào vượt số câu còn lại sau khi lọc
      const rows = m.rows.map((r) => {
        const a = available(r.lessonIds, exclude);
        return { ...r, counts: { 1: Math.min(r.counts[1], a[1]), 2: Math.min(r.counts[2], a[2]), 3: Math.min(r.counts[3], a[3]) } };
      });
      return { ...m, exclude, rows };
    });
    setPapers([]);
  };
  const t = matrix ? totals(matrix) : null;

  const setCount = (ri: number, k: Muc, v: number) => setMatrix((m) => m && ({ ...m, rows: m.rows.map((r, i) => (i === ri ? { ...r, counts: { ...r.counts, [k]: Math.max(0, Math.min(v || 0, avail[ri]?.[k] ?? 0)) } } : r)) }));
  const setPoint = (k: Muc, v: number) => setMatrix((m) => m && ({ ...m, points: { ...m.points, [k]: Math.max(0, Math.min(v || 0, 10)) } }));

  const makePapers = () => {
    if (!matrix || !t?.questions) return setMsg({ kind: 'error', text: 'Ma trận chưa có câu nào.' });
    const out: Paper[] = [];
    const avoid = new Set<string>();
    for (let i = 0; i < nPapers; i++) {
      const code = nPapers > 1 ? CODES[i] : '';
      if (mode === 'tron' && i > 0) { out.push(shufflePaper(out[0], newSeed(), code)); continue; }
      const p = buildPaper(matrix, newSeed(), code, avoid);
      p.slots.forEach((s) => avoid.add(s.q.key));
      out.push(p);
    }
    setPapers(out);
    const miss = out.flatMap((p) => p.missing);
    setMsg(miss.length
      ? { kind: 'info', text: `Đã tạo đề, nhưng ${miss.length} ô ma trận chưa đủ câu khác nhau (ngân hàng còn ít câu cho chủ đề đó). Thầy cô giảm số câu ô đó, chọn cách “Trộn từ đề A”, hoặc tạo ít đề hơn.` }
      : { kind: 'ok', text: `Đã tạo ${out.length} đề${Math.abs(t.score - 10) > 0.001 ? ` — lưu ý tổng điểm đang là ${t.score}, chưa bằng 10` : ''}.` });
  };

  const swap = (pi: number, si: number) => {
    if (!matrix) return;
    const avoid = new Set(papers.filter((_, i) => i !== pi).flatMap((p) => p.slots.map((s) => s.q.key)));
    setPapers((ps) => ps.map((p, i) => (i === pi ? replaceSlot(matrix, p, si, newSeed(), avoid) : p)));
  };

  const data = (): Data | null => (matrix ? { school, minutes, fromId: range[0], toId: range[1], total, nPapers, mode, matrix, papers } : null);

  const save = async () => {
    const d = data();
    if (!d || !papers.length) return setMsg({ kind: 'error', text: 'Tạo đề trước khi lưu.' });
    setBusy(true);
    const { data: id, error } = await createClient().rpc('teacher_save_exam', {
      p_class: classId, p_exam: examId, p_title: (title || autoTitle).slice(0, 200), p_subject: subject, p_exam_code: `${kind}-${year}`, p_data: d,
    });
    setBusy(false);
    if (error) return setMsg({ kind: 'error', text: notReady(error.message) ? 'Chưa bật lưu đề: chạy supabase/migrations/0015_exam_papers.sql trên Supabase.' : 'Chưa lưu được. Thử lại sau.' });
    setExamId(id as string);
    setMsg({ kind: 'ok', text: 'Đã lưu đề vào lớp.' });
    void loadList();
  };

  const open = async (id: string) => {
    setBusy(true);
    const { data: rows, error } = await createClient().rpc('teacher_get_exam', { p_exam: id });
    setBusy(false);
    const row = ((rows ?? []) as { id: string; title: string; subject: SubjectCode; exam_code: string; data: Data }[])[0];
    if (error || !row) return setMsg({ kind: 'error', text: 'Không mở được đề.' });
    const k = row.exam_code.split('-')[0] as ExamKind;
    setExamId(row.id); setTitle(row.title); setSubject(row.subject); setKind(kinds.includes(k) ? k : 'khac');
    setSchool(row.data.school ?? school); setMinutes(row.data.minutes ?? 40); setRange([row.data.fromId, row.data.toId]);
    setTotal(row.data.total ?? 10); setNPapers(row.data.nPapers ?? 1); setMode(row.data.mode ?? 'khac'); setMatrix(row.data.matrix); setPapers(row.data.papers ?? []);
    setMsg({ kind: 'info', text: `Đã mở "${row.title}".` });
  };

  const remove = async (s: Saved) => {
    if (!window.confirm(`Xoá đề "${s.title}"?`)) return;
    const { error } = await createClient().rpc('teacher_delete_exam', { p_exam: s.id });
    if (error) return setMsg({ kind: 'error', text: 'Chưa xoá được.' });
    if (examId === s.id) setExamId(null);
    void loadList();
  };

  const download = (parts: { matrix: boolean; papers: boolean; keys: boolean }, suffix: string) => {
    if (!matrix) return;
    const meta = { school, title: title || autoTitle, subjectName: SUBJECT_NAME[subject], grade, className, yearLabel: `${year}–${year + 1}`, minutes, outcomes: outcomeText };
    const html = examDocument(meta, matrix, papers, new Map(lessons.map((l) => [l.id, l.title])), parts);
    if (suffix === 'pdf') return printDoc(html);
    downloadDoc(`${SUBJECT_NAME[subject]}-lop${grade}-${kind}-${suffix}`.replace(/\s+/g, '-'), html);
  };

  return (
    <div className="exam-builder">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><Table2 aria-hidden="true" /> Ma trận và đề kiểm tra</h1>
          <p className="dash-muted">
            Chọn môn, phạm vi bài, lập ma trận theo 3 mức (Mức 1 nhận biết · Mức 2 kết nối · Mức 3 vận dụng), máy chọn câu từ ngân hàng câu hỏi tự soạn của EduChain Kids.
            Thầy cô đổi từng câu nếu cần, rồi tải file Word gồm ma trận, bản đặc tả, đề và đáp án — hoặc giao đề cho cả lớp làm trực tiếp trên app, máy chấm và thống kê từng câu. Câu có tranh vẽ không đưa vào đề.
          </p>
        </div>
      </header>

      <section className="dash-section no-print mybank-bar" aria-label="Ngân hàng của tôi">
        <div>
          <b><Library aria-hidden="true" /> Ngân hàng của tôi: {bank.mine ? `${bank.mine.length} câu ${SUBJECT_NAME[subject]}` : '…'}</b>
          <span className="dash-muted">Nạp đề từ file Word, Excel hoặc sinh câu nâng cao bằng AI — câu đã lưu được trộn vào ma trận cùng ngân hàng của app.</span>
          {bank.error && <span className="dash-muted">{bank.error}</span>}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setBankOpen(true)}><Library aria-hidden="true" /> Nạp tài liệu · Sinh câu</button>
      </section>
      {bankOpen && (
        <MyBankPanel subject={subject} grade={grade} lessons={lessons} defaultLessonId={chosen[0]?.id ?? lessons[0]?.id ?? ''} mine={bank.mine}
          onSaved={bank.add} onDeleted={bank.remove} onClose={() => setBankOpen(false)} />
      )}

      {saved.length > 0 && (
        <section className="dash-section no-print" aria-label="Đề đã lưu">
          <h2><FolderOpen aria-hidden="true" /> Đề đã lưu ({saved.length})</h2>
          <ul className="exam-saved">
            {saved.map((s) => (
              <li key={s.id} className={s.id === examId ? 'is-on' : undefined}>
                <button type="button" className="exam-saved-open" onClick={() => void open(s.id)} disabled={busy}>
                  <strong>{s.title}</strong>
                  <span>{SUBJECT_NAME[s.subject]} · {KIND_NAME[s.exam_code.split('-')[0] as ExamKind] ?? ''} · {new Date(s.updated_at).toLocaleDateString('vi-VN')}</span>
                </button>
                <button type="button" className="mini-btn" onClick={() => void remove(s)} aria-label={`Xoá ${s.title}`}><Trash2 aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dash-section exam-setup no-print" aria-label="Thiết lập đề">
        <div className="exam-form">
          <label className="adm-field"><span>Môn</span>
            <select value={subject} onChange={(e) => { const s = e.target.value as SubjectCode; setSubject(s); resetFor(s, kind); }}>
              {subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Bài kiểm tra</span>
            <select value={kind} onChange={(e) => { const k = e.target.value as ExamKind; setKind(k); resetFor(subject, k); }}>
              {kinds.map((k) => <option key={k} value={k}>{KIND_NAME[k]}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Từ bài</span>
            <select value={range[0]} onChange={(e) => setRange([e.target.value, range[1]])}>
              {lessons.map((l) => <option key={l.id} value={l.id}>HK{l.semester} · {l.ref} – {l.title}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Đến bài</span>
            <select value={range[1]} onChange={(e) => setRange([range[0], e.target.value])}>
              {lessons.map((l) => <option key={l.id} value={l.id}>HK{l.semester} · {l.ref} – {l.title}</option>)}
            </select>
          </label>
          <label className="adm-field exam-title"><span>Tên bài kiểm tra</span>
            <input maxLength={200} placeholder={autoTitle} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="adm-field"><span>Tên trường (in trên đề)</span>
            <input maxLength={120} placeholder="TRƯỜNG TIỂU HỌC …" value={school} onChange={(e) => setSchool(e.target.value)} />
          </label>
          <label className="adm-field"><span>Thời gian (phút)</span>
            <input type="number" min={10} max={120} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 40)} />
          </label>
          <label className="adm-field"><span>Số câu</span>
            <input type="number" min={3} max={40} value={total} onChange={(e) => setTotal(Math.max(3, Math.min(40, Number(e.target.value) || 10)))} />
          </label>
          <label className="adm-field"><span>Số đề</span>
            <select value={nPapers} onChange={(e) => setNPapers(Number(e.target.value))}>
              <option value={1}>1 đề</option><option value={2}>2 đề (A, B)</option><option value={3}>3 đề (A, B, C)</option><option value={4}>4 đề (A, B, C, D)</option>
            </select>
          </label>
          {nPapers > 1 && (
            <label className="adm-field"><span>Cách tạo nhiều đề</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as MixMode)}>
                <option value="khac">Các đề khác câu nhau</option>
                <option value="tron">Trộn từ đề A (cùng câu, đảo thứ tự câu và phương án)</option>
              </select>
            </label>
          )}
        </div>
        <p className="dash-muted">Phạm vi: {chosen.length} bài. Đề Tiếng Việt thường còn phần đọc thành tiếng và phần viết — thầy cô bổ sung trực tiếp trong file Word.</p>
        <div className="comments-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={makeMatrix}><Table2 aria-hidden="true" /> {matrix ? 'Lập lại ma trận' : 'Lập ma trận'}</button>
          {examId && <button type="button" className="btn btn-outline btn-sm" onClick={() => resetFor(subject, kind)}><FilePlus2 aria-hidden="true" /> Đề mới</button>}
        </div>
        {msg && <p className={`adm-alert is-${msg.kind === 'ok' ? 'ok' : msg.kind === 'error' ? 'error' : 'info'}`} role="status">{msg.text}</p>}
      </section>

      {matrix && t && (
        <section className="dash-section" aria-label="Ma trận đề">
          <h2><Table2 aria-hidden="true" /> Ma trận</h2>
          <div className="table-scroll">
            <table className="roster-table exam-matrix">
              <thead>
                <tr><th>Chủ đề</th>{MUCS.map((k) => <th key={k}>{MUC_NAME[k]}</th>)}<th>Tổng</th></tr>
                <tr className="exam-points"><th>Điểm mỗi câu</th>{MUCS.map((k) => (
                  <th key={k}><input type="number" step={0.25} min={0} max={10} value={matrix.points[k]} aria-label={`Điểm mỗi câu ${MUC_NAME[k]}`} onChange={(e) => setPoint(k, Number(e.target.value))} /></th>
                ))}<th /></tr>
              </thead>
              <tbody>
                {matrix.rows.map((r, ri) => (
                  <tr key={r.unitCode}>
                    <td className="exam-unit">{r.unitTitle}<span>{r.lessonIds.length} bài</span></td>
                    {MUCS.map((k) => (
                      <td key={k}>
                        <input type="number" min={0} max={avail[ri]?.[k] ?? 0} value={r.counts[k]} aria-label={`Số câu ${MUC_NAME[k]} – ${r.unitTitle}`} onChange={(e) => setCount(ri, k, Number(e.target.value))} />
                        <span className="exam-avail">có {avail[ri]?.[k] ?? 0}</span>
                      </td>
                    ))}
                    <td>{MUCS.reduce((a, k) => a + r.counts[k], 0)} câu</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th>Tổng</th>{MUCS.map((k) => <td key={k}>{t.byMuc[k]} câu · {Math.round(t.byMuc[k] * matrix.points[k] * 100) / 100} đ ({t.score ? Math.round((t.byMuc[k] * matrix.points[k] * 100) / t.score) : 0}%)</td>)}<td><strong className={Math.abs(t.score - 10) > 0.001 ? 'exam-warn' : 'exam-ok'}>{t.questions} câu · {t.score} điểm</strong></td></tr>
              </tfoot>
            </table>
          </div>
          {Math.abs(t.score - 10) > 0.001 && <p className="adm-alert is-warn">Tổng điểm đang là {t.score}. Chỉnh số câu hoặc điểm mỗi câu cho đủ 10 điểm.</p>}
          <ul className="exam-muc-legend">
            {MUCS.map((k) => <li key={k}><span className={`exam-muc m${k}`}>M{k}</span> <strong>{MUC_NAME[k]}:</strong> {MUC_DESC[k]}</li>)}
          </ul>
          {outcomeList.length > 0 && (
            <details className="exam-outcomes">
              <summary>Lọc theo yêu cầu cần đạt ({outcomeList.length - (matrix.exclude?.length ?? 0)}/{outcomeList.length} đang dùng)</summary>
              <p className="dash-muted">Bỏ chọn yêu cầu cần đạt không muốn kiểm tra trong đề này; số câu “có” ở ma trận cập nhật theo.</p>
              <ul>
                {outcomeList.map((o) => (
                  <li key={o.code}><label><input type="checkbox" checked={!(matrix.exclude ?? []).includes(o.code)} onChange={(e) => toggleOutcome(o.code, e.target.checked)} /> {o.text} <span className="exam-avail">{o.n} câu</span></label></li>
                ))}
              </ul>
            </details>
          )}
          <div className="comments-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={makePapers}><Shuffle aria-hidden="true" /> {papers.length ? 'Tạo lại đề' : 'Tạo đề'}</button>
          </div>
        </section>
      )}

      {papers.length > 0 && matrix && (
        <section className="dash-section" aria-label="Đề đã tạo">
          <div className="dash-card-head">
            <h2>Đề đã tạo</h2>
            <div className="comments-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => download({ matrix: true, papers: true, keys: true }, 'day-du')}><FileDown aria-hidden="true" /> Tải Word (ma trận + đề + đáp án)</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => download({ matrix: false, papers: true, keys: false }, 'de')}><FileDown aria-hidden="true" /> Chỉ đề</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => download({ matrix: false, papers: false, keys: true }, 'dap-an')}><FileDown aria-hidden="true" /> Chỉ đáp án</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => download({ matrix: true, papers: true, keys: true }, 'pdf')}><Printer aria-hidden="true" /> In / lưu PDF</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => void save()} disabled={busy}><Save aria-hidden="true" /> {examId ? 'Lưu thay đổi' : 'Lưu đề'}</button>
            </div>
          </div>
          <div className="exam-papers">
            {papers.map((p, pi) => (
              <div key={pi} className="exam-paper">
                <h3>{p.code ? `Đề ${p.code}` : 'Đề'} · {p.slots.length} câu</h3>
                <AssignPaperForm classId={classId} subject={subject} minutes={minutes}
                  title={`${title || autoTitle}${p.code ? ` – Đề ${p.code}` : ''}`}
                  label={`Giao ${p.code ? `đề ${p.code}` : 'đề'} làm trên app`}
                  items={p.slots.map(({ q, muc }): ExamItem => ({ type: q.type, prompt: q.prompt, options: q.options, left: q.left, blanks: q.blanks, statements: q.statements, answer: q.answer, explanation: q.explanation, lessonTitle: q.lessonTitle, muc, pts: matrix.points[muc] }))} />
                <ol>
                  {p.slots.map((s, si) => (
                    <li key={si}>
                      <div className="exam-q-head">
                        <span className={`exam-muc m${s.muc}`}>M{s.muc}</span>
                        <span className="exam-q-lesson">{s.q.lessonTitle}</span>
                        <button type="button" className="mini-btn" onClick={() => swap(pi, si)} aria-label={`Đổi câu ${si + 1}`}><RefreshCw aria-hidden="true" /> Đổi câu</button>
                      </div>
                      <p className="exam-q-prompt">{s.q.prompt}</p>
                      {s.q.options.length > 0 && <p className="exam-q-opts">{s.q.options.map((o, i) => `${'ABCDEFGH'[i]}. ${o}`).join('   ')}</p>}
                      {(s.q.blanks ?? s.q.statements)?.map((l, i) => <p key={i} className="exam-q-opts">{l.replace(/\{\}/g, '……')}</p>)}
                      <p className="exam-q-ans">Đáp án: {answerText(s.q)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
