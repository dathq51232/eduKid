'use client';

// "Bộ ôn luyện cho lớp" trong Kho câu hỏi — danh sách câu theo từng bài của khối lớp, hai nguồn:
//  · Kho của app: câu soạn sẵn + câu bộ sinh câu tạo (lessonPool, đã bỏ câu có hình) — tính khi mở bài, không tính cả khối một lúc;
//  · Câu của tôi: câu thầy cô đã lưu (teacher_questions). Nút "Đưa vào bài học của lớp" (migration 0072): học sinh lớp
//    thầy cô dạy gặp các câu này khi luyện đúng bài đó ở trang Làm bài (trộn với câu của app, chấm ở máy chủ).
// Tick câu (hoặc "Chọn 10 câu trộn mức") ở bất kỳ bài nào rồi giao cho lớp làm trên app (AssignPaperForm — học sinh làm,
// máy chủ chấm, thầy cô xem thống kê từng câu ở Giao bài về nhà).
import { useMemo, useState } from 'react';
import { BookOpenCheck, ChevronDown, GraduationCap, Shuffle } from 'lucide-react';
import AssignPaperForm from '@/components/classroom/AssignPaperForm';
import type { ExamItem } from '@/lib/classroom/assignments';
import { bankError, setForClass, type MyQuestion } from '@/lib/bank/client';
import { MUC_LEVEL } from '@/lib/bank/check';
import { lessonPool, type BookLesson, type ExamQuestion, type Muc } from '@/lib/exams/matrix';
import type { SubjectCode } from '@/lib/types';
import '@/styles/mb.css';

const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
const SHOW = 40; // số câu hiện mỗi lần trong một bài

type Row = { id: string; muc: Muc; prompt: string; detail: string; item: ExamItem; forClass?: boolean };
type Src = 'app' | 'mine';

const keyText = (a: unknown) => {
  const k = (a ?? {}) as { correct?: string | string[]; accepted?: string[]; answers?: string[][]; order?: string[]; truth?: string[] };
  if (Array.isArray(k.accepted)) return k.accepted.join(' / ');
  if (Array.isArray(k.correct)) return k.correct.join(', ');
  if (typeof k.correct === 'string') return k.correct;
  if (Array.isArray(k.answers)) return k.answers[0]?.join(', ') ?? '';
  if (Array.isArray(k.order)) return k.order.join(' → ');
  if (Array.isArray(k.truth)) return k.truth.join(', ');
  return '';
};
const fromMine = (q: MyQuestion): Row => ({
  id: `m:${q.id}`, muc: q.muc, prompt: q.prompt, forClass: q.for_class === true,
  detail: `${q.options.length ? `${q.options.join(' · ')} — ` : ''}Đáp án: ${keyText(q.answer) || '—'}`,
  item: { type: q.type, prompt: q.prompt, options: q.options ?? [], answer: q.answer as ExamItem['answer'], explanation: q.explanation || undefined, lessonTitle: q.lesson_title || undefined, muc: q.muc, pts: 1 },
});
const fromApp = (lessonId: string, q: ExamQuestion): Row => ({
  id: `a:${lessonId}:${q.key}`, muc: q.muc, prompt: q.prompt,
  detail: `${q.options.length ? `${q.options.join(' · ')} — ` : ''}${(q.blanks ?? q.statements ?? []).join(' | ').replace(/\{\}/g, '…')}${q.blanks || q.statements ? ' — ' : ''}Đáp án: ${keyText(q.answer) || '—'}`,
  item: { type: q.type, prompt: q.prompt, options: q.options, left: q.left, blanks: q.blanks, statements: q.statements, answer: q.answer, explanation: q.explanation, lessonTitle: q.lessonTitle, muc: q.muc, pts: 1 },
});

/** 10 câu trộn mức (khoảng 4 M1 · 4 M2 · 2 M3, thiếu mức nào lấy bù mức khác) */
function mixPick(rows: Row[], n = 10): Row[] {
  const by: Record<Muc, Row[]> = { 1: [], 2: [], 3: [] };
  for (const r of [...rows].sort(() => Math.random() - 0.5)) by[r.muc].push(r);
  const want: Record<Muc, number> = { 1: 4, 2: 4, 3: 2 };
  const out: Row[] = [];
  for (const m of [1, 2, 3] as Muc[]) out.push(...by[m].splice(0, want[m]));
  const rest = [...by[1], ...by[2], ...by[3]];
  while (out.length < n && rest.length) out.push(rest.shift()!);
  return out.sort((a, b) => a.muc - b.muc);
}

