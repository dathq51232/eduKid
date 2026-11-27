'use client';

// Xem trước đề phòng thi: cô xem đúng đề từng em sẽ nhận (hoặc đề chung), đổi câu, sửa lời đề / phương án / đáp án,
// xoá câu, tạo lại đề một em. Câu sửa xong được máy tự chấm thử — đáp án không chấm được thì chưa cho tạo phòng.
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, RefreshCw, RotateCcw, Trash2, TriangleAlert } from 'lucide-react';
import EmojiText from '@/components/EmojiText';
import { replaceSlot, type ExamQuestion, type Matrix, type PaperSlot, STAGE_NAME, stageOf } from '@/lib/exams/matrix';
import { itemProblem } from '@/lib/classroom/rooms-build';
import { answerText } from '@/lib/exams/word';
import '@/styles/exam.css';
import '@/styles/mini.css';
import '@/styles/room.css';

export type DraftSlot = PaperSlot & { edited?: boolean };
/** Một đề đang duyệt: của một em (student = mã em) hoặc đề chung cả lớp (student = null) */
export type RoomDraft = { student: string | null; slots: DraftSlot[] };

const L = 'ABCDEFGH';
const newSeed = () => Math.floor(Math.random() * 2 ** 31);
/** Số câu có lỗi trong các đề đang duyệt */
export const draftProblems = (ds: RoomDraft[]) => ds.reduce((a, d) => a + d.slots.filter((s) => itemProblem(s.q)).length, 0);

type Props = {
  drafts: RoomDraft[]; matrix: Matrix; students: { id: string; name: string }[];
  onChange: (ds: RoomDraft[]) => void; onRegenerate: (student: string) => void;
};

