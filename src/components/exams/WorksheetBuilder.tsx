'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileDown, FileText, RefreshCw, Shuffle } from 'lucide-react';
import AssignPaperForm from '@/components/classroom/AssignPaperForm';
import type { ExamItem } from '@/lib/classroom/assignments';
import { bookLessons, buildPaper, defaultMatrix, replaceSlot, totals, type Matrix, type Paper } from '@/lib/exams/matrix';
import { answerText, downloadDoc, examDocument } from '@/lib/exams/word';
import type { SubjectCode } from '@/lib/types';

const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const MIX = {
  de: { name: 'Dễ — chủ yếu Mức 1 (70% · 30% · 0%)', ratio: [0.7, 0.3] as [number, number] },
  vua: { name: 'Vừa — 50% · 30% · 20%', ratio: [0.5, 0.3] as [number, number] },
  kho: { name: 'Nâng cao — 20% · 40% · 40%', ratio: [0.2, 0.4] as [number, number] },
};
type Mix = keyof typeof MIX;
const SCHOOL_KEY = 'edukid:exam-school';
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Phiếu bài tập in (lớp thiếu máy) theo đúng bài đang học: câu từ ngân hàng tự soạn, đáp án trang riêng; hoặc giao làm trên app. */
export default function WorksheetBuilder({ classId, className, grade, presetLesson }: { classId: string; className: string; grade: number; presetLesson?: string }) {
  const subjects = (['toan', 'tieng-viet', 'tieng-anh'] as SubjectCode[]).filter((s) => bookLessons(s, grade).length > 0);
  const initial = useMemo(() => {
    for (const s of subjects) { const l = bookLessons(s, grade).find((x) => x.id === presetLesson); if (l) return { s, id: l.id }; }
    const s = subjects[0] ?? 'toan';
    return { s, id: bookLessons(s, grade)[0]?.id ?? '' };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [subject, setSubject] = useState<SubjectCode>(initial.s);
  const lessons = useMemo(() => bookLessons(subject, grade), [subject, grade]);
  const [range, setRange] = useState<[string, string]>([initial.id, initial.id]);
  const [total, setTotal] = useState(10);
  const [mix, setMix] = useState<Mix>('vua');
  const [copies, setCopies] = useState(1);
  const [school, setSchool] = useState('');
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => { try { setSchool(localStorage.getItem(SCHOOL_KEY) ?? ''); } catch { /* bỏ qua */ } }, []);
  useEffect(() => { try { if (school) localStorage.setItem(SCHOOL_KEY, school); } catch { /* bỏ qua */ } }, [school]);

  const chosen = useMemo(() => {
    const a = lessons.findIndex((l) => l.id === range[0]);
    const b = lessons.findIndex((l) => l.id === range[1]);
    if (a < 0 || b < 0) return [];
    return lessons.slice(Math.min(a, b), Math.max(a, b) + 1);
  }, [lessons, range]);
  const topic = chosen.length === 1 ? chosen[0].title : chosen.length ? `${chosen[0].title} → ${chosen[chosen.length - 1].title}` : '';
  const title = 'Phiếu bài tập';

  const make = () => {
    if (!chosen.length) return setNote('Chọn bài cho phiếu.');
    const m = defaultMatrix(chosen, total, MIX[mix].ratio);
    const t = totals(m);
    if (!t.questions) { setMatrix(null); setPapers([]); return setNote('Bài này chưa có câu in được (câu có tranh vẽ không đưa lên giấy). Chọn thêm bài.'); }
    const out: Paper[] = [];
    const avoid = new Set<string>();
    for (let i = 0; i < copies; i++) {
      const p = buildPaper(m, newSeed(), copies > 1 ? 'AB'[i] : '', avoid);
      p.slots.forEach((s) => avoid.add(s.q.key));
      out.push(p);
    }
    setMatrix(m);
    setPapers(out);
    setNote(t.questions < total ? `Ngân hàng chỉ đủ ${t.questions} câu khác nhau cho phạm vi này.` : '');
  };

  const swap = (pi: number, si: number) => {
    if (!matrix) return;
    const avoid = new Set(papers.filter((_, i) => i !== pi).flatMap((p) => p.slots.map((s) => s.q.key)));
    setPapers((ps) => ps.map((p, i) => (i === pi ? replaceSlot(matrix, p, si, newSeed(), avoid) : p)));
  };

  const download = (parts: { papers: boolean; keys: boolean }, suffix: string) => {
    if (!matrix) return;
    const meta = { school, title, subjectName: SUBJECT_NAME[subject], grade, className, yearLabel: '', minutes: 0, worksheet: true, topic };
    const html = examDocument(meta, matrix, papers, new Map(lessons.map((l) => [l.id, l.title])), { matrix: false, ...parts });
    downloadDoc(`phieu-bai-tap-${SUBJECT_NAME[subject]}-lop${grade}-${suffix}`.replace(/\s+/g, '-'), html);
  };

  return (
    <div className="exam-builder">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Lớp {className} · Khối {grade}</p>
          <h1><FileText aria-hidden="true" /> Phiếu bài tập</h1>
          <p className="dash-muted">Chọn bài đang học, số câu và độ khó — máy chọn câu từ ngân hàng câu hỏi tự soạn của EduChain Kids, đáp án in ở trang riêng. Dùng cho giờ luyện tập trên lớp hoặc lớp chưa đủ máy; cũng có thể giao làm trên app.</p>
        </div>
      </header>

      <section className="dash-section exam-setup no-print" aria-label="Thiết lập phiếu">
        <div className="exam-form">
          <label className="adm-field"><span>Môn</span>
            <select value={subject} onChange={(e) => { const s = e.target.value as SubjectCode; setSubject(s); const f = bookLessons(s, grade)[0]?.id ?? ''; setRange([f, f]); setPapers([]); setMatrix(null); }}>
              {subjects.map((s) => <option key={s} value={s}>{SUBJECT_NAME[s]}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Từ bài</span>
            <select value={range[0]} onChange={(e) => setRange([e.target.value, range[1]])}>
              {lessons.map((l) => <option key={l.id} value={l.id}>HK{l.semester} · {l.title}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Đến bài</span>
            <select value={range[1]} onChange={(e) => setRange([range[0], e.target.value])}>
              {lessons.map((l) => <option key={l.id} value={l.id}>HK{l.semester} · {l.title}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Số câu</span>
            <input type="number" min={4} max={20} value={total} onChange={(e) => setTotal(Math.max(4, Math.min(20, Number(e.target.value) || 10)))} />
          </label>
          <label className="adm-field"><span>Độ khó</span>
            <select value={mix} onChange={(e) => setMix(e.target.value as Mix)}>
              {(Object.keys(MIX) as Mix[]).map((k) => <option key={k} value={k}>{MIX[k].name}</option>)}
            </select>
          </label>
          <label className="adm-field"><span>Số phiếu khác nhau</span>
            <select value={copies} onChange={(e) => setCopies(Number(e.target.value))}>
              <option value={1}>1 phiếu</option><option value={2}>2 phiếu (A, B — ngồi cạnh không trùng)</option>
            </select>
          </label>
          <label className="adm-field"><span>Tên trường (in trên phiếu)</span>
            <input maxLength={120} placeholder="TRƯỜNG TIỂU HỌC …" value={school} onChange={(e) => setSchool(e.target.value)} />
          </label>
        </div>
        <p className="dash-muted">Phạm vi: {chosen.length} bài{topic ? ` — ${topic}` : ''}.</p>
        <div className="comments-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={make}><Shuffle aria-hidden="true" /> {papers.length ? 'Tạo lại phiếu' : 'Tạo phiếu'}</button>
        </div>
        {note && <p className="adm-alert is-info" role="status">{note}</p>}
      </section>

      {papers.length > 0 && matrix && (
        <section className="dash-section" aria-label="Phiếu đã tạo">
          <div className="dash-card-head">
            <h2>Phiếu đã tạo</h2>
            <div className="comments-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => download({ papers: true, keys: true }, 'kem-dap-an')}><FileDown aria-hidden="true" /> Tải Word (phiếu + đáp án)</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => download({ papers: true, keys: false }, 'phieu')}><FileDown aria-hidden="true" /> Chỉ phiếu</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => download({ papers: false, keys: true }, 'dap-an')}><FileDown aria-hidden="true" /> Chỉ đáp án</button>
            </div>
          </div>
          <div className="exam-papers">
            {papers.map((p, pi) => (
              <div key={pi} className="exam-paper">
                <h3>{p.code ? `Phiếu ${p.code}` : 'Phiếu'} · {p.slots.length} câu</h3>
                <AssignPaperForm classId={classId} subject={subject} minutes={Math.max(10, p.slots.length * 2)}
                  title={`${title}: ${topic}${p.code ? ` – Phiếu ${p.code}` : ''}`.slice(0, 200)}
                  label={`Giao ${p.code ? `phiếu ${p.code}` : 'phiếu'} làm trên app`}
                  items={p.slots.map(({ q, muc }): ExamItem => ({ type: q.type, prompt: q.prompt, options: q.options, left: q.left, blanks: q.blanks, statements: q.statements, answer: q.answer, explanation: q.explanation, lessonTitle: q.lessonTitle, muc, pts: 1 }))} />
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
