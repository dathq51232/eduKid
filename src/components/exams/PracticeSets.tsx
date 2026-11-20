'use client';

// "Bộ ôn luyện cho lớp" trong Kho câu hỏi: câu đã lưu của thầy cô gom theo bài (đúng thứ tự sách),
// đếm theo mức; tick chọn câu / cả bài rồi giao cho lớp làm trên app (dùng AssignPaperForm — học sinh làm, máy chủ chấm,
// thầy cô xem thống kê từng câu ở Giao bài về nhà).
import { useMemo, useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';
import AssignPaperForm from '@/components/classroom/AssignPaperForm';
import type { ExamItem } from '@/lib/classroom/assignments';
import type { MyQuestion } from '@/lib/bank/client';
import { MUC_LEVEL } from '@/lib/bank/check';
import type { BookLesson } from '@/lib/exams/matrix';
import type { SubjectCode } from '@/lib/types';
import '@/styles/mb.css';

const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const ansText = (q: MyQuestion) => {
  const a = q.answer as { correct?: string | string[]; accepted?: string[] };
  return Array.isArray(a.accepted) ? a.accepted.join(' / ') : Array.isArray(a.correct) ? a.correct.join(', ') : a.correct ?? '';
};
const toItem = (q: MyQuestion): ExamItem => ({
  type: q.type, prompt: q.prompt, options: q.options ?? [], answer: q.answer as ExamItem['answer'],
  explanation: q.explanation || undefined, lessonTitle: q.lesson_title || undefined, muc: q.muc, pts: 1,
});

type Group = { id: string; title: string; qs: MyQuestion[] };

export default function PracticeSets({ classId, subject, lessons, mine }: { classId: string; subject: SubjectCode; lessons: BookLesson[]; mine: MyQuestion[] | null }) {
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);

  // gom theo bài, đúng thứ tự trong sách; câu chưa gắn bài để cuối
  const groups = useMemo<Group[]>(() => {
    const by = new Map<string, MyQuestion[]>();
    for (const q of mine ?? []) { const k = q.lesson_id ?? ''; by.set(k, [...(by.get(k) ?? []), q]); }
    const out: Group[] = lessons.filter((l) => by.has(l.id)).map((l) => ({ id: l.id, title: l.title, qs: by.get(l.id)! }));
    const known = new Set(out.map((g) => g.id));
    const rest = [...by.entries()].filter(([k]) => !known.has(k)).flatMap(([, v]) => v);
    if (rest.length) out.push({ id: '', title: 'Chưa gắn bài', qs: rest });
    return out;
  }, [mine, lessons]);

  const chosen = useMemo(() => (mine ?? []).filter((q) => pick.has(q.id)), [mine, pick]);
  const toggle = (ids: string[], on: boolean) => setPick((s) => { const n = new Set(s); ids.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; });
  const lessonNames = [...new Set(chosen.map((q) => q.lesson_title).filter(Boolean))];
  const title = `Ôn luyện ${SUBJECT_NAME[subject]}: ${lessonNames.length === 1 ? lessonNames[0] : `${lessonNames.length || 1} bài`}`;

  return (
    <section className="qb-ps" aria-labelledby="qb-ps-h">
      <header className="qb-ps-head">
        <h2 id="qb-ps-h"><GraduationCap aria-hidden="true" /> Bộ ôn luyện cho lớp</h2>
        <p className="dash-muted">Câu đã lưu, gom theo bài. Tick câu hoặc cả bài rồi giao cho lớp làm trên app — máy chấm, thầy cô xem em nào sai câu nào ở <b>Giao bài về nhà</b>.</p>
      </header>

      {mine === null && <p className="dash-muted">Đang tải…</p>}
      {mine !== null && !groups.length && <p className="dash-muted">Chưa có câu nào. Nạp tài liệu hoặc sinh câu ở trên, lưu lại — câu sẽ hiện ở đây theo từng bài.</p>}

      <ul className="qb-ps-list">
        {groups.map((g) => {
          const ids = g.qs.map((q) => q.id);
          const n = ids.filter((id) => pick.has(id)).length;
          const cnt = [1, 2, 3].map((m) => g.qs.filter((q) => q.muc === m).length);
          const isOpen = open === g.id;
          return (
            <li key={g.id || 'none'} className={n ? 'is-pick' : ''}>
              <div className="qb-ps-row">
                <input type="checkbox" checked={n === ids.length} ref={(el) => { if (el) el.indeterminate = n > 0 && n < ids.length; }}
                  onChange={(e) => toggle(ids, e.target.checked)} aria-label={`Chọn cả bài ${g.title}`} />
                <button type="button" className="qb-ps-title" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.id)}>
                  <b>{g.title}</b>
                  <span className="qb-ps-cnt">
                    {g.qs.length} câu
                    {cnt.map((c, i) => c > 0 && <span key={i} className={`mb-m m${i + 1}`} title={MUC_LEVEL[(i + 1) as 1 | 2 | 3]}>M{i + 1}·{c}</span>)}
                    {n > 0 && <em>đã chọn {n}</em>}
                  </span>
                  <ChevronDown aria-hidden="true" className={isOpen ? 'is-open' : ''} />
                </button>
              </div>
              {isOpen && (
                <ol className="qb-ps-qs">
                  {g.qs.map((q) => (
                    <li key={q.id}>
                      <label>
                        <input type="checkbox" checked={pick.has(q.id)} onChange={(e) => toggle([q.id], e.target.checked)} />
                        <span className={`mb-m m${q.muc}`}>M{q.muc}</span>
                        <span className="mb-q"><b>{q.prompt}</b><small>{q.options.length ? `${q.options.join(' · ')} — ` : ''}Đáp án: {ansText(q) || '—'}</small></span>
                      </label>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ul>

      {chosen.length > 0 && (
        <div className="qb-ps-bar">
          <b>Đã chọn {chosen.length} câu{lessonNames.length > 1 ? ` · ${lessonNames.length} bài` : ''}</b>
          <button type="button" className="mini-btn" onClick={() => setPick(new Set())}>Bỏ chọn</button>
          <AssignPaperForm classId={classId} subject={subject} title={title.slice(0, 200)}
            minutes={Math.max(10, Math.ceil(chosen.length * 1.5))} label={`Giao ${chosen.length} câu cho lớp ôn luyện`} items={chosen.map(toItem)} />
        </div>
      )}
    </section>
  );
}