export default function PracticeSets({ classId, subject, lessons, mine, onForClass }: {
  classId: string; subject: SubjectCode; lessons: BookLesson[]; mine: MyQuestion[] | null; onForClass?: (ids: string[], on: boolean) => void;
}) {
  const [src, setSrc] = useState<Src>('app');
  const [pick, setPick] = useState<Map<string, Row>>(new Map());
  const [open, setOpen] = useState<string | null>(null);
  const [more, setMore] = useState(SHOW);
  const [busy, setBusy] = useState('');
  const [fcErr, setFcErr] = useState('');
  /** Bật / tắt "Câu của cô" trong bài học cho các câu (mã m:<uuid>) */
  const shareRows = async (rows: Row[], on: boolean, key: string) => {
    const ids = rows.map((r) => r.id.slice(2));
    if (!ids.length) return;
    setBusy(key); setFcErr('');
    try { await setForClass(ids, on); onForClass?.(ids, on); } catch (e) { setFcErr(bankError(e)); } finally { setBusy(''); }
  };

  const mineBy = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const q of mine ?? []) { const k = q.lesson_id ?? ''; m.set(k, [...(m.get(k) ?? []), fromMine(q)]); }
    return m;
  }, [mine]);
  // câu của app chỉ tính cho bài đang mở (mỗi bài có thể hơn 100 câu)
  const appRows = useMemo(() => (src === 'app' && open ? lessonPool(open).filter((q) => !q.key.startsWith('tq#')).map((q) => fromApp(open, q)) : []), [src, open]);

  const groups = src === 'mine'
    ? [...lessons.filter((l) => mineBy.has(l.id)).map((l) => ({ id: l.id, title: l.title })), ...(mineBy.has('') ? [{ id: '', title: 'Chưa gắn bài' }] : [])]
    : lessons.map((l) => ({ id: l.id, title: l.title }));
  const rowsOf = (id: string) => (src === 'mine' ? mineBy.get(id) ?? [] : id === open ? appRows : []);

  const toggle = (rows: Row[], on: boolean) => setPick((p) => { const n = new Map(p); rows.forEach((r) => (on ? n.set(r.id, r) : n.delete(r.id))); return n; });
  const pickedIn = (id: string) => [...pick.values()].filter((r) => r.item.lessonTitle === (lessons.find((l) => l.id === id)?.title ?? '§')).length;
  const chosen = [...pick.values()];
  const lessonNames = [...new Set(chosen.map((r) => r.item.lessonTitle).filter(Boolean))] as string[];
  const title = `Ôn luyện ${SUBJECT_NAME[subject]}: ${lessonNames.length === 1 ? lessonNames[0] : `${lessonNames.length || 1} bài`}`;
  const openLesson = (id: string) => { setOpen(open === id ? null : id); setMore(SHOW); };

  return (
    <section className="qb-ps" aria-labelledby="qb-ps-h">
      <header className="qb-ps-head">
        <h2 id="qb-ps-h"><GraduationCap aria-hidden="true" /> Bộ ôn luyện cho lớp</h2>
        <p className="dash-muted">Danh sách câu theo từng bài của khối. Mở bài, tick câu (hoặc <b>Chọn 10 câu trộn mức</b>) ở một hay nhiều bài rồi giao cho lớp làm trên app — máy chấm, thầy cô xem em nào sai câu nào ở <b>Giao bài về nhà</b>.</p>
      </header>

      <div className="qb-subj" role="tablist" aria-label="Nguồn câu hỏi">
        <button type="button" role="tab" aria-selected={src === 'app'} className={src === 'app' ? 'is-on' : ''} onClick={() => { setSrc('app'); setOpen(null); }}>Kho của app</button>
        <button type="button" role="tab" aria-selected={src === 'mine'} className={src === 'mine' ? 'is-on' : ''} onClick={() => { setSrc('mine'); setOpen(null); }}>Câu của tôi ({mine?.length ?? '…'})</button>
      </div>

      {src === 'mine' && groups.length > 0 && <p className="dash-muted qb-fc-note"><BookOpenCheck aria-hidden="true" /> Bấm <b>Đưa vào bài học của lớp</b> ở từng bài: học sinh lớp thầy cô dạy sẽ gặp các câu này (khoảng 3 câu trong 10, mức Giỏi khoảng một nửa) khi tự luyện đúng bài đó trên app, có nhãn “Câu thầy cô gửi”. Đáp án không gửi về máy học sinh, máy chủ chấm.</p>}
      {fcErr && <p className="adm-alert is-error" role="alert">{fcErr}</p>}
      {src === 'mine' && mine !== null && !groups.length && <p className="dash-muted">Chưa có câu tự soạn. Nạp tài liệu hoặc sinh câu ở trên rồi lưu — câu sẽ hiện ở đây theo từng bài.</p>}
      {!lessons.length && <p className="dash-muted">Chưa có bài nào cho môn này ở khối lớp.</p>}

      <ul className="qb-ps-list">
        {groups.map((g) => {
          const isOpen = open === g.id;
          const rows = rowsOf(g.id);
          const n = src === 'mine' ? rows.filter((r) => pick.has(r.id)).length : pickedIn(g.id);
          const cnt = [1, 2, 3].map((m) => rows.filter((r) => r.muc === m).length);
          const shown = rows.slice(0, more);
          return (
            <li key={g.id || 'none'} className={n ? 'is-pick' : ''}>
              <div className="qb-ps-row">
                <button type="button" className="qb-ps-title" aria-expanded={isOpen} onClick={() => openLesson(g.id)}>
                  <b>{g.title}</b>
                  <span className="qb-ps-cnt">
                    {rows.length > 0 && <>{rows.length} câu</>}
                    {rows.length > 0 && cnt.map((c, i) => c > 0 && <span key={i} className={`mb-m m${i + 1}`} title={MUC_LEVEL[(i + 1) as Muc]}>M{i + 1}·{c}</span>)}
                    {src === 'mine' && rows.some((r) => r.forClass) && <span className="qb-fc-tag" title="Học sinh lớp gặp các câu này khi luyện bài ở trang Làm bài"><BookOpenCheck aria-hidden="true" /> {rows.filter((r) => r.forClass).length} trong bài học</span>}
                    {n > 0 && <em>đã chọn {n}</em>}
                  </span>
                  <ChevronDown aria-hidden="true" className={isOpen ? 'is-open' : ''} />
                </button>
              </div>
              {isOpen && (
                <div className="qb-ps-body">
                  {!rows.length && <p className="dash-muted">Bài này chưa có câu in được (câu có hình vẽ chỉ làm trong trang học).</p>}
                  {rows.length > 0 && (
                    <div className="qb-ps-tools">
                      <button type="button" className="mini-btn" onClick={() => toggle(mixPick(rows), true)}><Shuffle aria-hidden="true" /> Chọn 10 câu trộn mức</button>
                      <button type="button" className="mini-btn" onClick={() => toggle(shown, true)}>Chọn {shown.length} câu đang hiện</button>
                      {rows.some((r) => pick.has(r.id)) && <button type="button" className="mini-btn" onClick={() => toggle(rows, false)}>Bỏ chọn bài này</button>}
                      {src === 'mine' && g.id && (rows.every((r) => r.forClass)
                        ? <button type="button" className="mini-btn" disabled={!!busy} onClick={() => void shareRows(rows, false, g.id)}>{busy === g.id ? 'Đang lưu…' : 'Bỏ khỏi bài học của lớp'}</button>
                        : <button type="button" className="mini-btn qb-fc-btn" disabled={!!busy} onClick={() => void shareRows(rows.filter((r) => !r.forClass), true, g.id)}><BookOpenCheck aria-hidden="true" /> {busy === g.id ? 'Đang lưu…' : `Đưa ${rows.filter((r) => !r.forClass).length} câu vào bài học của lớp`}</button>)}
                    </div>
                  )}
                  <ol className="qb-ps-qs">
                    {shown.map((r) => (
                      <li key={r.id}>
                        <label>
                          <input type="checkbox" checked={pick.has(r.id)} onChange={(e) => toggle([r], e.target.checked)} />
                          <span className={`mb-m m${r.muc}`}>M{r.muc}</span>
                          {r.forClass && <BookOpenCheck className="qb-fc-ico" aria-label="Đang ở bài học của lớp" />}
                          <span className="mb-q"><b>{r.prompt}</b><small>{r.detail}</small></span>
                        </label>
                      </li>
                    ))}
                  </ol>
                  {rows.length > shown.length && <button type="button" className="mini-btn" onClick={() => setMore((m) => m + SHOW)}>Xem thêm ({rows.length - shown.length} câu)</button>}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {chosen.length > 0 && (
        <div className="qb-ps-bar">
          <b>Đã chọn {chosen.length} câu{lessonNames.length > 1 ? ` · ${lessonNames.length} bài` : ''}</b>
          <button type="button" className="mini-btn" onClick={() => setPick(new Map())}>Bỏ chọn</button>
          <AssignPaperForm classId={classId} subject={subject} title={title.slice(0, 200)}
            minutes={Math.max(10, Math.ceil(chosen.length * 1.5))} label={`Giao ${chosen.length} câu cho lớp ôn luyện`} items={chosen.map((r) => r.item)} />
        </div>
      )}
    </section>
  );
}