export default function RoomPreview({ drafts, matrix, students, onChange, onRegenerate }: Props) {
  const [at, setAt] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const i = Math.min(at, drafts.length - 1);
  const d = drafts[i];
  if (!d) return null;
  const name = (id: string | null) => (id === null ? 'Đề chung cả lớp' : students.find((s) => s.id === id)?.name ?? 'Học sinh');
  const go = (k: number) => { setEditing(null); setAt((k + drafts.length) % drafts.length); };
  const setSlots = (slots: DraftSlot[]) => onChange(drafts.map((x, k) => (k === i ? { ...x, slots } : x)));

  const swap = (si: number) => {
    const p = replaceSlot(matrix, { code: 'P', slots: d.slots, missing: [] }, si, newSeed(), new Set());
    if (p.slots[si].q.key === d.slots[si].q.key) return window.alert('Ngân hàng không còn câu khác cùng chủ đề, cùng mức cho ô này.');
    setEditing(null);
    setSlots(p.slots.map((s, k) => (k === si ? { ...s, edited: false } : d.slots[k])));
  };
  const remove = (si: number) => {
    if (d.slots.length <= 1) return window.alert('Đề cần ít nhất một câu.');
    setEditing(null);
    setSlots(d.slots.filter((_, k) => k !== si));
  };
  const save = (si: number, q: ExamQuestion) => { setSlots(d.slots.map((s, k) => (k === si ? { ...s, q, edited: true } : s))); setEditing(null); };

  const problems = d.slots.filter((s) => itemProblem(s.q)).length;
  const edited = (x: RoomDraft) => x.slots.some((s) => s.edited);

  return (
    <div className="room-preview">
      {drafts.length > 1 && (
        <div className="room-pv-nav">
          <button type="button" className="mini-btn" onClick={() => go(i - 1)} aria-label="Đề trước"><ChevronLeft aria-hidden="true" /></button>
          <select value={i} onChange={(e) => go(Number(e.target.value))} aria-label="Xem đề của em">
            {drafts.map((x, k) => <option key={k} value={k}>{k + 1}. {name(x.student)}{edited(x) ? ' · đã sửa' : ''}</option>)}
          </select>
          <button type="button" className="mini-btn" onClick={() => go(i + 1)} aria-label="Đề sau"><ChevronRight aria-hidden="true" /></button>
          {d.student && (
            <button type="button" className="mini-btn" onClick={() => { if (!edited(d) || window.confirm('Tạo lại đề em này? Các câu cô đã sửa trong đề sẽ mất.')) { setEditing(null); onRegenerate(d.student!); } }}>
              <RotateCcw aria-hidden="true" /> Tạo lại đề em này
            </button>
          )}
        </div>
      )}
      <p className="dash-muted">
        <b>{name(d.student)}</b> · {d.slots.length} câu
        {d.student === null ? ' · mỗi em nhận các câu này, đảo thứ tự câu trong từng mức và thứ tự phương án.' : ' · đúng thứ tự em sẽ thấy.'}
        {problems > 0 && <span className="exam-warn"> · {problems} câu cần sửa lại đáp án</span>}
      </p>
      <ol className="room-pv-list">
        {d.slots.map((s, si) => {
          const bad = itemProblem(s.q);
          return (
            <li key={`${si}-${s.q.key}`} className={bad ? 'has-warn' : undefined}>
              <div className="exam-q-head">
                <span className={`exam-muc m${s.muc}`}>M{s.muc}</span>
                <span className={`room-pv-dang d${stageOf(s.q.type)}`} title="Dạng thao tác">{STAGE_NAME[stageOf(s.q.type)]}</span>
                <span className="exam-q-lesson">{s.q.lessonTitle}{s.edited && <b className="room-pv-edited"> · cô đã sửa</b>}</span>
                <button type="button" className="mini-btn" onClick={() => setEditing(editing === si ? null : si)} aria-expanded={editing === si}><Pencil aria-hidden="true" /> Sửa</button>
                <button type="button" className="mini-btn" onClick={() => swap(si)}><RefreshCw aria-hidden="true" /> Đổi câu</button>
                <button type="button" className="mini-btn is-danger" onClick={() => remove(si)} aria-label={`Xoá câu ${si + 1}`}><Trash2 aria-hidden="true" /></button>
              </div>
              {editing === si ? <ItemEditor q={s.q} onSave={(q) => save(si, q)} onCancel={() => setEditing(null)} /> : (
                <>
                  <p className="exam-q-prompt"><EmojiText text={s.q.prompt} /></p>
                  {s.q.left && s.q.left.length > 0 && s.q.type !== 'grouping' && <p className="exam-q-opts">{s.q.left.join('   ·   ')}</p>}
                  {s.q.options.length > 0 && <p className="exam-q-opts"><EmojiText text={s.q.options.map((o, k) => (s.q.type === 'single_choice' || s.q.type === 'multiple_choice' ? `${L[k]}. ${o}` : o)).join('   ')} /></p>}
                  {(s.q.blanks ?? s.q.statements)?.map((l, k) => <p key={k} className="exam-q-opts">{l.replace(/\{\}/g, '……')}</p>)}
                  <p className="exam-q-ans">Đáp án: {answerText(s.q)}</p>
                  {bad && <p className="room-warn"><TriangleAlert aria-hidden="true" /> {bad}</p>}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ Sửa một câu
function ItemEditor({ q: q0, onSave, onCancel }: { q: ExamQuestion; onSave: (q: ExamQuestion) => void; onCancel: () => void }) {
  const [q, setQ] = useState<ExamQuestion>(q0);
  const k = (q.answer ?? {}) as Record<string, unknown>;
  const setKey = (patch: Record<string, unknown>) => setQ((x) => ({ ...x, answer: { ...(x.answer as object), ...patch } as ExamQuestion['answer'] }));
  const problem = itemProblem(q);
  const choice = q.type === 'single_choice' || q.type === 'multiple_choice';
  const correct: string[] = q.type === 'single_choice' ? [String(k.correct ?? '')] : ((k.correct as string[]) ?? []);

  const setOption = (idx: number, v: string) => {
    const old = q.options[idx];
    const options = q.options.map((o, j) => (j === idx ? v : o));
    const fix = (c: string) => (c === old ? v : c);
    setQ((x) => ({ ...x, options, answer: { ...(x.answer as object), correct: x.type === 'single_choice' ? fix(String(k.correct ?? '')) : correct.map(fix) } as ExamQuestion['answer'] }));
  };
  const removeOption = (idx: number) => {
    const o = q.options[idx];
    setQ((x) => ({ ...x, options: x.options.filter((_, j) => j !== idx), answer: { ...(x.answer as object), correct: x.type === 'single_choice' ? (k.correct === o ? '' : k.correct) : correct.filter((c) => c !== o) } as ExamQuestion['answer'] }));
  };
  const holes = (q.blanks ?? []).join(' ').split('{}').length - 1;
  const fbAns = (((k.answers as string[][]) ?? [])[0] ?? []);

  return (
    <div className="room-edit">
      <label className="adm-field"><span>Câu hỏi</span>
        <textarea rows={Math.min(6, Math.max(2, Math.ceil(q.prompt.length / 70)))} value={q.prompt} onChange={(e) => setQ({ ...q, prompt: e.target.value })} />
      </label>

      {choice && (
        <div className="room-edit-opts">
          <span className="room-edit-hint">{q.type === 'single_choice' ? 'Chọn một đáp án đúng' : 'Đánh dấu các đáp án đúng'}</span>
          {q.options.map((o, idx) => (
            <label key={idx} className={o && correct.includes(o) ? 'is-ok' : ''}>
              <input type={q.type === 'single_choice' ? 'radio' : 'checkbox'} name="room-edit-ok" checked={!!o && correct.includes(o)} aria-label={`Phương án ${L[idx]} là đáp án đúng`}
                onChange={(e) => setKey({ correct: q.type === 'single_choice' ? o : e.target.checked ? [...correct, o] : correct.filter((c) => c !== o) })} />
              <b>{L[idx]}.</b>
              <input value={o} onChange={(e) => setOption(idx, e.target.value)} aria-label={`Phương án ${L[idx]}`} />
              {q.options.length > 2 && <button type="button" className="mini-btn" onClick={() => removeOption(idx)} aria-label={`Bỏ phương án ${L[idx]}`}>×</button>}
            </label>
          ))}
          {q.options.length < 6 && <button type="button" className="mini-btn" onClick={() => setQ({ ...q, options: [...q.options, ''] })}>+ Phương án</button>}
        </div>
      )}

      {q.type === 'true_false' && (
        <div className="room-edit-tf">Đáp án: {(['Đúng', 'Sai'] as const).map((v) => <label key={v}><input type="radio" name="room-edit-tf" checked={k.correct === v} onChange={() => setKey({ correct: v })} /> {v}</label>)}</div>
      )}

      {q.type === 'fill_blank' && (
        <label className="adm-field"><span>Đáp án được chấp nhận <small>(nhiều cách viết, cách nhau bằng dấu ;)</small></span>
          <input value={((k.accepted as string[]) ?? []).join('; ')} onChange={(e) => setKey({ accepted: e.target.value.split(';').map((x) => x.trim()).filter(Boolean) })} />
        </label>
      )}

      {q.type === 'fill_blanks' && (
        <div className="room-edit-blanks">
          <span className="room-edit-hint">Dòng điền — <code>{'{}'}</code> là chỗ trống</span>
          {(q.blanks ?? []).map((b, j) => (
            <input key={j} value={b} aria-label={`Dòng điền ${j + 1}`} onChange={(e) => setQ({ ...q, blanks: (q.blanks ?? []).map((x, m) => (m === j ? e.target.value : x)) })} />
          ))}
          <span className="room-edit-hint">Đáp án từng chỗ trống</span>
          <div className="room-edit-row">
            {Array.from({ length: holes }, (_, j) => (
              <input key={j} value={fbAns[j] ?? ''} aria-label={`Đáp án chỗ trống ${j + 1}`} onChange={(e) => { const a = Array.from({ length: holes }, (_, m) => (m === j ? e.target.value : fbAns[m] ?? '')); setKey({ answers: [a] }); }} />
            ))}
          </div>
        </div>
      )}

      {q.type === 'true_false_table' && (
        <div className="room-edit-blanks">
          {(q.statements ?? []).map((st, j) => {
            const truth = (k.truth as string[]) ?? [];
            return (
              <div key={j} className="room-edit-row">
                <input value={st} aria-label={`Ý ${j + 1}`} onChange={(e) => setQ({ ...q, statements: (q.statements ?? []).map((x, m) => (m === j ? e.target.value : x)) })} />
                {(['Đúng', 'Sai'] as const).map((v) => (
                  <label key={v}><input type="radio" name={`room-edit-tft-${j}`} checked={truth[j] === v} onChange={() => setKey({ truth: (q.statements ?? []).map((_, m) => (m === j ? v : truth[m] ?? 'Đúng')) })} /> {v === 'Đúng' ? 'Đ' : 'S'}</label>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {['ordering', 'matching', 'pair_grid', 'grouping'].includes(q.type) && (
        <p className="dash-muted">Dạng câu này cô sửa được lời đề và lời giải. Muốn đổi các mục để sắp xếp / nối / xếp hộp, bấm “Đổi câu”.</p>
      )}

      <label className="adm-field"><span>Lời giải / nhận xét (em xem sau khi phòng đóng)</span>
        <textarea rows={2} value={q.explanation ?? ''} onChange={(e) => setQ({ ...q, explanation: e.target.value })} />
      </label>
      {problem && <p className="room-warn"><TriangleAlert aria-hidden="true" /> {problem}</p>}
      <div className="room-edit-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onSave({ ...q, prompt: q.prompt.trim() })} disabled={!!problem}>Xong</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Huỷ</button>
      </div>
    </div>
  );
}
